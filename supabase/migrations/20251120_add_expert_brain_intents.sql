-- Add topics and intents for Expert Brain workflows (KA-FNA-02 and KA-REG-01)

-- 1. Add FNA topic if it doesn't exist
INSERT INTO public.mira_topics (topic, subtopic, description)
VALUES
  ('fna', 'data_management', 'Financial Needs Analysis data capture and management')
ON CONFLICT (topic, subtopic) DO NOTHING;

-- 2. Add knowledge base topic if it doesn't exist
INSERT INTO public.mira_topics (topic, subtopic, description)
VALUES
  ('knowledge', 'regulatory', 'Regulatory and compliance knowledge queries')
ON CONFLICT (topic, subtopic) DO NOTHING;

-- 3. Add operational topic for meeting prep (from KA-OPS-01)
INSERT INTO public.mira_topics (topic, subtopic, description)
VALUES
  ('operations', 'meeting_prep', 'Meeting preparation and scheduling')
ON CONFLICT (topic, subtopic) DO NOTHING;

-- 4. Add compliance topic for vulnerability checks (from KA-ETH-01)
INSERT INTO public.mira_topics (topic, subtopic, description)
VALUES
  ('compliance', 'vulnerability', 'Vulnerable client detection and safeguarding')
ON CONFLICT (topic, subtopic) DO NOTHING;

-- 5. Register FNA Data Capture intent (KA-FNA-02)
INSERT INTO public.mira_intents (
  topic,
  subtopic,
  intent_name,
  display_name,
  description,
  required_fields,
  optional_fields,
  ui_actions,
  example_phrases
)
VALUES (
  'fna',
  'data_management',
  'fna__capture_update_data',
  'Update FNA Data',
  'Captures client data updates and applies them to the Financial Needs Analysis',
  '[]'::jsonb,
  '["field_path", "field_value"]'::jsonb,
  '[]'::jsonb,
  ARRAY[
    'Update FNA field income to 120000',
    'Change client''s monthly income to $8000',
    'Set FNA dependents to 3',
    'Update the client''s age to 45',
    'Change occupation to Engineer',
    'Update FNA marital status to married'
  ]
)
ON CONFLICT (topic, subtopic, intent_name) DO UPDATE SET
  example_phrases = EXCLUDED.example_phrases,
  description = EXCLUDED.description;

-- 6. Register Regulatory Q&A intent (KA-REG-01)
INSERT INTO public.mira_intents (
  topic,
  subtopic,
  intent_name,
  display_name,
  description,
  required_fields,
  optional_fields,
  ui_actions,
  example_phrases
)
VALUES (
  'knowledge',
  'regulatory',
  'kb__regulatory_qa',
  'Regulatory Q&A',
  'Answers questions about Singapore insurance regulations (MAS, LIA, PDPA)',
  '[]'::jsonb,
  '["question"]'::jsonb,
  '[]'::jsonb,
  ARRAY[
    'What are the latest regulations for Singapore wealth management?',
    'Tell me about MAS guidelines for insurance advisors',
    'What are PDPA requirements for client data?',
    'What are the LIA ethical standards?',
    'Explain the balanced scorecard requirements',
    'What are the disclosure requirements for insurance products?'
  ]
)
ON CONFLICT (topic, subtopic, intent_name) DO UPDATE SET
  example_phrases = EXCLUDED.example_phrases,
  description = EXCLUDED.description;

-- 7. Register Meeting Prep intent (KA-OPS-01)
INSERT INTO public.mira_intents (
  topic,
  subtopic,
  intent_name,
  display_name,
  description,
  required_fields,
  optional_fields,
  ui_actions,
  example_phrases
)
VALUES (
  'operations',
  'meeting_prep',
  'ops__prepare_meeting',
  'Prepare Meeting',
  'Prepares a meeting agenda and tasks for client reviews',
  '[]'::jsonb,
  '["client_id", "meeting_date"]'::jsonb,
  '[{"type": "navigate", "route": "/fna"}]'::jsonb,
  ARRAY[
    'Prepare for client meeting tomorrow',
    'Create agenda for John Tan review',
    'Schedule client review next week',
    'Set up meeting prep for quarterly review'
  ]
)
ON CONFLICT (topic, subtopic, intent_name) DO UPDATE SET
  example_phrases = EXCLUDED.example_phrases,
  description = EXCLUDED.description;

-- 8. Register Vulnerable Client Safeguard intent (KA-ETH-01)
INSERT INTO public.mira_intents (
  topic,
  subtopic,
  intent_name,
  display_name,
  description,
  required_fields,
  optional_fields,
  ui_actions,
  example_phrases
)
VALUES (
  'compliance',
  'vulnerability',
  'compliance__check_vulnerability',
  'Check Client Vulnerability',
  'Detects vulnerable clients and enforces compliance checks per MAS guidelines',
  '[]'::jsonb,
  '["client_age", "education_level", "language_proficiency"]'::jsonb,
  '[]'::jsonb,
  ARRAY[
    'Is this client considered vulnerable?',
    'Check if Mrs Lee needs special protection',
    'Verify vulnerable client checklist for elderly client',
    'Client is 65 years old, check compliance requirements'
  ]
)
ON CONFLICT (topic, subtopic, intent_name) DO UPDATE SET
  example_phrases = EXCLUDED.example_phrases,
  description = EXCLUDED.description;

COMMENT ON TABLE public.mira_intents IS 'Intent definitions with example phrases for Expert Brain workflow triggers';
