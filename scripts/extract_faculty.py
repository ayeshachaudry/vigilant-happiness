import requests
from bs4 import BeautifulSoup
from supabase import create_client

# ================= CONFIG =================
SUPABASE_URL = "https://clezlbmuxxodgytorlrf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpsYm11eHhvZGd5dG9ybHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTQ3NzUsImV4cCI6MjA4NTI5MDc3NX0.jIxtUwgfc1PGC1YuMezgQMn79JtPx6vx__FrwhAUh5c"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

departments = {
    "Computer Science": "https://isb.nu.edu.pk/Academics/Faculty-DCS.php",
    "Cyber Security": "https://isb.nu.edu.pk/Academics/Faculty-DSC.php",
    "Artificial Intelligence": "https://isb.nu.edu.pk/Academics/Faculty-AI.php",
    "Data Science": "https://isb.nu.edu.pk/Academics/Faculty-DS.php",
    "Software Engineering": "https://isb.nu.edu.pk/Academics/Faculty-SE.php",
    "Electrical Engineering": "https://isb.nu.edu.pk/Academics/Faculty-EE.php",
    "Management Sciences": "https://isb.nu.edu.pk/Academics/Faculty-MS.php",
}

total = 0

for dept, url in departments.items():
    print(f"\n📘 Fetching {dept}")
    res = requests.get(url, timeout=20)
    soup = BeautifulSoup(res.text, "html.parser")

    names = soup.find_all("h4")

    if not names:
        print("❌ No faculty names found")
        continue

    for h4 in names:
        name = h4.text.strip()

        if len(name) < 4:
            continue

        parent = h4.parent
        designation = None

        # try finding designation nearby
        for tag in parent.find_all(["p", "span"]):
            text = tag.text.strip()
            if "Professor" in text or "Lecturer" in text or "Instructor" in text:
                designation = text
                break

        if not designation:
            designation = "Faculty Member"

        data = {
            "name": name.replace("Dr.", "").strip(),
            "designation": designation,
            "department": dept
        }

        supabase.table("faculty").insert(data).execute()
        total += 1

print(f"\n✅ TOTAL INSERTED: {total} FACULTY MEMBERS")