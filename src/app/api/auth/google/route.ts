import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// POST /api/auth/google
// Body: { googleId, email, name, picture }
// - Finds existing user by email, or creates new one
// - Returns user record (client is expected to also sign in via NextAuth)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { googleId, email, name, picture } = body;

    if (!googleId || !email || !name) {
      return NextResponse.json(
        { error: "googleId, email, name مطلوبة" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Try finding by email first
    let user = await db.user.findUnique({ where: { email: emailLower } });

    if (user) {
      // Update avatar if provided and different
      if (picture && user.avatar !== picture) {
        user = await db.user.update({
          where: { id: user.id },
          data: { avatar: picture, isVerified: true },
        });
      } else if (!user.isVerified) {
        user = await db.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
      }
      return NextResponse.json({ user, isNewUser: false });
    }

    // Create new user
    // phone is @unique and required - use googleId-based placeholder phone
    const placeholderPhone = `g-${googleId}`.substring(0, 50);
    // password is required - use a random hash since OAuth users don't need a password
    const randomPassword = await bcrypt.hash(`${googleId}-${Date.now()}-oauth`, 10);

    user = await db.user.create({
      data: {
        name: name.trim(),
        email: emailLower,
        phone: placeholderPhone,
        password: randomPassword,
        avatar: picture || null,
        isVerified: true,
        rating: 5.0,
      },
    });

    // Notify admins about new Google registration
    const admins = await db.user.findMany({ where: { isAdmin: true } });
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          title: "🔔 مستخدم جديد عبر Google",
          message: `${name} (${emailLower}) سجّل عبر Google OAuth.`,
          type: "system",
        })),
      });
    }

    return NextResponse.json({ user, isNewUser: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/auth/google error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الدخول بـ Google" }, { status: 500 });
  }
}
