-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events_outbox" (
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

    CONSTRAINT "audit_events_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audit_events_idempotency_key_key" ON "audit_events"("idempotency_key");

-- CreateIndex
CREATE INDEX "audit_events_tenant_id_idx" ON "audit_events"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_events_outbox_tenant_id_idx" ON "audit_events_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_events_outbox_processed_at_idx" ON "audit_events_outbox"("processed_at");

-- CreateIndex
CREATE INDEX "audit_events_outbox_retry_count_idx" ON "audit_events_outbox"("retry_count");
