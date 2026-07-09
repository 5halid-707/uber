import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = verifyAdmin(req);
    if (!user) return NextResponse.json({ error: error || "غير مصرح" }, { status: 401 });
    const [totalUsers, totalDrivers, pendingDrivers, approvedDrivers, totalTrips, completedTrips, activeTrips, cancelledTrips, unpaidTripsCount, revenueAgg, unpaidAgg] = await Promise.all([
      db.user.count({ where: { isAdmin: false } }), db.driver.count(), db.driver.count({ where: { approvalStatus: "pending" } }), db.driver.count({ where: { isApproved: true } }),
      db.trip.count(), db.trip.count({ where: { status: "completed" } }), db.trip.count({ where: { status: { in: ["pending", "accepted", "driver_arrived", "ongoing"] } } }),
      db.trip.count({ where: { status: "cancelled" } }), db.trip.count({ where: { unpaidAmount: { gt: 0 } } }),
      db.trip.aggregate({ where: { status: "completed" }, _sum: { finalPrice: true } }),
      db.trip.aggregate({ where: { unpaidAmount: { gt: 0 } }, _sum: { unpaidAmount: true } }),
    ]);
    return NextResponse.json({
      totalUsers, totalDrivers, pendingDrivers, approvedDrivers, totalTrips, completedTrips, activeTrips, cancelledTrips,
      unpaidTrips: unpaidTripsCount, totalRevenue: revenueAgg._sum.finalPrice || 0, totalUnpaid: unpaidAgg._sum.unpaidAmount || 0,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإحصائيات" }, { status: 500 });
  }
}
