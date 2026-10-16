"""Download optimized WebP copies of livestock images for local hosting."""
import os
import urllib.request

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images")
OUT_DIR = os.path.normpath(OUT_DIR)
os.makedirs(OUT_DIR, exist_ok=True)

TARGETS = {
    "signin-herd-1280.webp": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=70&w=1280&auto=format&fit=crop&fm=webp",
    "farmer-cattle-800.webp": "https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=70&w=800&auto=format&fit=crop&fm=webp",
    "smallstock-800.webp": "https://images.unsplash.com/photo-1484557985045-edf25e08da73?q=70&w=800&auto=format&fit=crop&fm=webp",
}

for filename, url in TARGETS.items():
    dest = os.path.join(OUT_DIR, filename)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 VetAlertZimbabwe build script"})
    with urllib.request.urlopen(req, timeout=60) as resp, open(dest, "wb") as fh:
        data = resp.read()
        fh.write(data)
    size_kb = os.path.getsize(dest) / 1024
    print(f"{filename}: {size_kb:.1f} KB from {url[:60]}...")
print("DONE dir=" + OUT_DIR)
