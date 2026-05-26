create table if not exists platform.event_bus_events (
  id uuid primary key,
  tenant_id uuid null,
  source text not null,
  event_type text not null,
  aggregate_id uuid null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists platform_event_bus_events_tenant_id_idx on platform.event_bus_events(tenant_id);
create index if not exists platform_event_bus_events_source_type_idx on platform.event_bus_events(source, event_type);
create index if not exists platform_event_bus_events_received_at_idx on platform.event_bus_events(received_at);

create table if not exists platform.billing_provider_sessions (
  id uuid primary key,
  tenant_id uuid not null,
  plan_id uuid null,
  kind text not null,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_billing_provider_sessions_tenant_id_idx on platform.billing_provider_sessions(tenant_id);
create index if not exists platform_billing_provider_sessions_kind_status_idx on platform.billing_provider_sessions(kind, status);

select platform_security.apply_tenant_rls('platform', 'event_bus_events');
select platform_security.apply_tenant_rls('platform', 'billing_provider_sessions');
