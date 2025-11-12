-- Phase 0 follow-up: baseline Mira conversations table
create table if not exists public.mira_conversations (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid,
  advisor_email text,
  tenant_id text,
  channel text,
  status text default 'active',
  mode text default 'command',
  context_module text,
  context_page text,
  context_data jsonb,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz,
  archived_at timestamptz
);

create index if not exists mira_conversations_advisor_id_idx on public.mira_conversations (advisor_id);
create index if not exists mira_conversations_status_idx on public.mira_conversations (status);
create index if not exists mira_conversations_last_message_idx on public.mira_conversations (last_message_at desc);
create index if not exists mira_conversations_tenant_idx on public.mira_conversations (tenant_id);

comment on table public.mira_conversations is 'Conversation sessions for Mira Co-Pilot.';
comment on column public.mira_conversations.context_data is 'Serialized AdvisorHub context payload (IDs, filters, etc).';
comment on column public.mira_conversations.metadata is 'Additional metadata (advisor persona, feature flags, etc).';
