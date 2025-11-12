-- Create audit table for lead edits/notes used by agent-tools
create table if not exists public.lead_edit_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now(),
  changed_by text
);

create index if not exists lead_edit_history_lead_idx on public.lead_edit_history (lead_id);
create index if not exists lead_edit_history_changed_idx on public.lead_edit_history (changed_at desc);

