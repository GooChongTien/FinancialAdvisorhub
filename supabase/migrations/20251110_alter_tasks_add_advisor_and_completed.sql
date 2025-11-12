-- Ensure tasks table has advisor_id and completed to support RLS and UI features
alter table if exists public.tasks
  add column if not exists advisor_id uuid;

alter table if exists public.tasks
  add column if not exists completed boolean default false;

create index if not exists tasks_advisor_idx on public.tasks (advisor_id);

