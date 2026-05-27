-- ========================================================
-- Script de Limpieza y Migración Inicial (Supabase)
-- Ejecutar TODO junto en el SQL Editor de Supabase
-- ========================================================

-- 0. LIMPIEZA TOTAL (DROP DE TODO LO VIEJO)
-- CUIDADO: Esto borrará todas tus tablas y datos en la BD "public"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.datos_salud CASCADE;
DROP TABLE IF EXISTS public.inscripciones CASCADE;
DROP TABLE IF EXISTS public.reservas CASCADE;
DROP TABLE IF EXISTS public.viajes CASCADE;
DROP TABLE IF EXISTS public.perfiles CASCADE;

-- 1. Tabla de Perfiles (Se vincula con auth.users de Supabase)
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'viajero',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente cuando un usuario se registra en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombre, rol)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Sin nombre'),
    COALESCE(new.raw_user_meta_data->>'rol', 'viajero')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazamos el trigger a la tabla de auth de Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================================
-- 2. Tablas del Core (Viajes, Inscripciones)
-- ========================================================

CREATE TABLE IF NOT EXISTS viajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    estado VARCHAR(50) DEFAULT 'borrador',
    fecha_inicio DATE,
    cupos INTEGER DEFAULT 0,
    responsable VARCHAR(255),
    configuracion JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viajero_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
    viaje_id UUID NOT NULL REFERENCES viajes(id) ON DELETE RESTRICT,
    datos_personales JSONB DEFAULT '{}'::jsonb,
    tipo_habitacion VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'pre_inscrito',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(viajero_id, viaje_id)
);

CREATE TABLE IF NOT EXISTS datos_salud (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inscripcion_id UUID NOT NULL UNIQUE REFERENCES inscripciones(id) ON DELETE CASCADE,
    alergias TEXT,
    tratamientos TEXT,
    dieta_especial VARCHAR(100),
    movilidad_reducida BOOLEAN DEFAULT FALSE,
    contacto_emergencia JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(100) UNIQUE NOT NULL,
    cliente VARCHAR(255) NOT NULL,
    viaje_id UUID REFERENCES viajes(id) ON DELETE SET NULL,
    pax INTEGER DEFAULT 1,
    monto DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'cotizacion',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) básico para permitir conexiones de Django
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE datos_salud ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso desde el Service Role de Django
CREATE POLICY "Permitir todo a Service Role" ON perfiles USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a Service Role" ON viajes USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a Service Role" ON inscripciones USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a Service Role" ON datos_salud USING (true) WITH CHECK (true);
