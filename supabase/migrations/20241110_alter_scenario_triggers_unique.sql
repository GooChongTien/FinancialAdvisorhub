-- Ensure unique trigger per atom/phrase
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'scenario_triggers_atom_phrase_key'
  ) then
    alter table public.scenario_triggers
      add constraint scenario_triggers_atom_phrase_key unique (atom_id, trigger_phrase);
  end if;
end $$;

