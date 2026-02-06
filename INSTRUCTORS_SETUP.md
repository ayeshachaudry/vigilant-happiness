# Complete Setup Guide for Faculty Instructors

## Quick Start (3 steps)

### Step 1: Prepare Database Schema
1. Go to https://app.supabase.com/ and sign in
2. Open the `faculty-review` project
3. Click "SQL Editor" in the left sidebar
4. Run this SQL to add missing columns:

```sql
ALTER TABLE faculty
ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'LAHORE',
ADD COLUMN IF NOT EXISTS university TEXT DEFAULT 'FAST-NUCES';

-- Clear old instructor data
DELETE FROM faculty WHERE designation = 'Instructor';
```

5. Click "Run"

### Step 2: Load All Instructors
In your terminal (from project root), run:

```bash
python scripts/load_all_instructors.py
```

You should see output showing 32 instructors being loaded from 3 campuses:
- Chiniot-Faisalabad: 3 instructors
- Lahore: 18 instructors  
- Peshawar: 11 instructors

### Step 3: View on Website
1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000/instructors
3. You should see:
   - University selector (FAST-NUCES)
   - Campus tabs (All, Chiniot-Faisalabad, Lahore, Peshawar)
   - Instructor cards grouped by campus and department

---

## Data Structure

### Columns in `faculty` table:
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Instructor name |
| designation | TEXT | Should be "Instructor" |
| department | TEXT | Department name |
| campus | TEXT | Campus location (new) |
| university | TEXT | University name (new) |

### Data Format:
All 32 instructors belong to FAST-NUCES university across 3 campuses:

```
FAST-NUCES
├── Chiniot-Faisalabad (3 instructors)
├── Lahore (18 instructors)
└── Peshawar (11 instructors)
```

---

## Troubleshooting

### Issue: "No instructors found" on website
**Solution:** Run the load script in step 2 again
```bash
python scripts/load_all_instructors.py
```

### Issue: Python script won't run
**Solution:** Set up venv and install dependencies
```bash
# Create virtual environment (if not exists)
python -m venv .venv

# Activate it
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install supabase
```

### Issue: ModuleNotFoundError: No module named 'supabase'
**Solution:** Install the package
```bash
pip install supabase
```

### Issue: "columns campus and university don't exist" error
**Solution:** Add them via Supabase SQL Editor (Step 1 above)

---

## File Overview

| File | Purpose |
|------|---------|
| `scripts/load_all_instructors.py` | Load 32 instructors with campus data to Supabase |
| `components/InstructorsHierarchy.tsx` | Display instructors with University > Campus > Department hierarchy |
| `app/instructors/page.tsx` | /instructors route |
| `lib/supabase.ts` | Supabase client configuration |

---

## Component Architecture

The `InstructorsHierarchy` component provides:
- **University selector** - Filter by university (currently just FAST-NUCES)
- **Campus tabs** - Switch between campuses with instructor count badges
- **Department grid** - Display unique departments per campus  
- **Instructor cards** - Show instructor details with hover effects

Data is fetched client-side from Supabase with filters applied based on selections.

---

## Next Steps

After completing the 3 quick start steps:

1. ✅ Verify database has campus/university columns
2. ✅ Run the load script
3. ✅ Check website shows all instructors
4. ✅ Test campus switching
5. Optional: Add more instructors from other universities (modify load script)
