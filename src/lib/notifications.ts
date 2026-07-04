import { db } from "@/lib/db";

export type NotificationType =
  | "transaction"
  | "comment"
  | "favorite"
  | "system"
  | "payment"
  | "listing";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  relatedId,
  relatedType,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  relatedType?: string;
}) {
  try {
    return await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
        relatedId: relatedId || null,
        relatedType: relatedType || null,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
