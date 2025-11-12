-- Ensure upsert on knowledge_sources(path) works
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'knowledge_sources_path_key'
  ) then
    alter table public.knowledge_sources
      add constraint knowledge_sources_path_key unique (path);
  end if;
end $$;

