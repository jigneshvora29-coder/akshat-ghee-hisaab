import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ghee-hisaab-session")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.password) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
