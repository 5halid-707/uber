import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_API_ROUTES = ["/api/auth/login","/api/auth/register","/api/auth/google","/api/services","/api/cities","/api/maps/geocode"];
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
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
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export const config = { matcher: ["/api/:path*"] };
