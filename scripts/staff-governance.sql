-- Run this complete file in the Supabase SQL Editor after supabase-security.sql.
-- It creates owner and manager-controlled operational staff roles.

create table if not exists public.staff_permissions (
  user_id bigint not null references public.users(id) on delete cascade,
  permission text not null check (permission in ('manage_roles')),
  is_granted boolean not null,
  updated_by bigint references public.users(id),
  updated_at timestamptz not null default now(),
  primary key (user_id, permission)
);

insert into public.staff_profiles (user_id, operational_role)
select id, 'manager'
from public.users
where role = 'admin'
on conflict (user_id) do nothing;

update public.staff_profiles
set operational_role = 'owner', updated_at = now()
where user_id = (
  select id from public.users where role = 'admin' order by created_at asc, id asc limit 1
)
and not exists (
  select 1 from public.staff_profiles where operational_role = 'owner'
);

create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sp.operational_role, 'manager')
  from public.users u
  left join public.staff_profiles sp on sp.user_id = u.id
  where lower(u.email) = lower(auth.email())
    and u.role = 'admin'
  limit 1;
$$;

create or replace function public.can_manage_staff_roles()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.current_staff_role() = 'owner' then true
    when public.current_staff_role() <> 'manager' then false
    else coalesce((
      select is_granted
      from public.staff_permissions p
      join public.users u on u.id = p.user_id
      where lower(u.email) = lower(auth.email())
        and p.permission = 'manage_roles'
    ), true)
  end;
$$;

alter table public.staff_permissions enable row level security;

drop policy if exists "staff profiles admin all" on public.staff_profiles;
drop policy if exists "staff profiles admin read" on public.staff_profiles;
create policy "staff profiles admin read"
on public.staff_profiles for select to authenticated
using (public.is_admin());

drop policy if exists "staff permissions admin read" on public.staff_permissions;
create policy "staff permissions admin read"
on public.staff_permissions for select to authenticated
using (public.is_admin());

create or replace function public.set_staff_role(p_user_id bigint, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_target_role text;
  v_caller_id bigint;
begin
  if not public.can_manage_staff_roles() then
    raise exception 'You are not allowed to change staff roles';
  end if;
  if p_role not in ('owner', 'manager', 'secretary', 'laundry_staff') then
    raise exception 'Invalid staff role';
  end if;
  select id, public.current_staff_role() into v_caller_id, v_caller_role
  from public.users where lower(email) = lower(auth.email()) and role = 'admin' limit 1;
  if not exists (select 1 from public.users where id = p_user_id and role = 'admin') then
    raise exception 'The selected user is not an approved admin';
  end if;
  select operational_role into v_target_role from public.staff_profiles where user_id = p_user_id;
  if v_caller_role <> 'owner' and (p_role = 'owner' or coalesce(v_target_role, 'manager') = 'owner') then
    raise exception 'Only the owner can assign or change an owner role';
  end if;
  insert into public.staff_profiles (user_id, operational_role, updated_at)
  values (p_user_id, p_role, now())
  on conflict (user_id) do update set operational_role = excluded.operational_role, updated_at = now();
  insert into public.audit_logs (admin_id, admin_email, action, entity_type, entity_id, new_value)
  values (v_caller_id, auth.email(), 'Updated staff role', 'staff_profile', p_user_id::text, jsonb_build_object('role', p_role));
end;
$$;

create or replace function public.set_staff_permission(p_user_id bigint, p_permission text, p_granted boolean default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id bigint;
begin
  if public.current_staff_role() <> 'owner' then
    raise exception 'Only the owner can grant or revoke staff authorities';
  end if;
  if p_permission <> 'manage_roles' then
    raise exception 'Invalid staff authority';
  end if;
  if not exists (select 1 from public.users where id = p_user_id and role = 'admin') then
    raise exception 'The selected user is not an approved admin';
  end if;
  select id into v_caller_id from public.users where lower(email) = lower(auth.email()) and role = 'admin' limit 1;
  if p_granted is null then
    delete from public.staff_permissions where user_id = p_user_id and permission = p_permission;
  else
    insert into public.staff_permissions (user_id, permission, is_granted, updated_by, updated_at)
    values (p_user_id, p_permission, p_granted, v_caller_id, now())
    on conflict (user_id, permission) do update set is_granted = excluded.is_granted, updated_by = excluded.updated_by, updated_at = now();
  end if;
  insert into public.audit_logs (admin_id, admin_email, action, entity_type, entity_id, new_value)
  values (v_caller_id, auth.email(), 'Updated staff authority', 'staff_permission', p_user_id::text, jsonb_build_object('permission', p_permission, 'granted', p_granted));
end;
$$;

revoke all on function public.set_staff_role(bigint, text) from public;
grant execute on function public.set_staff_role(bigint, text) to authenticated;
revoke all on function public.set_staff_permission(bigint, text, boolean) from public;
grant execute on function public.set_staff_permission(bigint, text, boolean) to authenticated;
