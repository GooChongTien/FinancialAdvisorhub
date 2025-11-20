create extension if not exists vector;

create table if not exists kb_documents (
  id uuid primary key default gen_random_uuid(),
  collection text not null,
  title text not null,
  meta jsonb not null,
  raw text not null,
  tenant_id uuid not null,
  version text,
  created_at timestamptz default now()
);

create table if not exists kb_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references kb_documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  meta jsonb not null,
  embedding vector(3072),
  tenant_id uuid not null,
  created_at timestamptz default now()
);

create index if not exists kb_chunks_vec on kb_chunks using ivfflat (embedding vector_cosine_ops);
create index if not exists kb_chunks_tsv on kb_chunks using gin ((to_tsvector('english', content)));

create table if not exists nav_map (
  route text primary key,
  section text,
  anchor text,
  aliases text[],
  tenant_id uuid not null
);

create table if not exists guardrail_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  kind text,
  name text,
  content jsonb,
  version text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists guardrail_audit (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz default now(),
  tenant_id uuid,
  advisor_id text,
  stage text,
  checks jsonb,
  decision text,
  conversation_id text
);

create table if not exists feature_flags (
  key text,
  tenant_id uuid,
  advisor_id text,
  value jsonb,
  primary key (key, tenant_id, advisor_id)
);

alter table kb_documents enable row level security;
alter table kb_chunks enable row level security;
alter table nav_map enable row level security;
alter table guardrail_configs enable row level security;
alter table guardrail_audit enable row level security;
alter table feature_flags enable row level security;

