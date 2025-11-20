-- Force schema cache reload
NOTIFY pgrst, 'reload config';

-- Add a comment to ensure the table modification is registered and cache is invalidated
COMMENT ON COLUMN public.mira_behavioral_events.module IS 'Module where the event occurred';

-- Re-apply the column definition just in case (idempotent)
ALTER TABLE public.mira_behavioral_events 
ADD COLUMN IF NOT EXISTS module TEXT;
