import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

     
    const userId = (session.user as any).id;

    const listings = await db.listing.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        user: true,
        _count: {
          select: { comments: true, favorites: true },
        },
      },
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
