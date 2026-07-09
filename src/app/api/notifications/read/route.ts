import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = verifyAuth(req);
    if (!user) return NextResponse.json({ error: error || "غير مصرح" }, { status: 401 });
    const { notificationId, all } = await req.json();

    if (all) {
      await db.notification.updateMany({ where: { userId: user.userId, isRead: false }, data: { isRead: true } });
    } else if (notificationId) {
      await db.notification.updateMany({ where: { id: notificationId, userId: user.userId }, data: { isRead: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/notifications/read error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
