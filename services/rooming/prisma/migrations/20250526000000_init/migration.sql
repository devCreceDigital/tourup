-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "rooming";

-- CreateTable
CREATE TABLE "rooming_plans" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooming_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooming_trip_plans" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooming_trip_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooming_plans_outbox" (
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

    CONSTRAINT "rooming_plans_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooming_plans_idempotency_key_key" ON "rooming_plans"("idempotency_key");

-- CreateIndex
CREATE INDEX "rooming_plans_tenant_id_idx" ON "rooming_plans"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooming_trip_plans_idempotency_key_key" ON "rooming_trip_plans"("idempotency_key");

-- CreateIndex
CREATE INDEX "rooming_trip_plans_tenant_id_idx" ON "rooming_trip_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "rooming_trip_plans_tenant_id_trip_id_idx" ON "rooming_trip_plans"("tenant_id", "trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooming_trip_plans_tenant_id_trip_id_key" ON "rooming_trip_plans"("tenant_id", "trip_id");

-- CreateIndex
CREATE INDEX "rooming_plans_outbox_tenant_id_idx" ON "rooming_plans_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "rooming_plans_outbox_processed_at_idx" ON "rooming_plans_outbox"("processed_at");

-- CreateIndex
CREATE INDEX "rooming_plans_outbox_retry_count_idx" ON "rooming_plans_outbox"("retry_count");
