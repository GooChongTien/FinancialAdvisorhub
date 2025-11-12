-- Knowledge ingestion core tables
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null, -- e.g., 'docx', 'txt', 'pdf'
  path text,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_sources_name_idx on public.knowledge_sources using gin (name gin_trgm_ops);
create index if not exists knowledge_sources_path_idx on public.knowledge_sources using gin (coalesce(path, '') gin_trgm_ops);

create table if not exists public.knowledge_atoms (
  id text primary key, -- e.g., 'KA-ETH-04'
  source_id uuid references public.knowledge_sources(id) on delete cascade,
  title text,
  content text not null,
  content_hash text,
  topic text,
  compliance_note text,
  outputs jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_atoms_source_idx on public.knowledge_atoms (source_id);
create index if not exists knowledge_atoms_title_trgm_idx on public.knowledge_atoms using gin (coalesce(title, '') gin_trgm_ops);
create index if not exists knowledge_atoms_content_trgm_idx on public.knowledge_atoms using gin (coalesce(content, '') gin_trgm_ops);

create table if not exists public.scenario_triggers (
  id uuid primary key default gen_random_uuid(),
  atom_id text references public.knowledge_atoms(id) on delete cascade,
  trigger_phrase text,
  trigger_regex text,
  weight numeric not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists scenario_triggers_atom_idx on public.scenario_triggers (atom_id);
create index if not exists scenario_triggers_phrase_trgm_idx on public.scenario_triggers using gin (coalesce(trigger_phrase, '') gin_trgm_ops);

comment on table public.knowledge_sources is 'Knowledge source documents for Mira (training, compliance, scenarios).';
comment on table public.knowledge_atoms is 'Atomic knowledge items chunked from sources; addressable via ATOM_ID.';
comment on table public.scenario_triggers is 'Phrases/regex that map advisor prompts to relevant knowledge atoms';

