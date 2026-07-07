import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Get complaints for a user or all (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const adminId = searchParams.get("adminId");

    let where: any = {};
    if (adminId) {
      const admin = await db.user.findUnique({ where: { id: adminId } });
      if (!admin?.isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      // Admin sees ALL complaints
    } else if (userId) {
      // User sees only their complaints
      where = { OR: [{ fromUserId: userId }, { againstUserId: userId }] };
    }

    const complaints = await db.notification.findMany({
      where: { ...where, type: "complaint" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(complaints);
  } catch (error) {
    console.error("Get complaints error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

// POST: Submit a complaint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromUserId, againstUserId, subject, description, tripId } = body;

    if (!fromUserId || !subject || !description) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    // Create complaint as a notification to all admins
    const admins = await db.user.findMany({ where: { isAdmin: true } });
    const complaintMsg = `شكوى من: ${body.fromUserName || "مستخدم"}\nضد: ${body.againstUserName || "غير محدد"}\nالموضوع: ${subject}\nالتفاصيل: ${description}${tripId ? `\nرقم الرحلة: ${tripId}` : ""}`;

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: `🚨 شكوى جديدة: ${subject}`,
          message: complaintMsg,
          type: "complaint",
        },
      });
    }

    // Email the owner
    try {
      await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/email/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: process.env.OWNER_EMAIL || "grouthhacker@gmail.com",
          subject: `🚨 شكوى جديدة: ${subject}`,
          message: complaintMsg,
        }),
      });
    } catch {}

    // Also create a notification for the complainant
    await db.notification.create({
      data: {
        userId: fromUserId,
        title: "تم استلام شكواك ✅",
        message: `تم إرسال شكواك "${subject}" للإدارة. سيتم مراجعتها قريباً.`,
        type: "system",
      },
    });

    return NextResponse.json({ success: true, message: "تم إرسال الشكوى للإدارة" });
  } catch (error) {
    console.error("Submit complaint error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
