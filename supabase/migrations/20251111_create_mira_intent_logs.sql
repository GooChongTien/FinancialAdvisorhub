-- Phase 0: Intent classification + routing telemetry
create table if not exists public.mira_intent_logs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid,
  intent_id uuid references public.mira_intents(id) on delete set null,
  topic text not null,
  subtopic text not null,
  intent_name text not null,
  user_message text not null,
  confidence numeric(3,2) not null,
  selected_agent text not null,
  selected_skill text,
  success boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists mira_intent_logs_conversation_idx on public.mira_intent_logs (conversation_id);
create index if not exists mira_intent_logs_intent_idx on public.mira_intent_logs (intent_id);
create index if not exists mira_intent_logs_topic_idx on public.mira_intent_logs (topic, subtopic);

comment on table public.mira_intent_logs is 'Per-interaction record of classified intent, routing decision, and outcome.';
comment on column public.mira_intent_logs.metadata is 'Arbitrary JSON payload (confidence breakdown, clarifying questions, etc).';

do $$
begin
  if to_regclass('public.mira_conversations') is not null then
    if not exists (
      select 1
      from information_schema.table_constraints
      where constraint_name = 'mira_intent_logs_conversation_id_fkey'
        and table_schema = 'public'
        and table_name = 'mira_intent_logs'
    ) then
      alter table public.mira_intent_logs
        add constraint mira_intent_logs_conversation_id_fkey
        foreign key (conversation_id)
        references public.mira_conversations(id)
        on delete cascade;
    end if;
  end if;
end
$$;
