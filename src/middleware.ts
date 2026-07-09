import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const PUBLIC_API_ROUTES = ["/api/auth/login","/api/auth/register","/api/auth/google","/api/services","/api/cities","/api/maps/geocode"];
const ADMIN_API_ROUTES = ["/api/admin/"];
const DRIVER_API_ROUTES = ["/api/drivers/approve","/api/drivers/location"];
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-preview-only-not-for-production-12345";
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) { rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); return true; }
  if (record.count >= 100) return false;
  record.count++;
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/")) return NextResponse.next();
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) return NextResponse.json({ error: "تجاوزت الحد المسموح" }, { status: 429 });
  if (PUBLIC_API_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) return NextResponse.next();
  const authHeader = req.headers.get("authorization");
  let token: string | null = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.headers.get("x-auth-token") || new URL(req.url).searchParams.get("token");
  if (ADMIN_API_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    try { const p = jwt.verify(token, JWT_SECRET) as { isAdmin: boolean }; if (!p.isAdmin) return NextResponse.json({ error: "يتطلب صلاحيات إدارية" }, { status: 403 }); } catch { return NextResponse.json({ error: "جلسة منتهية" }, { status: 401 }); }
  }
  if (DRIVER_API_ROUTES.some((r) => pathname.startsWith(r))) { if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 }); try { jwt.verify(token, JWT_SECRET); } catch { return NextResponse.json({ error: "جلسة منتهية" }, { status: 401 }); } }
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export const config = { matcher: ["/api/:path*"] };
