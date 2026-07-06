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

  // Run queries in parallel for better performance
  const [
    todaySalesResult,
    todayPaymentsResult,
    totalCustomers,
    totalTransactions,
    outstandingResult,
    recentTransactions,
    pendingCustomers
  ] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "SALE", isDeleted: false, date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "PAYMENT", isDeleted: false, date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.customer.count({ where: { isDeleted: false } }),
    prisma.transaction.count({ where: { isDeleted: false } }),
    prisma.customer.aggregate({
      _sum: { currentBalance: true },
      where: { isDeleted: false, currentBalance: { gt: 0 } },
    }),
    prisma.transaction.findMany({
      where: { isDeleted: false },
      orderBy: { date: "desc" },
      take: 10,
      include: { customer: { select: { id: true, name: true } } },
    }),
    prisma.customer.findMany({
      where: { isDeleted: false, currentBalance: { gt: 0 } },
      orderBy: { currentBalance: "desc" },
      take: 5,
    })
  ]);

  // Aggregate monthly data in memory using a single query
  const sixMonthsAgo = startOfMonth(subMonths(today, 5));
  const recentTxns = await prisma.transaction.findMany({
    where: { isDeleted: false, date: { gte: sixMonthsAgo } },
    select: { type: true, amount: true, date: true }
  });

  const monthlyData = [];
  for (let i = 0; i < 6; i++) {
    const d = subMonths(today, 5 - i);
    const mStart = startOfMonth(d);
    const mEnd = endOfMonth(d);
    
    let mSales = 0;
    let mPayments = 0;
    
    // Filter from the in-memory array
    for (const txn of recentTxns) {
      if (txn.date >= mStart && txn.date <= mEnd) {
        if (txn.type === "SALE") mSales += Number(txn.amount);
        if (txn.type === "PAYMENT") mPayments += Number(txn.amount);
      }
    }

    monthlyData.push({
      month: format(d, "MMM yyyy"),
      sales: mSales,
      payments: mPayments,
      outstanding: mSales - mPayments,
    });
  }

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
