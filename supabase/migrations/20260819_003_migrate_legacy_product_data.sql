begin;

-- =========================================================
-- RITSUFLOW LEGACY DATA MIGRATION
-- Creates the initial organization and migrates legacy data.
-- Legacy tables remain unchanged.
-- =========================================================

-- =========================================================
-- PRECONDITION
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from auth.users
  ) then
    raise exception
      'RitsuFlow migration requires at least one authenticated user.';
  end if;
end;
$$;


-- =========================================================
-- INITIAL ORGANIZATION
-- The oldest authenticated user becomes the initial owner.
-- =========================================================

insert into public.organizations (
  name,
  slug,
  owner_user_id
)
select
  'RitsuFlow Development',
  'ritsuflow-development',
  users.id
from auth.users as users
order by users.created_at asc
limit 1
on conflict (slug) do update
set
  name = excluded.name,
  updated_at = now();


-- =========================================================
-- INITIAL ORGANIZATION MEMBERSHIP
-- =========================================================

insert into public.organization_members (
  organization_id,
  user_id,
  role,
  status
)
select
  organization.id,
  organization.owner_user_id,
  'owner',
  'active'
from public.organizations as organization
where organization.slug = 'ritsuflow-development'
on conflict (
  organization_id,
  user_id
) do update
set
  role = 'owner',
  status = 'active';


-- =========================================================
-- LEGACY PROJECTS
-- =========================================================

insert into public.projects (
  organization_id,
  legacy_project_id,
  code,
  name,
  client_name,
  proposal_number,
  contract_number,
  address_line,
  neighborhood,
  city,
  state_region,
  postal_code,
  country_code,
  contract_value,
  status,
  created_by,
  created_at,
  updated_at
)
select
  organization.id,
  legacy_project.id,
  'RF-' || lpad(
    legacy_project.id::text,
    4,
    '0'
  ),
  coalesce(
    nullif(
      btrim(legacy_project.nome_projeto),
      ''
    ),
    'Imported Project ' || legacy_project.id::text
  ),
  nullif(
    btrim(legacy_project.cliente),
    ''
  ),
  nullif(
    btrim(legacy_project.num_proposta),
    ''
  ),
  nullif(
    btrim(legacy_project.num_contrato),
    ''
  ),
  concat_ws(
    ', ',
    nullif(
      btrim(legacy_project.endereco),
      ''
    ),
    nullif(
      btrim(legacy_project.numero),
      ''
    )
  ),
  nullif(
    btrim(legacy_project.bairro),
    ''
  ),
  nullif(
    btrim(legacy_project.cidade),
    ''
  ),
  nullif(
    btrim(legacy_project.estado),
    ''
  ),
  nullif(
    btrim(legacy_project.codigo_postal),
    ''
  ),
  case
    when upper(
      btrim(
        coalesce(
          legacy_project.pais,
          ''
        )
      )
    ) in (
      'BR',
      'BRA',
      'BRASIL',
      'BRAZIL'
    )
      then 'BR'

    when upper(
      btrim(
        coalesce(
          legacy_project.pais,
          ''
        )
      )
    ) in (
      'US',
      'USA',
      'UNITED STATES',
      'UNITED STATES OF AMERICA',
      'ESTADOS UNIDOS'
    )
      then 'US'

    when length(
      btrim(
        coalesce(
          legacy_project.pais,
          ''
        )
      )
    ) = 2
      then upper(
        btrim(
          legacy_project.pais
        )
      )

    else null
  end,
  legacy_project.valor_contrato,
  'planning',
  organization.owner_user_id,
  coalesce(
    legacy_project.created_at,
    now()
  ),
  now()
from public.projetos as legacy_project
cross join public.organizations as organization
where organization.slug = 'ritsuflow-development'
on conflict (legacy_project_id) do update
set
  organization_id = excluded.organization_id,
  code = excluded.code,
  name = excluded.name,
  client_name = excluded.client_name,
  proposal_number = excluded.proposal_number,
  contract_number = excluded.contract_number,
  address_line = excluded.address_line,
  neighborhood = excluded.neighborhood,
  city = excluded.city,
  state_region = excluded.state_region,
  postal_code = excluded.postal_code,
  country_code = excluded.country_code,
  contract_value = excluded.contract_value,
  updated_at = now();


-- =========================================================
-- INITIAL PROJECT MEMBERSHIP
-- =========================================================

insert into public.project_members (
  project_id,
  user_id,
  role
)
select
  project.id,
  organization.owner_user_id,
  'manager'
from public.projects as project
join public.organizations as organization
  on organization.id = project.organization_id
where organization.slug = 'ritsuflow-development'
on conflict (
  project_id,
  user_id
) do update
set
  role = 'manager';


-- =========================================================
-- LEGACY LOCATION KEY
-- Makes the migration repeatable and auditable.
-- =========================================================

create unique index if not exists
  locations_project_legacy_key_index
on public.locations (
  project_id,
  legacy_location_key
)
where legacy_location_key is not null;


