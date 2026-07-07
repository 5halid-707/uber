import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/trips/late-fee?tripId=xxx
// Returns: { waitingMinutes, lateFee, freeMinutesLeft, isLate }
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "tripId مطلوب" }, { status: 400 });
    }

    const trip = await db.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
    }

    // If trip hasn't had driver arrival yet
    if (!trip.driverArrivedAt) {
      return NextResponse.json({
        waitingMinutes: 0,
        lateFee: 0,
        freeMinutesLeft: trip.freeWaitingMinutes,
        isLate: false,
        tripId,
      });
    }

    // If trip already started, waiting stopped at startedAt; else use now
    const endTime = trip.startedAt ?? new Date();
    const diffMs = endTime.getTime() - trip.driverArrivedAt.getTime();
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
    const freeMinutes = trip.freeWaitingMinutes;
    const chargeableMinutes = Math.max(0, totalMinutes - freeMinutes);
    const lateFee = Math.round(chargeableMinutes * trip.lateFeePerMinute * 100) / 100;

    return NextResponse.json({
      waitingMinutes: totalMinutes,
      lateFee,
      freeMinutesLeft: Math.max(0, freeMinutes - totalMinutes),
      isLate: chargeableMinutes > 0,
      tripId,
      driverArrivedAt: trip.driverArrivedAt,
      startedAt: trip.startedAt,
    });
  } catch (error) {
    console.error("GET /api/trips/late-fee error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حساب رسوم الانتظار" }, { status: 500 });
  }
}
