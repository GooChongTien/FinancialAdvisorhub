-- Migration: Add Entity Customer Support
-- Date: 2025-11-22
-- Description: Extends the leads table to support both Individual and Entity (company) customers
-- This enables B2B insurance sales including group life insurance

-- Add customer_type column with default value
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'Individual' NOT NULL;

-- Add check constraint for customer_type values
ALTER TABLE leads
ADD CONSTRAINT leads_customer_type_check
CHECK (customer_type IN ('Individual', 'Entity'));

-- Add entity-specific columns
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_registration_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS keyman_details JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS num_employees INTEGER,
ADD COLUMN IF NOT EXISTS annual_revenue DECIMAL(15, 2);

-- Add comments for documentation
COMMENT ON COLUMN leads.customer_type IS 'Type of customer: Individual or Entity (company)';
COMMENT ON COLUMN leads.company_name IS 'Company name for entity customers';
COMMENT ON COLUMN leads.business_registration_no IS 'Business registration number for entity customers';
COMMENT ON COLUMN leads.industry IS 'Industry sector for entity customers';
COMMENT ON COLUMN leads.keyman_details IS 'JSON array of key person details for group life insurance';
COMMENT ON COLUMN leads.num_employees IS 'Number of employees for entity customers';
COMMENT ON COLUMN leads.annual_revenue IS 'Annual revenue for entity customers';

-- Set existing customers to 'Individual' type (already done by default value, but explicit for clarity)
UPDATE leads
SET customer_type = 'Individual'
WHERE customer_type IS NULL;

-- Create index for customer_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_leads_customer_type ON leads(customer_type);

-- Create index for company_name for entity customer searches
CREATE INDEX IF NOT EXISTS idx_leads_company_name ON leads(company_name) WHERE company_name IS NOT NULL;
