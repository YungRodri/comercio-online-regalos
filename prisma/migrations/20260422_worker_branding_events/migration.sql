-- AlterEnum: add WORKER role
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'WORKER';

-- AlterTable: add trackingCode and fabricationNote to orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "trackingCode" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fabricationNote" TEXT;

-- Populate trackingCode for existing orders with a unique value
UPDATE "orders" SET "trackingCode" = gen_random_uuid()::text WHERE "trackingCode" IS NULL;

-- Make trackingCode NOT NULL and UNIQUE after populating
ALTER TABLE "orders" ALTER COLUMN "trackingCode" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_trackingCode_key" ON "orders"("trackingCode");
CREATE INDEX IF NOT EXISTS "orders_trackingCode_idx" ON "orders"("trackingCode");

-- AlterTable: add customImage to order_items
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "customImage" TEXT;

-- CreateTable: site_settings
CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "storeName" TEXT NOT NULL DEFAULT 'BasicTechShop',
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "bannerTitle" TEXT,
    "bannerText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: events
CREATE TABLE IF NOT EXISTS "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- Insert default settings row
INSERT INTO "site_settings" ("id", "storeName", "updatedAt")
VALUES ('singleton', 'BasicTechShop', NOW())
ON CONFLICT ("id") DO NOTHING;
