-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "trips";

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips_outbox" (
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

    CONSTRAINT "trips_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_landings" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "hero_image" TEXT,
    "content" JSONB NOT NULL,
    "published_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_landings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_operations" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trips_idempotency_key_key" ON "trips"("idempotency_key");

-- CreateIndex
CREATE INDEX "trips_tenant_id_idx" ON "trips"("tenant_id");

-- CreateIndex
CREATE INDEX "trips_outbox_tenant_id_idx" ON "trips_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "trips_outbox_processed_at_idx" ON "trips_outbox"("processed_at");

-- CreateIndex
CREATE INDEX "trips_outbox_retry_count_idx" ON "trips_outbox"("retry_count");

-- CreateIndex
CREATE UNIQUE INDEX "trip_landings_trip_id_key" ON "trip_landings"("trip_id");

-- CreateIndex
CREATE INDEX "trip_landings_tenant_id_idx" ON "trip_landings"("tenant_id");

-- CreateIndex
CREATE INDEX "trip_operations_tenant_id_trip_id_idx" ON "trip_operations"("tenant_id", "trip_id");

-- CreateIndex
CREATE INDEX "trip_operations_starts_at_idx" ON "trip_operations"("starts_at");
