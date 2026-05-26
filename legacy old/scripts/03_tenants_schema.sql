create extension if not exists pgcrypto;

create table if not exists public.tenants (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    domain varchar(255) not null,
    status varchar(20) not null default 'active',
    created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists tenants_domain_unique_idx
    on public.tenants (lower(domain));

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'tenants_status_check'
    ) then
        alter table public.tenants
            add constraint tenants_status_check
            check (status in ('active', 'inactive', 'suspended'));
    end if;
end
$$;
