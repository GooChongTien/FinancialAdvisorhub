-- Phase 0: Mira topic taxonomy storage
create extension if not exists pg_trgm;

create table if not exists public.mira_topics (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  subtopic text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint mira_topics_topic_subtopic_key unique (topic, subtopic)
);

comment on table public.mira_topics is 'Top-level module (topic) and subtopic taxonomy for Mira intent routing.';
comment on column public.mira_topics.topic is 'High-level module identifier (customer, analytics, etc).';
comment on column public.mira_topics.subtopic is 'Second-level grouping underneath topic.';
comment on column public.mira_topics.description is 'Optional human-readable explanation of the topic/subtopic.';
