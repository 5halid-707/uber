import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serviceTypes } from "@/lib/saudi-data";

export async function GET() {
  try {
    let dbPrices = await db.servicePrice.findMany({ where: { isActive: true } }).catch(() => []);
    const priceMap = new Map(dbPrices.map(p => [p.serviceId, p]));

    const services = serviceTypes.map((s) => {
      const dbp = priceMap.get(s.id);
      return {
        ...s,
        basePrice: dbp?.basePrice ?? s.basePrice,
        perKm: dbp?.perKm ?? s.perKm,
        perMin: dbp?.perMin ?? s.perMin,
        minPrice: dbp?.minPrice ?? s.minPrice,
        seats: dbp?.seats ?? s.seats,
        features: buildServiceFeatures(s.id),
        estimatedArrival: `${3 + Math.floor(Math.random() * 7)} دقائق`,
      };
    });

    return NextResponse.json({ services, count: services.length });
  } catch (error) {
    console.error("GET /api/services error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الخدمات" }, { status: 500 });
  }
}

function buildServiceFeatures(serviceId: string): string[] {
  const common: Record<string, string[]> = {
    ride: ["تكييف", "موسيقى", "حتى 4 ركاب", "أسعار اقتصادية"],
    comfort: ["سيارة حديثة", "مساحة أرجل إضافية", "تكييف قوي", "سائق محترف"],
    premium: ["سيارة فاخرة", "زجاج كهربائي", "جلد فاخر", "مياه مجانية", "wifi"],
    xl: ["حتى 6 ركاب", "مساحة أمتعة كبيرة", "مثالية للعائلات", "تكييف خلفي"],
    bike: ["سريع جداً", "يتفادى الازدحام", "اقتصادي", "مثالي للمسافات القصيرة"],
    food: ["توصيل سريع", "تتبع الطلب", "حفظ الحرارة", "خيارات متعددة"],
    package: ["تأمين على الطرود", "تتبع مباشر", "أحجام مختلفة", "توصيل للباب"],
    truck: ["نقل الأثاث", "عمال تحميل", "تأمين شامل", "أحجام كبيرة"],
  };
  return common[serviceId] || [];
}
