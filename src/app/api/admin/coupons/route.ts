import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = verifyAdmin(request);
    if (!user) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(coupons);
  } catch (error) {
    return NextResponse.json({ error: "خطأ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user: adminUser, error: authError } = verifyAdmin(request);
    if (!adminUser) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { code, type, value, minTripPrice, maxUses, expiresAt, appliedToId } = body;

    if (!code || !value) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

    const existing = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) return NextResponse.json({ error: "الكود موجود مسبقاً" }, { status: 400 });

    const coupon = await db.coupon.create({
      data: {
        code: code.toUpperCase(),
        type: type || "fixed",
        value: parseFloat(value),
        minTripPrice: parseFloat(minTripPrice) || 0,
        maxUses: parseInt(maxUses) || 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: adminUser.userId,
        appliedToId: appliedToId || null,
      },
    });

    // If appliedToId is set, notify the user
    if (appliedToId) {
      await db.notification.create({
        data: {
          userId: appliedToId,
          title: "🎉 كوبون خصم جديد!",
          message: `تم إضافة كوبون "${coupon.code}" لحسابك - ${coupon.type === "percentage" ? `${coupon.value}%` : `${coupon.value} ر.س`} خصم`,
          type: "promo",
        },
      });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
