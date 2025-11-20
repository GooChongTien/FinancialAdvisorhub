-- Create table for raw behavioral events (clicks, navigation, etc.)
CREATE TABLE IF NOT EXISTS mira_behavioral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL, -- 'navigation', 'click', 'input', 'form_submit'
  module TEXT NOT NULL,
  page TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for learned patterns (e.g., "User struggles with Lead Form")
CREATE TABLE IF NOT EXISTS mira_learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- 'struggle', 'preference', 'workflow_habit'
  user_id UUID REFERENCES auth.users(id),
  module TEXT,
  confidence FLOAT DEFAULT 0.0,
  frequency INT DEFAULT 1,
  last_detected_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_mira_events_session ON mira_behavioral_events(session_id);
CREATE INDEX idx_mira_events_user ON mira_behavioral_events(user_id);
CREATE INDEX idx_mira_events_created ON mira_behavioral_events(created_at);
CREATE INDEX idx_mira_patterns_user ON mira_learned_patterns(user_id);

-- Enable RLS
ALTER TABLE mira_behavioral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_learned_patterns ENABLE ROW LEVEL SECURITY;

-- Policies for Behavioral Events
CREATE POLICY "Users can insert their own events"
  ON mira_behavioral_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
  ON mira_behavioral_events FOR SELECT
  USING (auth.uid() = user_id);

-- Policies for Learned Patterns
CREATE POLICY "Users can view their own patterns"
  ON mira_learned_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access"
  ON mira_learned_patterns FOR ALL
  USING (auth.role() = 'service_role');
