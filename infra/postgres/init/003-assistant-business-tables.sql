-- Tablas del bounded context assistant
CREATE TABLE IF NOT EXISTS assistant.assistant_sessions (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  business_id UUID,
  user_id UUID,
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  version INT NOT NULL DEFAULT 1,
  idempotency_key TEXT UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE assistant.assistant_sessions ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE assistant.assistant_sessions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE assistant.assistant_sessions ADD COLUMN IF NOT EXISTS user_email TEXT;

CREATE INDEX IF NOT EXISTS assistant_sessions_tenant_idx ON assistant.assistant_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS assistant_sessions_tenant_user_idx ON assistant.assistant_sessions (tenant_id, user_id);

CREATE TABLE IF NOT EXISTS assistant.assistant_leads (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_id UUID,
  traveler_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  idempotency_key TEXT UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assistant_leads_tenant_idx ON assistant.assistant_leads (tenant_id);
CREATE INDEX IF NOT EXISTS assistant_leads_tenant_status_idx ON assistant.assistant_leads (tenant_id, status);

CREATE TABLE IF NOT EXISTS assistant.assistant_trip_plans (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  user_id UUID,
  session_id UUID,
  share_token TEXT NOT NULL UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE assistant.assistant_trip_plans ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE assistant.assistant_trip_plans ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS assistant_trip_plans_tenant_idx ON assistant.assistant_trip_plans (tenant_id);
CREATE INDEX IF NOT EXISTS assistant_trip_plans_tenant_user_idx ON assistant.assistant_trip_plans (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS assistant_trip_plans_public_idx ON assistant.assistant_trip_plans (is_public, created_at DESC);

CREATE TABLE IF NOT EXISTS assistant.assistant_memories (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  business_id UUID,
  user_id UUID,
  user_email TEXT,
  owner_key TEXT NOT NULL,
  scope TEXT NOT NULL,
  kind TEXT NOT NULL,
  key TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '{}',
  embedding JSONB,
  importance DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  source_type TEXT NOT NULL,
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, owner_key, scope, kind, key)
);

CREATE INDEX IF NOT EXISTS assistant_memories_tenant_idx ON assistant.assistant_memories (tenant_id);
CREATE INDEX IF NOT EXISTS assistant_memories_tenant_user_idx ON assistant.assistant_memories (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS assistant_memories_tenant_kind_idx ON assistant.assistant_memories (tenant_id, kind);
CREATE INDEX IF NOT EXISTS assistant_memories_tenant_updated_idx ON assistant.assistant_memories (tenant_id, updated_at DESC);
