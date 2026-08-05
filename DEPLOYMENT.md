# 🚀 دليل نشر موقع حراج على الإنترنت (مجاني بالكامل)

هذا الدليل يشرح كيف تنشر موقع حراج على الإنترنت ليكون متاحاً للعملاء ويُدار من قبل صاحب الموقع (أبو سطام).

## 📋 المتطلبات (كلها مجانية)

| الخدمة | الرابط | التكلفة | الغرض |
|--------|--------|---------|--------|
| **Vercel** | https://vercel.com | مجاني | استضافة الموقع + نطاق فرعي (yourname.vercel.app) |
| **Neon** | https://neon.tech | مجاني (0.5GB) | قاعدة بيانات PostgreSQL سحابية |
| **Gmail** | لديك بالفعل | مجاني | إرسال الإيميلات + تسجيل الدخول بـ Google |
| **Google Cloud** | https://console.cloud.google.com | مجاني | Google OAuth لتسجيل الدخول |

**التكلفة الإجمالية: 0 ريال** (يمكنك البدء مجاناً بالكامل)

---

## 📧 الخطوة 1: إعداد كلمة مرور التطبيق في Gmail (للبريد الإلكتروني)

هذه الخطوة ضرورية ليتمكن الموقع من إرسال إيميلات (إشعارات المستخدمين الجدد، حالة التحويلات) من بريدك khalid-alharbi@zohomail.sa.

### الطريقة:

1. **افتح**: https://myaccount.google.com/security
2. **فعّل التحقق بخطوتين (2-Step Verification)**:
   - اضغط على "التحقق بخطوتين"
   - اتبع الخطوات لتفعيلها (تحتاج رقم جوال)
3. **أنشئ كلمة مرور تطبيق**:
   - افتح: https://myaccount.google.com/apppasswords
   - اختر "تطبيق آخر" (Other)
   - اكتب اسم: `Haraj`
   - اضغط "إنشاء"
   - **انسخ كلمة المرور من 16 حرفاً** (مثل: `abcd efgh ijkl mnop`)

✅ **احفظ هذه الكلمة** — ستحتاجها في الخطوة 4.

---

## 🗄️ الخطوة 2: إنشاء قاعدة بيانات PostgreSQL مجانية (Neon)

1. **افتح**: https://neon.tech
2. **سجّل بحساب GitHub أو Gmail** (مباشر وسريع)
3. **أنشئ مشروع جديد**:
   - اضغط "New Project"
   - اسم المشروع: `haraj-db`
   - المنطقة: `Singapore` (الأقرب للسعودية)
   - اضغط "Create Project"
4. **انسخ رابط الاتصال**:
   - في الصفحة الرئيسية، اضغط على "Connection Details"
   - اختر "Pooled connection" (للأداء الأفضل)
   - انسخ الرابط الذي يبدأ بـ `postgresql://` — يبدو هكذا:
     ```
     postgresql://neondb_owner:AbCdEf123456@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
     ```

✅ **احفظ هذا الرابط** — ستحتاجه في الخطوة 4.

---

## 🔐 الخطوة 3: إعداد Google OAuth (لتسجيل الدخول بحساب Google)

1. **افتح**: https://console.cloud.google.com
2. **سجّل الدخول ببريدك** khalid-alharbi@zohomail.sa
3. **أنشئ مشروع جديد**:
   - اضغط على شعار المشروع في الأعلى → "New Project"
   - الاسم: `Haraj Auth`
   - اضغط "Create"
4. **انتظر إنشاء المشروع** ثم اختره من القائمة
5. **فعّل Google+ API**:
   - من القائمة الجانبية: APIs & Services → Library
   - ابحث عن "Google+ API"
   - اضغط "Enable"
6. **أنشئ بيانات OAuth**:
   - APIs & Services → Credentials
   - اضغط "+ Create Credentials" → "OAuth client ID"
   - إذا طُلب منك إعداد شاشة الموافقة:
     - اضغط "Configure Consent Screen"
     - اختر "External"
     - املأ: اسم التطبيق `حراج`، بريد الدعم `khalid-alharbi@zohomail.sa`
     - أضف نطاقات: `gmail.com`
     - احفظ
   - اختر نوع: **Web Application**
   - الاسم: `Haraj Web`
