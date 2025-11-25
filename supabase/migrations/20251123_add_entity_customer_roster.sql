-- Migration: Add employee roster support for entity customers
-- Date: 2025-11-23
-- Description: Adds JSONB storage for uploaded employee rosters on the leads table
-- so the AdvisorHub UI can persist bulk employee data for entity clients.

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS employee_roster JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS employee_roster_uploaded_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN leads.employee_roster IS 'Uploaded roster of employees (JSON array) for entity customers';
COMMENT ON COLUMN leads.employee_roster_uploaded_at IS 'Timestamp of the latest employee roster upload';

-- Index to help filter entity customers that already uploaded rosters
CREATE INDEX IF NOT EXISTS idx_leads_employee_roster_uploaded_at
  ON leads(employee_roster_uploaded_at)
  WHERE employee_roster_uploaded_at IS NOT NULL;
