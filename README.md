# 🎵 TATE McRAE // Music Vault & Player

Aplikasi web modern pemutar musik lengkap khusus katalog **Tate McRae** dengan audio preview 30 detik resmi berformat MP3 studio, pemutaran Full Song otomatis dari repositori, kontrol tempo dinamis (Slowed / Sped Up), lirik lengkap, track unreleased favorit **"Hard"** & **"Call my bluff"**, 1 album full **"THINK LATER"**, 1 album full **"So Close To What (Deluxe)"**, serta single terbaru **"Housewife"** dan **"Just Keep Watching"**!

Aplikasi ini dibuat murni menggunakan teknologi web modern (HTML5 / CSS3 / Vanilla JavaScript) dan **siap di-deploy ke Vercel via GitHub** tanpa konfigurasi build rumit. 🚀

---

## ✨ Fitur & Koleksi Musik

1. **Koleksi Musik Lengkap (42 Lagu)**:
   - 🔥 **Unreleased Gems**: *Hard*, *Call my bluff*.
   - ✨ **Singles**: *Housewife*, *Just Keep Watching* (F1 The Album).
   - 💿 **Full Album "THINK LATER" (14 Lagu)**: *greedy*, *exes*, *run for the hills*, *cut my hair*, *hurt my feelings*, *grave*, *stay done*, *we're not alike*, *calgary*, *messier*, *think later*, *guilty conscience*, *want that too*, *plastic palm trees*.
   - 💿 **Full Album "So Close To What (Deluxe)" (20 Lagu)**: *It's ok I'm ok*, *2 hands*, *Sports car*, *Miss possessive*, *Dear god*, *Purple lace bra*, *No I'm not in love*, *Siren sounds*, *Revolving door*, *bloodonmyhands*, *I know love*, *Nostalgia*, *Greenlight*, *Signs*, *Like I do*, *NOBODY'S GIRL*, *TIT FOR TAT*, *TRYING ON SHOES*, *ANYTHING BUT LOVE*, *HORSESHOE*.
   - 💎 **Classics**: *you broke me first*, *she's all i wanna be*, *10:35*, *rubberband*.

2. **Sistem Cover Cerdas (Preferensi Foto Sendiri)**:
   - **Prioritas Utama**: Jika kamu meletakkan foto sendiri di folder `covers/` (misalnya `covers/greedy.jpg` atau `covers/housewife.png`), web akan **langsung memprioritaskan dan menampilkan foto tersebut**!
   - **Fallback Otomatis**: Jika belum menambahkan foto, web menggunakan cover official bawaan album.
   - **Kembali Otomatis Jika Dihapus**: Jika foto kamu di folder `covers/` dihapus, setelah di-refresh web akan **otomatis kembali menampilkan cover bawaan album** tanpa error!
   - **Anti-Cache**: Mendukung reload instan tanpa tertahan cache browser.

3. **Dual Playback (Full Song vs Preview Fallback)**:
   - Jika kamu menaruh file `.mp3` full di folder `audio/`, web otomatis memutar **versi Full Song**.
   - Jika belum ada, web memutar **studio preview 30 detik resmi** yang sudah tersedia di folder `audio/previews/`.

4. **Speed Controller (Slowed & Sped Up)**:
   - Atur kecepatan tempo audio dari `0.5x` hingga `2.0x`.
   - Preset instan: `0.8x (Slowed)`, `1.0x (Normal)`, `1.25x (Sped Up)`, dan `1.5x (Nightcore)`.

5. **Lirik Lengkap Interaktif**:
   - Menampilkan lirik lengkap per bait untuk semua 42 lagu.
   - Tombol sekali klik untuk menyalin lirik ke clipboard.
   - Shortcut keyboard `L` untuk membuka drawer lirik.

---

## 📋 Daftar Nama File di Folder Repo (`audio/` & `covers/`)

Kamu cukup menamai file kamu sesuai dengan ID lagu di bawah ini:

| Judul Lagu | Nama File MP3 (di `audio/`) | Nama File Cover (di `covers/`) |
| :--- | :--- | :--- |
| **Hard** | `audio/hard.mp3` | `covers/hard.jpg` |
| **Call my bluff** | `audio/call-my-bluff.mp3` | `covers/call-my-bluff.jpg` |
| **Housewife** | `audio/housewife.mp3` | `covers/housewife.jpg` |
| **Just Keep Watching** | `audio/just-keep-watching.mp3` | `covers/just-keep-watching.jpg` |
| **greedy** | `audio/greedy.mp3` | `covers/greedy.jpg` |
| **exes** | `audio/exes.mp3` | `covers/exes.jpg` |
| **run for the hills** | `audio/run-for-the-hills.mp3` | `covers/run-for-the-hills.jpg` |
| **cut my hair** | `audio/cut-my-hair.mp3` | `covers/cut-my-hair.jpg` |
| **It's ok I'm ok** | `audio/its-ok-im-ok.mp3` | `covers/its-ok-im-ok.jpg` |
| **2 hands** | `audio/2-hands.mp3` | `covers/2-hands.jpg` |
| **Sports car** | `audio/sports-car.mp3` | `covers/sports-car.jpg` |
| *(dan 31 lagu lainnya)* | *(lihat tombol "Daftar File Lagu" di web)* | *(format .jpg, .png, .jpeg, .webp didukung)* |

---

## 🚀 Cara Menjalankan & Deploy

### Jalankan Lokal:
```bash
cd tate-mcrae-player
python -m http.server 8000
```
Buka `http://localhost:8000` di browsermu.

### Deploy ke Vercel via GitHub:
```bash
git init
git add .
git commit -m "feat: Add THINK LATER and So Close To What Deluxe full albums"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```
Lalu hubungkan repository tersebut di dashboard [vercel.com](https://vercel.com) dan klik **Deploy**!
