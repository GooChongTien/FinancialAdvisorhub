-- Create table for per-tenant model settings used by Mira adapter registry
create table if not exists public.mira_model_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  provider text not null,
  model text not null,
  priority int not null default 0,
  temperature numeric,
  max_tokens int,
  max_retries int,
  timeout_ms int,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists mira_model_configs_tenant_priority_idx
  on public.mira_model_configs (tenant_id, priority);

alter table public.mira_model_configs enable row level security;

