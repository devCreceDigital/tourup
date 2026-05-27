create extension if not exists pgcrypto;

create table if not exists public.plans (
    id uuid primary key default gen_random_uuid(),
    name varchar(120) not null,
    description text not null default '',
    price_monthly numeric(10, 2),
    price_yearly numeric(10, 2),
    max_trips integer,
    max_inscriptions integer,
    features jsonb not null default '[]'::jsonb,
    is_active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    constraint plans_max_trips_non_negative check (max_trips is null or max_trips >= 0),
    constraint plans_max_inscriptions_non_negative check (
        max_inscriptions is null or max_inscriptions >= 0
    ),
    constraint plans_features_array check (jsonb_typeof(features) = 'array')
);

create unique index if not exists plans_name_unique_idx
    on public.plans (lower(name));

alter table if exists public.tenants
    add column if not exists plan_id uuid null;

create index if not exists tenants_plan_id_idx
    on public.tenants (plan_id);

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'tenants_plan_id_fk'
    ) then
        alter table public.tenants
            add constraint tenants_plan_id_fk
            foreign key (plan_id)
            references public.plans (id)
            on delete set null;
    end if;
end
$$;
