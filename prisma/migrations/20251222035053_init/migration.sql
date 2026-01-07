/*
  Warnings:

  - You are about to drop the column `ocr_company_name` on the `Fax` table. All the data in the column will be lost.
  - You are about to drop the column `ocr_property_name` on the `Fax` table. All the data in the column will be lost.
  - You are about to drop the column `fax_failure` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `fax_success` on the `Settings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fax" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "property_id" INTEGER,
    "company_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "fax_number" TEXT NOT NULL,
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "unlock_method" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Fax_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fax_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Fax_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Fax" ("company_id", "created_at", "fax_number", "id", "notes", "property_id", "sent_at", "status", "unlock_method", "updated_at", "user_id") SELECT "company_id", "created_at", "fax_number", "id", "notes", "property_id", "sent_at", "status", "unlock_method", "updated_at", "user_id" FROM "Fax";
DROP TABLE "Fax";
ALTER TABLE "new_Fax" RENAME TO "Fax";
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company_name" TEXT,
    "company_address" TEXT,
    "company_phone" TEXT,
    "company_fax" TEXT,
    "fax_success_notify" BOOLEAN NOT NULL DEFAULT true,
    "fax_failure_notify" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "language" TEXT NOT NULL DEFAULT 'ja',
    "pdf_format" TEXT NOT NULL DEFAULT 'A4'
);
INSERT INTO "new_Settings" ("id", "language", "pdf_format", "timezone") SELECT "id", "language", "pdf_format", "timezone" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
