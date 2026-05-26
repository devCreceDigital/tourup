-- Corrección de políticas para resolver error 500 en Supabase
-- Ejecutar estas consultas en el panel SQL de Supabase

-- 1. Primero eliminamos TODAS las políticas existentes de auth.users para empezar limpio
DROP POLICY IF EXISTS "Registro público permitido" ON auth.users;
DROP POLICY IF EXISTS "Usuarios pueden ver su propia info" ON auth.users;

-- 2. Política MUY simple para permitir registro (INSERT)
CREATE POLICY "allow_signups" ON auth.users
  FOR INSERT
  WITH CHECK (true);

-- 3. Política para que usuarios vean solo su propia información
CREATE POLICY "users_view_own" ON auth.users
  FOR SELECT
  USING (auth.uid() = id);

-- 4. Política para que usuarios actualicen solo su propia información
CREATE POLICY "users_update_own" ON auth.users
  FOR UPDATE
  USING (auth.uid() = id);

-- 5. Verificar que las políticas se crearon correctamente
SELECT 'Políticas corregidas para auth.users' as status;

-- 6. También verificamos y corregimos políticas para la tabla perfiles
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON perfiles;

-- Políticas simplificadas para perfiles
CREATE POLICY "profiles_view_own" ON perfiles
  FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "profiles_insert_own" ON perfiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "profiles_update_own" ON perfiles
  FOR UPDATE
  USING (auth.uid()::text = id::text);

SELECT 'Políticas corregidas para perfiles' as status;

-- 7. Verificación final de todas las políticas
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd
FROM 
    pg_policies 
WHERE 
    schemaname IN ('auth', 'public')
    AND tablename IN ('users', 'perfiles');