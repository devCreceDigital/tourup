-- Script de configuración para el módulo Asistente IA
-- Ejecutar en Supabase SQL Editor antes de implementar

-- Habilitar extensión vector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla 1: Sesiones de chat IA
CREATE TABLE IF NOT EXISTS asistente_ia_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR(64) UNIQUE NOT NULL,
  messages      JSONB NOT NULL DEFAULT '[]',
  intent_data   JSONB,
  language      VARCHAR(5) DEFAULT 'es',
  status        VARCHAR(20) DEFAULT 'active'
                  CHECK (status IN ('active', 'completed', 'expired')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_aia_sessions_token  ON asistente_ia_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_aia_sessions_status ON asistente_ia_sessions(status);
CREATE INDEX IF NOT EXISTS idx_aia_sessions_expires ON asistente_ia_sessions(expires_at);

-- Tabla 2: Leads generados
CREATE TABLE IF NOT EXISTS asistente_ia_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  session_id      UUID NOT NULL REFERENCES asistente_ia_sessions(id),
  traveler_name   VARCHAR(255) NOT NULL,
  traveler_email  VARCHAR(255) NOT NULL,
  traveler_msg    TEXT,
  intent_data     JSONB NOT NULL,
  matched_trip_id UUID REFERENCES viajes(id),
  match_score     DECIMAL(4,3),
  status          VARCHAR(20) DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aia_leads_company ON asistente_ia_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_aia_leads_status  ON asistente_ia_leads(status);
CREATE INDEX IF NOT EXISTS idx_aia_leads_created ON asistente_ia_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aia_leads_session ON asistente_ia_leads(session_id);

-- Tabla 3: Log de embeddings
CREATE TABLE IF NOT EXISTS asistente_ia_embeddings_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('itinerario', 'viaje')),
  entity_id   UUID NOT NULL,
  model_used  VARCHAR(60) NOT NULL,
  dims        INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aia_embeddings_entity ON asistente_ia_embeddings_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_aia_embeddings_created ON asistente_ia_embeddings_log(created_at);

-- Agregar columnas de embedding a tablas existentes
ALTER TABLE IF EXISTS itinerarios 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE IF EXISTS viajes 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Crear índices HNSW para búsqueda vectorial eficiente
CREATE INDEX IF NOT EXISTS idx_itinerarios_embedding 
ON itinerarios USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_viajes_embedding 
ON viajes USING hnsw (embedding vector_cosine_ops);

-- Función para limpiar sesiones expiradas (opcional, se puede ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
BEGIN
  DELETE FROM asistente_ia_sessions 
  WHERE expires_at < NOW() AND status = 'active';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE asistente_ia_sessions IS 'Sesiones de chat del asistente IA';
COMMENT ON TABLE asistente_ia_leads IS 'Leads generados por el asistente IA';
COMMENT ON TABLE asistente_ia_embeddings_log IS 'Log de generación de embeddings';
COMMENT ON COLUMN itinerarios.embedding IS 'Vector de embedding para búsqueda semántica';
COMMENT ON COLUMN viajes.embedding IS 'Vector de embedding para búsqueda semántica';

-- Verificar creación
SELECT 'Tablas creadas exitosamente' as status,
       (SELECT COUNT(*) FROM asistente_ia_sessions) as sessions_count,
       (SELECT COUNT(*) FROM asistente_ia_leads) as leads_count,
       (SELECT COUNT(*) FROM asistente_ia_embeddings_log) as embeddings_count;
