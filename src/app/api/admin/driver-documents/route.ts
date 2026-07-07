import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/driver-documents?driverId=xxx&adminId=xxx
// - Returns driver record with all documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const adminId = searchParams.get("adminId");

    if (!driverId) {
      return NextResponse.json({ error: "driverId مطلوب" }, { status: 400 });
    }

    if (adminId) {
      const admin = await db.user.findUnique({ where: { id: adminId } });
      if (!admin || !admin.isAdmin) {
        return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
      }
    }

    const driver = await db.driver.findUnique({
      where: { id: driverId },
      include: {
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            city: true,
            region: true,
            createdAt: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "السائق غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ driver });
  } catch (error) {
    console.error("GET /api/admin/driver-documents error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب وثائق السائق" }, { status: 500 });
  }
}
