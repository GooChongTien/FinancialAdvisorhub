create extension if not exists pg_trgm;

create table if not exists public.mira_chat_threads (
  id text primary key,
  advisor_id text not null,
  title text,
  last_message_preview text,
  last_message_role text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  last_activity_at timestamptz default timezone('utc', now())
);

create index if not exists mira_chat_threads_advisor_updated_idx
  on public.mira_chat_threads (advisor_id, updated_at desc);

create index if not exists mira_chat_threads_title_trgm_idx
  on public.mira_chat_threads
  using gin (coalesce(title, '') gin_trgm_ops);

create index if not exists mira_chat_threads_preview_trgm_idx
  on public.mira_chat_threads
  using gin (coalesce(last_message_preview, '') gin_trgm_ops);

comment on table public.mira_chat_threads is 'Stores recent Mira chat sessions for quick access in the AdvisorHub UI.';
comment on column public.mira_chat_threads.last_activity_at is 'Timestamp of the last message observed in the thread.';
