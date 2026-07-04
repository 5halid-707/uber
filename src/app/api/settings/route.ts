import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const settings = await db.siteSettings.findFirst({
    select: {
      siteName: true,
      adminPhone: true,
      adminWhatsApp: true,
      adminEmail: true,
      adminCity: true,
      // For payment: show admin's bank info so users can transfer to it
      adminBankName: true,
      adminAccountName: true,
      adminIBAN: true,
      adminAccountNumber: true,
      featuredPrice: true,
      withdrawalFee: true,
      minWithdrawal: true,
      welcomeMessage: true,
    },
  });

  return NextResponse.json({ settings });
}
