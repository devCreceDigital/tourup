create table if not exists assistant.assistant_search_history (
  id uuid primary key,
  tenant_id uuid not null,
  business_id uuid null,
  user_id uuid null,
  user_email text null,
  session_id uuid null,
  query text not null,
  destination text null,
  intent text not null,
  entities jsonb not null default '{}',
  tool_results jsonb not null default '[]',
  embedding jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists assistant_search_history_tenant_id_idx on assistant.assistant_search_history(tenant_id);
create index if not exists assistant_search_history_tenant_user_idx on assistant.assistant_search_history(tenant_id, user_id);
create index if not exists assistant_search_history_tenant_session_idx on assistant.assistant_search_history(tenant_id, session_id);
create index if not exists assistant_search_history_tenant_created_idx on assistant.assistant_search_history(tenant_id, created_at);

select platform_security.apply_tenant_rls('assistant', 'assistant_search_history');
