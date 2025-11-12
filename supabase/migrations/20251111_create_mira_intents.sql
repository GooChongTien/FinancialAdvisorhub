-- Phase 0: Mira intents catalog storage
create extension if not exists pg_trgm;

create table if not exists public.mira_intents (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  subtopic text not null,
  intent_name text not null,
  display_name text,
  description text,
  required_fields jsonb not null default '[]'::jsonb,
  optional_fields jsonb not null default '[]'::jsonb,
  ui_actions jsonb not null default '[]'::jsonb,
  example_phrases text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint mira_intents_topic_subtopic_intent_key unique (topic, subtopic, intent_name),
  constraint mira_intents_topic_subtopic_fkey
    foreign key (topic, subtopic)
    references public.mira_topics (topic, subtopic)
    on delete cascade
);

create index if not exists mira_intents_topic_idx on public.mira_intents (topic, subtopic);
create index if not exists mira_intents_name_trgm_idx on public.mira_intents
  using gin (intent_name gin_trgm_ops);

comment on table public.mira_intents is 'Concrete intents Mira can classify, tied to topic/subtopic entries.';
comment on column public.mira_intents.required_fields is 'JSON array describing required slot names for execution.';
comment on column public.mira_intents.optional_fields is 'JSON array describing optional slot names.';
comment on column public.mira_intents.ui_actions is 'JSON array describing default UI actions for the intent.';
comment on column public.mira_intents.example_phrases is 'Sample phrases used for intent training and testing.';
