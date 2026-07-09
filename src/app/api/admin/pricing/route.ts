import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";
import { serviceTypes } from "@/lib/saudi-data";

const DEFAULTS = serviceTypes.map(s => ({
  serviceId: s.id, name: s.name, basePrice: s.basePrice, perKm: s.perKm, perMin: s.perMin, minPrice: s.minPrice, seats: s.seats,
}));

export async function GET(req: NextRequest) {
  try {
    const { user, error } = verifyAdmin(req);
    if (!user) return NextResponse.json({ error: error || "غير مصرح" }, { status: 401 });

    let prices = await db.servicePrice.findMany();
    if (prices.length === 0) {
      await db.servicePrice.createMany({ data: DEFAULTS });
      prices = await db.servicePrice.findMany();
    }
    return NextResponse.json({ prices });
  } catch (error) {
    console.error("GET /api/admin/pricing error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error } = verifyAdmin(req);
    if (!user) return NextResponse.json({ error: error || "غير مصرح" }, { status: 401 });

    const body = await req.json();
    const existing = await db.servicePrice.findUnique({ where: { serviceId: body.serviceId } });
    if (!existing) return NextResponse.json({ error: "الخدمة غير موجودة" }, { status: 404 });

    const updated = await db.servicePrice.update({
      where: { serviceId: body.serviceId },
      data: {
        basePrice: body.basePrice ?? existing.basePrice,
        perKm: body.perKm ?? existing.perKm,
        perMin: body.perMin ?? existing.perMin,
        minPrice: body.minPrice ?? existing.minPrice,
        seats: body.seats ?? existing.seats,
        isActive: body.isActive ?? existing.isActive,
      },
    });
    return NextResponse.json({ price: updated });
  } catch (error) {
    console.error("PUT /api/admin/pricing error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
