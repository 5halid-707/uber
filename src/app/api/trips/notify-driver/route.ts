import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/trips/notify-driver
// Body: { tripId, fromAddress, toAddress, price }
// - Create notifications for all online approved drivers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, fromAddress, toAddress, price } = body;

    if (!tripId || !fromAddress || !toAddress) {
      return NextResponse.json(
        { error: "tripId, fromAddress, toAddress مطلوبة" },
        { status: 400 }
      );
    }

    // Find all online approved drivers
    const onlineDrivers = await db.driver.findMany({
      where: {
        isOnline: true,
        isApproved: true,
        approvalStatus: "approved",
      },
      select: { id: true, userId: true },
    });

    if (onlineDrivers.length === 0) {
      return NextResponse.json({
        notified: 0,
        message: "لا يوجد سائقون متصلون حالياً",
      });
    }

    const message =
      price != null
        ? `رحلة جديدة من ${fromAddress} إلى ${toAddress} - ${price} ريال`
        : `رحلة جديدة من ${fromAddress} إلى ${toAddress}`;

    // Send notification to each driver's user account
    await db.notification.createMany({
      data: onlineDrivers.map((d) => ({
        userId: d.userId,
        title: "🚕 طلب رحلة جديد",
        message,
        type: "new_trip",
      })),
    });

    return NextResponse.json({
      notified: onlineDrivers.length,
      tripId,
    });
  } catch (error) {
    console.error("POST /api/trips/notify-driver error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إشعار السائقين" }, { status: 500 });
  }
}
