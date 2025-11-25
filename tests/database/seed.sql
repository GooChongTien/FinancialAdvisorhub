-- Sample seed data for local test runs.
insert into leads (id, name, customer_type, last_contacted, temperature, temperature_bucket)
values
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp', 'Entity', now() - interval '2 days', 'hot', 'hot')
on conflict (id) do nothing;

insert into service_requests (id, lead_id, subject, status)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Onboard staff benefits', 'pending')
on conflict (id) do nothing;

insert into tasks (id, linked_lead_id, type, title, date)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'Appointment', 'Kickoff call', now()::date)
on conflict (id) do nothing;
