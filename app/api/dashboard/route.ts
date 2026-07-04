import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns";

export const dynamic = "force-dynamic";

// GET /api/dashboard
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [
    todaySalesResult,
    todayPaymentsResult,
    totalCustomers,
    totalTransactions,
    outstandingResult,
    recentTransactions,
    pendingCustomers,
  ] = await Promise.all([
    // Today's sales total
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "SALE",
        isDeleted: false,
        date: { gte: todayStart, lte: todayEnd },
      },
    }),
    // Today's payments total
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "PAYMENT",
        isDeleted: false,
        date: { gte: todayStart, lte: todayEnd },
      },
    }),
    // Total active customers
    prisma.customer.count({ where: { isDeleted: false } }),
    // Total transactions
    prisma.transaction.count({ where: { isDeleted: false } }),
    // Outstanding (sum of positive balances)
    prisma.customer.aggregate({
      _sum: { currentBalance: true },
      where: { isDeleted: false, currentBalance: { gt: 0 } },
    }),
    // Recent transactions
    prisma.transaction.findMany({
      where: { isDeleted: false },
      orderBy: { date: "desc" },
      take: 10,
      include: { customer: { select: { id: true, name: true } } },
    }),
    // Top pending customers
    prisma.customer.findMany({
      where: { isDeleted: false, currentBalance: { gt: 0 } },
      orderBy: { currentBalance: "desc" },
      take: 5,
    }),
  ]);

  // Monthly data for last 6 months
  const monthlyData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(today, 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      return Promise.all([
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: "SALE", isDeleted: false, date: { gte: start, lte: end } },
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: "PAYMENT", isDeleted: false, date: { gte: start, lte: end } },
        }),
      ]).then(([sales, payments]) => ({
        month: format(date, "MMM yyyy"),
        sales: Number(sales._sum.amount || 0),
        payments: Number(payments._sum.amount || 0),
        outstanding: Number(sales._sum.amount || 0) - Number(payments._sum.amount || 0),
      }));
    })
  );

  return NextResponse.json({
    data: {
      todaySales: Number(todaySalesResult._sum.amount || 0),
      todayPayments: Number(todayPaymentsResult._sum.amount || 0),
      outstandingAmount: Number(outstandingResult._sum.currentBalance || 0),
      totalCustomers,
      totalTransactions,
      monthlyData,
      recentTransactions,
      pendingCustomers,
    },
  });
}
