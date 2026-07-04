import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const referrals = await db.user.findMany({
    where: { referredById: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      _count: { select: { listings: true, payments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const earnings = await db.affiliateEarning.findMany({
    where: { affiliateId: user.id },
    include: {
      referred: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEarnings = earnings
    .filter((e) => e.status === "pending" || e.status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);
  const paidEarnings = earnings
    .filter((e) => e.status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingEarnings = earnings
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + e.amount, 0);

  // Generate referral link
  const referralLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}?ref=${user.affiliateCode || ""}`;

  return NextResponse.json({
    affiliateCode: user.affiliateCode,
    referralLink,
    referrals,
    earnings,
    stats: {
      totalReferrals: referrals.length,
      totalEarnings,
      paidEarnings,
      pendingEarnings,
    },
  });
}
