-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "enrollments";

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments_outbox" (
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

    CONSTRAINT "enrollments_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_natural_keys" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "document_number" TEXT,
    "enrollment_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_natural_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_health_data" (
    "enrollment_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "allergies" JSONB NOT NULL,
    "medications" JSONB NOT NULL,
    "emergency" JSONB NOT NULL,
    "raw" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollment_health_data_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_idempotency_key_key" ON "enrollments"("idempotency_key");

-- CreateIndex
CREATE INDEX "enrollments_tenant_id_idx" ON "enrollments"("tenant_id");

-- CreateIndex
CREATE INDEX "enrollments_outbox_tenant_id_idx" ON "enrollments_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "enrollments_outbox_processed_at_idx" ON "enrollments_outbox"("processed_at");

-- CreateIndex
CREATE INDEX "enrollments_outbox_retry_count_idx" ON "enrollments_outbox"("retry_count");

-- CreateIndex
CREATE INDEX "enrollment_natural_keys_tenant_id_trip_id_idx" ON "enrollment_natural_keys"("tenant_id", "trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_natural_keys_tenant_id_trip_id_email_document_nu_key" ON "enrollment_natural_keys"("tenant_id", "trip_id", "email", "document_number");

-- CreateIndex
CREATE INDEX "enrollment_health_data_tenant_id_idx" ON "enrollment_health_data"("tenant_id");
