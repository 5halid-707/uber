import { NextResponse } from "next/server";
import { serviceTypes } from "@/lib/saudi-data";

// GET /api/services
// - Returns service types with features and pricing breakdown
export async function GET() {
  try {
    const services = serviceTypes.map((s) => ({
      ...s,
      features: buildServiceFeatures(s.id),
      estimatedArrival: `${3 + Math.floor(Math.random() * 7)} دقائق`,
    }));

    return NextResponse.json({
      services,
      count: services.length,
    });
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
