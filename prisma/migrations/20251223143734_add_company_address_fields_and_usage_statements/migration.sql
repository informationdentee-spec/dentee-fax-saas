-- AlterTable
ALTER TABLE "Company" ADD COLUMN "building" TEXT;
ALTER TABLE "Company" ADD COLUMN "city" TEXT;
ALTER TABLE "Company" ADD COLUMN "email" TEXT;
ALTER TABLE "Company" ADD COLUMN "postal_code" TEXT;
ALTER TABLE "Company" ADD COLUMN "prefecture" TEXT;
ALTER TABLE "Company" ADD COLUMN "street" TEXT;

-- CreateTable
CREATE TABLE "UsageStatement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usage_month" TEXT NOT NULL,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "received_count" INTEGER NOT NULL DEFAULT 0,
    "base_fee" INTEGER NOT NULL DEFAULT 0,
    "usage_fee" INTEGER NOT NULL DEFAULT 0,
    "tax_amount" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "receipt_pdf" TEXT,
    "payment_pdf" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "card_number_last4" TEXT,
    "card_brand" TEXT,
    "expiry_month" TEXT,
    "expiry_year" TEXT,
    "cardholder_name" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
