/**
 * Thenerean Selvabankumar - Audio Engine Enhanced
 * Handles background music with intelligent fading (lowers or mutes at boss encounter)
 * and rich video voice lines / meme audio clips.
 */

class SoundManager {
    constructor() {
        this.enabled = true;
        this.currentMusic = null;
        this.musicVolume = 0.45;
        this.targetMusicVolume = 0.45;

        // Music files
        this.musicTracks = [
            'assets/music/That_s_The_One.mp3',
            'assets/music/Sirünän_Silicancumar.mp3',
            'assets/music/Thanuran_Takeover.mp3',
            'assets/music/Chasin_Dreams_Tharunan_s_Theme_.mp3',
            'assets/music/Echoes_of_Tharunan.mp3',
            'assets/music/Sivassklicumar_Morning.mp3',
            'assets/music/Sirünän_Reign.mp3'
        ];

        // Sound clips cut directly from the videos
        this.clips = {
            // Herr Adam
            adam_silvankumar: new Audio('assets/audio/adam_silvankumar.mp3'),
            adam_20_frisbees: new Audio('assets/audio/adam_20_frisbees.mp3'),
            adam_frisbee: new Audio('assets/audio/adam_frisbees.mp3'),
            adam_hilf_mir: new Audio('assets/audio/adam_hilf_mir.mp3'),

            // Monika Schneider
            monika_zspaet: new Audio('assets/audio/monika_zspaet_nuet_disp.mp3'),
            monika_gang_platz: new Audio('assets/audio/monika_gang_platz_short.mp3'),
            monika_puenktlichkeit: new Audio('assets/audio/monika_puenktlichkeit.mp3'),
            monika_schuld: new Audio('assets/audio/monika_schuld.mp3'),
            monika_ganz_ruhig: new Audio('assets/audio/monika_ganz_ruhig.mp3'),

            // Thenerean Selvabankumar
            thenerean_stah: new Audio('assets/audio/thenerean_stah_doch_da.mp3'),
            thenerean_entschuldigung: new Audio('assets/audio/thenerean_entschuldigung.mp3'),
            thenerean_254: new Audio('assets/audio/thenerean_254_spaeter.mp3'),
            thenerean_gesetz: new Audio('assets/audio/thenerean_gesetzestext.mp3'),
            thenerean_verdammt_maschine: new Audio('assets/audio/thenerean_verdammt_maschine.mp3'),
            thenerean_gpu: new Audio('assets/audio/thenerean_gpu_fehler.mp3'),
            thenerean_raste_aus: new Audio('assets/audio/thenerean_raste_aus.mp3'),
            thenerean_tuktuk: new Audio('assets/audio/thenerean_tuktuk_ride.mp3'),
            thenerean_bankomat: new Audio('assets/audio/thenerean_selber_bankomat.mp3'),
            thenerean_ultra: new Audio('assets/audio/thenerean_ultra_shout.mp3'),
            thenerean_sport_spaet: new Audio('assets/audio/thenerean_sport_spaet.mp3')
        };

        // Synthesizer Web Audio API for action FX
        this.initWebAudio();

        // Volume fade monitor
        setInterval(() => this.updateMusicFade(), 80);
    }

    initWebAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!this.ctx) {
                this.ctx = new AudioContext();
            }
        } catch (e) {
            console.warn("Web Audio not supported", e);
        }
    }

    // Play synthesized quick sound effects
    playJump() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(500, now + 0.14);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
            osc.start(now);
            osc.stop(now + 0.14);
        } catch(e) {}
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
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.setValueAtTime(739.99, now + 0.07); // F#5
            osc.frequency.setValueAtTime(880.00, now + 0.14); // A5
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } catch(e) {}
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
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.linearRampToValueAtTime(45, now + 0.18);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch(e) {}
    }

    playThrow() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'triangle';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(480, now);
            osc.frequency.linearRampToValueAtTime(260, now + 0.1);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } catch(e) {}
    }

    playMegaBeam() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'square';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.35);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } catch(e) {}
    }

    playClip(name, onEnded = null) {
        if (!this.enabled) return;
        const clip = this.clips[name];
        if (clip) {
            clip.currentTime = 0;
            clip.volume = 1.0;
            clip.play().catch(e => console.log('Autoplay audio waiting for interaction'));
            if (onEnded) {
                clip.onended = onEnded;
            }
        }
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
        if (!this.enabled) return;
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
        this.currentMusic = new Audio(src);
        this.currentMusic.loop = true;
        this.musicVolume = 0.45;
        this.targetMusicVolume = 0.45;
        this.currentMusic.volume = this.musicVolume;
        this.currentMusic.play().catch(e => console.log("Music click required"));
    }

    // Dynamic music volume: fade out / lower when encountering boss
    setMusicQuietMode(quiet = true) {
        if (quiet) {
            // Mute or quiet down so boss dialogue & voices are super clear!
            this.targetMusicVolume = 0.05;
        } else {
            this.targetMusicVolume = 0.45;
        }
    }

    updateMusicFade() {
        if (!this.currentMusic) return;
        if (Math.abs(this.musicVolume - this.targetMusicVolume) > 0.02) {
            if (this.musicVolume < this.targetMusicVolume) {
                this.musicVolume = Math.min(this.targetMusicVolume, this.musicVolume + 0.04);
            } else {
                this.musicVolume = Math.max(this.targetMusicVolume, this.musicVolume - 0.05);
            }
            this.currentMusic.volume = Math.max(0, Math.min(1, this.musicVolume));
        }
    }

    toggleMute() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            if (this.currentMusic) this.currentMusic.pause();
            Object.values(this.clips).forEach(c => c.pause());
        } else {
            if (this.currentMusic) this.currentMusic.play();
        }
        return this.enabled;
    }
}

window.soundManager = new SoundManager();
