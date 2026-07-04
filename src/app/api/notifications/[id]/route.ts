import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;

  // Mark as read (only if owned by this user)
  const notification = await db.notification.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true, count: notification.count });
}
