import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET user's transactions
export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      bankAccount: {
        select: {
          bankName: true,
          accountName: true,
          iban: true,
          accountNumber: true,
        },
      },
    },
  });

  // Calculate balance: deposits + payments in - withdrawals - payments out (only completed)
  const completed = transactions.filter((t) => t.status === "completed");
  const balance = completed.reduce((acc, t) => {
    if (t.type === "deposit" || t.type === "payment_in") return acc + t.amount;
    if (t.type === "withdrawal" || t.type === "payment_out") return acc - t.amount;
    return acc;
  }, 0);

  const pendingAmount = transactions
    .filter((t) => t.status === "pending" && (t.type === "withdrawal" || t.type === "payment_out"))
    .reduce((acc, t) => acc + t.amount, 0);

  return NextResponse.json({
    transactions,
    balance,
    pendingAmount,
    availableBalance: balance - pendingAmount,
  });
}

// POST: create a new transaction request (withdrawal or deposit notification)
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json();
  const { type, amount, bankAccountId, description, reference } = body;

  // Validate
  if (!type || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "النوع والمبلغ مطلوبان" },
      { status: 400 }
    );
  }

  if (type !== "withdrawal" && type !== "deposit") {
    return NextResponse.json(
      { error: "النوع غير صحيح" },
      { status: 400 }
    );
  }

  // Get settings
  const settings = await db.siteSettings.findFirst();
  const minAmount = settings?.minWithdrawal || 100;

  if (amount < minAmount) {
    return NextResponse.json(
      { error: `الحد الأدنى للتحويل هو ${minAmount} ريال` },
      { status: 400 }
    );
  }

  // For withdrawals: check balance and bank account
  if (type === "withdrawal") {
    // Calculate current balance
    const txns = await db.transaction.findMany({
      where: { userId: user.id, status: "completed" },
    });
    const balance = txns.reduce((acc, t) => {
      if (t.type === "deposit" || t.type === "payment_in") return acc + t.amount;
      if (t.type === "withdrawal" || t.type === "payment_out") return acc - t.amount;
      return acc;
    }, 0);

    // Pending withdrawals
    const pending = await db.transaction.aggregate({
      where: { userId: user.id, status: "pending", type: "withdrawal" },
      _sum: { amount: true },
    });
    const available = balance - (pending._sum.amount || 0);

    if (amount > available) {
      return NextResponse.json(
        {
          error: `رصيدك المتاح هو ${available} ريال فقط`,
          availableBalance: available,
        },
        { status: 400 }
      );
    }

    if (!bankAccountId) {
      return NextResponse.json(
        { error: "الرجاء اختيار حساب بنكي للتحويل إليه" },
        { status: 400 }
      );
    }

    // Verify bank account belongs to user
    const bankAccount = await db.bankAccount.findFirst({
      where: { id: bankAccountId, userId: user.id },
    });
    if (!bankAccount) {
      return NextResponse.json(
        { error: "الحساب البنكي غير موجود" },
        { status: 404 }
      );
    }
  }

  // Create transaction
  const transaction = await db.transaction.create({
    data: {
      userId: user.id,
      type,
      amount: parseFloat(amount),
      description: description || null,
      reference: reference || null,
      bankAccountId: type === "withdrawal" ? bankAccountId : null,
      status: "pending",
    },
    include: {
      bankAccount: {
        select: {
          bankName: true,
          accountName: true,
          iban: true,
        },
      },
    },
  });

  return NextResponse.json({ transaction });
}
