import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, username, content, phone } = body;

    if (!listingId || !username || !content) {
      return NextResponse.json(
        { error: "بيانات ناقصة" },
        { status: 400 }
      );
    }

    // Get listing owner for notification
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true, userId: true },
    });

    const comment = await db.comment.create({
      data: {
        listingId,
        username,
        content,
        phone,
      },
    });

    // Send notification to listing owner
    if (listing && listing.userId) {
      await createNotification({
        userId: listing.userId,
        type: "comment",
        title: "تعليق جديد على إعلانك 💬",
        message: `${username} علّق على إعلانك "${listing.title}": ${content.slice(0, 60)}${content.length > 60 ? "..." : ""}`,
        link: listingId,
        relatedId: comment.id,
        relatedType: "comment",
      });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
