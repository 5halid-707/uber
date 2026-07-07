// بيانات شاملة لمناطق ومدن السعودية + البنوك + الخدمات

export const saudiRegions = [
  { id: "riyadh", name: "الرياض", code: "01", cities: ["الرياض","الدرعية","الخرج","الدوادمي","المجمعة","القويعية","الأفلاج","الزلفي","شقراء","حوطة بني تميم","عفيف","السليل","ضرما","المزاحمية","ثادق","حريملاء","الحريق","الغاط","تمير","رماح","أشيقر"] },
  { id: "makkah", name: "مكة المكرمة", code: "02", cities: ["مكة المكرمة","جدة","الطائف","القنفذة","الليث","رابغ","خليص","الجموم","رنية","تربة","الخرمة","العرضيات","بحرة","أضم","الكامل","المويه"] },
  { id: "madinah", name: "المدينة المنورة", code: "03", cities: ["المدينة المنورة","ينبع","العلا","مهد الذهب","بدر","خيبر","العيص","وادي الفرع","الحناكية"] },
  { id: "qassim", name: "القصيم", code: "04", cities: ["بريدة","عنيزة","الرس","المذنب","البكيرية","البدائع","الأسياح","النبهانية","الشماسية","عيون الجواء","رياض الخبراء"] },
  { id: "eastern", name: "المنطقة الشرقية", code: "05", cities: ["الدمام","الخبر","الظهران","الأحساء","حفر الباطن","الجبيل","القطيف","الخفجي","رأس تنورة","بقيق","النعيرية","تاروت","سيهات","صفوى","عنك"] },
  { id: "asir", name: "عسير", code: "06", cities: ["أبها","خميس مشيط","بيشة","محايل عسير","تنومة","تبالة","سراة عبيدة","بلقرن","البارق","النماص"] },
  { id: "tabuk", name: "تبوك", code: "07", cities: ["تبوك","الوجه","ضباء","تيماء","أملج","حقل","البدع"] },
  { id: "hail", name: "حائل", code: "08", cities: ["حائل","بقعاء","الغزالة","الحائط","الشنان","موقق","الجعيمة"] },
  { id: "northern_borders", name: "الحدود الشمالية", code: "09", cities: ["عرعر","رفحاء","طريف","العويقيلة","الحديثة"] },
  { id: "jazan", name: "جازان", code: "10", cities: ["جازان","صبيا","أبو عريش","صامطة","بيش","الدرب","الحرث","ضمد","العارضة","أحد المسارحة","فيفاء","فرسان"] },
  { id: "najran", name: "نجران", code: "11", cities: ["نجران","شرورة","حبونا","بدر الجنوب","يدمة","ثار","خباش","الخرخير"] },
  { id: "bahah", name: "الباحة", code: "12", cities: ["الباحة","بلجرشي","المندق","المخواة","قلوة","العقيق","القرى","بني حسن"] },
  { id: "juf", name: "الجوف", code: "13", cities: ["سكاكا","دومة الجندل","القريات","طبرجل","العيساوية"] },
];

export const saudiBanks = [
  { id: "snb", name: "البنك الأهلي السعودي", logo: "🏦" },
  { id: "rajhi", name: "مصرف الراجحي", logo: "🕌" },
  { id: "riyad", name: "بنك الرياض", logo: "🏛️" },
  { id: "sabb", name: "البنك السعودي البريطاني (ساب)", logo: "🏦" },
  { id: "fransi", name: "البنك السعودي الفرنسي", logo: "🏦" },
  { id: "arab", name: "البنك العربي الوطني", logo: "🏦" },
  { id: "albilad", name: "بنك البلاد", logo: "🏛️" },
  { id: "aljazira", name: "البنك السعودي للتجارة والاستثمار", logo: "🏦" },
  { id: "inma", name: "بنك الإنماء", logo: "🏛️" },
  { id: "stcpay", name: "STC Pay", logo: "📱" },
  { id: "mada", name: "مدى", logo: "💳" },
  { id: "applepay", name: "Apple Pay", logo: "" },
];

export const platformBankAccounts = [
  { id: "1", bankId: "rajhi", bankName: "مصرف الراجحي", accountName: "شركة أوبر للنقل والتوصيل", iban: "SA03 8000 0000 6080 1016 7519", accountNumber: "60801016751900", swift: "RJHISARI", primary: true },
  { id: "2", bankId: "snb", bankName: "البنك الأهلي السعودي", accountName: "شركة أوبر للنقل والتوصيل", iban: "SA44 1000 0000 0000 1234 5678", accountNumber: "12345678001", swift: "NCBKSAJE", primary: false },
  { id: "3", bankId: "stcpay", bankName: "STC Pay", accountName: "شركة أوبر للنقل والتوصيل", iban: "SA00 STCP PAY 0000 1234 5678", accountNumber: "0555555555", swift: "-", primary: false },
];

