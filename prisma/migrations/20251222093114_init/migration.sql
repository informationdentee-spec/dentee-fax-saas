/*
  Warnings:

  - Made the column `company_id` on table `Fax` required. This step will fail if there are existing NULL values in that column.
  - Made the column `property_id` on table `Fax` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Property` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fax" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "property_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "fax_number" TEXT NOT NULL,
    "sent_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "unlock_method" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Fax_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fax_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fax_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Fax" ("company_id", "created_at", "fax_number", "id", "notes", "property_id", "sent_at", "status", "unlock_method", "updated_at", "user_id") SELECT "company_id", "created_at", "fax_number", "id", "notes", "property_id", "sent_at", "status", "unlock_method", "updated_at", "user_id" FROM "Fax";
DROP TABLE "Fax";
ALTER TABLE "new_Fax" RENAME TO "Fax";
CREATE TABLE "new_Property" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "room_number" TEXT,
    "company_id" INTEGER NOT NULL,
    CONSTRAINT "Property_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "company_id", "id", "name", "room_number") SELECT "address", "company_id", "id", "name", "room_number" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL
);
INSERT INTO "new_User" ("email", "id", "name", "role") SELECT "email", "id", "name", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
