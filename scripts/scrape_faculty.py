import requests
from bs4 import BeautifulSoup
from supabase import create_client
import time

# Supabase config
SUPABASE_URL = "https://clezlbmuxxodgytorlrf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpsYm11eHhvZGd5dG9ybHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTQ3NzUsImV4cCI6MjA4NTI5MDc3NX0.jIxtUwgfc1PGC1YuMezgQMn79JtPx6vx__FrwhAUh5c"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

HEADERS = {"User-Agent": "Mozilla/5.0"}

def fetch_isb_faculty():
    url = "https://isb.nu.edu.pk/Faculty/allfaculty"
    r = requests.get(url, headers=HEADERS, timeout=15)
    soup = BeautifulSoup(r.text, "html.parser")

    facs = []
    for card in soup.select("selector_for_faculty_cards_here"):
        name = card.select_one("h4, .name_class").get_text(strip=True)
        dept = "" # extract from context
        desig = "" # extract if present
        image = card.select_one("img")
        image_url = image["src"] if image else ""
        facs.append((name, dept, desig, image_url))
    return facs

def fetch_lahore_faculty():
    base = "https://lhr.nu.edu.pk"
    url = "https://lhr.nu.edu.pk/fsm/faculty/"
    r = requests.get(url, headers=HEADERS, timeout=15)
    soup = BeautifulSoup(r.text, "html.parser")

    facs = []
    for name_tag in soup.select("h5"):
        name = name_tag.get_text(strip=True)
        # For each, try follow detail page
        profile_link = name_tag.find_next("a")
        image_url = ""
        if profile_link:
            prof = requests.get(base + profile_link["href"], headers=HEADERS)
            ps = BeautifulSoup(prof.text, "html.parser")
            img_tag = ps.select_one("img")
            if img_tag:
                image_url = img_tag["src"]
        facs.append((name, "", "", image_url))
        time.sleep(1)
    return facs

def save_faculty(fac_list):
    for name, dept, desig, img in fac_list:
        # upload image
        img_url_final = ""
        if img:
            resp = requests.get(img, headers=HEADERS)
            if resp.status_code == 200:
                file_path = f"faculty-images/{name.replace(' ', '_')}.jpg"
                supabase.storage.from_("faculty-images").upload(file_path, resp.content)
                img_url_final = f"{SUPABASE_URL}/storage/v1/object/public/faculty-images/{file_path}"

        supabase.from_("faculty").insert({
            "name": name,
            "department": dept,
            "designation": desig,
            "image_url": img_url_final
        }).execute()

if __name__ == "__main__":
    all_facs = []
    all_facs += fetch_isb_faculty()
    all_facs += fetch_lahore_faculty()
    save_faculty(all_facs)
