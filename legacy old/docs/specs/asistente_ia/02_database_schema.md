# Spec 02 — Schema de Base de Datos

> SSD: Ejecutar este SQL en Supabase antes de implementar. Nunca usar `manage.py migrate`.

---

## Prerequisito

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Tabla 1: asistente_ia_sessions

```sql
CREATE TABLE asistente_ia_sessions (
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

CREATE INDEX idx_aia_sessions_token  ON asistente_ia_sessions(session_token);
CREATE INDEX idx_aia_sessions_status ON asistente_ia_sessions(status);
```

**Estructura del campo `messages`:**
```json
[
  { "role": "assistant", "content": "Hola, soy Asistente IA...", "ts": "2026-05-05T10:00:00Z" },
  { "role": "user",      "content": "Quiero ir a destino-ejemplo en julio", "ts": "2026-05-05T10:00:10Z" }
]
```

**Estructura del campo `intent_data`:**
```json
{
  "destination": "string",
  "duration": "string",
  "group_type": "familiar|pareja|amigos|escolar|corporativo",
  "group_size": 0,
  "budget_range": "economico|mid-range|premium",
  "interests": ["string"],
  "departure_month": "string",
  "confidence_score": 0.0,
  "fields_detected": 0
}
```

---

## Tabla 2: asistente_ia_leads

```sql
CREATE TABLE asistente_ia_leads (
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

CREATE INDEX idx_aia_leads_company ON asistente_ia_leads(company_id);
CREATE INDEX idx_aia_leads_status  ON asistente_ia_leads(status);
CREATE INDEX idx_aia_leads_created ON asistente_ia_leads(created_at DESC);
```

---

## Tabla 3: asistente_ia_embeddings_log

```sql
CREATE TABLE asistente_ia_embeddings_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('itinerario', 'viaje')),
  entity_id   UUID NOT NULL,
  model_used  VARCHAR(60) NOT NULL,
  dims        INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ALTER en tablas existentes

```sql
ALTER TABLE itinerarios
  ADD COLUMN IF NOT EXISTS embedding            vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

ALTER TABLE viajes
  ADD COLUMN IF NOT EXISTS embedding            vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_itinerarios_embedding
  ON itinerarios USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_viajes_embedding
  ON viajes USING hnsw (embedding vector_cosine_ops);
```

---

## Texto compuesto para embedding

**Itinerario:**
```
"{nombre}. {descripcion}. Destinos: {lista_destinos}.
 Actividades: {lista_actividades}. Duración: {duracion_dias} días.
 Tipo de grupo: {tipo_grupo}."
```

**Viaje:**
```
"{nombre}. {descripcion}. Agencia: {nombre_agencia}.
 Duración: {duracion} días. Salida: {fecha_inicio}.
 Precio desde: {precio_base}. Plazas: {cupos}."
```

---

## Archivo del script

```
backend/scripts/asistente_ia_setup.sql
```

Ejecutar una sola vez en Supabase SQL Editor.
