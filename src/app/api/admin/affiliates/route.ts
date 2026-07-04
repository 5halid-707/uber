import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  // Get all affiliates (users who have referrals or earnings)
  const affiliates = await db.user.findMany({
    where: {
      OR: [
        { referrals: { some: {} } },
        { affiliateEarnings: { some: {} } },
      ],
    },
    include: {
      referrals: {
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          _count: { select: { listings: true, payments: true } },
        },
      },
      affiliateEarnings: {
        include: {
          referred: { select: { username: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats per affiliate
  const affiliatesWithStats = affiliates.map((a) => {
    const totalEarnings = a.affiliateEarnings
      .filter((e) => e.status === "pending" || e.status === "paid")
      .reduce((sum, e) => sum + e.amount, 0);
    const paidEarnings = a.affiliateEarnings
      .filter((e) => e.status === "paid")
      .reduce((sum, e) => sum + e.amount, 0);
    const pendingEarnings = a.affiliateEarnings
      .filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      id: a.id,
      username: a.username,
      email: a.email,
      affiliateCode: a.affiliateCode,
      referralsCount: a.referrals.length,
      totalEarnings,
      paidEarnings,
      pendingEarnings,
      referrals: a.referrals,
      recentEarnings: a.affiliateEarnings.slice(0, 5),
    };
  });

  // Overall stats
  const totalAffiliates = affiliatesWithStats.length;
  const totalReferrals = affiliatesWithStats.reduce((sum, a) => sum + a.referralsCount, 0);
  const totalPaidOut = affiliatesWithStats.reduce((sum, a) => sum + a.paidEarnings, 0);
  const totalPending = affiliatesWithStats.reduce((sum, a) => sum + a.pendingEarnings, 0);

  return NextResponse.json({
    affiliates: affiliatesWithStats,
    stats: {
      totalAffiliates,
      totalReferrals,
      totalPaidOut,
      totalPending,
    },
  });
}
