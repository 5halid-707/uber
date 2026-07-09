import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// GET /api/admin/drivers
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = verifyAdmin(request);
    if (!user) return NextResponse.json({ error: authError || "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

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
