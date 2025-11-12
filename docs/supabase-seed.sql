-- Sample seed data for AdvisorHub Supabase schema.
-- Run after docs/supabase-schema.sql to populate prototype content.

begin;

with profile_rows as (
  insert into public.profiles (
    id,
    full_name,
    email,
    role,
    mobile_number,
    advisor_id,
    advisor_id_expiry,
    account_status,
    team_name,
    joined_on,
    professional_title,
    language,
    currency,
    two_fa_enabled,
    avatar_initials
  )
  values (
    'advisor-001',
    'Alexandra Lim',
    'alexandra.lim@advisorhub.io',
    'Senior Advisor',
    '+65 8123 4567',
    'ADV-2045123',
    '2026-12-31',
    'Active',
    'Momentum Champions',
    '2021-03-15',
    'Chartered Financial Consultant',
    'English',
    'SGD',
    true,
    'AL'
  )
  on conflict (id) do update
    set
      full_name = excluded.full_name,
      email = excluded.email,
      role = excluded.role,
      mobile_number = excluded.mobile_number,
      advisor_id = excluded.advisor_id,
      advisor_id_expiry = excluded.advisor_id_expiry,
      account_status = excluded.account_status,
      team_name = excluded.team_name,
      joined_on = excluded.joined_on,
      professional_title = excluded.professional_title,
      language = excluded.language,
      currency = excluded.currency,
      two_fa_enabled = excluded.two_fa_enabled,
      avatar_initials = excluded.avatar_initials
  returning id
)
select count(*) from profile_rows;

with lead_rows as (
  insert into public.leads (id, name, contact_number, email, national_id, date_of_birth, gender, lead_source, status, last_contacted, is_client, marital_status, occupation, address, nationality, smoker_status, notes)
  values
    ('7f2e9d33-5bda-4f61-9e62-6102efd1c627', 'Sarah Chen', '+65 9012 3456', 'sarah.chen@example.com', 'S8634210A', '1988-05-12', 'Female', 'Referral', 'Contacted', '2025-10-23T09:15:00+08:00', true, 'Married', 'Marketing Manager', '58 Orchard Towers, #15-02, Singapore', 'Singaporean', false, 'Interested in maternity coverage upgrade before second child.'),
    ('81c86103-4f52-4a6c-bd16-172edb0f6dfa', 'Jason Tan', '+65 9333 8899', 'jason.tan@example.com', 'S9033421B', '1990-11-03', 'Male', 'Website', 'Proposal', '2025-10-25T14:20:00+08:00', false, 'Single', 'Product Designer', '21A River Valley Road, Singapore', 'Singaporean', false, 'Comparing income protection plans, receptive to bundled offers.'),
    ('23afc5cd-2676-4d26-9b74-28f23995df83', 'Nur Aisyah Binte Rahman', '+65 8456 7788', 'aisyah.rahman@example.com', 'S7854321C', '1982-02-18', 'Female', 'Event', 'Proposal', '2025-10-21T17:10:00+08:00', true, 'Married', 'Finance Director', '9 Holland Hill, #07-02, Singapore', 'Singaporean', false, 'Considering upgrade for retirement income solution.'),
    ('02829a29-54b4-4f48-8e24-2ff6a5e67232', 'Rahul Mehta', '+65 9788 6611', 'rahul.mehta@example.com', 'F2145987N', '1993-07-30', 'Male', 'Social Media', 'Not Initiated', null, false, 'Single', 'Software Engineer', '11 Northshore Drive, Singapore', 'Indian', false, 'Requested quick quote on high-deductible health plan.')
  returning id
)
select count(*) from lead_rows;

with product_rows as (
  insert into public.products (id, product_name, product_code, need_type, description, premium_range, min_age, max_age, premium_modes, recommended_sum_assured, features)
  values
    ('9ec0cd93-f449-4a1b-9e77-e8d94f65dd24', 'LifeShield Plus', 'LSP-001', 'Protection', 'Comprehensive term life plan with optional critical illness riders and premium waiver benefits.', '$150 - $480 / month', 18, 65, array['Monthly', 'Quarterly', 'Annual'], 500000, array['Guaranteed level premiums', 'Critical illness rider up to $350k', 'Premium waiver for disability']),
    ('b7c4c2b9-7b43-43ef-b55e-4c3dc3b0e57a', 'SecureIncome Pro', 'SIP-010', 'Retirement', 'Hybrid savings plan with guaranteed income payouts and loyalty bonuses from the 10th policy year.', '$200 - $650 / month', 21, 60, array['Monthly', 'Annual'], 300000, array['Guaranteed cash value accumulation', 'Choice of 10, 15 or 20 year payout periods', 'Additional 5% loyalty bonus every 5 years']),
    ('f4eda09b-4b12-4ec4-986e-0d2cf2050d3b', 'CareShield Health', 'CSH-305', 'Health', 'Integrated health plan with high annual limits and cashless hospital admission benefits.', '$180 - $520 / month', 18, 60, array['Monthly', 'Quarterly', 'Annual'], 300000, array['Direct billing hospital network', 'Worldwide emergency coverage', 'Enhanced outpatient benefits'])
  returning id
)
select count(*) from product_rows;

