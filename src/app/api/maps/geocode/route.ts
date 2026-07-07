import { NextRequest, NextResponse } from "next/server";
import { allCities } from "@/lib/saudi-data";

// GET /api/maps/geocode?address=xxx
// - Returns { lat, lng, formattedAddress, source }
// - Uses Google Maps Geocoding API if GOOGLE_MAPS_API_KEY is available
// - Otherwise falls back to city center coordinates (lookup from saudi-data)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "address مطلوب" }, { status: 400 });
    }

    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleKey && !googleKey.includes("placeholder")) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&components=country:SA&key=${googleKey}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === "OK" && data.results?.length > 0) {
          const loc = data.results[0].geometry.location;
          return NextResponse.json({
            lat: loc.lat,
            lng: loc.lng,
            formattedAddress: data.results[0].formatted_address,
            source: "google",
          });
        }
      } catch (err) {
        console.error("Google geocode error:", err);
        // fall back
      }
    }

    // Fallback: lookup by city name in Saudi data
    const cityEntry = allCities.find(
      (c) => address.includes(c.name) || c.name.includes(address)
    );

    // Use approximate city center coordinates for major Saudi cities
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      "الرياض": { lat: 24.7136, lng: 46.6753 },
      "جدة": { lat: 21.4858, lng: 39.1925 },
      "مكة المكرمة": { lat: 21.3891, lng: 39.8579 },
      "المدينة المنورة": { lat: 24.5247, lng: 39.5692 },
      "الدمام": { lat: 26.4207, lng: 50.0888 },
      "الخبر": { lat: 26.2172, lng: 50.1971 },
      "الظهران": { lat: 26.2361, lng: 50.0393 },
      "الطائف": { lat: 21.2854, lng: 40.4183 },
      "تبوك": { lat: 28.3835, lng: 36.5662 },
      "بريدة": { lat: 26.3260, lng: 43.9750 },
      "أبها": { lat: 18.2164, lng: 42.5053 },
      "حائل": { lat: 27.5114, lng: 41.7208 },
      "نجران": { lat: 17.4924, lng: 44.1277 },
      "جازان": { lat: 16.8892, lng: 42.5511 },
      "الأحساء": { lat: 25.3833, lng: 49.5833 },
      "ينبع": { lat: 24.0895, lng: 38.0618 },
      "خميس مشيط": { lat: 18.3000, lng: 42.7333 },
    };

    const matchedCity = cityEntry?.name;
    const coords = (matchedCity && cityCoords[matchedCity]) || cityCoords["الرياض"];

    return NextResponse.json({
      lat: coords.lat,
      lng: coords.lng,
      formattedAddress: matchedCity ? `${address} - ${matchedCity}` : address,
      source: "fallback_city",
      city: matchedCity || null,
    });
  } catch (error) {
    console.error("GET /api/maps/geocode error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تحويل العنوان" }, { status: 500 });
  }
}