-- =========================================================
-- PHASE LOCATIONS
-- =========================================================

with phase_source as (
  select distinct on (
    project.id,
    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Phase'
      )
    )
  )
    project.id as project_id,

    project.created_by,

    coalesce(
      nullif(
        btrim(legacy_scope.fase),
        ''
      ),
      'Unspecified Phase'
    ) as phase_name,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Phase'
      )
    ) as normalized_phase_name

  from public.setorizacao_obras as legacy_scope

  join public.projects as project
    on project.legacy_project_id::text =
       btrim(legacy_scope.projeto_id)

  order by
    project.id,
    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Phase'
      )
    ),
    legacy_scope.id
),

numbered_phases as (
  select
    phase_source.*,

    row_number() over (
      partition by phase_source.project_id
      order by phase_source.phase_name
    )::integer as sequence_number

  from phase_source
)

insert into public.locations (
  project_id,
  parent_id,
  legacy_location_key,
  name,
  location_type,
  environment_type,
  sequence_number,
  created_by
)
select
  numbered_phases.project_id,
  null,

  'legacy-project:'
    || project.legacy_project_id::text
    || '|phase:'
    || numbered_phases.normalized_phase_name,

  numbered_phases.phase_name,
  'phase',
  null,
  numbered_phases.sequence_number,
  numbered_phases.created_by

from numbered_phases

join public.projects as project
  on project.id = numbered_phases.project_id

on conflict (
  project_id,
  legacy_location_key
)
where legacy_location_key is not null
do update
set
  name = excluded.name,
  location_type = excluded.location_type,
  sequence_number = excluded.sequence_number,
  updated_at = now();


-- =========================================================
-- FLOOR LOCATIONS
-- =========================================================

with floor_source as (
  select distinct on (
    project.id,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Phase'
      )
    ),

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.pavimento),
          ''
        ),
        'Unspecified Floor'
      )
    )
  )
    project.id as project_id,

    project.legacy_project_id,

    project.created_by,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Phase'
      )
    ) as normalized_phase_name,

    coalesce(
      nullif(
        btrim(legacy_scope.pavimento),
        ''
      ),
      'Unspecified Floor'
    ) as floor_name,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.pavimento),
          ''
        ),
        'Unspecified Floor'
      )
    ) as normalized_floor_name

  from public.setorizacao_obras as legacy_scope

  join public.projects as project
    on project.legacy_project_id::text =
       btrim(legacy_scope.projeto_id)

  order by
    project.id,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Phase'
      )
    ),

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.pavimento),
          ''
        ),
        'Unspecified Floor'
      )
    ),

    legacy_scope.id
),

numbered_floors as (
  select
    floor_source.*,

    row_number() over (
      partition by
        floor_source.project_id,
        floor_source.normalized_phase_name

      order by floor_source.floor_name
    )::integer as sequence_number

  from floor_source
)

insert into public.locations (
  project_id,
  parent_id,
  legacy_location_key,
  name,
  location_type,
  environment_type,
  sequence_number,
  created_by
)
select
  numbered_floors.project_id,
  phase_location.id,

  'legacy-project:'
    || numbered_floors.legacy_project_id::text
    || '|phase:'
    || numbered_floors.normalized_phase_name
    || '|floor:'
    || numbered_floors.normalized_floor_name,

  numbered_floors.floor_name,
  'floor',
  null,
  numbered_floors.sequence_number,
  numbered_floors.created_by

from numbered_floors

join public.locations as phase_location
  on phase_location.project_id =
     numbered_floors.project_id

 and phase_location.legacy_location_key =
     'legacy-project:'
       || numbered_floors.legacy_project_id::text
       || '|phase:'
       || numbered_floors.normalized_phase_name

on conflict (
  project_id,
  legacy_location_key
)
where legacy_location_key is not null
do update
set
  parent_id = excluded.parent_id,
  name = excluded.name,
  location_type = excluded.location_type,
  sequence_number = excluded.sequence_number,
  updated_at = now();


-- =========================================================
-- AREA LOCATIONS
-- =========================================================

with area_source as (
  select distinct on (
    project.id,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Phase'
      )
    ),

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.pavimento),
          ''
        ),
        'Unspecified Floor'
      )
    ),

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.ambiente),
          ''
        ),
        'Unspecified Area'
      )
    )
  )
    project.id as project_id,

    project.legacy_project_id,

    project.created_by,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Phase'
      )
    ) as normalized_phase_name,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.pavimento),
          ''
        ),
        'Unspecified Floor'
      )
    ) as normalized_floor_name,

    coalesce(
      nullif(
        btrim(legacy_scope.ambiente),
        ''
      ),
      'Unspecified Area'
    ) as area_name,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.ambiente),
          ''
        ),
        'Unspecified Area'
      )
    ) as normalized_area_name,

    nullif(
      btrim(legacy_scope.tipo_ambiente),
      ''
    ) as environment_type

  from public.setorizacao_obras as legacy_scope

  join public.projects as project
    on project.legacy_project_id::text =
       btrim(legacy_scope.projeto_id)

  order by
    project.id,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Phase'
      )
    ),

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.pavimento),
          ''
        ),
        'Unspecified Floor'
      )
    ),

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.ambiente),
          ''
        ),
        'Unspecified Area'
      )
    ),

    legacy_scope.id
),

