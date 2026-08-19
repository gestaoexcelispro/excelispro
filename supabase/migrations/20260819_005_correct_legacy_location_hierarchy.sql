begin;

-- =========================================================
-- RITSUFLOW LEGACY LOCATION HIERARCHY CORRECTION
--
-- Previous hierarchy:
-- Project -> Phase -> Floor -> Area
--
-- Correct hierarchy:
-- Project -> Floor -> Zone -> Area
--
-- Legacy "fase" values represent physical zones, blocks,
-- or sectors rather than temporal production phases.
-- =========================================================


-- =========================================================
-- ROOT FLOOR LOCATIONS
-- =========================================================

with floor_source as (
  select distinct on (
    project.id,

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
      partition by floor_source.project_id
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
  null,

  'legacy-project:'
    || numbered_floors.legacy_project_id::text
    || '|floor:'
    || numbered_floors.normalized_floor_name,

  numbered_floors.floor_name,
  'floor',
  null,
  numbered_floors.sequence_number,
  numbered_floors.created_by

from numbered_floors

on conflict (
  project_id,
  legacy_location_key
)
where legacy_location_key is not null
do update
set
  parent_id = null,
  name = excluded.name,
  location_type = 'floor',
  sequence_number = excluded.sequence_number,
  updated_at = now();


-- =========================================================
-- ZONE LOCATIONS
-- Legacy "fase" becomes a physical zone.
-- =========================================================

with zone_source as (
  select distinct on (
    project.id,

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
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Zone'
      )
    )
  )
    project.id as project_id,
    project.legacy_project_id,
    project.created_by,

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
        btrim(legacy_scope.fase),
        ''
      ),
      'Unspecified Zone'
    ) as zone_name,

    lower(
      coalesce(
        nullif(
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Zone'
      )
    ) as normalized_zone_name

  from public.setorizacao_obras as legacy_scope

  join public.projects as project
    on project.legacy_project_id::text =
       btrim(legacy_scope.projeto_id)

  order by
    project.id,

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
          btrim(legacy_scope.fase),
          ''
        ),
        'Unspecified Zone'
      )
    ),

    legacy_scope.id
),

numbered_zones as (
  select
    zone_source.*,

    row_number() over (
      partition by
        zone_source.project_id,
        zone_source.normalized_floor_name

      order by zone_source.zone_name
    )::integer as sequence_number

  from zone_source
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
  numbered_zones.project_id,
  floor_location.id,

  'legacy-project:'
    || numbered_zones.legacy_project_id::text
    || '|floor:'
    || numbered_zones.normalized_floor_name
    || '|zone:'
    || numbered_zones.normalized_zone_name,

  numbered_zones.zone_name,
  'zone',
  null,
  numbered_zones.sequence_number,
  numbered_zones.created_by

from numbered_zones

join public.locations as floor_location
  on floor_location.project_id =
     numbered_zones.project_id

 and floor_location.legacy_location_key =
     'legacy-project:'
       || numbered_zones.legacy_project_id::text
       || '|floor:'
       || numbered_zones.normalized_floor_name

on conflict (
  project_id,
  legacy_location_key
)
where legacy_location_key is not null
do update
set
  parent_id = excluded.parent_id,
  name = excluded.name,
  location_type = 'zone',
  sequence_number = excluded.sequence_number,
  updated_at = now();


-- =========================================================
-- MOVE EXISTING AREAS UNDER THE CORRECT ZONES
-- Existing area IDs are preserved.
-- Existing scope item references remain valid.
-- =========================================================

with area_mapping as (
  select distinct on (
    area_location.id
  )
    area_location.id as area_id,
    zone_location.id as zone_id,

    'legacy-project:'
      || project.legacy_project_id::text
      || '|floor:'
      || lower(
           coalesce(
             nullif(
               btrim(
                 legacy_scope.pavimento
               ),
               ''
             ),
             'Unspecified Floor'
           )
         )
      || '|zone:'
      || lower(
           coalesce(
             nullif(
               btrim(
                 legacy_scope.fase
               ),
               ''
             ),
             'Unspecified Zone'
           )
         )
      || '|area:'
      || lower(
           coalesce(
             nullif(
               btrim(
                 legacy_scope.ambiente
               ),
               ''
             ),
             'Unspecified Area'
           )
         ) as corrected_location_key

  from public.setorizacao_obras
    as legacy_scope

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
                  btrim(
                    legacy_scope.fase
                  ),
                  ''
                ),
                'Unspecified Phase'
              )
            )
         || '|floor:'
         || lower(
              coalesce(
                nullif(
                  btrim(
                    legacy_scope.pavimento
                  ),
                  ''
                ),
                'Unspecified Floor'
              )
            )
         || '|area:'
         || lower(
              coalesce(
                nullif(
                  btrim(
                    legacy_scope.ambiente
                  ),
                  ''
                ),
                'Unspecified Area'
              )
            )

  join public.locations as zone_location
    on zone_location.project_id =
       project.id

   and zone_location.legacy_location_key =
       'legacy-project:'
         || project.legacy_project_id::text
         || '|floor:'
         || lower(
              coalesce(
                nullif(
                  btrim(
                    legacy_scope.pavimento
                  ),
                  ''
                ),
                'Unspecified Floor'
              )
            )
         || '|zone:'
         || lower(
              coalesce(
                nullif(
                  btrim(
                    legacy_scope.fase
                  ),
                  ''
                ),
                'Unspecified Zone'
              )
            )

  order by
    area_location.id,
    legacy_scope.id
)