export const serviceTypes = [
  { id: "ride", name: "أوبر X", desc: "رحلة اقتصادية يومية", emoji: "🚗", basePrice: 8, perKm: 1.5, perMin: 0.25, seats: 4, minPrice: 12 },
  { id: "comfort", name: "أوبر كومفورت", desc: "سيارة مريحة وحديثة", emoji: "🚙", basePrice: 12, perKm: 2.2, perMin: 0.35, seats: 4, minPrice: 18 },
  { id: "premium", name: "أوبر بريميوم", desc: "سيارات فاخرة بسائق محترف", emoji: "🚘", basePrice: 20, perKm: 3.5, perMin: 0.5, seats: 4, minPrice: 30 },
  { id: "xl", name: "أوبر XL", desc: "للمجموعات حتى 6 ركاب", emoji: "🚐", basePrice: 15, perKm: 2.8, perMin: 0.4, seats: 6, minPrice: 25 },
  { id: "bike", name: "أوبر بايك", desc: "دراجة نارية سريعة", emoji: "🛵", basePrice: 5, perKm: 0.9, perMin: 0.15, seats: 1, minPrice: 8 },
  { id: "food", name: "أوبر إيتس", desc: "توصيل طلبات المطاعم", emoji: "🍔", basePrice: 6, perKm: 1.0, perMin: 0.2, seats: 0, minPrice: 10 },
  { id: "package", name: "أوبر توصيل", desc: "شحن الطرود والبضائع", emoji: "📦", basePrice: 10, perKm: 1.5, perMin: 0.25, seats: 0, minPrice: 15 },
  { id: "truck", name: "أوبر شاحنة", desc: "نقل الأثاث والمعدات الثقيلة", emoji: "🚚", basePrice: 30, perKm: 4.5, perMin: 0.8, seats: 0, minPrice: 50 },
];

export const popularPlaces = [
  { id: "1", name: "مطار الملك خالد الدولي", city: "الرياض", region: "riyadh" },
  { id: "2", name: "مطار الملك عبدالعزيز الدولي", city: "جدة", region: "makkah" },
  { id: "3", name: "مطار الأمير محمد بن عبدالعزيز", city: "المدينة المنورة", region: "madinah" },
  { id: "4", name: "مطار الملك فهد الدولي", city: "الدمام", region: "eastern" },
  { id: "5", name: "الحرم المكي الشريف", city: "مكة المكرمة", region: "makkah" },
  { id: "6", name: "المسجد النبوي الشريف", city: "المدينة المنورة", region: "madinah" },
  { id: "7", name: "برج المملكة", city: "الرياض", region: "riyadh" },
  { id: "8", name: "برج الفيصلية", city: "الرياض", region: "riyadh" },
  { id: "9", name: "كورنيش جدة", city: "جدة", region: "makkah" },
  { id: "10", name: "الواجهة البحرية", city: "الخبر", region: "eastern" },
  { id: "11", name: "قلعة المصمك", city: "الرياض", region: "riyadh" },
  { id: "12", name: "السودة", city: "أبها", region: "asir" },
];

export const allCities = saudiRegions.flatMap((r) => r.cities.map((c) => ({ name: c, region: r.name, regionId: r.id })));

export const contactInfo = { phone: "0575015019", phoneIntl: "+966575015019", whatsapp: "966575015019", email: "support@uber.sa", customerService: "920000000" };

export function calculateDistance(from: string, to: string): number {
  if (!from || !to) return 0;
  const seed = (from.length * 7 + to.length * 13 + (from.charCodeAt(0) || 0) + (to.charCodeAt(0) || 0)) % 100;
  return Math.floor(3 + seed * 0.5 + (Math.random() * 10));
}

export function calculatePrice(serviceId: string, distance: number, duration: number): number {
  const service = serviceTypes.find((s) => s.id === serviceId) || serviceTypes[0];
  const subtotal = service.basePrice + distance * service.perKm + duration * service.perMin;
  return Math.floor(Math.max(subtotal, service.minPrice || 10));
}

export function calculateDuration(distance: number): number {
  return Math.ceil((distance / 40) * 60) + 5;
}

export function getSurgeMultiplier(): number {
  const hour = new Date().getHours();
  if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18) || (hour >= 22)) return 1.2 + Math.random() * 0.3;
  return 1.0;
}
