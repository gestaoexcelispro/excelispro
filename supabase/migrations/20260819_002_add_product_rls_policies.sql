begin;

-- =========================================================
-- RITSUFLOW PRODUCT SECURITY
-- Row Level Security helper functions and policies
-- =========================================================

create schema if not exists private;

-- =========================================================
-- SECURITY HELPER FUNCTIONS
-- =========================================================

create or replace function private.owns_organization(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organizations as organization
    where organization.id = target_organization_id
      and organization.owner_user_id = (select auth.uid())
  );
$$;


create or replace function private.is_organization_member(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
  );
$$;


create or replace function private.has_organization_role(
  target_organization_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.owns_organization(target_organization_id)
    or exists (
      select 1
      from public.organization_members as membership
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.role = any(allowed_roles)
    );
$$;


create or replace function private.can_access_project(
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects as project
    where project.id = target_project_id
      and (
        project.created_by = (select auth.uid())
        or exists (
          select 1
          from public.organizations as organization
          where organization.id = project.organization_id
            and organization.owner_user_id = (select auth.uid())
        )
        or exists (
          select 1
          from public.organization_members as organization_membership
          where organization_membership.organization_id = project.organization_id
            and organization_membership.user_id = (select auth.uid())
        )
        or exists (
          select 1
          from public.project_members as project_membership
          where project_membership.project_id = project.id
            and project_membership.user_id = (select auth.uid())
        )
      )
  );
$$;


create or replace function private.can_manage_project(
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects as project
    where project.id = target_project_id
      and (
        project.created_by = (select auth.uid())
        or exists (
          select 1
          from public.organizations as organization
          where organization.id = project.organization_id
            and organization.owner_user_id = (select auth.uid())
        )
        or exists (
          select 1
          from public.organization_members as organization_membership
          where organization_membership.organization_id = project.organization_id
            and organization_membership.user_id = (select auth.uid())
            and organization_membership.role = any (
              array['owner', 'admin', 'manager', 'planner']::text[]
            )
        )
        or exists (
          select 1
          from public.project_members as project_membership
          where project_membership.project_id = project.id
            and project_membership.user_id = (select auth.uid())
            and project_membership.role = any (
              array['owner', 'admin', 'manager', 'planner']::text[]
            )
        )
      )
  );
$$;


create or replace function private.can_admin_project(
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects as project
    where project.id = target_project_id
      and (
        project.created_by = (select auth.uid())
        or exists (
          select 1
          from public.organizations as organization
          where organization.id = project.organization_id
            and organization.owner_user_id = (select auth.uid())
        )
        or exists (
          select 1
          from public.organization_members as organization_membership
          where organization_membership.organization_id = project.organization_id
            and organization_membership.user_id = (select auth.uid())
            and organization_membership.role = any (
              array['owner', 'admin']::text[]
            )
        )
        or exists (
          select 1
          from public.project_members as project_membership
          where project_membership.project_id = project.id
            and project_membership.user_id = (select auth.uid())
            and project_membership.role = any (
              array['owner', 'admin']::text[]
            )
        )
      )
  );
$$;


-- =========================================================
-- FUNCTION PERMISSIONS
-- =========================================================

revoke all on schema private from public;
revoke all on schema private from anon;

grant usage on schema private to authenticated;

revoke all on function private.owns_organization(uuid) from public;
revoke all on function private.is_organization_member(uuid) from public;
revoke all on function private.has_organization_role(uuid, text[]) from public;
revoke all on function private.can_access_project(uuid) from public;
revoke all on function private.can_manage_project(uuid) from public;
revoke all on function private.can_admin_project(uuid) from public;

revoke all on function private.owns_organization(uuid) from anon;
revoke all on function private.is_organization_member(uuid) from anon;
revoke all on function private.has_organization_role(uuid, text[]) from anon;
revoke all on function private.can_access_project(uuid) from anon;
revoke all on function private.can_manage_project(uuid) from anon;
revoke all on function private.can_admin_project(uuid) from anon;

grant execute on function private.owns_organization(uuid) to authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.has_organization_role(uuid, text[]) to authenticated;
grant execute on function private.can_access_project(uuid) to authenticated;
grant execute on function private.can_manage_project(uuid) to authenticated;
grant execute on function private.can_admin_project(uuid) to authenticated;


-- =========================================================
-- PROFILES POLICIES
-- =========================================================

drop policy if exists "Users can view their own profile"
  on public.profiles;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
);


drop policy if exists "Users can create their own profile"
  on public.profiles;

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
);


drop policy if exists "Users can update their own profile"
  on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);


-- =========================================================
-- ORGANIZATIONS POLICIES
-- =========================================================

drop policy if exists "Organization members can view organizations"
  on public.organizations;

create policy "Organization members can view organizations"
on public.organizations
for select
to authenticated
using (
  private.owns_organization(id)
  or private.is_organization_member(id)
);


drop policy if exists "Users can create organizations"
  on public.organizations;

create policy "Users can create organizations"
on public.organizations
for insert
to authenticated
with check (
  owner_user_id = (select auth.uid())
);


drop policy if exists "Organization administrators can update organizations"
  on public.organizations;

create policy "Organization administrators can update organizations"
on public.organizations
for update
to authenticated
using (
  private.has_organization_role(
    id,
    array['owner', 'admin']::text[]
  )
)
with check (
  private.has_organization_role(
    id,
    array['owner', 'admin']::text[]
  )
);


drop policy if exists "Organization owners can delete organizations"
  on public.organizations;

