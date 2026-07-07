import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/trips/cancel-request
// Body: { tripId, requestedBy, reason }
// - If cancellationLocked=false: direct cancel (status -> "cancelled", cancelReason, cancelledAt)
// - If cancellationLocked=true: create a request for admin (cancellationRequest="requested")
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, requestedBy, reason } = body;

    if (!tripId || !requestedBy) {
      return NextResponse.json({ error: "tripId و requestedBy مطلوبان" }, { status: 400 });
    }

    const trip = await db.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
    }
    if (["completed", "cancelled"].includes(trip.status)) {
      return NextResponse.json(
        { error: `لا يمكن إلغاء رحلة بحالة ${trip.status}` },
        { status: 409 }
      );
    }

    // Authorization: requestedBy must be the rider or the driver of this trip
    const isRider = trip.userId === requestedBy;
    const isDriver = !!trip.driverId && trip.driverId === requestedBy;
    if (!isRider && !isDriver) {
      return NextResponse.json({ error: "غير مصرح بإلغاء هذه الرحلة" }, { status: 403 });
    }

    if (!trip.cancellationLocked) {
      // Direct cancel
      const updated = await db.trip.update({
        where: { id: tripId },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason: reason || null,
          cancellationReason: reason || null,
        },
      });

      // Notify the other party
      const otherUserId = isRider ? null : trip.userId;
      if (otherUserId) {
        await db.notification
          .create({
            data: {
              userId: otherUserId,
              title: "تم إلغاء الرحلة ❌",
              message: reason
                ? `ألغى الراكب الرحلة. السبب: ${reason}`
                : "ألغى الراكب الرحلة.",
              type: "trip",
            },
          })
          .catch(() => {});
      }

      return NextResponse.json({
        trip: updated,
        outcome: "cancelled",
        message: "تم إلغاء الرحلة مباشرةً",
      });
    }

    // Locked: create admin request
    const updated = await db.trip.update({
      where: { id: tripId },
      data: {
        cancellationRequest: "requested",
        cancellationReason: reason || null,
      },
    });

    // Notify all admins
    const admins = await db.user.findMany({ where: { isAdmin: true } });
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          title: "🔔 طلب إلغاء رحلة",
          message: `طلب ${isRider ? "الراكب" : "السائق"} إلغاء الرحلة ${trip.id}${reason ? ` - السبب: ${reason}` : ""}`,
          type: "cancellation_request",
        })),
      });
    }

    return NextResponse.json({
      trip: updated,
      outcome: "request_created",
      message: "تم إنشاء طلب إلغاء وسيتم مراجعته من قبل الإدارة",
    });
  } catch (error) {
    console.error("POST /api/trips/cancel-request error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء طلب الإلغاء" }, { status: 500 });
  }
}
