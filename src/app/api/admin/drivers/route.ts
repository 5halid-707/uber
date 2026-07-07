import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/drivers?status=pending&adminId=xxx
// status values: "pending" | "approved" | "rejected" | "all"
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const adminId = searchParams.get("adminId");

    // Soft admin check
    if (adminId) {
      const admin = await db.user.findUnique({ where: { id: adminId } });
      if (!admin || !admin.isAdmin) {
        return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
      }
    }

    const where: Record<string, unknown> = {};
    if (status === "pending") {
      where.approvalStatus = "pending";
    } else if (status === "approved") {
      where.approvalStatus = "approved";
      where.isApproved = true;
    } else if (status === "rejected") {
      where.approvalStatus = "rejected";
    }

    const drivers = await db.driver.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            city: true,
            region: true,
            isBlocked: true,
            createdAt: true,
          },
        },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ drivers, count: drivers.length });
  } catch (error) {
    console.error("GET /api/admin/drivers error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب السائقين" }, { status: 500 });
  }
}
