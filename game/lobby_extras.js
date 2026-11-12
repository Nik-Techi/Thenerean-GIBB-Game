/**
 * Thenerean Selvabankumar — lobby & training extras
 *
 *  1. Song timeline under the lobby music picker (seek, ±10s).
 *  2. Training opponent picker: besides the punching dummy, every boss can be fought
 *     in the training room with full AI. Nobody dies for good in there — a defeated
 *     opponent comes back, and Thenerean gets back up as well.
 */

// =========================================================================
// 1. LOBBY SONG TIMELINE
// =========================================================================
const MusicTimeline = {
    fmt(sec) {
        const s = Math.max(0, Math.floor(sec || 0));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    },

    init() {
        const el = {
            row: document.getElementById('lobby-music-timeline'),
            seek: document.getElementById('slider-music-seek'),
            cur: document.getElementById('music-time-current'),
            total: document.getElementById('music-time-total'),
            back: document.getElementById('btn-music-rewind'),
            fwd: document.getElementById('btn-music-forward')
        };
        if (!el.row || !el.seek) return;
        const sm = window.soundManager;
        let dragging = false;
        const audio = () => sm.currentMusic;
        const jump = (delta) => {
            const a = audio();
            if (!a || !isFinite(a.duration)) return;
            // The lobby track loops, so skipping wraps around both ends
            a.currentTime = (a.currentTime + delta + a.duration) % a.duration;
            refresh();
        };
        const refresh = () => {
            const a = audio();
            const ready = Boolean(a && isFinite(a.duration) && a.duration > 0);
            el.seek.disabled = !ready;
            if (!ready) return;
            if (el.seek.max !== String(a.duration)) el.seek.max = String(a.duration);
            if (!dragging) el.seek.value = String(a.currentTime);
            el.cur.textContent = MusicTimeline.fmt(dragging ? Number(el.seek.value) : a.currentTime);
            el.total.textContent = MusicTimeline.fmt(a.duration);
        };

        el.seek.addEventListener('pointerdown', () => { dragging = true; });
        el.seek.addEventListener('input', () => {
            dragging = true;
            el.cur.textContent = MusicTimeline.fmt(Number(el.seek.value));
        });
        el.seek.addEventListener('change', () => {
            const a = audio();
            if (a && isFinite(a.duration)) a.currentTime = Math.min(a.duration - 0.2, Number(el.seek.value));
            dragging = false;
            el.seek.blur();
            refresh();
        });
        el.back.addEventListener('click', () => { sm.initWebAudio(); jump(-10); });
        el.fwd.addEventListener('click', () => { sm.initWebAudio(); jump(10); });

        setInterval(() => {
            if (window.game && window.game.state === GAME_STATE.MENU) refresh();
        }, 250);
    }
};

// =========================================================================
// 2. TRAINING OPPONENT PICKER
// =========================================================================
const TRAINING_OPPONENTS = [
    { key: 'dummy', icon: '🎯', label: 'Puppe' },
    { key: 'student', icon: '🎒', label: 'GIBB Schüler', primary: { name: 'Average GIBB Schüler', type: 'gibb_student', hp: 320, avatar: 'assets/sprites/gibb_student_avatar.png' } },
    { key: 'monika', icon: '📢', label: 'Monika', primary: { name: 'Monika Schneider', type: 'monika', hp: 520, avatar: 'assets/sprites/monika_avatar.png' } },
    { key: 'adam', icon: '🥏', label: 'Herr Adam', primary: { name: 'Herr Adam', type: 'adam', hp: 560, avatar: 'assets/sprites/adam_avatar.png' } },
    { key: 'sahur', icon: '🪵', label: 'Tung Sahur', primary: { name: 'Tung Tung Tung Sahur', type: 'tung_sahur', hp: 600, avatar: 'assets/sprites/sahur_avatar.png' } },
    { key: 'tuktuk', icon: '🛺', label: 'TukTuk MK-I', primary: { name: 'TukTuk MK-I', type: 'tuktuk_gpu', hp: 650, avatar: 'assets/sprites/tuktuk_avatar.png' } },
    { key: 'dual', icon: '🔥', label: 'Dual-GPU MK-II', primary: { name: 'Dual-GPU TukTuk MK-II', type: 'tuktuk_dual_gpu', hp: 760, avatar: 'assets/sprites/tuktuk_dual_avatar.png' } },
    {
        key: 'duo', icon: '👥', label: 'Monika + Adam',
        primary: { name: 'Monika Schneider', type: 'monika', hp: 480, avatar: 'assets/sprites/monika_avatar.png' },
        partner: { name: 'Herr Adam', type: 'adam', hp: 460, avatar: 'assets/sprites/adam_avatar.png' }
    }
];

