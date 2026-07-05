import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = { status: "active" };

    if (category) {
      const cat = await db.category.findUnique({ where: { slug: category } });
      if (cat) {
        const children = await db.category.findMany({ where: { parentId: cat.id } });
        const allIds = [cat.id, ...children.map((c) => c.id)];
        where.categoryId = { in: allIds };
      }
    }

    if (city && city !== "all") {
      where.city = city;
    }

    if (search) {
      where.title = { contains: search };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = parseInt(minPrice);
      if (maxPrice) (where.price as Record<string, number>).lte = parseInt(maxPrice);
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    const orderBy =
      sort === "price_low"
        ? { price: "asc" as const }
        : sort === "price_high"
          ? { price: "desc" as const }
          : sort === "popular"
            ? { views: "desc" as const }
            : { createdAt: "desc" as const };

    const [listings, totalCount] = await Promise.all([
      db.listing.findMany({
        where: where as Parameters<typeof db.listing.findMany>[0]["where"],
        orderBy,
        take: limit,
        skip: offset,
        include: {
          category: true,
          user: true,
        },
      }),
      db.listing.count({
        where: where as Parameters<typeof db.listing.count>[0]["where"],
      }),
    ]);

    return NextResponse.json({ listings, totalCount, hasMore: offset + limit < totalCount });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول لنشر إعلان" },
        { status: 401 }
      );
    }

     
    const userId = (session.user as any).id;
    const body = await request.json();
    const {
      title,
      description,
      price,
      city,
      district,
      categoryId,
      images,
      year,
      kilometers,
      condition,
      phone,
      whatsapp,
    } = body;

    // Validate required fields
    if (!title?.trim() || !description?.trim() || !price || !categoryId || !phone) {
      return NextResponse.json(
        { error: "الرجاء ملء جميع الحقول المطلوبة" },
        { status: 400 }
      );
    }

    // Get user data
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const listing = await db.listing.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: parseInt(price),
        city: city || user.city || "جدة",
        district: district || null,
        categoryId,
        userId,
        images: JSON.stringify(images || []),
        year: year ? parseInt(year) : null,
        kilometers: kilometers ? parseInt(kilometers) : null,
        condition: condition || null,
        phone,
        whatsapp: whatsapp || phone,
      },
      include: {
        category: true,
        user: true,
      },
    });

    // Log activity
    await logActivity({
      userId,
      action: "listing_create",
      description: `نشر إعلان جديد: ${title.trim()}`,
      metadata: { listingId: listing.id, price: parseInt(price) },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
