import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCustomerSchema } from "@/lib/validations";
import { z } from "zod";



// GET /api/customers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const customer = await (prisma.customer as any).findUnique({
    where: { id },
    include: {
      transactions: {
        where: { isDeleted: false, isArchived: false },
        orderBy: { date: "asc" },
        include: {
          items: {
            select: {
              id: true,
              itemId: true,
              quantity: true,
              rate: true,
              total: true,
              unit: true,
              item: { select: { id: true, name: true, defaultUnit: true } },
            },
          },
        },
      },
      _count: {
        select: { transactions: { where: { isDeleted: false } } },
      },
    },
  });

  if (!customer || customer.isArchived) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ data: customer });
}

// PATCH /api/customers/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateCustomerSchema.partial().parse(body);

    const existing = await (prisma.customer as any).findUnique({ where: { id } });
    if (!existing || existing.isArchived) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.village !== undefined && { village: data.village || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
        ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "Customer",
        entityId: id,
        oldData: existing as any,
        newData: customer as any,
      },
    });

    return NextResponse.json({ data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Update customer error:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

// DELETE /api/customers/[id] — soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const restore = url.searchParams.get("restore") === "true";
  const archive = url.searchParams.get("archive") === "true";

  if (archive) {
    const customer = await (prisma.customer as any).update({
      where: { id },
      data: { isArchived: true },
    });
    // Archive all transactions for this customer
    await (prisma.transaction as any).updateMany({
      where: { customerId: id },
      data: { isArchived: true },
    });

    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "ARCHIVE", entity: "Customer", entityId: id },
    });

    return NextResponse.json({ data: customer, message: "Customer permanently deleted" });
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      isDeleted: !restore,
      deletedAt: restore ? null : new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: restore ? "RESTORE" : "DELETE",
      entity: "Customer",
      entityId: id,
    },
  });

  return NextResponse.json({
    data: customer,
    message: restore ? "Customer restored" : "Customer deleted",
  });
}
