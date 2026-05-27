-- ========================================================
-- Script 03: Tablas faltantes del MVP
-- Ejecutar en el SQL Editor de Supabase
-- ========================================================

-- --------------------------------------------------------
-- CATÁLOGO
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS destinos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    pais VARCHAR(100) NOT NULL,
    descripcion TEXT DEFAULT '',
    latitud DECIMAL(10, 7),
    longitud DECIMAL(10, 7),
    url_video VARCHAR(500) DEFAULT '',
    imagenes JSONB DEFAULT '[]'::jsonb,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT '',
    categoria VARCHAR(30) DEFAULT 'otro',
    duracion_horas DECIMAL(4, 1),
    localizacion VARCHAR(200) DEFAULT '',
    proveedor VARCHAR(200) DEFAULT '',
    imagenes JSONB DEFAULT '[]'::jsonb,
    horarios JSONB DEFAULT '[]'::jsonb,
    destino_id UUID REFERENCES destinos(id) ON DELETE SET NULL,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alojamientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(30) DEFAULT 'hotel',
    categoria_estrellas INTEGER,
    destino_id UUID REFERENCES destinos(id) ON DELETE SET NULL,
    direccion VARCHAR(300) DEFAULT '',
    telefono VARCHAR(50) DEFAULT '',
    email_contacto VARCHAR(254) DEFAULT '',
    imagenes JSONB DEFAULT '[]'::jsonb,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complementos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(30) DEFAULT 'producto',
    descripcion TEXT DEFAULT '',
    proveedor VARCHAR(200) DEFAULT '',
    documentos JSONB DEFAULT '[]'::jsonb,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------
-- ITINERARIOS
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS itinerarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT '',
    version INTEGER DEFAULT 1,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dias_itinerario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerario_id UUID NOT NULL REFERENCES itinerarios(id) ON DELETE CASCADE,
    numero_dia INTEGER NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    resumen TEXT DEFAULT '',
    alojamiento_pernocta VARCHAR(200) DEFAULT '',
    destino_nombre VARCHAR(200) DEFAULT '',
    UNIQUE (itinerario_id, numero_dia)
);

CREATE TABLE IF NOT EXISTS eventos_itinerario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dia_id UUID NOT NULL REFERENCES dias_itinerario(id) ON DELETE CASCADE,
    tipo VARCHAR(30) DEFAULT 'texto_libre',
    descripcion TEXT DEFAULT '',
    hora_inicio TIME,
    hora_fin TIME,
    actividad_id UUID,
    orden INTEGER DEFAULT 0
);

-- --------------------------------------------------------
-- PAGOS (cuotas y pagos)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS cuotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id UUID NOT NULL REFERENCES viajes(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    vencimiento DATE NOT NULL,
    obligatoria BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inscripcion_id UUID NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
    cuota_id UUID REFERENCES cuotas(id) ON DELETE SET NULL,
    monto DECIMAL(10, 2) NOT NULL,
    metodo VARCHAR(50) DEFAULT 'transferencia',
    status VARCHAR(30) DEFAULT 'pendiente',
    referencia_psp VARCHAR(200),
    notas TEXT DEFAULT '',
    pagado_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------
-- DOCUMENTOS
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inscripcion_id UUID NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(80),
    url_archivo TEXT NOT NULL DEFAULT '',
    obligatorio BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    fecha_revision TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------
-- ACTUALIZAR viajes — añadir columna fecha_fin si falta
-- --------------------------------------------------------
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS fecha_fin DATE;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS codigo VARCHAR(50) DEFAULT '';
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS itinerario_id UUID;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS moneda VARCHAR(3) DEFAULT 'USD';
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- --------------------------------------------------------
-- ACTUALIZAR perfiles — añadir tenant_id si falta
-- --------------------------------------------------------
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- --------------------------------------------------------
-- RLS (Row Level Security) — permitir acceso con Service Role
-- --------------------------------------------------------

ALTER TABLE destinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE alojamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE complementos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_itinerario ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_itinerario ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role acceso total" ON destinos USING (true) WITH CHECK (true);
CREATE POLICY "Service Role acceso total" ON actividades USING (true) WITH CHECK (true);
CREATE POLICY "Service Role acceso total" ON alojamientos USING (true) WITH CHECK (true);
CREATE POLICY "Service Role acceso total" ON complementos USING (true) WITH CHECK (true);
CREATE POLICY "Service Role acceso total" ON itinerarios USING (true) WITH CHECK (true);
CREATE POLICY "Service Role acceso total" ON dias_itinerario USING (true) WITH CHECK (true);
CREATE POLICY "Service Role acceso total" ON eventos_itinerario USING (true) WITH CHECK (true);
CREATE POLICY "Service Role acceso total" ON cuotas USING (true) WITH CHECK (true);
CREATE POLICY "Service Role acceso total" ON pagos USING (true) WITH CHECK (true);
CREATE POLICY "Service Role acceso total" ON documentos USING (true) WITH CHECK (true);
