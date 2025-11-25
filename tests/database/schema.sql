-- Minimal schema for local test database runs.
create extension if not exists "pgcrypto";

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  customer_type text default 'Individual',
  last_contacted timestamptz,
  temperature text,
  temperature_bucket text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  subject text,
  status text default 'pending',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  linked_lead_id uuid references leads(id) on delete cascade,
  type text,
  title text,
  date date,
  time time,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
