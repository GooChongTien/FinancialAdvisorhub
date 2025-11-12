-- Backfill advisor_id on core tables for existing rows
-- Picks the first auth user id as the owner for all null advisor_id rows.
-- Adjust the chosen uid if you want a specific advisor to own historical data.

with chosen as (
  select id::uuid as uid from auth.users order by created_at asc limit 1
)
update public.leads set advisor_id = (select uid from chosen) where advisor_id is null;

with chosen as (
  select id::uuid as uid from auth.users order by created_at asc limit 1
)
update public.tasks set advisor_id = (select uid from chosen) where advisor_id is null;

with chosen as (
  select id::uuid as uid from auth.users order by created_at asc limit 1
)
update public.proposals set advisor_id = (select uid from chosen) where advisor_id is null;

with chosen as (
  select id::uuid as uid from auth.users order by created_at asc limit 1
)
update public.policies set advisor_id = (select uid from chosen) where advisor_id is null;

with chosen as (
  select id::uuid as uid from auth.users order by created_at asc limit 1
)
update public.broadcasts set advisor_id = (select uid from chosen) where advisor_id is null;

-- Service Requests uses text advisor_id to match profiles.id text schema
with chosen as (
  select id as uid from auth.users order by created_at asc limit 1
)
update public.service_requests set advisor_id = (select uid from chosen) where advisor_id is null;

