import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { walletSchema } from "@/lib/validation";
import { sendEmail, transactionStatusEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const { user: authUser, error: authError } = verifyAuth(request);
    if (!authUser) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || authUser.userId;
    if (userId !== authUser.userId && !authUser.isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, walletBalance: true } });
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    const transactions = await db.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({ balance: user.walletBalance, transactions });
  } catch (error) {
    console.error("GET /api/wallet error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user: authUser, error: authError } = verifyAuth(request);
    if (!authUser) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const parsed = walletSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    const { userId, type, amount, description, tripId } = parsed.data;
    if (userId !== authUser.userId && !authUser.isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    const creditTypes = ["deposit", "refund", "trip_payment_refund", "topup", "trip_earnings", "bonus"];
    const debitTypes = ["withdrawal", "trip_payment", "fee", "commission"];
    const isCredit = creditTypes.includes(type);
    const isDebit = debitTypes.includes(type);
    if (!isCredit && !isDebit) return NextResponse.json({ error: "نوع العملية غير صالح" }, { status: 400 });
    if (type === "withdrawal" && !user.isDriver && !user.isAdmin) {
      return NextResponse.json({ error: "الركاب لا يمكنهم السحب - الشحن متاح فقط" }, { status: 403 });
    }
    if (isDebit && user.walletBalance < amount) {
      return NextResponse.json({ error: "الرصيد غير كافٍ", currentBalance: user.walletBalance }, { status: 400 });
    }
    const tx = await db.transaction.create({ data: { userId, type, amount, description: description || `عملية محفظة - ${type}`, status: "completed", tripId: tripId || null } });
    const updatedUser = await db.user.update({ where: { id: userId }, data: { walletBalance: isCredit ? { increment: amount } : { decrement: amount } }, select: { walletBalance: true, name: true, email: true } });
    sendEmail(transactionStatusEmail({ username: updatedUser.name, email: updatedUser.email }, { type, amount, status: "completed" }));
    return NextResponse.json({ transaction: tx, newBalance: updatedUser.walletBalance, balance: updatedUser.walletBalance }, { status: 201 });
  } catch (error) {
    console.error("POST /api/wallet error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}