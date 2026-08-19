begin;

-- =========================================================
-- RITSUFLOW PROJECT CURRENCY
-- Adds explicit currency information to contract values.
-- =========================================================

alter table public.projects
  add column if not exists currency_code text;


alter table public.projects
  drop constraint if exists
    projects_currency_code_format_check;


alter table public.projects
  add constraint
    projects_currency_code_format_check
  check (
    currency_code is null
    or currency_code ~ '^[A-Z]{3}$'
  );


-- Existing Brazilian legacy projects are assigned BRL.
update public.projects
set
  currency_code = 'BRL',
  updated_at = now()
where currency_code is null
  and legacy_project_id is not null
  and country_code = 'BR';


-- Existing United States projects are assigned USD.
update public.projects
set
  currency_code = 'USD',
  updated_at = now()
where currency_code is null
  and country_code = 'US';


-- New projects use USD unless another currency is selected.
alter table public.projects
  alter column currency_code
  set default 'USD';


comment on column public.projects.currency_code is
  'ISO 4217 currency code associated with the project contract value.';


commit;
