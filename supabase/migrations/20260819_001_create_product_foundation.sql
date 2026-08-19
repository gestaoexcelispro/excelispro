begin;

create extension if not exists pgcrypto;

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key
    references auth.users (id)
    on delete cascade,

  email text,
  full_name text,

  created_at timestamp with time zone
    not null
    default now(),

  updated_at timestamp with time zone
    not null
    default now()
);

create table if not exists public.organizations (
  id uuid primary key
    default gen_random_uuid(),

  name text not null,

  slug text not null unique
    check (
      slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),

  owner_user_id uuid not null
    references auth.users (id)
    on delete restrict,

  created_at timestamp with time zone
    not null
    default now(),

  updated_at timestamp with time zone
    not null
    default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null
    references public.organizations (id)
    on delete cascade,

  user_id uuid not null
    references auth.users (id)
    on delete cascade,

  role text not null
    default 'viewer'
    check (
      role in (
        'owner',
        'admin',
        'planner',
        'viewer'
      )
    ),

  status text not null
    default 'active'
    check (
      status in (
        'active',
        'invited',
        'disabled'
      )
    ),

  joined_at timestamp with time zone
    not null
    default now(),

  primary key (
    organization_id,
    user_id
  )
);

create table if not exists public.projects (
  id uuid primary key
    default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations (id)
    on delete cascade,

  legacy_project_id bigint unique,

  code text,
  name text not null,
  client_name text,

  proposal_number text,
  contract_number text,

  address_line text,
  neighborhood text,
  city text,
  state_region text,
  postal_code text,
  country_code text,

  contract_value numeric
    check (
      contract_value is null
      or contract_value >= 0
    ),

  status text not null
    default 'planning'
    check (
      status in (
        'planning',
        'active',
        'on_hold',
        'completed',
        'archived'
      )
    ),

  planned_start_date date,
  planned_finish_date date,

  created_by uuid not null
    references auth.users (id)
    on delete restrict,

  created_at timestamp with time zone
    not null
    default now(),

  updated_at timestamp with time zone
    not null
    default now(),

  unique (
    organization_id,
    code
  )
);

create table if not exists public.project_members (
  project_id uuid not null
    references public.projects (id)
    on delete cascade,

  user_id uuid not null
    references auth.users (id)
    on delete cascade,

  role text not null
    default 'viewer'
    check (
      role in (
        'manager',
        'planner',
        'field',
        'viewer'
      )
    ),

  joined_at timestamp with time zone
    not null
    default now(),

  primary key (
    project_id,
    user_id
  )
);

create table if not exists public.locations (
  id uuid primary key
    default gen_random_uuid(),

  project_id uuid not null
    references public.projects (id)
    on delete cascade,

  parent_id uuid,

  legacy_location_key text,

  name text not null,

  location_type text not null
    default 'custom'
    check (
      location_type in (
        'phase',
        'building',
        'zone',
        'floor',
        'area',
        'room',
        'custom'
      )
    ),

  environment_type text,

  sequence_number integer not null
    default 0
    check (
      sequence_number >= 0
    ),

  created_by uuid not null
    references auth.users (id)
    on delete restrict,

  created_at timestamp with time zone
    not null
    default now(),

  updated_at timestamp with time zone
    not null
    default now(),

  unique (
    id,
    project_id
  ),

  foreign key (
    parent_id,
    project_id
  )
  references public.locations (
    id,
    project_id
  )
  on delete cascade
);

create table if not exists public.scope_items (
  id uuid primary key
    default gen_random_uuid(),

  project_id uuid not null
    references public.projects (id)
    on delete cascade,

  location_id uuid not null
    references public.locations (id)
    on delete cascade,

  legacy_scope_id bigint unique,

  service_code text,
  service_name text not null,

  quantity numeric
    check (
      quantity is null
      or quantity >= 0
    ),

  unit text,

  status text not null
    default 'planned'
    check (
      status in (
        'planned',
        'ready',
        'in_progress',
        'completed',
        'blocked',
        'cancelled'
      )
    ),

  metadata jsonb not null
    default '{}'::jsonb,

  created_by uuid not null
    references auth.users (id)
    on delete restrict,

  created_at timestamp with time zone
    not null
    default now(),

  updated_at timestamp with time zone
    not null
    default now()
);

create index if not exists
  organization_members_user_id_index
on public.organization_members (
  user_id
);

create index if not exists
  projects_organization_id_index
on public.projects (
  organization_id
);

create index if not exists
  projects_created_by_index
on public.projects (
  created_by
);

create index if not exists
  project_members_user_id_index
on public.project_members (
  user_id
);

create index if not exists
  locations_project_id_index
on public.locations (
  project_id
);

create index if not exists
  locations_parent_id_index
on public.locations (
  parent_id
);

create unique index if not exists
  locations_unique_name_per_parent_index
on public.locations (
  project_id,
  coalesce(
    parent_id,
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  lower(name)
);

create index if not exists
  scope_items_project_id_index
on public.scope_items (
  project_id
);

create index if not exists
  scope_items_location_id_index
on public.scope_items (
  location_id
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists
  profiles_set_updated_at
on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

drop trigger if exists
  organizations_set_updated_at
on public.organizations;

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function private.set_updated_at();

drop trigger if exists
  projects_set_updated_at
on public.projects;

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function private.set_updated_at();

drop trigger if exists
  locations_set_updated_at
on public.locations;

create trigger locations_set_updated_at
before update on public.locations
for each row
execute function private.set_updated_at();

drop trigger if exists
  scope_items_set_updated_at
on public.scope_items;

create trigger scope_items_set_updated_at
before update on public.scope_items
for each row
execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists
  on_ritsuflow_user_created
on auth.users;

create trigger on_ritsuflow_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();

insert into public.profiles (
  id,
  email,
  full_name
)
select
  users.id,
  users.email,
  coalesce(
    users.raw_user_meta_data ->> 'full_name',
    users.raw_user_meta_data ->> 'name'
  )
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(
    public.profiles.full_name,
    excluded.full_name
  );

alter table public.profiles
  enable row level security;

alter table public.organizations
  enable row level security;

alter table public.organization_members
  enable row level security;

alter table public.projects
  enable row level security;

alter table public.project_members
  enable row level security;

alter table public.locations
  enable row level security;

alter table public.scope_items
  enable row level security;

revoke all
on public.profiles
from anon;

revoke all
on public.organizations
from anon;

revoke all
on public.organization_members
from anon;

revoke all
on public.projects
from anon;

revoke all
on public.project_members
from anon;

revoke all
on public.locations
from anon;

revoke all
on public.scope_items
from anon;

grant
  select,
  insert,
  update,
  delete
on public.profiles
to authenticated;

grant
  select,
  insert,
  update,
  delete
on public.organizations
to authenticated;

grant
  select,
  insert,
  update,
  delete
on public.organization_members
to authenticated;

grant
  select,
  insert,
  update,
  delete
on public.projects
to authenticated;

grant
  select,
  insert,
  update,
  delete
on public.project_members
to authenticated;

grant
  select,
  insert,
  update,
  delete
on public.locations
to authenticated;

grant
  select,
  insert,
  update,
  delete
on public.scope_items
to authenticated;

commit;
