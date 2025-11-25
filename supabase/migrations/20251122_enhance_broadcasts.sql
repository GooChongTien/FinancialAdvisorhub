-- Migration: Enhance broadcasts table with categorization and flags

ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS category varchar(50);
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;

-- Guard priority from negative values
ALTER TABLE broadcasts
  ADD CONSTRAINT broadcasts_priority_non_negative CHECK (priority >= 0);

-- Indexes for filtering and pinned items
CREATE INDEX IF NOT EXISTS idx_broadcasts_category ON broadcasts(category);
CREATE INDEX IF NOT EXISTS idx_broadcasts_pinned ON broadcasts(is_pinned) WHERE is_pinned = true;

-- Support tag filtering/search
CREATE INDEX IF NOT EXISTS idx_broadcasts_tags_gin ON broadcasts USING GIN (tags);
