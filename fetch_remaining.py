import urllib.request
import urllib.parse
import json
import time

songs_to_query = [
    ("housewife", "Tate McRae", "Housewife"),
    ("just-keep-watching", "Tate McRae", "Just Keep Watching"),
    ("cut-my-hair", "Tate McRae", "cut my hair"),
    ("greedy", "Tate McRae", "greedy"),
    ("run-for-the-hills", "Tate McRae", "run for the hills"),
    ("exes", "Tate McRae", "exes"),
    ("think-later", "Tate McRae", "think later"),
    ("guilty-conscience", "Tate McRae", "guilty conscience"),
    ("miss-possessive", "Tate McRae", "Miss possessive"),
    ("its-ok-im-ok", "Tate McRae", "It's ok I'm ok"),
    ("2-hands", "Tate McRae", "2 hands"),
    ("sports-car", "Tate McRae", "Sports car"),
    ("dear-god", "Tate McRae", "Dear god"),
    ("purple-lace-bra", "Tate McRae", "Purple lace bra"),
    ("nobodys-girl", "Tate McRae", "Nobody's girl"),
    ("you-broke-me-first", "Tate McRae", "you broke me first"),
    ("shes-all-i-wanna-be", "Tate McRae", "she's all i wanna be")
]

results = {}

for song_id, artist, title in songs_to_query:
    enc_artist = urllib.parse.quote(artist)
    enc_title = urllib.parse.quote(title)
    url = f"https://api.lyrics.ovh/v1/{enc_artist}/{enc_title}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as r:
            d = json.loads(r.read().decode("utf-8"))
            lyrics = d.get("lyrics", "").strip()
            if lyrics and len(lyrics) > 100:
                results[song_id] = lyrics
                print(f"[OK] {title}: {len(lyrics)} chars")
            else:
                print(f"[NO LYRICS] {title}")
    except Exception as e:
        print(f"[ERR] {title}: {e}")
    time.sleep(0.3)

with open(r"C:\Users\USER\.gemini\antigravity\scratch\tate-mcrae-player\ovh_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nTotal fetched from API: {len(results)}/{len(songs_to_query)}")
