import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  defaultQuantity: z.number().min(0.01).optional(),
  defaultUnit: z.string().min(1).optional(),
  defaultPrice: z.number().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateItemSchema.parse(body);

    const existing = await (prisma as any).item.findUnique({
      where: { id },
    });

    if (!existing || existing.isArchived) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (data.name) {
      const nameCheck = await (prisma as any).item.findFirst({
        where: { name: { equals: data.name, mode: "insensitive" }, id: { not: id } },
      });
      if (nameCheck) {
        return NextResponse.json({ error: "An item with this name already exists" }, { status: 400 });
      }
    }

    const item = await (prisma as any).item.update({
      where: { id },
      data,
    });

    await (prisma as any).auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "Item",
        entityId: id,
        oldData: JSON.stringify(existing),
        newData: JSON.stringify(item),
      },
    });

    return NextResponse.json({ data: item, message: "Item updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

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

  const existing = await (prisma as any).item.findUnique({ where: { id } });
  if (!existing || existing.isArchived) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (archive) {
    await (prisma as any).item.update({
      where: { id },
      data: { isArchived: true },
    });
    
    await (prisma as any).auditLog.create({
      data: { userId: session.user.id, action: "ARCHIVE", entity: "Item", entityId: id },
    });

    return NextResponse.json({ message: "Item permanently deleted" });
  }

  await (prisma as any).item.update({
    where: { id },
    data: { isDeleted: !restore },
  });

  await (prisma as any).auditLog.create({
    data: {
      userId: session.user.id,
      action: restore ? "RESTORE" : "DELETE",
      entity: "Item",
      entityId: id,
    },
  });

  return NextResponse.json({
    message: restore ? "Item restored" : "Item deleted",
  });
}
