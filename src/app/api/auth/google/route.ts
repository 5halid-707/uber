import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { initDb } from "@/lib/init-db";
import { signToken } from "@/lib/auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = "https://uber-new-omega.vercel.app/api/auth/google";

// GET - Handle Google OAuth redirect + callback
export async function GET(request: NextRequest) {
  try { await initDb(); } catch(e) {}
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // Step 1: Redirect to Google consent screen
  if (!code) {
    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
    }
    const scope = encodeURIComponent("openid email profile");
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}&prompt=consent`;
    return NextResponse.redirect(url);
  }

  // Step 2: Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/?error=google_auth_failed", request.url));
  }

  const tokens = await tokenRes.json();

  // Step 3: Get user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/?error=google_user_failed", request.url));
  }

  const googleUser = await userRes.json();
  const emailLower = googleUser.email?.toLowerCase().trim();

  if (!emailLower) {
    return NextResponse.redirect(new URL("/?error=no_email", request.url));
  }

  // Step 4: Find or create user
  let user = await db.user.findUnique({ where: { email: emailLower } });

  if (user) {
    if (user.avatar !== googleUser.picture && googleUser.picture) {
      user = await db.user.update({
        where: { id: user.id },
        data: { avatar: googleUser.picture, isVerified: true },
      });
    }
  } else {
    const randomPassword = await bcrypt.hash(`${googleUser.id}-${Date.now()}-oauth`, 10);
    user = await db.user.create({
      data: {
        name: googleUser.name?.trim() || "مستخدم Google",
        email: emailLower,
        phone: `g-${googleUser.id}`.substring(0, 50),
        password: randomPassword,
        avatar: googleUser.picture || null,
        isVerified: true,
        rating: 5.0,
        city: "الرياض",
        region: "منطقة الرياض",
      },
    });
  }

  // Step 5: Generate JWT and redirect to frontend
  const token = signToken({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
    isDriver: user.isDriver,
  });

  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set("token", token);
  redirectUrl.searchParams.set("userId", user.id);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("uber_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}

// POST - Manual Google login (from frontend)
export async function POST(request: NextRequest) {
  try { await initDb(); } catch(e) {}

  const body = await request.json();
  const { googleId, email, name, picture } = body;

  if (!googleId || !email || !name) {
    return NextResponse.json({ error: "googleId, email, name مطلوبة" }, { status: 400 });
  }

  const emailLower = email.toLowerCase().trim();
  let user = await db.user.findUnique({ where: { email: emailLower } });

  if (user) {
    if (picture && user.avatar !== picture) {
      user = await db.user.update({
        where: { id: user.id },
        data: { avatar: picture, isVerified: true },
      });
    }
    const token = signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin, isDriver: user.isDriver });
    return NextResponse.json({ user, token, isNewUser: false });
  }

  const randomPassword = await bcrypt.hash(`${googleId}-${Date.now()}-oauth`, 10);
  user = await db.user.create({
    data: {
      name: name.trim(),
      email: emailLower,
      phone: `g-${googleId}`.substring(0, 50),
      password: randomPassword,
      avatar: picture || null,
      isVerified: true,
      rating: 5.0,
      city: "الرياض",
      region: "منطقة الرياض",
    },
  });

  const token = signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin, isDriver: user.isDriver });
  return NextResponse.json({ user, token, isNewUser: true }, { status: 201 });
}
