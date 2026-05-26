-- ========================================================
-- Script para agregar datos de prueba (Mocks) a la BD
-- Ejecutar en el SQL Editor de Supabase
-- ========================================================

-- Insertar un viaje de prueba
INSERT INTO public.viajes (nombre, slug, estado, fecha_inicio, cupos, responsable)
VALUES (
    '5D4N CUZCO VALLE SAGRADO (Promo 2026)',
    '5d4n-cuzco-promo-2026',
    'publicado',
    '2026-10-15',
    40,
    'Admin General'
)
ON CONFLICT (slug) DO NOTHING;

-- Insertar un segundo viaje en borrador
INSERT INTO public.viajes (nombre, slug, estado, fecha_inicio, cupos, responsable)
VALUES (
    'Full Day Paracas & Huacachina',
    'full-day-paracas-huacachina',
    'borrador',
    '2026-03-20',
    60,
    'Admin General'
)
ON CONFLICT (slug) DO NOTHING;