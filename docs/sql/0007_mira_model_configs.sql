-- Per-tenant model/provider configuration table for Mira adapters

create extension if not exists moddatetime schema extensions;

create table if not exists public.mira_model_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  provider text not null check (provider in ('openai', 'anthropic', 'rest', 'mock')),
  model text not null,
  priority integer not null default 0,
  temperature numeric,
  max_tokens integer,
  max_retries integer,
  timeout_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mira_model_configs is
  'Per-tenant model selection for Mira agent adapters (provider/model/order/limits).';
comment on column public.mira_model_configs.tenant_id is 'Stable tenant identifier (org, agency, etc).';
comment on column public.mira_model_configs.provider is 'Adapter provider key (openai, anthropic, rest, mock).';

create unique index if not exists mira_model_configs_tenant_priority_idx
  on public.mira_model_configs (tenant_id, priority, provider);

create index if not exists mira_model_configs_tenant_idx
  on public.mira_model_configs (tenant_id);

create trigger mira_model_configs_touch_updated_at
  before update on public.mira_model_configs
  for each row execute procedure extensions.moddatetime ('updated_at');

alter table public.mira_model_configs enable row level security;
-- Service role bypasses RLS; no additional policies are required right now.