7. **أضف Authorized redirect URIs**:
   - للمعاينة: `http://localhost:3000/api/auth/callback/google`
   - للإنتاج (بعد معرفة النطاق): `https://YOUR-APP-NAME.vercel.app/api/auth/callback/google`
8. **اضغط "Create"**
9. **انسخ**:
   - Client ID (ينتهي بـ `.apps.googleusercontent.com`)
   - Client Secret

✅ **احفظ Client ID و Client Secret** — ستحتاجهما في الخطوة 4.

---

## 🌐 الخطوة 4: نشر الموقع على Vercel

### الطريقة الأولى: عبر GitHub (موصى بها)

1. **ارفع المشروع على GitHub**:
   ```bash
   # إذا لم يكن لديك git مُعد:
   git init
   git add .
   git commit -m "Initial commit - Haraj platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/haraj.git
   git push -u origin main
   ```

2. **سجّل في Vercel**: https://vercel.com (بحساب GitHub)

3. **استورد المشروع**:
   - اضغط "Add New..." → "Project"
   - اختر مستودع `haraj` من GitHub
   - اضغط "Import"

4. **اضبط متغيرات البيئة** (مهم جداً):

   في صفحة "Configure Project"، انزل لقسم "Environment Variables" وأضف:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | (رابط PostgreSQL من Neon - الخطوة 2) |
   | `NEXTAUTH_URL` | `https://YOUR-APP-NAME.vercel.app` (ستحدّثه بعد النشر) |
   | `NEXTAUTH_SECRET` | (انسخ من: https://generate-secret.vercel.app) |
   | `ADMIN_EMAIL` | `khalid-alharbi@zohomail.sa` |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | `khalid-alharbi@zohomail.sa` |
   | `SMTP_PASS` | (كلمة مرور التطبيق من الخطوة 1 - بدون مسافات) |
   | `SMTP_FROM` | `khalid-alharbi@zohomail.sa` |
   | `GOOGLE_CLIENT_ID` | (من الخطوة 3) |
   | `GOOGLE_CLIENT_SECRET` | (من الخطوة 3) |

5. **اضبط Build Command**:
   - في قسم "Build & Output Settings"
   - Build Command: `bun run build:prod`

6. **اضغط "Deploy"** وانتظر 2-5 دقائق

7. **بعد النشر**:
   - ستحصل على رابط مثل: `https://haraj-xxx.vercel.app`
   - **حدّث `NEXTAUTH_URL`** في إعدادات المشروع على Vercel بهذا الرابط
   - حدّث redirect URI في Google Cloud Console بهذا الرابط

---

## 🗄️ الخطوة 5: تفعيل قاعدة البيانات + إضافة البيانات التجريبية

### بعد نجاح النشر، شغّل هذه الأوامر محلياً:

1. **بدّل schema إلى PostgreSQL**:
   ```bash
   node scripts/switch-to-postgres.js
   ```

2. **اضبط DATABASE_URL مؤقتاً** (رابط Neon):
   ```bash
   # في ملف .env، استبدل السطر الأول بـ:
   # DATABASE_URL="postgresql://neondb_owner:xxx@ep-xxx.neon.tech/neondb?sslmode=require"
   ```

3. **أنشئ الجداول في PostgreSQL**:
   ```bash
   bunx prisma generate
   bunx prisma db push
   ```

4. **أضف البيانات التجريبية** (الأقسام + 10 مستخدمين + 32 إعلان):
   ```bash
   bunx tsx scripts/seed.ts
   ```

5. **ارجع لـ SQLite للمعاينة المحلية** (اختياري):
   ```bash
   cp prisma/schema.prisma.sqlite.backup prisma/schema.prisma
   bunx prisma generate
   ```

---

## ✅ الخطوة 6: اختبار الموقع المنشور

1. **افتح رابط موقعك**: `https://haraj-xxx.vercel.app`
2. **سجّل الدخول كأدمن**:
   - البريد: `khalid-alharbi@zohomail.sa`
   - كلمة المرور: `123456`
3. **تحقق من الميزات**:
   - ✅ تسجيل الدخول يعمل
   - ✅ زر "لوحة الأدمن" يظهر (10 تبويبات)
   - ✅ الإعلانات الـ 32 تظهر
   - ✅ الإشعارات تعمل

4. **اختبر تسجيل مستخدم جديد**:
   - سجل مستخدم جديد بأي بريد
   - ✅ يجب أن يصلك إيميل على `khalid-alharbi@zohomail.sa` بإشعار "مستخدم جديد سجّل في حراج"

5. **اختبر تسجيل الدخول بـ Google**:
   - اضغط "متابعة بحساب Google"
   - ✅ يجب أن يفتح نافذة Google لتسجيل الدخول

---

## 💳 الخطوة 7 (اختيارية): تفعيل الدفع الحقيقي بـ Moyasar

عندما تريد قبول مدفوعات حقيقية (ترقية الإعلانات المميزة، شحن المحفظة):

1. **سجل في Moyasar**: https://moyasar.com
   - تحتاج: سجل تجاري + هوية + حساب بنكي
   - موافقة خلال 2-3 أيام عمل

2. **احصل على API Keys**:
   - من لوحة التحكم → Developers → API Keys
   - انسخ: Secret Key و Publishable Key

3. **أضف متغيرات البيئة في Vercel**:
   ```
   MOYASAR_API_KEY=sk_live_xxxxxxxxxxxx
   MOYASAR_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
   ```

4. **أخبرني لتفعيل Moyasar الحقيقي** في الكود (الآن يعمل بنظام محاكاة آمن للتجربة)

---

## 🌐 الخطوة 8 (اختيارية): ربط نطاق مخصص

إذا أردت نطاقاً مثل `haraj-sattam.com` بدلاً من `haraj-xxx.vercel.app`:

1. **اشترِ النطاق**: من namel.com.sa أو godaddy.com (~50-100 ريال/سنة)
2. **في Vercel**:
   - Project Settings → Domains → Add Domain
   - أدخل نطاقك
   - اتبع التعليمات لتحديث DNS عند مزود النطاق
3. **حدّث NEXTAUTH_URL** على Vercel بالنطاق الجديد
4. **حدّث redirect URI في Google Cloud Console** بالنطاق الجديد

---

## 🆘 حل المشكلات الشائعة

### المشكلة: الموقع يعمل لكن قاعدة البيانات فارغة
**الحل**: شغّل `bunx tsx scripts/seed.ts` (الخطوة 5)

### المشكلة: تسجيل الدخول بـ Google لا يعمل
**الحل**: تحقق من redirect URI في Google Cloud Console يطابق `NEXTAUTH_URL`

### المشكلة: لا تصلك الإيميلات
**الحل**:
- تأكد من كلمة مرور التطبيق (16 حرف بدون مسافات)
- تأكد أن `SMTP_USER` = `SMTP_FROM` = `khalid-alharbi@zohomail.sa`
- تحقق من مجلد Spam

### المشكلة: خطأ في قاعدة البيانات "relation does not exist"
**الحل**: شغّل `bunx prisma db push` على قاعدة بيانات PostgreSQL

### المشكلة: Build failed on Vercel
**الحل**: تأكد أن Build Command = `bun run build:prod`

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. راجع logs في Vercel: Project → Deployments → اضغط على أي deployment → "Logs"
2. تأكد أن جميع متغيرات البيئة مضبوطة
3. أعد النشر بعد أي تعديل

## 🎉 مبروك!

بعد إكمال هذه الخطوات، سيكون موقعك متاحاً على:
**https://haraj-xxx.vercel.app**

العملاء يمكنهم:
- ✅ تسجيل حسابات جديدة (بالبريد أو Google)
- ✅ نشر إعلاناتهم
- ✅ الدفع عبر مدى/Apple Pay
- ✅ تحويل الأموال

وأنت (الأدمن) تتحكم في كل شيء من:
- 🔔 جرس الإشعارات (يصلك إشعار بكل مستخدم جديد)
- 📧 بريدك khalid-alharbi@zohomail.sa (يصلك إيميل بكل تسجيل)
- 🛡️ لوحة تحكم الأدمن (إدارة كاملة)

---

## ⚡ ملخص سريع (5 خطوات فقط)

1. **Gmail**: أنشئ App Password (https://myaccount.google.com/apppasswords)
2. **Neon**: أنشئ قاعدة بيانات PostgreSQL (https://neon.tech) → انسخ DATABASE_URL
3. **Google Cloud**: أنشئ OAuth 2.0 credentials (https://console.cloud.google.com)
4. **GitHub**: ارفع المشروع
5. **Vercel**: استورد المشروع + أضف متغيرات البيئة + Deploy

**الوقت المتوقع: 30-45 دقيقة** ⏱️
