import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "30");
  const onlyUnread = searchParams.get("unread") === "true";

  const notifications = await db.notification.findMany({
    where: {
      userId: user.id,
      ...(onlyUnread ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}