with policy_rows as (
  insert into public.policies (id, lead_id, product_id, policy_number, product_name, coverage_type, coverage_amount, sum_assured, premium_amount, premium_frequency, policy_start_date, policy_end_date, status)
  values
    ('3c0aeb58-18bb-43cc-8d55-be3fbc375765', '7f2e9d33-5bda-4f61-9e62-6102efd1c627', '9ec0cd93-f449-4a1b-9e77-e8d94f65dd24', 'PL-2023-00125', 'LifeShield Plus', 'Protection', 500000, 500000, 420, 'Quarterly', '2023-06-01', '2026-06-01', 'Active'),
    ('cb988d48-f41d-4bff-9006-17a260f0f2c6', '23afc5cd-2676-4d26-9b74-28f23995df83', 'b7c4c2b9-7b43-43ef-b55e-4c3dc3b0e57a', 'PL-2022-00987', 'SecureIncome Pro', 'Retirement', 750000, 600000, 680, 'Monthly', '2022-03-15', '2025-03-15', 'Active'),
    ('d04b38f4-1e94-4525-a5cb-3aba8b516178', '7f2e9d33-5bda-4f61-9e62-6102efd1c627', 'f4eda09b-4b12-4ec4-986e-0d2cf2050d3b', 'PL-2024-00432', 'CareShield Health', 'Health', 300000, 300000, 360, 'Monthly', '2024-02-10', '2025-02-10', 'Active')
  returning id
)
select count(*) from policy_rows;

with proposal_rows as (
  insert into public.proposals (id, proposal_number, lead_id, proposer_name, stage, status, completion_percentage, fact_finding_data, fna_data, recommendation_data, quotation_data, application_data, last_updated)
  values
    (
      'b0b37b35-2257-4d6b-a8f0-5d266cc0a694',
      'PRO-2025-0034',
      '81c86103-4f52-4a6c-bd16-172edb0f6dfa',
      'Jason Tan',
      'Recommendation',
      'In Progress',
      60,
      jsonb_build_object(
        'personal_details', jsonb_build_object(
          'title', 'Mr',
          'name', 'Jason Tan',
          'gender', 'Male',
          'nric', 'S9033421B',
          'date_of_birth', '1990-11-03',
          'phone_number', '+65 9333 8899',
          'email', 'jason.tan@example.com'
        ),
        'financial_profile', jsonb_build_object(
          'annual_income', 120000,
          'monthly_expenses', 4500
        ),
        'goals', jsonb_build_array(
          jsonb_build_object('id', 'goal-1', 'description', 'Income protection up to age 65', 'priority', 'High')
        )
      ),
      '{}'::jsonb,
      jsonb_build_object(
        'solutions', jsonb_build_array(
          jsonb_build_object('product_id', '9ec0cd93-f449-4a1b-9e77-e8d94f65dd24', 'rationale', 'Protect income with waiver benefits')
        )
      ),
      '{}'::jsonb,
      '{}'::jsonb,
      '2025-10-24T15:45:00+08:00'
    ),
    (
      '9f3163d8-9e83-4541-98af-47b4f30b0c64',
      'PRO-2025-0048',
      '23afc5cd-2676-4d26-9b74-28f23995df83',
      'Nur Aisyah Binte Rahman',
      'FNA',
      'Pending for UW',
      45,
      '{}'::jsonb,
      jsonb_build_object('summary', 'Reviewing retirement gap and medical upgrade options.'),
      '{}'::jsonb,
      '{}'::jsonb,
      '{}'::jsonb,
      '2025-10-22T11:05:00+08:00'
    )
  returning id
)
select count(*) from proposal_rows;

with task_rows as (
  insert into public.tasks (id, title, type, date, time, duration, linked_lead_id, linked_lead_name, notes)
  values
    ('0ec63275-4c19-4f0d-a232-6fdac5bc2c10', 'Annual review meeting', 'Appointment', current_date + interval '1 day', '10:00', '60', '7f2e9d33-5bda-4f61-9e62-6102efd1c627', 'Sarah Chen', 'Focus on maternity coverage and education savings.'),
    ('27f3c158-bd22-431b-8f9e-9633bdff6e63', 'Follow-up call on income protection quote', 'Task', current_date, '14:30', '30', '81c86103-4f52-4a6c-bd16-172edb0f6dfa', 'Jason Tan', 'Clarify riders and premium waiver options.'),
    ('5e8d8558-3d9a-4b4c-9ed6-4f91d29023f0', 'Submit updated financial analysis', 'Task', current_date - interval '1 day', '16:00', '45', '23afc5cd-2676-4d26-9b74-28f23995df83', 'Nur Aisyah Binte Rahman', 'Share revised FNA with underwriting team.')
  returning id
)
select count(*) from task_rows;

with broadcast_rows as (
  insert into public.broadcasts (id, title, content, category, is_pinned, published_date)
  values
    ('9f5bbe86-dc25-4ce2-8d08-a9bcb4b7ab40', 'Product Launch: WealthBuilder 2025', 'Introducing WealthBuilder 2025 - a flexible investment-linked plan with auto-rebalancing strategies and income payout options from year 10 onwards.', 'Announcement', true, '2025-10-24T09:00:00+08:00'),
    ('9ad4b6f2-d91f-4bd1-8340-3a1773d855c6', 'Upcoming CPD Workshop: Estate Planning in 2026', 'Join our estate planning specialists on 4 Nov for a deep dive into multi-generational wealth transfer strategies. Earn 3.5 CPD hours.', 'Training', false, '2025-10-22T12:00:00+08:00'),
    ('a7751236-2045-4d85-bbe7-228aa7221324', 'Campaign Toolkit: Year-end Protection Drive', 'Download campaign assets, social tiles and personalised email templates to boost December protection sales.', 'Campaign', false, '2025-10-20T08:30:00+08:00')
  returning id
)
select count(*) from broadcast_rows;

commit;
