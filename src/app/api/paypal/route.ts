import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/paypal?userId=xxx
// - Returns PayPal connection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });
    }

    const paypalAccount = await db.bankAccount.findFirst({
      where: { userId, accountType: "paypal" },
    });

    return NextResponse.json({
      connected: !!paypalAccount,
      paypal: paypalAccount
        ? {
            id: paypalAccount.id,
            paypalEmail: paypalAccount.paypalEmail,
            accountName: paypalAccount.accountName,
            isDefault: paypalAccount.isDefault,
            isVerified: paypalAccount.isVerified,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/paypal error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب حالة PayPal" }, { status: 500 });
  }
}

// POST /api/paypal
// Body: { userId, paypalEmail, accountName }
// - Connects PayPal account (creates BankAccount with accountType="paypal")
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, paypalEmail, accountName } = body;

    if (!userId || !paypalEmail || !accountName) {
      return NextResponse.json(
        { error: "userId, paypalEmail, accountName مطلوبة" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail)) {
      return NextResponse.json({ error: "بريد PayPal غير صالح" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Check if already connected
    const existing = await db.bankAccount.findFirst({
      where: { userId, accountType: "paypal" },
    });

    if (existing) {
      const updated = await db.bankAccount.update({
        where: { id: existing.id },
        data: {
          paypalEmail: paypalEmail.toLowerCase().trim(),
          accountName: accountName.trim(),
        },
      });
      return NextResponse.json({ paypal: updated, connected: true });
    }

    const created = await db.bankAccount.create({
      data: {
        userId,
        bankName: "PayPal",
        accountName: accountName.trim(),
        paypalEmail: paypalEmail.toLowerCase().trim(),
        accountType: "paypal",
        isDefault: false,
        isVerified: false,
      },
    });

    return NextResponse.json({ paypal: created, connected: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/paypal error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء ربط PayPal" }, { status: 500 });
  }
}

// DELETE /api/paypal?userId=xxx
// - Disconnects PayPal account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });
    }

    await db.bankAccount.deleteMany({
      where: { userId, accountType: "paypal" },
    });

    return NextResponse.json({ success: true, disconnected: true });
  } catch (error) {
    console.error("DELETE /api/paypal error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء فصل PayPal" }, { status: 500 });
  }
}
