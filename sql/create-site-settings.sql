-- Create SiteSettings table for platform configuration
-- Run this on your Neon database if auto-creation doesn't trigger

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

-- Insert default row if not exists
INSERT INTO "SiteSettings" (id)
SELECT 'default'
WHERE NOT EXISTS (SELECT 1 FROM "SiteSettings" WHERE id = 'default');
