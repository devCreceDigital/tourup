-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalog";

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_items_outbox" (
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

    CONSTRAINT "catalog_items_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_items_idempotency_key_key" ON "catalog_items"("idempotency_key");

-- CreateIndex
CREATE INDEX "catalog_items_tenant_id_idx" ON "catalog_items"("tenant_id");

-- CreateIndex
CREATE INDEX "catalog_items_outbox_tenant_id_idx" ON "catalog_items_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "catalog_items_outbox_processed_at_idx" ON "catalog_items_outbox"("processed_at");

-- CreateIndex
CREATE INDEX "catalog_items_outbox_retry_count_idx" ON "catalog_items_outbox"("retry_count");
