import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (status !== "all") where.status = status;
  if (type) where.type = type;

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          phone: true,
          email: true,
          city: true,
        },
      },
      bankAccount: {
        select: {
          bankName: true,
          accountName: true,
          iban: true,
          accountNumber: true,
        },
      },
      processedBy: {
        select: { username: true },
      },
    },
  });

  // Summary stats
  const pending = transactions.filter((t) => t.status === "pending");
  const pendingWithdrawals = pending
    .filter((t) => t.type === "withdrawal")
    .reduce((acc, t) => acc + t.amount, 0);
  const pendingDeposits = pending
    .filter((t) => t.type === "deposit")
    .reduce((acc, t) => acc + t.amount, 0);

  return NextResponse.json({
    transactions,
    stats: {
      pendingCount: pending.length,
      pendingWithdrawals,
      pendingDeposits,
    },
  });
}
