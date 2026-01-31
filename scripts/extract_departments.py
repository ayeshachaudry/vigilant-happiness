from pdf2image import convert_from_path
import pytesseract
import re

PDF_PATH = "../ISB Faculty.pdf"

print("📄 Converting PDF to images...")
pages = convert_from_path(PDF_PATH, dpi=300)

departments = set()

print("🔍 Running OCR...")

for i, page in enumerate(pages):
    text = pytesseract.image_to_string(page)

    lines = text.split("\n")
    for line in lines:
        line = line.strip()

        # Department pattern (PDF ke mutabiq)
        if re.match(r"Department of", line):
            dept = line.replace("Department of", "").strip()
            if len(dept) > 3:
                departments.add(dept)

print("\n✅ DEPARTMENTS FOUND:\n")

for d in sorted(departments):
    print("-", d)

print(f"\n📊 TOTAL DEPARTMENTS: {len(departments)}")
