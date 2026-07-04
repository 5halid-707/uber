import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { sendEmail, welcomeEmail, getAdminEmail, newUserRegistrationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, phone, password, city, referralCode } = body;

    // Validate required fields (email + password required now)
    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير صحيح" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await db.user.findFirst({ where: { email: emailLower } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مسجل مسبقاً" },
        { status: 409 }
      );
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await db.user.findFirst({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json(
          { error: "رقم الجوال مسجل مسبقاً" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle referral code
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await db.user.findFirst({
        where: { affiliateCode: referralCode },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Generate unique affiliate code for new user
    const affiliateCode = `${username.replace(/\s/g, "").substring(0, 4).toUpperCase()}${Math.floor(Math.random() * 10000)}`;

    // Create user
    const user = await db.user.create({
      data: {
        username: username.trim(),
        email: emailLower,
        phone: phone?.trim() || null,
        password: hashedPassword,
        city: city || null,
        isVerified: false,
        rating: 5.0,
        referredById: referrerId,
        affiliateCode,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        city: true,
        affiliateCode: true,
        createdAt: true,
      },
    });

    // Log activity
    await logActivity({
      userId: user.id,
      action: "register",
      description: `تسجيل مستخدم جديد: ${user.username} (${user.email})`,
      metadata: { username: user.username, email: user.email, city: user.city },
    });

    // Send welcome email to user (in background, don't block response)
    sendEmail(welcomeEmail({ username: user.username, email: user.email })).catch(() => {});

    // Notify admin via email about new registration
    const adminEmail = await getAdminEmail();
    sendEmail(
      newUserRegistrationEmail(adminEmail, {
        username: user.username,
        email: user.email,
        phone: user.phone,
        city: user.city,
        createdAt: user.createdAt,
      })
    ).catch(() => {});

    // Create notification in admin's notifications (for in-app too)
    const admin = await db.user.findFirst({ where: { isAdmin: true } });
    if (admin) {
      await db.notification.create({
        data: {
          userId: admin.id,
          type: "system",
          title: "مستخدم جديد سجّل في حراج 🔔",
          message: `${user.username} (${user.email}) سجّل للتو في الموقع.`,
          relatedId: user.id,
          relatedType: "user",
        },
      });
    }

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
