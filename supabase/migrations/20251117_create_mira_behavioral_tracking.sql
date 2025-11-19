-- =====================================================
-- Mira Behavioral Tracking Tables
-- Migration: 20251117_create_mira_behavioral_tracking
-- Created: 2025-11-17
-- Purpose: Enable behavioral tracking for predictive Mira assistance
-- =====================================================

-- =====================================================
-- Table: mira_behavioral_events
-- Purpose: Store user behavioral events for pattern analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS mira_behavioral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL,
  session_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  page_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX idx_behavioral_advisor_session
  ON mira_behavioral_events (advisor_id, session_id);

CREATE INDEX idx_behavioral_event_type
  ON mira_behavioral_events (event_type);

CREATE INDEX idx_behavioral_created
  ON mira_behavioral_events (created_at DESC);

CREATE INDEX idx_behavioral_session
  ON mira_behavioral_events (session_id);

-- Add GIN index for JSONB columns for efficient querying
CREATE INDEX idx_behavioral_event_data
  ON mira_behavioral_events USING GIN (event_data);

CREATE INDEX idx_behavioral_page_context
  ON mira_behavioral_events USING GIN (page_context);

-- Add comment
COMMENT ON TABLE mira_behavioral_events IS
  'Stores user behavioral events (clicks, navigation, form interactions) for Mira pattern analysis and predictive assistance';

COMMENT ON COLUMN mira_behavioral_events.event_type IS
  'Type of event: click, form_input, navigation, search, etc.';

COMMENT ON COLUMN mira_behavioral_events.event_data IS
  'Event-specific data (sanitized for privacy)';

COMMENT ON COLUMN mira_behavioral_events.page_context IS
  'Context of the page where event occurred';

-- =====================================================
-- Table: mira_learned_patterns
-- Purpose: Store learned behavioral patterns for predictive assistance
-- =====================================================
CREATE TABLE IF NOT EXISTS mira_learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(100) NOT NULL,
  pattern_name VARCHAR(255) NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}',
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_patterns_type_confidence
  ON mira_learned_patterns (pattern_type, confidence_score DESC);

CREATE INDEX idx_patterns_last_seen
  ON mira_learned_patterns (last_seen DESC);

CREATE INDEX idx_patterns_success_rate
  ON mira_learned_patterns ((success_count::float / NULLIF(success_count + failure_count, 0)) DESC);

-- Add GIN index for pattern data
CREATE INDEX idx_patterns_data
  ON mira_learned_patterns USING GIN (pattern_data);

-- Add unique constraint on pattern name
CREATE UNIQUE INDEX idx_patterns_unique_name
  ON mira_learned_patterns (pattern_type, pattern_name);

-- Add comment
COMMENT ON TABLE mira_learned_patterns IS
  'Stores learned behavioral patterns with success/failure tracking for improving Mira suggestions';

COMMENT ON COLUMN mira_learned_patterns.pattern_type IS
  'Category of pattern: form_struggle, proposal_creation, analytics_review, etc.';

COMMENT ON COLUMN mira_learned_patterns.confidence_score IS
  'Confidence in pattern (0.0 to 1.0) based on success rate and frequency';

-- =====================================================
-- Table: mira_proactive_suggestions
-- Purpose: Track proactive suggestions shown to users
-- =====================================================
CREATE TABLE IF NOT EXISTS mira_proactive_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL,
  session_id UUID NOT NULL,
  suggestion_id VARCHAR(255) NOT NULL,
  pattern_type VARCHAR(100),
  message TEXT NOT NULL,
  relevance_score DECIMAL(3,2),
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  action_taken JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_proactive_advisor
  ON mira_proactive_suggestions (advisor_id, shown_at DESC);

CREATE INDEX idx_proactive_session
  ON mira_proactive_suggestions (session_id);

CREATE INDEX idx_proactive_pattern
  ON mira_proactive_suggestions (pattern_type);

CREATE INDEX idx_proactive_acceptance
  ON mira_proactive_suggestions (accepted_at)
  WHERE accepted_at IS NOT NULL;

-- Add comment
COMMENT ON TABLE mira_proactive_suggestions IS
  'Tracks proactive suggestions shown to users and their responses for learning';

COMMENT ON COLUMN mira_proactive_suggestions.relevance_score IS
  'How relevant the suggestion was (0.0 to 1.0)';

COMMENT ON COLUMN mira_proactive_suggestions.action_taken IS
  'Details of the action user took if suggestion was accepted';

