#!/usr/bin/env python3
"""
Add campus and university columns to faculty table if they don't exist
"""

from supabase import create_client, Client

SUPABASE_URL = "https://clezlbmuxxodgytorlrf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpsYm11eHhvZGd5dG9ybHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTQ3NzUsImV4cCI6MjA4NTI5MDc3NX0.jIxtUwgfc1PGC1YuMezgQMn79JtPx6vx__FrwhAUh5c"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Database schema setup...")
print("Note: This script assumes you have admin access to add columns via Supabase UI or migrations")
print("\nRequired columns for faculty table:")
print("  - id (UUID, primary key) ✓ Exists")
print("  - name (text)")
print("  - designation (text)")
print("  - department (text)")
print("  - campus (text) - ADD THIS")
print("  - university (text) - ADD THIS")
print("\nTo add these columns via Supabase UI:")
print("1. Go to https://app.supabase.com/")
print("2. Open your project")
print("3. Go to SQL Editor")
print("4. Run this SQL:")
print("""
ALTER TABLE faculty
ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'FAST-NUCES',
ADD COLUMN IF NOT EXISTS university TEXT DEFAULT 'FAST-NUCES';
""")
print("\nOr if columns already exist, clear old data with:")
print("""
DELETE FROM faculty WHERE designation = 'Instructor';
""")