numbered_areas as (
  select
    area_source.*,

    row_number() over (
      partition by
        area_source.project_id,
        area_source.normalized_phase_name,
        area_source.normalized_floor_name

      order by area_source.area_name
    )::integer as sequence_number

  from area_source
)

insert into public.locations (
  project_id,
  parent_id,
  legacy_location_key,
  name,
  location_type,
  environment_type,
  sequence_number,
  created_by
)
select
  numbered_areas.project_id,
  floor_location.id,

  'legacy-project:'
    || numbered_areas.legacy_project_id::text
    || '|phase:'
    || numbered_areas.normalized_phase_name
    || '|floor:'
    || numbered_areas.normalized_floor_name
    || '|area:'
    || numbered_areas.normalized_area_name,

  numbered_areas.area_name,
  'area',
  numbered_areas.environment_type,
  numbered_areas.sequence_number,
  numbered_areas.created_by

from numbered_areas

join public.locations as floor_location
  on floor_location.project_id =
     numbered_areas.project_id

 and floor_location.legacy_location_key =
     'legacy-project:'
       || numbered_areas.legacy_project_id::text
       || '|phase:'
       || numbered_areas.normalized_phase_name
       || '|floor:'
       || numbered_areas.normalized_floor_name

on conflict (
  project_id,
  legacy_location_key
)
where legacy_location_key is not null
do update
set
  parent_id = excluded.parent_id,
  name = excluded.name,
  location_type = excluded.location_type,
  environment_type = excluded.environment_type,
  sequence_number = excluded.sequence_number,
  updated_at = now();


-- =========================================================
-- SCOPE ITEMS
-- =========================================================

insert into public.scope_items (
  project_id,
  location_id,
  legacy_scope_id,
  service_code,
  service_name,
  quantity,
  unit,
  status,
  metadata,
  created_by
)
select
  project.id,
  area_location.id,
  legacy_scope.id,

  (
    select legacy_service.codigo
    from public.servicos as legacy_service
    where
      legacy_service.codigo =
        legacy_scope.servico

      or legacy_service.descricao_pt =
        legacy_scope.servico

      or legacy_service.descricao_en =
        legacy_scope.servico

    order by legacy_service.id
    limit 1
  ),

  coalesce(
    nullif(
      btrim(legacy_scope.servico),
      ''
    ),
    'Unspecified Service'
  ),

  legacy_scope.quantidade,

  (
    select legacy_service.unidade
    from public.servicos as legacy_service
    where
      legacy_service.codigo =
        legacy_scope.servico

      or legacy_service.descricao_pt =
        legacy_scope.servico

      or legacy_service.descricao_en =
        legacy_scope.servico

    order by legacy_service.id
    limit 1
  ),

  'planned',

  jsonb_strip_nulls(
    jsonb_build_object(
      'migration_source',
      'setorizacao_obras',

      'legacy_project_reference',
      legacy_scope.projeto_id,

      'legacy_phase',
      legacy_scope.fase,

      'legacy_floor',
      legacy_scope.pavimento,

      'legacy_environment',
      legacy_scope.ambiente,

      'legacy_environment_type',
      legacy_scope.tipo_ambiente
    )
  ),

  project.created_by

from public.setorizacao_obras as legacy_scope

join public.projects as project
  on project.legacy_project_id::text =
     btrim(legacy_scope.projeto_id)

join public.locations as area_location
  on area_location.project_id =
     project.id

 and area_location.legacy_location_key =
     'legacy-project:'
       || project.legacy_project_id::text
       || '|phase:'
       || lower(
            coalesce(
              nullif(
                btrim(legacy_scope.fase),
                ''
              ),
              'Unspecified Phase'
            )
          )
       || '|floor:'
       || lower(
            coalesce(
              nullif(
                btrim(legacy_scope.pavimento),
                ''
              ),
              'Unspecified Floor'
            )
          )
       || '|area:'
       || lower(
            coalesce(
              nullif(
                btrim(legacy_scope.ambiente),
                ''
              ),
              'Unspecified Area'
            )
          )

on conflict (legacy_scope_id) do update
set
  project_id = excluded.project_id,
  location_id = excluded.location_id,
  service_code = excluded.service_code,
  service_name = excluded.service_name,
  quantity = excluded.quantity,
  unit = excluded.unit,
  metadata = excluded.metadata,
  updated_at = now();


-- =========================================================
-- DATABASE STATISTICS
-- =========================================================

analyze public.organizations;
analyze public.organization_members;
analyze public.projects;
analyze public.project_members;
analyze public.locations;
analyze public.scope_items;

commit;
