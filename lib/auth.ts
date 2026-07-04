import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function getSession(req: NextRequest) {
  const token = req.cookies.get("ghee-hisaab-session")?.value;
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  
  return { user: { id: payload.userId, email: payload.email } };
}
