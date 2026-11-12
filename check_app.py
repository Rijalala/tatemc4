with open(r'C:\Users\USER\.gemini\antigravity\scratch\tate-mcrae-player\js\app.js', 'r', encoding='utf-8') as f:
    code = f.read()

import re
# check for syntax anomalies
print("Checking for common errors in app.js...")
print("Total lines:", len(code.splitlines()))
