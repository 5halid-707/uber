import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { user: authUser, error: authError } = verifyAuth(request);
    if (!authUser) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");
    const userId = searchParams.get("userId") || authUser.userId;

    if (!tripId) {
      return NextResponse.json({ error: "tripId مطلوب" }, { status: 400 });
    }
    if (userId !== authUser.userId && !authUser.isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    const messages = await db.chatMessage.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

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

export async function POST(request: NextRequest) {
  try {
    const { user: authUser, error: authError } = verifyAuth(request);
    if (!authUser) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

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
      return NextResponse.json({ error: "tripId, senderId, receiverId مطلوبة" }, { status: 400 });
    }
    if (senderId !== authUser.userId && receiverId !== authUser.userId && !authUser.isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

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
