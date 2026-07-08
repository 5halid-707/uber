import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, driverId, cashReceived = 0, paymentNote } = body;

    if (!tripId || !driverId) {
      return NextResponse.json({ error: "tripId و driverId مطلوبان" }, { status: 400 });
    }

    const trip = await db.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
    if (trip.driverId !== driverId) return NextResponse.json({ error: "غير مصرح لهذا السائق" }, { status: 403 });
    if (trip.status === "completed") return NextResponse.json({ error: "الرحلة مكتملة بالفعل" }, { status: 409 });

    const finalPrice = trip.finalPrice || trip.price;
    const received = Number(cashReceived) || 0;
    const unpaidAmount = Math.max(0, Math.round((finalPrice - received) * 100) / 100);

    let walletDeducted = 0;
    let unpaidReportedToAdmin = false;

    if (unpaidAmount > 0) {
      const rider = await db.user.findUnique({ where: { id: trip.userId } });
      if (rider && rider.walletBalance >= unpaidAmount) {
        await db.user.update({ where: { id: trip.userId }, data: { walletBalance: { decrement: unpaidAmount } } });
        walletDeducted = unpaidAmount;
        await db.transaction.create({ data: { userId: trip.userId, type: "trip_payment", amount: unpaidAmount, description: `خصم من المحفظة لرحلة غير مدفوعة (${trip.id})`, status: "completed", tripId: trip.id } });
      } else {
        unpaidReportedToAdmin = true;
        const admins = await db.user.findMany({ where: { isAdmin: true } });
        if (admins.length > 0) {
          await db.notification.createMany({ data: admins.map((a) => ({ userId: a.id, title: "🚨 مبلغ غير محصّل", message: `رحلة ${trip.id} بقيمة ${finalPrice} ريال، استلم السائق ${received} ريال، المبلغ المتبقي ${unpaidAmount} ريال غير محصّل.`, type: "unpaid_trip" })) });
        }
      }
    }

    const stillUnpaid = Math.max(0, unpaidAmount - walletDeducted);

    const updated = await db.trip.update({ where: { id: tripId }, data: { status: "completed", completedAt: new Date(), cashReceived: received, unpaidAmount: stillUnpaid, paymentConfirmed: stillUnpaid === 0, unpaidReportedToAdmin, paymentStatus: stillUnpaid === 0 ? "paid" : "partially_paid", finalPrice } });

    // نظام العمولة والضريبة
    const VAT_RATE = 0.15;
    const COMMISSION_RATE = 0.15;
    const basePrice = trip.price || 0;
    const vatAmount = Math.round(basePrice * VAT_RATE * 100) / 100;
    const commissionAmount = Math.round(basePrice * COMMISSION_RATE * 100) / 100;
    const driverEarnings = Math.round((basePrice - commissionAmount) * 100) / 100;

    await db.driver.update({ where: { userId: driverId }, data: { earnings: { increment: driverEarnings }, tripsCount: { increment: 1 } } }).catch(() => {});

    if (driverEarnings > 0) {
      await db.user.update({ where: { id: driverId }, data: { walletBalance: { increment: driverEarnings } } }).catch(() => {});
      await db.transaction.create({ data: { userId: driverId, type: "trip_earnings", amount: driverEarnings, description: `أرباح رحلة ${trip.id} (بعد عمولة 15%)`, status: "completed", tripId: trip.id } }).catch(() => {});
    }

    if (commissionAmount > 0) {
      const admins = await db.user.findMany({ where: { isAdmin: true } });
      if (admins.length > 0) {
        await db.transaction.create({ data: { userId: admins[0].id, type: "commission", amount: commissionAmount, description: `عمولة 15% من رحلة ${trip.id}`, status: "completed", tripId: trip.id } }).catch(() => {});
      }
    }

    await db.user.update({ where: { id: trip.userId }, data: { tripsCount: { increment: 1 } } }).catch(() => {});

    if (received > 0) {
      await db.transaction.create({ data: { userId: trip.userId, type: "trip_payment", amount: received, description: paymentNote ? `دفع رحلة (${trip.id}) - ${paymentNote}` : `دفع رحلة (${trip.id})`, status: "completed", tripId: trip.id } });
    }

    await db.notification.create({ data: { userId: trip.userId, title: "اكتملت رحلتك ✅", message: stillUnpaid > 0 ? `اكتملت الرحلة. المبلغ المتبقي ${stillUnpaid} ريال سيتم تحصيله لاحقاً.` : `اكتملت رحلتك بنجاح. شكراً لاستخدامك خدماتنا!`, type: "trip" } }).catch(() => {});

    return NextResponse.json({
      trip: updated,
      summary: { finalPrice, basePrice, vatAmount, cashReceived: received, walletDeducted, unpaidAmount: stillUnpaid, unpaidReportedToAdmin, commissionAmount, driverEarnings },
      message: stillUnpaid > 0 ? `اكتملت الرحلة. مبلغ غير محصّل: ${stillUnpaid} ر.س` : `اكتملت الرحلة! أرباحك: ${driverEarnings} ر.س (بعد عمولة ${commissionAmount} ر.س). شامل ضريبة ${vatAmount} ر.س`,
    });
  } catch (error) {
    console.error("POST /api/trips/complete-payment error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إتمام الدفع" }, { status: 500 });
  }
}
