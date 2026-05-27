create table if not exists identity.refresh_tokens (
  id uuid primary key,
  user_id uuid not null,
  tenant_id uuid null,
  token_hash text not null unique,
  user_agent text null,
  ip_address text null,
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists identity_refresh_tokens_user_id_idx on identity.refresh_tokens(user_id);
create index if not exists identity_refresh_tokens_tenant_id_idx on identity.refresh_tokens(tenant_id);
create index if not exists identity_refresh_tokens_expires_at_idx on identity.refresh_tokens(expires_at);

select platform_security.apply_tenant_rls('identity', 'refresh_tokens');
