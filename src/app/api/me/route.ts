import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ user: null });
    }

     
    const userId = (session.user as any).id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        phone: true,
        email: true,
        city: true,
        avatar: true,
        isVerified: true,
        rating: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            favorites: true,
          },
        },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching me:", error);
    return NextResponse.json({ user: null });
  }
}
