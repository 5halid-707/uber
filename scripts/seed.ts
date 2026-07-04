// Seed script for Haraj-like classifieds website
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await db.favorite.deleteMany();
  await db.comment.deleteMany();
  await db.listing.deleteMany();
  await db.user.deleteMany();
  await db.category.deleteMany();

  // ===== CATEGORIES =====
  const categories = [
    { name: "السيارات", slug: "cars", icon: "🚗", children: [
      { name: "تويوتا", slug: "toyota", icon: "🚙" },
      { name: "نيسان", slug: "nissan", icon: "🚙" },
      { name: "هيونداي", slug: "hyundai", icon: "🚙" },
      { name: "مرسيدس", slug: "mercedes", icon: "🚘" },
      { name: "لكزس", slug: "lexus", icon: "🚘" },
      { name: "بي إم دبليو", slug: "bmw", icon: "🚘" },
      { name: "فورد", slug: "ford", icon: "🚙" },
      { name: "شيفروليه", slug: "chevrolet", icon: "🚙" },
      { name: "كيا", slug: "kia", icon: "🚙" },
      { name: "مازدا", slug: "mazda", icon: "🚙" },
    ]},
    { name: "العقارات", slug: "realestate", icon: "🏠", children: [
      { name: "شقق", slug: "apartments", icon: "🏢" },
      { name: "فلل", slug: "villas", icon: "🏡" },
      { name: "أراضي", slug: "lands", icon: "🌳" },
      { name: "محلات", slug: "shops", icon: "🏬" },
      { name: "استراحات", slug: "farms", icon: "🌴" },
    ]},
    { name: "أجهزة", slug: "electronics", icon: "📱", children: [
      { name: "جوالات", slug: "phones", icon: "📱" },
      { name: "لابتوبات", slug: "laptops", icon: "💻" },
      { name: "تلفزيونات", slug: "tvs", icon: "📺" },
      { name: "إكسسوارات", slug: "accessories", icon: "🎧" },
    ]},
    { name: "الأثاث", slug: "furniture", icon: "🛋️", children: [
      { name: "مجالس", slug: "majlis", icon: "🛋️" },
      { name: "غرف نوم", slug: "bedrooms", icon: "🛏️" },
      { name: "مطابخ", slug: "kitchens", icon: "🍳" },
    ]},
    { name: "وظائف", slug: "jobs", icon: "💼", children: [
      { name: "محاسب", slug: "accountant", icon: "📊" },
      { name: "مهندس", slug: "engineer", icon: "⚙️" },
      { name: "سائق", slug: "driver", icon: "🚕" },
      { name: "مدرس", slug: "teacher", icon: "📚" },
    ]},
    { name: "الحيوانات", slug: "animals", icon: "🐕", children: [
      { name: "إبل", slug: "camels", icon: "🐪" },
      { name: "خيول", slug: "horses", icon: "🐎" },
      { name: "طيور", slug: "birds", icon: "🦜" },
      { name: "أغنام", slug: "sheep", icon: "🐑" },
    ]},
    { name: "الخدمات", slug: "services", icon: "🔧", children: [
      { name: "نقل عفش", slug: "moving", icon: "📦" },
      { name: "صيانة", slug: "maintenance", icon: "🛠️" },
      { name: "تنظيف", slug: "cleaning", icon: "🧹" },
    ]},
  ];

   
  const categoryMap: any = {};

  for (const cat of categories) {
    const parent = await db.category.create({
      data: { name: cat.name, slug: cat.slug, icon: cat.icon },
    });
    categoryMap[cat.slug] = parent;

    if (cat.children) {
      for (const child of cat.children) {
        const childCat = await db.category.create({
          data: {
            name: child.name,
            slug: child.slug,
            icon: child.icon,
            parentId: parent.id,
          },
        });
        categoryMap[`${cat.slug}.${child.slug}`] = childCat;
      }
    }
  }
  console.log("✅ Categories created");

  // ===== USERS =====
  // All users have password: 123456
  const defaultPassword = await bcrypt.hash("123456", 10);
  const users = [
    { username: "أبو محمد", phone: "0551234567", email: "abumohammed@haraj.sa", city: "الرياض", isVerified: true, rating: 4.8 },
    { username: "أبو عبدالله", phone: "0557654321", email: "abuabdullah@haraj.sa", city: "جدة", isVerified: true, rating: 4.9 },
    { username: "أبو خالد", phone: "0561112233", email: "abukhaled@haraj.sa", city: "الدمام", isVerified: false, rating: 4.3 },
    { username: "أبو سعد", phone: "0574455667", email: "abusaad@haraj.sa", city: "مكة", isVerified: true, rating: 4.7 },
    { username: "أبو فيصل", phone: "0538899001", email: "abufaisal@haraj.sa", city: "المدينة", isVerified: false, rating: 4.5 },
    { username: "أبو ناصر", phone: "0542233445", email: "abunasser@haraj.sa", city: "الرياض", isVerified: true, rating: 5.0 },
    { username: "أبو سلمان", phone: "0596677889", email: "abusulaiman@haraj.sa", city: "الخبر", isVerified: true, rating: 4.6 },
    { username: "أبو طلال", phone: "0583344556", email: "abutalal@haraj.sa", city: "الطائف", isVerified: false, rating: 4.2 },
    { username: "أبو ماجد", phone: "0512233445", email: "abumajid@haraj.sa", city: "بريدة", isVerified: true, rating: 4.8 },
    { username: "أبو راشد", phone: "0526677889", email: "aburashed@haraj.sa", city: "أبها", isVerified: false, rating: 4.4 },
  ];

   
  const userMap: any = {};
  for (const u of users) {
    const user = await db.user.create({
      data: {
        ...u,
        password: defaultPassword,
      },
    });
    userMap[u.username] = user;
  }
  console.log("✅ Users created (password for all: 123456)");

  // ===== LISTINGS =====
  // Using Unsplash images for various items
  const listings = [
    // ===== CARS =====
    {
      title: "تويوتا كامري 2022 فل كامل",
      description: "تويوتا كامري 2022 موديل فل اوبشن / شاشة / سقف بانوراما / كاميرا خلفية / تحكم صوتي على الدركسون / سنسر امامي وخلفي / دخول بدون مفتاح / تشغيل عن بعد / جلد / فتحة سقف / ماشية 45 الف كم / الوكالة / فحص / مطلوب فاصل",
      price: 85000,
      city: "الرياض",
      district: "النرجس",
      category: "cars.toyota",
      images: [
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80",
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
      ],
      year: 2022,
      kilometers: 45000,
      condition: "used",
      username: "أبو محمد",
      isFeatured: true,
      whatsapp: "0551234567",
    },
    {
      title: "نيسان باترول 2023 titanium",
      description: "نيسان باترول 2023 تيتانيوم فل اوبشن ماشية 20 الف كم / الوكالة / كامل المواصفات / سقف بانوراما / شاشتين / كاميرا 360 / تحكم صوتي / سنسر امامي وخلفي / جلد كهربائي / تبريد وتدفئة بالمقاعد / مفتوح للفحص / السعر قابل للتفاوض البسيط",
      price: 285000,
      city: "جدة",
      district: "الشاطئ",
      category: "cars.nissan",
      images: [
        "https://images.unsplash.com/photo-1519440140075-37d2f5cb0e60?w=800&q=80",
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
      ],
      year: 2023,
      kilometers: 20000,
      condition: "used",
      username: "أبو عبدالله",
      isFeatured: true,
      whatsapp: "0557654321",
    },
    {
      title: "هيونداي سوناتا 2021",
      description: "هيونداي سوناتا 2021 موديل فل اوبشن / ماشية 60 الف كم / الوكالة / فحص / شاشة / كاميرا / سنسر / جلد / مفتاح ذكي / الزكاة مدفوعة / السعر قابل للتفاوض",
      price: 62000,
      city: "الدمام",
      district: "الفيصلية",
      category: "cars.hyundai",
      images: [
        "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&q=80",
      ],
      year: 2021,
      kilometers: 60000,
      condition: "used",
      username: "أبو خالد",
      whatsapp: "0561112233",
    },
    {
      title: "مرسيدس C200 2020 AMG",
      description: "مرسيدس C200 2020 باقة AMG / فل اوبشن / بانوراما / شاشة / هارمان كاردون / جلد / مقاعد كهربائية مبرودة / مكابح AMG / جنوط 19 / ماشية 55 الف كم / فحص / الوكالة",
      price: 195000,
      city: "الرياض",
      district: "الياسمين",
      category: "cars.mercedes",
      images: [
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80",
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
      ],
      year: 2020,
      kilometers: 55000,
      condition: "used",
      username: "أبو ناصر",
      isFeatured: true,
      whatsapp: "0542233445",
    },
    {
      title: "لكزس ES 2022 فل اوبشن",
      description: "لكزس ES 2022 فل اوبشن ماشية 35 الف كم / الوكالة / كامل المواصفات / شاشة / كاميرا 360 / جلد مبرود / سقف بانوراما / سنسر امامي وخلفي / مفتاح ذكي / فحص كامل",
      price: 175000,
      city: "الخبر",
      district: "العقربية",
      category: "cars.lexus",
      images: [
        "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&q=80",
      ],
      year: 2022,
      kilometers: 35000,
      condition: "used",
      username: "أبو سلمان",
      whatsapp: "0596677889",
    },
    {
      title: "بي إم دبليو X5 2021",
      description: "BMW X5 2021 فل اوبشن / دفع رباعي / بانوراما / شاشتين / كاميرا 360 / هارمان كاردون / جلد مبرود / مقاعد كهربائية / جنوط 21 / ماشية 50 الف كم / فحص",
      price: 235000,
      city: "مكة",
      district: "العزيزية",
      category: "cars.bmw",
      images: [
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
      ],
      year: 2021,
      kilometers: 50000,
      condition: "used",
      username: "أبو سعد",
      isFeatured: true,
      whatsapp: "0574455667",
    },
    {
      title: "فورد إكسبلورر 2020",
      description: "فورد إكسبلورر 2020 موديل فل اوبشن / 7 ركاب / دفع رباعي / شاشة / كاميرا / سنسر / جلد / سقف بانوراما / ماشية 70 الف كم / فحص",
      price: 95000,
      city: "المدينة",
      district: "قباء",
      category: "cars.ford",
      images: [
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
      ],
      year: 2020,
      kilometers: 70000,
      condition: "used",
      username: "أبو فيصل",
      whatsapp: "0538899001",
    },
    {
      title: "شيفروليه تاهو 2023 LTZ",
      description: "شيفروليه تاهو 2023 LTZ فل اوبشن / 8 ركاب / دفع رباعي / شاشتين / كاميرا 360 / جلد مبرود / مقاعد كهربائية / سقف بانوراما / ماشية 15 الف كم / الوكالة",
      price: 295000,
      city: "الرياض",
      district: "الملقا",
      category: "cars.chevrolet",
      images: [
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
      ],
      year: 2023,
      kilometers: 15000,
      condition: "used",
      username: "أبو محمد",
      isFeatured: true,
      whatsapp: "0551234567",
    },
    {
      title: "كيا سيراتو 2022",
      description: "كيا سيراتو 2022 موديل فل اوبشن / ماشية 40 الف كم / الوكالة / شاشة / كاميرا / سنسر / جلد / مفتاح ذكي / تبريد مقاعد / فحص",
      price: 58000,
      city: "بريدة",
      district: "الصفا",
      category: "cars.kia",
      images: [
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
      ],
      year: 2022,
      kilometers: 40000,
      condition: "used",
      username: "أبو ماجد",
      whatsapp: "0512233445",
    },
    {
      title: "مازدا 6 2021",
      description: "مازدا 6 2021 موديل فل اوبشن / شاشة / كاليسما / كاميرا / سنسر / جلد / سقف بانوراما / ماشية 50 الف كم / فحص",
      price: 78000,
      city: "الطائف",
      district: "الشهاب",
      category: "cars.mazda",
      images: [
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
      ],
      year: 2021,
      kilometers: 50000,
      condition: "used",
      username: "أبو طلال",
      whatsapp: "0583344556",
    },

    // ===== REAL ESTATE =====
    {
      title: "شقة 4 غرف فاخرة بالرياض",
      description: "شقة جديدة 4 غرف نوم + مجلس + غرفة طعام + مطبخ مجهز + 3 دورات مياه + مصممة على الطراز المودرن / التشطيب سوبر ديلوكس / مصعد / موقف سيارة / شارع 20 / قريبة من الخدمات / التسليم فوري / الدفع نقد أو تقسيط",
      price: 650000,
      city: "الرياض",
      district: "النرجس",
      category: "realestate.apartments",
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      ],
      condition: "new",
      username: "أبو ناصر",
      isFeatured: true,
      whatsapp: "0542233445",
    },
    {
      title: "فيلا دورين 400م بالرياض",
      description: "فيلا دورين 400 متر / 5 غرف نوم + مجلس + ملحق + مطبخ + 5 دورات مياه / تشطيب سوبر ديلوكس / مسبح / حديقة / موقف لسيارتين / بحري / شارع 30 / قريبة من المدارس والجامعات / السعر قابل للتفاوض",
      price: 2500000,
      city: "الرياض",
      district: "الياسمين",
      category: "realestate.villas",
      images: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
      ],
      condition: "new",
      username: "أبو محمد",
      isFeatured: true,
      whatsapp: "0551234567",
    },
    {
      title: "أرض سكنية 600م بجدة",
      description: "أرض سكنية 600 متر مربع / شارع 30 / ناصية / مخططات معتمدة / صكوك إلكترونية / قريبة من الخدمات / مناسبة للبناء أو الاستثمار / الدفع نقد",
      price: 480000,
      city: "جدة",
      district: "الصفوة",
      category: "realestate.lands",
      images: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
      ],
      username: "أبو عبدالله",
      whatsapp: "0557654321",
    },
    {
      title: "محل تجاري 80م بمكة",
      description: "محل تجاري 80 متر / واجهة زجاجية / يصلح لأي نشاط تجاري / موقع مميز على شارع رئيسي / كهرماء عداد / تأجير بيع / السعر شامل التشطيب",
      price: 750000,
      city: "مكة",
      district: "العزيزية",
      category: "realestate.shops",
      images: [
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
      ],
      username: "أبو سعد",
      whatsapp: "0574455667",
    },
    {
      title: "استراحة 500م بالدمام",
      description: "استراحة 500 متر / 3 غرف نوم + مجلس + مطبخ / مسبح / حديقة / مظلات / كهرباء / مياه / موقع هادئ / قريبة من البحر / مناسبة للعائلة",
      price: 850000,
      city: "الدمام",
      district: "الشاطئ",
      category: "realestate.farms",
      images: [
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
      ],
      username: "أبو خالد",
      whatsapp: "0561112233",
    },

    // ===== ELECTRONICS =====
    {
      title: "آيفون 15 برو ماكس 256 جيجا",
      description: "آيفون 15 برو ماكس 256 جيجا / لون تيتانيوم طبيعي / جديد / لم يفتح / مع كامل الملحقات / ضمان شركة / مع فواصل + شاحن أصلي + ساعة 9 سيريز + ايربودز برو 2",
      price: 5500,
      city: "الرياض",
      district: "العليا",
      category: "electronics.phones",
      images: [
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80",
      ],
      condition: "new",
      username: "أبو ناصر",
      isFeatured: true,
      whatsapp: "0542233445",
    },
    {
      title: "ماك بوك برو M3 14 إنش",
      description: "ماك بوك برو M3 / 14 إنش / 16 جيجا رام / 512 SSD / لون فضي / جديد / مع كامل الملحقات / ضمان آبل سنة / مع حقيبة + ماوس",
      price: 8500,
      city: "جدة",
      district: "الروضة",
      category: "electronics.laptops",
      images: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
      ],
      condition: "new",
      username: "أبو عبدالله",
      whatsapp: "0557654321",
    },
    {
      title: "تلفزيون سامسونج QLED 65 إنش",
      description: "تلفزيون سامسونج QLED 65 إنش / 4K / HDR / سمارت TV / مع ريموت + حامل / جديد / ضمان سنتين / مع تركيب مجاني داخل المدينة",
      price: 4200,
      city: "الخبر",
      district: "الثقبة",
      category: "electronics.tvs",
      images: [
        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80",
      ],
      condition: "new",
      username: "أبو سلمان",
      whatsapp: "0596677889",
    },
    {
      title: "سماعات سوني WH-1000XM5",
      description: "سماعات سوني WH-1000XM5 / عازلة للضوضاء / بلوتوث / بطارية تدوم 30 ساعة / لون أسود / جديدة / مع علبة + كابلات / ضمان وكيل",
      price: 1350,
      city: "الرياض",
      district: "الملز",
      category: "electronics.accessories",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      ],
      condition: "new",
      username: "أبو محمد",
      whatsapp: "0551234567",
    },

    // ===== FURNITURE =====
    {
      title: "مجلس عربي 7 مقاعد",
      description: "مجلس عربي 7 مقاعد / قماش مخمل فاخر / لون بيج / طقم كامل مع كنب + وسائد + سجاد / صناعة محلية / تشطيب فاخر / مناسب للمجالس الكبيرة / توصيل وتركيب",
      price: 8500,
      city: "الرياض",
      district: "السلي",
      category: "furniture.majlis",
      images: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
      ],
      condition: "new",
      username: "أبو ناصر",
      whatsapp: "0542233445",
    },
    {
      title: "غرفة نوم كنغ 6 قطع",
      description: "غرفة نوم كنغ 6 قطع / سرير كنغ + كومدين + تسريحة + خزانة 6 أبواب + طاولة / خشب MDF / لون أبيض وذهبي / تشطيب فاخر / مع مرتبة طبية / صناعة محلية",
      price: 12000,
      city: "جدة",
      district: "النسيم",
      category: "furniture.bedrooms",
      images: [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
      ],
      condition: "new",
      username: "أبو عبدالله",
      isFeatured: true,
      whatsapp: "0557654321",
    },
    {
      title: "مطبخ مجهز 5 متر",
      description: "مطبخ مجهز 5 متر / خشب MDF / لون رمادي مات / 10 خزائن + درج + رفوف / مع طاولة طعام + 6 كراسي / صناعة محلية / تركيب مجاني داخل الرياض / ضمان 5 سنوات",
      price: 15000,
      city: "الرياض",
      district: "الربيع",
      category: "furniture.kitchens",
      images: [
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
      ],
      condition: "new",
      username: "أبو محمد",
      whatsapp: "0551234567",
    },

    // ===== JOBS =====
    {
      title: "مطلوب محاسب / محاسبة",
      description: "مطلوب محاسب / محاسبة للعمل بشركة كبرى بالرياض / خبرة 3 سنوات / إجادة برامج المحاسبة / معرفة بالضريبة والزكاة / راتب 6000 ريال + تأمين طبي + مواصلات / الفترة صباحية / إرسال السيرة الذاتية عبر الواتساب",
      price: 6000,
      city: "الرياض",
      district: "الملز",
      category: "jobs.accountant",
      images: [],
      username: "أبو ناصر",
      whatsapp: "0542233445",
    },
    {
      title: "مطلوب مهندس مدني",
      description: "مطلوب مهندس مدني / خبرة 5 سنوات في المشاريع الإنشائية / إجادة الأوتوكاد / معرفة ببرامج التصميم / راتب 10000 ريال + بدلات / العمل بمشاريع كبرى / إرسال السيرة الذاتية",
      price: 10000,
      city: "جدة",
      district: "الروضة",
      category: "jobs.engineer",
      images: [],
      username: "أبو عبدالله",
      whatsapp: "0557654321",
    },
    {
      title: "مطلوب سائق توصيل",
      description: "مطلوب سائق توصيل / خبرة بالمدينة / إجادة استخدام GPS / راتب 3500 ريال + عمولة / العمل يومي 8 ساعات / تأمين طبي / إقامة قابلة للنقل",
      price: 3500,
      city: "الدمام",
      district: "الفيصلية",
      category: "jobs.driver",
      images: [],
      username: "أبو خالد",
      whatsapp: "0561112233",
    },

    // ===== ANIMALS =====
    {
      title: "ناقة أصيلة بكر",
      description: "ناقة أصيلة بكر / عمر 3 سنوات / من سلالة شلوح / صحية / مفرمة / مع شاهدة نسب / مناسبة للسباقات والذبح / السعر قابل للتفاوض البسيط",
      price: 35000,
      city: "الرياض",
      district: "الثمامة",
      category: "animals.camels",
      images: [
        "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80",
      ],
      username: "أبو محمد",
      isFeatured: true,
      whatsapp: "0551234567",
    },
    {
      title: "حصان عربي أصيل",
      description: "حصان عربي أصيل / عمر 4 سنوات / ذكر / مدرب على الفروسية / صحتي / مع شاهدة نسب / من سلالة كحيلان / مناسب للسباقات / السعر قابل للتفاوض",
      price: 25000,
      city: "الطائف",
      district: "الشهاب",
      category: "animals.horses",
      images: [
        "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80",
      ],
      username: "أبو طلال",
      whatsapp: "0583344556",
    },
    {
      title: "ببغاء أفريقي رمادي",
      description: "ببغاء أفريقي رمادي / عمر سنتين / مروض / يتكلم عدة كلمات / صحتي / مع قفص كبير + ألعاب / تربية منزلية / مناسب للهواة / السعر قابل للتفاوض",
      price: 2800,
      city: "الرياض",
      district: "النخيل",
      category: "animals.birds",
      images: [
        "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800&q=80",
      ],
      username: "أبو ناصر",
      whatsapp: "0542233445",
    },
    {
      title: "خروف نعيمي ممتاز",
      description: "خروف نعيمي ممتاز / عمر 8 أشهر / وزن 50 كيلو / صحي / مفرم / مناسب للعيد / توصيل داخل المدينة / الأسعار خاصة للكميات",
      price: 950,
      city: "بريدة",
      district: "الصفا",
      category: "animals.sheep",
      images: [
        "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=800&q=80",
      ],
      username: "أبو ماجد",
      whatsapp: "0512233445",
    },

    // ===== SERVICES =====
    {
      title: "نقل عفش بأمانة وسرعة",
      description: "نقل عفش داخل وخارج الرياض / فريق محترف / تغليف احترافي / فك وتركيب الأثاث / سيارات مغلة مختلفة الأحجام / أسعار مناسبة / خدمة 24 ساعة / تأمين على العفص",
      price: 500,
      city: "الرياض",
      district: "السلي",
      category: "services.moving",
      images: [],
      username: "أبو ناصر",
      isFeatured: true,
      whatsapp: "0542233445",
    },
    {
      title: "صيانة مكيفات سبليت وشباك",
      description: "صيانة جميع أنواع المكيفات سبليت وشباك ومركزي / تنظيف / شحن فريون / إصلاح أعطال / فريق فني محترف / خدمة منزلية / ضمان على العمل / أسعار مناسبة / خدمة 24 ساعة",
      price: 150,
      city: "جدة",
      district: "الروضة",
      category: "services.maintenance",
      images: [],
      username: "أبو عبدالله",
      whatsapp: "0557654321",
    },
    {
      title: "شركة تنظيف منازل وخزانات",
      description: "تنظيف منازل / شقق / فلل / مكاتب / تنظيف خزانات / مكافحة حشرات / تنظيف سجاد وموكيت / فريق عمالة مدربة / مواد آمنة / ضمان على الخدمة / أسعار تنافسية",
      price: 250,
      city: "الدمام",
      district: "الفيصلية",
      category: "services.cleaning",
      images: [],
      username: "أبو خالد",
      whatsapp: "0561112233",
    },
  ];

  for (const listing of listings) {
    const category = categoryMap[listing.category];
    const user = userMap[listing.username];

    if (!category || !user) {
      console.warn(`Missing category or user for: ${listing.title}`);
      continue;
    }

    await db.listing.create({
      data: {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        city: listing.city,
        district: listing.district,
        categoryId: category.id,
        userId: user.id,
        images: JSON.stringify(listing.images || []),
        year: listing.year || null,
        kilometers: listing.kilometers || null,
        condition: listing.condition || null,
        phone: user.phone,
        whatsapp: listing.whatsapp || user.phone,
        isFeatured: listing.isFeatured || false,
        views: Math.floor(Math.random() * 500) + 50,
      },
    });
  }
  console.log(`✅ ${listings.length} listings created`);

  // ===== COMMENTS =====
  const sampleComments = [
    { username: "أبو فيصل", content: "السلام عليكم، هل السعر قابل للتفاوض؟", phone: null },
    { username: "أبو خالد", content: "هل ما زال متوفر؟", phone: null },
    { username: "أبو ماجد", content: "ما هي آخر سعر؟", phone: null },
    { username: "أبو طلال", content: "أبي الصورة من الداخل", phone: null },
  ];

  const allListings = await db.listing.findMany({ take: 8 });
  for (const listing of allListings) {
    const numComments = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numComments; i++) {
      const comment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
      await db.comment.create({
        data: {
          listingId: listing.id,
          username: comment.username,
          content: comment.content,
          phone: comment.phone,
        },
      });
    }
  }
  console.log("✅ Comments created");

  console.log("🌱 Seeding completed!");
  console.log(`📊 Total: ${categories.reduce((a, c) => a + 1 + (c.children?.length || 0), 0)} categories, ${users.length} users, ${listings.length} listings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
