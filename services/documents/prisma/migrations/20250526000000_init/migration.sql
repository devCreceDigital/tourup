-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "documents";

-- CreateTable
CREATE TABLE "traveler_documents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traveler_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traveler_documents_outbox" (
    "id" UUID NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "tenant_id" UUID,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "last_error_at" TIMESTAMP(3),

    CONSTRAINT "traveler_documents_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_reviews" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "reviewer_user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_storage_objects" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "checksum" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_storage_objects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "traveler_documents_idempotency_key_key" ON "traveler_documents"("idempotency_key");

-- CreateIndex
CREATE INDEX "traveler_documents_tenant_id_idx" ON "traveler_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "traveler_documents_outbox_tenant_id_idx" ON "traveler_documents_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "traveler_documents_outbox_processed_at_idx" ON "traveler_documents_outbox"("processed_at");

-- CreateIndex
CREATE INDEX "traveler_documents_outbox_retry_count_idx" ON "traveler_documents_outbox"("retry_count");

-- CreateIndex
CREATE INDEX "document_reviews_tenant_id_document_id_idx" ON "document_reviews"("tenant_id", "document_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_storage_objects_document_id_key" ON "document_storage_objects"("document_id");

-- CreateIndex
CREATE INDEX "document_storage_objects_tenant_id_idx" ON "document_storage_objects"("tenant_id");
