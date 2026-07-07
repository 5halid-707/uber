import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Get user's coupons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });

    const coupons = await db.coupon.findMany({
      where: { appliedToId: userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(coupons);
  } catch (error) {
    return NextResponse.json({ error: "خطأ" }, { status: 500 });
  }
}

// POST: Apply coupon to user's account (admin or auto)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body;

    if (!code || !userId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

    const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) return NextResponse.json({ error: "كود الخصم غير موجود" }, { status: 404 });
    if (!coupon.isActive) return NextResponse.json({ error: "الكوبون غير فعال" }, { status: 400 });
    if (coupon.usesCount >= coupon.maxUses) return NextResponse.json({ error: "تم استخدام الكوبون بالكامل" }, { status: 400 });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return NextResponse.json({ error: "انتهت صلاحية الكوبون" }, { status: 400 });

    // Apply coupon to user
    await db.coupon.update({
      where: { id: coupon.id },
      data: { usesCount: { increment: 1 }, appliedToId: userId },
    });

    // Notify user
    await db.notification.create({
      data: {
        userId,
        title: "🎉 تم تفعيل كوبون خصم!",
        message: `تم تفعيل كوبون "${coupon.code}" - ${coupon.type === "percentage" ? `${coupon.value}%` : `${coupon.value} ر.س`} خصم على رحلتك القادمة`,
        type: "promo",
      },
    });

    return NextResponse.json({ success: true, coupon, message: "تم تفعيل الكوبون بنجاح" });
  } catch (error) {
    console.error("Coupon apply error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
