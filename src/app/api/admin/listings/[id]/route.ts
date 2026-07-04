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
  const { status, isFeatured } = body;

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (typeof isFeatured === "boolean") data.isFeatured = isFeatured;

  const listing = await db.listing.update({
    where: { id },
    data,
  });

  return NextResponse.json({ listing });
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
  await db.listing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
