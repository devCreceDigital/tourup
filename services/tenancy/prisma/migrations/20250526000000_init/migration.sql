-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenancy";

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants_outbox" (
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

    CONSTRAINT "tenants_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_preferences" (
    "tenant_id" UUID NOT NULL,
    "logo_url" TEXT,
    "primary_color" TEXT NOT NULL,
    "secondary_color" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "banner_url" TEXT,
    "slogan" TEXT NOT NULL,
    "custom_domain" TEXT,
    "social_links" JSONB NOT NULL,
    "preferences" JSONB NOT NULL,
    "onboarding_step" INTEGER NOT NULL,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_preferences_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_idempotency_key_key" ON "tenants"("idempotency_key");

-- CreateIndex
CREATE INDEX "tenants_tenant_id_idx" ON "tenants"("tenant_id");

-- CreateIndex
CREATE INDEX "tenants_outbox_tenant_id_idx" ON "tenants_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "tenants_outbox_processed_at_idx" ON "tenants_outbox"("processed_at");

-- CreateIndex
CREATE INDEX "tenants_outbox_retry_count_idx" ON "tenants_outbox"("retry_count");
