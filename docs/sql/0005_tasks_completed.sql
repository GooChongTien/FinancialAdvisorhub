-- Add a boolean completion flag for tasks
-- Safe to run multiple times
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;

-- Optional: backfill NULLs to false if the column existed without default
UPDATE tasks SET completed = COALESCE(completed, false) WHERE completed IS NULL;

