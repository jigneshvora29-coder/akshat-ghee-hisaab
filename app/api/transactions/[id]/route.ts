import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTransactionSchema } from "@/lib/validations";
import { z } from "zod";



// GET /api/transactions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: { include: { item: true } },
    },
  });

  if (!transaction || (transaction as any).isArchived) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({ data: transaction });
}

// PATCH /api/transactions/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateTransactionSchema.partial().parse(body);

    const existing = await (prisma.transaction as any).findUnique({
      where: { id, isDeleted: false, isArchived: false },
    });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Recalculate running balances if amount/type/date changed
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          ...(data.type && { type: data.type }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.description && { description: data.description }),
          ...(data.notes !== undefined && { notes: data.notes || null }),
          ...(data.referenceNumber !== undefined && {
            referenceNumber: data.referenceNumber || null,
          }),
          ...(data.date && { date: new Date(data.date) }),
          ...(data.items !== undefined && {
            items: {
              deleteMany: {},
              create: data.items.map((i: any) => ({
                itemId: i.itemId,
                quantity: i.quantity,
                unit: i.unit,
                rate: i.rate,
                total: i.total
              }))
            }
          })
        },
      });

      // Recalculate all balances for this customer from scratch
      const allTxns = await tx.transaction.findMany({
        where: { customerId: existing.customerId, isDeleted: false },
        orderBy: { date: "asc" },
      });

      const customer = await tx.customer.findUnique({
        where: { id: existing.customerId },
      });
      if (!customer) throw new Error("Customer not found");

      let balance = Number(customer.openingBalance);
      for (const txn of allTxns) {
        if (txn.type === "SALE") balance += Number(txn.amount);
        else if (txn.type === "PAYMENT") balance -= Number(txn.amount);
        else balance += Number(txn.amount);

        await tx.transaction.update({
          where: { id: txn.id },
          data: { runningBalance: balance },
        });
      }

      await tx.customer.update({
        where: { id: existing.customerId },
        data: { currentBalance: balance },
      });

      return updated;
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "Transaction",
        entityId: id,
        oldData: existing as any,
        newData: result as any,
      },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

// DELETE /api/transactions/[id] — soft delete + recalculate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const restore = url.searchParams.get("restore") === "true";
  const archive = url.searchParams.get("archive") === "true";

  const existing = await (prisma.transaction as any).findUnique({ where: { id } });
  if (!existing || existing.isArchived) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (archive) {
    await (prisma.transaction as any).update({
      where: { id },
      data: { isArchived: true },
    });

    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "ARCHIVE", entity: "Transaction", entityId: id },
    });

    return NextResponse.json({ message: "Transaction permanently deleted" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id },
      data: { isDeleted: !restore, deletedAt: restore ? null : new Date() },
    });

    // Recalculate customer balance
    const activeTxns = await (tx.transaction as any).findMany({
      where: { customerId: existing.customerId, isDeleted: false, isArchived: false },
      orderBy: { date: "asc" },
    });

    const customer = await tx.customer.findUnique({ where: { id: existing.customerId } });
    if (!customer) return;

    let balance = Number(customer.openingBalance);
    for (const txn of activeTxns) {
      if (txn.type === "SALE") balance += Number(txn.amount);
      else if (txn.type === "PAYMENT") balance -= Number(txn.amount);
      else balance += Number(txn.amount);
      await tx.transaction.update({ where: { id: txn.id }, data: { runningBalance: balance } });
    }

    await tx.customer.update({
      where: { id: existing.customerId },
      data: { currentBalance: balance },
    });
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: restore ? "RESTORE" : "DELETE",
      entity: "Transaction",
      entityId: id,
    },
  });

  return NextResponse.json({
    message: restore ? "Transaction restored" : "Transaction deleted",
  });
}
