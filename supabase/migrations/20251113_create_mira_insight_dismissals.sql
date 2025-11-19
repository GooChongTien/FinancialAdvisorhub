-- Persist advisor insight dismissals so they sync across devices
create table if not exists public.mira_insight_dismissals (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null,
  insight_id text not null,
  dismissed_at timestamptz not null default now()
);

alter table if exists public.mira_insight_dismissals
  add constraint mira_insight_dismissals_advisor_fk
  foreign key (advisor_id) references auth.users (id) on delete cascade;

create unique index if not exists mira_insight_dismissals_advisor_insight_idx
  on public.mira_insight_dismissals (advisor_id, insight_id);

alter table public.mira_insight_dismissals enable row level security;

create policy advisor_manage_own_insight_dismissals
  on public.mira_insight_dismissals
  for all
  using (auth.uid() = advisor_id)
  with check (auth.uid() = advisor_id);
