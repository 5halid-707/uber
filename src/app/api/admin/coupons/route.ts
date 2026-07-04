import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { redemptions: true } },
    },
  });

  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const body = await request.json();
  const { code, description, type, value, maxRedemptions, minAmount, maxDiscount, validUntil, appliesTo } = body;

  if (!code?.trim() || !type || !value) {
    return NextResponse.json(
      { error: "الكود والنوع والقيمة مطلوبة" },
      { status: 400 }
    );
  }

  // Check uniqueness
  const existing = await db.coupon.findFirst({ where: { code: code.trim().toUpperCase() } });
  if (existing) {
    return NextResponse.json(
      { error: "كود الكوبون موجود مسبقاً" },
      { status: 409 }
    );
  }

  const coupon = await db.coupon.create({
    data: {
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
      type, // percentage or fixed
      value: parseFloat(value),
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
      minAmount: parseFloat(minAmount) || 0,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      appliesTo: appliesTo || "all",
      isActive: true,
    },
  });

  await logActivity({
    userId: admin.id,
    action: "coupon_create",
    description: `إنشاء كوبون ${coupon.code} (${coupon.type === "percentage" ? coupon.value + "%" : coupon.value + " ريال"})`,
    metadata: { couponId: coupon.id, code: coupon.code },
  });

  return NextResponse.json({ coupon });
}
