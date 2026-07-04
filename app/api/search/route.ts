import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";



// GET /api/search?q=query&limit=8
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";
  const limit = Math.min(10, parseInt(searchParams.get("limit") || "8"));

  if (!q || q.length < 2) return NextResponse.json([]);

  const [customers, transactions] = await Promise.all([
    prisma.customer.findMany({
      where: {
        isDeleted: false,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { village: { contains: q, mode: "insensitive" } },
        ],
      },
      take: Math.ceil(limit / 2),
      select: { id: true, name: true, phone: true, village: true, currentBalance: true },
    }),
    prisma.transaction.findMany({
      where: {
        isDeleted: false,
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { referenceNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      take: Math.floor(limit / 2),
      include: { customer: { select: { name: true } } },
    }),
  ]);

  const results = [
    ...customers.map((c) => ({
      type: "customer" as const,
      id: c.id,
      title: c.name,
      subtitle: [c.phone, c.village].filter(Boolean).join(" · "),
      href: `/customers/${c.id}`,
      amount: Number(c.currentBalance),
    })),
    ...transactions.map((t) => ({
      type: "transaction" as const,
      id: t.id,
      title: t.description,
      subtitle: `${t.customer.name} · ${t.referenceNumber || ""}`,
      href: `/customers/${t.customerId}`,
      amount: Number(t.amount),
    })),
  ];

  return NextResponse.json(results);
}
