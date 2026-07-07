import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/drivers/register?userId=xxx
// - Returns driver with documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId مطلوب" }, { status: 400 });
    }

    const driver = await db.driver.findUnique({
      where: { userId },
      include: { documents: true },
    });

    if (!driver) {
      return NextResponse.json({ driver: null });
    }

    return NextResponse.json({ driver });
  } catch (error) {
    console.error("GET /api/drivers/register error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب بيانات السائق" }, { status: 500 });
  }
}

// POST /api/drivers/register
// Body: {
//   userId, carModel, carPlate, carColor, carYear?,
//   licenseNumber, licenseExpiry, documents: [{type, fileName, fileUrl, fileData?, fileSize?, mimeType?}]
// }
// - Creates or updates driver record (if exists and pending, allow re-submit)
// - Marks user.isDriver = true
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      carModel,
      carPlate,
      carColor,
      carYear,
      licenseNumber,
      licenseExpiry,
      documents = [],
    } = body;

    if (!userId || !carModel || !carPlate || !carColor || !licenseNumber) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: userId, carModel, carPlate, carColor, licenseNumber" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Check car plate uniqueness (case-insensitive)
    const existingPlate = await db.driver.findFirst({
      where: { carPlate: { equals: carPlate.trim() } },
    });
    if (existingPlate && existingPlate.userId !== userId) {
      return NextResponse.json({ error: "رقم اللوحة مسجل لسائق آخر" }, { status: 409 });
    }

    const licenseExpiryDate = licenseExpiry ? new Date(licenseExpiry) : null;

    // Upsert driver record
    const driver = await db.driver.upsert({
      where: { userId },
      update: {
        carModel: carModel.trim(),
        carPlate: carPlate.trim(),
        carColor: carColor.trim(),
        carYear: carYear ? Number(carYear) : null,
        licenseNumber: licenseNumber.trim(),
        licenseExpiry: licenseExpiryDate,
        approvalStatus: "pending",
        isApproved: false,
        rejectionReason: null,
      },
      create: {
        userId,
        carModel: carModel.trim(),
        carPlate: carPlate.trim(),
        carColor: carColor.trim(),
        carYear: carYear ? Number(carYear) : null,
        licenseNumber: licenseNumber.trim(),
        licenseExpiry: licenseExpiryDate,
        isOnline: false,
        isVerified: false,
        isApproved: false,
        approvalStatus: "pending",
      },
      include: { documents: true },
    });

    // If documents provided, replace existing documents
    if (Array.isArray(documents) && documents.length > 0) {
      await db.driverDocument.deleteMany({ where: { driverId: driver.id } });
      await db.driverDocument.createMany({
        data: documents.map((doc: Record<string, unknown>) => ({
          driverId: driver.id,
          type: String(doc.type || "other"),
          fileName: String(doc.fileName || "document"),
          fileUrl: String(doc.fileUrl || ""),
          fileData: doc.fileData ? String(doc.fileData) : null,
          fileSize: doc.fileSize ? Number(doc.fileSize) : null,
          mimeType: doc.mimeType ? String(doc.mimeType) : null,
          status: "pending",
        })),
      });
    }

    // Mark user as driver
    await db.user.update({
      where: { id: userId },
      data: { isDriver: true },
    });

    // Notify admins about new driver registration
    const admins = await db.user.findMany({ where: { isAdmin: true } });
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          title: "🚗 طلب تسجيل سائق جديد",
          message: `${user.name} طلب التسجيل كسائق. السيارة: ${carModel} (${carPlate})`,
          type: "driver_registration",
        })),
      });
    }

    const refreshed = await db.driver.findUnique({
      where: { id: driver.id },
      include: { documents: true },
    });

    return NextResponse.json({ driver: refreshed }, { status: 201 });
  } catch (error) {
    console.error("POST /api/drivers/register error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل السائق" }, { status: 500 });
  }
}
