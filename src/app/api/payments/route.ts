import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// GET user's payments
export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const payments = await db.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ payments });
}

// POST: process a payment (SIMULATED - no real card processing)
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json();
  const { purpose, amount, method, cardNumber, cardName, cardExpiry, cardCvc, listingId } = body;

  // Validate
  if (!purpose || !amount || !method) {
    return NextResponse.json(
      { error: "بيانات الدفع ناقصة" },
      { status: 400 }
    );
  }

  if (amount <= 0) {
    return NextResponse.json(
      { error: "المبلغ غير صحيح" },
      { status: 400 }
    );
  }

  // Validate card details (for card methods)
  const cardMethods = ["mada", "visa", "mastercard"];
  if (cardMethods.includes(method)) {
    if (!cardNumber || !cardName || !cardExpiry || !cardCvc) {
      return NextResponse.json(
        { error: "الرجاء إدخال بيانات البطاقة كاملة" },
        { status: 400 }
      );
    }
    // Luhn check (basic)
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 13 || digits.length > 19) {
      return NextResponse.json(
        { error: "رقم البطاقة غير صحيح" },
        { status: 400 }
      );
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      return NextResponse.json(
        { error: "تاريخ الانتهاء غير صحيح (MM/YY)" },
        { status: 400 }
      );
    }
    if (!/^\d{3,4}$/.test(cardCvc)) {
      return NextResponse.json(
        { error: "رمز التحقق غير صحيح" },
        { status: 400 }
      );
    }
  }

  // Detect card brand from number
  const cardDigits = cardNumber ? cardNumber.replace(/\s/g, "") : "";
  let cardBrand: string | null = null;
  if (method === "mada") cardBrand = "mada";
  else if (method === "visa") cardBrand = "visa";
  else if (method === "mastercard") cardBrand = "mastercard";
  else if (cardDigits.startsWith("4")) cardBrand = "visa";
  else if (/^5[1-5]/.test(cardDigits) || /^2[2-7]/.test(cardDigits)) cardBrand = "mastercard";

  const last4 = cardDigits ? cardDigits.slice(-4) : null;
  const reference = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // SIMULATE payment processing (90% success rate)
  // In real app, you'd call Mada/Payment Gateway API here
  const isSuccessful = Math.random() > 0.1; // 90% success

  const payment = await db.payment.create({
    data: {
      userId: user.id,
      purpose,
      listingId: listingId || null,
      amount: parseFloat(amount),
      method,
      cardLast4: last4,
      cardBrand,
      reference,
      status: isSuccessful ? "completed" : "failed",
      failureReason: isSuccessful ? null : "تم رفض العملية من البنك. الرجاء المحاولة مرة أخرى.",
      processedAt: isSuccessful ? new Date() : null,
    },
  });

  if (!isSuccessful) {
    return NextResponse.json(
      {
        error: payment.failureReason,
        payment,
      },
      { status: 400 }
    );
  }

  // Successful payment - perform action based on purpose
  if (purpose === "featured_listing" && listingId) {
    // Mark listing as featured
    await db.listing.update({
      where: { id: listingId },
      data: { isFeatured: true },
    });

    await createNotification({
      userId: user.id,
      type: "payment",
      title: "تم تمييز إعلانك بنجاح ✓",
      message: `تم تفعيل التمييز لإعلانك مقابل ${amount} ريال. الإعلان المميز يظهر أولاً في النتائج.`,
      link: listingId,
      relatedId: payment.id,
      relatedType: "payment",
    });
  } else if (purpose === "wallet_topup") {
    // Add to wallet balance (create a completed deposit transaction)
    await db.transaction.create({
      data: {
        userId: user.id,
        type: "deposit",
        amount: parseFloat(amount),
        status: "completed",
        description: `شحن المحفظة عبر ${getMethodName(method)} - ${reference}`,
        reference,
        processedAt: new Date(),
      },
    });

    await createNotification({
      userId: user.id,
      type: "payment",
      title: "تم شحن محفظتك بنجاح ✓",
      message: `تم إضافة ${amount} ريال لرصيدك عبر ${getMethodName(method)}.`,
      relatedId: payment.id,
      relatedType: "payment",
    });
  }

  return NextResponse.json({ payment });
}

function getMethodName(method: string): string {
  const methods: Record<string, string> = {
    mada: "مدى",
    visa: "Visa",
    mastercard: "Mastercard",
    apple_pay: "Apple Pay",
    stc_pay: "STC Pay",
  };
  return methods[method] || method;
}
