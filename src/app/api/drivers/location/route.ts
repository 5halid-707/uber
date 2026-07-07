import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/drivers/location?driverUserId=xxx | ?tripId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverUserId = searchParams.get("driverUserId");
    const tripId = searchParams.get("tripId");

    let targetUserId: string | undefined = driverUserId || undefined;

    if (!targetUserId && tripId) {
      const trip = await db.trip.findUnique({ where: { id: tripId }, select: { driverId: true } });
      if (!trip || !trip.driverId) {
        return NextResponse.json({ error: "لا يوجد سائق مرتبط بهذه الرحلة" }, { status: 404 });
      }
      const driver = await db.driver.findUnique({
        where: { id: trip.driverId },
        select: { userId: true },
      });
      targetUserId = driver?.userId;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "driverUserId أو tripId مطلوب" }, { status: 400 });
    }

    const driver = await db.driver.findUnique({
      where: { userId: targetUserId },
      select: {
        id: true,
        userId: true,
        currentLat: true,
        currentLng: true,
        isOnline: true,
        carModel: true,
        carPlate: true,
        carColor: true,
        rating: true,
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "السائق غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ driver });
  } catch (error) {
    console.error("GET /api/drivers/location error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب موقع السائق" }, { status: 500 });
  }
}

// POST /api/drivers/location
// Body: { driverUserId, lat, lng, heading?, speed? }
// - Updates driver.currentLat / currentLng
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverUserId, lat, lng } = body;

    if (!driverUserId || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "driverUserId, lat, lng مطلوبة (lat/lng أرقام)" },
        { status: 400 }
      );
    }

    const driver = await db.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) {
      return NextResponse.json({ error: "السائق غير موجود" }, { status: 404 });
    }

    const updated = await db.driver.update({
      where: { id: driver.id },
      data: {
        currentLat: lat,
        currentLng: lng,
      },
    });

    return NextResponse.json({
      driverId: updated.id,
      lat: updated.currentLat,
      lng: updated.currentLng,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("POST /api/drivers/location error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث موقع السائق" }, { status: 500 });
  }
}
