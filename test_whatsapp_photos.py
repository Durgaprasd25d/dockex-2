import os
import glob
import json
import subprocess

FOLDER_PATH = "/Users/mindbrain/Downloads/WhatsApp Unknown 2026-07-23 at 23.44.49"
LOCAL_URL = "http://localhost:5000/api/upload"
VERCEL_URL = "https://dockex-2-9kaz.vercel.app/api/upload"

images = sorted(glob.glob(os.path.join(FOLDER_PATH, "*.jpeg"))) + sorted(glob.glob(os.path.join(FOLDER_PATH, "*.jpg"))) + sorted(glob.glob(os.path.join(FOLDER_PATH, "*.png")))

print("=" * 90)
print(f"FOUND {len(images)} WHATSAPP IMAGES TO TEST")
print("=" * 90)

for idx, img_path in enumerate(images, 1):
    img_name = os.path.basename(img_path)
    print(f"\n" + "#" * 90)
    print(f"IMAGE #{idx}: {img_name}")
    print("#" * 90)

    # 1. Test Local API
    print(f"\n--- TESTING LOCAL API ({LOCAL_URL}) ---")
    cmd_local = [
        "curl", "-s", "-X", "POST",
        "-F", f"image=@{img_path}",
        LOCAL_URL
    ]
    res_local = subprocess.run(cmd_local, capture_output=True, text=True)
    try:
        data_local = json.loads(res_local.stdout)
        print("Detected Type:", data_local.get("detectedType"))
        print("[EXTRACTED DATA]:", json.dumps(data_local.get("data"), indent=2))
        print("[RAW TEXT]:")
        raw = data_local.get("text", "").strip()
        print("  " + raw.replace("\n", "\n  "))
    except Exception as e:
        print("Local Response Error:", res_local.stdout, e)

    # 2. Test Vercel API
    print(f"\n--- TESTING VERCEL DEPLOYED API ({VERCEL_URL}) ---")
    cmd_vercel = [
        "curl", "-s", "-X", "POST",
        "-F", f"image=@{img_path}",
        VERCEL_URL
    ]
    res_vercel = subprocess.run(cmd_vercel, capture_output=True, text=True)
    try:
        data_vercel = json.loads(res_vercel.stdout)
        print("Detected Type:", data_vercel.get("detectedType"))
        print("[EXTRACTED DATA]:", json.dumps(data_vercel.get("data"), indent=2))
    except Exception as e:
        print("Vercel Response Error:", res_vercel.stdout[:300], e)

print("\n" + "=" * 90)
print("TESTING COMPLETED FOR ALL WHATSAPP IMAGES")
print("=" * 90)
