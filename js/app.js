// Tate McRae Music Vault - Main Application Script
// Designed for reliable audio playback, speed control, lyrics, and repo-level file overrides

(function () {
    'use strict';

    // Unique session timestamp to prevent aggressive browser caching of replaced images/audio
    const SESSION_TIMESTAMP = Date.now();

    // Progress Bar Seeking State (Scrubbing / Forward / Rewind)
    let isSeeking = false;

    // Application State
    const state = {
        songs: [...SONGS_DATA],
        filteredSongs: [...SONGS_DATA],
        currentIndex: 0,
        isPlaying: false,
        playbackRate: 1.0,
        isShuffle: false,
        repeatMode: 'off', // 'off' | 'all' | 'one'
        activeFilter: 'all',
        searchQuery: '',
        activeLyricsSongId: null,
        resolvedMedia: {} // songId -> { audioUrl, isFull, coverUrl, isCustomCover }
    };

    // Native HTML5 Audio Element (Direct output to speakers - 100% sound reliability!)
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = 1.0;

    // DOM Elements Cache
    const el = {
        // Track list & grid
        songsGrid: document.getElementById('songs-grid'),
        trackCount: document.getElementById('track-count'),
        searchInput: document.getElementById('search-input'),
        filterButtons: document.querySelectorAll('.filter-btn'),

        // Now Playing Player Bar
        playerBar: document.getElementById('player-bar'),
        playerThumb: document.getElementById('player-thumb'),
        playerVinyl: document.getElementById('player-vinyl'),
        playerTitle: document.getElementById('player-title'),
        playerArtist: document.getElementById('player-artist'),
        playerSourceBadge: document.getElementById('player-source-badge'),
        playPauseBtn: document.getElementById('play-pause-btn'),
        playPauseIcon: document.getElementById('play-pause-icon'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
        shuffleBtn: document.getElementById('shuffle-btn'),
        repeatBtn: document.getElementById('repeat-btn'),
        progressBar: document.getElementById('progress-bar'),
        progressFill: document.getElementById('progress-fill'),
        progressHandle: document.getElementById('progress-handle'),
        currentTimeText: document.getElementById('current-time'),
        durationText: document.getElementById('duration-time'),
        volumeSlider: document.getElementById('volume-slider'),
        volumeIcon: document.getElementById('volume-icon'),

        // Speed Controller
        speedValueBadge: document.getElementById('speed-value-badge'),
        speedSlider: document.getElementById('speed-slider'),
        speedPresetBtns: document.querySelectorAll('.speed-preset-btn'),
        visualizerCanvas: document.getElementById('visualizer-canvas'),

        // Lyrics Modal
        lyricsModal: document.getElementById('lyrics-modal'),
        lyricsBackdrop: document.getElementById('lyrics-backdrop'),
        lyricsCloseBtn: document.getElementById('lyrics-close-btn'),
        lyricsTitle: document.getElementById('lyrics-title'),
        lyricsArtist: document.getElementById('lyrics-artist'),
        lyricsBody: document.getElementById('lyrics-body'),
        lyricsCover: document.getElementById('lyrics-cover'),
        openLyricsPlayerBtn: document.getElementById('open-lyrics-player-btn'),
        copyLyricsBtn: document.getElementById('copy-lyrics-btn'),

        // Repo Guide Modal (Read-Only)
        guideModal: document.getElementById('guide-modal'),
        guideModalBackdrop: document.getElementById('guide-modal-backdrop'),
        guideModalCloseBtn: document.getElementById('guide-modal-close-btn'),
        openGuideBtn: document.getElementById('open-guide-btn'),
        guideTableBody: document.getElementById('guide-table-body'),

        // Toast container
        toastContainer: document.getElementById('toast-container')
    };

    // Helper: Toast Notifications
    function showToast(message, type = 'info', duration = 3000) {
        if (!el.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} fade-in`;

        let icon = '🎵';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-text">${message}</span>
        `;
        el.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // Cache for checked local files
    const fileCache = new Map();
    async function checkFileExists(url) {
        if (fileCache.has(url)) return fileCache.get(url);
        try {
            // Include cache-buster in HEAD check to guarantee fresh status from server
            const res = await fetch(`${url}?_t=${SESSION_TIMESTAMP}`, { method: 'HEAD', cache: 'no-cache' });
            if (!res.ok) {
                fileCache.set(url, false);
                return false;
            }
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            // Prevent false positive if server returns index.html for 404
            if (ct.includes('text/html')) {
                fileCache.set(url, false);
                return false;
            }
            fileCache.set(url, true);
            return true;
        } catch (e) {
            fileCache.set(url, false);
            return false;
        }
    }

    // Resolve media for song (Checks folder audio/ & covers/ with multi-extension and anti-cache)
    async function resolveSongMedia(song) {
        if (state.resolvedMedia[song.id]) {
            return state.resolvedMedia[song.id];
        }

        // 1. Audio resolution:
        // Supports .mp3, .wav, .m4a
        const audioSlug = song.localAudioName.substring(0, song.localAudioName.lastIndexOf('.'));
        const audioExts = ['.mp3', '.wav', '.m4a'];
        let audioUrl = `${song.previewUrl}?v=${SESSION_TIMESTAMP}`;
        let isFull = false;

        for (const ext of audioExts) {
            const path = `audio/${audioSlug}${ext}`;
            const exists = await checkFileExists(path);
            if (exists) {
                audioUrl = `${path}?v=${SESSION_TIMESTAMP}`;
                isFull = true;
                console.log(`[Vault] Detected full audio for ${song.title}: ${path}`);
                break;
            }
        }

        // 2. Cover resolution:
        // Supports .jpg, .jpeg, .png, .webp
        const coverSlug = song.localCoverName.substring(0, song.localCoverName.lastIndexOf('.'));
        const coverExts = ['.jpg', '.jpeg', '.png', '.webp'];
        let coverUrl = song.defaultCover;
        let isCustomCover = false;

        for (const ext of coverExts) {
            const path = `covers/${coverSlug}${ext}`;
            const exists = await checkFileExists(path);
            if (exists) {
                coverUrl = `${path}?v=${SESSION_TIMESTAMP}`;
                isCustomCover = true;
                console.log(`[Vault] Detected local cover for ${song.title}: ${path}`);
                break;
            }
        }

        // If using default cover that is also a local path (like default unreleased covers)
        if (!isCustomCover && coverUrl.startsWith('covers/')) {
            coverUrl = `${coverUrl}?v=${SESSION_TIMESTAMP}`;
        }

        const resolved = { audioUrl, isFull, coverUrl, isCustomCover };
        state.resolvedMedia[song.id] = resolved;
        return resolved;
    }

    // Equalizer / Visualizer Canvas Animation
    function initVisualizer() {
        if (!el.visualizerCanvas) return;
        const canvas = el.visualizerCanvas;
        const ctx = canvas.getContext('2d');
        const barWidth = 4;
        const gap = 3;
        const barCount = Math.floor(canvas.width / (barWidth + gap));
        const bars = new Array(barCount).fill(3);

        function render() {
            requestAnimationFrame(render);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const time = Date.now() * 0.007;

            for (let i = 0; i < barCount; i++) {
                if (state.isPlaying) {
                    const freqWave = Math.sin(time * 1.5 + i * 0.35) * Math.cos(time * 0.8 + i * 0.2);
                    const target = Math.max(4, Math.abs(freqWave) * canvas.height * 0.88 + Math.random() * 3);
                    bars[i] += (target - bars[i]) * 0.25;
                } else {
                    bars[i] += (3 - bars[i]) * 0.1;
                }

                const h = Math.min(canvas.height, Math.max(3, bars[i]));
                const x = i * (barWidth + gap);
                const y = canvas.height - h;

                const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
                grad.addColorStop(0, '#FF2E93');
                grad.addColorStop(0.5, '#A855F7');
                grad.addColorStop(1, '#00F0FF');
                ctx.fillStyle = grad;
                ctx.fillRect(x, y, barWidth, h);
            }
        }
        render();
    }

    // Render Songs Grid
    async function renderSongsList() {
        if (!el.songsGrid) return;
        el.songsGrid.innerHTML = '';

        if (state.filteredSongs.length === 0) {
            el.songsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>Lagu tidak ditemukan</h3>
                    <p>Coba kata kunci lain atau pilih filter kategori "Semua".</p>
                </div>
            `;
            if (el.trackCount) el.trackCount.textContent = '0 Lagu';
            return;
        }

        if (el.trackCount) {
            el.trackCount.textContent = `${state.filteredSongs.length} Lagu`;
        }

        for (let i = 0; i < state.filteredSongs.length; i++) {
            const song = state.filteredSongs[i];
            const isCurrent = state.songs[state.currentIndex]?.id === song.id;
            const isThisPlaying = isCurrent && state.isPlaying;

            const media = await resolveSongMedia(song);

            const card = document.createElement('div');
            card.className = `song-card ${isCurrent ? 'active-song' : ''} ${song.isUnreleased ? 'unreleased-card' : ''}`;
            card.setAttribute('data-id', song.id);

            // Badge text & class
            let sourceBadgeHtml = '';
            if (media.isFull) {
                sourceBadgeHtml = `<span class="status-pill pill-full" title="Memutar Full Track dari Repo (audio/${song.localAudioName})"><i class="fas fa-check-circle"></i> Full Audio</span>`;
            } else {
                sourceBadgeHtml = `<span class="status-pill pill-preview" title="Preview Studio 30 Detik"><i class="fas fa-headphones"></i> ${song.isUnreleased ? 'Demo Snippet' : 'Preview 30s'}</span>`;
            }

            card.innerHTML = `
                <div class="card-cover-wrap">
                    <img src="${media.coverUrl}" alt="${song.title}" class="card-cover-img" loading="lazy" onerror="this.onerror=null; this.src='covers/defaults/default-fallback.jpg';">
                    <div class="card-overlay">
                        <button class="card-play-btn" data-action="play" aria-label="Play song">
                            <i class="fas ${isThisPlaying ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                    </div>
                    ${song.isUnreleased ? '<span class="unreleased-tag"><i class="fas fa-fire"></i> UNRELEASED</span>' : ''}
                </div>
                <div class="card-info">
                    <div class="card-title-row">
                        <h4 class="card-title" title="${song.title}">${song.title}</h4>
                        <span class="card-duration">${media.isFull ? song.duration : '0:30'}</span>
                    </div>
                    <p class="card-artist">${song.artist} • <span class="card-album">${song.album}</span></p>
                    <div class="card-meta">
                        ${sourceBadgeHtml}
                        <span class="card-year">${song.year}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-card-action btn-lyrics" data-action="lyrics" title="Lihat Lirik Lagu">
                            <i class="fas fa-align-left"></i> Lihat Lirik
                        </button>
                    </div>
                </div>
            `;

            // Card Event Listeners
            card.querySelector('[data-action="play"]').addEventListener('click', (e) => {
                e.stopPropagation();
                handlePlaySongById(song.id);
            });

            card.querySelector('[data-action="lyrics"]').addEventListener('click', (e) => {
                e.stopPropagation();
                openLyricsModal(song);
            });

            card.addEventListener('click', () => {
                handlePlaySongById(song.id);
            });

            el.songsGrid.appendChild(card);
        }
    }

    // Play Song by ID
    async function handlePlaySongById(songId) {
        const index = state.songs.findIndex(s => s.id === songId);
        if (index === -1) return;

        if (state.currentIndex === index && audio.src) {
            if (state.isPlaying) {
                audio.pause();
            } else {
                audio.play().catch(e => console.error('Play error:', e));
            }
        } else {
            state.currentIndex = index;
            await loadSong(state.songs[index], true);
        }
    }

    // Load song into audio player
    async function loadSong(song, shouldPlay = false) {
        if (!song) return;

        const media = await resolveSongMedia(song);

        // Assign audio source
        audio.src = media.audioUrl;
        audio.playbackRate = state.playbackRate;

        // Update player UI
        if (el.playerTitle) el.playerTitle.textContent = song.title;
        if (el.playerArtist) el.playerArtist.textContent = `${song.artist} • ${song.album}`;
        if (el.playerThumb) {
            el.playerThumb.src = media.coverUrl;
            el.playerThumb.onerror = () => { el.playerThumb.src = 'covers/defaults/default-fallback.jpg'; };
        }

        // Update source badge
        updatePlayerSourceBadge(media.isFull, song);

        // Update Active Song Card styling
        document.querySelectorAll('.song-card').forEach(c => {
            const id = c.getAttribute('data-id');
            const playIcon = c.querySelector('.card-play-btn i');
            if (id === song.id) {
                c.classList.add('active-song');
                if (playIcon) playIcon.className = `fas ${shouldPlay ? 'fa-pause' : 'fa-play'}`;
            } else {
                c.classList.remove('active-song');
                if (playIcon) playIcon.className = 'fas fa-play';
            }
        });

        if (shouldPlay) {
            try {
                await audio.play();
                showToast(`Memutar: ${song.title} ${media.isFull ? '(Full Song)' : '(Preview 30s)'}`, 'info');
            } catch (err) {
                console.warn('Playback error:', err);
                showToast(`Klik tombol Play untuk mendengarkan "${song.title}"`, 'warning');
            }
        }
    }

    // Update Player Source Badge
    function updatePlayerSourceBadge(isFull, song) {
        if (!el.playerSourceBadge) return;

        if (isFull) {
            el.playerSourceBadge.className = 'source-badge badge-full';
            el.playerSourceBadge.innerHTML = `<i class="fas fa-check-circle"></i> FULL SONG`;
        } else {
            el.playerSourceBadge.className = 'source-badge badge-preview';
            el.playerSourceBadge.innerHTML = `<i class="fas fa-headphones"></i> ${song.isUnreleased ? 'DEMO PREVIEW' : 'PREVIEW 30s'}`;
        }
    }

    // Next / Previous song
    function playNext() {
        if (state.songs.length === 0) return;
        if (state.isShuffle) {
            let nextIdx = Math.floor(Math.random() * state.songs.length);
            if (nextIdx === state.currentIndex && state.songs.length > 1) {
                nextIdx = (nextIdx + 1) % state.songs.length;
            }
            state.currentIndex = nextIdx;
        } else {
            state.currentIndex = (state.currentIndex + 1) % state.songs.length;
        }
        loadSong(state.songs[state.currentIndex], true);
    }

    function playPrev() {
        if (state.songs.length === 0) return;
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }
        state.currentIndex = (state.currentIndex - 1 + state.songs.length) % state.songs.length;
        loadSong(state.songs[state.currentIndex], true);
    }

    // Speed Controls
    function setPlaybackSpeed(rate) {
        const parsed = Math.max(0.25, Math.min(3.0, parseFloat(rate)));
        state.playbackRate = parsed;
        audio.playbackRate = parsed;

        if (el.speedValueBadge) {
            el.speedValueBadge.textContent = `${parsed.toFixed(2)}x`;
        }
        if (el.speedSlider) {
            el.speedSlider.value = parsed;
        }

        // Highlight preset buttons
        if (el.speedPresetBtns) {
            el.speedPresetBtns.forEach(btn => {
                const bVal = parseFloat(btn.getAttribute('data-speed'));
                if (Math.abs(bVal - parsed) < 0.05) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    }

    // Audio Element Event Listeners
    audio.addEventListener('play', () => {
        state.isPlaying = true;
        if (el.playPauseIcon) el.playPauseIcon.className = 'fas fa-pause';
        if (el.playerVinyl) el.playerVinyl.classList.add('spinning');
        updateCardPlayIcons(true);
    });

    audio.addEventListener('pause', () => {
        state.isPlaying = false;
        if (el.playPauseIcon) el.playPauseIcon.className = 'fas fa-play';
        if (el.playerVinyl) el.playerVinyl.classList.remove('spinning');
        updateCardPlayIcons(false);
    });

    audio.addEventListener('ended', () => {
        if (state.repeatMode === 'one') {
            audio.currentTime = 0;
            audio.play();
        } else if (state.repeatMode === 'all' || state.currentIndex < state.songs.length - 1) {
            playNext();
        } else {
            state.isPlaying = false;
            if (el.playPauseIcon) el.playPauseIcon.className = 'fas fa-play';
            if (el.playerVinyl) el.playerVinyl.classList.remove('spinning');
            updateCardPlayIcons(false);
        }
    });

    audio.addEventListener('timeupdate', () => {
        if (isSeeking) return; // Don't fight with user drag/scrub
        const cur = audio.currentTime || 0;
        const dur = audio.duration || 0;

        if (el.currentTimeText) el.currentTimeText.textContent = formatTime(cur);
        if (dur && !isNaN(dur) && el.durationText) {
            el.durationText.textContent = formatTime(dur);
        }

        if (dur > 0 && el.progressFill) {
            const pct = (cur / dur) * 100;
            el.progressFill.style.width = `${pct}%`;
            if (el.progressHandle) el.progressHandle.style.left = `${pct}%`;
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration) && el.durationText) {
            el.durationText.textContent = formatTime(audio.duration);
        }
    });

    audio.addEventListener('error', (e) => {
        console.warn('Audio playback error occurred:', e);
        const curSong = state.songs[state.currentIndex];
        if (curSong) {
            showToast(`Gagal memutar audio untuk "${curSong.title}".`, 'error');
        }
    });

    function updateCardPlayIcons(isPlaying) {
        const currentSong = state.songs[state.currentIndex];
        if (!currentSong) return;

        document.querySelectorAll('.song-card').forEach(card => {
            const id = card.getAttribute('data-id');
            const icon = card.querySelector('.card-play-btn i');
            if (id === currentSong.id) {
                if (icon) icon.className = `fas ${isPlaying ? 'fa-pause' : 'fa-play'}`;
            } else {
                if (icon) icon.className = 'fas fa-play';
            }
        });
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Progress Bar: Seeking & Dragging (Maju / Mundur Lagu)
    function handleSeek(e) {
        if (!el.progressBar) return;
        const rect = el.progressBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let pos = (clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos));

        const dur = audio.duration;
        if (dur && !isNaN(dur) && isFinite(dur)) {
            const seekTime = pos * dur;
            if (el.currentTimeText) el.currentTimeText.textContent = formatTime(seekTime);
            if (el.progressFill) el.progressFill.style.width = `${pos * 100}%`;
            if (el.progressHandle) el.progressHandle.style.left = `${pos * 100}%`;
            return seekTime;
        }
        return null;
    }

    if (el.progressBar) {
        const onPointerMove = (e) => {
            if (!isSeeking) return;
            handleSeek(e);
        };

        const onPointerUp = (e) => {
            if (!isSeeking) return;
            isSeeking = false;
            document.removeEventListener('mousemove', onPointerMove);
            document.removeEventListener('mouseup', onPointerUp);
            document.removeEventListener('touchmove', onPointerMove);
            document.removeEventListener('touchend', onPointerUp);

            const seekTime = handleSeek(e);
            if (seekTime !== null) {
                try {
                    audio.currentTime = seekTime;
                } catch (err) {
                    console.warn('Seek error:', err);
                }
            }
        };

        const onPointerDown = (e) => {
            // Prevent if no track or invalid duration
            if (!audio.duration || isNaN(audio.duration)) return;
            isSeeking = true;
            handleSeek(e);

            document.addEventListener('mousemove', onPointerMove);
            document.addEventListener('mouseup', onPointerUp);
            document.addEventListener('touchmove', onPointerMove, { passive: true });
            document.addEventListener('touchend', onPointerUp);
        };

        el.progressBar.addEventListener('mousedown', onPointerDown);
        el.progressBar.addEventListener('touchstart', onPointerDown, { passive: true });
    }

    // Controls
    if (el.playPauseBtn) {
        el.playPauseBtn.addEventListener('click', () => {
            if (!audio.src) {
                loadSong(state.songs[state.currentIndex], true);
                return;
            }
            if (state.isPlaying) {
                audio.pause();
            } else {
                audio.play().catch(e => console.error(e));
            }
        });
    }

    if (el.nextBtn) el.nextBtn.addEventListener('click', playNext);
    if (el.prevBtn) el.prevBtn.addEventListener('click', playPrev);

    if (el.shuffleBtn) {
        el.shuffleBtn.addEventListener('click', () => {
            state.isShuffle = !state.isShuffle;
            el.shuffleBtn.classList.toggle('active', state.isShuffle);
            showToast(state.isShuffle ? 'Mode Shuffle Aktif' : 'Mode Shuffle Nonaktif', 'info');
        });
    }

    if (el.repeatBtn) {
        el.repeatBtn.addEventListener('click', () => {
            if (state.repeatMode === 'off') {
                state.repeatMode = 'all';
                el.repeatBtn.classList.add('active');
                el.repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
                showToast('Ulangi Semua Lagu', 'info');
            } else if (state.repeatMode === 'all') {
                state.repeatMode = 'one';
                el.repeatBtn.classList.add('active');
                el.repeatBtn.innerHTML = '<i class="fas fa-redo-alt"></i><span class="repeat-one-indicator">1</span>';
                showToast('Ulangi Lagu Ini Saja', 'info');
            } else {
                state.repeatMode = 'off';
                el.repeatBtn.classList.remove('active');
                el.repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
                showToast('Ulangi Dinonaktifkan', 'info');
            }
        });
    }

    // Volume Slider
    if (el.volumeSlider) {
        el.volumeSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            audio.volume = val;
            updateVolumeIcon(val);
        });
    }

    if (el.volumeIcon) {
        el.volumeIcon.addEventListener('click', () => {
            if (audio.volume > 0) {
                audio.dataset.prevVol = audio.volume;
                audio.volume = 0;
                if (el.volumeSlider) el.volumeSlider.value = 0;
                updateVolumeIcon(0);
            } else {
                const prev = parseFloat(audio.dataset.prevVol) || 1.0;
                audio.volume = prev;
                if (el.volumeSlider) el.volumeSlider.value = prev;
                updateVolumeIcon(prev);
            }
        });
    }

    function updateVolumeIcon(vol) {
        if (!el.volumeIcon) return;
        if (vol === 0) {
            el.volumeIcon.className = 'fas fa-volume-mute';
        } else if (vol < 0.5) {
            el.volumeIcon.className = 'fas fa-volume-down';
        } else {
            el.volumeIcon.className = 'fas fa-volume-up';
        }
    }

    // Speed Controls
    if (el.speedSlider) {
        el.speedSlider.addEventListener('input', (e) => {
            setPlaybackSpeed(e.target.value);
        });
    }

    if (el.speedPresetBtns) {
        el.speedPresetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const spd = btn.getAttribute('data-speed');
                setPlaybackSpeed(spd);
            });
        });
    }

    // Filter & Search
    function applyFilters() {
        const query = state.searchQuery.trim().toLowerCase();
        state.filteredSongs = state.songs.filter(song => {
            // Category filter
            if (state.activeFilter === 'unreleased' && !song.isUnreleased) return false;
            if (state.activeFilter === 'think-later' && !song.album.toLowerCase().includes('think later')) return false;
            if (state.activeFilter === 'so-close' && !song.album.toLowerCase().includes('so close')) return false;
            if (state.activeFilter === 'singles' && !song.album.toLowerCase().includes('single') && !song.album.toLowerCase().includes('f1')) return false;
            if (state.activeFilter === 'classics' && (song.isUnreleased || song.album.toLowerCase().includes('think later') || song.album.toLowerCase().includes('so close') || song.album.toLowerCase().includes('single') || song.album.toLowerCase().includes('f1'))) return false;

            // Search query
            if (query) {
                const matchTitle = song.title.toLowerCase().includes(query);
                const matchAlbum = song.album.toLowerCase().includes(query);
                const matchLyrics = song.lyrics.toLowerCase().includes(query);
                return matchTitle || matchAlbum || matchLyrics;
            }
            return true;
        });

        renderSongsList();
    }

    if (el.searchInput) {
        el.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            applyFilters();
        });
    }

    if (el.filterButtons) {
        el.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                el.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.activeFilter = btn.getAttribute('data-filter');
                applyFilters();
            });
        });
    }

    // Lyrics Modal
    function openLyricsModal(song) {
        if (!song || !el.lyricsModal) return;
        state.activeLyricsSongId = song.id;

        if (el.lyricsTitle) el.lyricsTitle.textContent = song.title;
        if (el.lyricsArtist) el.lyricsArtist.textContent = `${song.artist} • ${song.album} (${song.year})`;

        const media = state.resolvedMedia[song.id] || { coverUrl: song.defaultCover };
        if (el.lyricsCover) {
            el.lyricsCover.src = media.coverUrl;
            el.lyricsCover.onerror = () => { el.lyricsCover.src = 'covers/defaults/default-fallback.jpg'; };
        }

        // Format lyrics text with line breaks and verse classes
        if (el.lyricsBody) {
            const formatted = song.lyrics
                .split('\n\n')
                .map(block => {
                    const lines = block.split('\n');
                    const isHeader = lines[0].startsWith('[');
                    if (isHeader) {
                        const header = lines[0];
                        const rest = lines.slice(1).join('<br>');
                        return `<div class="lyrics-section"><span class="lyrics-header">${header}</span><p>${rest}</p></div>`;
                    }
                    return `<div class="lyrics-section"><p>${block.replace(/\n/g, '<br>')}</p></div>`;
                })
                .join('');
            el.lyricsBody.innerHTML = formatted;
        }

        el.lyricsModal.classList.remove('hidden');
    }

    function closeLyricsModal() {
        if (el.lyricsModal) el.lyricsModal.classList.add('hidden');
    }

    if (el.lyricsCloseBtn) el.lyricsCloseBtn.addEventListener('click', closeLyricsModal);
    if (el.lyricsBackdrop) el.lyricsBackdrop.addEventListener('click', closeLyricsModal);
    if (el.openLyricsPlayerBtn) {
        el.openLyricsPlayerBtn.addEventListener('click', () => {
            const song = state.songs[state.currentIndex];
            if (song) openLyricsModal(song);
        });
    }

    if (el.copyLyricsBtn) {
        el.copyLyricsBtn.addEventListener('click', () => {
            const song = state.songs.find(s => s.id === state.activeLyricsSongId);
            if (song && song.lyrics) {
                navigator.clipboard.writeText(song.lyrics).then(() => {
                    showToast('Lirik berhasil disalin ke clipboard! 📋', 'success');
                });
            }
        });
    }

    // Read-only Repository Naming Guide Modal
    async function openGuideModal() {
        if (!el.guideModal || !el.guideTableBody) return;

        el.guideTableBody.innerHTML = '';

        for (const song of state.songs) {
            const tr = document.createElement('tr');
            const media = await resolveSongMedia(song);

            let statusBadge = '<span class="status-tag status-preview">Preview 30s</span>';
            if (media.isFull) {
                statusBadge = '<span class="status-tag status-full"><i class="fas fa-check"></i> Full Song (Repo File)</span>';
            }

            tr.innerHTML = `
                <td>
                    <strong>${song.title}</strong>
                    ${song.isUnreleased ? '<span class="mini-unreleased">UNRELEASED</span>' : ''}
                </td>
                <td><code>audio/${song.localAudioName}</code></td>
                <td><code>covers/${song.localCoverName}</code></td>
                <td>${statusBadge}</td>
            `;

            el.guideTableBody.appendChild(tr);
        }

        el.guideModal.classList.remove('hidden');
    }

    function closeGuideModal() {
        if (el.guideModal) el.guideModal.classList.add('hidden');
    }

    if (el.openGuideBtn) el.openGuideBtn.addEventListener('click', openGuideModal);
    if (el.guideModalCloseBtn) el.guideModalCloseBtn.addEventListener('click', closeGuideModal);
    if (el.guideModalBackdrop) el.guideModalBackdrop.addEventListener('click', closeGuideModal);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (document.activeElement === el.searchInput) return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (el.playPauseBtn) el.playPauseBtn.click();
        } else if (e.code === 'ArrowRight' && e.ctrlKey) {
            e.preventDefault();
            playNext();
        } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
            e.preventDefault();
            playPrev();
        } else if (e.key === 'l' || e.key === 'L') {
            const currentSong = state.songs[state.currentIndex];
            if (currentSong) openLyricsModal(currentSong);
        } else if (e.key === 'Escape') {
            closeLyricsModal();
            closeGuideModal();
        }
    });

    // Application Initialization
    async function init() {
        initVisualizer();
        await renderSongsList();

        // Load initial track (Hard or first track)
        if (state.songs.length > 0) {
            await loadSong(state.songs[0], false);
        }

        console.log('Tate McRae Player initialized successfully with anti-cache overrides!');
    }

    init();

})();
