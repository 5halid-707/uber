import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/drivers/approve
// Body: { driverId, adminId, action: "approve" | "reject", rejectionReason? }
// - Sets isApproved, approvalStatus, isVerified (on approve), rejectionReason (on reject)
// - Notifies driver's user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, adminId, action, rejectionReason } = body;

    if (!driverId || !adminId || !action) {
      return NextResponse.json(
        { error: "driverId, adminId, action مطلوبة" },
        { status: 400 }
      );
    }
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action يجب أن تكون approve أو reject" }, { status: 400 });
    }

    // Verify admin
    const admin = await db.user.findUnique({ where: { id: adminId } });
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: "غير مصرح: المستخدم ليس مديراً" }, { status: 403 });
    }

    const driver = await db.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return NextResponse.json({ error: "السائق غير موجود" }, { status: 404 });
    }

    const approved = action === "approve";
    const updated = await db.driver.update({
      where: { id: driverId },
      data: {
        isApproved: approved,
        isVerified: approved,
        approvalStatus: approved ? "approved" : "rejected",
        rejectionReason: approved ? null : (rejectionReason || "تم الرفض من قبل الإدارة"),
      },
    });

    // Notify the driver's user
    await db.notification.create({
      data: {
        userId: driver.userId,
        title: approved ? "🎉 تم اعتمادك كسائق!" : "❌ تم رفض طلبك",
        message: approved
          ? "مبروك! تم اعتماد حسابك كسائق. يمكنك الآن البدء في استقبال طلبات الرحلات."
          : `نأسف، تم رفض طلبك${rejectionReason ? `: ${rejectionReason}` : ""}. يمكنك تعديل البيانات وإعادة الإرسال.`,
        type: "driver_approval",
      },
    });

    return NextResponse.json({ driver: updated });
  } catch (error) {
    console.error("POST /api/drivers/approve error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة طلب الاعتماد" }, { status: 500 });
  }
}
