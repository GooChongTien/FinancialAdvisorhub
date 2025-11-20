-- Run this in the Supabase SQL Editor to enable Role-Based Access Control

-- 1. Add role column to advisors table
ALTER TABLE advisors 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'advisor' 
CHECK (role IN ('admin', 'advisor'));

-- 2. Set your user as Admin
-- Replace 'your_email@example.com' with your actual email if you know it, 
-- or just run this to set the most recently created user as admin:
UPDATE advisors 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM advisors ORDER BY created_at DESC LIMIT 1
);

-- Verify the change
SELECT * FROM advisors;
