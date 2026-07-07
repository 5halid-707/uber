import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/trips/complete-payment
// Body: { tripId, driverId, cashReceived, paymentNote? }
// - Calculate unpaidAmount = finalPrice - cashReceived
// - If unpaid > 0: deduct from rider wallet, notify admin, create transaction
// - Set status -> "completed", cashReceived, unpaidAmount, paymentConfirmed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, driverId, cashReceived = 0, paymentNote } = body;

    if (!tripId || !driverId) {
      return NextResponse.json({ error: "tripId و driverId مطلوبان" }, { status: 400 });
    }

    const trip = await db.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
    }
    if (trip.driverId !== driverId) {
      return NextResponse.json({ error: "غير مصرح لهذا السائق" }, { status: 403 });
    }
    if (trip.status === "completed") {
      return NextResponse.json({ error: "الرحلة مكتملة بالفعل" }, { status: 409 });
    }

    const finalPrice = trip.finalPrice || trip.price;
    const received = Number(cashReceived) || 0;
    const unpaidAmount = Math.max(0, Math.round((finalPrice - received) * 100) / 100);

    let walletDeducted = 0;
    let unpaidReportedToAdmin = false;

    // If unpaid amount exists, attempt to deduct from rider wallet
    if (unpaidAmount > 0) {
      const rider = await db.user.findUnique({ where: { id: trip.userId } });
      if (rider && rider.walletBalance >= unpaidAmount) {
        await db.user.update({
          where: { id: trip.userId },
          data: { walletBalance: { decrement: unpaidAmount } },
        });
        walletDeducted = unpaidAmount;

        await db.transaction.create({
          data: {
            userId: trip.userId,
            type: "trip_payment",
            amount: unpaidAmount,
            description: `خصم من المحفظة لرحلة غير مدفوعة (${trip.id})`,
            status: "completed",
            tripId: trip.id,
          },
        });
      } else {
        // Cannot deduct fully - report to admin
        unpaidReportedToAdmin = true;
        const admins = await db.user.findMany({ where: { isAdmin: true } });
        if (admins.length > 0) {
          await db.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              title: "🚨 مبلغ غير محصّل",
              message: `رحلة ${trip.id} بقيمة ${finalPrice} ريال، استلم السائق ${received} ريال، المبلغ المتبقي ${unpaidAmount} ريال غير محصّل ومحفظة الراكب لا تكفي.`,
              type: "unpaid_trip",
            })),
          });
        }
      }
    }

    const stillUnpaid = Math.max(0, unpaidAmount - walletDeducted);

    const updated = await db.trip.update({
      where: { id: tripId },
      data: {
        status: "completed",
        completedAt: new Date(),
        cashReceived: received,
        unpaidAmount: stillUnpaid,
        paymentConfirmed: stillUnpaid === 0,
        unpaidReportedToAdmin,
        paymentStatus: stillUnpaid === 0 ? "paid" : "partially_paid",
        finalPrice,
      },
    });

    // Increase driver earnings + trips count
    await db.driver
      .update({
        where: { userId: driverId },
        data: {
          earnings: { increment: received },
          tripsCount: { increment: 1 },
        },
      })
      .catch(() => {});

    // Increase user trips count
    await db.user
      .update({
        where: { id: trip.userId },
        data: { tripsCount: { increment: 1 } },
      })
      .catch(() => {});

    // Create trip_payment transaction for the received portion (if cash)
    if (received > 0) {
      await db.transaction.create({
        data: {
          userId: trip.userId,
          type: "trip_payment",
          amount: received,
          description: paymentNote
            ? `دفع رحلة (${trip.id}) - ${paymentNote}`
            : `دفع رحلة (${trip.id})`,
          status: "completed",
          tripId: trip.id,
        },
      });
    }

    // Notify rider
    await db.notification
      .create({
        data: {
          userId: trip.userId,
          title: "اكتملت رحلتك ✅",
          message:
            stillUnpaid > 0
              ? `اكتملت الرحلة. المبلغ المتبقي ${stillUnpaid} ريال سيتم تحصيله لاحقاً.`
              : `اكتملت رحلتك بنجاح. شكراً لاستخدامك خدماتنا!`,
          type: "trip",
        },
      })
      .catch(() => {});

    return NextResponse.json({
      trip: updated,
      summary: {
        finalPrice,
        cashReceived: received,
        walletDeducted,
        unpaidAmount: stillUnpaid,
        unpaidReportedToAdmin,
      },
    });
  } catch (error) {
    console.error("POST /api/trips/complete-payment error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إتمام الدفع" }, { status: 500 });
  }
}
