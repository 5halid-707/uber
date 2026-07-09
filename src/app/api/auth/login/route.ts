import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();cd /c/uber-fix
notepad src/app/api/auth/login/route.ts
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: "البريد/الجوال وكلمة المرور مطلوبة" }, { status: 400 });
    }

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
    });
  } catch (error) {
    console.error("Login error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : "";
    return NextResponse.json({ 
      error: "خطأ في الخادم", 
      debug: errMsg,
      stack: errStack?.split("\n").slice(0, 5).join("\n"),
      dbUrl: process.env.DATABASE_URL?.substring(0, 30) + "..."
    }, { status: 500 });
  }
}
