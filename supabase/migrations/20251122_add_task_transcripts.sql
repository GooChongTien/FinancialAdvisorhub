-- Migration: Add transcript and sentiment fields to tasks

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS transcript jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sentiment varchar(20);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS key_points jsonb DEFAULT '[]'::jsonb;

-- Constrain sentiment values
ALTER TABLE tasks
  ADD CONSTRAINT tasks_sentiment_allowed CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed'));

-- Indexes to speed transcript/key point search
CREATE INDEX IF NOT EXISTS idx_tasks_transcript_gin ON tasks USING GIN (transcript);
CREATE INDEX IF NOT EXISTS idx_tasks_key_points_gin ON tasks USING GIN (key_points);
