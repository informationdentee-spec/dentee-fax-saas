-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fax_success" BOOLEAN NOT NULL DEFAULT true,
    "fax_failure" BOOLEAN NOT NULL DEFAULT true,
    "system_updates" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "language" TEXT NOT NULL DEFAULT 'ja',
    "pdf_format" TEXT NOT NULL DEFAULT 'A4'
);
INSERT INTO "new_Settings" ("fax_failure", "fax_success", "id", "language", "pdf_format", "system_updates", "timezone") SELECT "fax_failure", "fax_success", "id", "language", "pdf_format", "system_updates", "timezone" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
