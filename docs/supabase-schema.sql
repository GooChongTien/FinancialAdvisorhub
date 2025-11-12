-- AdvisorHub Supabase schema
-- Run this script in the Supabase SQL editor or via psql.

create extension if not exists "pgcrypto";

-- Generic trigger helper to refresh updated_at columns.
create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id text primary key,
  full_name text not null,
  email text not null,
  role text,
  mobile_number text,
  advisor_id text,
  advisor_id_expiry date,
  account_status text,
  team_name text,
  joined_on date,
  professional_title text,
  language text,
  currency text,
  two_fa_enabled boolean not null default false,
  avatar_initials text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_number text not null,
  email text,
  national_id text,
  date_of_birth date,
  gender text check (gender in ('Male', 'Female', 'Other')),
  lead_source text check (lead_source in ('Referral', 'Social Media', 'Walk-in', 'Cold Call', 'Website', 'Event', 'Other')),
  status text not null default 'Not Initiated' check (status in ('Not Initiated', 'Contacted', 'Proposal')),
  last_contacted timestamptz,
  is_client boolean not null default false,
  marital_status text check (marital_status in ('Single', 'Married', 'Divorced', 'Widowed')),
  occupation text,
  address text,
  nationality text,
  smoker_status boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger leads_set_updated_at
before update on public.leads
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_last_contacted_idx on public.leads (last_contacted);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  product_code text unique,
  need_type text check (need_type in ('Protection', 'Savings', 'Investment', 'Health', 'Retirement')),
  description text,
  premium_range text,
  min_age int,
  max_age int,
  premium_modes text[] not null default array[]::text[],
  recommended_sum_assured numeric,
  features text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  product_id uuid references public.products(id),
  policy_number text not null unique,
  product_name text,
  coverage_type text check (
    coverage_type in (
      'Hospitalisation',
      'Death',
      'Critical Illness',
      'TPD',
      'Disability Income',
      'Accidental',
      'Savings',
      'Lifestyle',
      'Travel',
      'Protection',
      'Retirement',
      'Health'
    )
  ),
  coverage_amount numeric,
  sum_assured numeric,
  premium_amount numeric,
  premium_frequency text check (premium_frequency in ('Monthly', 'Quarterly', 'Semi-Annual', 'Annual')),
  policy_start_date date,
  policy_end_date date,
  status text not null default 'Active' check (status in ('Active', 'Lapsed', 'Surrendered', 'Matured')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger policies_set_updated_at
before update on public.policies
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists policies_lead_idx on public.policies (lead_id);
create index if not exists policies_status_idx on public.policies (status);

-- Optional enrichment fields for policy detail page
alter table if exists public.policies
  add column if not exists beneficiaries jsonb not null default '[]'::jsonb;

alter table if exists public.policies
  add column if not exists payment_status text check (payment_status in ('Current','Overdue','Grace','Paid Up'));

alter table if exists public.policies
  add column if not exists documents jsonb not null default '[]'::jsonb;

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_number text not null unique,
  lead_id uuid not null references public.leads(id) on delete cascade,
  proposer_name text not null,
  stage text not null default 'Fact Finding' check (stage in ('Fact Finding', 'FNA', 'Recommendation', 'Quotation', 'Application')),
  status text not null default 'In Progress' check (status in ('In Progress', 'Pending for UW', 'Pending for Payment', 'Pending for Approval', 'Completed', 'Cancelled')),
  completion_percentage numeric not null default 0 check (completion_percentage between 0 and 100),
  fact_finding_data jsonb not null default '{}'::jsonb,
  fna_data jsonb not null default '{}'::jsonb,
  recommendation_data jsonb not null default '{}'::jsonb,
  quotation_data jsonb not null default '{}'::jsonb,
  application_data jsonb not null default '{}'::jsonb,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger proposals_set_updated_at
before update on public.proposals
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists proposals_lead_idx on public.proposals (lead_id);
create index if not exists proposals_status_idx on public.proposals (status);

-- Lead status history for audit trail of pipeline movements
create table if not exists public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_at timestamptz not null default now(),
  changed_by text
);

create index if not exists lead_status_history_lead_idx on public.lead_status_history (lead_id);
create index if not exists lead_status_history_changed_idx on public.lead_status_history (changed_at desc);

-- Lead edit history for auditing profile edits
create table if not exists public.lead_edit_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now(),
  changed_by text
);

create index if not exists lead_edit_history_lead_idx on public.lead_edit_history (lead_id);
create index if not exists lead_edit_history_changed_idx on public.lead_edit_history (changed_at desc);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'Task' check (type in ('Task', 'Appointment')),
  date date not null,
  time text,
  duration text,
  linked_lead_id uuid references public.leads(id) on delete set null,
  linked_lead_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists tasks_date_idx on public.tasks (date);
create index if not exists tasks_lead_idx on public.tasks (linked_lead_id);

create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null check (category in ('Announcement', 'Training', 'Campaign')),
  is_pinned boolean not null default false,
  published_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger broadcasts_set_updated_at
before update on public.broadcasts
for each row
execute function public.set_current_timestamp_updated_at();

-- Aggregated metrics view mirroring the prototype counters.
create or replace view public.lead_metrics as
select
  l.id as lead_id,
  count(p.*) filter (where p.status = 'Active')::int as active_policies_count,
  coalesce(sum(p.premium_amount), 0)::numeric as total_premium
from public.leads l
left join public.policies p on p.lead_id = l.id
group by l.id;

comment on view public.lead_metrics is 'Provides derived metrics for each lead (active policy count, total premium).';
