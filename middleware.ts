import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const key = ip;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) rateLimitStore.delete(key);
  }
}, 10 * 60 * 1000);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get client IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Rate limit auth endpoints (5 requests per minute)
  if (pathname.startsWith("/api/auth")) {
    const { allowed, retryAfter } = rateLimit(ip + ":auth", 20, 60 * 1000);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
    }
  }

  // Rate limit API routes (100 requests per minute)
  if (pathname.startsWith("/api/")) {
    const { allowed, retryAfter } = rateLimit(ip + ":api", 100, 60 * 1000);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
    }
  }

  // Public routes that don't need auth
  const publicRoutes = ["/login", "/forgot-password", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Check authentication for dashboard routes
  if (!isPublicRoute && pathname !== "/") {
    const token = request.cookies.get("ghee-hisaab-session")?.value;
    let isAuthenticated = false;
    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.userId) {
        isAuthenticated = true;
      }
    }
    
    if (!isAuthenticated) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from login
  if (pathname === "/login" || pathname === "/") {
    const token = request.cookies.get("ghee-hisaab-session")?.value;
    let isAuthenticated = false;
    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.userId) {
        isAuthenticated = true;
      }
    }

    if (isAuthenticated && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (isAuthenticated && pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (!isAuthenticated && pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Build response with security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for some libs
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
