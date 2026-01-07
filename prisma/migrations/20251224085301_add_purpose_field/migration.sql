-- AlterTable
ALTER TABLE "Fax" ADD COLUMN "purpose" TEXT;

-- AlterTable
ALTER TABLE "ReceivedFax" ADD COLUMN "context_prediction" TEXT;
ALTER TABLE "ReceivedFax" ADD COLUMN "document_type" TEXT;
ALTER TABLE "ReceivedFax" ADD COLUMN "next_actions" TEXT;
ALTER TABLE "ReceivedFax" ADD COLUMN "status" TEXT DEFAULT 'received';
ALTER TABLE "ReceivedFax" ADD COLUMN "urgency" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "business_card_image" TEXT;
ALTER TABLE "Settings" ADD COLUMN "business_card_template" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'agent',
    "business_card" TEXT,
    "agent_tel" TEXT,
    "agent_email" TEXT
);
INSERT INTO "new_User" ("business_card", "email", "id", "name", "role") SELECT "business_card", "email", "id", "name", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
