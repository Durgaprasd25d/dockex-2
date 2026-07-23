import os
import json
import subprocess

test_cases = [
    {"name": "Driving License (Delhi)", "file": "test_cards/card_1_dl_delhi.svg.png", "type": "DL"},
    {"name": "Driving License (Mumbai)", "file": "test_cards/card_2_dl_mumbai.svg.png", "type": "DL"},
    {"name": "Vehicle RC (Odisha)", "file": "test_cards/card_3_rc_odisha.svg.png", "type": "RC"},
    {"name": "Vehicle RC (Karnataka)", "file": "test_cards/card_4_rc_karnataka.svg.png", "type": "RC"},
    {"name": "Aadhaar Card", "file": "test_cards/card_5_aadhaar.svg.png", "type": "AADHAAR"},
    {"name": "PAN Card", "file": "test_cards/card_6_pan.svg.png", "type": "PAN"},
]

print("=" * 80)
print("             OCR SYSTEM TERMINAL TEST SUITE FOR 6 SAMPLE CARDS             ")
print("=" * 80)

passed = 0
failed = 0

for idx, tc in enumerate(test_cases, 1):
    print(f"\n--- TEST #{idx}: {tc['name']} (Type: {tc['type']}) ---")
    print(f"Uploading file: {tc['file']}")
    
    cmd = [
        "curl", "-s", "-X", "POST",
        "-F", f"image=@{tc['file']}",
        "-F", f"type={tc['type']}",
        "http://localhost:5000/api/upload"
    ]
    
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        try:
            data = json.loads(res.stdout)
            if data.get("success"):
                passed += 1
                print("STATUS: SUCCESS [200 OK]")
                print("Detected Doc Type:", data.get("detectedType"))
                print("\n[EXTRACTED STRUCTURED DATA]:")
                for k, v in data.get("data", {}).items():
                    print(f"  - {k}: {v}")
                print("\n[OCR RAW TEXT SNIPPET]:")
                print("  " + data.get("text", "").replace("\n", "\n  ").strip())
            else:
                failed += 1
                print("STATUS: FAILED")
                print("Error:", data.get("message"))
        except Exception as e:
            failed += 1
            print("STATUS: ERROR PARSING RESPONSE")
            print("Raw response:", res.stdout)
            print("Exception:", e)
    else:
        failed += 1
        print("STATUS: CURL COMMAND FAILED")
        print("Error:", res.stderr)

print("\n" + "=" * 80)
print(f"TEST SUMMARY: TOTAL: {len(test_cases)} | PASSED: {passed} | FAILED: {failed}")
print("=" * 80)
