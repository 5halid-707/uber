#!/usr/bin/env node
/**
 * فحص جاهزية الموقع للنشر على الإنتاج
 * شغّل: node scripts/check-production-readiness.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ENV_PATH = path.join(__dirname, "..", ".env");
const SCHEMA_PATH = path.join(__dirname, "..", "prisma", "schema.prisma");

console.log("🔍 فحص جاهزية الموقع للنشر على الإنتاج...\n");

let score = 0;
let total = 0;
const issues = [];
const passed = [];

function check(name, condition, fix) {
  total++;
  if (condition) {
    passed.push(`✅ ${name}`);
    score++;
  } else {
    issues.push(`❌ ${name}\n   الإصلاح: ${fix}`);
  }
}

// Read .env
let envContent = "";
if (fs.existsSync(ENV_PATH)) {
  envContent = fs.readFileSync(ENV_PATH, "utf-8");
}

// Read schema
let schemaContent = "";
if (fs.existsSync(SCHEMA_PATH)) {
  schemaContent = fs.readFileSync(SCHEMA_PATH, "utf-8");
}

// ===== 1. متغيرات البيئة =====
check(
  "ملف .env موجود",
  envContent.length > 0,
  "أنشئ ملف .env بناءً على .env.example"
);

const envVars = {
  DATABASE_URL: "رابط قاعدة البيانات PostgreSQL من Neon",
  NEXTAUTH_SECRET: "مفتاع سري - احصل عليه من https://generate-secret.vercel.app",
  NEXTAUTH_URL: "رابط الموقع (https://your-app.vercel.app للإنتاج)",
  ADMIN_EMAIL: "بريد الأدمن (khalid-alharbi@zohomail.sa)",
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_USER: "بريد Gmail (khalid-alharbi@zohomail.sa)",
  SMTP_PASS: "كلمة مرور التطبيق من Gmail (16 حرف بدون مسافات)",
  SMTP_FROM: "بريد Gmail (khalid-alharbi@zohomail.sa)",
};

for (const [key, desc] of Object.entries(envVars)) {
  const regex = new RegExp(`^${key}=(.+)$`, "m");
  const match = envContent.match(regex);
  const value = match ? match[1].trim() : "";
  const isPlaceholder = value.includes("YOUR_") || value.includes("placeholder") || value.includes("your-");
  check(
    `${key} مضبوط`,
    value && !isPlaceholder,
    desc
  );
}

// ===== 2. Google OAuth =====
check(
  "GOOGLE_CLIENT_ID حقيقي",
  envContent.includes("GOOGLE_CLIENT_ID=") && !envContent.match(/GOOGLE_CLIENT_ID=placeholder/) && envContent.match(/GOOGLE_CLIENT_ID=.+\./),
  "احصل عليه من Google Cloud Console"
);

check(
  "GOOGLE_CLIENT_SECRET حقيقي",
  envContent.includes("GOOGLE_CLIENT_SECRET=") && !envContent.match(/GOOGLE_CLIENT_SECRET=placeholder/),
  "احصل عليه من Google Cloud Console"
);

// ===== 3. قاعدة البيانات =====
const isPostgres = schemaContent.includes('provider = "postgresql"');
const hasPostgresUrl = envContent.match(/DATABASE_URL=.*postgresql:\/\//);

if (isPostgres) {
  check(
    "Schema يستخدم PostgreSQL",
    true,
    "—"
  );
  check(
    "DATABASE_URL هو رابط PostgreSQL",
    hasPostgresUrl,
    "احصل عليه من Neon.tech"
  );
} else {
  check(
    "Schema يستخدم PostgreSQL (للإنتاج)",
    false,
    "شغّل: node scripts/switch-to-postgres.js"
  );
}

// ===== 4. الملفات الأساسية =====
check(
  "vercel.json موجود",
  fs.existsSync(path.join(__dirname, "..", "vercel.json")),
  "الملف موجود بالفعل"
);

check(
  "DEPLOYMENT.md موجود",
  fs.existsSync(path.join(__dirname, "..", "DEPLOYMENT.md")),
  "الملف موجود بالفعل"
);

check(
  "schema.postgres.prisma موجود",
  fs.existsSync(path.join(__dirname, "..", "prisma", "schema.postgres.prisma")),
  "الملف موجود بالفعل"
);

check(
  "سكريبت switch-to-postgres موجود",
  fs.existsSync(path.join(__dirname, "..", "scripts", "switch-to-postgres.js")),
  "الملف موجود بالفعل"
);

// ===== التقرير =====
console.log("═══════════════════════════════════════════════════");
console.log(`📊 النتيجة: ${score}/${total} (${Math.round((score/total)*100)}%)`);
console.log("═══════════════════════════════════════════════════\n");

if (passed.length > 0) {
  console.log("✅ المُنجَز:");
  passed.forEach(p => console.log(`   ${p}`));
  console.log("");
}

if (issues.length > 0) {
  console.log("❌ يحتاج إصلاح:");
  issues.forEach(i => console.log(`   ${i}`));
  console.log("");

  console.log("═══════════════════════════════════════════════════");
  console.log("📋 الخطوات المتبقية:");
  console.log("═══════════════════════════════════════════════════");
  console.log("1. أنشئ App Password من Gmail: https://myaccount.google.com/apppasswords");
  console.log("2. أنشئ قاعدة بيانات PostgreSQL من Neon: https://neon.tech");
  console.log("3. أنشئ Google OAuth credentials: https://console.cloud.google.com/apis/credentials");
  console.log("4. حدّث ملف .env بالقيم الحقيقية");
  console.log("5. شغّل: node scripts/switch-to-postgres.js");
  console.log("6. شغّل: bunx prisma db push");
  console.log("7. شغّل: bunx tsx scripts/seed.ts");
  console.log("8. ارفع المشروع على GitHub ثم انشره على Vercel");
  console.log("");
  console.log("📖 راجع DEPLOYMENT.md للتفاصيل الكاملة");
  process.exit(1);
} else {
  console.log("🎉 الموقع جاهز للنشر على الإنتاج!");
  console.log("");
  console.log("الخطوات التالية:");
  console.log("1. ارفع المشروع على GitHub");
  console.log("2. استورده على Vercel");
  console.log("3. أضف نفس متغيرات البيئة في Vercel");
  console.log("4. انشر!");
}
