-- Advisor scoping via RLS. Assumes tables have advisor_id uuid column.
-- If columns are missing, add them and backfill before enabling policy.

-- Leads
alter table if exists public.leads enable row level security;
drop policy if exists leads_owner_access on public.leads;
create policy leads_owner_access on public.leads
  for all to authenticated
  using (advisor_id = auth.uid())
  with check (advisor_id = auth.uid());

-- Tasks
alter table if exists public.tasks enable row level security;
drop policy if exists tasks_owner_access on public.tasks;
create policy tasks_owner_access on public.tasks
  for all to authenticated
  using (advisor_id = auth.uid())
  with check (advisor_id = auth.uid());

-- Proposals
alter table if exists public.proposals enable row level security;
drop policy if exists proposals_owner_access on public.proposals;
create policy proposals_owner_access on public.proposals
  for all to authenticated
  using (advisor_id = auth.uid())
  with check (advisor_id = auth.uid());

-- Policies
alter table if exists public.policies enable row level security;
drop policy if exists policies_owner_access on public.policies;
create policy policies_owner_access on public.policies
  for all to authenticated
  using (advisor_id = auth.uid())
  with check (advisor_id = auth.uid());

-- Broadcasts (read for all authenticated; write scoped)
alter table if exists public.broadcasts enable row level security;
drop policy if exists broadcasts_read_all on public.broadcasts;
create policy broadcasts_read_all on public.broadcasts
  for select to authenticated
  using (true);

drop policy if exists broadcasts_owner_write on public.broadcasts;
create policy broadcasts_owner_write on public.broadcasts
  for all to authenticated
  using (coalesce(advisor_id, auth.uid()) = auth.uid())
  with check (coalesce(advisor_id, auth.uid()) = auth.uid());

-- Profiles (self access)
alter table if exists public.profiles enable row level security;
drop policy if exists profiles_self_access on public.profiles;
create policy profiles_self_access on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Helper: add advisor_id to tables if missing (run manually if needed)
-- alter table public.leads add column advisor_id uuid default auth.uid();
-- alter table public.tasks add column advisor_id uuid default auth.uid();
-- alter table public.proposals add column advisor_id uuid default auth.uid();
-- alter table public.policies add column advisor_id uuid default auth.uid();
-- alter table public.broadcasts add column advisor_id uuid;

