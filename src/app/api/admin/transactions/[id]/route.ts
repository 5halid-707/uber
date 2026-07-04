import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

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

  // For withdrawals: when approved, mark as completed (money sent)
  // For deposits: when approved, mark as completed (money received)
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
      user: {
        select: { username: true, phone: true },
      },
      bankAccount: true,
    },
  });

  return NextResponse.json({ transaction });
}
