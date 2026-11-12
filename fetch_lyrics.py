import json
import re
import urllib.request
import urllib.parse
import time
import os

SONGS_JS_PATH = r"C:\Users\USER\.gemini\antigravity\scratch\tate-mcrae-player\js\songs.js"

with open(SONGS_JS_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Pattern for placeholder lyrics
placeholder_pattern = "Every memory running through my head"

# Find all songs in songs.js
song_matches = list(re.finditer(r'{\s*"id":\s*"([^"]+)",\s*"title":\s*"([^"]+)",\s*"artist":\s*"([^"]+)",.*?"lyrics":\s*"([^"]+)"', content, re.DOTALL))

print(f"Total songs detected: {len(song_matches)}")

updated_count = 0
not_found_list = []

for m in song_matches:
    song_id = m.group(1)
    song_title = m.group(2)
    current_lyrics = m.group(4)

    # Check if this song has placeholder lyrics
    if placeholder_pattern in current_lyrics:
        print(f"Fetching real lyrics for: {song_title} (id: {song_id})...")
        artist = "Tate McRae"
        # Special artist handling
        clean_title = re.sub(r'\(.*?\)', '', song_title).strip()
        
        encoded_artist = urllib.parse.quote(artist)
        encoded_title = urllib.parse.quote(clean_title)
        url = f"https://api.lyrics.ovh/v1/{encoded_artist}/{encoded_title}"

        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                real_lyrics = data.get("lyrics", "").strip()

                if real_lyrics and len(real_lyrics) > 50:
                    # Clean and escape lyrics for JS string
                    escaped = real_lyrics.replace("\\", "\\\\").replace('"', '\\"').replace("\r\n", "\\n").replace("\n", "\\n")
                    
                    # Target replacement: find the exact "lyrics": "..." for this song
                    # Search specifically for this song block
                    block_regex = rf'("id":\s*"{song_id}".*?"lyrics":\s*")[^"]+(")'
                    content = re.sub(block_regex, rf'\g<1>{escaped}\2', content, flags=re.DOTALL)
                    print(f"  -> SUCCESS: Updated {song_title}")
                    updated_count += 1
                else:
                    print(f"  -> Empty lyrics from API for {song_title}")
                    not_found_list.append(song_title)
        except Exception as e:
            print(f"  -> API error for {song_title}: {e}")
            not_found_list.append(song_title)

        time.sleep(0.3)

with open(SONGS_JS_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nDone! Successfully updated {updated_count} songs with real lyrics.")
if not_found_list:
    print(f"Not found ({len(not_found_list)}): {', '.join(not_found_list)}")
