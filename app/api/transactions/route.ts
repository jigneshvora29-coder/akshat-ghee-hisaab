import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTransactionSchema } from "@/lib/validations";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/transactions
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20"));
  const customerId = searchParams.get("customerId");
  const type = searchParams.get("type");
  const status = searchParams.get("status") || "active";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search") || "";

  const where: any = {
    isArchived: false,
    ...(status === "active" ? { isDeleted: false } : status === "deleted" ? { isDeleted: true } : {}),
    ...(customerId && { customerId }),
    ...(type && type !== "all" && { type: type as "SALE" | "PAYMENT" | "ADJUSTMENT" }),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { referenceNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { notes: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { customer: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
      ],
    }),
  };

  const [transactions, total] = await Promise.all([
    (prisma.transaction as any).findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: { item: true }
        }
      },
    }),
    (prisma.transaction as any).count({ where }),
  ]);

  return NextResponse.json({
    data: transactions,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createTransactionSchema.parse(body);

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: data.customerId, isDeleted: false },
      });
      if (!customer) throw new Error("Customer not found");

      // Calculate running balance
      const lastTransaction = await tx.transaction.findFirst({
        where: { customerId: data.customerId, isDeleted: false },
        orderBy: { date: "desc" },
      });

      const lastBalance = lastTransaction
        ? Number(lastTransaction.runningBalance)
        : Number(customer.openingBalance);

      let runningBalance: number;
      if (data.type === "SALE") {
        runningBalance = lastBalance + data.amount;
      } else if (data.type === "PAYMENT") {
        runningBalance = lastBalance - data.amount;
      } else {
        // ADJUSTMENT — positive increases, negative decreases
        runningBalance = lastBalance + data.amount;
      }

      const transaction = await tx.transaction.create({
        data: {
          customerId: data.customerId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          notes: data.notes || null,
          referenceNumber: data.referenceNumber || null,
          date: new Date(data.date),
          runningBalance,
          createdById: session.user.id,
          items: data.items && data.items.length > 0 ? {
            create: data.items.map(item => ({
              itemId: item.itemId,
              quantity: item.quantity,
              unit: item.unit,
              rate: item.rate,
              total: item.total
            }))
          } : undefined
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { item: true } }
        },
      });

      // Update customer balance
      await tx.customer.update({
        where: { id: data.customerId },
        data: { currentBalance: runningBalance },
      });

      return transaction;
    }, {
      maxWait: 10000, // 10 seconds
      timeout: 20000, // 20 seconds
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Transaction",
        entityId: result.id,
        newData: result as any,
      },
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod Validation Error in POST /api/transactions:", JSON.stringify(error.issues, null, 2));
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Customer not found") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
