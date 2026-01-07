-- CreateTable
CREATE TABLE "ReceivedFax" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "from_fax_number" TEXT NOT NULL,
    "from_company_name" TEXT,
    "received_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "image_url" TEXT,
    "ocr_text" TEXT,
    "ai_summary" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "property_name" TEXT,
    "room_number" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
