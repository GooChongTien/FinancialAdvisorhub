-- Phase 0: Skill agent configuration store
create table if not exists public.mira_agent_configs (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  module text not null,
  display_name text,
  system_prompt text not null,
  tools jsonb not null default '[]'::jsonb,
  parameters jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint mira_agent_configs_agent_id_key unique (agent_id)
);

create index if not exists mira_agent_configs_module_idx on public.mira_agent_configs (module);

comment on table public.mira_agent_configs is 'Registry of Mira skill agents, their prompts, and available tools.';
comment on column public.mira_agent_configs.tools is 'JSON array of tool descriptors (name, description, schema).';
comment on column public.mira_agent_configs.parameters is 'Free-form configuration for runtime (e.g., temperature caps).';
