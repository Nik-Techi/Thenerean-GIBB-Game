/**
 * Thenerean Selvabankumar - Audio Engine
 * Handles background music from the local folder and custom voice clips
 */

class SoundManager {
    constructor() {
        this.enabled = true;
        this.currentMusic = null;
        this.musicTracks = [
            'assets/music/Chasin_Dreams_Tharunan_s_Theme_.mp3',
            'assets/music/Echoes_of_Tharunan.mp3',
            'assets/music/Sirünän_Reign.mp3',
            'assets/music/Sirünän_Silicancumar.mp3',
            'assets/music/Sivassklicumar_Morning.mp3',
            'assets/music/Thanuran_Takeover.mp3',
            'assets/music/Tharunan_Sivakumar_Bless_Their_Heart_.mp3',
            'assets/music/That_s_The_One.mp3',
            'assets/music/Thärünen_Silicucumbercumar.mp3'
        ];
        this.currentTrackIndex = 0;

        // Sound clips cut directly from the videos
        this.clips = {
            adam_silvankumar: new Audio('assets/audio/adam_silvankumar.mp3'),
            thenerean_stah: new Audio('assets/audio/thenerean_stah_doch_da.mp3'),
            monika_puenktlichkeit: new Audio('assets/audio/monika_puenktlichkeit.mp3'),
            monika_gang_platz: new Audio('assets/audio/monika_gang_uf_platz.mp3'),
            thenerean_entschuldigung: new Audio('assets/audio/thenerean_entschuldigung.mp3'),
            thenerean_srilanka: new Audio('assets/audio/thenerean_srilanka.mp3'),
            adam_hilf_mir: new Audio('assets/audio/adam_hilf_mir.mp3'),
            thenerean_grafikkarte: new Audio('assets/audio/thenerean_grafikkarte.mp3'),
            adam_frisbee: new Audio('assets/audio/adam_frisbees.mp3'),
            thenerean_gesetz: new Audio('assets/audio/thenerean_gesetzestext.mp3'),
            monika_ganz_ruhig: new Audio('assets/audio/monika_ganz_ruhig.mp3')
        };

        // Synthesized sound effects (Web Audio API)
        this.initWebAudio();
    }

    initWebAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        } catch (e) {
            console.warn("Web Audio not supported", e);
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
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
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
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
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
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.2);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } catch(e) {}
    }

    playThrow() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(200, now + 0.12);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } catch(e) {}
    }

    playClip(name, onEnded = null) {
        if (!this.enabled) return;
        const clip = this.clips[name];
        if (clip) {
            clip.currentTime = 0;
            clip.volume = 1.0;
            clip.play().catch(e => console.log('Audio autoplay blocked, click needed.'));
            if (onEnded) {
                clip.onended = onEnded;
            }
        }
    }

    playMusicForLevel(levelNum) {
        if (!this.enabled) return;
        const index = (levelNum - 1) % this.musicTracks.length;
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
        this.currentMusic.volume = 0.45;
        this.currentMusic.play().catch(e => {
            console.log("Music play waiting for user gesture.");
        });
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
