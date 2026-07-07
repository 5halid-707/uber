import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/drivers/active-trip?driverId=xxx
// driverId here is the USER's id (not Driver.id)
// Returns: { activeTrip, availableTrips, isOnline, isApproved }
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");

    if (!driverId) {
      return NextResponse.json({ error: "driverId مطلوب" }, { status: 400 });
    }

    // driverId is the USER's id - find Driver by userId
    const driver = await db.driver.findUnique({ where: { userId: driverId } });
    if (!driver) {
      return NextResponse.json({ error: "السائق غير موجود" }, { status: 404 });
    }

    // Active trip = any trip assigned to this driver (by userId) that's not completed/cancelled
    const activeTrip = await db.trip.findFirst({
      where: {
        driverId, // This is the userId of the driver
        status: { in: ["accepted", "driver_arrived", "ongoing"] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            rating: true,
            currentLat: true,
            currentLng: true,
          },
        },
      },
      orderBy: { acceptedAt: "desc" },
    });

    // Available trips = pending trips not yet accepted
    let availableTrips: any[] = [];
    if (!activeTrip && driver.isApproved && driver.isOnline) {
      availableTrips = await db.trip.findMany({
        where: { status: "pending", driverId: null },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true,
              rating: true,
              currentLat: true,
              currentLng: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      });
    }

    return NextResponse.json({
      activeTrip,
      availableTrips,
      isOnline: driver.isOnline,
      isApproved: driver.isApproved,
      driverInfo: {
        carModel: driver.carModel,
        carPlate: driver.carPlate,
        carColor: driver.carColor,
        rating: driver.rating,
        tripsCount: driver.tripsCount,
        earnings: driver.earnings,
      },
    });
  } catch (error) {
    console.error("GET /api/drivers/active-trip error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الرحلة النشطة" }, { status: 500 });
  }
}
