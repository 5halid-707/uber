import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// GET /api/bank-accounts?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { user: authUser, error: authError } = verifyAuth(request);
    if (!authUser) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || authUser.userId;
    if (userId !== authUser.userId && !authUser.isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    if (!userId) {
      return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });
    }

    const accounts = await db.bankAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("GET /api/bank-accounts error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الحسابات" }, { status: 500 });
  }
}

// POST /api/bank-accounts
export async function POST(request: NextRequest) {
  try {
    const { user: authUser, error: authError } = verifyAuth(request);
    if (!authUser) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const {
      userId,
      accountType = "bank",
      bankName,
      accountName,
      iban,
      accountNumber,
      paypalEmail,
      isDefault,
    } = body;

    if (!userId || !accountName?.trim()) {
      return NextResponse.json(
        { error: "userId و accountName مطلوبة" },
        { status: 400 }
      );
    }
    if (userId !== authUser.userId && !authUser.isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // === PayPal account ===
    if (accountType === "paypal") {
      if (!paypalEmail?.trim()) {
        return NextResponse.json(
          { error: "paypalEmail مطلوب لحساب PayPal" },
          { status: 400 }
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(paypalEmail)) {
        return NextResponse.json({ error: "بريد PayPal غير صالح" }, { status: 400 });
      }

      // Replace existing paypal account if any (one paypal per user)
      await db.bankAccount.deleteMany({
        where: { userId, accountType: "paypal" },
      });

      if (isDefault) {
        await db.bankAccount.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const account = await db.bankAccount.create({
        data: {
          userId,
          bankName: "PayPal",
          accountName: accountName.trim(),
          paypalEmail: paypalEmail.toLowerCase().trim(),
          accountType: "paypal",
          isDefault: !!isDefault,
          isVerified: false,
        },
      });

      return NextResponse.json({ account }, { status: 201 });
    }

    // === Bank account ===
    if (!bankName?.trim()) {
      return NextResponse.json(
        { error: "bankName مطلوب لحساب بنكي" },
        { status: 400 }
      );
    }
    if (!iban?.trim() && !accountNumber?.trim()) {
      return NextResponse.json(
        { error: "iban أو accountNumber مطلوب" },
        { status: 400 }
      );
    }

    // Check IBAN uniqueness if provided
    if (iban?.trim()) {
      const existing = await db.bankAccount.findFirst({
        where: { iban: iban.trim().toUpperCase() },
      });
      if (existing && existing.userId !== userId) {
        return NextResponse.json(
          { error: "رقم الـ IBAN مسجل مسبقاً" },
          { status: 409 }
        );
      }
    }

    if (isDefault) {
      await db.bankAccount.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await db.bankAccount.create({
      data: {
        userId,
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        iban: iban?.trim() ? iban.trim().toUpperCase() : null,
        accountNumber: accountNumber?.trim() || null,
        accountType: "bank",
        isDefault: !!isDefault,
        isVerified: false,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("POST /api/bank-accounts error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ الحساب" }, { status: 500 });
  }
}

// DELETE /api/bank-accounts?id=xxx&userId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "id و userId مطلوبة" }, { status: 400 });
    }

    await db.bankAccount.deleteMany({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/bank-accounts error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حذف الحساب" }, { status: 500 });
  }
}
