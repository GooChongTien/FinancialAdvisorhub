-- Agent Engine Schema (Phase 1)
-- Enables dynamic, user-configurable agent workflows (LangGraph compatible)

-- 1. Workflows Table
-- Defines a callable process (e.g., "Lead Qualification Flow")
create table if not exists public.mira_workflows (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null references public.mira_agent_configs(agent_id) on delete cascade,
  name text not null,
  trigger_intent text, -- Maps to mira_intents.intent_name
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists mira_workflows_agent_idx on public.mira_workflows(agent_id);
create index if not exists mira_workflows_intent_idx on public.mira_workflows(trigger_intent);

comment on table public.mira_workflows is 'Defines executable workflows for agents.';

-- 2. Workflow Nodes Table
-- The individual steps in a workflow (LLM, Tool, Router, etc.)
create table if not exists public.mira_workflow_nodes (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.mira_workflows(id) on delete cascade,
  type text not null check (type in ('llm', 'tool', 'router', 'retrieval', 'human', 'start', 'end')),
  name text not null,
  config jsonb not null default '{}'::jsonb,
  position_x float,
  position_y float,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists mira_workflow_nodes_workflow_idx on public.mira_workflow_nodes(workflow_id);

comment on table public.mira_workflow_nodes is 'Steps within a workflow. Config stores node-specific settings (prompts, tool names).';

-- 3. Workflow Edges Table
-- Connects the nodes to define flow
create table if not exists public.mira_workflow_edges (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.mira_workflows(id) on delete cascade,
  source_node_id uuid not null references public.mira_workflow_nodes(id) on delete cascade,
  target_node_id uuid not null references public.mira_workflow_nodes(id) on delete cascade,
  condition_label text, -- Optional, for router outputs (e.g., "high_confidence")
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists mira_workflow_edges_workflow_idx on public.mira_workflow_edges(workflow_id);

comment on table public.mira_workflow_edges is 'Directed edges between nodes. Supports conditional routing.';

-- 4. Workflow State Table
-- Stores LangGraph checkpoints for resumability
create table if not exists public.mira_workflow_state (
  thread_id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.mira_workflows(id) on delete cascade,
  checkpoint jsonb not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists mira_workflow_state_workflow_idx on public.mira_workflow_state(workflow_id);

comment on table public.mira_workflow_state is 'Runtime state persistence for long-running or human-in-the-loop workflows.';

-- 5. Enable RLS (Row Level Security)
alter table public.mira_workflows enable row level security;
alter table public.mira_workflow_nodes enable row level security;
alter table public.mira_workflow_edges enable row level security;
alter table public.mira_workflow_state enable row level security;

-- Policy: Allow service role (Edge Functions) full access
create policy "Service role full access workflows" on public.mira_workflows
  for all using ( auth.role() = 'service_role' );

create policy "Service role full access nodes" on public.mira_workflow_nodes
  for all using ( auth.role() = 'service_role' );

create policy "Service role full access edges" on public.mira_workflow_edges
  for all using ( auth.role() = 'service_role' );

create policy "Service role full access state" on public.mira_workflow_state
  for all using ( auth.role() = 'service_role' );

-- Policy: Allow authenticated users read-only access to definitions (for UI)
create policy "Auth users view workflows" on public.mira_workflows
  for select using ( auth.role() = 'authenticated' );

create policy "Auth users view nodes" on public.mira_workflow_nodes
  for select using ( auth.role() = 'authenticated' );

create policy "Auth users view edges" on public.mira_workflow_edges
  for select using ( auth.role() = 'authenticated' );
