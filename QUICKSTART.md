# ⚡ QUICK START - Faculty Instructors (2 minutes)

## 🚀 Just Do This:

### 1️⃣ Database Setup (1 minute)
Go to: https://app.supabase.com/
- Project: faculty-review
- Go to: SQL Editor
- Copy-paste this and click RUN:

```sql
ALTER TABLE faculty
ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'Lahore',
ADD COLUMN IF NOT EXISTS university TEXT DEFAULT 'FAST-NUCES';

DELETE FROM faculty WHERE designation = 'Instructor';
```

### 2️⃣ Load Instructors (30 seconds)
In VS Code Terminal:
```bash
E:/faculty-review/.venv/Scripts/python.exe scripts/load_all_instructors.py
```

Wait for: `Result: 32 loaded, 0 failed`

### 3️⃣ Test Website (30 seconds)
```bash
npm run dev
```

Open: http://localhost:3000/instructors

---

## ✅ Done!

You should see:
- 📍 Campus tabs (All / Chiniot-Faisalabad / Lahore / Peshawar)
- 👨‍💼 32 instructor cards with green neon styling
- 🎨 Beautiful hover effects

---

## 📚 Need help?

- `SETUP_INSTRUCTIONS.md` - Detailed guide with troubleshooting
- `IMPLEMENTATION_COMPLETE.md` - Full technical summary
- `INSTRUCTORS_SETUP.md` - Step-by-step details

---

**That's it! 🎉**
