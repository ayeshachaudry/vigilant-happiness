#!/usr/bin/env python3
"""
Upload ALL faculty data from faculty_data.txt to Supabase
Includes all designations (HOD, Professor, Associate Professor, etc.)
"""

from supabase import create_client, Client
import time

SUPABASE_URL = "https://clezlbmuxxodgytorlrf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpsYm11eHhvZGd5dG9ybHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTQ3NzUsImV4cCI6MjA4NTI5MDc3NX0.jIxtUwgfc1PGC1YuMezgQMn79JtPx6vx__FrwhAUh5c"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def parse_faculty_data(filename):
    """Parse faculty_data.txt and return list of faculty"""
    faculty_list = []
    
    with open(filename, 'r', encoding='utf-8') as f:
        current_university = None
        current_campus = None
        current_department = None
        
        for line in f:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Parse University
            if line.startswith('University :'):
                current_university = line.replace('University :', '').strip()
                continue
            
            # Parse Campus
            if line.startswith('Campus :'):
                current_campus = line.replace('Campus :', '').strip()
                continue
            
            # Parse Department
            if line.startswith('Department'):
                # Extract department name
                if 'of' in line:
                    current_department = line.split('of', 1)[1].strip()
                else:
                    current_department = line.replace('Department', '').strip()
                continue
            
            # Parse Faculty entry (contains |)
            if '|' in line:
                parts = [p.strip() for p in line.split('|')]
                
                if len(parts) >= 2:
                    name = parts[0]
                    designation = parts[1]
                    
                    # Department could be in parts[2] or from header
                    if len(parts) >= 3:
                        department = parts[2]
                    else:
                        department = current_department or 'General'
                    
                    faculty = {
                        'name': name,
                        'designation': designation,
                        'department': department,
                        'campus': current_campus,
                        'university': current_university
                    }
                    faculty_list.append(faculty)
    
    return faculty_list

print("Parsing faculty_data.txt...")
faculty = parse_faculty_data('faculty_data.txt')

print(f"\nFound {len(faculty)} total faculty members\n")
print(f"Clearing old data from database...\n")

try:
    supabase.table('faculty').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    print("Database cleared.\n")
except Exception as e:
    print(f"Note: {str(e)[:60]}\n")

print(f"Uploading {len(faculty)} faculty to Supabase...\n")

successful = 0
failed = 0
errors = []

for i, fac in enumerate(faculty, 1):
    try:
        response = supabase.table('faculty').insert({
            'name': fac['name'],
            'designation': fac['designation'],
            'department': fac['department'],
            'campus': fac['campus'],
            'university': fac['university']
        }).execute()
        successful += 1
        
        if i % 10 == 0:
            print(f"[{i:3d}] {fac['name'][:40]:<40} {fac['designation']:<25} {fac['campus']}")
    except Exception as e:
        failed += 1
        errors.append((fac['name'], str(e)[:50]))
        if i % 10 == 0:
            print(f"[{i:3d}] ERROR - {fac['name']}")
    
    time.sleep(0.05)

print(f"\n{'='*70}")
print(f"Upload Complete!")
print(f"{'='*70}")
print(f"✅ Successful: {successful}")
print(f"❌ Failed: {failed}")
print(f"Total uploaded to database: {successful}")

# Group by designation and campus
print(f"\n{'='*70}")
print("Summary by Designation:")
print(f"{'='*70}")

designations = {}
for fac in faculty:
    des = fac['designation']
    if des not in designations:
        designations[des] = 0
    designations[des] += 1

for des, count in sorted(designations.items(), key=lambda x: -x[1]):
    print(f"  {des:<30} {count:>3} people")

print(f"\n{'='*70}")
print("Summary by Campus:")
print(f"{'='*70}")

campuses = {}
for fac in faculty:
    cam = fac['campus']
    if cam not in campuses:
        campuses[cam] = 0
    campuses[cam] += 1

for cam, count in sorted(campuses.items(), key=lambda x: -x[1]):
    print(f"  {cam:<30} {count:>3} people")

if errors:
    print(f"\n{'='*70}")
    print(f"First 5 errors:")
    print(f"{'='*70}")
    for name, error in errors[:5]:
        print(f"  {name}: {error}")
