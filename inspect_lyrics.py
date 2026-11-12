import json

with open(r"C:\Users\USER\.gemini\antigravity\scratch\tate-mcrae-player\js\songs.js", "r", encoding="utf-8") as f:
    text = f.read()

data = json.loads(text[text.find('['):text.rfind(']')+1])
print(f"Total songs: {len(data)}")

short_songs = []
for s in data:
    lyrics = s.get("lyrics", "")
    lines = [l for l in lyrics.split("\n") if l.strip() and not l.startswith("[")]
    # print all song stats
    print(f"[{s['id']}] {s['title']}: {len(lines)} lines, {len(lyrics)} chars")
    if len(lines) < 22:
        short_songs.append(s)

print(f"\nSongs needing expansion/verification ({len(short_songs)}):")
for s in short_songs:
    print(f"  - {s['id']}: {s['title']} ({len(s['lyrics'].splitlines())} lines)")