const Training = {
    buildTrainingLevel() {
        const opp = TRAINING_OPPONENTS.find((o) => o.key === this.trainingOpponent) || TRAINING_OPPONENTS[1];
        const wave = { title: `🎯 TRAINING: ${opp.label.toUpperCase()}`, banner: `🎯 TRAININGSKAMPF GEGEN ${opp.label.toUpperCase()}!`, primary: opp.primary };
        if (opp.partner) wave.partner = opp.partner;
        return {
            id: 0,
            training: true,
            chapter: 1,
            yearText: '🎯 TRAINING',
            name: `Trainingskampf: ${opp.label}`,
            mode: 'wave_rush',
            hasBoss: true,
            bgType: 'gym_turnhalle',
            bgPath: 'assets/backgrounds/bg_gym_turnhalle.jpg',
            accentColor: '#f39c12',
            ambientStyle: 'gym',
            targetDistance: 0,
            music: 'assets/music/Thanuran_Takeover.mp3',
            waves: [wave],
            mechanics: { platforms: true, duckObstacles: false, lavaPits: false, sprintPads: false, platformStyle: 'gym_box' },
            bossType: opp.primary.type,
            bossName: opp.primary.name,
            bossAvatar: opp.primary.avatar,
            bossHP: opp.primary.hp,
            bossLines: [],
            playerLines: [],
            obstacleTypes: [],
            collectibleTypes: []
        };
    },

    isTraining() {
        return Boolean(this.level && this.level.training);
    },

    pickTrainingOpponent(key) {
        this.trainingOpponent = key;
        this.trainingRound = 1;
        if (key === 'dummy') this.startDemoMode();
        else this.startLevel('training');
    },

    buildTrainingPicker() {
        const el = document.createElement('div');
        el.id = 'training-picker';
        el.className = 'training-picker hidden';
        el.innerHTML = '<span class="training-picker-title">GEGNER WÄHLEN</span>' + TRAINING_OPPONENTS.map((o) =>
            `<button type="button" class="training-chip" data-opp="${o.key}"><span>${o.icon}</span>${o.label}</button>`).join('');
        document.getElementById('game-container').appendChild(el);
        el.querySelectorAll('.training-chip').forEach((btn) => {
            // Keep keyboard focus on the game so SPACE / ENTER never re-trigger a chip
            btn.addEventListener('mousedown', (e) => e.preventDefault());
            btn.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                this.pickTrainingOpponent(btn.getAttribute('data-opp'));
                btn.blur();
            });
        });
        this.trainingPickerEl = el;
        this.trainingOpponent = 'dummy';
    },

    syncTrainingPicker() {
        const el = this.trainingPickerEl;
        if (!el) return;
        const fighting = this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.RUNNING;
        const show = this.state === GAME_STATE.DEMO || (this.isTraining() && fighting);
        if (el.classList.contains('hidden') === show) el.classList.toggle('hidden', !show);
        if (!show) return;
        const active = this.state === GAME_STATE.DEMO ? 'dummy' : this.trainingOpponent;
        if (el.dataset.active !== active) {
            el.dataset.active = active;
            el.querySelectorAll('.training-chip').forEach((b) => b.classList.toggle('active', b.getAttribute('data-opp') === active));
        }
    }
};

Object.assign(Game.prototype, Training);

(function wrapLobbyExtras() {
    const P = Game.prototype;
    const wrap = (name, fn) => {
        const orig = P[name];
        P[name] = function (...args) { return fn.call(this, orig.bind(this), ...args); };
    };

    wrap('initUIEventListeners', function (orig) {
        orig();
        MusicTimeline.init();
        this.buildTrainingPicker();
    });

    wrap('startLevel', function (orig, index) {
        orig(index);
        if (this.isTraining()) {
            if (this.ui.btnDemoExit) this.ui.btnDemoExit.classList.remove('hidden');
            this.ui.progValText.textContent = `RUNDE ${this.trainingRound || 1}`;
        }
    });

    // Training fights never end: the opponent comes back for another round
    wrap('triggerLevelWin', function (orig) {
        if (!this.isTraining()) return orig();
        this.trainingRound = (this.trainingRound || 1) + 1;
        this.projectiles = [];
        this.hazards = [];
        this.clearFrisbeeTimers();
        this.startWave(0);
        this.ui.progValText.textContent = `RUNDE ${this.trainingRound}`;
        this.addFloatingText(`BESIEGT! RUNDE ${this.trainingRound}`, canvas.width * 0.5, canvas.height * 0.32, '#2ed573', 30);
    });

    wrap('triggerGameOver', function (orig) {
        if (!this.isTraining()) return orig();
        const p = this.player;
        p.hp = p.maxHp;
        p.invulnerableTime = 120;
        this.projectiles = this.projectiles.filter((pr) => pr.isPlayer);
        this.updateBars();
        this.addFloatingText('K.O. — IM TRAINING STEHST DU WIEDER AUF!', canvas.width * 0.5, canvas.height * 0.32, '#ffd32a', 26);
    });

    // No wages, kill stats or bestiary entries from sparring
    wrap('onEnemyDefeated', function (orig, e) {
        if (!this.isTraining()) orig(e);
    });

    wrap('update', function (orig, dt) {
        orig(dt);
        this.syncTrainingPicker();
    });
})();
