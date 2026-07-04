import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  startOfDay, endOfDay, startOfWeek,
  startOfMonth, subMonths, subYears,
} from "date-fns";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/reports?period=monthly&startDate=&endDate=&customerId=
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const period = searchParams.get("period") || "monthly";
  const customerId = searchParams.get("customerId");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const today = new Date();
  let startDate: Date;
  let endDate: Date;

  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    endDate = new Date(endDateParam);
  } else {
    switch (period) {
      case "1d":
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case "1w":
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfDay(today);
        break;
      case "thisMonth":
        startDate = startOfMonth(today);
        endDate = endOfDay(today);
        break;
      case "1m":
        startDate = subMonths(today, 1);
        endDate = today;
        break;
      case "3m":
        startDate = subMonths(today, 3);
        endDate = today;
        break;
      case "6m":
        startDate = subMonths(today, 6);
        endDate = today;
        break;
      case "1y":
        startDate = subYears(today, 1);
        endDate = today;
        break;
      case "all":
        startDate = new Date(0);
        endDate = today;
        break;
      default:
        startDate = subMonths(today, 1);
        endDate = today;
    }
  }

  const where: any = {
    isDeleted: false,
    isArchived: false,
    date: { gte: startDate, lte: endDate },
    ...(customerId && { customerId }),
  };

  const [
    salesAgg,
    paymentsAgg,
    transactions,
    customerAggregates,
    customersList,
    totalOutstandingAgg,
  ] = await Promise.all([
    (prisma.transaction as any).aggregate({
      _sum: { amount: true },
      _count: true,
      where: { ...where, type: "SALE" },
    }),
    (prisma.transaction as any).aggregate({
      _sum: { amount: true },
      _count: true,
      where: { ...where, type: "PAYMENT" },
    }),
    (prisma.transaction as any).findMany({
      where,
      orderBy: { date: "desc" },
      include: { customer: { select: { id: true, name: true, phone: true } } },
      take: 50,
    }),
    // Group transactions by customer and type for efficient aggregation
    (prisma.transaction as any).groupBy({
      by: ["customerId", "type"],
      _sum: { amount: true },
      _count: true,
      where: { isDeleted: false, isArchived: false, date: { gte: startDate, lte: endDate } },
    }),
    // Fetch only needed customer details
    (prisma.customer as any).findMany({
      where: { isDeleted: false, isArchived: false },
      select: { id: true, name: true, phone: true, currentBalance: true },
    }),
    (prisma.customer as any).aggregate({
      _sum: { currentBalance: true },
      where: { isDeleted: false, isArchived: false, currentBalance: { gt: 0 } },
    }),
  ]);

  // Map grouped aggregates to customer summaries
  const summaryMap = new Map<string, { sales: number; payments: number; count: number }>();
  for (const group of customerAggregates) {
    const existing = summaryMap.get(group.customerId) || { sales: 0, payments: 0, count: 0 };
    if (group.type === "SALE") {
      existing.sales += Number(group._sum.amount || 0);
    } else if (group.type === "PAYMENT") {
      existing.payments += Number(group._sum.amount || 0);
    }
    existing.count += group._count;
    summaryMap.set(group.customerId, existing);
  }

  const customerSummary = customersList
    .filter((c: any) => summaryMap.has(c.id))
    .map((c: any) => {
      const stats = summaryMap.get(c.id)!;
      return {
        customer: {
          id: c.id,
          name: c.name,
          phone: c.phone,
          currentBalance: Number(c.currentBalance),
        },
        totalSales: stats.sales,
        totalPayments: stats.payments,
        balance: stats.sales - stats.payments,
        transactionCount: stats.count,
      };
    })
    .sort((a: any, b: any) => b.balance - a.balance);

  // Outstanding customers (all time)
  const outstandingCustomers = await prisma.customer.findMany({
    where: { isDeleted: false, currentBalance: { gt: 0 } },
    orderBy: { currentBalance: "desc" },
    take: 50,
    select: {
      id: true, name: true, phone: true, village: true, currentBalance: true,
    },
  });

  const globalOutstanding = Number(totalOutstandingAgg?._sum?.currentBalance || 0);

  return NextResponse.json({
    data: {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalSales: Number(salesAgg._sum.amount || 0),
      totalPayments: Number(paymentsAgg._sum.amount || 0),
      outstanding: globalOutstanding,
      salesCount: salesAgg._count,
      paymentsCount: paymentsAgg._count,
      transactions,
      customerSummary,
      outstandingCustomers,
    },
  });
}
