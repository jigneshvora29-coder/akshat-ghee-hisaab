import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const expiresIn = rememberMe ? "7d" : "12h";
    const token = await signToken({ userId: user.id, email: user.email }, expiresIn);

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    
    const cookieOptions: any = {
      name: "ghee-hisaab-session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };

    if (rememberMe) {
      cookieOptions.maxAge = 60 * 60 * 24 * 7; // 7 days
    } else {
      // Browsers often keep session cookies alive if "Continue where you left off" is enabled.
      // To strictly enforce non-remember-me behavior, we set a 12-hour absolute expiration.
      cookieOptions.maxAge = 60 * 60 * 12; // 12 hours
    }

    response.cookies.set(cookieOptions);

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
