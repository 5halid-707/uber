import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// Mark affiliate earnings as paid
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
  const { action } = body; // pay or cancel

  const earning = await db.affiliateEarning.findUnique({
    where: { id },
    include: { affiliate: true, referred: true },
  });

  if (!earning) {
    return NextResponse.json({ error: "العمولة غير موجودة" }, { status: 404 });
  }

  if (action === "pay") {
    const updated = await db.affiliateEarning.update({
      where: { id },
      data: { status: "paid", paidAt: new Date() },
    });

    await logActivity({
      userId: admin.id,
      action: "withdrawal_approve",
      description: `دفع عمولة ${earning.amount} ريال للمسوّق ${earning.affiliate.username} (المُحال: ${earning.referred.username})`,
    });

    return NextResponse.json({ earning: updated });
  } else if (action === "cancel") {
    const updated = await db.affiliateEarning.update({
      where: { id },
      data: { status: "cancelled" },
    });
    return NextResponse.json({ earning: updated });
  }

  return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 });
}
