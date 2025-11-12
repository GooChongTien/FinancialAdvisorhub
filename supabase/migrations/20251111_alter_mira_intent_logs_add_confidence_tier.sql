alter table if exists public.mira_intent_logs
  add column if not exists confidence_tier text;

comment on column public.mira_intent_logs.confidence_tier is 'Confidence tier (high/medium/low) for the classification.';
