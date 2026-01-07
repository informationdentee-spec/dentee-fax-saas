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
    "image_url" TEXT,
    "visit_date" TEXT,
    "visit_time" TEXT,
    "company_phone" TEXT,
    "template_id" INTEGER,
    "scheduled_at" DATETIME,
    "retry_enabled" BOOLEAN NOT NULL DEFAULT false,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "retry_max" INTEGER NOT NULL DEFAULT 3,
    "retry_interval" INTEGER NOT NULL DEFAULT 60,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Fax_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fax_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fax_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fax_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "FaxTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Fax" ("company_id", "company_phone", "created_at", "fax_number", "id", "image_url", "notes", "property_id", "retry_count", "retry_enabled", "retry_interval", "retry_max", "scheduled_at", "sent_at", "status", "template_id", "unlock_method", "updated_at", "user_id", "visit_date", "visit_time") SELECT "company_id", "company_phone", "created_at", "fax_number", "id", "image_url", "notes", "property_id", "retry_count", "retry_enabled", "retry_interval", "retry_max", "scheduled_at", "sent_at", "status", "template_id", "unlock_method", "updated_at", "user_id", "visit_date", "visit_time" FROM "Fax";
DROP TABLE "Fax";
ALTER TABLE "new_Fax" RENAME TO "Fax";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
