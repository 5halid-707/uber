import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/trips/accept
// Body: { tripId, driverId }
// - Verify trip is still pending
// - Verify driver is approved and online
// - Update trip status -> "accepted", set driverId, acceptedAt
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
    if (trip.status !== "pending") {
      return NextResponse.json(
        { error: `لا يمكن قبول الرحلة. الحالة الحالية: ${trip.status}` },
        { status: 409 }
      );
    }

    // driverId is the USER's id - find Driver by userId
    const driver = await db.driver.findUnique({ where: { userId: driverId } });
    if (!driver) {
      return NextResponse.json({ error: "السائق غير موجود" }, { status: 404 });
    }
    if (!driver.isApproved || driver.approvalStatus !== "approved") {
      return NextResponse.json({ error: "السائق غير معتمد بعد" }, { status: 403 });
    }
    if (!driver.isOnline) {
      return NextResponse.json({ error: "السائق غير متصل بالإنترنت" }, { status: 403 });
    }

    // Atomic update with conditional check to avoid race conditions
    const res = await db.trip.updateMany({
      where: { id: tripId, status: "pending" },
      data: {
        status: "accepted",
        driverId,
        acceptedAt: new Date(),
      },
    });

    if (res.count === 0) {
      return NextResponse.json(
        { error: "تم قبول الرحلة من قبل سائق آخر" },
        { status: 409 }
      );
    }

    const updated = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        user: { select: { id: true, name: true, phone: true, avatar: true } },
      },
    });
    const driverData = await db.driver.findUnique({
      where: { userId: driverId },
      select: {
        id: true,
        carModel: true,
        carPlate: true,
        carColor: true,
        rating: true,
        currentLat: true,
        currentLng: true,
        user: { select: { id: true, name: true, phone: true, avatar: true } },
      },
    });
    const tripWithDriver = updated ? { ...updated, driver: driverData } : null;

    // Notify rider
    await db.notification
      .create({
        data: {
          userId: trip.userId,
          title: "تم قبول رحلتك! 🚗",
          message: `السائق في طريقه إليك. السيارة: ${driver.carModel} - ${driver.carPlate}`,
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
          title: "🚗 تم قبول رحلة",
          message: `السائق ${driverData?.user?.name || "سائق"} قبل الرحلة ${trip.id}: ${trip.fromAddress} → ${trip.toAddress}`,
          type: "trip",
        })),
      });
    }

    return NextResponse.json(tripWithDriver);
  } catch (error) {
    console.error("POST /api/trips/accept error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء قبول الرحلة" }, { status: 500 });
  }
}
