import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/drivers?online=true
// - Returns approved drivers (optionally only online ones)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const online = searchParams.get("online");
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = { isApproved: true, approvalStatus: "approved" };
    if (online === "true") where.isOnline = true;
    if (userId) where.userId = userId;

    const drivers = await db.driver.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            rating: true,
            isBlocked: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("GET /api/drivers error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب السائقين" }, { status: 500 });
  }
}

// PATCH /api/drivers
// Body: { driverId, isOnline }  (driverId here is the userId)
// - Toggles online status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, isOnline } = body;

    if (!driverId) {
      return NextResponse.json({ error: "driverId مطلوب" }, { status: 400 });
    }

    // driverId is userId - find the driver record
    const driver = await db.driver.findUnique({ where: { userId: driverId } });
    if (!driver) {
      return NextResponse.json({ error: "السائق غير موجود" }, { status: 404 });
    }
    if (!driver.isApproved) {
      return NextResponse.json(
        { error: "لا يمكن تغيير الحالة: السائق غير معتمد" },
        { status: 403 }
      );
    }

    const updated = await db.driver.update({
      where: { userId: driverId },
      data: { isOnline: !!isOnline },
    });

    return NextResponse.json({ driver: updated });
  } catch (error) {
    console.error("PATCH /api/drivers error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث حالة السائق" }, { status: 500 });
  }
}
