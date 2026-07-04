import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET user's favorites
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

     
    const userId = (session.user as any).id;

    const favorites = await db.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            category: true,
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      favorites: favorites.map((f) => f.listing),
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

// POST toggle favorite
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

     
    const userId = (session.user as any).id;
    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: "listingId مطلوب" }, { status: 400 });
    }

    // Check if already favorited
    const existing = await db.favorite.findFirst({
      where: { userId, listingId },
    });

    if (existing) {
      // Remove
      await db.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    } else {
      // Add
      await db.favorite.create({
        data: { userId, listingId },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 });
  }
}
