import re
import json

path = r"C:\Users\USER\.gemini\antigravity\scratch\tate-mcrae-player\js\songs.js"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Match each song object
# We know the structure:
# {
#    "id": "...",
#    ...
#    "lyrics": "..."
# }

pattern = re.compile(r'(\{\s*"id":\s*"[^"]+",.*?"lyrics":\s*")(.*?)("\s*[\r\n]+\s*\})', re.DOTALL)

def replacer(match):
    prefix = match.group(1)
    raw_lyrics = match.group(2)
    suffix = match.group(3)
    
    # In raw_lyrics, replace real literal newlines (\r\n or \n) with string '\n'
    # First unescape existing \n to avoid \\n mess, then split lines
    normalized = raw_lyrics.replace('\\n', '\n').replace('\\r', '')
    lines = normalized.split('\n')
    
    # Escape quotes inside lines
    clean_lines = []
    for line in lines:
        # replace unescaped quotes
        line = line.replace('\\"', '"').replace('"', '\\"')
        clean_lines.append(line)
        
    escaped_lyrics = '\\n'.join(clean_lines)
    return prefix + escaped_lyrics + suffix

new_text = pattern.sub(replacer, text)

# Test validity of JSON part
json_part = new_text[new_text.find('['):new_text.rfind(']')+1]
try:
    parsed = json.loads(json_part)
    print(f"SUCCESS! Valid JSON with {len(parsed)} songs.")
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_text)
    print("songs.js overwritten successfully.")
except Exception as e:
    print("FAILED JSON parsing:", e)
