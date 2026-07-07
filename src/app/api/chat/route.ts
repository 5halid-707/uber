import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/chat?tripId=xxx&userId=xxx
// - Returns messages for the trip
// - Marks messages where receiverId == userId as read
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");
    const userId = searchParams.get("userId");

    if (!tripId) {
      return NextResponse.json({ error: "tripId مطلوب" }, { status: 400 });
    }

    const messages = await db.chatMessage.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    // Mark messages sent to this user as read
    if (userId) {
      await db.chatMessage
        .updateMany({
          where: { tripId, receiverId: userId, isRead: false },
          data: { isRead: true },
        })
        .catch(() => {});
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الرسائل" }, { status: 500 });
  }
}

// POST /api/chat
// Body: { tripId, senderId, receiverId, message, messageType?, fileData?, fileName? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tripId,
      senderId,
      receiverId,
      message,
      messageType = "text",
      fileData,
      fileName,
    } = body;

    if (!tripId || !senderId || !receiverId) {
      return NextResponse.json(
        { error: "tripId, senderId, receiverId مطلوبة" },
        { status: 400 }
      );
    }

    if (messageType === "text" && (!message || !message.trim())) {
      return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });
    }

    const msg = await db.chatMessage.create({
      data: {
        tripId,
        senderId,
        receiverId,
        message: message || null,
        messageType,
        fileData: fileData || null,
        fileName: fileName || null,
        isRead: false,
      },
    });

    // Notify receiver
    await db.notification
      .create({
        data: {
          userId: receiverId,
          title: "رسالة جديدة 💬",
          message:
            messageType === "text"
              ? message.substring(0, 100)
              : `ملف: ${fileName || "مرفق"}`,
          type: "chat",
        },
      })
      .catch(() => {});

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إرسال الرسالة" }, { status: 500 });
  }
}
