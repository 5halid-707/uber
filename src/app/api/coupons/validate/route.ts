import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// Validate a coupon code (for users)
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json();
  const { code, amount, purpose } = body;

  if (!code) {
    return NextResponse.json({ error: "الكود مطلوب" }, { status: 400 });
  }

  const coupon = await db.coupon.findFirst({
    where: { code: code.trim().toUpperCase(), isActive: true },
  });

  if (!coupon) {
    return NextResponse.json({ error: "كود الكوبون غير صحيح" }, { status: 404 });
  }

  // Check validity period
  const now = new Date();
  if (coupon.validUntil && new Date(coupon.validUntil) < now) {
    return NextResponse.json({ error: "انتهت صلاحية الكوبون" }, { status: 400 });
  }

  // Check max redemptions
  if (coupon.maxRedemptions && coupon.usedCount >= coupon.maxRedemptions) {
    return NextResponse.json({ error: "تم استنفاد الكوبون" }, { status: 400 });
  }

  // Check if user already redeemed
  const alreadyRedeemed = await db.couponRedemption.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId: user.id } },
  });
  if (alreadyRedeemed) {
    return NextResponse.json({ error: "لقد استخدمت هذا الكوبون مسبقاً" }, { status: 400 });
  }

  // Check minimum amount
  if (amount && amount < coupon.minAmount) {
    return NextResponse.json(
      { error: `الحد الأدنى لاستخدام الكوبون هو ${coupon.minAmount} ريال` },
      { status: 400 }
    );
  }

  // Check appliesTo
  if (purpose && coupon.appliesTo !== "all" && coupon.appliesTo !== purpose) {
    return NextResponse.json(
      { error: `هذا الكوبون غير صالح لهذا النوع من العمليات` },
      { status: 400 }
    );
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = (amount || 0) * (coupon.value / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.value;
    if (amount && discount > amount) {
      discount = amount;
    }
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
    },
    discount,
    finalAmount: amount ? Math.max(0, amount - discount) : null,
  });
}
