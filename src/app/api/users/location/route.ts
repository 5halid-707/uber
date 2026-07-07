import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/users/location?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        currentLat: true,
        currentLng: true,
        rating: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/users/location error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب موقع المستخدم" }, { status: 500 });
  }
}

// POST /api/users/location
// Body: { userId, lat, lng }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, lat, lng } = body;

    if (!userId || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "userId, lat, lng مطلوبة (lat/lng أرقام)" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { currentLat: lat, currentLng: lng },
      select: { id: true, currentLat: true, currentLng: true, updatedAt: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("POST /api/users/location error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث موقع المستخدم" }, { status: 500 });
  }
}
