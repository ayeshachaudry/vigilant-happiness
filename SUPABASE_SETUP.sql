-- ============================================================================
-- SUPABASE SQL SETUP FOR FACULTY INSTRUCTORS
-- ============================================================================
-- Copy and paste this into Supabase SQL Editor and run
-- ============================================================================

-- Step 1: Add missing columns to faculty table
-- (if they don't already exist)
ALTER TABLE faculty
ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'Lahore',
ADD COLUMN IF NOT EXISTS university TEXT DEFAULT 'FAST-NUCES';

-- Step 2: Clear any old instructor data
-- (to avoid duplicates)
DELETE FROM faculty 
WHERE designation = 'Instructor';

-- Step 3: Verify the table structure
-- (run this to confirm columns exist)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'faculty'
-- ORDER BY ordinal_position;

-- ============================================================================
-- Done! Now run in terminal:
-- E:/faculty-review/.venv/Scripts/python.exe scripts/load_all_instructors.py
-- ============================================================================
