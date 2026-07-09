-- Create all new tables for platform settings + dynamic pricing
-- Run on your Neon database: psql $DATABASE_URL -f sql/create-tables.sql

-- 1. SiteSettings for admin platform configuration
CREATE TABLE IF NOT EXISTS "SiteSettings" (
  id TEXT PRIMARY KEY DEFAULT 'default',
  "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 15,
  "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 15,
  "freeWaitingMin" INTEGER NOT NULL DEFAULT 5,
  "lateFeePerMin" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "supportPhone" TEXT NOT NULL DEFAULT '0575015019',
  "supportEmail" TEXT NOT NULL DEFAULT 'support@uber.sa',
  "adminEmail" TEXT NOT NULL DEFAULT 'grouthhacker@gmail.com',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "SiteSettings" (id)
SELECT 'default'
WHERE NOT EXISTS (SELECT 1 FROM "SiteSettings" WHERE id = 'default');

-- 2. ServicePrice for dynamic pricing per service type
CREATE TABLE IF NOT EXISTS "ServicePrice" (
  id TEXT PRIMARY KEY,
  "serviceId" TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  "basePrice" DOUBLE PRECISION NOT NULL DEFAULT 8,
  "perKm" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
  "perMin" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  "minPrice" DOUBLE PRECISION NOT NULL DEFAULT 12,
  seats INTEGER NOT NULL DEFAULT 4,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ServicePrice_serviceId_idx" ON "ServicePrice" ("serviceId");
CREATE INDEX IF NOT EXISTS "ServicePrice_isActive_idx" ON "ServicePrice" ("isActive");

-- Seed default service prices (run once)
INSERT INTO "ServicePrice" (id, "serviceId", name, "basePrice", "perKm", "perMin", "minPrice", seats)
SELECT 'sp_ride', 'ride', 'أوبر X', 8, 1.5, 0.25, 12, 4
WHERE NOT EXISTS (SELECT 1 FROM "ServicePrice" WHERE "serviceId" = 'ride');

INSERT INTO "ServicePrice" (id, "serviceId", name, "basePrice", "perKm", "perMin", "minPrice", seats)
SELECT 'sp_comfort', 'comfort', 'أوبر كومفورت', 12, 2.2, 0.35, 18, 4
WHERE NOT EXISTS (SELECT 1 FROM "ServicePrice" WHERE "serviceId" = 'comfort');

INSERT INTO "ServicePrice" (id, "serviceId", name, "basePrice", "perKm", "perMin", "minPrice", seats)
SELECT 'sp_premium', 'premium', 'أوبر بريميوم', 20, 3.5, 0.5, 30, 4
WHERE NOT EXISTS (SELECT 1 FROM "ServicePrice" WHERE "serviceId" = 'premium');

INSERT INTO "ServicePrice" (id, "serviceId", name, "basePrice", "perKm", "perMin", "minPrice", seats)
SELECT 'sp_xl', 'xl', 'أوبر XL', 15, 2.8, 0.4, 25, 6
WHERE NOT EXISTS (SELECT 1 FROM "ServicePrice" WHERE "serviceId" = 'xl');

INSERT INTO "ServicePrice" (id, "serviceId", name, "basePrice", "perKm", "perMin", "minPrice", seats)
SELECT 'sp_bike', 'bike', 'أوبر بايك', 5, 0.9, 0.15, 8, 1
WHERE NOT EXISTS (SELECT 1 FROM "ServicePrice" WHERE "serviceId" = 'bike');

INSERT INTO "ServicePrice" (id, "serviceId", name, "basePrice", "perKm", "perMin", "minPrice", seats)
SELECT 'sp_food', 'food', 'أوبر إيتس', 6, 1.0, 0.2, 10, 0
WHERE NOT EXISTS (SELECT 1 FROM "ServicePrice" WHERE "serviceId" = 'food');

INSERT INTO "ServicePrice" (id, "serviceId", name, "basePrice", "perKm", "perMin", "minPrice", seats)
SELECT 'sp_package', 'package', 'أوبر توصيل', 10, 1.5, 0.25, 15, 0
WHERE NOT EXISTS (SELECT 1 FROM "ServicePrice" WHERE "serviceId" = 'package');

INSERT INTO "ServicePrice" (id, "serviceId", name, "basePrice", "perKm", "perMin", "minPrice", seats)
SELECT 'sp_truck', 'truck', 'أوبر شاحنة', 30, 4.5, 0.8, 50, 0
WHERE NOT EXISTS (SELECT 1 FROM "ServicePrice" WHERE "serviceId" = 'truck');
