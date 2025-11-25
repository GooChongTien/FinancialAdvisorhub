-- Migration: Create Customer Milestones Table
-- Date: 2025-11-22
-- Description: Creates table to track customer lifecycle milestones for the "Our Journey" feature
-- in the Servicing module, celebrating customer achievements and important events

CREATE TABLE IF NOT EXISTS customer_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer reference
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  advisor_id TEXT REFERENCES profiles(id),

  -- Milestone details
  milestone_type VARCHAR(50) NOT NULL,
  milestone_title VARCHAR(255) NOT NULL,
  milestone_description TEXT,

  -- Milestone date
  milestone_date DATE NOT NULL,

  -- Milestone category
  category VARCHAR(50) DEFAULT 'General' CHECK (category IN (
    'Policy',
    'Life Event',
    'Financial Goal',
    'Service',
    'Relationship',
    'General'
  )),

  -- Milestone metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Associated policy if applicable
  policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,

  -- Celebration details
  is_celebrated BOOLEAN DEFAULT FALSE,
  celebrated_at TIMESTAMP WITH TIME ZONE,
  celebration_method VARCHAR(50), -- 'Email', 'SMS', 'Call', 'Gift', 'Card'

  -- Display settings
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  icon VARCHAR(50), -- Icon identifier for UI
  color VARCHAR(20), -- Color theme for display

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE customer_milestones IS 'Tracks important customer lifecycle events and achievements';
COMMENT ON COLUMN customer_milestones.milestone_type IS 'Type of milestone (e.g., policy_anniversary, birthday, claim_settled)';
COMMENT ON COLUMN customer_milestones.milestone_title IS 'Display title for the milestone';
COMMENT ON COLUMN customer_milestones.milestone_date IS 'Date when the milestone occurred or will occur';
COMMENT ON COLUMN customer_milestones.category IS 'Category for organizing milestones';
COMMENT ON COLUMN customer_milestones.metadata IS 'Additional milestone data (amounts, policy details, etc.)';
COMMENT ON COLUMN customer_milestones.is_celebrated IS 'Whether the milestone has been acknowledged/celebrated';
COMMENT ON COLUMN customer_milestones.celebration_method IS 'How the milestone was celebrated';
COMMENT ON COLUMN customer_milestones.display_order IS 'Order for displaying milestones (lower = higher priority)';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_customer_milestones_lead_id ON customer_milestones(lead_id);
CREATE INDEX IF NOT EXISTS idx_customer_milestones_advisor_id ON customer_milestones(advisor_id);
CREATE INDEX IF NOT EXISTS idx_customer_milestones_milestone_date ON customer_milestones(milestone_date);
CREATE INDEX IF NOT EXISTS idx_customer_milestones_category ON customer_milestones(category);
CREATE INDEX IF NOT EXISTS idx_customer_milestones_type ON customer_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_customer_milestones_visible ON customer_milestones(is_visible) WHERE is_visible = TRUE;
CREATE INDEX IF NOT EXISTS idx_customer_milestones_policy_id ON customer_milestones(policy_id) WHERE policy_id IS NOT NULL;

-- Composite index for timeline queries
CREATE INDEX IF NOT EXISTS idx_customer_milestones_timeline
ON customer_milestones(lead_id, milestone_date DESC, is_visible);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_customer_milestones_timestamp ON customer_milestones;
CREATE TRIGGER trigger_update_customer_milestones_timestamp
BEFORE UPDATE ON customer_milestones
FOR EACH ROW
EXECUTE FUNCTION update_customer_milestones_updated_at();

-- Enable Row Level Security
ALTER TABLE customer_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic structure - adjust based on your auth system)
CREATE POLICY "Advisors can view their customers' milestones"
ON customer_milestones FOR SELECT
USING (advisor_id = current_setting('app.current_advisor_id', TRUE));

CREATE POLICY "Advisors can insert milestones for their customers"
ON customer_milestones FOR INSERT
WITH CHECK (advisor_id = current_setting('app.current_advisor_id', TRUE));

CREATE POLICY "Advisors can update their customers' milestones"
ON customer_milestones FOR UPDATE
USING (advisor_id = current_setting('app.current_advisor_id', TRUE));

CREATE POLICY "Advisors can delete their customers' milestones"
ON customer_milestones FOR DELETE
USING (advisor_id = current_setting('app.current_advisor_id', TRUE));

-- Insert some common milestone types as examples (commented out - can be run separately)
-- INSERT INTO customer_milestones (lead_id, milestone_type, milestone_title, milestone_date, category, icon, color)
-- VALUES
--   (lead_id, 'policy_anniversary', '1 Year Policy Anniversary', '2024-01-15', 'Policy', 'calendar-check', 'blue'),
--   (lead_id, 'birthday', 'Customer Birthday', '1980-06-20', 'Life Event', 'cake', 'pink'),
--   (lead_id, 'first_policy', 'First Policy Purchase', '2023-01-15', 'Relationship', 'star', 'gold');
