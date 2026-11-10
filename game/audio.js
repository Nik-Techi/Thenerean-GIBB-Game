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
        this.soundModeStorageKey = 'thenerean_sound_mode_v1';
        this.soundChaosLevel = this.loadSoundModePreference();

        // Kuratierter Soundtrack-Katalog (10 neue ~2–3min Epos-Tracks + 6 30s-Beats + 9 Klassiker)
        this.musicCatalog = [
            // Neue ~2–3 Min Epos-Tracks (Lobby Musik-Auswahl Favoriten)
            { src: 'assets/music/Override_the_Kill_Switch.mp3', title: 'Not-Aus Eskalation: Override The Kill Switch', category: '🔥 Epos (2–3 Min)', duration: '02:56' },
            { src: 'assets/music/Beyond_the_Frame.mp3', title: 'Sternenflug über Bern: Beyond The Frame', category: '🔥 Epos (2–3 Min)', duration: '02:58' },
            { src: 'assets/music/Rewrite_The_Sky.mp3', title: 'GIBB Cyber-Hymne: Rewrite The Sky', category: '🔥 Epos (2–3 Min)', duration: '02:38' },
            { src: 'assets/music/Rewrite_The_Sky_RMX.mp3', title: 'Overdrive Remix: Rewrite The Sky (Ext.)', category: '🔥 Epos (2–3 Min)', duration: '02:57' },
            { src: 'assets/music/Die_Rache_der_Maschine.mp3', title: 'TukTuk-Aufstand: Die Rache der Maschine', category: '🔥 Epos (2–3 Min)', duration: '02:37' },
            { src: 'assets/music/Motherboard_Bleeding.mp3', title: 'Dual-GPU Überhitzung: Motherboard Bleeding', category: '🔥 Epos (2–3 Min)', duration: '02:40' },
            { src: 'assets/music/Cold_Steel_Beams.mp3', title: 'Server-Bunker Nacht: Cold Steel Beams', category: '🔥 Epos (2–3 Min)', duration: '02:27' },
            { src: 'assets/music/Crimson_Shell.mp3', title: 'Thenu Ascendant: Crimson Shell', category: '🔥 Epos (2–3 Min)', duration: '02:26' },
            { src: 'assets/music/The_Virus_Is_The_Law.mp3', title: 'OR Art. 321 Hack: The Virus Is The Law', category: '🔥 Epos (2–3 Min)', duration: '02:57' },
            { src: 'assets/music/Optical_Glide.mp3', title: 'Morgartenstrasse Express: Optical Glide', category: '🔥 Epos (2–3 Min)', duration: '01:39' },

            // Neue 30s-Meme-Beats
            { src: 'assets/music/Thanuran_The_Legend.mp3', title: 'Der Bug im System: Thanuran The Legend', category: '⚡ Neue Beats (30s)', duration: '00:31' },
            { src: 'assets/music/Wo_die_Sterne_sich_beruehren.mp3', title: 'Ballade vom GIBB-Helden (Wo die Sterne)', category: '⚡ Neue Beats (30s)', duration: '00:31' },
            { src: 'assets/music/Verithanam.mp3', title: 'Sri Lanka Flow: Verithanam', category: '⚡ Neue Beats (30s)', duration: '00:31' },
            { src: 'assets/music/he_runs_the_game.mp3', title: 'Thanuran Tarzan: He Runs The Game', category: '⚡ Neue Beats (30s)', duration: '00:31' },
            { src: 'assets/music/overwrite_the_sky.mp3', title: 'Sellacucumber Protocol (30s Mix)', category: '⚡ Neue Beats (30s)', duration: '00:31' },
            { src: 'assets/music/Concrete_Pipe_Strike.mp3', title: 'Endboss Buffer Overrun (30s)', category: '⚡ Neue Beats (30s)', duration: '00:31' },

            // Klassischer GIBB-OST
            { src: 'assets/music/That_s_The_One.mp3', title: "GIBB Klassiker: That's The One", category: '🎧 Klassischer OST', duration: '00:31' },
            { src: 'assets/music/Sirünän_Silicancumar.mp3', title: 'Klassenzimmer Synth: Sirünän Silicancumar', category: '🎧 Klassischer OST', duration: '00:31' },
            { src: 'assets/music/Sivassklicumar_Morning.mp3', title: 'Sporthalle Dawn: Sivassklicumar Morning', category: '🎧 Klassischer OST', duration: '00:31' },
            { src: 'assets/music/Thanuran_Takeover.mp3', title: 'Training Overdrive: Thanuran Takeover', category: '🎧 Klassischer OST', duration: '00:31' },
            { src: 'assets/music/Chasin_Dreams_Tharunan_s_Theme_.mp3', title: "Tharunan's Theme: Chasin' Dreams", category: '🎧 Klassischer OST', duration: '00:31' },
            { src: 'assets/music/Sirünän_Reign.mp3', title: 'EFZ Krönung: Sirünän Reign', category: '🎧 Klassischer OST', duration: '00:31' },
            { src: 'assets/music/Echoes_of_Tharunan.mp3', title: 'Mensa Vibes: Echoes of Tharunan', category: '🎧 Klassischer OST', duration: '00:31' },
            { src: 'assets/music/Thärünen_Silicucumbercumar.mp3', title: 'ABU Theme: Thärünen Silicucumbercumar', category: '🎧 Klassischer OST', duration: '00:31' },
            { src: 'assets/music/Tharunan_Sivakumar_Bless_Their_Heart_.mp3', title: 'Legende Tribute: Bless Their Heart', category: '🎧 Klassischer OST', duration: '00:31' }
        ];

        this.musicTracks = this.musicCatalog.map((item) => item.src);
        this.menuMusicStorageKey = 'thenerean_lobby_music_v1';
        this.defaultMenuMusic = 'assets/music/Override_the_Kill_Switch.mp3';
        this.selectedMenuMusic = this.loadMenuMusicPreference();

        // Alle originalen + 28 neuen extrahierten MP3 Sprüche & Meme-Lines
        this.clipSources = {
            // Herr Adam (Original + Neu)
            adam_silvankumar: 'assets/audio/adam_silvankumar.mp3',
            adam_20_frisbees: 'assets/audio/adam_20_frisbees.mp3',
            adam_frisbee: 'assets/audio/adam_frisbees.mp3',
            adam_frisbees: 'assets/audio/adam_frisbees.mp3',
            adam_hilf_mir: 'assets/audio/adam_hilf_mir.mp3',
            adam_setup_genehmigt: 'assets/audio/adam_setup_genehmigt.mp3',
            adam_abwesend_sketch: 'assets/audio/adam_abwesend_sketch.mp3',
            adam_strafe_verpasst: 'assets/audio/adam_strafe_verpasst.mp3',

            // Monika Schneider (Original + Neu)
            monika_zspaet: 'assets/audio/monika_zspaet_nuet_disp.mp3',
            monika_gang_platz: 'assets/audio/monika_gang_platz_short.mp3',
            monika_gang_uf_platz: 'assets/audio/monika_gang_uf_platz.mp3',
            monika_puenktlichkeit: 'assets/audio/monika_puenktlichkeit.mp3',
            monika_schuld: 'assets/audio/monika_schuld.mp3',
            monika_ganz_ruhig: 'assets/audio/monika_ganz_ruhig.mp3',
            monika_abu_test: 'assets/audio/monika_abu_test.mp3',
            monika_keine_kopfhoerer: 'assets/audio/monika_keine_kopfhoerer.mp3',
            monika_chicken_curry: 'assets/audio/monika_chicken_curry.mp3',
            monika_adam_korrigiere: 'assets/audio/monika_adam_korrigiere.mp3',
            monika_mikrofon_hilfe: 'assets/audio/monika_mikrofon_hilfe.mp3',
            monika_altstadt_lehre: 'assets/audio/monika_altstadt_lehre.mp3',
            monika_passwort_buech: 'assets/audio/monika_passwort_buech.mp3',
            monika_abu_eingesperrt: 'assets/audio/monika_abu_eingesperrt.mp3',

            // Average GIBB Schüler & Boss SFX
            student_tiktok_fortnite: 'assets/audio/student_tiktok_fortnite.mp3',
            student_cringe_king: 'assets/audio/student_cringe_king.mp3',
            boss_evil_laugh: 'assets/audio/boss_evil_laugh.mp3',

            // TukTuk & Dual-GPU MK-II
            tuktuk_gpu_melone: 'assets/audio/tuktuk_gpu_melone.mp3',
            tuktuk_taeschfresser_gpu: 'assets/audio/tuktuk_taeschfresser_gpu.mp3',

            // Thenerean Selvabankumar (Original + Neu)
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
            thenerean_block_impact: 'assets/audio/thenerean_block_impact.mp3',
            thenerean_geilschte_setup: 'assets/audio/thenerean_geilschte_setup.mp3',
            thenerean_gesetz_dns: 'assets/audio/thenerean_gesetz_dns.mp3',
            thenerean_zspaet_raschtaus: 'assets/audio/thenerean_zspaet_raschtaus.mp3',
            thenerean_morgarten_blockiert: 'assets/audio/thenerean_morgarten_blockiert.mp3',
            thenerean_heilig_gral: 'assets/audio/thenerean_heilig_gral.mp3',
            thenerean_frechheit: 'assets/audio/thenerean_frechheit.mp3',
            thenerean_gemini_king: 'assets/audio/thenerean_gemini_king.mp3',
            thenerean_banana_monika: 'assets/audio/thenerean_banana_monika.mp3',
            thenerean_silicon_bugs: 'assets/audio/thenerean_silicon_bugs.mp3',
            thenerean_taronuman_scream: 'assets/audio/thenerean_taronuman_scream.mp3',
            thenerean_tamil_vbucks: 'assets/audio/thenerean_tamil_vbucks.mp3',
            thenerean_sport_late: 'assets/audio/thenerean_sport_late.mp3'
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

    playSwitch() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [740, 1110].forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now + idx * 0.06);
                gain.gain.setValueAtTime(0.22, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.06 + 0.24);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.25);
            });
        } catch (e) {}
    }

    playTargetHit() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1480, now + 0.09);
            gain.gain.setValueAtTime(0.19, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.13);
        } catch (e) {}
    }

    playWaveClear() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [523.25, 659.25, 987.77].forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now + idx * 0.075);
                gain.gain.setValueAtTime(0.18, now + idx * 0.075);
                gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.075 + 0.20);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.075);
                osc.stop(now + idx * 0.075 + 0.22);
            });
        } catch (e) {}
    }

    playWarningTick() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(920, now);
            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.004, now + 0.06);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.065);
        } catch (e) {}
    }

    /**
     * Play a voice clip. Enforces the 3-stage Sound Chaos Setting:
     *  - Stage 1: Strictly 1 clip at a time (never overlaps)
     *  - Stage 2: Usually 1 clip at a time; rarely (2 concurrent) overlaps
     *  - Stage 3: Crazy chaos — up to 8 overlapping clips simultaneously
     * Pass options.forceSolo = true for Sequential Intro/Character previews,
     * or options.bypassLimit = true for the Opening 10s All-Cast Launch Stage.
     */
    playClip(name, onEnded = null, volume = 1.0, options = {}) {
        if (!this.enabled) return;
        const rawSrc = this.clipSources[name];
        if (!rawSrc) return;

        // Prune any already-ended voice handles before checking concurrency limits
        for (const existing of this.activeVoices) {
            if (existing.ended) {
                this.activeVoices.delete(existing);
            }
        }

        const opts = options && typeof options === 'object' ? options : {};
        const chaos = this.soundChaosLevel || 2;

        if (opts.forceSolo) {
            this.stopAllClips();
        } else if (opts.bypassLimit) {
            if (this.activeVoices.size >= 10) {
                const oldest = this.activeVoices.values().next().value;
                if (oldest) {
                    try { oldest.pause(); } catch (e) {}
                    this.activeVoices.delete(oldest);
                }
            }
        } else if (chaos === 1) {
            // Stufe 1: Immer streng nur 1 Sound gleichzeitig
            if (this.activeVoices.size >= 1) {
                if (opts.lowPriority) return;
                this.stopAllClips();
            }
        } else if (chaos === 2) {
            // Stufe 2: Normalerweise 1 Sound, nur selten (max. 2) gleichzeitig
            if (this.activeVoices.size >= 2) {
                if (opts.lowPriority) return;
                while (this.activeVoices.size >= 2) {
                    const oldest = this.activeVoices.values().next().value;
                    if (!oldest) break;
                    try { oldest.pause(); } catch (e) {}
                    this.activeVoices.delete(oldest);
                }
            } else if (this.activeVoices.size === 1) {
                const chance = opts.overlapChance !== undefined ? opts.overlapChance : 0.24;
                const allowOverlap = Boolean(opts.forceOverlap || (!opts.noOverlap && Math.random() < chance));
                if (!allowOverlap) {
                    if (opts.lowPriority) return;
                    this.stopAllClips();
                }
            }
        } else {
            // Stufe 3: Crazy viele Sounds durcheinander (bis zu 8 gleichzeitig!)
            while (this.activeVoices.size >= 8) {
                const oldest = this.activeVoices.values().next().value;
                if (!oldest) break;
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

    loadSoundModePreference() {
        try {
            const raw = parseInt(localStorage.getItem(this.soundModeStorageKey) || '', 10);
            if (raw === 1 || raw === 2 || raw === 3) {
                return raw;
            }
        } catch (e) {}
        return 2; // Default Stufe 2: Normal (selten gleichzeitig)
    }

    getSoundChaosLevel() {
        return this.soundChaosLevel || 2;
    }

    setSoundChaosLevel(level) {
        const parsed = parseInt(level, 10);
        const clamped = (parsed === 1 || parsed === 2 || parsed === 3) ? parsed : 2;
        this.soundChaosLevel = clamped;
        try {
            localStorage.setItem(this.soundModeStorageKey, String(clamped));
        } catch (e) {}
        if (clamped === 1 && this.activeVoices.size > 1) {
            const keepFirst = this.activeVoices.values().next().value;
            for (const v of Array.from(this.activeVoices)) {
                if (v !== keepFirst) {
                    try { v.pause(); v.currentTime = 0; } catch (e) {}
                    this.activeVoices.delete(v);
                }
            }
        }
        return clamped;
    }

    loadMenuMusicPreference() {
        try {
            const saved = localStorage.getItem(this.menuMusicStorageKey);
            if (saved && this.musicTracks.includes(saved)) {
                return saved;
            }
        } catch (e) {}
        return this.defaultMenuMusic;
    }

    getMusicCatalog() {
        return this.musicCatalog;
    }

    getMenuMusic() {
        if (!this.selectedMenuMusic || !this.musicTracks.includes(this.selectedMenuMusic)) {
            this.selectedMenuMusic = this.defaultMenuMusic;
        }
        return this.selectedMenuMusic;
    }

    setMenuMusic(src, playNow = true) {
        if (!src || !this.musicTracks.includes(src)) return this.getMenuMusic();
        this.selectedMenuMusic = src;
        try {
            localStorage.setItem(this.menuMusicStorageKey, src);
        } catch (e) {}
        if (playNow && this.enabled) {
            this.playMusic(src);
        }
        return src;
    }

    cycleMenuMusic(delta = 1) {
        const cur = this.getMenuMusic();
        const idx = Math.max(0, this.musicTracks.indexOf(cur));
        const nextIdx = (idx + delta + this.musicTracks.length) % this.musicTracks.length;
        return this.setMenuMusic(this.musicTracks[nextIdx], true);
    }

    playIntroTechiChime() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const chord = [261.63, 392.0, 523.25, 659.25];
            chord.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = i === 0 ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.055);
                gain.gain.setValueAtTime(0.001, now + i * 0.055);
                gain.gain.exponentialRampToValueAtTime(0.11, now + i * 0.055 + 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.055);
                osc.stop(now + 1.0);
            });
        } catch (e) {}
    }

    fadeOutAllClips(durationMs = 450) {
        if (this.activeVoices.size === 0) return;
        const voices = Array.from(this.activeVoices);
        const steps = 8;
        const stepMs = Math.max(20, Math.round(durationMs / steps));
        let tick = 0;
        const timer = setInterval(() => {
            tick++;
            const factor = Math.max(0, 1 - tick / steps);
            for (const v of voices) {
                try {
                    v.volume = Math.max(0, Math.min(1, v.volume * factor));
                } catch (e) {}
            }
            if (tick >= steps) {
                clearInterval(timer);
                for (const v of voices) {
                    try {
                        v.pause();
                        v.currentTime = 0;
                    } catch (e) {}
                    this.activeVoices.delete(v);
                }
            }
        }, stepMs);
    }

    playMusicForLevel(levelNum) {
        if (!this.enabled) return;
        const index = levelNum % this.musicTracks.length;
        this.playMusic(this.musicTracks[index]);
    }

    playMenuMusic(srcOverride = null) {
        if (!this.enabled) return;
        const track = srcOverride || this.getMenuMusic();
        this.playMusic(track);
    }

    stopMusic() {
        if (this.currentMusic) {
            try {
                this.currentMusic.pause();
                this.currentMusic.currentTime = 0;
            } catch (e) {}
            this.currentMusic = null;
            this.currentMusicSrc = '';
        }
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
