-- RLS multi-tenant para Totem HUB (shared schema)
-- Requiere que la app seteé:
--   set_config('app.current_tenant', '<uuid>', false)
--   set_config('app.current_user_id', '<uuid>', false)
--   set_config('app.current_role', 'superadmin|admin|staff|user', false)

create extension if not exists pgcrypto;

-- Helper seguro: current_setting(..., true) retorna NULL si no existe.
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_tenant', true), '')::uuid
$$;

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid
$$;

create or replace function public.current_role()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.current_role', true), '')
$$;

-- 1) Viajes: tenant_id directo
alter table if exists public.viajes enable row level security;
alter table if exists public.viajes force row level security;

drop policy if exists viajes_isolation on public.viajes;
create policy viajes_isolation
on public.viajes
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

-- 2) Inscripciones: tenant por join a viajes
alter table if exists public.inscripciones enable row level security;
alter table if exists public.inscripciones force row level security;

drop policy if exists inscripciones_isolation on public.inscripciones;
create policy inscripciones_isolation
on public.inscripciones
for all
using (
  exists (
    select 1
    from public.viajes v
    where v.id = inscripciones.viaje_id
      and v.tenant_id = public.current_tenant_id()
  )
)
with check (
  exists (
    select 1
    from public.viajes v
    where v.id = inscripciones.viaje_id
      and v.tenant_id = public.current_tenant_id()
  )
);

-- 3) Documentos: tenant por join inscripciones -> viajes
alter table if exists public.documentos enable row level security;
alter table if exists public.documentos force row level security;

drop policy if exists documentos_isolation on public.documentos;
create policy documentos_isolation
on public.documentos
for all
using (
  exists (
    select 1
    from public.inscripciones i
    join public.viajes v on v.id = i.viaje_id
    where i.id = documentos.inscripcion_id
      and v.tenant_id = public.current_tenant_id()
  )
)
with check (
  exists (
    select 1
    from public.inscripciones i
    join public.viajes v on v.id = i.viaje_id
    where i.id = documentos.inscripcion_id
      and v.tenant_id = public.current_tenant_id()
  )
);

-- 4) Cuotas: tenant por join a viajes
alter table if exists public.cuotas enable row level security;
alter table if exists public.cuotas force row level security;

drop policy if exists cuotas_isolation on public.cuotas;
create policy cuotas_isolation
on public.cuotas
for all
using (
  exists (
    select 1
    from public.viajes v
    where v.id = cuotas.viaje_id
      and v.tenant_id = public.current_tenant_id()
  )
)
with check (
  exists (
    select 1
    from public.viajes v
    where v.id = cuotas.viaje_id
      and v.tenant_id = public.current_tenant_id()
  )
);

-- 5) Pagos: tenant por join pagos -> inscripciones -> viajes
alter table if exists public.pagos enable row level security;
alter table if exists public.pagos force row level security;

drop policy if exists pagos_isolation on public.pagos;
create policy pagos_isolation
on public.pagos
for all
using (
  exists (
    select 1
    from public.inscripciones i
    join public.viajes v on v.id = i.viaje_id
    where i.id = pagos.inscripcion_id
      and v.tenant_id = public.current_tenant_id()
  )
)
with check (
  exists (
    select 1
    from public.inscripciones i
    join public.viajes v on v.id = i.viaje_id
    where i.id = pagos.inscripcion_id
      and v.tenant_id = public.current_tenant_id()
  )
);

-- 6) Perfiles: recomendado mantenerlo limitado por tenant_id
alter table if exists public.perfiles enable row level security;
alter table if exists public.perfiles force row level security;

drop policy if exists perfiles_isolation on public.perfiles;
create policy perfiles_isolation
on public.perfiles
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

-- Nota: permisos por rol (admin/staff/user) se siguen controlando en DRF (RBAC).
-- RLS aqui es aislamiento por tenant. Si quieres harden adicional por usuario (owner-only),
-- lo hacemos en una iteracion siguiente para endpoints de "mi perfil" / "mis pagos".
