import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/trips/driver-arrived
// Body: { tripId, driverId }
// - Set status -> "driver_arrived", driverArrivedAt = now
// - Create notification for rider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, driverId } = body;

    if (!tripId || !driverId) {
      return NextResponse.json({ error: "tripId و driverId مطلوبان" }, { status: 400 });
    }

    const trip = await db.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
    }
    if (trip.driverId !== driverId) {
      return NextResponse.json({ error: "غير مصرح: السائق لا يطابق الرحلة" }, { status: 403 });
    }
    if (!["accepted", "driver_arrived"].includes(trip.status)) {
      return NextResponse.json(
        { error: `لا يمكن الإعلان عن الوصول في الحالة الحالية: ${trip.status}` },
        { status: 409 }
      );
    }

    const updated = await db.trip.update({
      where: { id: tripId },
      data: {
        status: "driver_arrived",
        driverArrivedAt: trip.driverArrivedAt ?? new Date(),
      },
    });

    await db.notification
      .create({
        data: {
          userId: trip.userId,
          title: "السائق وصل! 📍",
          message: `وصل السائق إلى موقعك. لديك ${trip.freeWaitingMinutes} دائق انتظار مجانية.`,
          type: "trip",
        },
      })
      .catch(() => {});

    return NextResponse.json({ trip: updated });
  } catch (error) {
    console.error("POST /api/trips/driver-arrived error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الإعلان عن الوصول" }, { status: 500 });
  }
}
