import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { sendEmail, transactionStatusEmail } from "@/lib/email";

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

  // Get the transaction BEFORE update
  const existingTxn = await db.transaction.findUnique({
    where: { id },
    include: { user: { select: { id: true, username: true, email: true, phone: true } } },
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
      user: { select: { username: true, phone: true, email: true } },
      bankAccount: true,
    },
  });

  // Log activity
  await logActivity({
    userId: admin.id,
    action: existingTxn.type === "deposit" ? "deposit_approve" : "withdrawal_approve",
    description: `${finalStatus === "completed" ? "الموافقة على" : "رفض"} ${existingTxn.type === "deposit" ? "إيداع" : "سحب"} بقيمة ${existingTxn.amount} ريال للمستخدم ${existingTxn.user.username}`,
    metadata: { transactionId: existingTxn.id, amount: existingTxn.amount, status: finalStatus },
  });

  // Send notification + email to user
  if (existingTxn.user.email) {
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
      // Send email
      sendEmail(
        transactionStatusEmail(
          { username: existingTxn.user.username, email: existingTxn.user.email },
          { type: existingTxn.type, amount: existingTxn.amount, status: finalStatus, adminNote }
        )
      ).catch(() => {});
    } else if (finalStatus === "rejected") {
      await createNotification({
        userId: existingTxn.userId,
        type: "transaction",
        title: "تم رفض طلبك ✗",
        message: `تم رفض ${existingTxn.type === "deposit" ? "طلب الإيداع" : "طلب السحب"} بقيمة ${existingTxn.amount} ريال.${adminNote ? ` السبب: ${adminNote}` : ""}`,
        relatedId: existingTxn.id,
        relatedType: "transaction",
      });
      // Send email
      sendEmail(
        transactionStatusEmail(
          { username: existingTxn.user.username, email: existingTxn.user.email },
          { type: existingTxn.type, amount: existingTxn.amount, status: finalStatus, adminNote }
        )
      ).catch(() => {});
    }
  }

  return NextResponse.json({ transaction });
}
