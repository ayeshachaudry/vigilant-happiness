-- ============================================================================
-- SUPABASE SECURITY CONFIGURATION: Row-Level Security (RLS) & CORS
-- ============================================================================
-- This SQL file hardens your Supabase backend against DDoS and unauthorized access.
-- Paste this into Supabase SQL Editor (App → SQL Editor → New Query) and run.
--
-- WARNING: These policies BLOCK all access by default. Customize as needed.
-- ============================================================================

-- ============================================================================
-- 1. FACULTY TABLE - READ-ONLY PUBLIC ACCESS (for instructor browse/search)
-- ============================================================================

-- Enable RLS on faculty table
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "faculty_select_public" ON faculty;
DROP POLICY IF EXISTS "faculty_insert_public" ON faculty;
DROP POLICY IF EXISTS "faculty_update_public" ON faculty;
DROP POLICY IF EXISTS "faculty_delete_public" ON faculty;

-- Allow SELECT for all users (public browse)
CREATE POLICY "faculty_select_public" ON faculty
  FOR SELECT
  USING (true);

-- DENY INSERT/UPDATE/DELETE from anon role (use service role in backend only)
CREATE POLICY "faculty_deny_write" ON faculty
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "faculty_deny_update" ON faculty
  FOR UPDATE
  USING (false);

CREATE POLICY "faculty_deny_delete" ON faculty
  FOR DELETE
  USING (false);

-- ============================================================================
-- 2. REVIEWS TABLE - CONTROLLED WRITE ACCESS
-- ============================================================================

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_anon" ON reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;

-- Allow SELECT for all (view reviews)
CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT
  USING (true);

-- Allow INSERT from anon role (controlled via API rate limiting & validation)
-- In production, use a service role for this and adjust accordingly
CREATE POLICY "reviews_insert_anon" ON reviews
  FOR INSERT
  WITH CHECK (
    -- Validate: rating between 1-5
    rating >= 1 AND rating <= 5 AND
    -- Validate: comment not too long (normalized to 5000 chars)
    (comment IS NULL OR LENGTH(comment) <= 5000)
  );

-- Deny UPDATE and DELETE from anon role (reviews are immutable unless auto-admin)
CREATE POLICY "reviews_deny_update" ON reviews
  FOR UPDATE
  USING (false);

CREATE POLICY "reviews_deny_delete" ON reviews
  FOR DELETE
  USING (false);

-- ============================================================================
-- 3. CORS CONFIGURATION (restrict to your domain)
-- ============================================================================
--
-- IMPORTANT: Go to Supabase Dashboard → Settings → CORS to add your domain(s)
--
-- Add these origins:
--   - https://yourdomain.com
--   - https://www.yourdomain.com
--   - http://localhost:3000 (dev only)
--
-- Remove * (allow all) if set.
-- Supabase CORS settings are in the dashboard, not via SQL.

-- ============================================================================
-- 4. API KEY ROTATION INSTRUCTIONS
-- ============================================================================
--
-- CRITICAL: Rotate your Supabase keys immediately if they were exposed.
--
-- Steps:
-- 1. Go to Supabase Dashboard → Settings → API
-- 2. Under API Production Key, click "Rotate" (in the anon key row)
-- 3. Confirm rotation
-- 4. Update your .env.local or Vercel Environment Variables:
--    - NEXT_PUBLIC_SUPABASE_URL (no change needed)
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY (update with new anon key)
-- 5. Deploy the app with the new key.
--
-- For server-only operations (optional, not used in this app yet):
-- - Create a Service Role Key in the same settings
-- - Store in Vercel as SUPABASE_SERVICE_ROLE_KEY (server environment only)

-- ============================================================================
-- 5. RATE LIMITING & DDoS MITIGATION (Backend + Infrastructure)
-- ============================================================================
--
-- Implemented in:
--   - Next.js middleware.ts (request header validation)
--   - lib/ddos-protection.ts (IP-based rate limiting, replay detection)
--   - API routes (per-endpoint rate limits: 100-300 req/min)
--   - Vercel Edge Network (automatic DDoS protection)
--   - Supabase built-in protections
--
-- Monitor for abuse via:
--   - Vercel Analytics & Logs
--   - Supabase Logs (Dashboard → Logs)
--   - Set up alerts in your project monitoring tool

-- ============================================================================
-- 6. VERIFY POLICIES
-- ============================================================================
--
-- Run these queries to verify RLS is enabled and working:

-- Show RLS status
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('faculty', 'reviews');

-- List all RLS policies
SELECT tablename, policyname, permissive, roles, qual FROM pg_policies 
WHERE tablename IN ('faculty', 'reviews');

-- ============================================================================
-- 7. ADDITIONAL HARDENING RECOMMENDATIONS
-- ============================================================================
--
-- A. Database Backups: Enable automated backups in Supabase dashboard
-- B. Monitoring: Set up alerts for unusual query patterns
-- C. Audit Logs: Enable in Supabase to track all DB changes
-- D. VPC (Enterprise): Consider a VPC for production if available
-- E. SSL/TLS: Always use HTTPS (enforced by Vercel + Supabase)

-- ============================================================================
-- END OF SECURITY CONFIGURATION
-- ============================================================================
