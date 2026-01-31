import requests

url = "https://isb.nu.edu.pk/Academics/Faculty-DSC.php"
r = requests.get(url)

with open("cyber.html", "w", encoding="utf-8") as f:
    f.write(r.text)

print("Saved cyber.html")
