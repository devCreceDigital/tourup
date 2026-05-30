-- Directorio de Prestadores Turísticos (TTDMI / MINCETUR)
-- Tablas independientes del esquema principal de totem_hub

CREATE TABLE IF NOT EXISTS operators (
  id                   SERIAL PRIMARY KEY,
  legal_name           TEXT NOT NULL,
  commercial_name      TEXT NOT NULL,
  ruc                  TEXT UNIQUE,
  region               TEXT NOT NULL,
  province             TEXT,
  district             TEXT,
  operator_type        TEXT NOT NULL,
  niche                TEXT,
  languages            TEXT[]   NOT NULL DEFAULT ARRAY['es'],
  verified             BOOLEAN  NOT NULL DEFAULT false,
  ttdmi_score          DECIMAL(5,2) NOT NULL DEFAULT 0,
  level                TEXT     NOT NULL DEFAULT 'risk',
  website              TEXT,
  logo_url             TEXT,
  description          TEXT,
  phone                TEXT,
  email                TEXT,
  rank_nacional        INTEGER,
  clase                TEXT,
  modalidad_autorizada TEXT,
  rep_legal            TEXT,
  nro_certificado      TEXT,
  fecha_expedicion     TEXT,
  ubigeo               TEXT,
  fecha_corte          TEXT,
  source               TEXT     NOT NULL DEFAULT 'manual',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trust_scores (
  id               SERIAL PRIMARY KEY,
  operator_id      INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  total_score      DECIMAL(5,2) NOT NULL DEFAULT 0,
  reviews_score    DECIMAL(5,2) NOT NULL DEFAULT 0,
  social_score     DECIMAL(5,2) NOT NULL DEFAULT 0,
  website_score    DECIMAL(5,2) NOT NULL DEFAULT 0,
  seo_score        DECIMAL(5,2) NOT NULL DEFAULT 0,
  engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  formalidad_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  conversion_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  freshness_score  DECIMAL(5,2) NOT NULL DEFAULT 0,
  network_score    DECIMAL(5,2) NOT NULL DEFAULT 0,
  validation_factor DECIMAL(4,3) NOT NULL DEFAULT 1,
  score_details    JSONB,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_profiles (
  id              SERIAL PRIMARY KEY,
  operator_id     INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  handle          TEXT,
  followers       INTEGER NOT NULL DEFAULT 0,
  engagement_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  verified        BOOLEAN NOT NULL DEFAULT false,
  last_post_date  TIMESTAMPTZ,
  posts_per_week  DECIMAL(5,2),
  UNIQUE (operator_id, platform)
);

CREATE TABLE IF NOT EXISTS reviews (
  id                SERIAL PRIMARY KEY,
  operator_id       INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  source            TEXT NOT NULL,
  rating            DECIMAL(3,1) NOT NULL,
  sentiment         DECIMAL(4,3),
  review_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  authenticity_score DECIMAL(4,3) NOT NULL DEFAULT 0.8,
  review_count      INTEGER NOT NULL DEFAULT 0,
  UNIQUE (operator_id, source)
);

CREATE TABLE IF NOT EXISTS booking_capabilities (
  id                   SERIAL PRIMARY KEY,
  operator_id          INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  booking_engine       BOOLEAN NOT NULL DEFAULT false,
  online_payment       BOOLEAN NOT NULL DEFAULT false,
  whatsapp_cta         BOOLEAN NOT NULL DEFAULT false,
  chatbot              BOOLEAN NOT NULL DEFAULT false,
  lead_form            BOOLEAN NOT NULL DEFAULT false,
  response_time_hours  DECIMAL(5,1),
  ota_presence         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  UNIQUE (operator_id)
);

CREATE TABLE IF NOT EXISTS certifications (
  id          SERIAL PRIMARY KEY,
  operator_id INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  issuer      TEXT NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT false,
  expiry_date TIMESTAMPTZ,
  UNIQUE (operator_id, name)
);

CREATE TABLE IF NOT EXISTS seo_metrics (
  id               SERIAL PRIMARY KEY,
  operator_id      INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  domain_authority INTEGER NOT NULL DEFAULT 0,
  backlinks        INTEGER NOT NULL DEFAULT 0,
  organic_traffic  INTEGER NOT NULL DEFAULT 0,
  keywords         INTEGER NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
