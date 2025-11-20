-- Add role column to advisors table
ALTER TABLE advisors 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'advisor' 
CHECK (role IN ('admin', 'advisor'));

-- Set the first advisor as admin (for testing purposes)
-- You can change the email to your specific admin email if known
UPDATE advisors 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM advisors ORDER BY created_at ASC LIMIT 1
);
