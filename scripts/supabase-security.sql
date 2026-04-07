-- Run this in the Supabase SQL editor.
-- This hardens the public tables so anon users can only read prices and insert messages,
-- while authenticated admins control price and message administration.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where lower(email) = lower(auth.email())
      and role = 'admin'
  );
$$;

alter table public.prices enable row level security;
alter table public.messages enable row level security;
alter table public.users enable row level security;

drop policy if exists "prices public read" on public.prices;
create policy "prices public read"
on public.prices
for select
to anon, authenticated
using (true);

drop policy if exists "prices admin insert" on public.prices;
create policy "prices admin insert"
on public.prices
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "prices admin update" on public.prices;
create policy "prices admin update"
on public.prices
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "prices admin delete" on public.prices;
create policy "prices admin delete"
on public.prices
for delete
to authenticated
using (public.is_admin());

drop policy if exists "messages anon insert" on public.messages;
create policy "messages anon insert"
on public.messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "messages admin read" on public.messages;
create policy "messages admin read"
on public.messages
for select
to authenticated
using (public.is_admin());

drop policy if exists "messages admin delete" on public.messages;
create policy "messages admin delete"
on public.messages
for delete
to authenticated
using (public.is_admin());

drop policy if exists "users own profile read" on public.users;
create policy "users own profile read"
on public.users
for select
to authenticated
using (lower(email) = lower(auth.email()) or public.is_admin());

-- Admin creation is no longer public.
-- Create admin users directly in the Supabase dashboard, then add or update the matching
-- row in public.users with role = 'admin' using the same email address.
