import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

  // Get all transactions and payments for the year
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);

  const [transactions, payments] = await Promise.all([
    db.transaction.findMany({
      where: {
        createdAt: { gte: startOfYear, lt: endOfYear },
        status: "completed",
      },
      select: {
        type: true,
        amount: true,
        createdAt: true,
      },
    }),
    db.payment.findMany({
      where: {
        createdAt: { gte: startOfYear, lt: endOfYear },
        status: "completed",
      },
      select: {
        amount: true,
        method: true,
        purpose: true,
        createdAt: true,
      },
    }),
  ]);

  // Build monthly report (12 months)
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];

  const monthlyData = months.map((monthName, idx) => {
    const monthStart = new Date(year, idx, 1);
    const monthEnd = new Date(year, idx + 1, 1);

    const monthTxns = transactions.filter((t) => {
      const d = new Date(t.createdAt);
      return d >= monthStart && d < monthEnd;
    });
    const monthPayments = payments.filter((p) => {
      const d = new Date(p.createdAt);
      return d >= monthStart && d < monthEnd;
    });

    const deposits = monthTxns
      .filter((t) => t.type === "deposit")
      .reduce((acc, t) => acc + t.amount, 0);
    const withdrawals = monthTxns
      .filter((t) => t.type === "withdrawal")
      .reduce((acc, t) => acc + t.amount, 0);
    const electronicPayments = monthPayments.reduce((acc, p) => acc + p.amount, 0);

    // Revenue: featured listing payments + withdrawal fees
    const featuredRevenue = monthPayments
      .filter((p) => p.purpose === "featured_listing")
      .reduce((acc, p) => acc + p.amount, 0);

    return {
      month: monthName,
      monthIndex: idx + 1,
      deposits,
      withdrawals,
      electronicPayments,
      featuredRevenue,
      totalRevenue: featuredRevenue,
      transactionsCount: monthTxns.length + monthPayments.length,
    };
  });

  // Payment method breakdown
  const methodBreakdown: Record<string, { count: number; amount: number }> = {};
  payments.forEach((p) => {
    if (!methodBreakdown[p.method]) {
      methodBreakdown[p.method] = { count: 0, amount: 0 };
    }
    methodBreakdown[p.method].count++;
    methodBreakdown[p.method].amount += p.amount;
  });

  // Yearly totals
  const totals = monthlyData.reduce(
    (acc, m) => ({
      deposits: acc.deposits + m.deposits,
      withdrawals: acc.withdrawals + m.withdrawals,
      electronicPayments: acc.electronicPayments + m.electronicPayments,
      featuredRevenue: acc.featuredRevenue + m.featuredRevenue,
      totalRevenue: acc.totalRevenue + m.totalRevenue,
      transactionsCount: acc.transactionsCount + m.transactionsCount,
    }),
    { deposits: 0, withdrawals: 0, electronicPayments: 0, featuredRevenue: 0, totalRevenue: 0, transactionsCount: 0 }
  );

  // Available years (since earliest transaction/payment)
  const allDates = [
    ...transactions.map((t) => new Date(t.createdAt)),
    ...payments.map((p) => new Date(p.createdAt)),
  ];
  const availableYears = allDates.length > 0
    ? Array.from(
        new Set(allDates.map((d) => d.getFullYear()))
      ).sort((a, b) => b - a)
    : [new Date().getFullYear()];

  return NextResponse.json({
    year,
    monthlyData,
    methodBreakdown,
    totals,
    availableYears,
  });
}
