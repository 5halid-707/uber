import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, city, region } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const existing = await db.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existing) {
      return NextResponse.json({ error: "البريد أو الجوال مسجل مسبقاً" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { name, email, phone, password: hashedPassword, city: city || null, region: region || null, walletBalance: 50 },
    });

    await db.notification.create({
      data: { userId: user.id, title: "مرحباً بك في أوبر! 🎉", message: "حصلت على 50 ر.س هدية ترحيب", type: "promo" },
    });

    await db.transaction.create({
      data: { userId: user.id, type: "bonus", amount: 50, description: "هدية الترحيب", status: "completed" },
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, walletBalance: user.walletBalance, isAdmin: user.isAdmin, isDriver: user.isDriver, isVerified: user.isVerified, rating: user.rating, tripsCount: user.tripsCount });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