create policy "Organization owners can delete organizations"
on public.organizations
for delete
to authenticated
using (
  private.owns_organization(id)
);


-- =========================================================
-- ORGANIZATION MEMBERS POLICIES
-- =========================================================

drop policy if exists "Organization members can view memberships"
  on public.organization_members;

create policy "Organization members can view memberships"
on public.organization_members
for select
to authenticated
using (
  private.owns_organization(organization_id)
  or private.is_organization_member(organization_id)
);


drop policy if exists "Organization administrators can add members"
  on public.organization_members;

create policy "Organization administrators can add members"
on public.organization_members
for insert
to authenticated
with check (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin']::text[]
  )
);


drop policy if exists "Organization administrators can update members"
  on public.organization_members;

create policy "Organization administrators can update members"
on public.organization_members
for update
to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin']::text[]
  )
)
with check (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin']::text[]
  )
);


drop policy if exists "Organization administrators can remove members"
  on public.organization_members;

create policy "Organization administrators can remove members"
on public.organization_members
for delete
to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin']::text[]
  )
);


-- =========================================================
-- PROJECTS POLICIES
-- =========================================================

drop policy if exists "Project members can view projects"
  on public.projects;

create policy "Project members can view projects"
on public.projects
for select
to authenticated
using (
  private.can_access_project(id)
);


drop policy if exists "Organization planners can create projects"
  on public.projects;

create policy "Organization planners can create projects"
on public.projects
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager', 'planner']::text[]
  )
);


drop policy if exists "Project managers can update projects"
  on public.projects;

create policy "Project managers can update projects"
on public.projects
for update
to authenticated
using (
  private.can_manage_project(id)
)
with check (
  private.can_manage_project(id)
);


drop policy if exists "Project administrators can delete projects"
  on public.projects;

create policy "Project administrators can delete projects"
on public.projects
for delete
to authenticated
using (
  private.can_admin_project(id)
);


-- =========================================================
-- PROJECT MEMBERS POLICIES
-- =========================================================

drop policy if exists "Project members can view project memberships"
  on public.project_members;

create policy "Project members can view project memberships"
on public.project_members
for select
to authenticated
using (
  private.can_access_project(project_id)
);


drop policy if exists "Project administrators can add members"
  on public.project_members;

create policy "Project administrators can add members"
on public.project_members
for insert
to authenticated
with check (
  private.can_admin_project(project_id)
);


drop policy if exists "Project administrators can update members"
  on public.project_members;

create policy "Project administrators can update members"
on public.project_members
for update
to authenticated
using (
  private.can_admin_project(project_id)
)
with check (
  private.can_admin_project(project_id)
);


drop policy if exists "Project administrators can remove members"
  on public.project_members;

create policy "Project administrators can remove members"
on public.project_members
for delete
to authenticated
using (
  private.can_admin_project(project_id)
);


-- =========================================================
-- LOCATIONS POLICIES
-- =========================================================

drop policy if exists "Project members can view locations"
  on public.locations;

create policy "Project members can view locations"
on public.locations
for select
to authenticated
using (
  private.can_access_project(project_id)
);


drop policy if exists "Project planners can create locations"
  on public.locations;

create policy "Project planners can create locations"
on public.locations
for insert
to authenticated
with check (
  private.can_manage_project(project_id)
);


drop policy if exists "Project planners can update locations"
  on public.locations;

create policy "Project planners can update locations"
on public.locations
for update
to authenticated
using (
  private.can_manage_project(project_id)
)
with check (
  private.can_manage_project(project_id)
);


drop policy if exists "Project planners can delete locations"
  on public.locations;

create policy "Project planners can delete locations"
on public.locations
for delete
to authenticated
using (
  private.can_manage_project(project_id)
);


-- =========================================================
-- SCOPE ITEMS POLICIES
-- =========================================================

drop policy if exists "Project members can view scope items"
  on public.scope_items;

create policy "Project members can view scope items"
on public.scope_items
for select
to authenticated
using (
  private.can_access_project(project_id)
);


drop policy if exists "Project planners can create scope items"
  on public.scope_items;

create policy "Project planners can create scope items"
on public.scope_items
for insert
to authenticated
with check (
  private.can_manage_project(project_id)
);


drop policy if exists "Project planners can update scope items"
  on public.scope_items;

create policy "Project planners can update scope items"
on public.scope_items
for update
to authenticated
using (
  private.can_manage_project(project_id)
)
with check (
  private.can_manage_project(project_id)
);


drop policy if exists "Project planners can delete scope items"
  on public.scope_items;

create policy "Project planners can delete scope items"
on public.scope_items
for delete
to authenticated
using (
  private.can_manage_project(project_id)
);


-- =========================================================
-- TABLE PERMISSIONS
-- =========================================================

revoke all on table public.profiles from anon;
revoke all on table public.organizations from anon;
revoke all on table public.organization_members from anon;
revoke all on table public.projects from anon;
revoke all on table public.project_members from anon;
revoke all on table public.locations from anon;
revoke all on table public.scope_items from anon;

grant select, insert, update
  on table public.profiles
  to authenticated;

grant select, insert, update, delete
  on table public.organizations
  to authenticated;

grant select, insert, update, delete
  on table public.organization_members
  to authenticated;

grant select, insert, update, delete
  on table public.projects
  to authenticated;

grant select, insert, update, delete
  on table public.project_members
  to authenticated;

grant select, insert, update, delete
  on table public.locations
  to authenticated;

grant select, insert, update, delete
  on table public.scope_items
  to authenticated;

commit;
