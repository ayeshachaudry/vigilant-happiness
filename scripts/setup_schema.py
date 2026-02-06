#!/usr/bin/env python3
"""
Add campus and university columns to faculty table if they don't exist
"""

from supabase import create_client, Client
import os

# Read Supabase credentials from environment variables. Do NOT commit keys.
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
	raise SystemExit("Supabase credentials not found. Set SUPABASE_URL and SUPABASE_KEY environment variables before running this script.")

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
