-- CreateTable
CREATE TABLE "RealEstateDocumentTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "template_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT,
    "preview_image" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "base_template_id" INTEGER,
    CONSTRAINT "RealEstateDocumentTemplate_base_template_id_fkey" FOREIGN KEY ("base_template_id") REFERENCES "FaxTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MasterCompany" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company_id" INTEGER NOT NULL,
    "preferred_fax_number" TEXT,
    "business_hours" TEXT,
    "contact_person" TEXT,
    "department" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "auto_reply_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "MasterCompany_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FaxAuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fax_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "metadata" TEXT,
    "ip_address" TEXT,
    "user_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FaxAuditLog_fax_id_fkey" FOREIGN KEY ("fax_id") REFERENCES "Fax" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FaxAuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReceivedFaxClassification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "received_fax_id" INTEGER NOT NULL,
    "document_type" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "extracted_fields" TEXT,
    "property_match_id" INTEGER,
    "assigned_user_id" INTEGER,
    "routing_rule_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ReceivedFaxClassification_received_fax_id_fkey" FOREIGN KEY ("received_fax_id") REFERENCES "ReceivedFax" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReceivedFaxClassification_property_match_id_fkey" FOREIGN KEY ("property_match_id") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReceivedFaxClassification_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReceivedFaxTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "received_fax_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReceivedFaxTag_received_fax_id_fkey" FOREIGN KEY ("received_fax_id") REFERENCES "ReceivedFax" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutoReplyTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trigger_type" TEXT NOT NULL,
    "trigger_keywords" TEXT,
    "template_content" TEXT NOT NULL,
    "template_variables" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AutoRoutingRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" TEXT NOT NULL,
    "target_user_id" INTEGER,
    "target_department" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "AutoRoutingRule_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemIntegration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "system_name" TEXT NOT NULL,
    "system_type" TEXT NOT NULL,
    "api_endpoint" TEXT NOT NULL,
    "api_key" TEXT,
    "api_secret" TEXT,
    "config" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PrintJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "received_fax_id" INTEGER,
    "document_type" TEXT NOT NULL,
    "printer_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "PrintJob_received_fax_id_fkey" FOREIGN KEY ("received_fax_id") REFERENCES "ReceivedFax" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterCompany_company_id_key" ON "MasterCompany"("company_id");

-- CreateIndex
CREATE INDEX "FaxAuditLog_fax_id_idx" ON "FaxAuditLog"("fax_id");

-- CreateIndex
CREATE INDEX "FaxAuditLog_created_at_idx" ON "FaxAuditLog"("created_at");

-- CreateIndex
CREATE INDEX "FaxAuditLog_action_idx" ON "FaxAuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivedFaxClassification_received_fax_id_key" ON "ReceivedFaxClassification"("received_fax_id");

-- CreateIndex
CREATE INDEX "ReceivedFaxClassification_document_type_idx" ON "ReceivedFaxClassification"("document_type");

-- CreateIndex
CREATE INDEX "ReceivedFaxClassification_property_match_id_idx" ON "ReceivedFaxClassification"("property_match_id");

-- CreateIndex
CREATE INDEX "ReceivedFaxClassification_assigned_user_id_idx" ON "ReceivedFaxClassification"("assigned_user_id");

-- CreateIndex
CREATE INDEX "ReceivedFaxTag_tag_idx" ON "ReceivedFaxTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivedFaxTag_received_fax_id_tag_key" ON "ReceivedFaxTag"("received_fax_id", "tag");

-- CreateIndex
CREATE INDEX "AutoRoutingRule_priority_idx" ON "AutoRoutingRule"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "SystemIntegration_system_name_key" ON "SystemIntegration"("system_name");

-- CreateIndex
CREATE INDEX "PrintJob_status_idx" ON "PrintJob"("status");

-- CreateIndex
CREATE INDEX "PrintJob_received_fax_id_idx" ON "PrintJob"("received_fax_id");