-- =====================================================
-- Table: mira_privacy_settings
-- Purpose: Store user privacy preferences for behavioral tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS mira_privacy_settings (
  advisor_id UUID PRIMARY KEY,
  tracking_enabled BOOLEAN DEFAULT TRUE,
  track_click_events BOOLEAN DEFAULT TRUE,
  track_form_inputs BOOLEAN DEFAULT TRUE,
  track_navigation_time BOOLEAN DEFAULT TRUE,
  share_with_mira BOOLEAN DEFAULT TRUE,
  data_retention_days INTEGER DEFAULT 30,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE mira_privacy_settings IS
  'User privacy preferences for Mira behavioral tracking';

COMMENT ON COLUMN mira_privacy_settings.track_form_inputs IS
  'Track form interactions (not actual values, only metadata)';

-- =====================================================
-- Update mira_conversations table
-- Add behavioral context columns
-- =====================================================
ALTER TABLE mira_conversations
ADD COLUMN IF NOT EXISTS behavioral_context JSONB,
ADD COLUMN IF NOT EXISTS pattern_matches JSONB,
ADD COLUMN IF NOT EXISTS proactive_trigger VARCHAR(50);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_conversations_behavioral
  ON mira_conversations USING GIN (behavioral_context);

CREATE INDEX IF NOT EXISTS idx_conversations_proactive
  ON mira_conversations (proactive_trigger)
  WHERE proactive_trigger IS NOT NULL;

-- Add comments
COMMENT ON COLUMN mira_conversations.behavioral_context IS
  'Behavioral context snapshot at time of conversation';

COMMENT ON COLUMN mira_conversations.pattern_matches IS
  'Detected patterns that influenced this conversation';

COMMENT ON COLUMN mira_conversations.proactive_trigger IS
  'What triggered this conversation (if proactive): form_struggle, search_pattern, etc.';

-- =====================================================
-- Function: Clean up old behavioral events
-- Purpose: Automatically clean events older than retention period
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_behavioral_events()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM mira_behavioral_events
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_behavioral_events IS
  'Deletes behavioral events older than 30 days for privacy compliance';

-- =====================================================
-- Function: Update pattern confidence
-- Purpose: Recalculate pattern confidence based on success/failure ratio
-- =====================================================
CREATE OR REPLACE FUNCTION update_pattern_confidence()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.confidence_score :=
    CASE
      WHEN (NEW.success_count + NEW.failure_count) = 0 THEN 0.5
      ELSE ROUND(
        (NEW.success_count::decimal / (NEW.success_count + NEW.failure_count))::numeric,
        2
      )
    END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for pattern confidence updates
DROP TRIGGER IF EXISTS trigger_update_pattern_confidence ON mira_learned_patterns;
CREATE TRIGGER trigger_update_pattern_confidence
  BEFORE UPDATE OF success_count, failure_count ON mira_learned_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_confidence();

-- =====================================================
-- Function: Record suggestion outcome
-- Purpose: Update pattern learning based on suggestion acceptance/rejection
-- =====================================================
CREATE OR REPLACE FUNCTION record_suggestion_outcome()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If suggestion was accepted, increment success count
  IF NEW.accepted_at IS NOT NULL AND OLD.accepted_at IS NULL THEN
    UPDATE mira_learned_patterns
    SET
      success_count = success_count + 1,
      last_seen = NOW()
    WHERE pattern_type = NEW.pattern_type;
  END IF;

  -- If suggestion was dismissed, increment failure count
  IF NEW.dismissed_at IS NOT NULL AND OLD.dismissed_at IS NULL AND NEW.accepted_at IS NULL THEN
    UPDATE mira_learned_patterns
    SET
      failure_count = failure_count + 1,
      last_seen = NOW()
    WHERE pattern_type = NEW.pattern_type;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for suggestion outcome tracking
DROP TRIGGER IF EXISTS trigger_record_suggestion_outcome ON mira_proactive_suggestions;
CREATE TRIGGER trigger_record_suggestion_outcome
  AFTER UPDATE OF accepted_at, dismissed_at ON mira_proactive_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION record_suggestion_outcome();

-- =====================================================
-- Views for analytics
-- =====================================================

-- View: Pattern success rates
CREATE OR REPLACE VIEW mira_pattern_success_rates AS
SELECT
  pattern_type,
  pattern_name,
  success_count,
  failure_count,
  success_count + failure_count AS total_count,
  CASE
    WHEN (success_count + failure_count) > 0
    THEN ROUND((success_count::decimal / (success_count + failure_count) * 100)::numeric, 2)
    ELSE 0
  END AS success_rate,
  confidence_score,
  last_seen,
  created_at
FROM mira_learned_patterns
ORDER BY confidence_score DESC, total_count DESC;

COMMENT ON VIEW mira_pattern_success_rates IS
  'Success rates for learned patterns';

-- View: User engagement with proactive suggestions
CREATE OR REPLACE VIEW mira_suggestion_engagement AS
SELECT
  advisor_id,
  pattern_type,
  COUNT(*) AS total_shown,
  COUNT(accepted_at) AS accepted_count,
  COUNT(dismissed_at) AS dismissed_count,
  ROUND(
    (COUNT(accepted_at)::decimal / NULLIF(COUNT(*), 0) * 100)::numeric,
    2
  ) AS acceptance_rate,
  AVG(relevance_score) AS avg_relevance_score,
  MAX(shown_at) AS last_shown
FROM mira_proactive_suggestions
GROUP BY advisor_id, pattern_type
ORDER BY acceptance_rate DESC;

COMMENT ON VIEW mira_suggestion_engagement IS
  'User engagement metrics with proactive suggestions';

-- =====================================================
-- RLS (Row Level Security) Policies
-- Enable RLS on all tables
-- =====================================================

ALTER TABLE mira_behavioral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_proactive_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own behavioral events
CREATE POLICY mira_behavioral_events_select_policy ON mira_behavioral_events
  FOR SELECT
  USING (advisor_id = auth.uid());

-- Policy: Users can insert their own behavioral events
CREATE POLICY mira_behavioral_events_insert_policy ON mira_behavioral_events
  FOR INSERT
  WITH CHECK (advisor_id = auth.uid());

-- Policy: Service role can see all patterns (for learning)
CREATE POLICY mira_learned_patterns_service_policy ON mira_learned_patterns
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Policy: Users can see patterns (read-only)
CREATE POLICY mira_learned_patterns_select_policy ON mira_learned_patterns
  FOR SELECT
  USING (true);

-- Policy: Users can see their own suggestions
CREATE POLICY mira_proactive_suggestions_select_policy ON mira_proactive_suggestions
  FOR SELECT
  USING (advisor_id = auth.uid());

-- Policy: Users can update their own suggestions (accept/dismiss)
CREATE POLICY mira_proactive_suggestions_update_policy ON mira_proactive_suggestions
  FOR UPDATE
  USING (advisor_id = auth.uid());

-- Policy: Service role can insert suggestions
CREATE POLICY mira_proactive_suggestions_insert_policy ON mira_proactive_suggestions
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Policy: Users can manage their own privacy settings
CREATE POLICY mira_privacy_settings_select_policy ON mira_privacy_settings
  FOR SELECT
  USING (advisor_id = auth.uid());

CREATE POLICY mira_privacy_settings_upsert_policy ON mira_privacy_settings
  FOR INSERT
  WITH CHECK (advisor_id = auth.uid());

CREATE POLICY mira_privacy_settings_update_policy ON mira_privacy_settings
  FOR UPDATE
  USING (advisor_id = auth.uid());

-- =====================================================
-- Grant permissions
-- =====================================================

-- Grant authenticated users access to views
GRANT SELECT ON mira_pattern_success_rates TO authenticated;
GRANT SELECT ON mira_suggestion_engagement TO authenticated;

-- =====================================================
-- Seed initial patterns
-- =====================================================

INSERT INTO mira_learned_patterns (pattern_type, pattern_name, pattern_data, confidence_score)
VALUES
  ('form_struggle', 'Extended Form Interaction', '{"indicators": ["high_field_interactions", "no_submission", "extended_time"]}', 0.70),
  ('search_behavior', 'Multiple Search Attempts', '{"indicators": ["multiple_searches", "varied_queries"]}', 0.75),
  ('proposal_creation', 'Customer to Proposal Flow', '{"indicators": ["customer_to_proposal_flow", "fact_finding_page"]}', 0.85),
  ('analytics_review', 'Repeated Analytics Visits', '{"indicators": ["repeated_analytics_visits", "extended_session"]}', 0.80),
  ('navigation_pattern', 'Comparison Shopping', '{"indicators": ["rapid_navigation", "repeated_pages"]}', 0.65)
ON CONFLICT (pattern_type, pattern_name) DO NOTHING;

-- =====================================================
-- Migration Complete
-- =====================================================
