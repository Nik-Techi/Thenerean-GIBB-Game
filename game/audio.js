/**
 * Thenerean Selvabankumar - Audio Engine Pro Edition
 * - Registers all 25 extracted authentic voice/meme audio clips + aliases
 * - Supports clean overlapping voice playback (no awkward mid-word cutoffs during 10s intro or rapid combat!)
 * - Intelligent background music fading (ducks to ~5% during boss walks, dialogues & fights)
 * - Synthesized arcade combat FX (jump, collect, hit, throttled throw, mega beam, ui click)
 */

class SoundManager {
    constructor() {
        this.enabled = true;
        this.musicEnabled = true;
        this.musicVolumePercent = 50;
        this.isQuietMode = false;
        this.currentMusic = null;
        this.currentMusicSrc = '';
        this.musicVolume = 0.32;
        this.targetMusicVolume = 0.32;
        this.activeVoices = new Set();
        this.lastThrowSfxTime = 0;

        // Original Soundtrack Playlist (URI-safe encoding handled on play)
        this.musicTracks = [
            'assets/music/That_s_The_One.mp3',
            'assets/music/Sirünän_Silicancumar.mp3',
            'assets/music/Sivassklicumar_Morning.mp3',
            'assets/music/Thanuran_Takeover.mp3',
            'assets/music/Chasin_Dreams_Tharunan_s_Theme_.mp3',
            'assets/music/Sirünän_Reign.mp3',
            'assets/music/Echoes_of_Tharunan.mp3',
            'assets/music/Tharunan_Sivakumar_Bless_Their_Heart_.mp3'
        ];

        // All 25 authentic extracted MP3 voice/meme lines
        this.clipSources = {
            // Herr Adam
            adam_silvankumar: 'assets/audio/adam_silvankumar.mp3',
            adam_20_frisbees: 'assets/audio/adam_20_frisbees.mp3',
            adam_frisbee: 'assets/audio/adam_frisbees.mp3',
            adam_frisbees: 'assets/audio/adam_frisbees.mp3',
            adam_hilf_mir: 'assets/audio/adam_hilf_mir.mp3',

            // Monika Schneider
            monika_zspaet: 'assets/audio/monika_zspaet_nuet_disp.mp3',
            monika_gang_platz: 'assets/audio/monika_gang_platz_short.mp3',
            monika_gang_uf_platz: 'assets/audio/monika_gang_uf_platz.mp3',
            monika_puenktlichkeit: 'assets/audio/monika_puenktlichkeit.mp3',
            monika_schuld: 'assets/audio/monika_schuld.mp3',
            monika_ganz_ruhig: 'assets/audio/monika_ganz_ruhig.mp3',

            // Thenerean Selvabankumar
            thenerean_stah: 'assets/audio/thenerean_stah_doch_da.mp3',
            thenerean_entschuldigung: 'assets/audio/thenerean_entschuldigung.mp3',
            thenerean_254: 'assets/audio/thenerean_254_spaeter.mp3',
            thenerean_gesetz: 'assets/audio/thenerean_gesetzestext.mp3',
            thenerean_verdammt_maschine: 'assets/audio/thenerean_verdammt_maschine.mp3',
            thenerean_gpu: 'assets/audio/thenerean_gpu_fehler.mp3',
            thenerean_grafikkarte: 'assets/audio/thenerean_grafikkarte.mp3',
            thenerean_lippenstift: 'assets/audio/thenerean_lippenstift.mp3',
            thenerean_raste_aus: 'assets/audio/thenerean_raste_aus.mp3',
            thenerean_tuktuk: 'assets/audio/thenerean_tuktuk_ride.mp3',
            thenerean_bankomat: 'assets/audio/thenerean_selber_bankomat.mp3',
            thenerean_selber_bankomat: 'assets/audio/thenerean_selber_bankomat.mp3',
            thenerean_ultra: 'assets/audio/thenerean_ultra_shout.mp3',
            thenerean_ultra_frisbee: 'assets/audio/thenerean_ultra_frisbee.mp3',
            thenerean_sport_spaet: 'assets/audio/thenerean_sport_spaet.mp3',
            thenerean_srilanka: 'assets/audio/thenerean_srilanka.mp3',
            thenerean_niemert_verbi: 'assets/audio/thenerean_niemert_verbi.mp3',
            thenerean_chasch_mi_schlah: 'assets/audio/thenerean_chasch_mi_schlah.mp3',
            thenerean_stah_bis_schluss: 'assets/audio/thenerean_stah_bis_schluss.mp3',
            thenerean_block_impact: 'assets/audio/thenerean_block_impact.mp3'
        };

        // Preload unique Audio buffers into browser cache
        this.clips = {};
        const preloadedBySrc = {};
        for (const [key, rawSrc] of Object.entries(this.clipSources)) {
            const safeSrc = encodeURI(rawSrc);
            if (!preloadedBySrc[safeSrc]) {
                const a = new Audio(safeSrc);
                a.preload = 'auto';
                preloadedBySrc[safeSrc] = a;
            }
            this.clips[key] = preloadedBySrc[safeSrc];
        }

        this.initWebAudio();
        setInterval(() => this.updateMusicFade(), 70);
    }

