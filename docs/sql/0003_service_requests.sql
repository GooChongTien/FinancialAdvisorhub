-- Service Requests table for client servicing flows
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid references public.profiles(id) on delete set null,
  lead_id uuid,
  policy_number text,
  type text not null, -- claim | renewal | reinstate | fund_switch | premium_payment | address_change | beneficiary_change | other
  status text not null default 'pending', -- pending | in_progress | completed | rejected
  subject text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.service_requests enable row level security;

-- Owner-only policies (advisor scope)
drop policy if exists sr_select_owner on public.service_requests;
create policy sr_select_owner on public.service_requests
  for select to authenticated
  using ( advisor_id = auth.uid() );

drop policy if exists sr_insert_owner on public.service_requests;
create policy sr_insert_owner on public.service_requests
  for insert to authenticated
  with check ( advisor_id = auth.uid() );

drop policy if exists sr_update_owner on public.service_requests;
create policy sr_update_owner on public.service_requests
  for update to authenticated
  using ( advisor_id = auth.uid() )
  with check ( advisor_id = auth.uid() );

