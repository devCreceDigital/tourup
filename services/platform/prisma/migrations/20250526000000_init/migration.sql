-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "platform";

-- CreateTable
CREATE TABLE "platform_tenant_views" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_tenant_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_tenant_views_outbox" (
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

    CONSTRAINT "platform_tenant_views_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_bus_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "source" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_id" UUID,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_bus_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_provider_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plan_id" UUID,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_provider_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_tenant_views_idempotency_key_key" ON "platform_tenant_views"("idempotency_key");

-- CreateIndex
CREATE INDEX "platform_tenant_views_tenant_id_idx" ON "platform_tenant_views"("tenant_id");

-- CreateIndex
CREATE INDEX "platform_tenant_views_outbox_tenant_id_idx" ON "platform_tenant_views_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "platform_tenant_views_outbox_processed_at_idx" ON "platform_tenant_views_outbox"("processed_at");

-- CreateIndex
CREATE INDEX "platform_tenant_views_outbox_retry_count_idx" ON "platform_tenant_views_outbox"("retry_count");

-- CreateIndex
CREATE INDEX "event_bus_events_tenant_id_idx" ON "event_bus_events"("tenant_id");

-- CreateIndex
CREATE INDEX "event_bus_events_source_event_type_idx" ON "event_bus_events"("source", "event_type");

-- CreateIndex
CREATE INDEX "event_bus_events_received_at_idx" ON "event_bus_events"("received_at");

-- CreateIndex
CREATE INDEX "billing_provider_sessions_tenant_id_idx" ON "billing_provider_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "billing_provider_sessions_kind_status_idx" ON "billing_provider_sessions"("kind", "status");
