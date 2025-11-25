-- Migration: Enhance Service Requests for Servicing Module
-- Date: 2025-11-22
-- Description: Extends the service_requests table to support comprehensive customer servicing workflows
-- including priority management, SLA tracking, and communication history

-- Add priority field for request management
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'));

-- Add assigned_to field for team member assignment
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS assigned_to TEXT REFERENCES profiles(id);

-- Add due_date for SLA tracking
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Add SLA status tracking
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS sla_status VARCHAR(20) DEFAULT 'On Track' CHECK (sla_status IN ('On Track', 'At Risk', 'Breached'));

-- Add resolution details
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolved_by TEXT REFERENCES profiles(id);

-- Add customer satisfaction rating
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS customer_feedback TEXT;

-- Add attachments (stored as JSONB array of file references)
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add communication history (stored as JSONB array)
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS communication_history JSONB DEFAULT '[]'::jsonb;

-- Add tags for categorization
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add source channel tracking
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS source_channel VARCHAR(50) DEFAULT 'Portal' CHECK (source_channel IN ('Portal', 'Email', 'Phone', 'WhatsApp', 'Walk-in', 'Mobile App'));

-- Add comments for documentation
COMMENT ON COLUMN service_requests.priority IS 'Priority level: Low, Medium, High, or Urgent';
COMMENT ON COLUMN service_requests.assigned_to IS 'Team member assigned to handle this request';
COMMENT ON COLUMN service_requests.due_date IS 'Target completion date for SLA tracking';
COMMENT ON COLUMN service_requests.sla_status IS 'SLA compliance status: On Track, At Risk, or Breached';
COMMENT ON COLUMN service_requests.resolution_notes IS 'Detailed notes about how the request was resolved';
COMMENT ON COLUMN service_requests.resolved_at IS 'Timestamp when request was marked as resolved';
COMMENT ON COLUMN service_requests.resolved_by IS 'Team member who resolved the request';
COMMENT ON COLUMN service_requests.customer_rating IS 'Customer satisfaction rating (1-5 stars)';
COMMENT ON COLUMN service_requests.customer_feedback IS 'Customer feedback about the service';
COMMENT ON COLUMN service_requests.attachments IS 'JSON array of file attachments (URLs, names, sizes)';
COMMENT ON COLUMN service_requests.communication_history IS 'JSON array of communications (emails, calls, notes)';
COMMENT ON COLUMN service_requests.tags IS 'Tags for categorization and filtering';
COMMENT ON COLUMN service_requests.source_channel IS 'Channel through which the request was received';

-- Create indexes for efficient filtering and sorting
CREATE INDEX IF NOT EXISTS idx_service_requests_priority ON service_requests(priority);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to ON service_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_requests_due_date ON service_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_service_requests_sla_status ON service_requests(sla_status);
CREATE INDEX IF NOT EXISTS idx_service_requests_status_priority ON service_requests(status, priority);
CREATE INDEX IF NOT EXISTS idx_service_requests_tags ON service_requests USING GIN(tags);

-- Create partial index for overdue requests
CREATE INDEX IF NOT EXISTS idx_service_requests_overdue
ON service_requests(due_date)
WHERE status NOT IN ('completed', 'cancelled') AND due_date < NOW();

-- Update existing requests with default priority
UPDATE service_requests
SET priority = 'Medium'
WHERE priority IS NULL;

-- Function to automatically update SLA status based on due date
CREATE OR REPLACE FUNCTION update_service_request_sla_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update for non-completed requests with due dates
  IF NEW.status NOT IN ('completed', 'cancelled') AND NEW.due_date IS NOT NULL THEN
    -- Calculate hours until due
    DECLARE
      hours_until_due NUMERIC;
    BEGIN
      hours_until_due := EXTRACT(EPOCH FROM (NEW.due_date - NOW())) / 3600;

      -- Set SLA status based on time remaining
      IF hours_until_due < 0 THEN
        NEW.sla_status := 'Breached';
      ELSIF hours_until_due < 24 THEN
        NEW.sla_status := 'At Risk';
      ELSE
        NEW.sla_status := 'On Track';
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update SLA status
DROP TRIGGER IF EXISTS trigger_update_sla_status ON service_requests;
CREATE TRIGGER trigger_update_sla_status
BEFORE INSERT OR UPDATE OF due_date, status ON service_requests
FOR EACH ROW
EXECUTE FUNCTION update_service_request_sla_status();
