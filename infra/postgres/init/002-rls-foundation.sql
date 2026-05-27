create schema if not exists platform_security;

create or replace function platform_security.current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.tenant_id', true), '')::uuid
$$;

create or replace function platform_security.current_user_role()
returns text
language sql
stable
as $$
  select coalesce(nullif(current_setting('app.user_role', true), ''), 'anonymous')
$$;

create or replace function platform_security.apply_tenant_rls()
returns void
language plpgsql
as $$
declare
  target record;
  policy_name text;
begin
  for target in
    select table_schema, table_name
    from information_schema.columns
    where column_name = 'tenant_id'
      and table_schema in (
        'identity',
        'tenancy',
        'catalog',
        'itineraries',
        'trips',
        'enrollments',
        'payments',
        'subscriptions',
        'documents',
        'rooming',
        'notifications',
        'assistant',
        'support',
        'platform',
        'audit'
      )
    group by table_schema, table_name
  loop
    execute format('alter table %I.%I enable row level security', target.table_schema, target.table_name);
    execute format('alter table %I.%I force row level security', target.table_schema, target.table_name);

    policy_name := target.table_name || '_tenant_isolation';
    if not exists (
      select 1
      from pg_policies
      where schemaname = target.table_schema
        and tablename = target.table_name
        and policyname = policy_name
    ) then
      execute format(
        'create policy %I on %I.%I for all using (platform_security.current_user_role() = ''superadmin'' or tenant_id = platform_security.current_tenant_id()) with check (platform_security.current_user_role() = ''superadmin'' or tenant_id = platform_security.current_tenant_id())',
        policy_name,
        target.table_schema,
        target.table_name
      );
    end if;
  end loop;
end;
$$;

select platform_security.apply_tenant_rls();

create or replace function platform_security.apply_tenant_rls_event()
returns event_trigger
language plpgsql
as $$
begin
  if current_setting('app.applying_rls', true) = 'true' then
    return;
  end if;
  perform set_config('app.applying_rls', 'true', true);
  perform platform_security.apply_tenant_rls();
  perform set_config('app.applying_rls', 'false', true);
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_event_trigger
    where evtname = 'totem_apply_tenant_rls'
  ) then
    create event trigger totem_apply_tenant_rls
      on ddl_command_end
      when tag in ('CREATE TABLE', 'ALTER TABLE')
      execute function platform_security.apply_tenant_rls_event();
  end if;
end
$$;



