import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// POST /api/admin/block
export async function POST(request: NextRequest) {
  try {
    const { user: adminUser, error: authError } = verifyAdmin(request);
    if (!adminUser) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { userId, action, reason, notes } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId, action مطلوبة" },
        { status: 400 }
      );
    }

    if (!["block", "unblock"].includes(action)) {
      return NextResponse.json(
        { error: "action يجب أن تكون block أو unblock" },
        { status: 400 }
      );
    }

    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }
    if (target.isAdmin) {
      return NextResponse.json({ error: "لا يمكن حظر مدير" }, { status: 403 });
    }

    const blocking = action === "block";
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        isBlocked: blocking,
        blockReason: blocking ? (reason || notes || "حظر إداري") : null,
        blockedAt: blocking ? new Date() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isBlocked: true,
        blockReason: true,
        blockedAt: true,
      },
    });

    // If user is also a driver and is being blocked, force them offline
    if (blocking) {
      await db.driver
        .updateMany({
          where: { userId },
          data: { isOnline: false },
        })
        .catch(() => {});
    }

    // Notify the user
    await db.notification.create({
      data: {
        userId,
        title: blocking ? "🚫 تم حظر حسابك" : "✅ تم رفع الحظر عن حسابك",
        message: blocking
          ? `تم حظر حسابك. السبب: ${reason || notes || "حظر إداري"}. لتقديم اعتراض، تواصل مع الدعم.`
          : "تم رفع الحظر عن حسابك. يمكنك الآن استخدام الخدمة بشكل طبيعي.",
        type: "account_block",
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("POST /api/admin/block error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث حالة الحظر" }, { status: 500 });
  }
}
