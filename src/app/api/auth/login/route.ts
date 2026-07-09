import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    const { identifier, password } = parsed.data;

    const user = await db.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: "حسابك موقوف", isBlocked: true, blockReason: user.blockReason }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      isDriver: user.isDriver,
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      region: user.region,
      walletBalance: user.walletBalance,
      isAdmin: user.isAdmin,
      isDriver: user.isDriver,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      rating: user.rating,
      tripsCount: user.tripsCount,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}