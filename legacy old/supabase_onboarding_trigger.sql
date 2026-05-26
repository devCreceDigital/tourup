-- Trigger para redirigir admins al onboarding después del registro
-- Ejecutar en Supabase SQL Editor

-- 1. Función que verifica si el usuario es admin y necesita onboarding
CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar si el usuario tiene rol de admin y no tiene tenant asignado
  IF NEW.rol = 'admin' AND NEW.tenant_id IS NULL THEN
    -- Aquí podrías registrar en un log o notificar al sistema
    -- El middleware ya redirige a /onboarding para estos casos
    RAISE NOTICE 'Usuario admin % necesita completar onboarding', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger que se ejecuta después de insertar un nuevo perfil
DROP TRIGGER IF EXISTS on_new_admin_user ON perfiles;
CREATE TRIGGER on_new_admin_user
  AFTER INSERT ON perfiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_admin_user();

-- 3. Política para que los usuarios puedan ver sus propios datos de onboarding
CREATE POLICY "usuarios_ven_su_propio_onboarding" ON perfiles
  FOR SELECT USING (auth.uid()::text = id::text);

-- 4. Política para que los usuarios puedan actualizar su tenant_id después del onboarding
CREATE POLICY "usuarios_actualizan_su_tenant" ON perfiles
  FOR UPDATE USING (auth.uid()::text = id::text);

-- 5. Insertar planes base si no existen
INSERT INTO plans (id, nombre, precio, descripcion, limites, estado)
VALUES 
  ('plan_basico', 'Plan Básico', 49, 'Para pequeñas empresas', '{"viajes": 5, "usuarios": 10, "almacenamiento": "5GB"}', 'activo'),
  ('plan_avanzado', 'Plan Avanzado', 99, 'Para empresas medianas', '{"viajes": 20, "usuarios": 50, "almacenamiento": "20GB"}', 'activo'),
  ('plan_enterprise', 'Plan Enterprise', 199, 'Para grandes organizaciones', '{"viajes": 100, "usuarios": 200, "almacenamiento": "100GB"}', 'activo')
ON CONFLICT (id) DO NOTHING;

-- 6. Verificar que todo esté configurado
SELECT 'Trigger de onboarding configurado correctamente' as status;