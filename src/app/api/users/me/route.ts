import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyAuth, signToken } from "@/lib/auth";

// GET /api/users/me?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true, city: true, region: true,
        avatar: true, isVerified: true, isAdmin: true, isDriver: true,
        isBlocked: true, blockReason: true, blockedAt: true, walletBalance: true,
        rating: true, tripsCount: true, currentLat: true, currentLng: true,
        createdAt: true, updatedAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

    type DriverInfo = { id: string; carModel: string; carPlate: string; carColor: string; carYear: number | null; isOnline: boolean; isApproved: boolean; approvalStatus: string; rating: number; tripsCount: number; earnings: number; };
    let driver: DriverInfo | null = null;
    if (user.isDriver) {
      const found = await db.driver.findUnique({ where: { userId }, select: { id: true, carModel: true, carPlate: true, carColor: true, carYear: true, isOnline: true, isApproved: true, approvalStatus: true, rating: true, tripsCount: true, earnings: true } });
      driver = found as DriverInfo | null;
    }

    return NextResponse.json({ user, driver });
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الملف الشخصي" }, { status: 500 });
  }
}

// PATCH /api/users/me
export async function PATCH(request: NextRequest) {
  try {
    const authResult = verifyAuth(request);
    if (!authResult.user) {
      console.error("PATCH verifyAuth failed:", authResult.error);
      return NextResponse.json({ error: authResult.error || "غير مصرح" }, { status: 401 });
    }
    const authUser = authResult.user;

    const body = await request.json();
    const { name, email, phone, city, region, avatar, currentPassword, newPassword } = body;

    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: "كلمة المرور الحالية مطلوبة لتغيير كلمة المرور" }, { status: 400 });
      const userRecord = await db.user.findUnique({ where: { id: authUser.userId } });
      if (!userRecord) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
      const valid = await bcrypt.compare(currentPassword, userRecord.password);
      if (!valid) return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (typeof email === "string" && email.trim()) updateData.email = email.trim();
    if (typeof phone === "string" && phone.trim()) updateData.phone = phone.trim();
    if (city !== undefined) updateData.city = city || null;
    if (region !== undefined) updateData.region = region || null;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 12);

    if (Object.keys(updateData).length > 0) {
      await db.user.update({ where: { id: authUser.userId }, data: updateData });
    }

    const updated = await db.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, name: true, email: true, phone: true, city: true, region: true, avatar: true, isAdmin: true, isDriver: true, isVerified: true, walletBalance: true, rating: true, tripsCount: true },
    });
    if (!updated) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

    const newToken = signToken({ userId: updated.id, email: updated.email, isAdmin: updated.isAdmin, isDriver: updated.isDriver });

    return NextResponse.json({ user: updated, token: newToken });
  } catch (error) {
    console.error("PATCH /api/users/me error:", error);
    const msg = error instanceof Error ? error.message : "حدث خطأ أثناء تحديث الملف الشخصي";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
