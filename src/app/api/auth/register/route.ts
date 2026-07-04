import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, phone, email, password, city } = body;

    // Validate required fields
    if (!username || !phone || !password) {
      return NextResponse.json(
        { error: "الاسم والجوال وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await db.user.findFirst({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json(
        { error: "رقم الجوال مسجل مسبقاً" },
        { status: 409 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await db.user.findFirst({ where: { email } });
      if (existingEmail) {
        return NextResponse.json(
          { error: "البريد الإلكتروني مسجل مسبقاً" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        username,
        phone,
        email: email || null,
        password: hashedPassword,
        city: city || null,
        isVerified: false,
        rating: 5.0,
      },
      select: {
        id: true,
        username: true,
        phone: true,
        email: true,
        city: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "تم إنشاء الحساب بنجاح",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    );
  }
}
