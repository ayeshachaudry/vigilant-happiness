#!/usr/bin/env python3
"""
Load ALL instructors from faculty_data.txt to Supabase
Includes university and campus information
"""

from supabase import create_client, Client
import time
import os

# Read Supabase credentials from environment variables. Do NOT commit keys.
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("Supabase credentials not found. Set SUPABASE_URL and SUPABASE_KEY environment variables before running this script.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# All 32 instructors with campus/university info
instructors = [
    # FAST-NUCES, Chiniot-Faisalabad
    {'name': 'Mr. Muhammad Talha Arif', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Chiniot-Faisalabad', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Hassnin', 'designation': 'Instructor', 'department': 'Sciences and Humanities', 'campus': 'Chiniot-Faisalabad', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Usama Ashfaq', 'designation': 'Instructor', 'department': 'Sciences and Humanities', 'campus': 'Chiniot-Faisalabad', 'university': 'FAST-NUCES'},
    
    # FAST-NUCES, Lahore
    {'name': 'Mr. Agib Zeeshan', 'designation': 'Instructor', 'department': 'Artificial Intelligence and Data Science', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Ahmad Jawad Murtasim', 'designation': 'Instructor', 'department': 'Cyber Security', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Amina Qaiser', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Durraze Waseem', 'designation': 'Instructor', 'department': 'Software Engineering', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Eisha Khan', 'designation': 'Instructor', 'department': 'Artificial Intelligence and Data Science', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Amir Iqbal', 'designation': 'Instructor', 'department': 'Software Engineering', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Faheem', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Hasan', 'designation': 'Instructor', 'department': 'Software Engineering', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Hashir Mohsineen', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Kamran', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Ms. Alishba Nisar', 'designation': 'Instructor', 'department': 'Accounting and Finance', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Ms. Attiqa Sohail', 'designation': 'Instructor', 'department': 'Accounting and Finance', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Ms. Fatima Zeb', 'designation': 'Instructor', 'department': 'Accounting and Finance', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Ms. Sadia Manzoor', 'designation': 'Instructor', 'department': 'Management Sciences', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Ms. Sukhan Amir', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Ms. Syeda Fatima Naqvi', 'designation': 'Instructor', 'department': 'Management Sciences', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Ms. Zohla Waheed', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    {'name': 'Syeda Fatima Jaffery', 'designation': 'Instructor', 'department': 'Accounting and Finance', 'campus': 'Lahore', 'university': 'FAST-NUCES'},
    
    # FAST-NUCES, Peshawar
    {'name': 'Mr. Hamza Raziq Khan', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Mehdi', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Saad Khan', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Saad Rashad', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Muhammad Saood Sarwar', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Sajid Ahmad', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Shahzad Hassan', 'designation': 'Instructor', 'department': 'Sciences and Humanities', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Yasir Arfat', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
    {'name': 'Mr. Zakria Bacha', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
    {'name': 'Ms. Iqra Rehman', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
    {'name': 'Syed Behram Shah', 'designation': 'Instructor', 'department': 'Computer Science', 'campus': 'Peshawar', 'university': 'FAST-NUCES'},
]

print("Clearing old data from database...\n")

try:
    response = supabase.table('faculty').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    print("Database cleared.\n")
except Exception as e:
    print(f"Note: {str(e)[:60]}\n")

print(f"Loading {len(instructors)} instructors from FAST-NUCES...\n")

successful = 0
failed = 0

for i, instr in enumerate(instructors, 1):
    try:
        response = supabase.table('faculty').insert({
            'name': instr['name'],
            'designation': instr['designation'],
            'department': instr['department'],
            'campus': instr['campus'],
            'university': instr['university']
        }).execute()
        successful += 1
        print(f"[{i:2d}] OK - {instr['name']} ({instr['campus']})")
    except Exception as e:
        failed += 1
        print(f"[{i:2d}] ERROR - {instr['name']}: {str(e)[:40]}")
    
    time.sleep(0.2)

print(f"\n{'='*50}")
print(f"Result: {successful} loaded, {failed} failed")
print(f"Total instructors in database: {successful}")
