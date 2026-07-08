import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });
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
    const body = await request.json();
    const { userId, type, amount, description, tripId } = body;
    if (!userId || !type || typeof amount !== "number") return NextResponse.json({ error: "userId, type, amount مطلوبة" }, { status: 400 });
    if (amount <= 0) return NextResponse.json({ error: "amount يجب أن تكون موجبة" }, { status: 400 });
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
    const updatedUser = await db.user.update({ where: { id: userId }, data: { walletBalance: isCredit ? { increment: amount } : { decrement: amount } }, select: { walletBalance: true } });
    return NextResponse.json({ transaction: tx, newBalance: updatedUser.walletBalance, balance: updatedUser.walletBalance }, { status: 201 });
  } catch (error) {
    console.error("POST /api/wallet error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
