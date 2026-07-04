import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const [
    totalUsers,
    totalListings,
    activeListings,
    featuredListings,
    totalComments,
    pendingTransactions,
    completedTransactions,
    totalTransactionsAmount,
    usersList,
    recentListings,
  ] = await Promise.all([
    db.user.count(),
    db.listing.count(),
    db.listing.count({ where: { status: "active" } }),
    db.listing.count({ where: { isFeatured: true } }),
    db.comment.count(),
    db.transaction.count({ where: { status: "pending" } }),
    db.transaction.count({ where: { status: "completed" } }),
    db.transaction.aggregate({
      where: { status: "completed", type: { in: ["payment_in", "deposit"] } },
      _sum: { amount: true },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        username: true,
        phone: true,
        city: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { listings: true } },
      },
    }),
    db.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { username: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalUsers,
      totalListings,
      activeListings,
      featuredListings,
      totalComments,
      pendingTransactions,
      completedTransactions,
      totalRevenue: totalTransactionsAmount._sum.amount || 0,
    },
    recentUsers: usersList,
    recentListings,
  });
}
