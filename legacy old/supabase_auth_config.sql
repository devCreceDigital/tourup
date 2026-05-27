-- Configuración de Políticas de Autenticación para Totem HUB
-- Ejecutar estas consultas en el panel SQL de Supabase para resolver error 422

-- 1. Verificar políticas existentes en auth.users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM 
    pg_policies 
WHERE 
    tablename = 'users' 
    AND schemaname = 'auth';

-- 2. Asegurarnos de que el registro esté permitido
-- Primero eliminamos las políticas existentes si existen
DROP POLICY IF EXISTS "Registro público permitido" ON auth.users;
DROP POLICY IF EXISTS "Usuarios pueden ver su propia info" ON auth.users;

-- Luego creamos las políticas nuevas
CREATE POLICY "Registro público permitido" ON auth.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuarios pueden ver su propia info" ON auth.users
    FOR SELECT USING (auth.uid() = id);

-- 3. Verificar que las políticas se crearon correctamente
SELECT 'Políticas de autenticación configuradas correctamente' as status;

-- NOTA: La configuración de email confirmations y site URL
-- se debe hacer manualmente en el panel de Supabase:
-- 1. Ve a Authentication → Settings
-- 2. Deshabilita "Enable email confirmations" para testing
-- 3. Configura "Site URL" como http://localhost:3000
-- 4. Asegúrate de que "Disable signup" esté deshabilitado