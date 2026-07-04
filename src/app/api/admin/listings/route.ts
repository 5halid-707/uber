import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const featured = searchParams.get("featured");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (featured === "true") where.isFeatured = true;

  const listings = await db.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          phone: true,
          isVerified: true,
        },
      },
      category: { select: { name: true, slug: true } },
      _count: {
        select: { comments: true, favorites: true },
      },
    },
  });

  return NextResponse.json({ listings });
}
