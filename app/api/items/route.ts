import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  defaultQuantity: z.number().min(0.01),
  defaultUnit: z.string().min(1),
  defaultPrice: z.number().min(0),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";

  const where: any = {
    isDeleted: false,
    isArchived: false,
    ...(search && { name: { contains: search, mode: "insensitive" } }),
  };

  const items = await (prisma as any).item.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: items });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createItemSchema.parse(body);

    const existing = await (prisma as any).item.findFirst({
      where: { name: { equals: data.name, mode: "insensitive" } },
    });

    if (existing) {
      if (existing.isDeleted || existing.isArchived) {
        // Restore it
        const restored = await (prisma as any).item.update({
          where: { id: existing.id },
          data: {
            isDeleted: false,
            isArchived: false,
            defaultQuantity: data.defaultQuantity,
            defaultUnit: data.defaultUnit,
            defaultPrice: data.defaultPrice,
          },
        });
        return NextResponse.json({ data: restored, message: "Item restored and updated successfully" });
      }
      return NextResponse.json({ error: "An item with this name already exists" }, { status: 400 });
    }

    const item = await (prisma as any).item.create({
      data: {
        name: data.name,
        defaultQuantity: data.defaultQuantity,
        defaultUnit: data.defaultUnit,
        defaultPrice: data.defaultPrice,
      },
    });

    await (prisma as any).auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Item",
        entityId: item.id,
        newData: JSON.stringify(item),
      },
    });

    return NextResponse.json({ data: item, message: "Item created successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