    initWebAudio() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!this.ctx && AudioCtx) {
                this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
        } catch (e) {
            console.warn("Web Audio unavailable", e);
        }
    }

    playJump() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(540, now + 0.14);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    }

    playCollect() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'triangle';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.setValueAtTime(739.99, now + 0.06);
            osc.frequency.setValueAtTime(880.0, now + 0.12);
            gain.gain.setValueAtTime(0.24, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) {}
    }

    playHit() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sawtooth';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(175, now);
            osc.frequency.exponentialRampToValueAtTime(42, now + 0.16);
            gain.gain.setValueAtTime(0.24, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.17);
            osc.start(now);
            osc.stop(now + 0.17);
        } catch (e) {}
    }

    playThrow() {
        if (!this.enabled || !this.ctx) return;
        const t = performance.now();
        if (t - this.lastThrowSfxTime < 45) return; // Prevent clipping on 20-frisbee burst
        this.lastThrowSfxTime = t;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'triangle';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(240, now + 0.09);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } catch (e) {}
    }

    playBlockSfx() {
        if (!this.enabled) return;
        // 1. Play metallic shield clang clip
        this.playClip('thenerean_block_impact', null, 0.95);

        // 2. Synthesize high-tech crystalline shield deflection chime
        if (this.ctx) {
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(1760, now + 0.18);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            } catch (e) {}
        }
    }

    playMegaBeam() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sawtooth';
            osc2.type = 'square';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(680, now + 0.36);
            osc2.frequency.setValueAtTime(55, now);
            osc2.frequency.exponentialRampToValueAtTime(340, now + 0.36);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.42);
            osc.start(now);
            osc2.start(now);
            osc.stop(now + 0.42);
            osc2.stop(now + 0.42);
        } catch (e) {}
    }

    playSprint() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'triangle';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(820, now + 0.16);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {}
    }

    playLavaSplash() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sawtooth';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(210, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.28);
            gain.gain.setValueAtTime(0.24, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.30);
            osc.start(now);
            osc.stop(now + 0.30);
        } catch (e) {}
    }

    playPowerUp() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.045);
                gain.gain.setValueAtTime(0.16, now + i * 0.045);
                gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.045 + 0.14);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.045);
                osc.stop(now + i * 0.045 + 0.15);
            });
        } catch (e) {}
    }

    playPause() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(480, now);
            osc.frequency.setValueAtTime(640, now + 0.05);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.11);
            osc.start(now);
            osc.stop(now + 0.11);
        } catch (e) {}
    }

    /**
     * Play a voice clip. Supports overlapping simultaneous clips cleanly
     * so rapid meme-spam & fast boss combat banter never cut each other off!
     */
    playClip(name, onEnded = null, volume = 1.0) {
        if (!this.enabled) return;
        const rawSrc = this.clipSources[name];
        if (!rawSrc) return;

        // Trim oldest if too many voices are stacked simultaneously
        if (this.activeVoices.size >= 10) {
            const oldest = this.activeVoices.values().next().value;
            if (oldest) {
                try { oldest.pause(); } catch (e) {}
                this.activeVoices.delete(oldest);
            }
        }

        const voice = new Audio(encodeURI(rawSrc));
        voice.volume = Math.max(0, Math.min(1, volume));
        this.activeVoices.add(voice);

        const cleanup = () => {
            this.activeVoices.delete(voice);
            if (onEnded) onEnded();
        };
        voice.addEventListener('ended', cleanup, { once: true });
        voice.addEventListener('error', cleanup, { once: true });

        voice.play().catch(() => {
            this.activeVoices.delete(voice);
        });
    }

    stopAllClips() {
        for (const v of this.activeVoices) {
            try {
                v.pause();
                v.currentTime = 0;
            } catch (e) {}
        }
        this.activeVoices.clear();
    }

    getEffectiveMusicVolume() {
        if (!this.enabled || !this.musicEnabled) return 0;
        const norm = Math.max(0, Math.min(100, this.musicVolumePercent)) / 100.0;
        // Normal max level is ~0.55; quiet mode is ~18% of user volume
        const maxGain = this.isQuietMode ? 0.08 : 0.52;
        return norm * maxGain;
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = Boolean(enabled);
        this.targetMusicVolume = this.getEffectiveMusicVolume();
        if (!this.musicEnabled && this.currentMusic) {
            this.currentMusic.pause();
        } else if (this.musicEnabled && this.currentMusic && this.enabled) {
            this.currentMusic.volume = this.targetMusicVolume;
            this.currentMusic.play().catch(() => {});
        }
    }

    setMusicVolumePercent(pct) {
        this.musicVolumePercent = Math.max(0, Math.min(100, Math.round(pct)));
        this.targetMusicVolume = this.getEffectiveMusicVolume();
        if (this.currentMusic && this.musicEnabled && this.enabled) {
            if (this.musicVolumePercent === 0) {
                this.currentMusic.pause();
            } else if (this.currentMusic.paused) {
                this.currentMusic.volume = this.targetMusicVolume;
                this.currentMusic.play().catch(() => {});
            }
        }
    }

    toggleMusic() {
        this.setMusicEnabled(!this.musicEnabled);
        return this.musicEnabled;
    }

    playMusicForLevel(levelNum) {
        if (!this.enabled) return;
        const index = levelNum % this.musicTracks.length;
        this.playMusic(this.musicTracks[index]);
    }

    playMenuMusic() {
        if (!this.enabled) return;
        this.playMusic('assets/music/That_s_The_One.mp3');
    }

    playMusic(src) {
        const safeSrc = encodeURI(src);
        if (this.currentMusic && this.currentMusicSrc === safeSrc && !this.currentMusic.paused) {
            return;
        }
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
        this.currentMusicSrc = safeSrc;
        this.currentMusic = new Audio(safeSrc);
        this.currentMusic.loop = true;
        this.targetMusicVolume = this.getEffectiveMusicVolume();
        this.musicVolume = this.targetMusicVolume;
        this.currentMusic.volume = this.musicVolume;

        if (this.enabled && this.musicEnabled && this.musicVolumePercent > 0) {
            this.currentMusic.play().catch(() => {});
        }
    }

    // Dynamic music volume: duck during boss encounter & dialogue so voice lines shine
    setMusicQuietMode(quiet = true) {
        this.isQuietMode = Boolean(quiet);
        this.targetMusicVolume = this.getEffectiveMusicVolume();
    }

    updateMusicFade() {
        if (!this.currentMusic) return;
        if (!this.enabled || !this.musicEnabled || this.musicVolumePercent === 0) {
            if (!this.currentMusic.paused) this.currentMusic.volume = 0;
            return;
        }
        if (Math.abs(this.musicVolume - this.targetMusicVolume) > 0.015) {
            if (this.musicVolume < this.targetMusicVolume) {
                this.musicVolume = Math.min(this.targetMusicVolume, this.musicVolume + 0.035);
            } else {
                this.musicVolume = Math.max(this.targetMusicVolume, this.musicVolume - 0.045);
            }
            this.currentMusic.volume = Math.max(0, Math.min(1, this.musicVolume));
        }
    }

    toggleMute() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            if (this.currentMusic) this.currentMusic.pause();
            this.stopAllClips();
        } else {
            if (this.currentMusic && this.musicEnabled && this.musicVolumePercent > 0) {
                this.currentMusic.play().catch(() => {});
            }
        }
        return this.enabled;
    }
}

window.soundManager = new SoundManager();
