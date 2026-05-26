-- Prisma driver adapter resuelve tablas en public; espejo para desarrollo local.
CREATE TABLE IF NOT EXISTS public.assistant_sessions (LIKE assistant.assistant_sessions INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.assistant_leads (LIKE assistant.assistant_leads INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.assistant_trip_plans (LIKE assistant.assistant_trip_plans INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.assistant_memories (LIKE assistant.assistant_memories INCLUDING ALL);

ALTER TABLE public.assistant_sessions ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE public.assistant_sessions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.assistant_sessions ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.assistant_trip_plans ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.assistant_trip_plans ADD COLUMN IF NOT EXISTS user_id UUID;
