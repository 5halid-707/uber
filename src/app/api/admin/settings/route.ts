import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const settings = await db.siteSettings.findFirst();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const body = await request.json();
  const existing = await db.siteSettings.findFirst();

  if (!existing) {
    const created = await db.siteSettings.create({ data: body });
    return NextResponse.json({ settings: created });
  }

  const updated = await db.siteSettings.update({
    where: { id: existing.id },
    data: body,
  });

  return NextResponse.json({ settings: updated });
}
