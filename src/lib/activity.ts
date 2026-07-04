import { db } from "@/lib/db";
import { headers } from "next/headers";

export type ActivityAction =
  | "login"
  | "login_google"
  | "register"
  | "register_google"
  | "logout"
  | "listing_create"
  | "listing_update"
  | "listing_delete"
  | "comment_create"
  | "favorite_add"
  | "favorite_remove"
  | "payment_featured"
  | "payment_topup"
  | "withdrawal_request"
  | "withdrawal_approve"
  | "withdrawal_reject"
  | "deposit_request"
  | "deposit_approve"
  | "deposit_reject"
  | "coupon_create"
  | "coupon_redeem"
  | "user_verify"
  | "user_promote_admin"
  | "user_delete"
  | "settings_update"
  | "bank_account_add"
  | "bank_account_delete";

export async function logActivity({
  userId,
  action,
  description,
  metadata,
}: {
  userId?: string | null;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null;
    const userAgent = headersList.get("user-agent") || null;

    await db.activityLog.create({
      data: {
        userId: userId || null,
        action,
        description,
        ipAddress,
        userAgent,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
