-- Phase 0: Enrich Mira conversations with UI context
alter table if exists public.mira_conversations
  add column if not exists context_module text,
  add column if not exists context_page text,
  add column if not exists context_data jsonb;

comment on column public.mira_conversations.context_module is 'Current AdvisorHub module when the message was sent.';
comment on column public.mira_conversations.context_page is 'Route or page identifier for better playback.';
comment on column public.mira_conversations.context_data is 'Serialized page-specific data (IDs, filters, etc).';
