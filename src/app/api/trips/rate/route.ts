import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, fromUserId, toUserId, rating, review, ratedBy } = body;

    if (!tripId || !fromUserId || !toUserId || !rating) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const ratingVal = parseInt(rating);
    const reviewText = review || null;

    // Update trip with rating (if trip exists)
    if (ratedBy === "rider") {
      try { await db.trip.update({ where: { id: tripId }, data: { rating: ratingVal, review: reviewText } }); } catch {}
    }

    const targetUser = await db.user.findUnique({ where: { id: toUserId } });
    if (targetUser && targetUser.tripsCount > 0) {
      const newRating = ((targetUser.rating * targetUser.tripsCount) + ratingVal) / (targetUser.tripsCount + 1);
      await db.user.update({ where: { id: toUserId }, data: { rating: Math.round(newRating * 10) / 10 } });
    }

    const driver = await db.driver.findUnique({ where: { userId: toUserId } });
    if (driver && driver.tripsCount > 0) {
      const newRating = ((driver.rating * driver.tripsCount) + ratingVal) / (driver.tripsCount + 1);
      await db.driver.update({ where: { userId: toUserId }, data: { rating: Math.round(newRating * 10) / 10 } });
    }

    // Notify admin
    const fromUser = await db.user.findUnique({ where: { id: fromUserId } });
    const admins = await db.user.findMany({ where: { isAdmin: true } });
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: `⭐ تقييم جديد (${ratingVal} نجوم)`,
          message: `${fromUser?.name || "مستخدم"} قيّم ${targetUser?.name || "مستخدم"} بـ ${ratingVal} نجوم${reviewText ? ` - "${reviewText}"` : ""}`,
          type: "system",
        },
      });
    }

    return NextResponse.json({ success: true, message: "تم التقييم بنجاح" });
  } catch (error) {
    console.error("Rating error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
