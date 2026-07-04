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
  const { isVerified, isAdmin, status } = body;

  const data: Record<string, unknown> = {};
  if (typeof isVerified === "boolean") data.isVerified = isVerified;
  if (typeof isAdmin === "boolean") data.isAdmin = isAdmin;

  // Update user
  if (Object.keys(data).length > 0) {
    const user = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        phone: true,
        isVerified: true,
        isAdmin: true,
      },
    });
    return NextResponse.json({ user });
  }

  // Update user's listings status
  if (status) {
    await db.listing.updateMany({
      where: { userId: id },
      data: { status },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent admin from deleting themselves
  if (id === admin.id) {
    return NextResponse.json(
      { error: "لا يمكنك حذف حسابك الخاص" },
      { status: 400 }
    );
  }

  await db.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
