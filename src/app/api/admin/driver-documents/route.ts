import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// GET /api/admin/driver-documents
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = verifyAdmin(request);
    if (!user) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");

    if (!driverId) {
      return NextResponse.json({ error: "driverId مطلوب" }, { status: 400 });
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
