import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// POST /api/drivers/approve
export async function POST(request: NextRequest) {
  try {
    const { user: adminUser, error: authError } = verifyAdmin(request);
    if (!adminUser) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { driverId, action, rejectionReason } = body;

    if (!driverId || !action) {
      return NextResponse.json(
        { error: "driverId, action مطلوبة" },
        { status: 400 }
      );
    }
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action يجب أن تكون approve أو reject" }, { status: 400 });
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
