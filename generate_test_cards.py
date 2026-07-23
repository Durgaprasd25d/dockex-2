import os
import subprocess

os.makedirs('test_cards', exist_ok=True)

cards = [
    {
        "filename": "card_1_dl_delhi.svg",
        "title": "DRIVING LICENCE",
        "header_bg": "#1e3a8a",
        "card_bg": "#f8fafc",
        "border": "#2563eb",
        "type": "DL",
        "lines": [
            ("DL No:", "DL-1420110012345"),
            ("Name:", "RAJESH KUMAR"),
            ("Son of:", "SURESH KUMAR"),
            ("DOB:", "12-05-1992"),
            ("Blood Group:", "O+")
        ]
    },
    {
        "filename": "card_2_dl_mumbai.svg",
        "title": "MAHARASHTRA DRIVING LICENCE",
        "header_bg": "#065f46",
        "card_bg": "#f0fdf4",
        "border": "#059669",
        "type": "DL",
        "lines": [
            ("DL No:", "MH-0220190054321"),
            ("Name:", "ANITA SHARMA"),
            ("Daughter of:", "RAMESH SHARMA"),
            ("DOB:", "25-11-1995"),
            ("Blood Group:", "B+")
        ]
    },
    {
        "filename": "card_3_rc_odisha.svg",
        "title": "REGISTRATION CERTIFICATE",
        "header_bg": "#7c2d12",
        "card_bg": "#fff7ed",
        "border": "#ea580c",
        "type": "RC",
        "lines": [
            ("Registration No:", "OD02AB1234"),
            ("Owner Name:", "AMIT PATEL"),
            ("Engine No:", "ENG987654321"),
            ("Chassis No:", "CHS123456789")
        ]
    },
    {
        "filename": "card_4_rc_karnataka.svg",
        "title": "VEHICLE RC KARNATAKA",
        "header_bg": "#4c1d95",
        "card_bg": "#faf5ff",
        "border": "#7c3aed",
        "type": "RC",
        "lines": [
            ("Registration No:", "KA01XY9999"),
            ("Owner Name:", "PRIYA VERMA"),
            ("Engine No:", "ENG555444333"),
            ("Chassis No:", "CHS999888777")
        ]
    },
    {
        "filename": "card_5_aadhaar.svg",
        "title": "Government of India",
        "subtitle": "AADHAAR - SAMPLE TEST CARD",
        "header_bg": "#991b1b",
        "card_bg": "#fef2f2",
        "border": "#dc2626",
        "type": "AADHAAR",
        "lines": [
            ("Name:", "SUNIL GUPTA"),
            ("DOB:", "01/01/1988"),
            ("Gender:", "Male"),
            ("Aadhaar Number:", "5489 2154 9876")
        ]
    },
    {
        "filename": "card_6_pan.svg",
        "title": "INCOME TAX DEPARTMENT",
        "subtitle": "PERMANENT ACCOUNT NUMBER CARD",
        "header_bg": "#1e40af",
        "card_bg": "#eff6ff",
        "border": "#3b82f6",
        "type": "PAN",
        "lines": [
            ("PAN Number:", "ABCDE1234F"),
            ("Name:", "VIKRAM SINGH"),
            ("Father Name:", "KALYAN SINGH"),
            ("DOB:", "14/07/1985")
        ]
    }
]

for card in cards:
    path = os.path.join('test_cards', card['filename'])
    subtitle_html = f'<text x="40" y="70" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#ffffff" font-weight="normal">{card.get("subtitle", "")}</text>' if 'subtitle' in card else ''
    
    y_start = 130 if 'subtitle' in card else 115
    line_elements = []
    for idx, (label, val) in enumerate(card['lines']):
        curr_y = y_start + (idx * 45)
        line_elements.append(
            f'<text x="40" y="{curr_y}" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="bold" fill="#333333">{label}</text>'
            f'<text x="240" y="{curr_y}" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="bold" fill="#111827">{val}</text>'
        )
    
    lines_str = "\n  ".join(line_elements)
    
    svg_content = f'''<svg width="750" height="420" xmlns="http://www.w3.org/2000/svg">
  <rect width="750" height="420" rx="20" ry="20" fill="{card['card_bg']}" stroke="{card['border']}" stroke-width="4"/>
  <rect width="750" height="90" rx="20" ry="20" fill="{card['header_bg']}"/>
  <rect width="750" height="20" y="70" fill="{card['header_bg']}"/>
  <text x="40" y="45" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">{card['title']}</text>
  {subtitle_html}
  {lines_str}
  <rect x="560" y="110" width="150" height="180" rx="10" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
  <text x="595" y="205" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#64748b">PHOTO</text>
  <text x="40" y="390" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#94a3b8">SAMPLE TEST CARD FOR OCR PIPELINE</text>
</svg>'''
    
    with open(path, 'w') as f:
        f.write(svg_content)

print("Generated 6 SVG cards in test_cards/")
