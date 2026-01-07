-- CreateTable
CREATE TABLE "UsageCount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usage_year" INTEGER NOT NULL,
    "usage_month" INTEGER NOT NULL,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "received_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "UsageCount_usage_year_usage_month_idx" ON "UsageCount"("usage_year", "usage_month");

-- CreateIndex
CREATE UNIQUE INDEX "UsageCount_usage_year_usage_month_key" ON "UsageCount"("usage_year", "usage_month");
