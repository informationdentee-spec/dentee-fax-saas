/*
  Warnings:

  - You are about to drop the column `fax` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `system_updates` on the `Settings` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT
);
INSERT INTO "new_Company" ("address", "id", "name", "phone") SELECT "address", "id", "name", "phone" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fax_success" BOOLEAN NOT NULL DEFAULT true,
    "fax_failure" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "language" TEXT NOT NULL DEFAULT 'ja',
    "pdf_format" TEXT NOT NULL DEFAULT 'A4'
);
INSERT INTO "new_Settings" ("fax_failure", "fax_success", "id", "language", "pdf_format", "timezone") SELECT "fax_failure", "fax_success", "id", "language", "pdf_format", "timezone" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
