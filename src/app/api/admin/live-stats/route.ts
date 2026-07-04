import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  // Today's range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // This week range
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  // This month range
  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);

  const [
    todayUsers,
    weekUsers,
    monthUsers,
    totalUsers,
    todayListings,
    weekListings,
    totalListings,
    activeListings,
    todayPayments,
    weekRevenue,
    monthRevenue,
    totalRevenue,
    pendingTxns,
    pendingWithdrawals,
    pendingDeposits,
    activeCoupons,
    totalAffiliates,
    pendingAffiliatePayouts,
    onlineUsersLast5Min,
  ] = await Promise.all([
    db.user.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    db.user.count({ where: { createdAt: { gte: weekStart } } }),
    db.user.count({ where: { createdAt: { gte: monthStart } } }),
    db.user.count(),
    db.listing.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    db.listing.count({ where: { createdAt: { gte: weekStart } } }),
    db.listing.count(),
    db.listing.count({ where: { status: "active" } }),
    db.payment.count({ where: { createdAt: { gte: todayStart, lte: todayEnd }, status: "completed" } }),
    db.payment.aggregate({
      where: { createdAt: { gte: weekStart }, status: "completed" },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { createdAt: { gte: monthStart }, status: "completed" },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
    }),
    db.transaction.count({ where: { status: "pending" } }),
    db.transaction.aggregate({
      where: { status: "pending", type: "withdrawal" },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { status: "pending", type: "deposit" },
      _sum: { amount: true },
    }),
    db.coupon.count({ where: { isActive: true } }),
    db.user.count({ where: { affiliateCode: { not: null } } }),
    db.affiliateEarning.aggregate({
      where: { status: "pending" },
      _sum: { amount: true },
    }),
    db.activityLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        action: { in: ["login", "login_google", "register", "register_google", "listing_create", "payment_featured", "payment_topup"] },
      },
    }),
  ]);

  // Recent activities (last 10)
  const recentActivities = await db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      user: { select: { username: true } },
    },
  });

  return NextResponse.json({
    live: {
      onlineUsersLast5Min,
      pendingTxns,
      pendingWithdrawalsAmount: pendingWithdrawals._sum.amount || 0,
      pendingDepositsAmount: pendingDeposits._sum.amount || 0,
      pendingAffiliatePayouts: pendingAffiliatePayouts._sum.amount || 0,
    },
    growth: {
      users: { today: todayUsers, week: weekUsers, month: monthUsers, total: totalUsers },
      listings: { today: todayListings, week: weekListings, month: 0, total: totalListings, active: activeListings },
      revenue: {
        todayPaymentsCount: todayPayments,
        week: weekRevenue._sum.amount || 0,
        month: monthRevenue._sum.amount || 0,
        total: totalRevenue._sum.amount || 0,
      },
    },
    marketing: {
      activeCoupons,
      totalAffiliates,
    },
    recentActivities,
  });
}
