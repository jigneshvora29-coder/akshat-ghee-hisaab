import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [customers, items, transactions, settings] = await Promise.all([
      prisma.customer.findMany({ include: { transactions: true } }),
      prisma.item.findMany(),
      prisma.transaction.findMany(),
      prisma.businessSettings.findFirst()
    ]);

    const backupData = {
      exportDate: new Date().toISOString(),
      businessSettings: settings,
      customers,
      items,
      transactions,
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Disposition": `attachment; filename="akshat-ghee-backup-${new Date().toISOString().split("T")[0]}.json"`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
