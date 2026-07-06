import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export async function getSession(req: NextRequest) {
  const token = req.cookies.get("ghee-hisaab-session")?.value;
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true }
  });
  
  if (!user) return null;
  
  return { user: { id: user.id, email: user.email } };
}
