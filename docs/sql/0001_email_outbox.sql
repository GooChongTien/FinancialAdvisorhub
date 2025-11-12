-- Email outbox table for queued notifications
create table if not exists public.email_outbox (
  id bigserial primary key,
  to_email text not null,
  subject text not null,
  body text not null,
  template text,
  status text not null default 'queued', -- queued | sent | failed
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.email_outbox enable row level security;

-- Allow insert/select for authenticated users on their own rows only
drop policy if exists email_outbox_insert_self on public.email_outbox;
create policy email_outbox_insert_self on public.email_outbox
  for insert to authenticated
  with check ( to_email = (auth.jwt() ->> 'email') );

drop policy if exists email_outbox_select_self on public.email_outbox;
create policy email_outbox_select_self on public.email_outbox
  for select to authenticated
  using ( to_email = (auth.jwt() ->> 'email') );

