import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Compute live late fee based on driverArrivedAt and configured thresholds
function computeLateFee(trip: {
  driverArrivedAt: Date | null;
  freeWaitingMinutes: number;
  lateFeePerMinute: number;
  lateFee: number;
  startedAt: Date | null;
}) {
  if (!trip.driverArrivedAt) {
    return { waitingMinutes: 0, lateFee: 0, freeMinutesLeft: trip.freeWaitingMinutes, isLate: false };
  }
  // If trip already started, waiting stops at startedAt
  const endTime = trip.startedAt ?? new Date();
  const diffMs = endTime.getTime() - trip.driverArrivedAt.getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const freeMinutes = trip.freeWaitingMinutes;
  const waitingMinutes = totalMinutes;
  const chargeableMinutes = Math.max(0, totalMinutes - freeMinutes);
  const lateFee = Math.round(chargeableMinutes * trip.lateFeePerMinute * 100) / 100;
  const freeMinutesLeft = Math.max(0, freeMinutes - totalMinutes);
  return {
    waitingMinutes,
    lateFee,
    freeMinutesLeft,
    isLate: chargeableMinutes > 0,
  };
}

// POST /api/trips/start
// Body: { tripId, driverId }
// - Status must be "driver_arrived"
// - Calculate late fee, set status -> "ongoing", cancellationLocked=true
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
    if (trip.status !== "driver_arrived") {
      return NextResponse.json(
        { error: `يجب الإعلان عن الوصول أولاً. الحالة الحالية: ${trip.status}` },
        { status: 409 }
      );
    }

    // Calculate late fee based on waiting time
    const late = computeLateFee(trip);
    const finalPrice = (trip.finalPrice || trip.price) + late.lateFee;

    const updated = await db.trip.update({
      where: { id: tripId },
      data: {
        status: "ongoing",
        startedAt: new Date(),
        cancellationLocked: true,
        waitingMinutes: late.waitingMinutes,
        lateFee: late.lateFee,
        finalPrice,
      },
    });

    // Notify rider that trip started
    await db.notification
      .create({
        data: {
          userId: trip.userId,
          title: "بدأت الرحلة 🚀",
          message:
            late.lateFee > 0
              ? `بدأت رحلتك. رسوم الانتظار: ${late.lateFee} ريال (${late.waitingMinutes} دقيقة)`
              : "بدأت رحلتك بنجاح. لا يمكن إلغاؤها الآن.",
          type: "trip",
        },
      })
      .catch(() => {});

    // Notify admins
    const adminUsers = await db.user.findMany({ where: { isAdmin: true } });
    if (adminUsers.length > 0) {
      await db.notification.createMany({
        data: adminUsers.map((a) => ({
          userId: a.id,
          title: "🚀 بدأت الرحلة",
          message: `الرحلة ${trip.id}: ${trip.fromAddress} → ${trip.toAddress} - ${late.lateFee > 0 ? `رسوم انتظار ${late.lateFee} ر.س` : "بدون رسوم انتظار"}`,
          type: "trip",
        })),
      });
    }

    return NextResponse.json({ trip: updated, lateFee: late });
  } catch (error) {
    console.error("POST /api/trips/start error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء بدء الرحلة" }, { status: 500 });
  }
}
