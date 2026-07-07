import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/wallet?userId=xxx
// - Returns user's wallet balance and recent transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        walletBalance: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const transactions = await db.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalIn = transactions
      .filter((t) => ["deposit", "refund", "trip_payment_refund"].includes(t.type))
      .reduce((s, t) => s + t.amount, 0);
    const totalOut = transactions
      .filter((t) => ["withdrawal", "trip_payment", "fee"].includes(t.type))
      .reduce((s, t) => s + t.amount, 0);

    return NextResponse.json({
      wallet: {
        balance: user.walletBalance,
        totalIn,
        totalOut,
        transactionsCount: transactions.length,
      },
      transactions,
    });
  } catch (error) {
    console.error("GET /api/wallet error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب المحفظة" }, { status: 500 });
  }
}

// POST /api/wallet
// Body: { userId, type, amount, description, tripId? }
// - Creates a transaction and updates wallet balance accordingly
//   type=deposit/refund -> increment
//   type=withdrawal/trip_payment/fee -> decrement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, amount, description, tripId } = body;

    if (!userId || !type || typeof amount !== "number") {
      return NextResponse.json(
        { error: "userId, type, amount مطلوبة" },
        { status: 400 }
      );
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "amount يجب أن تكون موجبة" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const creditTypes = ["deposit", "refund", "trip_payment_refund", "topup"];
    const isCredit = creditTypes.includes(type);

    if (!isCredit) {
      // Debit: check balance
      if (user.walletBalance < amount) {
        return NextResponse.json(
          { error: "الرصيد غير كافٍ في المحفظة", currentBalance: user.walletBalance },
          { status: 400 }
        );
      }
    }

    // Create transaction + update wallet atomically (best-effort)
    const tx = await db.transaction.create({
      data: {
        userId,
        type,
        amount,
        description: description || `عملية محفظة - ${type}`,
        status: "completed",
        tripId: tripId || null,
      },
    });

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        walletBalance: isCredit
          ? { increment: amount }
          : { decrement: amount },
      },
      select: { walletBalance: true },
    });

    return NextResponse.json({
      transaction: tx,
      newBalance: updatedUser.walletBalance,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/wallet error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة عملية المحفظة" }, { status: 500 });
  }
}
