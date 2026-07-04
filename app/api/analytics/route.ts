import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  format, subMonths, subYears
} from "date-fns";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "1m";

  const today = new Date();
  let startDate: Date;
  let endDate: Date = endOfDay(today);

  switch (period) {
    case "1d":
      startDate = startOfDay(today);
      break;
    case "1w":
      startDate = startOfWeek(today, { weekStartsOn: 1 });
      break;
    case "thisMonth":
      startDate = startOfMonth(today);
      break;
    case "1m":
      startDate = subMonths(today, 1);
      break;
    case "3m":
      startDate = subMonths(today, 3);
      break;
    case "6m":
      startDate = subMonths(today, 6);
      break;
    case "1y":
      startDate = subYears(today, 1);
      break;
    case "all":
      startDate = new Date(0);
      break;
    default:
      startDate = subMonths(today, 1);
  }

  const timeSeriesRaw = await (prisma.transaction as any).findMany({
    where: { isDeleted: false, isArchived: false, date: { gte: startDate, lte: endDate } },
    select: { amount: true, date: true, type: true },
    orderBy: { date: "asc" },
  });

  // Fetch initial outstanding balance before the start date
  const initialSalesAgg = await (prisma.transaction as any).aggregate({
    _sum: { amount: true },
    where: { isDeleted: false, isArchived: false, type: "SALE", date: { lt: startDate } },
  });
  const initialPaymentsAgg = await (prisma.transaction as any).aggregate({
    _sum: { amount: true },
    where: { isDeleted: false, isArchived: false, type: "PAYMENT", date: { lt: startDate } },
  });
  let runningOutstanding = Number(initialSalesAgg._sum.amount || 0) - Number(initialPaymentsAgg._sum.amount || 0);

  const timeSeriesMap = new Map<string, { sales: number; payments: number; outstanding: number }>();

  for (const t of timeSeriesRaw) {
    let bucket: string;
    if (period === "1d") {
      bucket = format(new Date(t.date), "h a");
    } else if (["1w", "thisMonth", "1m"].includes(period)) {
      bucket = format(new Date(t.date), "MMM dd");
    } else if (period === "3m") {
      bucket = format(startOfWeek(new Date(t.date), { weekStartsOn: 1 }), "MMM dd");
    } else {
      bucket = format(new Date(t.date), "MMM yyyy");
    }

    const existing = timeSeriesMap.get(bucket) || { sales: 0, payments: 0, outstanding: 0 };
    if (t.type === "SALE") existing.sales += Number(t.amount);
    if (t.type === "PAYMENT") existing.payments += Number(t.amount);
    runningOutstanding += (t.type === "SALE" ? Number(t.amount) : t.type === "PAYMENT" ? -Number(t.amount) : 0);
    existing.outstanding = runningOutstanding;
    timeSeriesMap.set(bucket, existing);
  }

  const timeSeriesData = Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
    date,
    sales: data.sales,
    payments: data.payments,
    outstandingFlow: data.outstanding,
  }));

  return NextResponse.json({
    data: timeSeriesData
  });
}
