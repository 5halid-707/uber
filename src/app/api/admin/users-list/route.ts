import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");
    const filter = searchParams.get("filter") || "all";

    if (adminId) {
      const admin = await db.user.findUnique({ where: { id: adminId } });
      if (!admin?.isAdmin) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      }
    }

    let where: any = {};
    if (filter === "blocked") where = { isBlocked: true };
    else if (filter === "riders") where = { isDriver: false, isAdmin: false };
    else if (filter === "drivers") where = { isDriver: true };

    const users = await db.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true,
        city: true, region: true, isDriver: true, isAdmin: true,
        isBlocked: true, isVerified: true, rating: true, tripsCount: true,
        walletBalance: true, currentLat: true, currentLng: true,
        blockedAt: true, blockReason: true,  createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const driverUserIds = users.filter((u) => u.isDriver).map((u) => u.id);
    const drivers = driverUserIds.length > 0
      ? await db.driver.findMany({
          where: { userId: { in: driverUserIds } },
          select: { userId: true, carModel: true, carPlate: true, carColor: true, isOnline: true, isApproved: true, approvalStatus: true, rating: true, tripsCount: true, earnings: true },
        })
      : [];
    const driverMap = new Map(drivers.map((d) => [d.userId, d]));

    return NextResponse.json(users.map((u) => ({ ...u, driverInfo: driverMap.get(u.id) || null })));
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
