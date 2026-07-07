import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/unpaid-trips?adminId=xxx
// - Lists trips where unpaidAmount > 0
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (adminId) {
      const admin = await db.user.findUnique({ where: { id: adminId } });
      if (!admin || !admin.isAdmin) {
        return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
      }
    }

    // Trip schema has no driver relation; fetch drivers manually
    const tripsRaw = await db.trip.findMany({
      where: {
        unpaidAmount: { gt: 0 },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            email: true,
            walletBalance: true,
            isBlocked: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    const driverIds = [...new Set(tripsRaw.map((t) => t.driverId).filter(Boolean) as string[])];
    const drivers = driverIds.length
      ? await db.driver.findMany({
          where: { id: { in: driverIds } },
          select: {
            id: true,
            carModel: true,
            carPlate: true,
            user: { select: { id: true, name: true, phone: true } },
          },
        })
      : [];
    const driverMap = new Map(drivers.map((d) => [d.id, d]));
    const trips = tripsRaw.map((t) => ({
      ...t,
      driver: t.driverId ? driverMap.get(t.driverId) ?? null : null,
    }));

    const totalUnpaid = trips.reduce((sum, t) => sum + (t.unpaidAmount || 0), 0);

    return NextResponse.json({
      trips,
      count: trips.length,
      totalUnpaid: Math.round(totalUnpaid * 100) / 100,
    });
  } catch (error) {
    console.error("GET /api/admin/unpaid-trips error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الرحلات غير المدفوعة" }, { status: 500 });
  }
}
