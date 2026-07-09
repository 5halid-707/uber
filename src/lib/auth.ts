import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const TOKEN_EXPIRY = "7d";
const JWT_SECRET = "8ee88588cf4eed1941e2049c716fd530";
export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  isDriver: boolean;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const xToken = req.headers.get("x-auth-token");
  if (xToken) return xToken;
  return null;
}

export function verifyAuth(req: NextRequest): { user: JwtPayload | null; error?: string } {
  const token = extractToken(req);
  if (!token) return { user: null, error: "غير مصرح" };
  const payload = verifyToken(token);
  if (!payload) return { user: null, error: "جلسة منتهية" };
  return { user: payload };
}

export function verifyAdmin(req: NextRequest): { user: JwtPayload | null; error?: string } {
  const { user, error } = verifyAuth(req);
  if (!user) return { user: null, error };
  if (!user.isAdmin) return { user: null, error: "يتطلب صلاحيات إدارية" };
  return { user };
}

export function verifyDriver(req: NextRequest): { user: JwtPayload | null; error?: string } {
  const { user, error } = verifyAuth(req);
  if (!user) return { user: null, error };
  if (!user.isDriver && !user.isAdmin) return { user: null, error: "يتطلب حساب سائق" };
  return { user };
}