import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = verifyAuth(req);
    if (!user) return NextResponse.json({ error: error || "غير مصرح" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: any = { userId: user.userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.notification.count({ where: { userId: user.userId, isRead: false } }),
    ]);

    return NextResponse.json({ notifications, unreadCount, total: notifications.length });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإشعارات" }, { status: 500 });
  }
}
