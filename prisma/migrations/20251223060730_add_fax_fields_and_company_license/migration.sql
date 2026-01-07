-- AlterTable
ALTER TABLE "Company" ADD COLUMN "license_number" TEXT;

-- AlterTable
ALTER TABLE "Fax" ADD COLUMN "company_phone" TEXT;
ALTER TABLE "Fax" ADD COLUMN "image_url" TEXT;
ALTER TABLE "Fax" ADD COLUMN "visit_date" TEXT;
ALTER TABLE "Fax" ADD COLUMN "visit_time" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "business_card" TEXT;
