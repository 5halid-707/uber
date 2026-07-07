import { NextResponse } from "next/server";
import { saudiRegions, allCities } from "@/lib/saudi-data";

// GET /api/cities
// - Returns Saudi regions and cities
export async function GET() {
  try {
    return NextResponse.json({
      regions: saudiRegions.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        citiesCount: r.cities.length,
        cities: r.cities,
      })),
      cities: allCities,
      totalRegions: saudiRegions.length,
      totalCities: allCities.length,
    });
  } catch (error) {
    console.error("GET /api/cities error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب المدن" }, { status: 500 });
  }
}
