import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// GET /api/admin/trips
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = verifyAdmin(request);
    if (!user) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    // Trip schema has no driver relation; fetch drivers manually
    const tripsRaw = await db.trip.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            email: true,
            isBlocked: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const driverIds = [...new Set(tripsRaw.map((t) => t.driverId).filter(Boolean) as string[])];
    // Trip.driverId stores the driver's USER id (not Driver record id)
    const drivers = driverIds.length
      ? await db.driver.findMany({
          where: { userId: { in: driverIds } },
          select: {
            id: true,
            userId: true,
            carModel: true,
            carPlate: true,
            carColor: true,
            user: { select: { id: true, name: true, phone: true } },
          },
        })
      : [];
    // Map by userId so we can match Trip.driverId (which is the user id)
    const driverMap = new Map(drivers.map((d) => [d.userId, d]));
    const trips = tripsRaw.map((t) => ({
      ...t,
      driver: t.driverId ? driverMap.get(t.driverId) ?? null : null,
    }));

    return NextResponse.json({ trips, count: trips.length });
  } catch (error) {
    console.error("GET /api/admin/trips error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الرحلات" }, { status: 500 });
  }
}
