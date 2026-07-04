import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const where = search
    ? {
        OR: [
          { username: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {};

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      phone: true,
      email: true,
      city: true,
      isVerified: true,
      isAdmin: true,
      rating: true,
      createdAt: true,
      _count: {
        select: {
          listings: true,
          favorites: true,
          comments: true,
        },
      },
    },
  });

  return NextResponse.json({ users });
}
