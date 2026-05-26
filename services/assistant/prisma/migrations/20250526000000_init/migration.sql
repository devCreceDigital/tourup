-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "assistant";

-- CreateTable
CREATE TABLE "assistant_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "business_id" UUID,
    "user_id" UUID,
    "user_email" TEXT,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_leads" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "session_id" UUID,
    "traveler_email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_trip_plans" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID,
    "session_id" UUID,
    "share_token" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_trip_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_memories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "business_id" UUID,
    "user_id" UUID,
    "user_email" TEXT,
    "owner_key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '{}',
    "embedding" JSONB,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source_type" TEXT NOT NULL,
    "source_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_search_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "business_id" UUID,
    "user_id" UUID,
    "user_email" TEXT,
    "session_id" UUID,
    "query" TEXT NOT NULL,
    "destination" TEXT,
    "intent" TEXT NOT NULL,
    "entities" JSONB NOT NULL DEFAULT '{}',
    "tool_results" JSONB NOT NULL DEFAULT '[]',
    "embedding" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_sessions_outbox" (
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

    CONSTRAINT "assistant_sessions_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assistant_sessions_idempotency_key_key" ON "assistant_sessions"("idempotency_key");

-- CreateIndex
CREATE INDEX "assistant_sessions_tenant_id_idx" ON "assistant_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "assistant_sessions_tenant_id_user_id_idx" ON "assistant_sessions"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "assistant_sessions_status_idx" ON "assistant_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_leads_idempotency_key_key" ON "assistant_leads"("idempotency_key");

-- CreateIndex
CREATE INDEX "assistant_leads_tenant_id_idx" ON "assistant_leads"("tenant_id");

-- CreateIndex
CREATE INDEX "assistant_leads_tenant_id_status_idx" ON "assistant_leads"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "assistant_leads_tenant_id_traveler_email_idx" ON "assistant_leads"("tenant_id", "traveler_email");

-- CreateIndex
CREATE INDEX "assistant_leads_session_id_idx" ON "assistant_leads"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_trip_plans_share_token_key" ON "assistant_trip_plans"("share_token");

-- CreateIndex
CREATE INDEX "assistant_trip_plans_tenant_id_idx" ON "assistant_trip_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "assistant_trip_plans_tenant_id_user_id_idx" ON "assistant_trip_plans"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "assistant_trip_plans_session_id_idx" ON "assistant_trip_plans"("session_id");

-- CreateIndex
CREATE INDEX "assistant_trip_plans_is_public_created_at_idx" ON "assistant_trip_plans"("is_public", "created_at");

-- CreateIndex
CREATE INDEX "assistant_memories_tenant_id_idx" ON "assistant_memories"("tenant_id");

-- CreateIndex
CREATE INDEX "assistant_memories_tenant_id_user_id_idx" ON "assistant_memories"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "assistant_memories_tenant_id_kind_idx" ON "assistant_memories"("tenant_id", "kind");

-- CreateIndex
CREATE INDEX "assistant_memories_tenant_id_updated_at_idx" ON "assistant_memories"("tenant_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_memories_tenant_id_owner_key_scope_kind_key_key" ON "assistant_memories"("tenant_id", "owner_key", "scope", "kind", "key");

-- CreateIndex
CREATE INDEX "assistant_search_history_tenant_id_idx" ON "assistant_search_history"("tenant_id");

-- CreateIndex
CREATE INDEX "assistant_search_history_tenant_id_user_id_idx" ON "assistant_search_history"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "assistant_search_history_tenant_id_session_id_idx" ON "assistant_search_history"("tenant_id", "session_id");

-- CreateIndex
CREATE INDEX "assistant_search_history_tenant_id_created_at_idx" ON "assistant_search_history"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "assistant_sessions_outbox_tenant_id_idx" ON "assistant_sessions_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "assistant_sessions_outbox_processed_at_idx" ON "assistant_sessions_outbox"("processed_at");

-- CreateIndex
CREATE INDEX "assistant_sessions_outbox_retry_count_idx" ON "assistant_sessions_outbox"("retry_count");
