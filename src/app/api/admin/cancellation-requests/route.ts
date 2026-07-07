import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/cancellation-requests?adminId=xxx
// - Lists trips where cancellationRequest === "requested"
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
      where: { cancellationRequest: "requested" },
      include: {
        user: { select: { id: true, name: true, phone: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ trips, count: trips.length });
  } catch (error) {
    console.error("GET /api/admin/cancellation-requests error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب طلبات الإلغاء" }, { status: 500 });
  }
}

// POST /api/admin/cancellation-requests
// Body: { tripId, adminId, action: "approve" | "reject", adminNote? }
// - approve: cancel the trip
// - reject: keep trip ongoing, clear cancellationRequest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, adminId, action, adminNote } = body;

    if (!tripId || !adminId || !action) {
      return NextResponse.json(
        { error: "tripId, adminId, action مطلوبة" },
        { status: 400 }
      );
    }

    const admin = await db.user.findUnique({ where: { id: adminId } });
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const trip = await db.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
    }

    let updated;
    if (action === "approve") {
      updated = await db.trip.update({
        where: { id: tripId },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason: `إلغاء بقرار الإدارة: ${adminNote || "موافقة على طلب الإلغاء"}`,
          cancellationRequest: "approved",
        },
      });

      // Notify rider and driver
      const notifyTargets = [trip.userId];
      if (trip.driverId) {
        const driver = await db.driver.findUnique({
          where: { id: trip.driverId },
          select: { userId: true },
        });
        if (driver) notifyTargets.push(driver.userId);
      }
      await db.notification.createMany({
        data: notifyTargets.map((uid) => ({
          userId: uid,
          title: "تم إلغاء الرحلة بقرار الإدارة",
          message: adminNote || "تمت الموافقة على طلب الإلغاء من قبل الإدارة.",
          type: "cancellation_request",
        })),
      });
    } else if (action === "reject") {
      updated = await db.trip.update({
        where: { id: tripId },
        data: {
          cancellationRequest: "rejected",
          cancellationReason: trip.cancellationReason,
        },
      });

      // Notify requester
      await db.notification.create({
        data: {
          userId: trip.userId,
          title: "تم رفض طلب الإلغاء",
          message: adminNote || "تم رفض طلب إلغاء الرحلة من قبل الإدارة. الرحلة مستمرة.",
          type: "cancellation_request",
        },
      });
    } else {
      return NextResponse.json({ error: "action يجب أن تكون approve أو reject" }, { status: 400 });
    }

    return NextResponse.json({ trip: updated });
  } catch (error) {
    console.error("POST /api/admin/cancellation-requests error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة طلب الإلغاء" }, { status: 500 });
  }
}
