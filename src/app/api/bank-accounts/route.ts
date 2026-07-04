import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const accounts = await db.bankAccount.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ accounts });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json();
  const { bankName, accountName, iban, accountNumber, swiftCode, isDefault } = body;

  if (!bankName?.trim() || !accountName?.trim() || !iban?.trim() || !accountNumber?.trim()) {
    return NextResponse.json(
      { error: "الرجاء ملء جميع الحقول المطلوبة" },
      { status: 400 }
    );
  }

  // Check IBAN uniqueness
  const existing = await db.bankAccount.findFirst({ where: { iban: iban.trim() } });
  if (existing) {
    return NextResponse.json(
      { error: "رقم الـ IBAN مسجل مسبقاً" },
      { status: 409 }
    );
  }

  // If new account is default, unset previous defaults
  if (isDefault) {
    await db.bankAccount.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const account = await db.bankAccount.create({
    data: {
      userId: user.id,
      bankName: bankName.trim(),
      accountName: accountName.trim(),
      iban: iban.trim().toUpperCase(),
      accountNumber: accountNumber.trim(),
      swiftCode: swiftCode?.trim() || null,
      isDefault: !!isDefault,
    },
  });

  return NextResponse.json({ account });
}

export async function DELETE(request: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID مطلوب" }, { status: 400 });
  }

  await db.bankAccount.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}
