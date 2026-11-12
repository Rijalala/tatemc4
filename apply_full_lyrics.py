import json
import re

SONGS_PATH = r"C:\Users\USER\.gemini\antigravity\scratch\tate-mcrae-player\js\songs.js"
OVH_PATH = r"C:\Users\USER\.gemini\antigravity\scratch\tate-mcrae-player\ovh_results.json"

with open(OVH_PATH, "r", encoding="utf-8") as f:
    ovh_data = json.load(f)

with open(SONGS_PATH, "r", encoding="utf-8") as f:
    text = f.read()

data = json.loads(text[text.find('['):text.rfind(']')+1])

print(f"Total songs in data: {len(data)}")
print(f"Total songs to update from ovh: {len(ovh_data)}")

updated_count = 0
for song in data:
    sid = song["id"]
    if sid in ovh_data:
        new_lyrics = ovh_data[sid].strip()
        # Ensure clean formatting
        song["lyrics"] = new_lyrics
        updated_count += 1
        print(f"Updated full lyrics for: {song['title']} ({len(new_lyrics)} chars)")

# Re-serialize to songs.js format
new_json_str = json.dumps(data, ensure_ascii=False, indent=2)
new_file_content = f"// Tate McRae Track Catalog\n// All 42 Tracks with 100% Full Uncut Lyrics & Bundled Previews\n\nconst SONGS_DATA = {new_json_str};\n"

with open(SONGS_PATH, "w", encoding="utf-8") as f:
    f.write(new_file_content)

print(f"\nSUCCESS! Updated {updated_count} songs with full lyrics.")
