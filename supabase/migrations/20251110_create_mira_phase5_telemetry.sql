-- Phase 5: Balanced Scorecard Telemetry & Feedback schema
create table if not exists public.mira_events (
  id uuid primary key default gen_random_uuid(),
  advisor_id text references public.profiles(id) on delete set null,
  tenant_id text,
  journey_type text,
  channel text,
  intent text,
  agent_name text not null,
  skill_name text not null,
  actions jsonb,
  knowledge_atoms jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mira_events_created_idx on public.mira_events (created_at desc);
create index if not exists mira_events_advisor_idx on public.mira_events (advisor_id);
create index if not exists mira_events_skill_idx on public.mira_events (skill_name);

create table if not exists public.mira_kpi_flags (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.mira_events(id) on delete cascade,
  kpi text not null,
  flag boolean not null default false,
  score numeric,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mira_kpi_flags_event_idx on public.mira_kpi_flags (event_id);
create index if not exists mira_kpi_flags_kpi_idx on public.mira_kpi_flags (kpi);

create table if not exists public.mira_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.mira_events(id) on delete set null,
  advisor_id text references public.profiles(id) on delete set null,
  rating int check (rating between -1 and 1),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists mira_feedback_event_idx on public.mira_feedback (event_id);
create index if not exists mira_feedback_advisor_idx on public.mira_feedback (advisor_id);
