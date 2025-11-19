-- Performance Indexes for MIRA Co-Pilot
-- Created: 2025-11-13
-- Purpose: Add indexes for frequently queried columns to improve query performance

-- ============================================================================
-- LEADS TABLE INDEXES
-- ============================================================================

-- Index for filtering by lead status (used in hot leads, lead lists)
CREATE INDEX IF NOT EXISTS idx_leads_status
ON leads(status)
WHERE status IS NOT NULL;

-- Index for filtering by lead source (used in analytics, lead tracking)
CREATE INDEX IF NOT EXISTS idx_leads_lead_source
ON leads(lead_source)
WHERE lead_source IS NOT NULL;

-- Index for ordering by creation date (used in recent leads, timeline views)
CREATE INDEX IF NOT EXISTS idx_leads_created_at
ON leads(created_at DESC);

-- Compound index for hot leads queries (status + last_contacted)
CREATE INDEX IF NOT EXISTS idx_leads_status_last_contacted
ON leads(status, last_contacted DESC)
WHERE status IS NOT NULL AND last_contacted IS NOT NULL;

-- Index for advisor-specific lead queries
CREATE INDEX IF NOT EXISTS idx_leads_advisor_id_created_at
ON leads(advisor_id, created_at DESC)
WHERE advisor_id IS NOT NULL;

-- ============================================================================
-- PROPOSALS TABLE INDEXES
-- ============================================================================

-- Index for filtering by proposal status (used in pipeline views, analytics)
CREATE INDEX IF NOT EXISTS idx_proposals_status
ON proposals(status)
WHERE status IS NOT NULL;

-- Index for ordering by creation date (used in recent proposals, timeline views)
CREATE INDEX IF NOT EXISTS idx_proposals_created_at
ON proposals(created_at DESC);

-- Compound index for advisor-specific proposal queries
CREATE INDEX IF NOT EXISTS idx_proposals_advisor_id_status
ON proposals(advisor_id, status)
WHERE advisor_id IS NOT NULL;

-- Index for lead-to-proposal conversion tracking
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id
ON proposals(lead_id)
WHERE lead_id IS NOT NULL;

-- ============================================================================
-- TASKS TABLE INDEXES
-- ============================================================================

-- Index for filtering by task status (used in todo lists, completed tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_status
ON tasks(status)
WHERE status IS NOT NULL;

-- Index for ordering by due date (used in upcoming tasks, overdue tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
ON tasks(due_date DESC NULLS LAST);

-- Compound index for today's tasks and upcoming tasks queries
CREATE INDEX IF NOT EXISTS idx_tasks_advisor_date
ON tasks(advisor_id, date)
WHERE advisor_id IS NOT NULL AND date IS NOT NULL;

-- Compound index for pending tasks by due date
CREATE INDEX IF NOT EXISTS idx_tasks_status_due_date
ON tasks(status, due_date)
WHERE status = 'pending' AND due_date IS NOT NULL;

-- Index for task completion tracking
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at
ON tasks(completed_at DESC)
WHERE completed_at IS NOT NULL;

-- ============================================================================
-- POLICIES TABLE INDEXES
-- ============================================================================

-- Index for active policies (used in YTD calculations, analytics)
CREATE INDEX IF NOT EXISTS idx_policies_status
ON policies(status)
WHERE status IS NOT NULL;

-- Index for policy start date (used in period-based analytics)
CREATE INDEX IF NOT EXISTS idx_policies_start_date
ON policies(start_date DESC);

-- Compound index for advisor performance queries
CREATE INDEX IF NOT EXISTS idx_policies_advisor_id_start_date
ON policies(advisor_id, start_date DESC)
WHERE advisor_id IS NOT NULL;

-- ============================================================================
-- BROADCASTS TABLE INDEXES
-- ============================================================================

-- Index for published broadcasts (used in recent announcements)
CREATE INDEX IF NOT EXISTS idx_broadcasts_published_date
ON broadcasts(published_date DESC NULLS LAST);

-- Index for broadcast category filtering
CREATE INDEX IF NOT EXISTS idx_broadcasts_category
ON broadcasts(category)
WHERE category IS NOT NULL;

-- Compound index for published broadcasts by category
CREATE INDEX IF NOT EXISTS idx_broadcasts_category_published
ON broadcasts(category, published_date DESC)
WHERE category IS NOT NULL AND published_date IS NOT NULL;

-- ============================================================================
-- MIRA TELEMETRY INDEXES
-- ============================================================================

-- Index for mira_events table (used for tool execution monitoring)
CREATE INDEX IF NOT EXISTS idx_mira_events_created_at
ON mira_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mira_events_event_type
ON mira_events(event_type)
WHERE event_type IS NOT NULL;

-- Compound index for advisor-specific event queries
CREATE INDEX IF NOT EXISTS idx_mira_events_advisor_event
ON mira_events(advisor_id, event_type, created_at DESC)
WHERE advisor_id IS NOT NULL;

-- Index for mira_intent_logs (used for intent classification analytics)
CREATE INDEX IF NOT EXISTS idx_mira_intent_logs_created_at
ON mira_intent_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mira_intent_logs_confidence
ON mira_intent_logs(confidence)
WHERE confidence IS NOT NULL;

-- Compound index for low-confidence intent monitoring
CREATE INDEX IF NOT EXISTS idx_mira_intent_logs_confidence_tier
ON mira_intent_logs(confidence_tier, created_at DESC)
WHERE confidence_tier IN ('low', 'medium');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_leads_status IS 'Performance index for lead status filtering';
COMMENT ON INDEX idx_leads_created_at IS 'Performance index for lead chronological ordering';
COMMENT ON INDEX idx_proposals_status IS 'Performance index for proposal status filtering';
COMMENT ON INDEX idx_tasks_due_date IS 'Performance index for task due date ordering';
COMMENT ON INDEX idx_policies_advisor_id_start_date IS 'Performance index for advisor YTD analytics';

-- ============================================================================
-- ANALYSIS
-- ============================================================================

-- To verify index usage, run:
-- EXPLAIN ANALYZE SELECT * FROM leads WHERE status = 'Qualified' ORDER BY created_at DESC LIMIT 10;

-- To check index sizes:
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid))
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;
