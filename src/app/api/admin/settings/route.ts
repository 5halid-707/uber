import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

const DEFAULT_SETTINGS = {
  commissionRate: 15,
  vatRate: 15,
  freeWaitingMin: 5,
  lateFeePerMin: 1,
  supportPhone: "0575015019",
  supportEmail: "support@uber.sa",
  adminEmail: "grouthhacker@gmail.com",
};

async function getSettings() {
  try {
    let settings = await db.siteSettings.findFirst();
    if (!settings) {
      settings = await db.siteSettings.create({ data: { id: "default", ...DEFAULT_SETTINGS } });
    }
    return settings;
  } catch (err: any) {
    if (err?.code === "P2021") {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SiteSettings" (
          id TEXT PRIMARY KEY DEFAULT 'default',
          "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 15,
          "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 15,
          "freeWaitingMin" INTEGER NOT NULL DEFAULT 5,
          "lateFeePerMin" DOUBLE PRECISION NOT NULL DEFAULT 1,
          "supportPhone" TEXT NOT NULL DEFAULT '0575015019',
          "supportEmail" TEXT NOT NULL DEFAULT 'support@uber.sa',
          "adminEmail" TEXT NOT NULL DEFAULT 'grouthhacker@gmail.com',
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await db.siteSettings.create({ data: { id: "default", ...DEFAULT_SETTINGS } });
      return await db.siteSettings.findFirst()!;
    }
    throw err;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = verifyAdmin(req);
    if (!user) return NextResponse.json({ error: error || "غير مصرح" }, { status: 401 });
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإعدادات" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error } = verifyAdmin(req);
    if (!user) return NextResponse.json({ error: error || "غير مصرح" }, { status: 401 });
    const body = await req.json();
    const allowed = ["commissionRate", "vatRate", "freeWaitingMin", "lateFeePerMin", "supportPhone", "supportEmail", "adminEmail"];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        data[key] = body[key];
      }
    }
    await getSettings();
    const updated = await db.siteSettings.update({ where: { id: "default" }, data });
    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("PUT /api/admin/settings error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ الإعدادات" }, { status: 500 });
  }
}
