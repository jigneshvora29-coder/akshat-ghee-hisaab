import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCustomerSchema, updateCustomerSchema } from "@/lib/validations";
import { z } from "zod";

async function getAuthSession(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return null;
  return session;
}
export const dynamic = "force-dynamic";

// GET /api/customers
export async function GET(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20"));
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "all";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortDir = searchParams.get("sortDir") || "desc";

  const where: Record<string, unknown> = { isArchived: false };

  // Filter
  switch (filter) {
    case "pending":
      where.currentBalance = { gt: 0 };
      where.isDeleted = false;
      break;
    case "paid":
      where.currentBalance = { lte: 0 };
      where.isDeleted = false;
      break;
    case "pinned":
      where.isPinned = true;
      where.isDeleted = false;
      break;
    case "favorites":
      where.isFavorite = true;
      where.isDeleted = false;
      break;
    case "deleted":
      where.isDeleted = true;
      break;
    default:
      where.isDeleted = false;
  }

  // Search
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { village: { contains: search, mode: "insensitive" } },
    ];
  }

  const validSortFields = ["name", "currentBalance", "createdAt", "updatedAt"];
  const orderBy: Record<string, string> = {
    [validSortFields.includes(sortBy) ? sortBy : "createdAt"]:
      sortDir === "asc" ? "asc" : "desc",
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { transactions: { where: { isDeleted: false } } } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({
    data: customers,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

// POST /api/customers
export async function POST(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createCustomerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        village: data.village || null,
        notes: data.notes || null,
        openingBalance: data.openingBalance,
        currentBalance: data.openingBalance,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Customer",
        entityId: customer.id,
        newData: customer as any,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
