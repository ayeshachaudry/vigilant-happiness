-- ============================================================================
-- CLEANUP: Drop all existing RLS policies (run this first if RLS exists)
-- ============================================================================

-- Drop all policies on faculty table
DROP POLICY IF EXISTS "faculty_select_public" ON faculty;
DROP POLICY IF EXISTS "faculty_insert_public" ON faculty;
DROP POLICY IF EXISTS "faculty_update_public" ON faculty;
DROP POLICY IF EXISTS "faculty_delete_public" ON faculty;
DROP POLICY IF EXISTS "faculty_deny_write" ON faculty;
DROP POLICY IF EXISTS "faculty_deny_update" ON faculty;
DROP POLICY IF EXISTS "faculty_deny_delete" ON faculty;

-- Drop all policies on reviews table
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_anon" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
DROP POLICY IF EXISTS "reviews_deny_update" ON reviews;
DROP POLICY IF EXISTS "reviews_deny_delete" ON reviews;

-- Drop FK constraint if exists
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_faculty_fk;

-- Disable RLS (optional - only if you want to start fresh)
-- ALTER TABLE faculty DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Now you can run SUPABASE_RLS_SECURITY.sql to apply fresh policies
-- ============================================================================