update public.locations as area
set
  parent_id =
    area_mapping.zone_id,

  legacy_location_key =
    area_mapping.corrected_location_key,

  location_type = 'area',
  updated_at = now()

from area_mapping

where area.id =
  area_mapping.area_id;


-- =========================================================
-- SAFETY CHECKS
-- The transaction stops before deleting old nodes if any
-- migrated area remains under the old hierarchy.
-- =========================================================

do $$
begin
  if exists (
    select 1

    from public.locations
      as child_location

    join public.locations
      as old_floor

      on old_floor.id =
         child_location.parent_id

    where old_floor.legacy_location_key
      like 'legacy-project:%|phase:%|floor:%'
  ) then
    raise exception
      'Location correction stopped: an existing location remains connected to the old floor hierarchy.';
  end if;


  if exists (
    select 1

    from public.scope_items
      as scope_item

    join public.locations
      as scope_location

      on scope_location.id =
         scope_item.location_id

    where scope_location.legacy_location_key
      like 'legacy-project:%|phase:%'
  ) then
    raise exception
      'Location correction stopped: a scope item remains connected to the old hierarchy.';
  end if;
end;
$$;


-- =========================================================
-- REMOVE OBSOLETE LEGACY PHASE ROOTS
-- Their obsolete floor children are removed by cascade.
-- Areas are already attached to the new zone hierarchy.
-- =========================================================

delete from public.locations
where parent_id is null
  and location_type = 'phase'
  and legacy_location_key
    like 'legacy-project:%|phase:%';


-- =========================================================
-- FINAL INTEGRITY CHECKS
-- =========================================================

do $$
begin
  if exists (
    select 1

    from public.scope_items
      as scope_item

    left join public.locations
      as location

      on location.id =
         scope_item.location_id

    where location.id is null
  ) then
    raise exception
      'Location correction failed: orphan scope items were detected.';
  end if;


  if exists (
    select 1

    from public.locations
      as location

    left join public.projects
      as project

      on project.id =
         location.project_id

    where project.id is null
  ) then
    raise exception
      'Location correction failed: orphan locations were detected.';
  end if;
end;
$$;


analyze public.locations;
analyze public.scope_items;

commit;
