import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, adminNote } = body;

  if (!["approved", "rejected", "completed", "pending"].includes(status)) {
    return NextResponse.json(
      { error: "الحالة غير صحيحة" },
      { status: 400 }
    );
  }

  // Get the transaction BEFORE update (to know the type and user)
  const existingTxn = await db.transaction.findUnique({
    where: { id },
    include: { user: { select: { id: true, username: true } } },
  });

  if (!existingTxn) {
    return NextResponse.json({ error: "المعاملة غير موجودة" }, { status: 404 });
  }

  const finalStatus = status === "approved" ? "completed" : status;

  const transaction = await db.transaction.update({
    where: { id },
    data: {
      status: finalStatus,
      adminNote: adminNote || null,
      processedById: admin.id,
      processedAt: new Date(),
    },
    include: {
      user: { select: { username: true, phone: true } },
      bankAccount: true,
    },
  });

  // Send notification to user
  if (finalStatus === "completed") {
    const isDeposit = existingTxn.type === "deposit";
    await createNotification({
      userId: existingTxn.userId,
      type: "transaction",
      title: isDeposit ? "تمت الموافقة على طلب الإيداع ✓" : "تم إرسال المبلغ إلى حسابك ✓",
      message: isDeposit
        ? `تم إضافة ${existingTxn.amount} ريال لرصيدك بنجاح.`
        : `تم تحويل ${existingTxn.amount} ريال إلى حسابك البنكي بنجاح.`,
      relatedId: existingTxn.id,
      relatedType: "transaction",
    });
  } else if (finalStatus === "rejected") {
    await createNotification({
      userId: existingTxn.userId,
      type: "transaction",
      title: "تم رفض طلبك ✗",
      message: `تم رفض ${existingTxn.type === "deposit" ? "طلب الإيداع" : "طلب السحب"} بقيمة ${existingTxn.amount} ريال.${adminNote ? ` السبب: ${adminNote}` : ""}`,
      relatedId: existingTxn.id,
      relatedType: "transaction",
    });
  }

  return NextResponse.json({ transaction });
}
