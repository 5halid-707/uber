import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/users/me?userId=xxx
// Returns user profile including isBlocked, blockReason
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
        email: true,
        phone: true,
        city: true,
        region: true,
        avatar: true,
        isVerified: true,
        isAdmin: true,
        isDriver: true,
        isBlocked: true,
        blockReason: true,
        blockedAt: true,
        walletBalance: true,
        rating: true,
        tripsCount: true,
        currentLat: true,
        currentLng: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Also fetch driver info if applicable
    type DriverInfo = {
      id: string;
      carModel: string;
      carPlate: string;
      carColor: string;
      carYear: number | null;
      isOnline: boolean;
      isApproved: boolean;
      approvalStatus: string;
      rating: number;
      tripsCount: number;
      earnings: number;
    };
    let driver: DriverInfo | null = null;
    if (user.isDriver) {
      const found = await db.driver.findUnique({
        where: { userId },
        select: {
          id: true,
          carModel: true,
          carPlate: true,
          carColor: true,
          carYear: true,
          isOnline: true,
          isApproved: true,
          approvalStatus: true,
          rating: true,
          tripsCount: true,
          earnings: true,
        },
      });
      driver = found as DriverInfo | null;
    }

    return NextResponse.json({ user, driver });
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الملف الشخصي" }, { status: 500 });
  }
}
