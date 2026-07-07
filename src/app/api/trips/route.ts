import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/trips?userId=xxx | ?driverId=xxx | ?activeOnly=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const driverId = searchParams.get("driverId");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (driverId) where.driverId = driverId;
    if (activeOnly) {
      where.status = { in: ["pending", "accepted", "driver_arrived", "ongoing", "completed"] };
    }

    // Trip schema has no driver relation; fetch drivers manually
    const tripsRaw = await db.trip.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true, avatar: true, rating: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const driverIds = [...new Set(tripsRaw.map((t) => t.driverId).filter(Boolean) as string[])];
    // driverId in Trip is the USER's id, so look up Driver by userId
    const drivers = driverIds.length
      ? await db.driver.findMany({
          where: { userId: { in: driverIds } },
          select: {
            id: true,
            userId: true,
            carModel: true,
            carPlate: true,
            carColor: true,
            rating: true,
            currentLat: true,
            currentLng: true,
            user: { select: { id: true, name: true, phone: true, avatar: true } },
          },
        })
      : [];
    // Map by userId so we can match Trip.driverId (which is userId)
    const driverMap = new Map(drivers.map((d) => [d.userId, d]));
    const trips = tripsRaw.map((t) => ({
      ...t,
      driver: t.driverId ? driverMap.get(t.driverId) ?? null : null,
    }));

    return NextResponse.json(trips);
  } catch (error) {
    console.error("GET /api/trips error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الرحلات" }, { status: 500 });
  }
}

// POST /api/trips
// If tripId+action provided: update status (accept/complete/cancel)
// Otherwise: create new trip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, action } = body;

    // === Status update branch ===
    if (tripId && action) {
      const trip = await db.trip.findUnique({ where: { id: tripId } });
      if (!trip) {
        return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
      }

      let newStatus = trip.status;
      let extraData: Record<string, unknown> = {};

      if (action === "accept") {
        newStatus = "accepted";
        extraData = { acceptedAt: new Date(), driverId: body.driverId || trip.driverId };
      } else if (action === "complete") {
        newStatus = "completed";
        extraData = {
          completedAt: new Date(),
          finalPrice: body.finalPrice ?? trip.finalPrice ?? trip.price,
          paymentStatus: "paid",
        };
      } else if (action === "cancel") {
        newStatus = "cancelled";
        extraData = {
          cancelledAt: new Date(),
          cancelReason: body.reason || body.cancelReason || null,
        };
      } else {
        return NextResponse.json({ error: "إجراء غير صالح" }, { status: 400 });
      }

      const updated = await db.trip.update({
        where: { id: tripId },
        data: { status: newStatus, ...extraData },
      });

      // Notify rider about status change
      await db.notification
        .create({
          data: {
            userId: trip.userId,
            title: "تحديث حالة الرحلة",
            message: `تم تحديث حالة رحلتك إلى: ${newStatus}`,
            type: "trip",
          },
        })
        .catch(() => {});

      return NextResponse.json(updated);
    }

    // === Create new trip branch ===
    const {
      userId,
      serviceType = "ride",
      fromAddress,
      toAddress,
      distance = 0,
      duration = 0,
      price,
      paymentMethod = "cash",
      fromLat,
      fromLng,
      toLat,
      toLng,
      fromCity,
      toCity,
      surgeMultiplier = 1,
      basePrice,
    } = body;

    if (!userId || !fromAddress || !toAddress) {
      return NextResponse.json(
        { error: "بيانات غير مكتملة: userId, fromAddress, toAddress مطلوبة" },
        { status: 400 }
      );
    }

    const finalPrice = typeof price === "number" ? price : 0;

    const trip = await db.trip.create({
      data: {
        userId,
        serviceType,
        fromAddress,
        toAddress,
        fromCity: fromCity || null,
        toCity: toCity || null,
        fromLat: fromLat ?? null,
        fromLng: fromLng ?? null,
        toLat: toLat ?? null,
        toLng: toLng ?? null,
        distance: Number(distance) || 0,
        duration: Number(duration) || 0,
        price: finalPrice,
        finalPrice,
        basePrice: basePrice ?? finalPrice,
        surgeMultiplier: Number(surgeMultiplier) || 1,
        paymentMethod,
        status: "pending",
        paymentStatus: "pending",
      },
      include: {
        user: { select: { id: true, name: true, phone: true, avatar: true } },
      },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الرحلة" }, { status: 500 });
  }
}
