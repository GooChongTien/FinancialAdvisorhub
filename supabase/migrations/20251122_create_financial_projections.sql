-- Migration: Create Financial Projections Table
-- Date: 2025-11-22
-- Description: Creates table to store financial projection data for the Creative Visualizer module
-- Supporting retirement planning, savings goals, and investment projections

CREATE TABLE IF NOT EXISTS financial_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer and advisor reference
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  advisor_id TEXT,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,

  -- Projection metadata
  projection_name VARCHAR(255) NOT NULL,
  projection_type VARCHAR(50) NOT NULL CHECK (projection_type IN (
    'Retirement',
    'Education',
    'Savings Goal',
    'Investment Growth',
    'Protection Coverage',
    'Wealth Accumulation',
    'Estate Planning'
  )),
  description TEXT,

  -- Financial parameters
  initial_amount DECIMAL(15, 2) DEFAULT 0,
  monthly_contribution DECIMAL(15, 2) DEFAULT 0,
  annual_contribution DECIMAL(15, 2) DEFAULT 0,
  target_amount DECIMAL(15, 2),

  -- Time parameters
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  projection_years INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM end_date) - EXTRACT(YEAR FROM start_date)) STORED,

  -- Assumptions
  assumed_return_rate DECIMAL(5, 2) DEFAULT 5.0, -- Annual return rate percentage
  inflation_rate DECIMAL(5, 2) DEFAULT 2.0,      -- Annual inflation rate percentage
  currency VARCHAR(10) DEFAULT 'SGD',

  -- Projection data (yearly breakdown stored as JSONB)
  projection_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Structure: [{ year: 2024, age: 35, contribution: 12000, growth: 600, balance: 112600, ... }, ...]

  -- Visualization settings
  chart_type VARCHAR(50) DEFAULT 'line', -- 'line', 'bar', 'area', 'combo'
  color_scheme VARCHAR(50) DEFAULT 'blue',
  show_milestones BOOLEAN DEFAULT TRUE,

  -- Scenario comparison (for comparing different strategies)
  is_baseline BOOLEAN DEFAULT FALSE,
  scenario_name VARCHAR(100),
  parent_projection_id UUID REFERENCES financial_projections(id) ON DELETE CASCADE,

  -- Status
  status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Archived')),

  -- Sharing and presentation
  is_shared_with_client BOOLEAN DEFAULT FALSE,
  shared_at TIMESTAMP WITH TIME ZONE,
  presentation_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE financial_projections IS 'Financial projections for Creative Visualizer module';
COMMENT ON COLUMN financial_projections.projection_type IS 'Type of financial projection';
COMMENT ON COLUMN financial_projections.projection_data IS 'Year-by-year projection breakdown as JSON array';
COMMENT ON COLUMN financial_projections.assumed_return_rate IS 'Annual return rate assumption (percentage)';
COMMENT ON COLUMN financial_projections.inflation_rate IS 'Annual inflation rate assumption (percentage)';
COMMENT ON COLUMN financial_projections.is_baseline IS 'Whether this is the baseline scenario for comparison';
COMMENT ON COLUMN financial_projections.parent_projection_id IS 'Reference to parent projection for scenario comparison';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_financial_projections_lead_id ON financial_projections(lead_id);
CREATE INDEX IF NOT EXISTS idx_financial_projections_advisor_id ON financial_projections(advisor_id);
CREATE INDEX IF NOT EXISTS idx_financial_projections_proposal_id ON financial_projections(proposal_id);
CREATE INDEX IF NOT EXISTS idx_financial_projections_type ON financial_projections(projection_type);
CREATE INDEX IF NOT EXISTS idx_financial_projections_status ON financial_projections(status);
CREATE INDEX IF NOT EXISTS idx_financial_projections_parent ON financial_projections(parent_projection_id) WHERE parent_projection_id IS NOT NULL;

-- Composite index for customer's active projections
CREATE INDEX IF NOT EXISTS idx_financial_projections_active
ON financial_projections(lead_id, status, created_at DESC)
WHERE status = 'Active';

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_financial_projections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_financial_projections_timestamp ON financial_projections;
CREATE TRIGGER trigger_update_financial_projections_timestamp
BEFORE UPDATE ON financial_projections
FOR EACH ROW
EXECUTE FUNCTION update_financial_projections_updated_at();

-- Function to validate projection data structure
CREATE OR REPLACE FUNCTION validate_projection_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure projection_data is an array
  IF jsonb_typeof(NEW.projection_data) != 'array' THEN
    RAISE EXCEPTION 'projection_data must be a JSON array';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for data validation
DROP TRIGGER IF EXISTS trigger_validate_projection_data ON financial_projections;
CREATE TRIGGER trigger_validate_projection_data
BEFORE INSERT OR UPDATE OF projection_data ON financial_projections
FOR EACH ROW
EXECUTE FUNCTION validate_projection_data();

-- Enable Row Level Security
ALTER TABLE financial_projections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Advisors can view their customers' projections"
ON financial_projections FOR SELECT
USING (advisor_id = current_setting('app.current_advisor_id', TRUE));

CREATE POLICY "Advisors can insert projections for their customers"
ON financial_projections FOR INSERT
WITH CHECK (advisor_id = current_setting('app.current_advisor_id', TRUE));

CREATE POLICY "Advisors can update their customers' projections"
ON financial_projections FOR UPDATE
USING (advisor_id = current_setting('app.current_advisor_id', TRUE));

CREATE POLICY "Advisors can delete their customers' projections"
ON financial_projections FOR DELETE
USING (advisor_id = current_setting('app.current_advisor_id', TRUE));
