/**
 * Thenerean Selvabankumar - High-End 2D Arcade Engine (Gemini Argon Edition)
 *
 * Features:
 * - Full-viewport responsive 16:9+ canvas scaling (100vw / 100vh)
 * - 3-Layer Seamless Mirrored Parallax Stage Backgrounds for all 10 levels
 * - Crisp Foot-Anchored 2D Sprite Animation System (Idle, Run, Jump, Attack, Windup, Rage)
 * - Comic White-Mask Hit-Flash, Speedlines, Shockwave Rings, Trails & Floating Combat Text
 * - Attack 1 (E): Straight-ahead Gesetzestext (28 DMG, 0.4s Cooldown)
 * - Attack 2 (Q / Shift): "ICH STAH DOCH DA!" Mega Shockwave (70 DMG)
 * - Attack 3 (F): "DA HAST DU 20 FRISBEES!" 20-Frisbee Machine-Gun Barrage (12 DMG x 20)
 * - Boss phases, telegraphed attack patterns & perfect block / shout combo: see boss_ai.js
 * - 14s Meme Opening Intro -> Main Menu -> Demo Training Room -> 24s Story Intro -> 10 GIBB Levels
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Reusable scratch canvas for crisp additive-white hit-flash silhouettes
const flashCanvas = document.createElement('canvas');
const flashCtx = flashCanvas.getContext('2d');

const GAME_STATE = {
    MENU: 0,
    INTRO: 1,
    RUNNING: 2,
    PRE_BOSS_WALK: 3,
    PRE_BOSS_DIALOGUE: 4,
    BOSS_FIGHT: 5,
    LEVEL_WIN: 6,
    GAME_OVER: 7,
    VICTORY: 8,
    DEMO: 9,
    OPENING: 10
};

const DIFFICULTY_ORDER = ['easy', 'normal', 'hard', 'nightmare'];
const DIFFICULTY_PRESETS = {
    easy: {
        key: 'easy',
        icon: '🟢',
        label: 'LEICHT',
        shortLabel: '🟢 LEICHT',
        hpMult: 0.75,
        aggroMult: 0.72,
        speedMult: 0.85,
        projSpeedMult: 0.85,
        dmgMult: 0.75,
        shieldCdMult: 1.45,
        telegraphBonus: 7
    },
    normal: {
        key: 'normal',
        icon: '🔵',
        label: 'NORMAL',
        shortLabel: '🔵 NORMAL',
        hpMult: 1.00,
        aggroMult: 1.00,
        speedMult: 1.00,
        projSpeedMult: 1.00,
        dmgMult: 1.00,
        shieldCdMult: 1.00,
        telegraphBonus: 0
    },
    hard: {
        key: 'hard',
        icon: '🟠',
        label: 'SCHWER',
        shortLabel: '🟠 SCHWER',
        hpMult: 1.30,
        aggroMult: 1.35,
        speedMult: 1.15,
        projSpeedMult: 1.15,
        dmgMult: 1.25,
        shieldCdMult: 0.75,
        telegraphBonus: -4
    },
    nightmare: {
        key: 'nightmare',
        icon: '🔴',
        label: 'EXTREM',
        shortLabel: '🔴 EXTREM',
        hpMult: 1.65,
        aggroMult: 1.65,
        speedMult: 1.30,
        projSpeedMult: 1.28,
        dmgMult: 1.50,
        shieldCdMult: 0.58,
        telegraphBonus: -7
    }
};

const CRAZY_CHAOS_CLIPS = [
    'thenerean_taronuman_scream',
    'tuktuk_taeschfresser_gpu',
    'adam_hilf_mir',
    'student_cringe_king',
    'monika_gang_uf_platz',
    'boss_evil_laugh',
    'thenerean_raste_aus',
    'thenerean_tamil_vbucks',
    'adam_20_frisbees',
    'thenerean_banana_monika',
    'monika_keine_kopfhoerer',
    'thenerean_zspaet_raschtaus'
];

// =========================================================================
// ASSET LOADER (Sprites, Backgrounds, Avatars, Items)
// =========================================================================
const images = {};
const imageSources = {
    // Legacy / Fallback Character Poses
    thenerean_hero: 'assets/sprites/thenerean_hero.png',
    adam_sprite: 'assets/sprites/adam_sprite.png',
    monika_sprite: 'assets/sprites/monika_sprite.png',
    tuktuk_sprite: 'assets/sprites/tuktuk_sprite.png',

    // Character Animation Sheets
    thenerean_idle: 'assets/sprites/characters/thenerean_idle.png',
    thenerean_run: 'assets/sprites/characters/thenerean_run.png',
    thenerean_jump: 'assets/sprites/characters/thenerean_jump.png',
    thenerean_attack: 'assets/sprites/characters/thenerean_attack.png',
    thenerean_block: 'assets/sprites/characters/thenerean_block.png',
    thenerean_duck: 'assets/sprites/characters/thenerean_duck.png',

    monika_idle: 'assets/sprites/characters/monika_idle.png',
    monika_walk: 'assets/sprites/characters/monika_walk.png',
    monika_point: 'assets/sprites/characters/monika_point.png',
    monika_attack: 'assets/sprites/characters/monika_attack.png',

    adam_idle: 'assets/sprites/characters/adam_idle.png',
    adam_run: 'assets/sprites/characters/adam_run.png',
    adam_windup: 'assets/sprites/characters/adam_windup.png',
    adam_throw: 'assets/sprites/characters/adam_throw.png',

    tuktuk_idle: 'assets/sprites/characters/tuktuk_idle.png',
    tuktuk_rage: 'assets/sprites/characters/tuktuk_rage.png',
    tuktuk_dual_idle: 'assets/sprites/characters/tuktuk_dual_idle.png',
    tuktuk_dual_rage: 'assets/sprites/characters/tuktuk_dual_rage.png',

    gibb_student_idle: 'assets/sprites/characters/gibb_student_idle.png',
    gibb_student_walk: 'assets/sprites/characters/gibb_student_walk.png',
    gibb_student_windup: 'assets/sprites/characters/gibb_student_windup.png',
    gibb_student_attack: 'assets/sprites/characters/gibb_student_attack.png',
    gibb_student_sprite: 'assets/sprites/gibb_student_sprite.png',

    // Authentic Real-Photo & Comic Portraits
    thenerean_avatar: 'assets/sprites/thenerean_avatar.png',
    thenerean_shout_avatar: 'assets/sprites/thenerean_shout_avatar.png',
    adam_avatar: 'assets/sprites/adam_avatar.png',
    monika_avatar: 'assets/sprites/monika_avatar.png',
    tuktuk_avatar: 'assets/sprites/tuktuk_avatar.png',
    tuktuk_dual_avatar: 'assets/sprites/tuktuk_dual_avatar.png',
    gibb_student_avatar: 'assets/sprites/gibb_student_avatar.png',

    // Stage Backgrounds (Lobby, Intro Stage + All 10 Levels)
    bg_lobby: 'assets/backgrounds/bg_lobby.jpg',
    bg_intro_stage: 'assets/backgrounds/bg_intro_stage.jpg',
    bg_story_intro_crazy: 'assets/backgrounds/bg_story_intro_crazy.jpg',
    bg_gibb_entrance: 'assets/backgrounds/bg_gibb_entrance.jpg',
    bg_classroom: 'assets/backgrounds/bg_classroom.jpg',
    bg_gym_hallway: 'assets/backgrounds/bg_gym_hallway.jpg',
    bg_gym_turnhalle: 'assets/backgrounds/bg_gym_turnhalle.jpg',
    bg_server_srilanka: 'assets/backgrounds/bg_server_srilanka.jpg',
    bg_abu_room: 'assets/backgrounds/bg_abu_room.jpg',
    bg_mensa_kiosk: 'assets/backgrounds/bg_mensa_kiosk.jpg',
    bg_srilanka_highway: 'assets/backgrounds/bg_srilanka_highway.jpg',
    bg_cyber_bunker: 'assets/backgrounds/bg_cyber_bunker.jpg',
    bg_exam_auditorium: 'assets/backgrounds/bg_exam_auditorium.jpg',

    // HD Cel-Shaded Items, Obstacles & Projectiles
    frisbee: 'assets/sprites/frisbee.png',
    item_gesetz: 'assets/sprites/item_gesetz.png',
    item_coffee: 'assets/sprites/item_coffee.png',
    item_energy: 'assets/sprites/item_energy.png',
    item_diplom: 'assets/sprites/item_diplom.png',
    item_jeton: 'assets/sprites/item_jeton.png',
    projectile_mega: 'assets/sprites/projectile_mega.png',
    basketball: 'assets/sprites/basketball.png',
    red_card: 'assets/sprites/red_card.png',
    whistle: 'assets/sprites/whistle.png',
    traffic_cone: 'assets/sprites/traffic_cone.png',
    broken_cable: 'assets/sprites/broken_cable.png',
    server_stack: 'assets/sprites/server_stack.png',
    item_clock: 'assets/sprites/item_clock.png',
    item_shield: 'assets/sprites/item_shield.png',
    projectile_laptop: 'assets/sprites/projectile_laptop.png',
    energy_can: 'assets/sprites/energy_can.png'
};

for (const [key, src] of Object.entries(imageSources)) {
    const img = new Image();
    img.src = src;
    images[key] = img;
}

class Game {
    constructor() {
        this.state = GAME_STATE.OPENING;
        this.currentLevelIndex = 0;
        this.level = LEVELS_CONFIG[0];

        this.animClock = 0;
        this.screenShake = 0;
        this.radialFlashTimer = 0;
        this.shoutAvatarTimer = 0;
        this.frisbeeTimers = [];
        this.fixedAccumulator = 0;
        this.isPaused = false;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.damageVignetteTimer = 0;
        this.lastDamageReason = null;
        this.difficulty = this.loadDifficultyPreference();
        this.saveData = this.loadSaveData();

        // Player Physics & Combat Stats
        this.player = {
            x: 120,
            y: 400,
            w: 76,
            h: 138,
            vx: 0,
            vy: 0,
            facing: 1,
            speed: 6.8,
            jumpPower: -15.2,
            jumpBuffered: false,
            groundY: 530,
            isGrounded: true,
            standingPlatform: null,
            hp: 150,
            maxHp: 150,
            score: 5.5,
            megaEnergy: 100,
            maxMegaEnergy: 100,
            frisbeeCooldown: 0,
            maxFrisbeeCooldown: 140,
            lawBookCooldown: 0,
            maxLawBookCooldown: 24,
            isBlocking: false,
            blockTimer: 0,
            blockCooldown: 0,
            maxBlockCooldown: 48,
            isDucking: false,
            invulnerableTime: 0,
            hitFlash: 0,
            powerTimer: 0,
            attackAnimTimer: 0,
            banterTimer: 240,
            stunTimer: 0,
            pushVx: 0,
            sprintTimer: 0,
            lastRightTapTime: 0,
            lastSafeWorldX: 0
        };
        this.hazards = [];
        this.platforms = [];
        this.lavaPits = [];
        this.boostPads = [];
        this.midBossTriggered = false;
        this.midBossDefeated = false;
        this.vanguardDefeated = false;
        this.timeRemaining = 0;
        this.lastTickSec = -1;
        this.targets = [];
        this.targetsHit = 0;
        this.targetsTotal = 0;
        this.jetonsCollected = 0;
        this.jetonsTotal = 0;
        this.touchDuckHeld = false;
        this.currentWaveIndex = 0;
        this.chaser = null;
        this.arenaSwitch = null;
        this.floorHazardCooldown = 0;

        const urlParams = new URLSearchParams(window.location.search);
        const platformParam = urlParams.get('platform');
        this.isExplicitDesktop = platformParam === 'desktop';
        const isExplicitAndroid = platformParam === 'android';
        const isMobileOS = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.touchControlsEnabled = !this.isExplicitDesktop && (isExplicitAndroid || isMobileOS);

        this.worldDistance = 0;
        this.menuPan = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.projectiles = [];
        this.particles = [];
        this.shockwaves = [];
        this.floatingTexts = [];
        this.ambientParticles = this.createAmbientParticles(32);

        this.boss = null;
        this.duoPartner = null;

        this.demoComboHits = 0;
        this.demoTotalDamage = 0;
        this.resetCombatExtras();

        // Fullscreen Animated Opening (0–1.8s Made by Techi -> 1.8–11.8s 10s All-Cast Sound Chaos -> Smooth Lobby Transition)
        this.openingExitTimeout = null;
        this.openingState = {
            active: true,
            elapsed: 0,
            techiDuration: 1.8,
            totalDuration: 11.8,
            techiChimePlayed: false,
            chaosEntered: false,
            currentStep: -1
        };

        this.openingSteps = [
            { time: 1.80, cast: 'adam',        title: "⚠️ GIBB ALARM: ABSENZENLISTE!",          quote: "HERR ADAM: 'Silvankumar, ist der Thenerean da?!'",          bubble: "Thenerean da?!",         clip: 'adam_silvankumar',          spark: '🥏', shake: 12, color: '#00d2d3' },
            { time: 2.75, cast: 'thenerean',   title: "🔥 DER LEGENDE-SCHREI!",                 quote: "THENEREAN: 'HERR ADAM, ICH STAH DOCH DA!'",                  bubble: "ICH STAH DOCH DA!",       clip: 'thenerean_stah',            spark: '📜', shake: 20, color: '#ffd32a' },
            { time: 3.70, cast: 'monika',      title: "📢 KEI CHOPFHÖRER IM UNTERRICHT!",        quote: "MONIKA: 'Kei Chopfhörer! Gang uf die Platz!'",                bubble: "Kei Chopfhörer!",        clip: 'monika_keine_kopfhoerer',   spark: '🟥', shake: 15, color: '#a55eea' },
            { time: 4.65, cast: 'student',     title: "📱 TIKTOK CRINGE-ANGRIFF!",               quote: "GIBB SCHÜLER: 'Ich bin der Cringe King von TikTok!'",        bubble: "Cringe King!",           clip: 'student_cringe_king',       spark: '⚡', shake: 14, color: '#38bdf8' },
            { time: 5.60, cast: 'tuktuk',      title: "🛺 TUKTUK MK-I DREHT DURCH!",             quote: "TUKTUK: 'TÄSCHFRESSER!! Grafikkarte überhitzt!'",           bubble: "TÄSCHFRESSER!",          clip: 'tuktuk_taeschfresser_gpu',  spark: '🛺', shake: 18, color: '#ff9f1a' },
            { time: 6.55, cast: 'tuktuk_dual', title: "💥 DUAL-GPU MK-II OVERCLOCK!!",           quote: "DUAL-GPU: 'Isst d'Melone mit zwei RTX Grafikkarten!'",       bubble: "ZWEI RTX GPUs!",         clip: 'tuktuk_gpu_melone',         spark: '🔥', shake: 22, color: '#ff4757' },
            { time: 7.50, cast: 'adam',        title: "⚽ SCHUSS VERPASST — STRAFE!",             quote: "HERR ADAM: 'Du hesch de Schuss verpasst — Strafe!'",         bubble: "Strafe defür!",          clip: 'adam_strafe_verpasst',      spark: '🏀', shake: 16, color: '#00d2d3' },
            { time: 8.45, cast: 'monika',      title: "📝 EFZ KONTROLLE!",                       quote: "MONIKA: 'Selberbank! Si müend das korrigiere!'",             bubble: "Korrigiere!!",           clip: 'monika_adam_korrigiere',    spark: '📘', shake: 16, color: '#a55eea' },
            { time: 9.40, cast: 'thenerean',   title: "💢 TOTALES SOUND-CHAOS!!",                quote: "THENEREAN: 'Z'SPÄT?! ICH RASCHT COMPLETELY US!'",             bubble: "ICH RASCHT US!!",        clip: 'thenerean_zspaet_raschtaus',spark: '💢', shake: 22, color: '#ffd32a' },
            { time: 10.45, cast: 'all',        title: "👑 TARONUMAN!! BEREIT FÜR DIE LOBBY?!",    quote: "ALLE: 'NIEMERT CHUNT AN MIR VERBI!! MWAHAHAHA!'",            bubble: "TARONUMAN!!",            clip: 'thenerean_taronuman_scream', extraClip: 'boss_evil_laugh', spark: '💥', shake: 26, color: '#2ed573' }
        ];

        // Fullscreen Crazy Random-Conversation Story Intro
        this.introState = {
            active: false,
            elapsed: 0,
            beatElapsed: 0,
            totalDuration: 22.0,
            currentStep: 0,
            beats: []
        };

        this.dialogueQueue = [];
        this.elapsedSeconds = 0;

        // Cache DOM References
        this.ui = {
            bar: document.getElementById('ui-bar'),
            playerAvatarWrap: document.getElementById('player-avatar-wrap'),
            playerAvatar: document.getElementById('player-avatar'),
            hpBar: document.getElementById('hp-bar'),
            hpValText: document.getElementById('hp-val-text'),
            energyBar: document.getElementById('energy-bar'),
            energyValText: document.getElementById('energy-val-text'),
            progBar: document.getElementById('progress-bar'),
            progValText: document.getElementById('prog-val-text'),
            yearBadge: document.getElementById('current-year-badge'),
            lvlName: document.getElementById('level-name'),
            scoreVal: document.getElementById('score-val'),
            timeVal: document.getElementById('time-val'),
            btnDemoExit: document.getElementById('btn-demo-exit'),
            btnPauseToggle: document.getElementById('btn-pause-toggle'),
            hudStatusPills: document.getElementById('hud-status-pills'),
            hudComboPill: document.getElementById('hud-combo-pill'),
            hudComboVal: document.getElementById('hud-combo-val'),
            hudPowerPill: document.getElementById('hud-power-pill'),
            hudPowerSec: document.getElementById('hud-power-sec'),
            missionPill: document.getElementById('mission-pill'),
            missionIcon: document.getElementById('mission-icon'),
            missionText: document.getElementById('mission-text'),

            bossHudBanner: document.getElementById('boss-hud-banner'),
            bossHudAvatar: document.getElementById('boss-hud-avatar'),
            bossHudName: document.getElementById('boss-hud-name'),
            bossHudHpText: document.getElementById('boss-hud-hp-text'),
            bossHudFill: document.getElementById('boss-hud-fill'),
            bossPartnerRow: document.getElementById('boss-partner-row'),
            bossPartnerName: document.getElementById('boss-partner-name'),
            bossPartnerFill: document.getElementById('boss-partner-fill'),
            bossPartnerHpText: document.getElementById('boss-partner-hp-text'),
            bossPartnerAvatar: document.getElementById('boss-partner-avatar'),

            demoComboHud: document.getElementById('demo-combo-hud'),
            demoHitsVal: document.getElementById('demo-hits-val'),
            demoDmgVal: document.getElementById('demo-dmg-val'),

            abilityDock: document.getElementById('ability-dock'),
            slotGesetz: document.getElementById('slot-gesetz'), slotMega: document.getElementById('slot-mega'),
            slotFrisbee: document.getElementById('slot-frisbee'),
            slotShield: document.getElementById('slot-shield'),
            hudGesetzFill: document.getElementById('hud-gesetz-fill'), hudEnergyFill: document.getElementById('hud-energy-fill'),
            hudFrisbeeFill: document.getElementById('hud-frisbee-fill'),
            hudShieldFill: document.getElementById('hud-shield-fill'),
            controlHintPill: document.getElementById('control-hint-pill'),

            btnTouchToggle: document.getElementById('btn-touch-toggle'),
            touchOverlay: document.getElementById('mobile-touch-overlay'),
            touchBtnLeft: document.getElementById('touch-btn-left'),
            touchBtnRight: document.getElementById('touch-btn-right'),
            touchBtnJump: document.getElementById('touch-btn-jump'),
            touchBtnDuck: document.getElementById('touch-btn-duck'),
            touchBtnBlock: document.getElementById('touch-btn-block'),
            touchBtnAttack: document.getElementById('touch-btn-attack'),
            touchBtnMega: document.getElementById('touch-btn-mega'),
            touchBtnFrisbee: document.getElementById('touch-btn-frisbee'),
            touchBtnSprint: document.getElementById('touch-btn-sprint'),
            touchGesetzFill: document.getElementById('touch-gesetz-fill'),
            touchShieldFill: document.getElementById('touch-shield-fill'),
            touchMegaFill: document.getElementById('touch-mega-fill'),
            touchFrisbeeFill: document.getElementById('touch-frisbee-fill'),

            btnMusicToggle: document.getElementById('btn-music-toggle'),
            sliderMusicVol: document.getElementById('slider-music-vol'),
            labelMusicVol: document.getElementById('label-music-vol'),
            btnMenuMusicToggle: document.getElementById('btn-menu-music-toggle'),
            sliderMenuMusicVol: document.getElementById('slider-menu-music-vol'),
            labelMenuMusicVol: document.getElementById('label-menu-music-vol'),
            btnMenuSoundToggle: document.getElementById('btn-menu-sound-toggle'),

            dialogueBox: document.getElementById('dialogue-box'),
            dialogueAvatar: document.getElementById('dialogue-avatar'),
            dialogueSpeaker: document.getElementById('dialogue-speaker'),
            dialogueText: document.getElementById('dialogue-text'),
            memePopup: document.getElementById('meme-popup'),
            memeText: document.getElementById('meme-text'),

            screenOpening: document.getElementById('screen-opening'),
            openingTechiSplash: document.getElementById('opening-techi-splash'),
            openingChaosStage: document.getElementById('opening-chaos-stage'),
            openingFxLayer: document.getElementById('opening-fx-layer'),
            openingCastSlots: document.querySelectorAll('#opening-chaos-stage .cast-slot'),
            openingFlashText: document.getElementById('opening-flash-text'),
            openingShoutBanner: document.getElementById('opening-shout-banner'),
            openingProgress: document.getElementById('opening-progress'),
            openingCountdownTxt: document.getElementById('opening-countdown-txt'),
            btnSkipOpening: document.getElementById('btn-skip-opening'),
            btnReplayOpening: document.getElementById('btn-replay-opening'),
            selectMenuMusic: document.getElementById('select-menu-music'),
            btnMusicPrev: document.getElementById('btn-music-prev'),
            btnMusicNext: document.getElementById('btn-music-next'),

            screenMenu: document.getElementById('screen-menu'),
            screenPrestart: document.getElementById('screen-prestart'),
            screenIntro: document.getElementById('screen-intro'),
            screenLvlSelect: document.getElementById('screen-level-select'),
            screenStory: document.getElementById('screen-story'),
            screenWin: document.getElementById('screen-win'),
            screenPause: document.getElementById('screen-pause'),
            screenLose: document.getElementById('screen-lose'),
            screenVictory: document.getElementById('screen-victory'),
            btnClosePrestart: document.getElementById('btn-close-prestart'),
            btnPrestartDirect: document.getElementById('btn-prestart-direct'),
            btnPrestartLaunch: document.getElementById('btn-prestart-launch'),
            btnLvlDiffCycle: document.getElementById('btn-lvl-diff-cycle'),
            btnLvlSoundCycle: document.getElementById('btn-lvl-sound-cycle'),
            winDesc: document.getElementById('win-desc'),
            winGrade: document.getElementById('win-grade'),
            winHp: document.getElementById('win-hp'),
            winTime: document.getElementById('win-time'),
            winCombo: document.getElementById('win-combo'),
            btnNextLvl: document.getElementById('btn-next-lvl'),
            pauseLevelInfo: document.getElementById('pause-level-info'),
            loseBadge: document.getElementById('lose-badge'),
            loseTitle: document.getElementById('lose-title'),
            loseReason: document.getElementById('lose-reason'),
            loseQuote: document.getElementById('lose-quote'),
            campaignSummary: document.getElementById('campaign-summary'),

            introBgImg: document.getElementById('intro-bg-img'),
            introFxLayer: document.getElementById('intro-fx-layer'),
            introEpisodeBadge: document.getElementById('intro-episode-badge'),
            introSettingsBadge: document.getElementById('intro-settings-badge'),
            introStepTitle: document.getElementById('intro-step-title'),
            introSpeechText: document.getElementById('intro-speech-text'),
            introActorLeft: document.getElementById('intro-actor-left'),
            introBubbleLeft: document.getElementById('intro-bubble-left'),
            introSpeakerLeft: document.getElementById('intro-speaker-left'),
            introLineLeft: document.getElementById('intro-line-left'),
            introSpriteLeft: document.getElementById('intro-sprite-left'),
            introTagLeft: document.getElementById('intro-tag-left'),
            introActorRight: document.getElementById('intro-actor-right'),
            introBubbleRight: document.getElementById('intro-bubble-right'),
            introSpeakerRight: document.getElementById('intro-speaker-right'),
            introLineRight: document.getElementById('intro-line-right'),
            introSpriteRight: document.getElementById('intro-sprite-right'),
            introTagRight: document.getElementById('intro-tag-right'),
            introCenterStamp: document.getElementById('intro-center-stamp'),
            introStampEmoji: document.getElementById('intro-stamp-emoji'),
            introQuote: document.getElementById('intro-quote'),
            introTimerBar: document.getElementById('intro-timer-bar'),
            introTimeHint: document.getElementById('intro-time-hint'),
            btnRerollIntro: document.getElementById('btn-reroll-intro'),
            btnNextIntro: document.getElementById('btn-next-intro'),
            btnSkipIntro: document.getElementById('btn-skip-intro'),
            introDots: document.querySelectorAll('#intro-chapter-dots .chap-dot'),
            lobbyQuoteBubble: document.getElementById('lobby-quote-bubble')
        };

        if (this.isExplicitDesktop) {
            if (this.ui.touchOverlay) this.ui.touchOverlay.remove();
            if (this.ui.btnTouchToggle) this.ui.btnTouchToggle.remove();
            this.ui.touchOverlay = null;
            this.ui.btnTouchToggle = null;
            this.touchControlsEnabled = false;
            document.body.classList.remove('touch-active');
        }

        this.keys = {};
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.initInput();
        this.initUIEventListeners();
        this.syncSetupControlsUI();

        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    // =====================================================================
    // SCHWIERIGKEIT & 3-STUFEN SOUND-CHAOS PREFERENZEN
    // =====================================================================
    loadDifficultyPreference() {
        try {
            const raw = localStorage.getItem('thenerean_difficulty_v1');
            if (raw && DIFFICULTY_PRESETS[raw]) return raw;
        } catch (e) {}
        return 'normal';
    }

    getActiveDifficulty() {
        return DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
    }

    setDifficulty(key) {
        if (!DIFFICULTY_PRESETS[key]) return this.difficulty;
        this.difficulty = key;
        try {
            localStorage.setItem('thenerean_difficulty_v1', key);
        } catch (e) {}
        this.syncSetupControlsUI();
        if (this.ui.screenLvlSelect && !this.ui.screenLvlSelect.classList.contains('hidden')) {
            this.populateLevelSelectGrid();
        }
        return key;
    }

    cycleDifficulty() {
        const idx = DIFFICULTY_ORDER.indexOf(this.difficulty);
        const next = DIFFICULTY_ORDER[(idx + 1) % DIFFICULTY_ORDER.length];
        return this.setDifficulty(next);
    }

    getSoundChaosLevel() {
        return window.soundManager ? window.soundManager.getSoundChaosLevel() : 2;
    }

    setSoundChaosLevel(level) {
        const next = window.soundManager ? window.soundManager.setSoundChaosLevel(level) : 2;
        this.syncSetupControlsUI();
        return next;
    }

    cycleSoundChaosLevel() {
        const cur = this.getSoundChaosLevel();
        const next = cur >= 3 ? 1 : cur + 1;
        return this.setSoundChaosLevel(next);
    }

    scaleBossHP(baseHp) {
        const diff = this.getActiveDifficulty();
        return Math.max(50, Math.round((baseHp || 200) * (diff.hpMult || 1)));
    }

    syncSetupControlsUI() {
        const diff = this.getActiveDifficulty();
        const tier = this.getSoundChaosLevel();
        const soundLabels = {
            1: '🔈 STUFE 1 • RUHIG',
            2: '🔉 STUFE 2 • NORMAL',
            3: '📢 STUFE 3 • CRAZY!'
        };
        const soundShort = {
            1: '🔈 STUFE 1',
            2: '🔉 STUFE 2',
            3: '📢 STUFE 3'
        };

        document.querySelectorAll('.diff-opt[data-diff]').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-diff') === diff.key);
        });
        document.querySelectorAll('.sound-opt[data-sound-tier]').forEach((btn) => {
            btn.classList.toggle('active', parseInt(btn.getAttribute('data-sound-tier'), 10) === tier);
        });
        if (this.ui.btnLvlDiffCycle) {
            this.ui.btnLvlDiffCycle.textContent = diff.shortLabel;
        }
        if (this.ui.btnLvlSoundCycle) {
            this.ui.btnLvlSoundCycle.textContent = soundShort[tier] || '🔉 STUFE 2';
        }
        if (this.ui.introSettingsBadge) {
            this.ui.introSettingsBadge.textContent = `${diff.shortLabel} • ${soundLabels[tier] || '🔉 STUFE 2'}`;
        }
    }

    openPreStartModal() {
        this.syncSetupControlsUI();
        if (this.ui.screenMenu) this.ui.screenMenu.classList.add('hidden');
        if (this.ui.screenStory) this.ui.screenStory.classList.add('hidden');
        if (this.ui.screenLvlSelect) this.ui.screenLvlSelect.classList.add('hidden');
        if (this.ui.screenPrestart) this.ui.screenPrestart.classList.remove('hidden');
    }

    closePreStartModal() {
        if (this.ui.screenPrestart) this.ui.screenPrestart.classList.add('hidden');
        if (this.ui.screenMenu) this.ui.screenMenu.classList.remove('hidden');
    }

    pickRandomChaosClip() {
        return CRAZY_CHAOS_CLIPS[Math.floor(Math.random() * CRAZY_CHAOS_CLIPS.length)];
    }

    isTukTukType(type) {
        return type === 'tuktuk_gpu' || type === 'tuktuk_dual_gpu';
    }

    syncDuckFromInputs() {
        const k = this.keys || {};
        this.player.isDucking = Boolean(
            k['control'] || k['ControlLeft'] || k['ControlRight'] ||
            k['arrowdown'] || k['c'] || this.touchDuckHeld
        );
    }

    resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const scale = Math.max(0.78, Math.min(1.38, canvas.height / 720));
        const newGroundY = canvas.height * 0.74;
        const oldGroundY = this.player ? this.player.groundY : newGroundY;
        if (this.player) {
            this.player.groundY = newGroundY;
            this.player.h = Math.round(146 * scale);
            this.player.w = Math.round(78 * scale);
            if (this.player.isGrounded && Math.abs((this.player.y + this.player.h) - oldGroundY) < 8) {
                this.player.y = newGroundY - this.player.h;
            }
        }
        if (this.platforms) {
            for (const plat of this.platforms) {
                if (plat.moveAxis === 'y' && plat.baseOffsetY != null) {
                    plat.y = (newGroundY - plat.baseOffsetY) + Math.sin(this.animClock * (plat.moveSpeed || 2) + (plat.phase || 0)) * (plat.moveAmp || 0);
                } else if (plat.offsetY != null) {
                    plat.y = newGroundY - plat.offsetY;
                }
            }
        }
        if (this.arenaSwitch) {
            const minSwY = canvas.height <= 460 ? 158 : 228;
            this.arenaSwitch.y = Math.max(minSwY, newGroundY - this.arenaSwitch.offsetY);
            this.arenaSwitch.x = Math.round(canvas.width * 0.17);
        }
        if (this.boss) {
            this.boss.h = Math.round((this.isTukTukType(this.boss.type) ? 195 : 162) * scale);
            this.boss.y = newGroundY - this.boss.h;
        }
        if (this.duoPartner) {
            this.duoPartner.h = Math.round((this.isTukTukType(this.duoPartner.type) ? 195 : 162) * scale);
            this.duoPartner.y = newGroundY - this.duoPartner.h;
        }
    }

    createAmbientParticles(count) {
        const list = [];
        for (let i = 0; i < count; i++) {
            list.push({
                x: Math.random(),
                y: Math.random() * 0.75,
                r: 1.5 + Math.random() * 3,
                speedX: (Math.random() - 0.5) * 0.0004,
                speedY: -0.0002 - Math.random() * 0.0004,
                alpha: 0.25 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }
        return list;
    }

    clearFrisbeeTimers() {
        for (const id of this.frisbeeTimers) {
            clearTimeout(id);
        }
        this.frisbeeTimers = [];
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            const lower = e.key.toLowerCase();
            this.keys[lower] = true;
            this.keys[e.code] = true;

            // Prevent unwanted browser shortcuts while playing
            if (e.ctrlKey && (lower === 'r' || lower === 'w' || lower === 's')) {
                e.preventDefault();
            }
            if (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight' || lower === 'arrowdown' || lower === 'c') {
                this.syncDuckFromInputs();
                if (lower === 'arrowdown' || e.key === 'Control') e.preventDefault();
            }

            if (this.state === GAME_STATE.OPENING) {
                window.soundManager.initWebAudio();
                if (e.code === 'Space' || e.key === 'Escape' || e.key === 'Enter') {
                    this.finishOpening();
                }
            } else if (this.state === GAME_STATE.INTRO) {
                if (e.key === 'Enter' || e.code === 'ArrowRight' || (!e.repeat && lower === 'd')) {
                    e.preventDefault();
                    this.advanceIntroBeat();
                } else if (lower === 'r' && !e.repeat) {
                    this.rerollIntroConversation();
                } else if (e.code === 'Space' || e.key === 'Escape') {
                    e.preventDefault();
                    this.skipIntro();
                }
            } else if (this.state === GAME_STATE.MENU) {
                if (e.key === 'Escape') {
                    if (this.ui.screenPrestart && !this.ui.screenPrestart.classList.contains('hidden')) {
                        this.closePreStartModal();
                    } else if (this.ui.screenLvlSelect && !this.ui.screenLvlSelect.classList.contains('hidden')) {
                        this.ui.screenLvlSelect.classList.add('hidden');
                        this.ui.screenMenu.classList.remove('hidden');
                    } else if (this.ui.screenStory && !this.ui.screenStory.classList.contains('hidden')) {
                        this.ui.screenStory.classList.add('hidden');
                        this.ui.screenMenu.classList.remove('hidden');
                    }
                }
            } else if (!e.repeat && (e.key === 'Escape' || lower === 'p') && this.canPause()) {
                e.preventDefault();
                this.togglePause();
            } else if (this.isPaused) {
                return;
            } else if (this.state === GAME_STATE.PRE_BOSS_DIALOGUE) {
                if (e.code === 'Space' || e.key === 'Enter') {
                    this.advancePreBossDialogue();
                }
            } else if (this.state === GAME_STATE.DEMO) {
                if (e.code === 'Space') this.playerJump();
                if (!e.repeat && lower === 'e') this.playerAttackLawBook();
                if (lower === 'q' || e.code === 'ShiftLeft') this.playerAttackMegaShout();
                if (lower === 'f') this.playerAttackFrisbeeVolley();
                if (lower === 'r') this.playerBlock();
                if (lower === 's' || lower === 'x') this.triggerSprintBurst(75);
            } else if ((this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT) && !this.isPlayerStunned()) {
                if (e.code === 'Space') this.playerJump();
                if (!e.repeat && lower === 'e') this.playerAttackLawBook();
                if (lower === 'q' || e.code === 'ShiftLeft') this.playerAttackMegaShout();
                if (lower === 'f') this.playerAttackFrisbeeVolley();
                if (lower === 'r') this.playerBlock();
                if (lower === 's' || lower === 'x') this.triggerSprintBurst(75);
                if (!e.repeat && (lower === 'd' || e.code === 'ArrowRight')) {
                    const now = performance.now();
                    if (now - this.player.lastRightTapTime < 280) this.triggerSprintBurst(75);
                    this.player.lastRightTapTime = now;
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            const lower = e.key.toLowerCase();
            this.keys[lower] = false;
            this.keys[e.code] = false;
            if (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight' || lower === 'arrowdown' || lower === 'c') {
                this.syncDuckFromInputs();
            }
        });

        canvas.addEventListener('mousedown', (e) => {
            if (this.isPaused) return;
            if (this.state === GAME_STATE.OPENING) {
                window.soundManager.initWebAudio();
                this.finishOpening();
            } else if (this.state === GAME_STATE.INTRO) {
                this.skipIntro();
            } else if (this.state === GAME_STATE.PRE_BOSS_DIALOGUE) {
                this.advancePreBossDialogue();
            } else if ((this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO) && !this.isPlayerStunned()) {
                if (e.button === 0) this.playerAttackLawBook();
                else if (e.button === 2) this.playerAttackMegaShout();
                else if (e.button === 1) this.playerAttackFrisbeeVolley();
            }
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.ui.dialogueBox.addEventListener('click', () => {
            if (this.state === GAME_STATE.PRE_BOSS_DIALOGUE) this.advancePreBossDialogue();
        });
    }

    initUIEventListeners() {
        const toggleFS = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
        };

        document.getElementById('btn-fullscreen-toggle').addEventListener('click', toggleFS);
        document.getElementById('btn-fullscreen-menu').addEventListener('click', toggleFS);

        if (this.ui.btnSkipOpening) {
            this.ui.btnSkipOpening.addEventListener('click', (e) => {
                e.stopPropagation();
                window.soundManager.initWebAudio();
                this.finishOpening();
            });
        }

        if (this.ui.btnReplayOpening) {
            this.ui.btnReplayOpening.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                this.startOpening();
            });
        }

        if (this.ui.screenOpening) {
            this.ui.screenOpening.addEventListener('click', () => {
                window.soundManager.initWebAudio();
            });
        }

        document.getElementById('btn-start').addEventListener('click', () => {
            window.soundManager.initWebAudio();
            this.openPreStartModal();
        });

        if (this.ui.btnClosePrestart) {
            this.ui.btnClosePrestart.addEventListener('click', () => {
                this.closePreStartModal();
            });
        }

        document.querySelectorAll('.diff-opt[data-diff]').forEach((btn) => {
            btn.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                this.setDifficulty(btn.getAttribute('data-diff'));
            });
        });

        document.querySelectorAll('.sound-opt[data-sound-tier]').forEach((btn) => {
            btn.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                const tier = parseInt(btn.getAttribute('data-sound-tier'), 10);
                this.setSoundChaosLevel(tier);
            });
        });

        if (this.ui.btnPrestartLaunch) {
            this.ui.btnPrestartLaunch.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                if (this.ui.screenPrestart) this.ui.screenPrestart.classList.add('hidden');
                this.startCinematicIntro();
            });
        }

        if (this.ui.btnPrestartDirect) {
            this.ui.btnPrestartDirect.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                if (this.ui.screenPrestart) this.ui.screenPrestart.classList.add('hidden');
                this.startLevel(0);
            });
        }

        document.getElementById('btn-demo').addEventListener('click', () => {
            window.soundManager.initWebAudio();
            this.startDemoMode();
        });

        if (this.ui.btnDemoExit) {
            this.ui.btnDemoExit.addEventListener('click', () => this.exitDemoMode());
        }

        if (this.ui.btnPauseToggle) {
            this.ui.btnPauseToggle.addEventListener('click', () => this.togglePause());
        }
        const btnPauseResume = document.getElementById('btn-pause-resume');
        const btnPauseRestart = document.getElementById('btn-pause-restart');
        const btnPauseMenu = document.getElementById('btn-pause-menu');
        if (btnPauseResume) btnPauseResume.addEventListener('click', () => this.togglePause(false));
        if (btnPauseRestart) btnPauseRestart.addEventListener('click', () => this.restartCurrentLevel());
        if (btnPauseMenu) btnPauseMenu.addEventListener('click', () => this.returnToMenu());

        if (this.ui.btnSkipIntro) {
            this.ui.btnSkipIntro.addEventListener('click', () => this.skipIntro());
        }
        if (this.ui.btnNextIntro) {
            this.ui.btnNextIntro.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                this.advanceIntroBeat();
            });
        }
        if (this.ui.btnRerollIntro) {
            this.ui.btnRerollIntro.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                this.rerollIntroConversation();
            });
        }

        document.getElementById('btn-level-select').addEventListener('click', () => {
            this.syncSetupControlsUI();
            this.ui.screenMenu.classList.add('hidden');
            this.populateLevelSelectGrid();
            this.ui.screenLvlSelect.classList.remove('hidden');
        });

        if (this.ui.btnLvlDiffCycle) {
            this.ui.btnLvlDiffCycle.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                this.cycleDifficulty();
            });
        }
        if (this.ui.btnLvlSoundCycle) {
            this.ui.btnLvlSoundCycle.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                this.cycleSoundChaosLevel();
            });
        }

        document.getElementById('btn-close-lvl').addEventListener('click', () => {
            this.ui.screenLvlSelect.classList.add('hidden');
            this.ui.screenMenu.classList.remove('hidden');
        });

        document.getElementById('btn-story').addEventListener('click', () => {
            window.soundManager.initWebAudio();
            this.ui.screenMenu.classList.add('hidden');
            this.ui.screenStory.classList.remove('hidden');
            this.showCharacter(this.activeCharacter || 'thenerean');
        });

        document.getElementById('btn-close-story').addEventListener('click', () => {
            window.soundManager.stopAllClips();
            this.ui.screenStory.classList.add('hidden');
            this.ui.screenMenu.classList.remove('hidden');
        });

        document.querySelectorAll('.chars-tab[data-char]').forEach((tab) => {
            tab.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                this.showCharacter(tab.getAttribute('data-char'), true);
            });
        });

        document.getElementById('btn-next-lvl').addEventListener('click', () => {
            this.ui.screenWin.classList.add('hidden');
            if (this.currentLevelIndex + 1 < LEVELS_CONFIG.length) {
                this.startLevel(this.currentLevelIndex + 1);
            } else {
                this.triggerVictory();
            }
        });

        document.getElementById('btn-retry').addEventListener('click', () => {
            this.ui.screenLose.classList.add('hidden');
            this.startLevel(this.currentLevelIndex);
        });

        document.getElementById('btn-lose-menu').addEventListener('click', () => this.returnToMenu());
        document.getElementById('btn-victory-restart').addEventListener('click', () => this.returnToMenu());

        // Dedicated Music Controls (ON/OFF and % Slider)
        const updateMusicUI = (on, pct) => {
            const pctStr = `${pct}%`;
            if (this.ui.btnMusicToggle) this.ui.btnMusicToggle.textContent = on && pct > 0 ? '🎵' : '🔇';
            if (this.ui.sliderMusicVol) this.ui.sliderMusicVol.value = pct;
            if (this.ui.labelMusicVol) this.ui.labelMusicVol.textContent = pctStr;
            if (this.ui.btnMenuMusicToggle) this.ui.btnMenuMusicToggle.textContent = on && pct > 0 ? `🎵 MUSIK: AN (${pctStr})` : '🎵 MUSIK: AUS';
            if (this.ui.sliderMenuMusicVol) this.ui.sliderMenuMusicVol.value = pct;
            if (this.ui.labelMenuMusicVol) this.ui.labelMenuMusicVol.textContent = pctStr;
        };

        if (this.ui.btnMusicToggle) {
            this.ui.btnMusicToggle.addEventListener('click', () => {
                const on = window.soundManager.toggleMusic();
                updateMusicUI(on, window.soundManager.musicVolumePercent);
            });
        }
        if (this.ui.btnMenuMusicToggle) {
            this.ui.btnMenuMusicToggle.addEventListener('click', () => {
                const on = window.soundManager.toggleMusic();
                updateMusicUI(on, window.soundManager.musicVolumePercent);
            });
        }

        const handleMusicSlider = (val) => {
            const num = parseInt(val, 10);
            window.soundManager.setMusicVolumePercent(num);
            if (num > 0 && !window.soundManager.musicEnabled) {
                window.soundManager.setMusicEnabled(true);
            }
            updateMusicUI(window.soundManager.musicEnabled, num);
        };

        if (this.ui.sliderMusicVol) {
            this.ui.sliderMusicVol.addEventListener('input', (e) => handleMusicSlider(e.target.value));
            this.ui.sliderMusicVol.addEventListener('change', () => this.ui.sliderMusicVol.blur());
        }
        if (this.ui.sliderMenuMusicVol) {
            this.ui.sliderMenuMusicVol.addEventListener('input', (e) => handleMusicSlider(e.target.value));
            this.ui.sliderMenuMusicVol.addEventListener('change', () => this.ui.sliderMenuMusicVol.blur());
        }

        // Lobby Music Track Selector (incl. 2-3min Epos Tracks & Classic OST)
        this.populateLobbyMusicSelector();
        if (this.ui.selectMenuMusic) {
            this.ui.selectMenuMusic.addEventListener('change', (e) => {
                window.soundManager.initWebAudio();
                const chosen = e.target.value;
                window.soundManager.setMenuMusic(chosen, true);
                if (!window.soundManager.musicEnabled) {
                    window.soundManager.setMusicEnabled(true);
                    updateMusicUI(true, window.soundManager.musicVolumePercent);
                }
                this.ui.selectMenuMusic.blur();
            });
        }
        if (this.ui.btnMusicPrev) {
            this.ui.btnMusicPrev.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                const nextSrc = window.soundManager.cycleMenuMusic(-1);
                this.syncLobbyMusicSelect(nextSrc);
                if (!window.soundManager.musicEnabled) {
                    window.soundManager.setMusicEnabled(true);
                    updateMusicUI(true, window.soundManager.musicVolumePercent);
                }
            });
        }
        if (this.ui.btnMusicNext) {
            this.ui.btnMusicNext.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                const nextSrc = window.soundManager.cycleMenuMusic(1);
                this.syncLobbyMusicSelect(nextSrc);
                if (!window.soundManager.musicEnabled) {
                    window.soundManager.setMusicEnabled(true);
                    updateMusicUI(true, window.soundManager.musicVolumePercent);
                }
            });
        }

        // Master Sound Effects & Voices Toggle
        const updateSoundUI = (on) => {
            const icon = on ? '🔊' : '🔇';
            const btn = document.getElementById('btn-sound-toggle');
            if (btn) btn.textContent = icon;
            if (this.ui.btnMenuSoundToggle) this.ui.btnMenuSoundToggle.textContent = on ? '🔊 SPRACHE & EFFEKTE: AN' : '🔇 SPRACHE & EFFEKTE: AUS';
        };

        document.getElementById('btn-sound-toggle').addEventListener('click', () => {
            const on = window.soundManager.toggleMute();
            updateSoundUI(on);
        });
        if (this.ui.btnMenuSoundToggle) {
            this.ui.btnMenuSoundToggle.addEventListener('click', () => {
                const on = window.soundManager.toggleMute();
                updateSoundUI(on);
            });
        }

        if (this.ui.slotShield) {
            this.ui.slotShield.addEventListener('click', () => {
                if (!this.isPaused && (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO) && !this.isPlayerStunned()) {
                    this.playerBlock();
                }
            });
        }

        // =================================================================
        // MOBILE TOUCH CONTROLS EVENT HANDLERS
        // =================================================================
        const bindTouchBtn = (btn, onDown, onUp) => {
            if (!btn) return;
            const startHandler = (e) => {
                e.preventDefault();
                btn.classList.add('active');
                if (onDown) onDown();
            };
            const endHandler = (e) => {
                e.preventDefault();
                btn.classList.remove('active');
                if (onUp) onUp();
            };
            btn.addEventListener('touchstart', startHandler, { passive: false });
            btn.addEventListener('touchend', endHandler, { passive: false });
            btn.addEventListener('touchcancel', endHandler, { passive: false });
            btn.addEventListener('mousedown', startHandler);
            btn.addEventListener('mouseup', endHandler);
            btn.addEventListener('mouseleave', endHandler);
        };

        // Left Thumb: Movement
        bindTouchBtn(this.ui.touchBtnLeft,
            () => { this.keys['arrowleft'] = true; this.keys['a'] = true; },
            () => { this.keys['arrowleft'] = false; this.keys['a'] = false; }
        );
        bindTouchBtn(this.ui.touchBtnRight,
            () => {
                this.keys['arrowright'] = true;
                this.keys['d'] = true;
                const now = performance.now();
                if (now - this.player.lastRightTapTime > 35 && now - this.player.lastRightTapTime < 300) {
                    if (this.state === GAME_STATE.RUNNING && !this.isPlayerStunned()) this.triggerSprintBurst(75);
                }
                this.player.lastRightTapTime = now;
            },
            () => { this.keys['arrowright'] = false; this.keys['d'] = false; }
        );

        // Right Thumb: Actions
        bindTouchBtn(this.ui.touchBtnJump,
            () => {
                if ((this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO) && !this.isPlayerStunned()) {
                    this.playerJump();
                } else if (this.state === GAME_STATE.PRE_BOSS_DIALOGUE) {
                    this.advancePreBossDialogue();
                }
            },
            null
        );

        bindTouchBtn(this.ui.touchBtnDuck,
            () => { this.touchDuckHeld = true; this.syncDuckFromInputs(); },
            () => { this.touchDuckHeld = false; this.syncDuckFromInputs(); }
        );

        bindTouchBtn(this.ui.touchBtnBlock,
            () => {
                if ((this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO) && !this.isPlayerStunned()) {
                    this.playerBlock();
                }
            },
            null
        );

        bindTouchBtn(this.ui.touchBtnAttack,
            () => {
                if ((this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO) && !this.isPlayerStunned()) {
                    this.playerAttackLawBook();
                }
            },
            null
        );

        bindTouchBtn(this.ui.touchBtnMega,
            () => {
                if ((this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO) && !this.isPlayerStunned()) {
                    this.playerAttackMegaShout();
                }
            },
            null
        );

        bindTouchBtn(this.ui.touchBtnFrisbee,
            () => {
                if (!this.isPaused && (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO) && !this.isPlayerStunned()) {
                    this.playerAttackFrisbeeVolley();
                }
            },
            null
        );

        bindTouchBtn(this.ui.touchBtnSprint,
            () => {
                if (!this.isPaused && (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO) && !this.isPlayerStunned()) {
                    this.triggerSprintBurst(90);
                }
            },
            null
        );

        // Toggle Touch Controls Button (never active in Windows Desktop EXE)
        if (this.ui.btnTouchToggle && !this.isExplicitDesktop) {
            this.ui.btnTouchToggle.classList.toggle('touch-on', this.touchControlsEnabled);
            this.ui.btnTouchToggle.addEventListener('click', () => {
                this.touchControlsEnabled = !this.touchControlsEnabled;
                this.updateTouchControlsVisibility();
                this.addFloatingText(this.touchControlsEnabled ? "Touch-Buttons AN 📱" : "Touch-Buttons AUS", canvas.width / 2, canvas.height * 0.45, '#38bdf8', 22);
            });
        }

        // Tap Dialogue Box to advance dialogue on touch screens
        if (this.ui.dialogueBox) {
            this.ui.dialogueBox.addEventListener('click', () => {
                if (this.state === GAME_STATE.PRE_BOSS_DIALOGUE) {
                    this.advancePreBossDialogue();
                }
            });
        }

        // Interactive Lobby Comic Character Showcase (click to taunt & animate!)
        document.querySelectorAll('.lobby-fighter[data-clip]').forEach((el) => {
            el.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                const clip = el.getAttribute('data-clip');
                const quote = el.getAttribute('data-quote');
                if (clip) {
                    window.soundManager.playClip(clip, null, 1.0, { forceSolo: true });
                }
                if (quote && this.ui.lobbyQuoteBubble) {
                    this.ui.lobbyQuoteBubble.textContent = quote;
                    this.ui.lobbyQuoteBubble.classList.remove('pop-flash');
                    void this.ui.lobbyQuoteBubble.offsetWidth;
                    this.ui.lobbyQuoteBubble.classList.add('pop-flash');
                }
                el.classList.remove('taunt-bounce');
                void el.offsetWidth;
                el.classList.add('taunt-bounce');
            });
        });
        // Interactive Opening Cast Slots (click any character on intro stage to throw their meme line!)
        if (this.ui.openingCastSlots) {
            const slotClips = {
                student: { clip: 'student_tiktok_fortnite', bubble: 'Fortnite & TikTok!' },
                monika: { clip: 'monika_puenktlichkeit', bubble: 'Pünktlichkeit!!' },
                thenerean: { clip: 'thenerean_stah', bubble: 'ICH STAH DOCH DA!' },
                adam: { clip: 'adam_20_frisbees', bubble: '20 Frisbees!' },
                tuktuk: { clip: 'tuktuk_taeschfresser_gpu', bubble: 'TÄSCHFRESSER!' },
                tuktuk_dual: { clip: 'tuktuk_gpu_melone', bubble: 'ZWEI RTX GPUs!' }
            };
            this.ui.openingCastSlots.forEach((slot) => {
                slot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.soundManager.initWebAudio();
                    const role = slot.getAttribute('data-cast');
                    const cfg = slotClips[role];
                    if (cfg) {
                        window.soundManager.playClip(cfg.clip, null, 1.0, { bypassLimit: true });
                        this.highlightOpeningCast(role, cfg.bubble, 1300);
                        this.spawnOpeningSpark(slot, '⚡');
                    }
                });
            });
        }
    }

    populateLobbyMusicSelector() {
        const sel = this.ui.selectMenuMusic;
        if (!sel || !window.soundManager) return;
        const catalog = window.soundManager.getMusicCatalog() || [];
        sel.innerHTML = '';

        const groups = new Map();
        catalog.forEach((item) => {
            if (!groups.has(item.category)) {
                const og = document.createElement('optgroup');
                og.label = item.category;
                groups.set(item.category, og);
                sel.appendChild(og);
            }
            const opt = document.createElement('option');
            opt.value = item.src;
            opt.textContent = `${item.title} (${item.duration})`;
            groups.get(item.category).appendChild(opt);
        });

        this.syncLobbyMusicSelect();
    }

    syncLobbyMusicSelect(forcedSrc = null) {
        const sel = this.ui.selectMenuMusic;
        if (!sel || !window.soundManager) return;
        const cur = forcedSrc || window.soundManager.getMenuMusic();
        if (cur) sel.value = cur;
    }

    // =====================================================================
    // CHARAKTER-GALERIE (Lobby): Alle 5 Hauptcharaktere & Original-Sprüche
    // =====================================================================
    getCharacterData() {
        return {
            thenerean: {
                accent: '#2ed573',
                role: 'HELD • INFORMATIK-LERNENDER EFZ',
                name: 'Thenerean Selvabankumar',
                sprite: 'assets/sprites/characters/thenerean_idle.png',
                bio: 'Will seine 4-jährige Informatik-Lehre an der GIBB Bern mit Bestnote 6.0 abschliessen. Kämpft mit Gesetzestexten, dem legendären "ICH STAH DOCH DA!"-Schrei und 20 Frisbees gegen Verspätungen, ABU-Tests, Server-Bugs und das Dual-GPU TukTuk.',
                stats: [['WAFFE', '📜 Gesetz'], ['SPEZIAL', '⚡ Mega-Schrei'], ['ZIEL', '🏆 EFZ 6.0']],
                sounds: [
                    { clip: 'thenerean_stah', text: '"Herr Adam, ich stah doch da!"' },
                    { clip: 'thenerean_niemert_verbi', text: '"Niemert chunt an mir verbi!"' },
                    { clip: 'thenerean_heilig_gral', text: '"Das isch dr Heiligi Gral vom EFZ!"' },
                    { clip: 'thenerean_geilschte_setup', text: '"Ich ha s\'geilschte GIBB-Setup!"' },
                    { clip: 'thenerean_gemini_king', text: '"Jetzt isch Sirünän de Gemini King!"' },
                    { clip: 'thenerean_banana_monika', text: '"Banana Monika — ich gib nöd uf!"' },
                    { clip: 'thenerean_morgarten_blockiert', text: '"Morgartenstrasse isch blockiert!"' },
                    { clip: 'thenerean_zspaet_raschtaus', text: '"Z\'spät?! Da git\'s nüt — ich rascht us!"' }
                ]
            },
            monika: {
                accent: '#a55eea',
                role: 'BOSS • HERRSCHERIN DER PÜNKTLICHKEIT',
                name: 'Monika Schneider',
                sprite: 'assets/sprites/characters/monika_idle.png',
                bio: 'Selbst 2.54 Sekunden Verspätung werden im Klassenzimmer oder ABU B404 nicht toleriert. Zieht Kopfhörer ab, schreibt ABU-Tests und kontrolliert gemeinsam mit Herr Adam die EFZ-Prüfung.',
                stats: [['ANGRIFF', '🟥 Rote Karten'], ['PHASE 2', '📢 Schrei'], ['SCHWÄCHE', '🛡 Perfekt-Block']],
                sounds: [
                    { clip: 'monika_puenktlichkeit', text: '"Pünktlichkeit ist oberste Gebot!"' },
                    { clip: 'monika_keine_kopfhoerer', text: '"Kei Chopfhörer im Unterricht!"' },
                    { clip: 'monika_adam_korrigiere', text: '"Selberbank! Si müend das korrigiere!"' },
                    { clip: 'monika_abu_test', text: '"Das isch jetzt würkli en ABU-Test!"' },
                    { clip: 'monika_passwort_buech', text: '"Mis Passwort staht i de Gsetzestext!"' },
                    { clip: 'monika_altstadt_lehre', text: '"Dini Lehrziit gaht i d\'Altstadt abe!"' },
                    { clip: 'monika_chicken_curry', text: '"Gell, s\'Chicken Curry isch guet!"' },
                    { clip: 'monika_gang_uf_platz', text: '"Gang uf die Platz!"' }
                ]
            },
            adam: {
                accent: '#00d2d3',
                role: 'BOSS • SPORTLEHRER & ABSENZEN-PRÜFER',
                name: 'Herr Adam',
                sprite: 'assets/sprites/characters/adam_idle.png',
                bio: 'Prüft die Absenzenliste mit fliegenden Frisbees & Basketbällen. Genehmigt manchmal krasse GIBB-Setups — verpasst du aber den Schuss, folgt sofort eine Strafe!',
                stats: [['ANGRIFF', '🥏 Frisbees'], ['PHASE 2', '📯 Pfiff'], ['SCHWÄCHE', '⬇ Ducken']],
                sounds: [
                    { clip: 'adam_silvankumar', text: '"Silvankumar, ist der Thenerean da?!"' },
                    { clip: 'adam_20_frisbees', text: '"Da hast du 20 Frisbees!"' },
                    { clip: 'adam_strafe_verpasst', text: '"Schuss verpasst — Strafe defür!"' },
                    { clip: 'adam_setup_genehmigt', text: '"Sportlehrer-Setup top — genehmigt!"' },
                    { clip: 'adam_abwesend_sketch', text: '"Silvankumar! Du bisch abwesend!"' },
                    { clip: 'adam_hilf_mir', text: '"Hilf mir!"' }
                ]
            },
            tuktuk_dual: {
                accent: '#ff6348',
                role: 'MONSTER-BOSS • DUAL-GPU MK-II',
                name: 'Dual-GPU TukTuk MK-II',
                sprite: 'assets/sprites/characters/tuktuk_dual_idle.png',
                bio: 'Direkt aus Sri Lanka mit ZWEI übertakteten RTX-Grafikkarten! Feuert Doppel-Kabel, zündet Boden-Flammen und prallt in Phase 2 mit dem Double-Turbo Rebound von der Wand ab.',
                stats: [['HP', '🔥 980 HP'], ['PHASE 2', '⚡ 2× Rebound'], ['SCHWÄCHE', '🧊 Stickstoff']],
                sounds: [
                    { clip: 'tuktuk_taeschfresser_gpu', text: '"TÄSCHFRESSER!! GPU am Limit!"' },
                    { clip: 'tuktuk_gpu_melone', text: '"Melone mit zwei Grafikkarten!"' },
                    { clip: 'thenerean_gpu', text: '"Nein! Schon wieder Grafikkarte Fehler!"' },
                    { clip: 'thenerean_grafikkarte', text: '"Verdammte Grafikkarte!"' },
                    { clip: 'thenerean_verdammt_maschine', text: '"Verdammte Maschine!"' },
                    { clip: 'thenerean_srilanka', text: '"Direkt aus Sri Lanka!"' }
                ]
            },
            gibb_student: {
                accent: '#38bdf8',
                role: 'RIVALE • KORRIDOR & KIOSK-STREBER',
                name: 'Average GIBB Schüler',
                sprite: 'assets/sprites/characters/gibb_student_idle.png',
                bio: 'Lebt von Energy-Drinks, zockt heimlich Fortnite im Unterricht, wirft Laptops durch die Gänge und hält sich für den unbesiegbaren TikTok Cringe King der GIBB.',
                stats: [['ANGRIFF', '⚡ Energy & Laptop'], ['MODUS', '🌊 3-Wellen'], ['EIGENART', '🎮 Fortnite']],
                sounds: [
                    { clip: 'student_tiktok_fortnite', text: '"Ich will Fortnite & TikTok!"' },
                    { clip: 'student_cringe_king', text: '"Ich bin der Cringe King von TikTok!"' },
                    { clip: 'boss_evil_laugh', text: '😈 "MWAHAHAHA — Prüfung gfailt!"' },
                    { clip: 'thenerean_tamil_vbucks', text: '"Her mit dene V-Bucks & Jetons!"' },
                    { clip: 'thenerean_frechheit', text: '"Das isch e absoluti Frechheit!"' },
                    { clip: 'thenerean_taronuman_scream', text: '"TARONUMAN!! AAAAAH!!"' }
                ]
            }
        };
    }

    showCharacter(key, playIntro = false) {
        const data = this.getCharacterData()[key];
        if (!data) return;
        this.activeCharacter = key;

        const card = document.querySelector('.chars-card');
        if (card) card.style.setProperty('--char-accent', data.accent);

        document.querySelectorAll('.chars-tab[data-char]').forEach((t) => {
            t.classList.toggle('active', t.getAttribute('data-char') === key);
        });

        const sprite = document.getElementById('char-sprite');
        if (sprite) {
            sprite.src = data.sprite;
            sprite.alt = data.name;
            sprite.classList.remove('char-pop');
            void sprite.offsetWidth;
            sprite.classList.add('char-pop');
        }
        const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        setText('char-role', data.role);
        setText('char-name', data.name);
        setText('char-bio', data.bio);

        const stats = document.getElementById('char-stats');
        if (stats) {
            stats.innerHTML = '';
            data.stats.forEach(([label, val]) => {
                const box = document.createElement('div');
                box.className = 'chars-stat';
                const l = document.createElement('span');
                l.textContent = label;
                const v = document.createElement('strong');
                v.textContent = val;
                box.append(l, v);
                stats.appendChild(box);
            });
        }

        const list = document.getElementById('char-sounds');
        if (list) {
            list.innerHTML = '';
            data.sounds.forEach((snd) => {
                const btn = document.createElement('button');
                btn.className = 'char-sound-btn';
                const ico = document.createElement('span');
                ico.className = 'play-ico';
                ico.textContent = '▶';
                const label = document.createElement('span');
                label.textContent = snd.text;
                btn.append(ico, label);
                btn.addEventListener('click', () => this.playCharacterSound(btn, snd.clip));
                list.appendChild(btn);
            });
        }

        if (playIntro && data.sounds.length > 0 && list && list.firstChild) {
            this.playCharacterSound(list.firstChild, data.sounds[0].clip);
        }
    }

    playCharacterSound(btn, clip) {
        window.soundManager.initWebAudio();
        window.soundManager.stopAllClips();
        document.querySelectorAll('.char-sound-btn.playing').forEach((b) => {
            b.classList.remove('playing');
            const ico = b.querySelector('.play-ico');
            if (ico) ico.textContent = '▶';
        });
        btn.classList.add('playing');
        const ico = btn.querySelector('.play-ico');
        if (ico) ico.textContent = '🔊';
        const reset = () => {
            btn.classList.remove('playing');
            if (ico) ico.textContent = '▶';
        };
        window.soundManager.playClip(clip, reset, 1.0, { forceSolo: true });
        clearTimeout(this.charSoundTimeout);
        this.charSoundTimeout = setTimeout(reset, 6000);
    }

    loadSaveData() {
        try {
            const raw = localStorage.getItem('thenerean_gibb_save_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object' && parsed.levels) {
                    return parsed;
                }
            }
        } catch (e) {}
        return { levels: {} };
    }

    saveLevelProgress(levelId, grade, timeSec, maxCombo) {
        if (!levelId || levelId <= 0) return;
        if (!this.saveData || !this.saveData.levels) this.saveData = { levels: {} };
        const key = String(levelId);
        const prev = this.saveData.levels[key];
        const bestGrade = prev ? Math.max(prev.bestGrade || 0, grade) : grade;
        const clampedTime = Math.max(1, Math.round(timeSec || 0));
        const bestTime = prev && prev.bestTime > 0 ? Math.min(prev.bestTime, clampedTime) : clampedTime;
        const bestCombo = prev ? Math.max(prev.bestCombo || 0, maxCombo || 0) : (maxCombo || 0);
        this.saveData.levels[key] = {
            cleared: true,
            bestGrade: +bestGrade.toFixed(1),
            bestTime: bestTime,
            bestCombo: bestCombo
        };
        try {
            localStorage.setItem('thenerean_gibb_save_v1', JSON.stringify(this.saveData));
        } catch (e) {}
    }

    formatTime(sec) {
        const s = Math.max(0, Math.round(sec || 0));
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }

    canPause() {
        return this.state === GAME_STATE.RUNNING ||
            this.state === GAME_STATE.PRE_BOSS_WALK ||
            this.state === GAME_STATE.PRE_BOSS_DIALOGUE ||
            this.state === GAME_STATE.BOSS_FIGHT ||
            this.state === GAME_STATE.DEMO;
    }

    togglePause(forceState = null) {
        if (!this.canPause()) return;
        const next = forceState !== null ? Boolean(forceState) : !this.isPaused;
        if (next === this.isPaused) return;
        this.isPaused = next;

        if (this.ui.screenPause) {
            this.ui.screenPause.classList.toggle('hidden', !this.isPaused);
        }
        if (this.ui.pauseLevelInfo && this.level) {
            const modeTag = this.state === GAME_STATE.DEMO
                ? 'Trainingsraum'
                : (this.boss && this.boss.isMiniBoss ? 'Mini-Boss' : (this.state === GAME_STATE.BOSS_FIGHT ? 'Bosskampf' : 'Parcours'));
            this.ui.pauseLevelInfo.textContent = `${this.level.yearText} — ${this.level.name} (${modeTag})`;
        }
        if (this.ui.btnPauseToggle) {
            this.ui.btnPauseToggle.textContent = this.isPaused ? '▶' : '⏸';
        }
        window.soundManager.playPause();
        window.soundManager.setMusicQuietMode(
            this.isPaused ||
            this.state === GAME_STATE.BOSS_FIGHT ||
            this.state === GAME_STATE.PRE_BOSS_WALK ||
            this.state === GAME_STATE.PRE_BOSS_DIALOGUE
        );
        this.updateTouchControlsVisibility();
    }

    restartCurrentLevel() {
        this.isPaused = false;
        if (this.ui.screenPause) this.ui.screenPause.classList.add('hidden');
        if (this.ui.btnPauseToggle) this.ui.btnPauseToggle.textContent = '⏸';
        if (this.state === GAME_STATE.DEMO) {
            this.startDemoMode();
        } else {
            this.startLevel(this.currentLevelIndex);
        }
    }

    registerCombo(points = 1, customLabel = null) {
        this.comboCount += points;
        if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

        if (this.comboCount >= 3 && (this.comboCount === 3 || this.comboCount % 5 === 0)) {
            this.player.score = Math.min(6.0, +(this.player.score + 0.1).toFixed(1));
            this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 10);
            this.updateBars();
            this.addFloatingText(
                customLabel || `🔥 ${this.comboCount}× KOMBO! +0.1 NOTE!`,
                this.player.x + this.player.w * 0.5,
                this.player.y - 46,
                '#ffd32a',
                21
            );
        } else if (customLabel) {
            this.addFloatingText(customLabel, this.player.x + this.player.w * 0.5, this.player.y - 34, '#2ed573', 19);
        }
        this.updateComboAndPowerHUD();
    }

    updateComboAndPowerHUD() {
        const showCombo = this.comboCount >= 2;
        const showPower = this.player.powerTimer > 0;
        const inPlay = this.state === GAME_STATE.RUNNING ||
            this.state === GAME_STATE.PRE_BOSS_WALK ||
            this.state === GAME_STATE.PRE_BOSS_DIALOGUE ||
            this.state === GAME_STATE.BOSS_FIGHT ||
            this.state === GAME_STATE.DEMO;

        if (this.ui.hudComboPill && this.ui.hudComboVal) {
            this.ui.hudComboPill.classList.toggle('hidden', !showCombo);
            if (showCombo) this.ui.hudComboVal.textContent = String(this.comboCount);
        }
        if (this.ui.hudPowerPill && this.ui.hudPowerSec) {
            this.ui.hudPowerPill.classList.toggle('hidden', !showPower);
            if (showPower) {
                const sec = Math.max(1, Math.ceil(this.player.powerTimer / 60));
                this.ui.hudPowerSec.textContent = `${sec}s`;
            }
        }
        if (this.ui.hudStatusPills) {
            this.ui.hudStatusPills.classList.toggle('hidden', !inPlay || (!showCombo && !showPower));
        }
    }

    resetRunStats() {
        this.isPaused = false;
        this.fixedAccumulator = 0;
        this.elapsedSeconds = 0;
        if (this.ui.timeVal) this.ui.timeVal.textContent = '00:00';
        if (this.ui.screenPause) this.ui.screenPause.classList.add('hidden');
        if (this.ui.btnPauseToggle) this.ui.btnPauseToggle.textContent = '⏸';

        this.player.hp = 150;
        this.player.maxHp = 150;
        this.player.score = 5.5;
        this.player.megaEnergy = 100;
        this.player.frisbeeCooldown = 0;
        this.player.lawBookCooldown = 0;
        this.player.isBlocking = false;
        this.player.blockTimer = 0;
        this.player.blockCooldown = 0;
        this.player.isDucking = false;
        this.player.invulnerableTime = 0;
        this.player.hitFlash = 0;
        this.player.powerTimer = 0;
        this.player.attackAnimTimer = 0;
        this.player.sprintTimer = 0;
        this.player.standingPlatform = null;
        this.touchDuckHeld = false;

        this.comboCount = 0;
        this.maxCombo = 0;
        this.damageVignetteTimer = 0;
        this.lastDamageReason = null;
        this.timeRemaining = 0;
        this.lastTickSec = -1;
        this.targets = [];
        this.targetsHit = 0;
        this.targetsTotal = 0;
        this.jetonsCollected = 0;
        this.jetonsTotal = 0;
        this.vanguardDefeated = false;
        this.currentWaveIndex = 0;
        this.chaser = null;
        this.arenaSwitch = null;
        this.floorHazardCooldown = 0;
        this.updateComboAndPowerHUD();
        this.updateMissionPill();
    }

    updateMissionPill() {
        const pill = this.ui.missionPill;
        if (!pill) return;

        const inStage = this.state === GAME_STATE.RUNNING ||
            this.state === GAME_STATE.PRE_BOSS_WALK ||
            this.state === GAME_STATE.PRE_BOSS_DIALOGUE ||
            this.state === GAME_STATE.BOSS_FIGHT;

        if (!inStage || !this.level) {
            pill.classList.add('hidden');
            return;
        }

        const inBossPhase = this.state === GAME_STATE.PRE_BOSS_WALK ||
            this.state === GAME_STATE.PRE_BOSS_DIALOGUE ||
            this.state === GAME_STATE.BOSS_FIGHT;
        const mode = this.level.mode || 'standard';

        let show = false;
        let icon = '🎯';
        let text = '';
        let bossSide = false;
        let urgent = false;
        let highlight = false;

        if (mode === 'time_attack' && this.state === GAME_STATE.RUNNING) {
            show = true;
            icon = '⏱️';
            text = `GLOCKE IN ${Math.max(0, this.timeRemaining).toFixed(1)}s`;
            urgent = this.timeRemaining <= 7;
        } else if (mode === 'wave_rush' && inBossPhase) {
            const totalW = (this.level.waves && this.level.waves.length) || 3;
            show = true;
            icon = '🌊';
            text = `WELLE ${Math.min(totalW, this.currentWaveIndex + 1)} / ${totalW}`;
            bossSide = true;
        } else if (mode === 'target_run_boss' && this.state === GAME_STATE.RUNNING) {
            show = true;
            icon = '🎯';
            text = `ZIELE: ${this.targetsHit} / ${this.targetsTotal}`;
            highlight = this.targetsTotal > 0 && this.targetsHit >= this.targetsTotal;
        } else if (mode === 'bankomat_survival' && this.state === GAME_STATE.RUNNING) {
            const goal = this.jetonsTotal || this.level.targetGoalCount || 8;
            show = true;
            icon = '🪙';
            text = `JETONS: ${this.jetonsCollected} / ${goal}`;
            highlight = goal > 0 && this.jetonsCollected >= goal;
        } else if (mode === 'abu_duo_ambush' && this.state === GAME_STATE.RUNNING) {
            const remM = Math.max(0, Math.round((this.level.targetDistance - this.worldDistance) / 40));
            show = true;
            icon = '📘';
            text = `ABU B404 • NOCH ${remM}m`;
        } else if (mode === 'tuktuk_overclock_duel' && this.state === GAME_STATE.RUNNING) {
            const remM = Math.max(0, Math.round((this.level.targetDistance - this.worldDistance) / 40));
            show = true;
            icon = '🎮';
            text = `SRI LANKA HIGHWAY • ${remM}m`;
        } else if (mode === 'tuktuk_chase_boss' && this.state === GAME_STATE.RUNNING) {
            const remM = Math.max(0, Math.round((this.level.targetDistance - this.worldDistance) / 40));
            const warn = Boolean(this.chaser && this.chaser.warnTimer > 0);
            show = true;
            icon = '🛺';
            text = warn ? '⚠️ TUKTUK SCHIESST!' : `FLUCHT • NOT-AUS ${remM}m`;
            urgent = warn;
        } else if (inBossPhase) {
            if (this.boss && this.boss.isStageVanguard) {
                show = true;
                bossSide = true;
                icon = '🛡️';
                text = 'STAGE 1 / 2: VORHUT';
                highlight = true;
            } else if ((this.boss && this.boss.ai && this.boss.ai.shieldTimer > 0) || (this.duoPartner && this.duoPartner.ai && this.duoPartner.ai.shieldTimer > 0)) {
                show = true;
                bossSide = true;
                urgent = true;
                icon = '🛡';
                text = (this.arenaSwitch && this.arenaSwitch.cooldown <= 0)
                    ? 'SCHILD! [R] / SCHALTER!'
                    : 'SCHILD AKTIV! KONTER [R]';
            } else if (this.arenaSwitch && this.level.arenaSwitch) {
                show = true;
                bossSide = true;
                icon = this.level.arenaSwitch.icon || '⚡';
                const shortTitle = (this.level.arenaSwitch.label || 'SCHALTER').replace(/^[^\s]+\s+/, '');
                if (this.arenaSwitch.cooldown <= 0) {
                    text = `${shortTitle} BEREIT!`;
                    highlight = true;
                } else {
                    text = `${shortTitle}: ${Math.ceil(this.arenaSwitch.cooldown / 60)}s`;
                }
            }
        }

        pill.classList.toggle('hidden', !show);
        if (!show) return;

        pill.classList.toggle('boss-side', bossSide);
        pill.classList.toggle('urgent', urgent);
        pill.classList.toggle('highlight-ready', highlight && !urgent);
        if (this.ui.missionIcon && this.ui.missionIcon.textContent !== icon) this.ui.missionIcon.textContent = icon;
        if (this.ui.missionText && this.ui.missionText.textContent !== text) this.ui.missionText.textContent = text;
    }

    updateTouchControlsVisibility() {
        const inAction = this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO || this.state === GAME_STATE.PRE_BOSS_WALK;
        const showTouch = Boolean(!this.isExplicitDesktop && this.touchControlsEnabled && inAction && !this.isPaused && this.ui.touchOverlay);
        if (this.ui.touchOverlay) {
            this.ui.touchOverlay.classList.toggle('hidden', !showTouch);
        }
        document.body.classList.toggle('touch-active', showTouch);
        if (this.ui.btnTouchToggle) {
            this.ui.btnTouchToggle.classList.toggle('touch-on', !this.isExplicitDesktop && this.touchControlsEnabled);
        }
    }

    returnToMenu() {
        this.clearFrisbeeTimers();
        this.isPaused = false;
        window.soundManager.stopAllClips();
        this.hideGameplayHUDs();
        this.ui.screenLose.classList.add('hidden');
        this.ui.screenVictory.classList.add('hidden');
        this.ui.screenWin.classList.add('hidden');
        if (this.ui.screenPause) this.ui.screenPause.classList.add('hidden');
        if (this.ui.screenPrestart) this.ui.screenPrestart.classList.add('hidden');
        if (this.ui.screenStory) this.ui.screenStory.classList.add('hidden');
        if (this.ui.screenLvlSelect) this.ui.screenLvlSelect.classList.add('hidden');
        if (this.ui.screenIntro) this.ui.screenIntro.classList.add('hidden');
        if (this.ui.btnPauseToggle) this.ui.btnPauseToggle.textContent = '⏸';
        this.ui.screenMenu.classList.remove('hidden', 'lobby-entering');
        this.state = GAME_STATE.MENU;
        this.syncSetupControlsUI();
        this.syncLobbyMusicSelect();
        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playMenuMusic();
    }

    hideGameplayHUDs() {
        this.ui.bar.classList.add('hidden');
        this.ui.bossHudBanner.classList.add('hidden');
        this.ui.demoComboHud.classList.add('hidden');
        if (this.ui.hudStatusPills) this.ui.hudStatusPills.classList.add('hidden');
        if (this.ui.missionPill) this.ui.missionPill.classList.add('hidden');
        this.ui.abilityDock.classList.add('hidden');
        this.ui.controlHintPill.classList.add('hidden');
        this.ui.dialogueBox.classList.add('hidden');
        if (this.ui.memePopup) this.ui.memePopup.classList.add('hidden');
        if (this.ui.touchOverlay) this.ui.touchOverlay.classList.add('hidden');
        document.body.classList.remove('touch-active');
        if (this.ui.btnDemoExit) this.ui.btnDemoExit.classList.add('hidden');
    }

    populateLevelSelectGrid() {
        const grid = document.querySelector('.level-grid');
        grid.innerHTML = '';
        const savedLevels = (this.saveData && this.saveData.levels) || {};
        let clearedCount = 0;
        let gradeSum = 0;

        LEVELS_CONFIG.forEach((lvl, idx) => {
            const rec = savedLevels[String(lvl.id)];
            if (rec && rec.cleared) {
                clearedCount++;
                gradeSum += rec.bestGrade || 5.5;
            }
            const statusHtml = (rec && rec.cleared)
                ? `<div class="lvl-save-row">
                        <span class="lvl-cleared-badge">✅ BESTANDEN</span>
                        <span class="lvl-grade-pill">⭐ Note ${(rec.bestGrade || 5.5).toFixed(1)}</span>
                        <span class="lvl-grade-pill">⏱️ ${this.formatTime(rec.bestTime || 0)}</span>
                        ${rec.bestCombo > 0 ? `<span class="lvl-grade-pill">🔥 ${rec.bestCombo}×</span>` : ''}
                   </div>`
                : `<div class="lvl-save-row"><span class="lvl-open-badge">Noch nicht abgeschlossen</span></div>`;

            const sBossHP = this.scaleBossHP(lvl.bossHP || 500);
            const sPartnerHP = lvl.partnerHP ? this.scaleBossHP(lvl.partnerHP) : 0;
            const sVanHP = lvl.vanguardHP ? this.scaleBossHP(lvl.vanguardHP) : 0;
            let modeDesc = `${lvl.hasMiniBoss ? 'Mini-Boss + ' : ''}Boss: <strong>${lvl.bossName}</strong> (HP: ${sBossHP})`;
            if (lvl.mode === 'time_attack') {
                modeDesc = `Modus: <strong>Reiner Zeit-Sprint (Kein Boss)</strong> &bull; Zeitlimit: <strong>${lvl.timeLimitSec}s</strong>`;
            } else if (lvl.mode === 'direct_boss') {
                modeDesc = `Direkt-Arena: <strong>${lvl.bossName}</strong> (HP: ${sBossHP})`;
            } else if (lvl.mode === 'wave_rush') {
                modeDesc = `Direkt-Ansturm: <strong>${(lvl.waves && lvl.waves.length) || 3} Rivalen-Wellen</strong>`;
            } else if (lvl.mode === 'target_run_boss') {
                modeDesc = `Ziel-Parcours (${lvl.targetGoalCount || 6} Ziele) &rarr; <strong>${lvl.bossName}</strong> (${sBossHP} HP)`;
            } else if (lvl.mode === 'tuktuk_chase_boss') {
                modeDesc = `Phase 1: <strong>TukTuk-Flucht</strong> &rarr; Phase 2: <strong>${lvl.bossName}</strong> (${sBossHP} HP)`;
            } else if (lvl.mode === 'abu_duo_ambush') {
                modeDesc = `ABU-Parcours &rarr; Duo: <strong>Monika + GIBB Schüler</strong> (${sBossHP + sPartnerHP} HP)`;
            } else if (lvl.mode === 'bankomat_survival') {
                modeDesc = `${lvl.targetGoalCount || 8} Bankomat-Jetons &rarr; <strong>Adam + Kiosk-Boss</strong> (${sBossHP + sPartnerHP} HP)`;
            } else if (lvl.mode === 'tuktuk_overclock_duel') {
                modeDesc = `Highway-Sprint &rarr; <strong>${lvl.bossName}</strong> (${sBossHP} HP)`;
            } else if (lvl.mode === 'gauntlet_trio_combo') {
                modeDesc = `Direkt-Kombo: <strong>Monika + Dual-GPU TukTuk</strong> (${sBossHP + sPartnerHP} HP)`;
            } else if (lvl.mode === 'final_efz_gauntlet' || lvl.mode === 'duo_finale_platforms') {
                modeDesc = `2-Phasen EFZ-Finale: <strong>Vorhut (${sVanHP || this.scaleBossHP(420)}) + Duo (${sBossHP + (sPartnerHP || this.scaleBossHP(1080))} HP)</strong>`;
            }

            const div = document.createElement('div');
            div.className = 'level-btn-card';
            div.innerHTML = `
                <img class="lvl-thumb" src="${lvl.bgPath}" alt="${lvl.name}">
                <div class="lvl-info">
                    <div class="lvl-num">${lvl.yearText}</div>
                    <div class="lvl-title">${lvl.name}</div>
                    ${lvl.modeBadge ? `<div class="lvl-mode-pill">${lvl.modeBadge}</div>` : ''}
                    <div class="lvl-feature-tag">${lvl.featureTag || ''}</div>
                    <p>${modeDesc}</p>
                    ${statusHtml}
                </div>
            `;
            div.addEventListener('click', () => {
                this.ui.screenLvlSelect.classList.add('hidden');
                window.soundManager.initWebAudio();
                this.startLevel(idx);
            });
            grid.appendChild(div);
        });

        if (this.ui.campaignSummary) {
            if (clearedCount === 0) {
                this.ui.campaignSummary.textContent = `Fortschritt: 0 / ${LEVELS_CONFIG.length} Lehrjahre abgeschlossen • Hole dir Note 6.0!`;
            } else {
                const avg = (gradeSum / clearedCount).toFixed(1);
                this.ui.campaignSummary.textContent = `Fortschritt: ${clearedCount} / ${LEVELS_CONFIG.length} Lehrjahre abgeschlossen • Ø Bestnote: ${avg}`;
            }
        }
    }

    // =====================================================================
    // DEMO-MODUS (TRAININGSRAUM)
    // =====================================================================
    startDemoMode() {
        this.clearFrisbeeTimers();
        this.state = GAME_STATE.DEMO;
        this.level = {
            id: 0,
            yearText: "🎯 DEMO-MODUS",
            name: "Trainingsraum — Teste alle Fähigkeiten!",
            bgType: "gym_turnhalle",
            bgPath: "assets/backgrounds/bg_gym_turnhalle.jpg",
            accentColor: "#f39c12",
            ambientStyle: "gym",
            targetDistance: 99999
        };

        this.resizeCanvas();
        const groundPos = this.player.groundY;
        this.player.x = 140;
        this.player.y = groundPos - this.player.h;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.facing = 1;
        this.player.isGrounded = true;
        this.player.lastSafeWorldX = 140;
        this.resetRunStats();
        this.worldDistance = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.platforms = [];
        this.lavaPits = [];
        this.boostPads = [];
        this.projectiles = [];
        this.particles = [];
        this.shockwaves = [];
        this.floatingTexts = [];
        this.midBossTriggered = false;
        this.midBossDefeated = false;
        this.vanguardDefeated = false;
        this.timeRemaining = 0;
        this.lastTickSec = -1;
        this.targets = [];
        this.targetsHit = 0;
        this.targetsTotal = 0;
        this.jetonsCollected = 0;
        this.jetonsTotal = 0;
        this.touchDuckHeld = false;
        this.currentWaveIndex = 0;
        this.chaser = null;
        this.arenaSwitch = null;
        this.floorHazardCooldown = 0;
        this.demoComboHits = 0;
        this.demoTotalDamage = 0;
        this.resetCombatExtras();

        this.ui.screenMenu.classList.add('hidden');
        if (this.ui.screenPrestart) this.ui.screenPrestart.classList.add('hidden');
        this.ui.screenIntro.classList.add('hidden');
        this.ui.screenWin.classList.add('hidden');
        this.ui.screenLose.classList.add('hidden');
        this.ui.screenVictory.classList.add('hidden');
        this.ui.dialogueBox.classList.add('hidden');
        this.ui.bossHudBanner.classList.add('hidden');

        this.ui.bar.classList.remove('hidden');
        this.ui.abilityDock.classList.remove('hidden');
        this.ui.demoComboHud.classList.remove('hidden');
        this.ui.controlHintPill.classList.add('hidden');
        if (this.ui.btnDemoExit) this.ui.btnDemoExit.classList.remove('hidden');

        this.ui.yearBadge.textContent = "🎯 DEMO-MODUS";
        this.ui.lvlName.textContent = "Trainingsraum — Teste deine Angriffe!";
        this.ui.progBar.style.width = '100%';
        this.ui.progValText.textContent = 'DEMO';
        this.ui.demoHitsVal.textContent = "0";
        this.ui.demoDmgVal.textContent = "0";
        this.updateBars();
        this.updateTouchControlsVisibility();

        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playMusic('assets/music/Thanuran_Takeover.mp3');

        const scale = Math.max(0.78, Math.min(1.38, canvas.height / 720));
        const bossH = Math.round(162 * scale);
        this.boss = {
            name: "Übungs-Puppe (Herr Adam)",
            type: "dummy",
            avatar: "assets/sprites/adam_avatar.png",
            x: canvas.width * 0.74,
            y: groundPos - bossH,
            w: Math.round(92 * scale),
            h: bossH,
            hp: 9999,
            maxHp: 9999,
            facing: -1,
            attackTimer: 165,
            attackAnimTimer: 0,
            banterAnimTimer: 0,
            moveDir: 1,
            hitFlash: 0,
            banterTimer: 260,
            isDummy: true
        };
        this.duoPartner = null;

        this.obstacles.push({ x: 430, y: groundPos - 54, w: 54, h: 54, type: 'warning_letter', cleared: false });
        this.obstacles.push({ x: 590, y: groundPos - 54, w: 54, h: 54, type: 'frisbee', cleared: false });
        this.collectibles.push({ x: 510, y: groundPos - 140, w: 46, h: 46, type: 'energy_drink', collected: false });

        this.showMemePopup("TRAININGSRAUM GESTARTET! TESTE [E], [Q] & [F]!");
    }

    exitDemoMode() {
        this.returnToMenu();
    }

    updateDemoMode(dt) {
        if (this.player.sprintTimer > 0) this.player.sprintTimer--;
        const speedMult = this.player.sprintTimer > 0 ? 1.52 : 1.0;

        if (this.keys['arrowright'] || this.keys['d']) {
            this.player.vx = this.player.speed * speedMult;
            this.player.facing = 1;
        } else if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.vx = -this.player.speed * speedMult;
            this.player.facing = -1;
        } else {
            this.player.vx = 0;
        }

        if (this.player.isDucking && this.player.isGrounded) {
            this.player.vx *= 0.80;
        } else if (this.player.isDucking && !this.player.isGrounded && this.player.vy > -1) {
            this.player.vy += 0.45;
        }

        this.player.x += this.player.vx;
        if (this.player.x < 30) this.player.x = 30;
        if (this.player.x > canvas.width - 110) this.player.x = canvas.width - 110;

        if (this.player.isGrounded && Math.abs(this.player.vx) > 2 && Math.random() > 0.65) {
            this.spawnRunDust(this.player.x + this.player.w * 0.35, this.player.groundY);
        }

        this.player.y += this.player.vy;
        this.player.vy += 0.68;
        if (this.player.y >= this.player.groundY - this.player.h) {
            this.player.y = this.player.groundY - this.player.h;
            this.player.vy = 0;
            this.player.isGrounded = true;
            if (this.player.jumpBuffered) {
                this.player.jumpBuffered = false;
                this.playerJump();
            }
        }

        // Instant free recharge in Demo Mode
        this.player.hp = this.player.maxHp;
        this.player.megaEnergy = 100;
        if (this.player.frisbeeCooldown > 0) this.player.frisbeeCooldown = Math.max(0, this.player.frisbeeCooldown - 5);
        if (this.player.blockCooldown > 0) this.player.blockCooldown = 0; if (this.player.lawBookCooldown > 0) this.player.lawBookCooldown = Math.max(0, this.player.lawBookCooldown - 2);
        this.updateBars();

        if (this.boss) {
            if (this.boss.hitFlash > 0) this.boss.hitFlash--;
            if (this.boss.attackAnimTimer > 0) this.boss.attackAnimTimer--;

            this.boss.facing = this.player.x < this.boss.x ? -1 : 1;
            // A perfect-block reflect stuns the dummy so the shout combo can be practised
            const dummyStunned = this.isBossStunned(this.boss);
            if (dummyStunned) {
                this.boss.ai.stun--;
            } else {
                this.boss.x += this.boss.moveDir * 1.6;
            }
            if (this.boss.x < canvas.width * 0.58) this.boss.moveDir = 1;
            else if (this.boss.x > canvas.width - 150) this.boss.moveDir = -1;

            if (!dummyStunned) this.boss.attackTimer--;
            if (this.boss.attackTimer <= 0) {
                this.boss.attackTimer = 175;
                this.boss.attackAnimTimer = 20;
                this.projectiles.push({
                    x: this.boss.x,
                    y: this.boss.y + this.boss.h * 0.36,
                    vx: -6.5,
                    vy: 0,
                    w: 44,
                    h: 28,
                    isPlayer: false,
                    type: 'frisbee',
                    damage: 5,
                    rotation: 0
                });
            }

            if (this.boss.hp < 1500) {
                this.boss.hp = 9999;
                this.addFloatingText("Dummy geheilt! Weiter üben!", this.boss.x + 20, this.boss.y - 25, '#2ed573', 20);
            }
        }

        for (const obs of this.obstacles) {
            const pHitY = (this.player.isDucking && this.player.isGrounded) ? this.player.y + this.player.h * 0.44 : this.player.y + 10;
            const pHitH = (this.player.isDucking && this.player.isGrounded) ? this.player.h * 0.54 : this.player.h - 14;
            if (this.checkCollision(this.player.x + 12, pHitY, this.player.w - 24, pHitH, obs.x, obs.y, obs.w, obs.h)) {
                if (this.player.isBlocking) {
                    this.onBlockSuccess(obs.x, obs.y);
                } else {
                    this.onPlayerHit(5, obs.type);
                }
            }
            if (!obs.cleared && obs.x + obs.w < this.player.x) {
                obs.cleared = true;
                this.onObstacleDodged();
            }
        }

        for (const col of this.collectibles) {
            if (col.collected) continue;
            if (this.checkCollision(this.player.x, this.player.y, this.player.w, this.player.h, col.x, col.y, col.w, col.h)) {
                col.collected = true;
                this.onCollectItem(col.type);
                setTimeout(() => { col.collected = false; }, 2800);
            }
        }

        this.ui.demoHitsVal.textContent = String(this.demoComboHits);
        this.ui.demoDmgVal.textContent = String(this.demoTotalDamage);
        this.updateProjectiles();
    }

    // =====================================================================
    // FULLSCREEN INTRO: MADE BY TECHI + 10s ALL-CAST SOUND CHAOS + LOBBY
    // =====================================================================
    startOpening() {
        this.clearFrisbeeTimers();
        if (this.openingExitTimeout) {
            clearTimeout(this.openingExitTimeout);
            this.openingExitTimeout = null;
        }
        if (this.openingCastTimeouts) {
            this.openingCastTimeouts.forEach((tid) => clearTimeout(tid));
            this.openingCastTimeouts.clear();
        }

        window.soundManager.stopAllClips();
        window.soundManager.stopMusic();
        this.hideGameplayHUDs();

        this.state = GAME_STATE.OPENING;
        this.openingState.active = true;
        this.openingState.elapsed = 0;
        this.openingState.techiChimePlayed = false;
        this.openingState.chaosEntered = false;
        this.openingState.currentStep = -1;

        this.ui.screenMenu.classList.add('hidden');
        this.ui.screenMenu.classList.remove('lobby-entering');
        this.ui.screenIntro.classList.add('hidden');

        if (this.ui.screenOpening) {
            this.ui.screenOpening.classList.remove('hidden', 'opening-exiting');
            this.ui.screenOpening.style.transform = 'none';
        }
        if (this.ui.openingTechiSplash) {
            this.ui.openingTechiSplash.classList.remove('phase-hidden');
        }
        if (this.ui.openingChaosStage) {
            this.ui.openingChaosStage.classList.add('phase-hidden');
            this.ui.openingChaosStage.style.transform = 'none';
        }
        if (this.ui.openingFxLayer) {
            this.ui.openingFxLayer.innerHTML = '';
        }
        if (this.ui.openingCastSlots) {
            this.ui.openingCastSlots.forEach((slot) => {
                slot.classList.remove('speaking');
                const bubble = slot.querySelector('.cast-bubble');
                if (bubble) bubble.textContent = '';
            });
        }
        if (this.ui.openingProgress) this.ui.openingProgress.style.width = '0%';
        if (this.ui.openingCountdownTxt) this.ui.openingCountdownTxt.textContent = '10s';
    }

    highlightOpeningCast(castKey, bubbleText = '', durationMs = 1350) {
        if (!this.ui.openingCastSlots) return;
        if (!this.openingCastTimeouts) this.openingCastTimeouts = new Map();

        const targets = castKey === 'all'
            ? Array.from(this.ui.openingCastSlots)
            : Array.from(this.ui.openingCastSlots).filter((s) => s.getAttribute('data-cast') === castKey);

        targets.forEach((slot) => {
            const role = slot.getAttribute('data-cast') || 'cast';
            if (this.openingCastTimeouts.has(role)) {
                clearTimeout(this.openingCastTimeouts.get(role));
            }
            const bubble = slot.querySelector('.cast-bubble');
            if (bubble) {
                bubble.textContent = bubbleText || (castKey === 'all' ? 'TARONUMAN!!' : '!');
            }
            slot.classList.remove('speaking');
            void slot.offsetWidth;
            slot.classList.add('speaking');

            const tid = setTimeout(() => {
                slot.classList.remove('speaking');
                this.openingCastTimeouts.delete(role);
            }, durationMs);
            this.openingCastTimeouts.set(role, tid);
        });
    }

    spawnOpeningSpark(castKeyOrEl, emoji = '⚡') {
        const layer = this.ui.openingFxLayer;
        if (!layer) return;

        let sourceEls = [];
        if (typeof castKeyOrEl === 'string') {
            if (castKeyOrEl === 'all' && this.ui.openingCastSlots) {
                sourceEls = Array.from(this.ui.openingCastSlots);
            } else if (this.ui.openingCastSlots) {
                sourceEls = Array.from(this.ui.openingCastSlots).filter((s) => s.getAttribute('data-cast') === castKeyOrEl);
            }
        } else if (castKeyOrEl) {
            sourceEls = [castKeyOrEl];
        }
        if (sourceEls.length === 0) return;

        const layerRect = layer.getBoundingClientRect();
        if (!layerRect || layerRect.width <= 0) return;

        sourceEls.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const spark = document.createElement('span');
            spark.className = 'opening-fx-spark';
            spark.textContent = emoji;

            const startX = rect.left - layerRect.left + rect.width * (0.35 + Math.random() * 0.3);
            const startY = rect.top - layerRect.top + rect.height * 0.18;
            const dir = Math.random() > 0.5 ? 1 : -1;
            spark.style.left = `${Math.round(startX)}px`;
            spark.style.top = `${Math.round(startY)}px`;
            spark.style.setProperty('--tx-mid', `${Math.round(dir * (22 + Math.random() * 24))}px`);
            spark.style.setProperty('--tx-end', `${Math.round(dir * (65 + Math.random() * 85))}px`);
            spark.style.setProperty('--ty-end', `${Math.round(-65 - Math.random() * 55)}px`);
            layer.appendChild(spark);

            setTimeout(() => {
                if (spark.parentNode) spark.parentNode.removeChild(spark);
            }, 980);
        });
    }

    updateOpening(dt) {
        if (!this.openingState.active) return;
        this.openingState.elapsed += dt;
        const elapsed = this.openingState.elapsed;
        const techiDur = this.openingState.techiDuration;
        const totalDur = this.openingState.totalDuration;

        if (!this.openingState.techiChimePlayed && elapsed >= 0.04) {
            this.openingState.techiChimePlayed = true;
            window.soundManager.playIntroTechiChime();
        }

        if (elapsed >= techiDur) {
            if (!this.openingState.chaosEntered) {
                this.openingState.chaosEntered = true;
                if (this.ui.openingTechiSplash) this.ui.openingTechiSplash.classList.add('phase-hidden');
                if (this.ui.openingChaosStage) this.ui.openingChaosStage.classList.remove('phase-hidden');
            }

            const chaosDur = Math.max(0.1, totalDur - techiDur);
            const ratio = Math.max(0, Math.min(1.0, (elapsed - techiDur) / chaosDur));
            const remainingSec = Math.max(0, Math.ceil(totalDur - elapsed));
            if (this.ui.openingProgress) this.ui.openingProgress.style.width = `${(ratio * 100).toFixed(1)}%`;
            if (this.ui.openingCountdownTxt) this.ui.openingCountdownTxt.textContent = `${remainingSec}s`;

            while (
                this.openingState.currentStep + 1 < this.openingSteps.length &&
                elapsed >= this.openingSteps[this.openingState.currentStep + 1].time
            ) {
                this.openingState.currentStep++;
                const step = this.openingSteps[this.openingState.currentStep];

                if (this.ui.openingFlashText) {
                    this.ui.openingFlashText.textContent = step.title;
                    this.ui.openingFlashText.style.color = step.color || '#ffd32a';
                }
                if (this.ui.openingShoutBanner) {
                    this.ui.openingShoutBanner.textContent = step.quote;
                    this.ui.openingShoutBanner.style.borderColor = step.color || '#ffeb3b';
                }

                this.highlightOpeningCast(step.cast, step.bubble, 1450);
                this.spawnOpeningSpark(step.cast, step.spark || '⚡');

                this.screenShake = step.shake || 14;
                // Deliberately allow voice clips to overlap on Opening Launch Stage regardless of in-game Sound Stufe
                if (step.clip) window.soundManager.playClip(step.clip, null, 1.0, { bypassLimit: true });
                if (step.extraClip) window.soundManager.playClip(step.extraClip, null, 1.0, { bypassLimit: true });
            }

            if (this.ui.openingChaosStage) {
                if (this.screenShake > 0) {
                    const rx = (Math.random() - 0.5) * this.screenShake * 0.7;
                    const ry = (Math.random() - 0.5) * this.screenShake * 0.7;
                    this.ui.openingChaosStage.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
                } else {
                    this.ui.openingChaosStage.style.transform = 'none';
                }
            }
        }

        if (elapsed >= totalDur) {
            this.finishOpening(false);
        }
    }

    finishOpening(immediate = true) {
        if (this.state !== GAME_STATE.OPENING) return;
        this.openingState.active = false;
        this.state = GAME_STATE.MENU;

        if (this.openingCastTimeouts) {
            this.openingCastTimeouts.forEach((tid) => clearTimeout(tid));
            this.openingCastTimeouts.clear();
        }
        if (this.openingExitTimeout) {
            clearTimeout(this.openingExitTimeout);
            this.openingExitTimeout = null;
        }
        if (this.ui.openingChaosStage) {
            this.ui.openingChaosStage.style.transform = 'none';
        }

        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playMenuMusic();
        this.syncLobbyMusicSelect();

        if (immediate) {
            window.soundManager.stopAllClips();
            if (this.ui.screenOpening) {
                this.ui.screenOpening.classList.remove('opening-exiting');
                this.ui.screenOpening.classList.add('hidden');
                this.ui.screenOpening.style.transform = 'none';
            }
            this.ui.screenMenu.classList.remove('hidden', 'lobby-entering');
            this.screenShake = 10;
            return;
        }

        window.soundManager.fadeOutAllClips(450);
        this.ui.screenMenu.classList.remove('hidden');
        this.ui.screenMenu.classList.add('lobby-entering');
        if (this.ui.screenOpening) {
            this.ui.screenOpening.classList.add('opening-exiting');
        }
        this.openingExitTimeout = setTimeout(() => {
            this.openingExitTimeout = null;
            if (this.ui.screenOpening) {
                this.ui.screenOpening.classList.add('hidden');
                this.ui.screenOpening.classList.remove('opening-exiting');
                this.ui.screenOpening.style.transform = 'none';
            }
            if (this.ui.screenMenu) {
                this.ui.screenMenu.classList.remove('lobby-entering');
            }
        }, 660);
    }

    // =====================================================================
    // FULLSCREEN CRAZY RANDOM-CONVERSATION STORY INTRO
    // =====================================================================
    buildRandomIntroConversation() {
        const CAST = {
            thenerean: {
                key: 'thenerean', name: 'THENEREAN', tag: 'THENEREAN • EFZ', tagClass: 'tag-hero',
                faces: 'right', wide: false,
                sprites: {
                    idle: 'assets/sprites/characters/thenerean_idle.png',
                    attack: 'assets/sprites/characters/thenerean_attack.png',
                    block: 'assets/sprites/characters/thenerean_block.png',
                    jump: 'assets/sprites/characters/thenerean_jump.png',
                    duck: 'assets/sprites/characters/thenerean_duck.png'
                }
            },
            monika: {
                key: 'monika', name: 'MONIKA SCHNEIDER', tag: 'MONIKA', tagClass: 'tag-boss',
                faces: 'left', wide: false,
                sprites: {
                    idle: 'assets/sprites/characters/monika_idle.png',
                    point: 'assets/sprites/characters/monika_point.png',
                    attack: 'assets/sprites/characters/monika_attack.png',
                    walk: 'assets/sprites/characters/monika_walk.png'
                }
            },
            adam: {
                key: 'adam', name: 'HERR ADAM', tag: 'HERR ADAM', tagClass: 'tag-cyan',
                faces: 'left', wide: false,
                sprites: {
                    idle: 'assets/sprites/characters/adam_idle.png',
                    throw: 'assets/sprites/characters/adam_throw.png',
                    windup: 'assets/sprites/characters/adam_windup.png',
                    run: 'assets/sprites/characters/adam_run.png'
                }
            },
            student: {
                key: 'student', name: 'GIBB SCHÜLER', tag: 'GIBB SCHÜLER', tagClass: 'tag-cyan',
                faces: 'left', wide: false,
                sprites: {
                    idle: 'assets/sprites/characters/gibb_student_idle.png',
                    windup: 'assets/sprites/characters/gibb_student_windup.png',
                    attack: 'assets/sprites/characters/gibb_student_attack.png',
                    walk: 'assets/sprites/characters/gibb_student_walk.png'
                }
            },
            tuktuk: {
                key: 'tuktuk', name: 'TUKTUK MK-I', tag: 'TUKTUK MK-I', tagClass: 'tag-orange',
                faces: 'left', wide: true,
                sprites: {
                    idle: 'assets/sprites/characters/tuktuk_idle.png',
                    rage: 'assets/sprites/characters/tuktuk_rage.png'
                }
            },
            tuktuk_dual: {
                key: 'tuktuk_dual', name: 'DUAL-GPU MK-II', tag: 'DUAL-GPU MK-II', tagClass: 'tag-red',
                faces: 'left', wide: true,
                sprites: {
                    idle: 'assets/sprites/characters/tuktuk_dual_idle.png',
                    rage: 'assets/sprites/characters/tuktuk_dual_rage.png'
                }
            }
        };

        const SCENARIOS = [
            {
                title: "ABSENZEN-TRIBUNAL: LIPPENSTIFT & 2.54 SEKUNDEN",
                context: "08:04 Uhr vor Zimmer B201 — die Diskussion eskaliert komplett.",
                left: 'monika', right: 'thenerean',
                beats: [
                    { side: 'left',  actor: 'monika',    pose: 'point',  text: "2.54 Sekunden z'spät!! Was machsch du überhoupt vor der Türe?!", clip: 'monika_puenktlichkeit', emoji: '⏱️', quote: "PÜNKTLICHKEIT ISCH OBERSTE GEBOT!", dur: 4.5 },
                    { side: 'right', actor: 'thenerean', pose: 'attack', text: "Herr Adam, ich stah doch da! Ich ha nur mini Lippenstift verlore!", clip: 'thenerean_lippenstift', emoji: '💄', quote: "4 MINUTEN + 1 LIPPENSTIFT!", dur: 4.3 },
                    { side: 'left',  actor: 'monika',    pose: 'attack', text: "Kei Chopfhörer! Ussedem staht mis Passwort i de Gsetzestext!", clip: 'monika_passwort_buech', emoji: '🔐', quote: "PASSWORT = OR / ZGB?", dur: 4.3 },
                    { side: 'right', actor: 'thenerean', pose: 'block',  text: "Morgartenstrasse isch blockiert! Das isch e absoluti Frechheit!", clip: 'thenerean_morgarten_blockiert', emoji: '🚧', quote: "VERKEHRS-BLOCKADE IN BERN!", dur: 4.3 },
                    { side: 'left',  actor: 'monika',    pose: 'point',  text: "Dini Lehrziit gaht i d'Altstadt abe — AB IN LEVEL 1!!", clip: 'monika_altstadt_lehre', emoji: '🏫', quote: "LEHRE GEGEN ALLE!", dur: 4.6 }
                ]
            },
            {
                title: "SPORTHALLE: DAS GENEHMIGTE SPORTLEHRER-SETUP",
                context: "Herr Adam inspiziert Thenereans Prüfungs-Ausrüstung mitten im Turnsaal.",
                left: 'adam', right: 'thenerean',
                beats: [
                    { side: 'left',  actor: 'adam',      pose: 'windup', text: "Silvankumar, ist der Thenerean da?! Absenzenliste brännt!", clip: 'adam_silvankumar', emoji: '📋', quote: "WO ISCH THENEREAN?!", dur: 4.2 },
                    { side: 'right', actor: 'thenerean', pose: 'attack', text: "ICH STAH DOCH DA! Lueg mal mis geilschte GIBB-Setup aa!", clip: 'thenerean_geilschte_setup', emoji: '🖥️', quote: "RGB + 20 FRISBEES!", dur: 4.4 },
                    { side: 'left',  actor: 'adam',      pose: 'idle',   text: "Moment... Sportlehrer-Setup isch krass — eigentlich genehmigt!", clip: 'adam_setup_genehmigt', emoji: '✅', quote: "SETUP OFFIZIELL GENEHMIGT!", dur: 4.4 },
                    { side: 'right', actor: 'thenerean', pose: 'jump',   text: "YES! Jetzt isch Sirünän offiziell de Gemini King!!", clip: 'thenerean_gemini_king', emoji: '👑', quote: "GEMINI KING AKTIVIERT!", dur: 4.1 },
                    { side: 'left',  actor: 'adam',      pose: 'throw',  text: "Trotzdem Strafe!! DA HAST DU 20 FRISBEES — RENN LOS!!", clip: 'adam_20_frisbees', emoji: '🥏', quote: "20 FRISBEES IM ANFLUG!", dur: 4.5 }
                ]
            },
            {
                title: "MENSA-KONFERENZ: CHICKEN CURRY & V-BUCKS",
                context: "Krise am GIBB-Kiosk: Der Bankomat nimmt nur noch Jetons und Melonen.",
                left: 'monika', right: 'thenerean',
                beats: [
                    { side: 'left',  actor: 'monika',    pose: 'idle',   text: "Gell, s'Chicken Curry i de Mensa isch hüt wieder guet?!", clip: 'monika_chicken_curry', emoji: '🍛', quote: "MENSA CURRY SPECIAL!", dur: 4.3 },
                    { side: 'right', actor: 'thenerean', pose: 'block',  text: "Frau Schneider, de Bankomat frist mini Karte! Her mit de V-Bucks!", clip: 'thenerean_tamil_vbucks', emoji: '🪙', quote: "V-BUCKS ODER JETONS?!", dur: 4.4 },
                    { side: 'left',  actor: 'student',   pose: 'windup', text: "Haha! Ich will Fortnite & TikTok statt ABU-Unterricht!", clip: 'student_tiktok_fortnite', emoji: '🎮', quote: "FORTNITE AM KIOSK!", dur: 4.2 },
                    { side: 'right', actor: 'thenerean', pose: 'attack', text: "Du hesch gmeint du bisch Bankomat?! Sälber Bankomat, Digga!!", clip: 'thenerean_selber_bankomat', emoji: '🏧', quote: "BANKOMAT-KONTER!", dur: 4.2 },
                    { side: 'left',  actor: 'adam',      pose: 'windup', text: "HILF MIR!! D'Schüeler werfed Laptops im Gang!!", clip: 'adam_hilf_mir', emoji: '🆘', quote: "ALARM IM KORRIDOR!", dur: 4.3 }
                ]
            },
            {
                title: "SRI LANKA HARDWARE-NOTFALL IM TUKTUK",
                context: "Im GIBB-Serverraum startet ein TukTuk mit zwei RTX-Grafikkarten.",
                left: 'tuktuk_dual', right: 'thenerean',
                beats: [
                    { side: 'left',  actor: 'tuktuk_dual', pose: 'idle', text: "VROOOOM!! Isst d'Melone mit zwei RTX Grafikkarten!!", clip: 'tuktuk_gpu_melone', emoji: '🍉', quote: "2× RTX MELONEN-KÜHLUNG!", dur: 4.4 },
                    { side: 'right', actor: 'thenerean',   pose: 'duck', text: "Nein! Schon wieder Grafikkarte Fehler! Verdammte Maschine!", clip: 'thenerean_gpu', emoji: '🔧', quote: "TREIBER ABGESTÜRZT!", dur: 4.4 },
                    { side: 'left',  actor: 'tuktuk_dual', pose: 'rage', text: "TÄSCHFRESSER!! VRAM bei 120 Grad — Overclock aktiviert!!", clip: 'tuktuk_taeschfresser_gpu', emoji: '🔥', quote: "GPU OVERCLOCK MK-II!", dur: 4.5 },
                    { side: 'right', actor: 'thenerean',   pose: 'attack', text: "Ich bring Stickstoff direkt aus Sri Lanka! Niemert chunt verbi!", clip: 'thenerean_srilanka', emoji: '🇱🇰', quote: "SRI LANKA NITRO!", dur: 4.2 },
                    { side: 'left',  actor: 'monika',      pose: 'attack', text: "KEI CHOPFHÖRER AM TUKTUK!! AUF ZUM PRÜFUNGS-KAMPF!", clip: 'monika_keine_kopfhoerer', emoji: '⚡', quote: "ABFAHRT IN D'LEHRE!", dur: 4.5 }
                ]
            },
            {
                title: "ABU B404: EINGESPERRT MIT DEM CRINGE KING",
                context: "Zwischen ABU-Test und TikTok verliert jeder komplett den Faden.",
                left: 'student', right: 'monika',
                beats: [
                    { side: 'left',  actor: 'student',   pose: 'attack', text: "Ich bin der Cringe King von TikTok — kei Modulprüefig für mich!", clip: 'student_cringe_king', emoji: '📱', quote: "TIKTOK BOSSFIGHT!", dur: 4.3 },
                    { side: 'right', actor: 'monika',    pose: 'point',  text: "Das isch jetzt würkli en ABU-Test! Mir spärred di im Zimmer B404 ii!", clip: 'monika_abu_eingesperrt', emoji: '🔒', quote: "ABU-ZIMMER VERRIEGELT!", dur: 4.5 },
                    { side: 'left',  actor: 'adam',      pose: 'throw',  text: "Silvankumar! Du bisch als abwesend iigtreit worde!", clip: 'adam_abwesend_sketch', emoji: '📝', quote: "ROT IN DER LISTE!", dur: 4.3 },
                    { side: 'right', actor: 'thenerean', pose: 'block',  text: "Z'SPÄT?! Da git's nüt z'diskutiere — ICH RASCHT COMPLETELY US!!", clip: 'thenerean_zspaet_raschtaus', emoji: '💢', quote: "ULTRA-ESKALATION!", dur: 4.4 },
                    { side: 'left',  actor: 'monika',    pose: 'attack', text: "Selberbank! Si müend das jetz uf em Spielfeld korrigiere!!", clip: 'monika_adam_korrigiere', emoji: '📘', quote: "LEHRE WIRD JETZT GEKLÄRT!", dur: 4.5 }
                ]
            },
            {
                title: "TARONUMAN-BEICHTE VOR DEM MIKROFON",
                context: "Durchsage über den GIBB-Schullautsprecher — ergibt 0% Sinn, klingt 100% legendär.",
                left: 'adam', right: 'thenerean',
                beats: [
                    { side: 'left',  actor: 'monika',    pose: 'idle',   text: "Hallo? Mikrofon-Test? Hilf mir, d'Schüeler losed nöd zue!", clip: 'monika_mikrofon_hilfe', emoji: '🎙️', quote: "DURCHSAGE IM HAUS!", dur: 4.3 },
                    { side: 'right', actor: 'thenerean', pose: 'attack', text: "BANANA MONIKA!! Das isch dr Heiligi Gral vom Informatik-EFZ!", clip: 'thenerean_banana_monika', emoji: '🍌', quote: "BANANA-TAKTIK!", dur: 4.3 },
                    { side: 'left',  actor: 'tuktuk',    pose: 'rage',   text: "*TukTuk hupt ins Mikrofon* TÄSCHFRESSER!! Grafikkarte brennt!!", clip: 'tuktuk_taeschfresser_gpu', emoji: '🛺', quote: "TUKTUK AM MIKRO!", dur: 4.3 },
                    { side: 'right', actor: 'thenerean', pose: 'jump',   text: "TARONUMAN!! AAAAAAHHH!! Ich stah doch schon die ganzi Ziit da!", clip: 'thenerean_taronuman_scream', emoji: '💥', quote: "MAXIMALER SCHREI!", dur: 4.2 },
                    { side: 'left',  actor: 'adam',      pose: 'throw',  text: "Du hesch de Schuss verpasst — zur Strafe startisch bi Level 1!!", clip: 'adam_strafe_verpasst', emoji: '⚽', quote: "STRAFE = LEVEL 1 START!", dur: 4.4 }
                ]
            },
            {
                title: "EFZ NOTFALL-SITZUNG: DIE VERSPÄTUNGS-AUSREDE",
                context: "Montag 08:06 — Alle widersprechen sich gleichzeitig (aber schön der Reihe nach).",
                left: 'monika', right: 'thenerean',
                beats: [
                    { side: 'right', actor: 'thenerean', pose: 'idle',   text: "Entschuldigung Monika Schneider... ich bi würkli nur 4 Minute z'spät!", clip: 'thenerean_entschuldigung', emoji: '🚆', quote: "SBB HATTE SCHULD!", dur: 4.5 },
                    { side: 'left',  actor: 'monika',    pose: 'point',  text: "2.54 Sekunde langed scho! Gang uf di Platz!!", clip: 'monika_gang_uf_platz', emoji: '🪑', quote: "SOFORT UF D'PLATZ!", dur: 4.2 },
                    { side: 'right', actor: 'thenerean', pose: 'attack', text: "Ultra-Prozessore im Rucksack hend's Netz überlaschtet!", clip: 'thenerean_ultra', emoji: '⚡', quote: "ULTRA-AUSREDE!", dur: 4.2 },
                    { side: 'left',  actor: 'adam',      pose: 'idle',   text: "MWAHAHAHA — niemert chunt ohni EFZ-Prüefig durs Tor!", clip: 'boss_evil_laugh', emoji: '😈', quote: "PRÜFUNGS-KOMMISSION!", dur: 4.2 },
                    { side: 'right', actor: 'thenerean', pose: 'block',  text: "Holt euch s'Heilige Gral Diplom — ich stah bis zum Schluss!!", clip: 'thenerean_heilig_gral', emoji: '🏆', quote: "AUF ZUR NOTE 6.0!", dur: 4.5 }
                ]
            }
        ];

        const WILDCARD_BEATS = [
            { side: 'left',  actor: 'monika',      pose: 'idle',   text: "Moment mal kurz — s'Chicken Curry hüt isch eifach überragend, gell?", clip: 'monika_chicken_curry', emoji: '🍛', quote: "PLOT-TWIST: CHICKEN CURRY!", dur: 4.2 },
            { side: 'right', actor: 'thenerean',   pose: 'jump',   text: "BANANA MONIKA!! Kei Ahnung was lauft, aber ich mach trotzdem Note 6.0!", clip: 'thenerean_banana_monika', emoji: '🍌', quote: "SINN = OPTIONAL!", dur: 4.2 },
            { side: 'left',  actor: 'tuktuk_dual', pose: 'rage',   text: "*Rauscht quer durchs Zimmer* Melone mit ZWEI RTX Grafikkarten!!", clip: 'tuktuk_gpu_melone', emoji: '🍉', quote: "TUKTUK CAMEO!", dur: 4.2 },
            { side: 'left',  actor: 'adam',        pose: 'windup', text: "HILF MIR!! Wer hät 20 Frisbees im Serverraum bstellt?!", clip: 'adam_hilf_mir', emoji: '🆘', quote: "HERR ADAM PANIK!", dur: 4.0 },
            { side: 'right', actor: 'thenerean',   pose: 'attack', text: "Du bisch selber en Bankomat! Jetzt gits s'Heilige Gral-Update!", clip: 'thenerean_selber_bankomat', emoji: '🏧', quote: "RANDOM KONTER!", dur: 4.1 },
            { side: 'left',  actor: 'student',     pose: 'windup', text: "TikTok Live!! Lueget wie Monika s'Gsetzbuech wirft!", clip: 'student_tiktok_fortnite', emoji: '📱', quote: "LIVESTREAM AN!", dur: 4.1 }
        ];

        const base = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
        const beats = base.beats.map((b) => ({ ...b }));

        // Optionally splice 1 completely random non-sequitur punchline on turn 2 or 3 for fresh chaos!
        if (Math.random() > 0.35) {
            const slotIdx = Math.random() > 0.5 ? 2 : 3;
            const filtered = WILDCARD_BEATS.filter((w) => w.clip !== beats[slotIdx].clip);
            if (filtered.length > 0) {
                const wc = filtered[Math.floor(Math.random() * filtered.length)];
                beats[slotIdx] = { ...wc };
            }
        }

        const totalDuration = beats.reduce((acc, b) => acc + (b.dur || 4.3), 0);
        return {
            episodeNum: 101 + Math.floor(Math.random() * 899),
            title: base.title,
            context: base.context,
            defaultLeft: base.left,
            defaultRight: base.right,
            castCatalog: CAST,
            beats,
            totalDuration
        };
    }

    startCinematicIntro() {
        this.state = GAME_STATE.INTRO;
        if (this.ui.screenMenu) this.ui.screenMenu.classList.add('hidden');
        if (this.ui.screenPrestart) this.ui.screenPrestart.classList.add('hidden');
        if (this.ui.screenStory) this.ui.screenStory.classList.add('hidden');
        if (this.ui.screenLvlSelect) this.ui.screenLvlSelect.classList.add('hidden');
        if (this.ui.screenIntro) this.ui.screenIntro.classList.remove('hidden');

        this.introScript = this.buildRandomIntroConversation();
        this.introChapters = this.introScript.beats;
        this.introState.active = true;
        this.introState.elapsed = 0;
        this.introState.beatElapsed = 0;
        this.introState.totalDuration = this.introScript.totalDuration;
        this.introState.currentStep = -1;
        this.introState.beats = this.introScript.beats;

        if (this.ui.introEpisodeBadge) {
            this.ui.introEpisodeBadge.textContent = `🎲 GIBB EPISODE #${this.introScript.episodeNum}`;
        }
        if (this.ui.introStepTitle) this.ui.introStepTitle.textContent = this.introScript.title;
        if (this.ui.introSpeechText) this.ui.introSpeechText.textContent = this.introScript.context;
        this.syncSetupControlsUI();

        this.setIntroActorVisual('left', this.introScript.defaultLeft, 'idle');
        this.setIntroActorVisual('right', this.introScript.defaultRight, 'idle');
        if (this.ui.introLineLeft) this.ui.introLineLeft.textContent = '...';
        if (this.ui.introLineRight) this.ui.introLineRight.textContent = '...';
        if (this.ui.introFxLayer) this.ui.introFxLayer.innerHTML = '';

        window.soundManager.setMusicQuietMode(true);
        window.soundManager.playMusic('assets/music/That_s_The_One.mp3');
        this.applyIntroBeat(0);
    }

    rerollIntroConversation() {
        if (this.state !== GAME_STATE.INTRO) return;
        this.startCinematicIntro();
    }

    setIntroActorVisual(side, actorKey, pose = 'idle') {
        const cast = this.introScript && this.introScript.castCatalog && this.introScript.castCatalog[actorKey];
        if (!cast) return;
        const isLeft = side === 'left';
        const actorEl = isLeft ? this.ui.introActorLeft : this.ui.introActorRight;
        const speakerEl = isLeft ? this.ui.introSpeakerLeft : this.ui.introSpeakerRight;
        const spriteEl = isLeft ? this.ui.introSpriteLeft : this.ui.introSpriteRight;
        const tagEl = isLeft ? this.ui.introTagLeft : this.ui.introTagRight;

        if (actorEl) {
            actorEl.classList.toggle('actor-wide', Boolean(cast.wide));
        }
        if (speakerEl) speakerEl.textContent = cast.name;
        if (tagEl) {
            tagEl.textContent = cast.tag;
            tagEl.className = `fighter-tag ${cast.tagClass || 'tag-hero'}`;
        }
        if (spriteEl) {
            const src = (cast.sprites && (cast.sprites[pose] || cast.sprites.idle)) || 'assets/sprites/characters/thenerean_idle.png';
            spriteEl.src = src;
            spriteEl.alt = cast.name;
            // Face inward toward the center: left actor must face RIGHT, right actor must face LEFT
            const needsFlip = isLeft ? (cast.faces === 'left') : (cast.faces === 'right');
            spriteEl.classList.toggle('flip-x', needsFlip);
        }
    }

    spawnIntroFx(side, emoji = '💬') {
        const layer = this.ui.introFxLayer;
        if (!layer) return;
        const pop = document.createElement('span');
        pop.className = 'intro-fx-pop';
        pop.textContent = emoji;
        const baseX = side === 'left' ? (22 + Math.random() * 14) : (64 + Math.random() * 14);
        const baseY = 34 + Math.random() * 16;
        pop.style.left = `${baseX.toFixed(1)}%`;
        pop.style.top = `${baseY.toFixed(1)}%`;
        layer.appendChild(pop);
        setTimeout(() => {
            if (pop.parentNode) pop.parentNode.removeChild(pop);
        }, 1360);
    }

    applyIntroBeat(idx) {
        if (!this.introScript || !this.introScript.beats || idx < 0 || idx >= this.introScript.beats.length) return;
        const beats = this.introScript.beats;
        this.introState.currentStep = idx;
        this.introState.beatElapsed = 0;
        const beat = beats[idx];

        const isLeft = beat.side === 'left';
        this.setIntroActorVisual(beat.side, beat.actor, beat.pose || 'idle');

        if (this.ui.introActorLeft) this.ui.introActorLeft.classList.toggle('active-speaker', isLeft);
        if (this.ui.introActorRight) this.ui.introActorRight.classList.toggle('active-speaker', !isLeft);

        if (isLeft && this.ui.introLineLeft) {
            this.ui.introLineLeft.textContent = `"${beat.text}"`;
        } else if (!isLeft && this.ui.introLineRight) {
            this.ui.introLineRight.textContent = `"${beat.text}"`;
        }

        if (this.ui.introStampEmoji) this.ui.introStampEmoji.textContent = beat.emoji || '💬';
        if (this.ui.introQuote) this.ui.introQuote.textContent = `"${beat.quote || ''}"`;

        if (this.ui.introDots) {
            this.ui.introDots.forEach((dot, dIdx) => {
                dot.classList.toggle('done', dIdx < idx);
                dot.classList.toggle('active', dIdx === idx);
            });
        }

        if (this.ui.btnNextIntro) {
            this.ui.btnNextIntro.textContent = (idx + 1 >= beats.length) ? 'INS LEVEL 1 ▶' : 'WEITER [ENTER] ▶';
        }

        this.spawnIntroFx(beat.side, beat.emoji || '⚡');

        // Clean single-voice playback ("nicht zu viele durcheinander")
        if (beat.clip) {
            window.soundManager.playClip(beat.clip, null, 1.0, { forceSolo: true });
        }
    }

    advanceIntroBeat() {
        if (!this.introState.active || !this.introScript) return;
        const nextIdx = this.introState.currentStep + 1;
        if (nextIdx >= this.introScript.beats.length) {
            this.skipIntro();
            return;
        }
        // Fast-forward elapsed time smoothly to match remaining beats
        const completed = this.introScript.beats.slice(0, nextIdx).reduce((acc, b) => acc + (b.dur || 4.3), 0);
        this.introState.elapsed = completed;
        this.applyIntroBeat(nextIdx);
    }

    updateCinematicIntro(dt) {
        if (!this.introState.active || !this.introScript) return;
        const beats = this.introScript.beats || [];
        const curBeat = beats[this.introState.currentStep];
        const beatDur = (curBeat && curBeat.dur) || 4.3;

        this.introState.beatElapsed += dt;
        this.introState.elapsed += dt;

        const completedBefore = beats.slice(0, Math.max(0, this.introState.currentStep)).reduce((acc, b) => acc + (b.dur || 4.3), 0);
        const totalDur = Math.max(1, this.introState.totalDuration || 22);
        const progressPercent = Math.min(100, ((completedBefore + Math.min(beatDur, this.introState.beatElapsed)) / totalDur) * 100);
        if (this.ui.introTimerBar) this.ui.introTimerBar.style.width = `${progressPercent.toFixed(1)}%`;

        if (this.ui.introTimeHint) {
            const remBeat = Math.max(0, Math.ceil(beatDur - this.introState.beatElapsed));
            this.ui.introTimeHint.textContent = `Dialog ${this.introState.currentStep + 1} / ${beats.length} • ${remBeat}s`;
        }

        if (this.introState.beatElapsed >= beatDur) {
            if (this.introState.currentStep + 1 < beats.length) {
                this.applyIntroBeat(this.introState.currentStep + 1);
            } else {
                this.skipIntro();
            }
        }
    }

    skipIntro() {
        this.introState.active = false;
        window.soundManager.stopAllClips();
        if (this.ui.screenIntro) this.ui.screenIntro.classList.add('hidden');
        this.startLevel(0);
    }

    // =====================================================================
    // LEVEL START & PROGRESSION
    // =====================================================================
    startLevel(index) {
        this.clearFrisbeeTimers();
        window.soundManager.stopAllClips();

        this.currentLevelIndex = index;
        this.level = LEVELS_CONFIG[index];

        this.resizeCanvas();
        const groundPos = this.player.groundY;
        this.player.x = 110;
        this.player.y = groundPos - this.player.h;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.facing = 1;
        this.player.isGrounded = true;
        this.player.banterTimer = 220;
        this.player.lastSafeWorldX = 110;
        this.resetRunStats();
        this.worldDistance = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.platforms = [];
        this.lavaPits = [];
        this.boostPads = [];
        this.projectiles = [];
        this.particles = [];
        this.shockwaves = [];
        this.floatingTexts = [];
        this.boss = null;
        this.duoPartner = null;
        this.midBossTriggered = false;
        this.midBossDefeated = false;
        this.vanguardDefeated = false;
        this.timeRemaining = 0;
        this.lastTickSec = -1;
        this.targets = [];
        this.targetsHit = 0;
        this.targetsTotal = 0;
        this.jetonsCollected = 0;
        this.jetonsTotal = 0;
        this.touchDuckHeld = false;
        this.currentWaveIndex = 0;
        this.chaser = null;
        this.arenaSwitch = null;
        this.floorHazardCooldown = 0;
        this.resetCombatExtras();

        this.ui.screenMenu.classList.add('hidden');
        if (this.ui.screenPrestart) this.ui.screenPrestart.classList.add('hidden');
        this.ui.screenIntro.classList.add('hidden');
        this.ui.screenWin.classList.add('hidden');
        this.ui.screenLose.classList.add('hidden');
        this.ui.screenVictory.classList.add('hidden');
        this.ui.dialogueBox.classList.add('hidden');
        this.ui.bossHudBanner.classList.add('hidden');
        this.ui.demoComboHud.classList.add('hidden');
        if (this.ui.btnDemoExit) this.ui.btnDemoExit.classList.add('hidden');

        this.ui.bar.classList.remove('hidden');
        this.ui.abilityDock.classList.remove('hidden');
        this.ui.controlHintPill.classList.remove('hidden');
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            if (this.ui.controlHintPill) this.ui.controlHintPill.classList.add('hidden');
        }, 7000);

        this.ui.yearBadge.textContent = this.level.yearText;
        this.ui.lvlName.textContent = this.level.name;
        this.ui.progBar.style.width = '0%';
        this.ui.progValText.textContent = '0%';
        this.updateBars();

        // Play upbeat stage music while running, then duck gently when reaching Boss
        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playMusic(this.level.music);

        const mode = this.level.mode || 'standard';
        if (this.level.featureTag) {
            this.showMemePopup(this.level.featureTag);
        }

        if (this.level.hasVanguard) {
            this.vanguardDefeated = false;
            this.player.x = Math.round(canvas.width * 0.14);
            this.ui.progBar.style.width = '50%';
            this.ui.progValText.textContent = 'AUFSICHT';
            this.triggerVanguardEncounter();
            this.updateMissionPill();
            this.updateTouchControlsVisibility();
            return;
        }

        if (mode === 'direct_boss' || mode === 'duo_finale_platforms' || mode === 'gauntlet_trio_combo') {
            this.player.x = Math.round(canvas.width * 0.14);
            this.ui.progBar.style.width = '100%';
            this.ui.progValText.textContent = (mode === 'duo_finale_platforms' || mode === 'gauntlet_trio_combo') ? 'ARENA-KOMBO' : 'ARENA';
            this.triggerPreBossEncounter();
            this.updateMissionPill();
            this.updateTouchControlsVisibility();
            return;
        }

        if (mode === 'wave_rush') {
            this.player.x = Math.round(canvas.width * 0.20);
            this.startWave(0);
            return;
        }

        if (mode === 'time_attack') {
            this.timeRemaining = this.level.timeLimitSec || 34;
            this.lastTickSec = Math.ceil(this.timeRemaining);
        }

        this.generateLevelObstacles();

        if (mode === 'target_run_boss') {
            this.spawnRunTargets(this.level.targetGoalCount || 6);
        }

        if (mode === 'tuktuk_chase_boss') {
            const cScale = Math.max(0.8, Math.min(1.25, canvas.height / 720));
            const diff = this.getActiveDifficulty();
            this.chaser = {
                x: 24,
                w: Math.round(118 * cScale),
                h: Math.round(130 * cScale),
                attackCooldown: Math.max(90, Math.round(205 / (diff.aggroMult || 1))),
                warnTimer: 0
            };
            this.player.x = Math.max(240, Math.round(canvas.width * 0.26));
            this.player.lastSafeWorldX = this.player.x;
        }

        this.state = GAME_STATE.RUNNING;
        this.updateMissionPill();
        this.updateTouchControlsVisibility();
    }

    initArenaSwitch() {
        const cfg = this.level && this.level.arenaSwitch;
        if (!cfg || !cfg.enabled) {
            this.arenaSwitch = null;
            return;
        }
        const gy = this.player.groundY;
        const minSwY = canvas.height <= 460 ? 158 : 228;
        const rawOff = 135 + Math.round(this.player.h * 0.55);
        const swY = Math.max(minSwY, gy - rawOff);
        this.arenaSwitch = {
            x: Math.round(canvas.width * 0.17),
            y: swY,
            offsetY: gy - swY,
            w: 46,
            h: 46,
            cooldown: 0,
            maxCooldown: cfg.cooldownFrames || 480
        };
    }

    updateArenaSwitch() {
        if (!this.arenaSwitch) return;
        const sw = this.arenaSwitch;
        if (sw.cooldown > 0) {
            sw.cooldown--;
            if (sw.cooldown === 0) {
                this.addFloatingText(`⚡ ${(this.level.arenaSwitch && this.level.arenaSwitch.label) || 'SCHALTER'} BEREIT!`, sw.x + sw.w * 0.5, sw.y - 16, '#ffd32a', 18);
                this.updateMissionPill();
            } else if (sw.cooldown % 30 === 0) {
                this.updateMissionPill();
            }
            return;
        }
        if (this.state === GAME_STATE.BOSS_FIGHT) {
            if (this.checkCollision(this.player.x + 8, this.player.y + 6, this.player.w - 16, this.player.h - 10, sw.x, sw.y, sw.w, sw.h)) {
                this.triggerArenaSwitch();
            }
        }
    }

    triggerArenaSwitch() {
        const sw = this.arenaSwitch;
        const cfg = this.level && this.level.arenaSwitch;
        if (!sw || !cfg || sw.cooldown > 0) return;

        sw.cooldown = cfg.cooldownFrames || 480;
        window.soundManager.playSwitch();
        window.soundManager.playClip('thenerean_stah');
        this.screenShake = 18;
        this.radialFlashTimer = 14;
        const cx = sw.x + sw.w * 0.5;
        const cy = sw.y + sw.h * 0.5;
        this.shockwaves.push({ x: cx, y: cy, radius: 14, maxRadius: 240, color: '#ffd32a', alpha: 0.92 });
        this.spawnBurst(cx, cy, 24, '#ffd32a', 7, 22);

        const dmg = cfg.dmg || 70;
        const stunFrames = cfg.stunFrames || 75;
        const targets = [this.boss, this.duoPartner].filter((b) => b && b.hp > 0);
        targets.forEach((b) => {
            if (b.ai && b.ai.shieldTimer > 0) {
                b.ai.shieldTimer = 0;
                this.addFloatingText("💥 SCHILD GEBROCHEN!", b.x + b.w * 0.5, b.y - 68, '#00d2d3', 21);
            }
            b.hp = Math.max(0, b.hp - dmg);
            b.hitFlash = 14;
            this.stunBoss(b, stunFrames);
            this.spawnBurst(b.x + b.w * 0.5, b.y + b.h * 0.45, 16, '#ffd32a', 7, 20);
            this.addFloatingText(`-${dmg}`, b.x + b.w * 0.5, b.y + 12, '#ffd32a', 26);
            if (b.hp <= 0 && !b.defeated) {
                b.defeated = true;
                this.spawnBurst(b.x + b.w * 0.5, b.y + b.h * 0.5, 28, '#ffd32a', 9, 28);
                this.addFloatingText("BESIEGT!", b.x + b.w * 0.5, b.y - 20, '#ffd32a', 26);
            }
        });

        this.registerCombo(2);
        if (cfg.healPlayer > 0) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + cfg.healPlayer);
            this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 30);
            this.updateBars();
        }
        const msg = cfg.effectText || '⚡ ARENA-SCHALTER AKTIVIERT!';
        this.showMemePopup(msg);
        this.addFloatingText(msg, canvas.width * 0.5, Math.min(this.player.groundY - 120, Math.max(210, canvas.height * 0.44)), '#ffd32a', 24);
        this.updateMissionPill();
    }

    spawnRunTargets(count = 6) {
        this.targets = [];
        const totalDist = this.level.targetDistance || 3150;
        const gy = this.player.groundY;
        const startX = 620;
        const endX = totalDist - 360;
        const step = (endX - startX) / Math.max(1, count - 1);
        const yOffsets = [118, 168, 136];
        for (let i = 0; i < count; i++) {
            this.targets.push({
                x: Math.round(startX + i * step),
                baseY: gy - yOffsets[i % yOffsets.length],
                w: 50,
                h: 50,
                hit: false,
                phase: i * 1.15
            });
        }
        this.targetsTotal = this.targets.length;
        this.targetsHit = 0;
    }

    updateTargets() {
        if (!this.targets || this.targets.length === 0) return;
        for (const tgt of this.targets) {
            if (tgt.hit) continue;
            const screenX = tgt.x - this.worldDistance;
            if (screenX < -80 || screenX > canvas.width + 80) continue;
            const ty = tgt.baseY + Math.sin(this.animClock * 4.2 + tgt.phase) * 6;

            let hitNow = false;
            if (this.checkCollision(this.player.x + 6, this.player.y + 6, this.player.w - 12, this.player.h - 12, screenX - 4, ty - 4, tgt.w + 8, tgt.h + 8)) {
                hitNow = true;
            } else {
                for (let j = this.projectiles.length - 1; j >= 0; j--) {
                    const p = this.projectiles[j];
                    if (!p.isPlayer) continue;
                    if (this.checkCollision(p.x - 4, p.y - 4, p.w + 8, p.h + 8, screenX - 4, ty - 4, tgt.w + 8, tgt.h + 8)) {
                        hitNow = true;
                        if (p.type !== 'mega_beam') this.projectiles.splice(j, 1);
                        break;
                    }
                }
            }

            if (hitNow) {
                tgt.hit = true;
                this.targetsHit++;
                window.soundManager.playTargetHit();
                this.spawnBurst(screenX + tgt.w * 0.5, ty + tgt.h * 0.5, 16, '#ffd32a', 6, 18);
                this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 12);
                this.updateBars();
                this.registerCombo(1, `🎯 ZIEL ${this.targetsHit}/${this.targetsTotal}!`);
                this.updateMissionPill();
            }
        }
    }

    updateChaser() {
        if (!this.chaser || this.state !== GAME_STATE.RUNNING) return;
        const ch = this.chaser;
        const gy = this.player.groundY;
        const diff = this.getActiveDifficulty();

        if (this.player.sprintTimer > 0) {
            ch.x = Math.max(18, ch.x - 1.35);
        } else if (this.player.vx > 1) {
            ch.x = Math.max(22, ch.x - 0.30);
        } else {
            ch.x += 0.88 * (diff.speedMult || 1);
        }

        // Periodic chasing hazard projectile
        ch.attackCooldown--;
        ch.warnTimer = (ch.attackCooldown > 0 && ch.attackCooldown <= 45) ? ch.attackCooldown : 0;
        if (ch.attackCooldown === 45) {
            this.updateMissionPill();
        }
        if (ch.attackCooldown <= 0) {
            const baseCd = 245 + Math.random() * 55;
            ch.attackCooldown = Math.max(105, Math.round(baseCd / (diff.aggroMult || 1)));
            ch.warnTimer = 0;
            this.updateMissionPill();
            window.soundManager.playThrow();
            this.projectiles.push({
                x: ch.x + ch.w,
                y: gy - 44,
                vx: 9.0 * (diff.projSpeedMult || 1),
                vy: 0,
                w: 44,
                h: 36,
                isPlayer: false,
                type: 'broken_cable',
                damage: Math.max(4, Math.round(8 * (diff.dmgMult || 1))),
                rotation: 0,
                trailColor: '#ff6348'
            });
            this.spawnBurst(ch.x + ch.w, gy - 26, 8, '#ff6348', 5, 14);
        }

        // Exhaust smoke behind chasing TukTuk
        if (Math.random() > 0.45) {
            this.particles.push({
                x: ch.x + 12,
                y: gy - ch.h * 0.55,
                vx: -2 - Math.random() * 1.5,
                vy: -1.8 - Math.random() * 1.5,
                life: 20,
                maxLife: 20,
                color: Math.random() > 0.5 ? '#ff6348' : '#ffa502',
                size: 6 + Math.random() * 4
            });
        }

        // Caught player check
        if (ch.x + ch.w * 0.72 >= this.player.x + 12) {
            const baseDmg = this.touchControlsEnabled ? 8 : 10;
            const dmg = Math.max(4, Math.round(baseDmg * (diff.dmgMult || 1)));
            if (this.player.isBlocking) {
                this.onBlockSuccess(this.player.x, this.player.y + this.player.h * 0.5);
            } else {
                this.onPlayerHit(dmg, 'chaser');
            }
            ch.x = Math.max(18, ch.x - 105);
            this.player.pushVx = 8;
        }
    }

    startWave(waveIdx) {
        const waves = (this.level && this.level.waves) || [];
        const wave = waves[waveIdx];
        if (!wave) {
            this.triggerLevelWin();
            return;
        }
        this.currentWaveIndex = waveIdx;
        this.resetCombatExtras();
        this.projectiles = [];
        this.spawnArenaPlatforms();

        const groundPos = this.player.groundY;
        const scale = Math.max(0.78, Math.min(1.38, canvas.height / 720));
        const bH = Math.round(160 * scale);
        const bW = Math.round(92 * scale);

        const pSpec = wave.primary;
        const pHp = this.scaleBossHP(pSpec.hp);
        this.boss = {
            name: pSpec.name,
            type: pSpec.type,
            isWaveEnemy: true,
            isMiniBoss: true,
            avatar: pSpec.avatar || 'assets/sprites/gibb_student_avatar.png',
            x: canvas.width * (wave.partner ? 0.67 : 0.74),
            y: groundPos - bH,
            w: bW,
            h: bH,
            hp: pHp,
            maxHp: pHp,
            facing: -1,
            attackTimer: 50,
            attackAnimTimer: 0,
            banterAnimTimer: 0,
            moveDir: -1,
            hitFlash: 0,
            banterTimer: 120
        };

        if (wave.partner) {
            const ptSpec = wave.partner;
            const ptHp = this.scaleBossHP(ptSpec.hp);
            this.duoPartner = {
                name: ptSpec.name,
                type: ptSpec.type,
                isDuoPartner: true,
                isWaveEnemy: true,
                isMiniBoss: true,
                avatar: ptSpec.avatar || 'assets/sprites/gibb_student_avatar.png',
                x: canvas.width * 0.85,
                y: groundPos - bH,
                w: bW,
                h: bH,
                hp: ptHp,
                maxHp: ptHp,
                facing: -1,
                attackTimer: 80,
                attackAnimTimer: 0,
                banterAnimTimer: 0,
                moveDir: 1,
                hitFlash: 0
            };
        } else {
            this.duoPartner = null;
        }

        if (this.boss) this.ensureBossAI(this.boss);
        if (this.duoPartner) this.ensureBossAI(this.duoPartner);

        const pct = Math.round(((waveIdx + 1) / waves.length) * 100);
        this.ui.progBar.style.width = `${pct}%`;
        this.ui.progValText.textContent = `W${waveIdx + 1}/${waves.length}`;

        this.state = GAME_STATE.BOSS_FIGHT;
        window.soundManager.setMusicQuietMode(true);
        this.updateBossHUD();
        this.updateMissionPill();
        this.updateTouchControlsVisibility();

        this.screenShake = 12;
        this.radialFlashTimer = 10;
        if (waveIdx > 0) {
            window.soundManager.playWaveClear();
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
            this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 35);
            this.updateBars();
            this.addFloatingText("⚡ +20 HP & +35% ENERGIE!", this.player.x + 40, this.player.y - 36, '#2ed573', 20);
        }
        this.showMemePopup(wave.banner || wave.title);
        this.addFloatingText(wave.title, canvas.width * 0.5, canvas.height * 0.42, '#ffd32a', 26);
    }

    triggerSprintBurst(frames = 90) {
        this.player.sprintTimer = Math.max(this.player.sprintTimer || 0, frames);
        window.soundManager.playSprint();
        this.spawnBurst(this.player.x + this.player.w * 0.3, this.player.groundY - 18, 10, '#00d2d3', 5, 16);
        this.addFloatingText("⚡ SPRINT!", this.player.x + this.player.w * 0.5, this.player.y - 16, '#00d2d3', 18);
    }

    updateMovingPlatforms() {
        for (const plat of this.platforms) {
            if (!plat.moveAxis) {
                plat.dx = 0;
                plat.dy = 0;
                continue;
            }
            const oldX = plat.x;
            const oldY = plat.y;
            if (plat.moveAxis === 'x' && plat.baseX != null) {
                plat.x = plat.baseX + Math.sin(this.animClock * (plat.moveSpeed || 2.0) + (plat.phase || 0)) * (plat.moveAmp || 28);
            } else if (plat.moveAxis === 'y' && plat.baseOffsetY != null) {
                plat.y = (this.player.groundY - plat.baseOffsetY) + Math.sin(this.animClock * (plat.moveSpeed || 2.0) + (plat.phase || 0)) * (plat.moveAmp || 22);
            }
            plat.dx = plat.x - oldX;
            plat.dy = plat.y - oldY;
        }
    }

    spawnArenaPlatforms() {
        this.platforms = this.platforms.filter(p => !p.isArena);
        if (!this.level || !this.level.mechanics || !this.level.mechanics.platforms) return;
        const gy = this.player.groundY;
        const pStyle = this.level.mechanics.platformStyle || 'concrete';
        const baseWorld = this.worldDistance;
        const isLift = Boolean(this.level.arenaLiftPlatform);

        const p1X = baseWorld + Math.round(canvas.width * 0.12);
        const off1 = 78;
        this.platforms.push({
            x: p1X, baseX: p1X, y: gy - off1, offsetY: off1, baseOffsetY: off1,
            w: 136, h: 20, style: pStyle, isArena: true
        });

        const p2X = baseWorld + Math.round(canvas.width * 0.28);
        const off2 = isLift ? 142 : 128;
        this.platforms.push({
            x: p2X, baseX: p2X, y: gy - off2, offsetY: off2, baseOffsetY: off2,
            w: isLift ? 148 : 136, h: 20, style: pStyle, isArena: true,
            moveAxis: isLift ? 'y' : null,
            moveAmp: isLift ? 26 : 0,
            moveSpeed: isLift ? 2.1 : 0,
            phase: 0
        });
    }

    generateLevelObstacles() {
        const totalDist = this.level.targetDistance;
        const gy = this.player.groundY;
        const ph = this.player.h;
        const mech = this.level.mechanics || {};
        const pStyle = mech.platformStyle || 'concrete';
        const pitTheme = mech.pitTheme || 'lava';

        const mbDist = this.level.hasMiniBoss
            ? Math.round(totalDist * (this.level.miniBossTriggerRatio || 0.50))
            : -1;

        let lastJumpEndX = -9999;
        let lastPlatformEndX = -9999;
        let lastPitEndX = -9999;
        let lastDuckEndX = -9999;
        const duckRunway = mech.sprintPads ? 540 : 490;

        const addCollectible = (wx, wy, forcedType) => {
            const cPool = (this.level.collectibleTypes || ['coffee']).filter((t) => t !== 'jeton');
            const pool = cPool.length > 0 ? cPool : ['coffee'];
            const cType = forcedType || pool[Math.floor(Math.random() * pool.length)];
            this.collectibles.push({
                x: wx, y: wy, w: 42, h: 42, type: cType, collected: false, phase: Math.random() * Math.PI * 2
            });
        };

        const addGroundObs = (wx, type) => {
            const oType = type || this.level.obstacleTypes[Math.floor(Math.random() * this.level.obstacleTypes.length)];
            const size = oType === 'frisbee' ? 56 : 52;
            this.obstacles.push({
                x: wx, y: gy - size, w: size, h: oType === 'frisbee' ? 38 : size,
                type: oType, high: false, cleared: false, phase: Math.random() * Math.PI * 2
            });
            lastJumpEndX = Math.max(lastJumpEndX, wx + size);
        };

        const addDuckObs = (wx, type) => {
            const oType = type || (this.level.id >= 5 ? 'broken_cable' : (this.level.id >= 3 ? 'frisbee' : 'warning_letter'));
            const barH = Math.round(ph * 0.30);
            const barW = 84;
            this.obstacles.push({
                x: wx, y: gy - Math.round(ph * 0.92), w: barW, h: barH,
                type: oType, high: true, cleared: false, phase: Math.random() * Math.PI * 2
            });
            lastDuckEndX = Math.max(lastDuckEndX, wx + barW);
        };

        const getMinDuckX = () => Math.max(lastJumpEndX, lastPlatformEndX, lastPitEndX) + duckRunway;

        // Build deterministic themed traversal sectors with verified safe runways
        const spans = mbDist > 0
            ? [[660, mbDist - 140], [mbDist + 560, totalDist - 220]]
            : [[660, totalDist - 220]];

        const addLavaBridge = (startX, rem) => {
            if (mech.sprintPads) {
                this.boostPads.push({ x: startX, w: 92, label: '⚡ SPRINT' });
            }
            const pitX = startX + (mech.sprintPads ? 130 : 35);
            const pitW = Math.min(360, Math.max(230, rem - 280));
            this.lavaPits.push({ x: pitX, w: pitW, theme: pitTheme });
            lastPitEndX = Math.max(lastPitEndX, pitX + pitW);

            const plat1X = pitX + 34;
            const plat1W = pitW > 310 ? 150 : Math.max(148, pitW - 68);
            const off1 = 88;
            const plat1Y = gy - off1;
            this.platforms.push({ x: plat1X, y: plat1Y, offsetY: off1, w: plat1W, h: 22, style: pStyle });
            lastPlatformEndX = Math.max(lastPlatformEndX, plat1X + plat1W);
            addCollectible(plat1X + plat1W * 0.5 - 21, plat1Y - 58);

            if (pitW > 310) {
                const plat2X = plat1X + plat1W + 46;
                const plat2W = 138;
                const off2 = 136;
                const plat2Y = gy - off2;
                const movingX = this.level.id >= 5;
                this.platforms.push({
                    x: plat2X, baseX: plat2X, y: plat2Y, offsetY: off2, baseOffsetY: off2, w: plat2W, h: 22,
                    style: pStyle,
                    moveAxis: movingX ? 'x' : null,
                    moveAmp: movingX ? 28 : 0,
                    moveSpeed: movingX ? 2.1 : 0,
                    phase: Math.random() * Math.PI * 2
                });
                lastPlatformEndX = Math.max(lastPlatformEndX, plat2X + plat2W + (movingX ? 28 : 0));
                addCollectible(plat2X + plat2W * 0.5 - 21, plat2Y - 56, 'energy_drink');
            }
            return pitX + pitW + 220;
        };

        spans.forEach(([spanStart, spanEnd], spanIdx) => {
            let cursor = spanStart;
            let step = 0;
            let lastMode = '';
            while (cursor < spanEnd - 170) {
                cursor = Math.max(cursor, lastDuckEndX + 260, lastPitEndX + 200);
                if (cursor >= spanEnd - 170) break;

                const rem = spanEnd - cursor;
                const minDuckX = getMinDuckX();
                const canDuckHere = mech.duckObstacles && cursor >= minDuckX && rem >= 140;
                const canDuckSoon = mech.duckObstacles && (minDuckX - cursor) <= 280 && (spanEnd - Math.max(cursor, minDuckX)) >= 140;

                let mode = 'hurdle';
                if (mech.lavaPits && mech.platforms && ((spanIdx === 0 && step === 0) || (spanIdx === 1 && step === 1)) && rem >= 480) {
                    mode = 'lava';
                } else if (mech.platforms && ((spanIdx === 0 && !mech.lavaPits && step === 0) || (spanIdx === 1 && step === 0)) && rem >= 320) {
                    mode = 'highlow';
                } else if (lastMode !== 'duck' && (canDuckHere || canDuckSoon)) {
                    mode = 'duck';
                } else if (mech.lavaPits && mech.platforms && step % 3 === 2 && rem >= 480) {
                    mode = 'lava';
                }
                step++;
                lastMode = mode;

                if (mode === 'lava') {
                    cursor = addLavaBridge(cursor, rem);
                } else if (mode === 'highlow') {
                    const pw = 200;
                    const offP = 96;
                    const py = gy - offP;
                    const movingY = this.level.id >= 5;
                    this.platforms.push({
                        x: cursor, baseX: cursor, y: py, offsetY: offP, baseOffsetY: offP, w: pw, h: 22,
                        style: pStyle,
                        moveAxis: movingY ? 'y' : null,
                        moveAmp: movingY ? 18 : 0,
                        moveSpeed: movingY ? 2.0 : 0,
                        phase: Math.random() * Math.PI * 2
                    });
                    lastPlatformEndX = Math.max(lastPlatformEndX, cursor + pw);
                    addCollectible(cursor + 34, py - 56, 'coffee');
                    addCollectible(cursor + 124, py - 56);
                    if (!mech.clearPlatformUnder) {
                        addGroundObs(cursor + 74);
                    }
                    cursor += pw + 260;
                } else if (mode === 'duck') {
                    const duckX = Math.max(cursor, minDuckX);
                    if (duckX >= spanEnd - 120) {
                        cursor = spanEnd;
                        break;
                    }
                    addDuckObs(duckX);
                    addCollectible(duckX + 21, gy - 66);
                    cursor = duckX + 350;
                } else {
                    if (mech.sprintPads && step % 2 === 1 && rem >= 460) {
                        this.boostPads.push({ x: cursor, w: 96, label: '⚡ SPRINT' });
                        addGroundObs(cursor + 215);
                        addCollectible(cursor + 295, gy - 148);
                        cursor += 540;
                    } else {
                        addGroundObs(cursor);
                        addCollectible(cursor + 95, gy - 135 - Math.random() * 35);
                        cursor += 340;
                    }
                }
            }
        });

        if (this.level && this.level.mode === 'bankomat_survival') {
            this.spawnLevel7Jetons(this.level.targetGoalCount || 8);
        }
    }

    spawnLevel7Jetons(count = 8) {
        const totalDist = this.level.targetDistance || 2700;
        const gy = this.player.groundY;
        const startX = 480;
        const endX = totalDist - 240;
        const step = (endX - startX) / Math.max(1, count - 1);
        const yHeights = [66, 122, 146, 68];

        this.jetonsTotal = count;
        this.jetonsCollected = 0;

        for (let i = 0; i < count; i++) {
            const jx = Math.round(startX + i * step);
            let yOff = yHeights[i % yHeights.length];
            for (const obs of this.obstacles) {
                if (Math.abs(jx - (obs.x + obs.w * 0.5)) < 110) {
                    yOff = obs.high ? 64 : 138;
                    break;
                }
            }
            this.collectibles.push({
                x: jx,
                y: gy - yOff,
                w: 44,
                h: 44,
                type: 'jeton',
                collected: false,
                phase: i * 0.75
            });
        }
    }

    // =====================================================================
    // PLAYER ATTACKS
    // =====================================================================

    // ATTACK 1 (E): Straight-ahead Gesetzestext (no upward arc!)
    playerAttackLawBook() {
        if (this.player.lawBookCooldown > 0) return;
        this.player.lawBookCooldown = this.state === GAME_STATE.DEMO ? 10 : this.player.maxLawBookCooldown;
        this.updateBars();
        this.player.attackAnimTimer = 18;
        const dir = this.player.facing || 1;
        const dmgMult = this.player.powerTimer > 0 ? 1.5 : 1.0;
        this.projectiles.push({
            x: dir > 0 ? this.player.x + this.player.w * 0.72 : this.player.x - 20,
            y: this.player.y + this.player.h * 0.38,
            vx: 15.0 * dir,
            vy: 0.0,
            w: 44,
            h: 44,
            type: 'law_book',
            isPlayer: true,
            damage: Math.round(28 * dmgMult),
            rotation: 0,
            trailColor: this.player.powerTimer > 0 ? '#00d2d3' : '#45aaf2'
        });

        window.soundManager.playThrow();
        this.spawnBurst(
            dir > 0 ? this.player.x + this.player.w * 0.78 : this.player.x,
            this.player.y + this.player.h * 0.42,
            7, '#45aaf2', 4.5, 16
        );
    }

    // ATTACK 2 (Q / Shift): "ICH STAH DOCH DA!" Mega Shockwave
    playerAttackMegaShout() {
        if (this.player.megaEnergy < 40 && this.state !== GAME_STATE.DEMO) {
            this.addFloatingText("Energie lädt auf!", this.player.x + 20, this.player.y - 14, '#ff4757', 17);
            return;
        }

        if (this.state !== GAME_STATE.DEMO) {
            this.player.megaEnergy -= 40;
        }
        this.updateBars();

        this.player.attackAnimTimer = 28;
        this.shoutAvatarTimer = 55;
        this.radialFlashTimer = 16;
        this.screenShake = 14;

        window.soundManager.playMegaBeam();
        window.soundManager.playClip('thenerean_stah');
        if (this.getSoundChaosLevel() >= 3) {
            window.soundManager.playClip(this.pickRandomChaosClip());
        }
        this.showMemePopup("HERR ADAM, ICH STAH DOCH DA!");

        const dir = this.player.facing || 1;
        const dmgMult = this.player.powerTimer > 0 ? 1.5 : 1.0;
        const cx = this.player.x + this.player.w * 0.55;
        const cy = this.player.y + this.player.h * 0.42;
        this.shockwaves.push({ x: cx, y: cy, radius: 16, maxRadius: 210, color: '#ffd32a', alpha: 0.9 });
        this.shockwaves.push({ x: cx, y: cy, radius: 10, maxRadius: 150, color: '#00d2d3', alpha: 0.85 });

        this.projectiles.push({
            x: dir > 0 ? this.player.x + this.player.w * 0.72 : this.player.x - 90,
            y: this.player.y + this.player.h * 0.18,
            vx: 17.5 * dir,
            vy: 0.0,
            w: 96,
            h: 72,
            type: 'mega_beam',
            isPlayer: true,
            damage: Math.round(70 * dmgMult),
            rotation: 0,
            trailColor: '#ffd32a'
        });

        for (let i = 0; i < 36; i++) {
            const angle = (Math.PI * 2 * i) / 36;
            const spd = 6 + Math.random() * 5;
            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 24,
                maxLife: 24,
                color: i % 2 === 0 ? '#ffd32a' : '#00d2d3',
                size: 6 + Math.random() * 4
            });
        }
    }

    // ATTACK 3 (F): "DA HAST DU 20 FRISBEES!" 20-Frisbee Rapid Barrage
    playerAttackFrisbeeVolley() {
        if (this.player.frisbeeCooldown > 0 && this.state !== GAME_STATE.DEMO) {
            this.addFloatingText("20 Frisbees laden nach...", this.player.x + 20, this.player.y - 14, '#ffa502', 17);
            return;
        }

        if (this.state !== GAME_STATE.DEMO) {
            this.player.frisbeeCooldown = this.player.maxFrisbeeCooldown;
        }

        this.player.attackAnimTimer = 28;
        this.shoutAvatarTimer = 50;
        this.screenShake = 15;
        window.soundManager.playClip('adam_20_frisbees');
        if (this.getSoundChaosLevel() >= 3) {
            window.soundManager.playClip(this.pickRandomChaosClip());
        }
        this.showMemePopup("DA HAST DU 20 FRISBEES!");

        const cx = this.player.x + this.player.w * 0.65;
        const cy = this.player.y + this.player.h * 0.35;
        this.shockwaves.push({ x: cx, y: cy, radius: 14, maxRadius: 130, color: '#ff4757', alpha: 0.8 });

        const dir = this.player.facing || 1;
        const dmgMult = this.player.powerTimer > 0 ? 1.5 : 1.0;
        for (let i = 0; i < 20; i++) {
            const tid = setTimeout(() => {
                if (this.isPaused) return;
                if (this.state !== GAME_STATE.RUNNING && this.state !== GAME_STATE.BOSS_FIGHT && this.state !== GAME_STATE.DEMO) return;
                this.player.attackAnimTimer = Math.max(this.player.attackAnimTimer, 10);
                const spreadY = (Math.random() - 0.5) * 3.4;
                const speed = (15.0 + Math.random() * 3.8) * dir;
                this.projectiles.push({
                    x: dir > 0 ? this.player.x + this.player.w * 0.68 : this.player.x - 30,
                    y: this.player.y + this.player.h * 0.32 + (Math.random() - 0.5) * 26,
                    vx: speed,
                    vy: spreadY,
                    w: 48,
                    h: 28,
                    type: 'frisbee',
                    isPlayer: true,
                    damage: Math.round(12 * dmgMult),
                    rotation: Math.random() * Math.PI * 2,
                    trailColor: '#ff4757'
                });
                window.soundManager.playThrow();
            }, i * 21);
            this.frisbeeTimers.push(tid);
        }

        this.spawnBurst(cx, cy, 24, '#ff4757', 7, 22);
    }

    // DEFENSE (R): Tactical Shield Block ("Niemert chunt an mir verbi!")
    playerBlock() {
        if (this.player.blockCooldown > 0 && this.state !== GAME_STATE.DEMO) {
            this.addFloatingText("Schild lädt nach...", this.player.x + 20, this.player.y - 14, '#00d2d3', 17);
            return;
        }

        this.player.isBlocking = true;
        this.player.blockTimer = 34; // ~0.55s active blocking
        if (this.state !== GAME_STATE.DEMO) {
            this.player.blockCooldown = this.player.maxBlockCooldown;
        }
        this.player.attackAnimTimer = 30;

        window.soundManager.playBlockSfx();
        const blockVocals = ['thenerean_niemert_verbi', 'thenerean_stah_bis_schluss', 'thenerean_chasch_mi_schlah'];
        const chosenVocal = blockVocals[Math.floor(Math.random() * blockVocals.length)];
        window.soundManager.playClip(chosenVocal);
        if (this.getSoundChaosLevel() >= 3) {
            window.soundManager.playClip(this.pickRandomChaosClip());
        }

        if (chosenVocal === 'thenerean_niemert_verbi') {
            this.showMemePopup("Niemert chunt an mir verbi! 🛡️");
        } else if (chosenVocal === 'thenerean_chasch_mi_schlah') {
            this.showMemePopup("Du hesch gmeint du chasch mi schlah?! 🛡️");
        } else {
            this.showMemePopup("Ich stah bis zum Schluss! 🛡️");
        }

        this.addFloatingText("SCHILD BLOCK! 🛡️", this.player.x + this.player.w * 0.5, this.player.y - 20, '#00d2d3', 22);

        const cx = this.player.x + (this.player.facing > 0 ? this.player.w * 0.75 : this.player.w * 0.25);
        const cy = this.player.y + this.player.h * 0.45;
        this.shockwaves.push({ x: cx, y: cy, radius: 12, maxRadius: 140, color: '#00d2d3', alpha: 0.9 });

        // Shield spark particles
        for (let i = 0; i < 22; i++) {
            const angle = (Math.PI * 2 * i) / 22;
            const spd = 4 + Math.random() * 4;
            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 18,
                maxLife: 18,
                color: i % 2 === 0 ? '#00d2d3' : '#ffd32a',
                size: 4 + Math.random() * 4
            });
        }
    }

    onBlockSuccess(hitX, hitY) {
        window.soundManager.playBlockSfx();
        this.screenShake = 7;
        const bx = hitX || (this.player.x + (this.player.facing > 0 ? this.player.w * 0.8 : this.player.w * 0.2));
        const by = hitY || (this.player.y + this.player.h * 0.48);

        this.spawnBurst(bx, by, 18, '#00d2d3', 6, 22);
        this.spawnBurst(bx, by, 12, '#ffd32a', 4, 16);
        this.shockwaves.push({ x: bx, y: by, radius: 10, maxRadius: 95, color: '#00d2d3', alpha: 0.85 });
        this.addFloatingText("GEBLOCKT! 🛡️ 0 DMG", this.player.x + this.player.w * 0.5, this.player.y - 12, '#00d2d3', 24);
        this.registerCombo(1);

        const chaos = this.getSoundChaosLevel();
        const blockChance = chaos >= 3 ? 0.92 : (chaos === 1 ? 0.25 : 0.55);
        if (Math.random() < blockChance) {
            const blockCounters = ['thenerean_chasch_mi_schlah', 'thenerean_niemert_verbi'];
            const clip = blockCounters[Math.floor(Math.random() * blockCounters.length)];
            window.soundManager.playClip(clip, null, 1.0, chaos <= 2 ? { lowPriority: true } : {});
        }
        if (chaos >= 3 && Math.random() < 0.50) {
            window.soundManager.playClip(this.pickRandomChaosClip());
        }
    }

    playerJump() {
        if (this.player.isGrounded) {
            this.player.vy = this.player.jumpPower;
            this.player.isGrounded = false;
            this.player.jumpBuffered = false;
            this.spawnRunDust(this.player.x + this.player.w * 0.4, this.player.groundY);
            window.soundManager.playJump();
        } else {
            // Mobile jump buffer: if tapped right before landing, jump instantly on touchdown
            if (this.player.y >= this.player.groundY - this.player.h - 60) {
                this.player.jumpBuffered = true;
            }
        }
    }

    // =====================================================================
    // BOSS ENCOUNTER & DIALOGUE
    // =====================================================================
    triggerMiniBossEncounter() {
        this.midBossTriggered = true;
        this.state = GAME_STATE.PRE_BOSS_WALK;
        this.ui.controlHintPill.classList.add('hidden');
        window.soundManager.setMusicQuietMode(true);
        this.projectiles = [];
        this.hazards = [];

        // Ensure player lands cleanly on solid arena floor
        const groundPos = this.player.groundY;
        if (this.player.y > groundPos - this.player.h) {
            this.player.y = groundPos - this.player.h;
            this.player.vy = 0;
            this.player.isGrounded = true;
        }

        const scale = Math.max(0.78, Math.min(1.38, canvas.height / 720));
        const bossH = Math.round(160 * scale);
        const bossW = Math.round(92 * scale);
        const hp = this.scaleBossHP(this.level.miniBossHP || 280);

        this.boss = {
            name: this.level.miniBossName || 'Average GIBB Schüler',
            type: this.level.miniBossType || 'gibb_student',
            isMiniBoss: true,
            avatar: this.level.miniBossAvatar || 'assets/sprites/gibb_student_avatar.png',
            x: canvas.width * 0.74,
            y: groundPos - bossH,
            w: bossW,
            h: bossH,
            hp: hp,
            maxHp: hp,
            facing: -1,
            attackTimer: 55,
            attackAnimTimer: 0,
            banterAnimTimer: 0,
            moveDir: -1,
            hitFlash: 0,
            banterTimer: 110
        };
        this.duoPartner = null;
        this.ensureBossAI(this.boss);
        this.spawnArenaPlatforms();
        this.updateBossHUD();
        this.showMemePopup('⚡ MINI-BOSS TAUCHT AUF!');
    }

    onMiniBossDefeated() {
        this.midBossDefeated = true;
        this.boss = null;
        this.duoPartner = null;
        this.hazards = [];
        this.projectiles = [];
        this.platforms = this.platforms.filter(p => !p.isArena);
        this.ui.bossHudBanner.classList.add('hidden');
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
        this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 50);
        this.player.score = Math.min(6.0, +(this.player.score + 0.1).toFixed(1));
        this.updateBars();

        this.state = GAME_STATE.RUNNING;
        window.soundManager.setMusicQuietMode(false);
        this.updateTouchControlsVisibility();
        window.soundManager.playCollect();
        window.soundManager.playClip('thenerean_stah');
        this.screenShake = 14;
        this.showMemePopup('MINI-BOSS BESIEGT! WEITER ZUM FINALEN BOSS! ▶');
        this.addFloatingText('MINI-BOSS BESIEGT! +30 HP & +50% ENERGIE!', canvas.width * 0.5, canvas.height * 0.36, '#2ed573', 24);
    }

    triggerVanguardEncounter() {
        this.state = GAME_STATE.PRE_BOSS_WALK;
        this.ui.controlHintPill.classList.add('hidden');
        window.soundManager.setMusicQuietMode(true);
        this.resetCombatExtras();
        this.spawnArenaPlatforms();
        this.arenaSwitch = null;

        const groundPos = this.player.groundY;
        const scale = Math.max(0.78, Math.min(1.38, canvas.height / 720));
        const bossH = Math.round(162 * scale);
        const bossW = Math.round(92 * scale);
        const hp = this.scaleBossHP(this.level.vanguardHP || 420);

        this.boss = {
            name: this.level.vanguardName || 'Chef-Aufsicht (Gatekeeper)',
            type: this.level.vanguardType || 'gibb_student',
            isStageVanguard: true,
            avatar: this.level.vanguardAvatar || 'assets/sprites/gibb_student_avatar.png',
            x: canvas.width * 0.74,
            y: groundPos - bossH,
            w: bossW,
            h: bossH,
            hp: hp,
            maxHp: hp,
            facing: -1,
            attackTimer: 50,
            attackAnimTimer: 0,
            banterAnimTimer: 0,
            moveDir: -1,
            hitFlash: 0,
            banterTimer: 110
        };
        this.duoPartner = null;
        this.ensureBossAI(this.boss);
        this.updateBossHUD();
        this.updateMissionPill();
        this.showMemePopup('🛡️ STAGE 1 / 2: PRÜFUNGS-AUFSICHT VERTEIDIGT DEN SAAL!');
    }

    onVanguardDefeated() {
        this.vanguardDefeated = true;
        this.boss = null;
        this.duoPartner = null;
        this.hazards = [];
        this.projectiles = [];
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 45);
        this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 50);
        this.player.score = Math.min(6.0, +(this.player.score + 0.1).toFixed(1));
        this.updateBars();
        this.ui.progBar.style.width = '100%';
        this.ui.progValText.textContent = 'FINALE';
        window.soundManager.playWaveClear();
        this.screenShake = 16;
        this.showMemePopup('👑 AUFSICHT BESIEGT! MONIKA & HERR ADAM BETRETEN DIE ARENA!');
        this.triggerPreBossEncounter();
    }

    triggerPreBossEncounter() {
        this.state = GAME_STATE.PRE_BOSS_WALK;
        this.ui.controlHintPill.classList.add('hidden');
        window.soundManager.setMusicQuietMode(true);

        const groundPos = this.player.groundY;
        const scale = Math.max(0.78, Math.min(1.38, canvas.height / 720));
        const isDuo = this.level.bossType === 'duo';
        const isTukTuk = this.isTukTukType(this.level.bossType);
        this.chaser = null;
        this.resetCombatExtras();
        this.spawnArenaPlatforms();
        this.initArenaSwitch();
        const isL10StageB = this.level && this.level.mode === 'final_efz_gauntlet';
        this.floorHazardCooldown = (this.level && this.level.arenaFloorHazards) ? (isL10StageB ? 260 : 300) : 0;
        const bossH = Math.round((isTukTuk ? 195 : 162) * scale);
        const bossW = Math.round((isTukTuk ? 175 : 94) * scale);
        const mainHp = this.scaleBossHP(this.level.bossHP);

        this.boss = {
            name: this.level.bossName,
            type: this.level.bossType,
            avatar: this.level.bossAvatar,
            x: canvas.width * (isDuo ? 0.65 : 0.74),
            y: groundPos - bossH,
            w: bossW,
            h: bossH,
            hp: mainHp,
            maxHp: mainHp,
            facing: -1,
            attackTimer: 55,
            attackAnimTimer: 0,
            banterAnimTimer: 0,
            moveDir: -1,
            hitFlash: 0,
            banterTimer: 95
        };

        if (isDuo) {
            const pType = this.level.partnerType || 'adam';
            const isPartnerTukTuk = this.isTukTukType(pType);
            const defaultAvatar = pType === 'gibb_student'
                ? 'assets/sprites/gibb_student_avatar.png'
                : (isPartnerTukTuk ? 'assets/sprites/tuktuk_dual_avatar.png' : 'assets/sprites/adam_avatar.png');
            const pH = Math.round((isPartnerTukTuk ? 195 : 162) * scale);
            const pW = Math.round((isPartnerTukTuk ? 175 : 92) * scale);
            const partnerHp = this.scaleBossHP(this.level.partnerHP || 850);
            this.duoPartner = {
                name: this.level.partnerName || "Herr Adam",
                type: pType,
                isDuoPartner: true,
                avatar: this.level.partnerAvatar || defaultAvatar,
                x: canvas.width * (isPartnerTukTuk ? 0.80 : 0.85),
                y: groundPos - pH,
                w: pW,
                h: pH,
                hp: partnerHp,
                maxHp: partnerHp,
                facing: -1,
                attackTimer: 82,
                attackAnimTimer: 0,
                banterAnimTimer: 0,
                moveDir: 1,
                hitFlash: 0
            };
        }

        if (this.boss) this.ensureBossAI(this.boss);
        if (this.duoPartner) this.ensureBossAI(this.duoPartner);

        this.updateBossHUD();
        this.updateMissionPill();
    }

    startPreBossDialogue() {
        this.state = GAME_STATE.PRE_BOSS_DIALOGUE;
        this.updateTouchControlsVisibility();
        this.ui.abilityDock.classList.add('hidden');
        this.ui.memePopup.classList.add('hidden');

        let encounter;
        if (this.boss && this.boss.isStageVanguard) {
            encounter = {
                speaker: this.boss.name || 'Chef-Aufsicht',
                avatar: this.boss.avatar || 'assets/sprites/gibb_student_avatar.png',
                text: "STOPP! Bevor du ins Ultimative EFZ-Duell mit Monika & Herr Adam kommst, musst du erstmal an MIR vorbei!",
                clip: null,
                playerResponse: "Nur zu! Danach holen wir uns das EFZ-Diplom mit Note 6.0!",
                playerClip: "thenerean_niemert_verbi"
            };
        } else if (this.boss && this.boss.isMiniBoss && this.level.preMiniBossEncounter) {
            encounter = this.level.preMiniBossEncounter;
        } else {
            encounter = this.level.preBossEncounter;
        }
        if (this.boss) this.boss.banterAnimTimer = 999;

        this.dialogueQueue = [
            {
                speaker: encounter.speaker,
                avatar: encounter.avatar,
                text: encounter.text,
                clip: encounter.clip
            },
            {
                speaker: "Thenerean Selvabankumar",
                avatar: "assets/sprites/thenerean_shout_avatar.png",
                text: encounter.playerResponse,
                clip: encounter.playerClip
            }
        ];

        this.advancePreBossDialogue();
    }

    advancePreBossDialogue() {
        if (this.dialogueQueue.length > 0) {
            const next = this.dialogueQueue.shift();
            this.ui.dialogueSpeaker.textContent = next.speaker;
            this.ui.dialogueAvatar.src = next.avatar;
            this.ui.dialogueText.textContent = `"${next.text}"`;
            this.ui.dialogueBox.classList.remove('hidden');

            if (next.clip) {
                window.soundManager.playClip(next.clip, null, 1.0, { forceSolo: true });
            }
        } else {
            this.ui.dialogueBox.classList.add('hidden');
            this.ui.abilityDock.classList.remove('hidden');
            if (this.boss) this.boss.banterAnimTimer = 0;
            this.state = GAME_STATE.BOSS_FIGHT;
            this.updateTouchControlsVisibility();
            this.screenShake = 18;
            this.radialFlashTimer = 14;
            const fightY = Math.min(this.player.groundY - 96, Math.max(235, canvas.height * 0.50));
            const bannerText = (this.boss && this.boss.isStageVanguard)
                ? "🛡️ VORHUT: PRÜFUNGS-GATEKEEPER!"
                : ((this.boss && this.boss.isMiniBoss)
                    ? "⚡ MINI-BOSS: AN MIR CHUNNSCH NÖD VERBI!"
                    : `⚔️ ${this.boss ? this.boss.name.toUpperCase() : 'KAMPF BEGINNT!'}`);
            this.addFloatingText(bannerText, canvas.width / 2, fightY, '#ff4757', 26);

            // Second wind upon reaching a boss arena after an obstacle course
            if (this.level && this.level.targetDistance > 0 && this.boss && !this.boss.isMiniBoss && !this.boss.isStageVanguard && this.player.hp < this.player.maxHp) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
                this.updateBars();
            }

            const minFloor = Math.max(80, Math.round(120 * (this.getActiveDifficulty().hpMult || 1)));
            if (this.level && this.level.mode === 'target_run_boss' && this.targetsHit > 0 && this.boss && !this.boss.targetBonusApplied) {
                this.boss.targetBonusApplied = true;
                const bonusDmg = this.targetsHit * 28;
                this.boss.hp = Math.max(minFloor, this.boss.hp - bonusDmg);
                this.boss.hitFlash = 14;
                this.spawnBurst(this.boss.x + this.boss.w * 0.5, this.boss.y + this.boss.h * 0.4, 24, '#ffd32a', 8, 22);
                this.addFloatingText(`🎯 ${this.targetsHit}/${this.targetsTotal} ZIELE: -${bonusDmg} HP!`, this.boss.x + this.boss.w * 0.5, this.boss.y - 38, '#ffd32a', 24);
                this.updateBossHUD();
            }

            if (this.level && this.level.mode === 'bankomat_survival' && this.jetonsCollected > 0 && this.boss && !this.boss.jetonBonusApplied) {
                this.boss.jetonBonusApplied = true;
                const bossDmg = this.jetonsCollected * 15;
                this.boss.hp = Math.max(minFloor + 40, this.boss.hp - bossDmg);
                this.boss.hitFlash = 14;
                if (this.duoPartner) {
                    const partDmg = this.jetonsCollected * 10;
                    this.duoPartner.hp = Math.max(minFloor + 30, this.duoPartner.hp - partDmg);
                    this.duoPartner.hitFlash = 14;
                    this.addFloatingText(`🪙 -${partDmg} HP!`, this.duoPartner.x + this.duoPartner.w * 0.5, this.duoPartner.y - 30, '#ffd32a', 22);
                }
                this.spawnBurst(this.boss.x + this.boss.w * 0.5, this.boss.y + this.boss.h * 0.4, 22, '#ffd32a', 8, 22);
                this.addFloatingText(`🪙 ${this.jetonsCollected} JETONS: -${bossDmg} HP!`, this.boss.x + this.boss.w * 0.5, this.boss.y - 38, '#ffd32a', 23);
                this.updateBossHUD();
            }
            this.updateMissionPill();
        }
    }

    showMemePopup(text) {
        this.ui.memeText.textContent = text;
        this.ui.memePopup.classList.remove('hidden');
        clearTimeout(this.memeTimeout);
        this.memeTimeout = setTimeout(() => {
            this.ui.memePopup.classList.add('hidden');
        }, 3000);
    }

    addFloatingText(text, x, y, color = '#ffd32a', size = 20) {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            size: size,
            vy: -1.8,
            life: 62,
            maxLife: 62
        });
    }

    spawnRunDust(x, y) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 14,
                y: y - 4,
                vx: (Math.random() - 0.5) * 2.5 - this.player.vx * 0.25,
                vy: -0.8 - Math.random() * 1.4,
                life: 16,
                maxLife: 16,
                color: 'rgba(220, 225, 235, 0.8)',
                size: 5 + Math.random() * 4
            });
        }
    }

    spawnBurst(x, y, count, color, speed = 6, life = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * speed * 2,
                vy: (Math.random() - 0.5) * speed * 2,
                life: life,
                maxLife: life,
                color: color,
                size: 4 + Math.random() * 5
            });
        }
    }

    // =====================================================================
    // MAIN UPDATE LOOP
    // =====================================================================
    update(dt) {
        if (this.isPaused) return;

        this.animClock += dt;

        // Clamp dt for tab-switch stability
        const safeDt = Math.min(dt, 0.05);

        if (this.state === GAME_STATE.OPENING) {
            this.updateOpening(safeDt);
            if (this.screenShake > 0) this.screenShake *= 0.88;
            if (this.screenShake < 0.2) this.screenShake = 0;
            return;
        }

        if (this.state === GAME_STATE.MENU) {
            this.menuPan += safeDt * 28;
            if (this.screenShake > 0) this.screenShake *= 0.88;
            if (this.screenShake < 0.2) this.screenShake = 0;
            return;
        }

        if (this.state === GAME_STATE.INTRO) {
            this.updateCinematicIntro(safeDt);
            return;
        }

        const isActiveStage = this.state === GAME_STATE.RUNNING ||
            this.state === GAME_STATE.PRE_BOSS_WALK ||
            this.state === GAME_STATE.PRE_BOSS_DIALOGUE ||
            this.state === GAME_STATE.BOSS_FIGHT ||
            this.state === GAME_STATE.DEMO;

        if (isActiveStage) {
            this.elapsedSeconds += safeDt;
            const minutes = Math.floor(this.elapsedSeconds / 60);
            const seconds = Math.floor(this.elapsedSeconds % 60);
            this.ui.timeVal.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        if (this.screenShake > 0) this.screenShake *= 0.88;
        if (this.screenShake < 0.2) this.screenShake = 0;
        if (this.radialFlashTimer > 0) this.radialFlashTimer--;
        if (this.damageVignetteTimer > 0) this.damageVignetteTimer--;
        if (this.player.attackAnimTimer > 0) this.player.attackAnimTimer--;
        if (this.player.hitFlash > 0) this.player.hitFlash--;

        if (this.player.powerTimer > 0) {
            this.player.powerTimer--;
            if (this.player.powerTimer % 4 === 0) {
                this.particles.push({
                    x: this.player.x + Math.random() * this.player.w,
                    y: this.player.y + Math.random() * this.player.h,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: -1.5 - Math.random() * 1.5,
                    life: 16,
                    maxLife: 16,
                    color: Math.random() > 0.5 ? '#00d2d3' : '#ffd32a',
                    size: 5
                });
            }
            if (this.player.powerTimer === 0 || this.player.powerTimer % 30 === 0) {
                this.updateComboAndPowerHUD();
            }
        }

        if (this.shoutAvatarTimer > 0) {
            this.shoutAvatarTimer--;
            if (this.shoutAvatarTimer > 0) {
                this.ui.playerAvatar.src = 'assets/sprites/thenerean_shout_avatar.png';
                this.ui.playerAvatarWrap.classList.add('shouting');
            } else {
                this.ui.playerAvatar.src = 'assets/sprites/thenerean_avatar.png';
                this.ui.playerAvatarWrap.classList.remove('shouting');
            }
        }

        if (isActiveStage) {
            const powered = this.player.powerTimer > 0;
            const regenRate = powered ? 0.32 : 0.16;
            if (this.player.megaEnergy < this.player.maxMegaEnergy) {
                this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + regenRate);
            }
            const extraTick = powered && (Math.floor(this.player.powerTimer) % 2 === 0) ? 1 : 0;
            if (this.player.frisbeeCooldown > 0) {
                this.player.frisbeeCooldown = Math.max(0, this.player.frisbeeCooldown - 1 - extraTick);
            }
            if (this.player.lawBookCooldown > 0) {
                this.player.lawBookCooldown = Math.max(0, this.player.lawBookCooldown - 1 - extraTick);
            }
            if (this.player.blockTimer > 0) {
                this.player.blockTimer--;
                if (this.player.blockTimer <= 0) {
                    this.player.isBlocking = false;
                }
            }
            if (this.player.blockCooldown > 0) {
                this.player.blockCooldown--;
            }
            this.updateBars();
        }

        if (this.state === GAME_STATE.RUNNING) {
            this.updateRunning(safeDt);
        } else if (this.state === GAME_STATE.PRE_BOSS_WALK) {
            this.updatePreBossWalk(safeDt);
        } else if (this.state === GAME_STATE.BOSS_FIGHT) {
            this.updateBossFight(safeDt);
        } else if (this.state === GAME_STATE.DEMO) {
            this.updateDemoMode(safeDt);
        }

        if (this.player.invulnerableTime > 0) this.player.invulnerableTime--;

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Update Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += (sw.maxRadius - sw.radius) * 0.22 + 3;
            sw.alpha *= 0.88;
            if (sw.alpha < 0.04 || sw.radius >= sw.maxRadius) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Update Floating Combat Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.vy *= 0.96;
            ft.life--;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    onLavaFall(pit) {
        const dmg = this.touchControlsEnabled ? 8 : 12;
        this.screenShake = 16;
        window.soundManager.playLavaSplash();
        this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.groundY + 10, 26, '#ff6348', 8, 24);
        this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.groundY + 6, 16, '#ffd32a', 6, 18);
        this.onPlayerHit(dmg, 'lava');

        // Recover cleanly onto solid ground immediately before the lava pit
        if (this.state === GAME_STATE.RUNNING && pit) {
            const safeWorldX = Math.max(80, pit.x - 140);
            this.worldDistance = Math.max(0, safeWorldX - 130);
            this.player.x = safeWorldX - this.worldDistance;
            this.player.y = this.player.groundY - this.player.h - 8;
            this.player.vy = -4.0;
            this.player.isGrounded = false;
            this.player.invulnerableTime = Math.max(this.player.invulnerableTime, 64);
            if (this.chaser) {
                this.chaser.x = Math.min(this.chaser.x, Math.max(18, this.player.x - 165));
            }
            this.addFloatingText("🔥 LAVA! RECHTSZEITIG SPRINGEN!", this.player.x + 140, this.player.groundY - 170, '#ffd32a', 20);
        }
    }

    updateRunning(dt) {
        if (this.level && this.level.mode === 'time_attack') {
            this.timeRemaining = Math.max(0, this.timeRemaining - dt);
            const secCeil = Math.ceil(this.timeRemaining);
            if (secCeil !== this.lastTickSec) {
                this.lastTickSec = secCeil;
                if (secCeil <= 6 && secCeil > 0) {
                    window.soundManager.playWarningTick();
                }
            }
            this.updateMissionPill();
            if (this.timeRemaining <= 0) {
                this.lastDamageReason = 'timeout';
                this.triggerGameOver();
                return;
            }
        }

        const prevStanding = this.player.standingPlatform;
        this.player.standingPlatform = null;
        this.updateMovingPlatforms();
        if (prevStanding && this.player.vy >= 0) {
            if (prevStanding.dx) this.player.x += prevStanding.dx;
            if (prevStanding.dy) this.player.y += prevStanding.dy;
        }

        if (this.player.sprintTimer > 0) this.player.sprintTimer--;
        const speedMult = this.player.sprintTimer > 0 ? 1.52 : 1.0;

        if (this.keys['arrowright'] || this.keys['d']) {
            this.player.vx = this.player.speed * speedMult;
            this.player.facing = 1;
        } else if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.vx = -this.player.speed * 0.78 * speedMult;
            this.player.facing = -1;
        } else {
            this.player.vx = 0;
        }

        if (this.player.isDucking && this.player.isGrounded) {
            this.player.vx *= 0.80;
        } else if (this.player.isDucking && !this.player.isGrounded && this.player.vy > -1) {
            this.player.vy += 0.45;
        }

        const prevBottom = this.player.y + this.player.h;
        this.player.x += this.player.vx;
        if (this.player.x < 30) this.player.x = 30;

        const scrollThreshold = canvas.width * 0.35;
        if (this.player.x > scrollThreshold && this.player.vx > 0) {
            const advance = this.player.x - scrollThreshold;
            this.player.x = scrollThreshold;
            this.worldDistance += advance;
        }

        // Sprint pads trigger automatic turbo burst
        const footWorldX = this.worldDistance + this.player.x + this.player.w * 0.5;
        for (const pad of this.boostPads) {
            if (this.player.isGrounded && footWorldX >= pad.x && footWorldX <= pad.x + pad.w) {
                if (!pad.triggered) {
                    pad.triggered = true;
                    this.triggerSprintBurst(135);
                } else if (this.player.sprintTimer < 90) {
                    this.player.sprintTimer = 110;
                }
            }
        }

        if (this.player.sprintTimer > 0 && Math.abs(this.player.vx) > 2 && Math.random() > 0.35) {
            this.particles.push({
                x: this.player.x + this.player.w * 0.3, y: this.player.y + this.player.h * 0.65,
                vx: -3 - Math.random() * 2, vy: (Math.random() - 0.5) * 1.5,
                life: 16, maxLife: 16, color: '#00d2d3', size: 6
            });
        }
        if (this.player.isGrounded && Math.abs(this.player.vx) > 2 && Math.random() > 0.65) {
            this.spawnRunDust(this.player.x + this.player.w * 0.3, this.player.y + this.player.h);
        }

        this.player.y += this.player.vy;
        this.player.vy += 0.68;
        this.player.isGrounded = false;

        // 1. Check elevated solid platforms (one-way top landing)
        const footLeftScreen = this.player.x + 14;
        const footRightScreen = this.player.x + this.player.w - 14;
        for (const plat of this.platforms) {
            if (plat.isArena) continue;
            const px0 = plat.x - this.worldDistance;
            const px1 = px0 + plat.w;
            if (footRightScreen > px0 && footLeftScreen < px1) {
                const snapSlack = prevStanding === plat ? 4 : 0;
                if (this.player.vy >= 0 && prevBottom <= plat.y + 18 && (this.player.y + this.player.h) >= plat.y - snapSlack) {
                    this.player.y = plat.y - this.player.h;
                    this.player.vy = 0;
                    this.player.isGrounded = true;
                    this.player.standingPlatform = plat;
                    if (this.player.jumpBuffered) {
                        this.player.jumpBuffered = false;
                        this.playerJump();
                    }
                    break;
                }
            }
        }

        // 2. Check Lava / Chasm Pits on ground plane
        let overPit = null;
        for (const pit of this.lavaPits) {
            if (footWorldX > pit.x + 16 && footWorldX < pit.x + pit.w - 16) {
                overPit = pit;
                break;
            }
        }

        if (!this.player.isGrounded && !overPit && this.player.y >= this.player.groundY - this.player.h) {
            this.player.y = this.player.groundY - this.player.h;
            this.player.vy = 0;
            this.player.isGrounded = true;
            this.player.lastSafeWorldX = Math.max(80, this.worldDistance + this.player.x);
            if (this.player.jumpBuffered) {
                this.player.jumpBuffered = false;
                this.playerJump();
            }
        }

        if (overPit && (this.player.y + this.player.h) > this.player.groundY + 52) {
            this.onLavaFall(overPit);
            return;
        }

        this.tickPlayerBanter();

        const prog = Math.min(100, (this.worldDistance / this.level.targetDistance) * 100);
        this.ui.progBar.style.width = `${prog}%`;
        this.ui.progValText.textContent = `${Math.round(prog)}%`;

        if (this.chaser) {
            this.updateChaser();
            if (this.state !== GAME_STATE.RUNNING) return;
            this.updateMissionPill();
        }

        // Mid-Level Mini-Boss Checkpoint (Average GIBB Schüler)
        const mbDist = this.level.targetDistance * (this.level.miniBossTriggerRatio || 0.50);
        if (this.level.hasMiniBoss && !this.midBossDefeated && !this.midBossTriggered && this.worldDistance >= mbDist) {
            this.triggerMiniBossEncounter();
            return;
        }

        if (this.worldDistance >= this.level.targetDistance) {
            if (this.level.mode === 'time_attack' || this.level.hasBoss === false) {
                if (this.timeRemaining >= 8) {
                    this.player.score = Math.min(6.0, +(this.player.score + 0.3).toFixed(1));
                    this.updateBars();
                }
                window.soundManager.playWaveClear();
                this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.5, 28, '#ffd32a', 8, 24);
                this.triggerLevelWin();
                return;
            }
            if (this.level.mode === 'tuktuk_chase_boss') {
                this.chaser = null;
                this.projectiles = [];
                this.hazards = [];
                window.soundManager.playSwitch();
                this.screenShake = 18;
                this.shockwaves.push({ x: this.player.x + this.player.w * 0.5, y: this.player.groundY - 50, radius: 20, maxRadius: 260, color: '#ff4757', alpha: 0.92 });
                this.addFloatingText("🔴 SERVER NOT-AUS! JETZT GEGEN DAS TUKTUK!", canvas.width * 0.5, canvas.height * 0.40, '#ffd32a', 24);
                this.showMemePopup("🔴 TUKTUK ABGEBREMST — JETZT FINALER TUKTUK-KAMPF!");
            }
            this.triggerPreBossEncounter();
            return;
        }

        for (const obs of this.obstacles) {
            const screenX = obs.x - this.worldDistance;
            if (screenX > -120 && screenX < canvas.width + 120) {
                const isDuck = this.player.isDucking && this.player.isGrounded;
                const pHitY = isDuck ? this.player.y + this.player.h * 0.50 : this.player.y + 12;
                const pHitH = isDuck ? this.player.h * 0.48 : this.player.h - 14;
                const ox = screenX + (obs.high ? 6 : 8);
                const oy = obs.y + (obs.high ? 4 : 8);
                const ow = obs.w - (obs.high ? 12 : 16);
                const oh = obs.h - (obs.high ? 8 : 10);
                if (obs.high && isDuck && !obs.duckDodged) {
                    const standHit = this.checkCollision(this.player.x + 12, this.player.y + 12, this.player.w - 24, this.player.h - 14, ox, oy, ow, oh);
                    const crouchHit = this.checkCollision(this.player.x + 12, pHitY, this.player.w - 24, pHitH, ox, oy, ow, oh);
                    if (standHit && !crouchHit) {
                        obs.duckDodged = true;
                        this.addFloatingText("💨 SAUBER GEDUCKT!", this.player.x + this.player.w * 0.5, this.player.y + 14, '#2ed573', 19);
                        this.registerCombo(1);
                    }
                }
                if (this.checkCollision(this.player.x + 12, pHitY, this.player.w - 24, pHitH, ox, oy, ow, oh)) {
                    if (this.player.isBlocking) {
                        this.onBlockSuccess(screenX, obs.y);
                    } else {
                        const dmg = this.touchControlsEnabled ? 7 : 10;
                        this.onPlayerHit(dmg, obs.type);
                    }
                }
                if (!obs.cleared && screenX + obs.w < this.player.x) {
                    obs.cleared = true;
                    this.onObstacleDodged();
                }
            }
        }

        for (const col of this.collectibles) {
            if (col.collected) continue;
            const screenX = col.x - this.worldDistance;
            if (screenX > -100 && screenX < canvas.width + 100) {
                const grabPadding = this.touchControlsEnabled ? 24 : 8;
                if (this.checkCollision(this.player.x - grabPadding, this.player.y - grabPadding, this.player.w + grabPadding * 2, this.player.h + grabPadding * 2, screenX, col.y, col.w, col.h)) {
                    col.collected = true;
                    this.onCollectItem(col.type);
                }
            }
        }

        if (this.targets && this.targets.length > 0) {
            this.updateTargets();
        }
        this.updateProjectiles();
    }

    onObstacleDodged() {
        this.addFloatingText("Ausgewichen!", this.player.x + 25, this.player.y - 22, '#2ed573', 18);
        this.registerCombo(1);
        const dodgeClips = [
            'thenerean_stah',
            'thenerean_254',
            'thenerean_bankomat',
            'thenerean_lippenstift',
            'thenerean_ultra',
            'thenerean_srilanka',
            'thenerean_niemert_verbi',
            'thenerean_geilschte_setup',
            'thenerean_banana_monika'
        ];
        const chaos = this.getSoundChaosLevel();
        const chance = chaos >= 3 ? 0.92 : (chaos === 1 ? 0.25 : 0.65);
        if (Math.random() < chance) {
            const clip = dodgeClips[Math.floor(Math.random() * dodgeClips.length)];
            window.soundManager.playClip(clip, null, 1.0, chaos <= 2 ? { lowPriority: true } : {});
            if (chaos >= 3 && Math.random() < 0.45) {
                window.soundManager.playClip(this.pickRandomChaosClip());
            }
        }
    }

    tickPlayerBanter() {
        this.player.banterTimer--;
        if (this.player.banterTimer <= 0) {
            const chaos = this.getSoundChaosLevel();
            this.player.banterTimer = chaos >= 3
                ? (85 + Math.random() * 55)
                : (chaos === 1 ? (430 + Math.random() * 190) : (320 + Math.random() * 140));
            if (this.level && this.level.playerLines && this.level.playerLines.length > 0) {
                const line = this.level.playerLines[Math.floor(Math.random() * this.level.playerLines.length)];
                window.soundManager.playClip(line.clip, null, 1.0, chaos <= 2 ? { lowPriority: true } : {});
                if (chaos >= 3 && Math.random() < 0.55) {
                    window.soundManager.playClip(this.pickRandomChaosClip());
                }
                this.shoutAvatarTimer = Math.max(this.shoutAvatarTimer, 28);
                this.addFloatingText(`"${line.text}"`, this.player.x + this.player.w * 0.5, this.player.y - 36, '#2ed573', 16);
            }
        }
    }

    updatePreBossWalk(dt) {
        this.updateMovingPlatforms();
        const targetX = canvas.width * 0.34;
        this.player.facing = 1;
        if (this.player.x < targetX) {
            this.player.vx = 4.2;
            this.player.x += 4.2;
        } else {
            this.player.vx = 0;
            this.startPreBossDialogue();
        }

        const prevBottom = this.player.y + this.player.h;
        this.player.y += this.player.vy;
        this.player.vy += 0.68;
        this.player.isGrounded = false;
        this.player.standingPlatform = null;

        const footLeftScreen = this.player.x + 14;
        const footRightScreen = this.player.x + this.player.w - 14;
        for (const plat of this.platforms) {
            if (!plat.isArena) continue;
            const px0 = plat.x - this.worldDistance;
            const px1 = px0 + plat.w;
            if (footRightScreen > px0 && footLeftScreen < px1) {
                if (this.player.vy >= 0 && prevBottom <= plat.y + 16 && (this.player.y + this.player.h) >= plat.y) {
                    this.player.y = plat.y - this.player.h;
                    this.player.vy = 0;
                    this.player.isGrounded = true;
                    this.player.standingPlatform = plat;
                    break;
                }
            }
        }

        if (!this.player.isGrounded && this.player.y >= this.player.groundY - this.player.h) {
            this.player.y = this.player.groundY - this.player.h;
            this.player.vy = 0;
            this.player.isGrounded = true;
            if (this.player.jumpBuffered) {
                this.player.jumpBuffered = false;
                this.playerJump();
            }
        }
    }

    updateBossFight(dt) {
        const prevStanding = this.player.standingPlatform;
        this.player.standingPlatform = null;
        this.updateMovingPlatforms();
        if (prevStanding && this.player.vy >= 0) {
            if (prevStanding.dx) this.player.x += prevStanding.dx;
            if (prevStanding.dy) this.player.y += prevStanding.dy;
        }

        if (this.player.sprintTimer > 0) this.player.sprintTimer--;
        const speedMult = this.player.sprintTimer > 0 ? 1.42 : 1.0;

        if (this.keys['arrowright'] || this.keys['d']) {
            this.player.vx = this.player.speed * speedMult;
            this.player.facing = 1;
        } else if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.vx = -this.player.speed * speedMult;
            this.player.facing = -1;
        } else {
            this.player.vx = 0;
        }

        if (this.player.isDucking && this.player.isGrounded) {
            this.player.vx *= 0.80;
        } else if (this.player.isDucking && !this.player.isGrounded && this.player.vy > -1) {
            this.player.vy += 0.45;
        }

        this.applyPlayerStatus();
        const prevBottom = this.player.y + this.player.h;
        this.player.x += this.player.vx;
        if (this.player.x < 28) this.player.x = 28;
        if (this.player.x > canvas.width - 110) this.player.x = canvas.width - 110;

        if (this.player.isGrounded && Math.abs(this.player.vx) > 2 && Math.random() > 0.65) {
            this.spawnRunDust(this.player.x + this.player.w * 0.3, this.player.y + this.player.h);
        }

        this.player.y += this.player.vy;
        this.player.vy += 0.68;
        this.player.isGrounded = false;

        const footLeftScreen = this.player.x + 14;
        const footRightScreen = this.player.x + this.player.w - 14;
        for (const plat of this.platforms) {
            if (!plat.isArena) continue;
            const px0 = plat.x - this.worldDistance;
            const px1 = px0 + plat.w;
            if (footRightScreen > px0 && footLeftScreen < px1) {
                const snapSlack = prevStanding === plat ? 6 : 0;
                if (this.player.vy >= 0 && prevBottom <= plat.y + 16 && (this.player.y + this.player.h) >= plat.y - snapSlack) {
                    this.player.y = plat.y - this.player.h;
                    this.player.vy = 0;
                    this.player.isGrounded = true;
                    this.player.standingPlatform = plat;
                    if (this.player.jumpBuffered) {
                        this.player.jumpBuffered = false;
                        this.playerJump();
                    }
                    break;
                }
            }
        }

        if (!this.player.isGrounded && this.player.y >= this.player.groundY - this.player.h) {
            this.player.y = this.player.groundY - this.player.h;
            this.player.vy = 0;
            this.player.isGrounded = true;
            if (this.player.jumpBuffered) {
                this.player.jumpBuffered = false;
                this.playerJump();
            }
        }

        this.tickPlayerBanter();
        this.updateArenaSwitch();

        const allowFloorHazards = this.level && this.level.arenaFloorHazards && !(this.boss && this.boss.isStageVanguard);
        if (allowFloorHazards) {
            this.floorHazardCooldown--;
            if (this.floorHazardCooldown <= 0) {
                const isFinalB = this.level.mode === 'final_efz_gauntlet';
                this.floorHazardCooldown = isFinalB ? 540 : (this.level.mode === 'duo_finale_platforms' ? 620 : 680);
                if (isFinalB) {
                    const z1X = Math.round(canvas.width * 0.05);
                    const z2X = Math.round(canvas.width * 0.21);
                    const z3X = Math.round(canvas.width * 0.37);
                    this.hazards.push({ x: z1X, w: 135, armIn: 90, life: 185, theme: 'electric' });
                    this.hazards.push({ x: z2X, w: 135, armIn: 90, life: 185, theme: 'electric' });
                    this.hazards.push({ x: z3X, w: 135, armIn: 90, life: 185, theme: 'electric' });
                    this.addFloatingText("⚡ 3× PRÜFUNGS-SPERRFRIST! AUF PLATTFORMEN / LIFT!", canvas.width * 0.34, this.player.groundY - 110, '#00d2d3', 21);
                } else {
                    const z1X = Math.round(canvas.width * 0.06);
                    const z2X = Math.round(canvas.width * 0.25);
                    this.hazards.push({ x: z1X, w: 145, armIn: 80, life: 185, theme: 'electric' });
                    this.hazards.push({ x: z2X, w: 145, armIn: 80, life: 185, theme: 'electric' });
                    this.addFloatingText("⚡ SPERRFRIST AM BODEN! AUF PLATTFORMEN!", canvas.width * 0.32, this.player.groundY - 110, '#00d2d3', 21);
                }
            }
        }

        if (this.boss && this.boss.hp > 0) {
            if (this.boss.hitFlash > 0) this.boss.hitFlash--;
            if (this.boss.attackAnimTimer > 0) this.boss.attackAnimTimer--;
            if (this.boss.banterAnimTimer > 0) this.boss.banterAnimTimer--;

            this.boss.facing = this.player.x < this.boss.x ? -1 : 1;
            const isMainTukTuk = this.isTukTukType(this.boss.type);
            const spd = isMainTukTuk ? (this.boss.type === 'tuktuk_dual_gpu' ? 4.1 : 3.5) : 3.0;
            if (this.bossCanMove(this.boss)) this.boss.x += this.boss.moveDir * spd * this.bossSpeedMult(this.boss);
            if (this.boss.x < canvas.width * 0.46) this.boss.moveDir = 1;
            else if (this.boss.x > canvas.width - this.boss.w - 30) this.boss.moveDir = -1;

            // Burning GPU / Overclock smoke effect on TukTuk bosses
            if (isMainTukTuk && Math.random() > 0.48) {
                const isDual = this.boss.type === 'tuktuk_dual_gpu';
                this.particles.push({
                    x: this.boss.x + this.boss.w * 0.72,
                    y: this.boss.y + 22,
                    vx: 1.5 + Math.random() * 2,
                    vy: -2.2 - Math.random() * 2,
                    life: 24,
                    maxLife: 24,
                    color: isDual
                        ? (Math.random() > 0.45 ? '#00d2d3' : '#ff6348')
                        : (this.boss.hp < this.boss.maxHp * 0.5 ? '#ff6348' : '#ffa502'),
                    size: 6 + Math.random() * 5
                });
            }

            this.updateBossAI(this.boss, this.duoPartner);

            this.boss.banterTimer--;
            if (this.boss.banterTimer <= 0) {
                const chaos = this.getSoundChaosLevel();
                this.boss.banterTimer = chaos >= 3
                    ? (85 + Math.random() * 60)
                    : (chaos === 1 ? (260 + Math.random() * 130) : (175 + Math.random() * 110));
                if (this.boss.isStageVanguard) {
                    this.boss.banterAnimTimer = 35;
                    const vgTaunts = [
                        'KEIN EINLASS OHNI PRÜFUNGS-AUSWEIS! 🛡️',
                        'Erst mal Energy exen — du chunnsch nöd dure! ⚡',
                        'Monika & Adam warted schon uf di!',
                        'Laptop-Wurf incoming! 💻'
                    ];
                    const msg = vgTaunts[Math.floor(Math.random() * vgTaunts.length)];
                    this.addFloatingText(`"${msg}"`, this.boss.x + this.boss.w * 0.4, this.boss.y - 26, '#ffd32a', 17);
                    if (chaos >= 3) window.soundManager.playClip(this.pickRandomChaosClip());
                } else if (this.boss.isMiniBoss) {
                    this.boss.banterAnimTimer = 35;
                    const mbTaunts = [
                        'Erst mal Energy exen! ⚡',
                        'An mir chunnsch nöd verbi!',
                        'Laptop-Wurf incoming! 💻',
                        'Han d Modul-Prüefig scho gmacht!'
                    ];
                    const msg = mbTaunts[Math.floor(Math.random() * mbTaunts.length)];
                    this.addFloatingText(`"${msg}"`, this.boss.x + this.boss.w * 0.4, this.boss.y - 26, '#38bdf8', 17);
                    if (chaos >= 3) window.soundManager.playClip(this.pickRandomChaosClip());
                } else if (this.level && this.level.bossLines && this.level.bossLines.length > 0) {
                    const speakerEntity = (this.duoPartner && this.duoPartner.hp > 0 && Math.random() > 0.5) ? this.duoPartner : this.boss;
                    speakerEntity.banterAnimTimer = 35;
                    const line = this.level.bossLines[Math.floor(Math.random() * this.level.bossLines.length)];
                    if (line.clip) {
                        window.soundManager.playClip(line.clip, null, 1.0, chaos <= 2 ? { lowPriority: true } : {});
                    }
                    if (chaos >= 3 && Math.random() < 0.65) {
                        window.soundManager.playClip(this.pickRandomChaosClip());
                    }
                    this.addFloatingText(`"${line.text}"`, speakerEntity.x + speakerEntity.w * 0.4, speakerEntity.y - 26, '#ffd32a', 17);
                }
            }
        }

        if (this.duoPartner && this.duoPartner.hp > 0) {
            if (this.duoPartner.hitFlash > 0) this.duoPartner.hitFlash--;
            if (this.duoPartner.attackAnimTimer > 0) this.duoPartner.attackAnimTimer--;
            if (this.duoPartner.banterAnimTimer > 0) this.duoPartner.banterAnimTimer--;

            this.duoPartner.facing = this.player.x < this.duoPartner.x ? -1 : 1;
            const isPartnerTukTuk = this.isTukTukType(this.duoPartner.type);
            const spdP = isPartnerTukTuk ? 3.8 : 3.3;
            if (this.bossCanMove(this.duoPartner)) this.duoPartner.x += this.duoPartner.moveDir * spdP * this.bossSpeedMult(this.duoPartner);
            if (this.duoPartner.x < canvas.width * 0.50) this.duoPartner.moveDir = 1;
            else if (this.duoPartner.x > canvas.width - this.duoPartner.w - 25) this.duoPartner.moveDir = -1;

            if (isPartnerTukTuk && Math.random() > 0.50) {
                this.particles.push({
                    x: this.duoPartner.x + this.duoPartner.w * 0.72,
                    y: this.duoPartner.y + 22,
                    vx: 1.5 + Math.random() * 2,
                    vy: -2.2 - Math.random() * 2,
                    life: 24,
                    maxLife: 24,
                    color: Math.random() > 0.45 ? '#00d2d3' : '#ff6348',
                    size: 6 + Math.random() * 5
                });
            }

            this.updateBossAI(this.duoPartner, this.boss);

            if (!this.boss || this.boss.hp <= 0) {
                this.duoPartner.banterTimer = (this.duoPartner.banterTimer || 140) - 1;
                if (this.duoPartner.banterTimer <= 0) {
                    const chaosP = this.getSoundChaosLevel();
                    this.duoPartner.banterTimer = chaosP >= 3
                        ? (85 + Math.random() * 55)
                        : (chaosP === 1 ? (260 + Math.random() * 120) : (180 + Math.random() * 100));
                    this.duoPartner.banterAnimTimer = 35;
                    if (this.duoPartner.isMiniBoss || this.duoPartner.type === 'gibb_student') {
                        const studentLine = this.duoPartner.type === 'gibb_student' && this.level && this.level.id === 7
                            ? 'Kiosk-Verstärkung! Energy-Wurf! ⚡'
                            : '"Modul-Prüefig!" 💻';
                        this.addFloatingText(studentLine, this.duoPartner.x + this.duoPartner.w * 0.4, this.duoPartner.y - 26, '#38bdf8', 17);
                        if (chaosP >= 3) window.soundManager.playClip(this.pickRandomChaosClip());
                    } else if (isPartnerTukTuk) {
                        const ttLine = Math.random() > 0.5
                            ? { text: "Verdammte Grafikkarte!", clip: "thenerean_grafikkarte" }
                            : { text: "Direkt aus Sri Lanka!", clip: "thenerean_srilanka" };
                        window.soundManager.playClip(ttLine.clip, null, 1.0, chaosP <= 2 ? { lowPriority: true } : {});
                        if (chaosP >= 3) window.soundManager.playClip(this.pickRandomChaosClip());
                        this.addFloatingText(`"${ttLine.text}"`, this.duoPartner.x + this.duoPartner.w * 0.4, this.duoPartner.y - 26, '#ff6348', 17);
                    } else {
                        const adamLine = Math.random() > 0.5
                            ? { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" }
                            : { text: "Da hast du 20 Frisbees!", clip: "adam_20_frisbees" };
                        window.soundManager.playClip(adamLine.clip, null, 1.0, chaosP <= 2 ? { lowPriority: true } : {});
                        if (chaosP >= 3) window.soundManager.playClip(this.pickRandomChaosClip());
                        this.addFloatingText(`"${adamLine.text}"`, this.duoPartner.x + this.duoPartner.w * 0.4, this.duoPartner.y - 26, '#00d2d3', 17);
                    }
                }
            }
        }

        this.checkDuoEnrage();
        this.updateBossHazards();

        if (this.boss && this.boss.hp <= 0 && (!this.duoPartner || this.duoPartner.hp <= 0)) {
            if (this.level && this.level.mode === 'wave_rush' && this.level.waves && (this.currentWaveIndex + 1) < this.level.waves.length) {
                this.startWave(this.currentWaveIndex + 1);
                return;
            }
            if (this.boss.isMiniBoss && !this.boss.isWaveEnemy) {
                this.onMiniBossDefeated();
                return;
            }
            if (this.boss.isStageVanguard) {
                this.onVanguardDefeated();
                return;
            }
            this.triggerLevelWin();
            return;
        }

        this.updateBossHUD();
        this.updateMissionPill();
        this.updateProjectiles();
    }

    bossFireAttack(bossEntity, forcedType) {
        bossEntity.attackAnimTimer = 22;
        const type = forcedType || (bossEntity.name.includes("Adam")
            ? 'frisbee'
            : (this.isTukTukType(bossEntity.type)
                ? 'broken_cable'
                : (bossEntity.type === 'gibb_student' ? 'energy_can' : 'red_card')));
        const isAdam = type === 'frisbee';
        const isTukTuk = type === 'broken_cable';
        const dir = this.player.x < bossEntity.x ? -1 : 1;
        const diff = this.getActiveDifficulty();

        this.projectiles.push({
            x: dir < 0 ? bossEntity.x : bossEntity.x + bossEntity.w,
            y: bossEntity.y + bossEntity.h * 0.36,
            vx: 9.4 * (diff.projSpeedMult || 1) * dir,
            vy: (this.player.y - bossEntity.y) * 0.018,
            w: 44,
            h: type === 'frisbee' ? 28 : 42,
            isPlayer: false,
            type: type,
            damage: Math.max(4, Math.round(11 * (diff.dmgMult || 1))),
            rotation: 0,
            trailColor: isAdam ? '#ff4757' : (isTukTuk ? '#00d2d3' : '#ff3838')
        });

        const chaos = this.getSoundChaosLevel();
        const fireChance = chaos >= 3 ? 0.90 : (chaos === 1 ? 0.25 : 0.55);
        if (Math.random() < fireChance) {
            const clip = isAdam
                ? (Math.random() > 0.5 ? 'adam_20_frisbees' : 'adam_frisbee')
                : (isTukTuk
                    ? (Math.random() > 0.5 ? 'thenerean_gpu' : 'thenerean_grafikkarte')
                    : (Math.random() > 0.5 ? 'monika_zspaet' : 'monika_gang_platz'));
            window.soundManager.playClip(clip, null, 1.0, chaos <= 2 ? { lowPriority: true } : {});
            if (chaos >= 3 && Math.random() < 0.45) {
                window.soundManager.playClip(this.pickRandomChaosClip());
            }
        }
    }

    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.type !== 'mega_beam' && !p.noSpin) p.rotation += 0.2;
            if (this.applyProjectileGravity(p)) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Emit subtle projectile wake particles
            if (Math.random() > 0.45) {
                this.particles.push({
                    x: p.x + p.w * 0.4,
                    y: p.y + p.h * 0.5 + (Math.random() - 0.5) * 8,
                    vx: -p.vx * 0.12,
                    vy: (Math.random() - 0.5) * 1.2,
                    life: p.type === 'mega_beam' ? 18 : 10,
                    maxLife: p.type === 'mega_beam' ? 18 : 10,
                    color: p.trailColor || '#ffd32a',
                    size: p.type === 'mega_beam' ? 7 : 4
                });
            }

            // Player projectile hits interactive Arena Switch
            if (p.isPlayer && this.arenaSwitch && this.arenaSwitch.cooldown <= 0 && this.state === GAME_STATE.BOSS_FIGHT) {
                const sw = this.arenaSwitch;
                if (this.checkCollision(p.x, p.y, p.w, p.h, sw.x, sw.y, sw.w, sw.h)) {
                    this.triggerArenaSwitch();
                    if (p.type !== 'mega_beam') {
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }
            }

            // Player projectile hits primary Boss
            if (p.isPlayer && this.boss && this.boss.hp > 0) {
                if (this.checkCollision(p.x, p.y, p.w, p.h, this.boss.x, this.boss.y, this.boss.w, this.boss.h)) {
                    const dmg = this.resolvePlayerHit(this.boss, p);
                    this.boss.hp = Math.max(0, this.boss.hp - dmg);
                    this.boss.hitFlash = 9;
                    this.screenShake = p.type === 'mega_beam' ? 12 : 5;
                    window.soundManager.playHit();
                    this.spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, p.type === 'mega_beam' ? 18 : 8, p.trailColor || '#ffd32a', 7, 16);
                    this.addFloatingText(
                        `-${dmg}`,
                        this.boss.x + this.boss.w * 0.5 + (Math.random() - 0.5) * 26,
                        this.boss.y + 15 + (Math.random() - 0.5) * 20,
                        p.type === 'mega_beam' ? '#00d2d3' : (p.type === 'frisbee' ? '#ffd32a' : '#ff6b81'),
                        p.type === 'mega_beam' ? 28 : 22
                    );

                    if (this.state === GAME_STATE.DEMO) {
                        this.demoComboHits += 1;
                        this.demoTotalDamage += dmg;
                    }
                    if (this.boss.hp <= 0 && !this.boss.defeated) {
                        this.boss.defeated = true;
                        this.spawnBurst(this.boss.x + this.boss.w * 0.5, this.boss.y + this.boss.h * 0.5, 28, '#ffd32a', 9, 28);
                        this.addFloatingText("BESIEGT!", this.boss.x + this.boss.w * 0.5, this.boss.y - 20, '#ffd32a', 26);
                    }

                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // Player projectile hits Duo Partner (Level 6 Herr Adam)
            if (p.isPlayer && this.duoPartner && this.duoPartner.hp > 0) {
                if (this.checkCollision(p.x, p.y, p.w, p.h, this.duoPartner.x, this.duoPartner.y, this.duoPartner.w, this.duoPartner.h)) {
                    const dmg = this.resolvePlayerHit(this.duoPartner, p);
                    this.duoPartner.hp = Math.max(0, this.duoPartner.hp - dmg);
                    this.duoPartner.hitFlash = 9;
                    this.screenShake = p.type === 'mega_beam' ? 12 : 5;
                    window.soundManager.playHit();
                    this.spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, 10, '#00d2d3', 7, 16);
                    this.addFloatingText(`-${dmg}`, this.duoPartner.x + this.duoPartner.w * 0.5, this.duoPartner.y + 15, '#ff4757', 22);
                    if (this.duoPartner.hp <= 0 && !this.duoPartner.defeated) {
                        this.duoPartner.defeated = true;
                        this.spawnBurst(this.duoPartner.x + this.duoPartner.w * 0.5, this.duoPartner.y + this.duoPartner.h * 0.5, 28, '#00d2d3', 9, 28);
                        const partnerShort = (this.duoPartner.name || 'PARTNER').replace(/\s*\(.*?\)/g, '').toUpperCase();
                        this.addFloatingText(`${partnerShort} K.O.!`, this.duoPartner.x + this.duoPartner.w * 0.5, this.duoPartner.y - 20, '#00d2d3', 24);
                    }
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // Boss projectile hits player
            if (!p.isPlayer) {
                const isDucking = this.player.isDucking && this.player.isGrounded;
                const pHitY = isDucking ? this.player.y + this.player.h * 0.48 : this.player.y + 10;
                const pHitH = isDucking ? this.player.h * 0.50 : this.player.h - 14;

                // Check if normal standing hitbox would have hit, but crouch dodged under it
                if (isDucking && !p.duckDodged) {
                    const standingHit = this.checkCollision(p.x, p.y, p.w, p.h, this.player.x + 10, this.player.y + 10, this.player.w - 20, this.player.h - 14);
                    const crouchHit = this.checkCollision(p.x, p.y, p.w, p.h, this.player.x + 10, pHitY, this.player.w - 20, pHitH);
                    if (standingHit && !crouchHit) {
                        p.duckDodged = true;
                        this.addFloatingText("GEDUCKT! 💨", this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.25, '#2ed573', 20);
                        this.registerCombo(1);
                        const chaosD = this.getSoundChaosLevel();
                        if (Math.random() < (chaosD >= 3 ? 0.90 : 0.45)) {
                            window.soundManager.playClip('thenerean_stah', null, 1.0, chaosD <= 2 ? { lowPriority: true } : {});
                        }
                    }
                }

                if (this.checkCollision(p.x, p.y, p.w, p.h, this.player.x + 10, pHitY, this.player.w - 20, pHitH)) {
                    if (this.player.isBlocking) {
                        if (this.isPerfectBlockTiming()) {
                            this.reflectProjectile(p);
                            continue;
                        }
                        this.onBlockSuccess(p.x, p.y);
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                    if (this.onPlayerHit(p.damage, p.type)) this.applyHitEffect(p);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            if (p.x < -120 || p.x > canvas.width + 120 || p.y < -80 || p.y > canvas.height + 80) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    // Returns true if the hit landed (false while invulnerable).
    onPlayerHit(damage, reason) {
        if (this.player.invulnerableTime > 0) return false;
        this.lastDamageReason = reason || this.lastDamageReason;
        this.comboCount = 0;
        this.updateComboAndPowerHUD();

        this.player.hp = Math.max(0, this.player.hp - damage);
        this.player.invulnerableTime = this.touchControlsEnabled ? 76 : 66;
        this.player.hitFlash = 10;
        this.damageVignetteTimer = 16;
        this.player.score = Math.max(1.0, +(this.player.score - 0.2).toFixed(1));
        this.screenShake = 13;
        this.updateBars();
        window.soundManager.playHit();

        this.addFloatingText(`-${damage} HP!`, this.player.x + this.player.w * 0.5, this.player.y, '#ff4757', 21);
        this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.45, 15, '#ff4757', 7, 20);
        if (this.getSoundChaosLevel() >= 3 && Math.random() < 0.72) {
            window.soundManager.playClip(Math.random() > 0.5 ? 'thenerean_raste_aus' : 'thenerean_frechheit');
        }

        if (this.player.hp <= 0 && this.state !== GAME_STATE.DEMO) {
            this.triggerGameOver();
        }
        return true;
    }

    onCollectItem(type) {
        if (this.level && this.level.mode === 'time_attack' && (type === 'coffee' || type === 'energy_drink')) {
            this.timeRemaining += 2.5;
            this.updateMissionPill();
            this.addFloatingText("⏱️ +2.5s ZEIT!", this.player.x + 30, this.player.y - 38, '#ffd32a', 20);
        }

        if (type === 'energy_drink') {
            window.soundManager.playPowerUp();
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
            this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 45);
            this.player.powerTimer = 360; // 6s @ 60Hz: 1.5x Attack DMG + 2x Cooldown/Energy Recovery
            this.player.score = Math.min(6.0, +(this.player.score + 0.1).toFixed(1));
            this.updateBars();
            this.updateComboAndPowerHUD();
            this.addFloatingText("⚡ ENERGY-RUSH! 1.5× DMG (6s)", this.player.x + 25, this.player.y - 16, '#00d2d3', 20);
            this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.35, 16, '#00d2d3', 6, 20);
            this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.35, 10, '#ffd32a', 5, 18);
            const chaosCol = this.getSoundChaosLevel();
            if (Math.random() < (chaosCol >= 3 ? 0.95 : (chaosCol === 1 ? 0.35 : 0.65))) {
                const powerClip = Math.random() > 0.5 ? 'thenerean_gemini_king' : 'thenerean_geilschte_setup';
                window.soundManager.playClip(powerClip, null, 1.0, chaosCol <= 2 ? { lowPriority: true } : {});
                if (chaosCol >= 3 && Math.random() < 0.5) {
                    window.soundManager.playClip(this.pickRandomChaosClip());
                }
            }
            return;
        }

        window.soundManager.playCollect();
        if (type === 'law_book') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10);
            this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 25);
            this.player.lawBookCooldown = 0;
            this.player.score = Math.min(6.0, +(this.player.score + 0.1).toFixed(1));
            this.updateBars();
            this.addFloatingText("📘 +GESETZ & ENERGIE!", this.player.x + 25, this.player.y - 10, '#45aaf2', 19);
            this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.35, 12, '#45aaf2', 5, 18);
            return;
        }

        if (type === 'diploma_shard') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
            this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 45);
            this.player.score = Math.min(6.0, +(this.player.score + 0.2).toFixed(1));
            this.updateBars();
            this.addFloatingText("🏆 +EFZ DIPLOM-BOOST!", this.player.x + 25, this.player.y - 10, '#ffd32a', 20);
            this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.35, 14, '#ffd32a', 5.5, 20);
            return;
        }

        if (type === 'jeton') {
            this.jetonsCollected++;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 8);
            this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 12);
            if (this.jetonsCollected % 2 === 0) {
                this.player.score = Math.min(6.0, +(this.player.score + 0.1).toFixed(1));
            }
            this.updateBars();
            this.updateMissionPill();
            this.addFloatingText(`🪙 BANKOMAT-JETON ${this.jetonsCollected}/${this.jetonsTotal || 8}!`, this.player.x + 25, this.player.y - 16, '#ffd32a', 20);
            this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.35, 14, '#ffd32a', 6, 20);
            return;
        }

        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
        this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 35);
        this.player.score = Math.min(6.0, +(this.player.score + 0.1).toFixed(1));
        this.updateBars();

        const label = type === 'coffee' ? "+Kaffee & Energie!" : "+EFZ Energie!";
        this.addFloatingText(label, this.player.x + 25, this.player.y - 10, '#2ed573', 19);
        this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.35, 12, '#2ed573', 5, 18);
    }

    updateBars() {
        const maxHp = Math.max(1, this.player.maxHp || 150);
        const hpPct = Math.max(0, Math.min(100, (this.player.hp / maxHp) * 100));
        const energyPct = Math.max(0, Math.min(100, (this.player.megaEnergy / this.player.maxMegaEnergy) * 100));
        const frisbeeReady = this.player.frisbeeCooldown <= 0
            ? 100
            : Math.max(0, 100 - (this.player.frisbeeCooldown / this.player.maxFrisbeeCooldown) * 100);

        this.ui.hpBar.style.width = `${hpPct}%`;
        this.ui.hpValText.textContent = `${Math.max(0, Math.round(this.player.hp))}`;
        this.ui.energyBar.style.width = `${energyPct}%`;
        this.ui.energyValText.textContent = `${Math.round(energyPct)}%`;
        this.ui.scoreVal.textContent = this.player.score.toFixed(1);

        const megaReady = this.player.megaEnergy >= 40 || this.state === GAME_STATE.DEMO;
        if (this.ui.hudEnergyFill) {
            this.ui.hudEnergyFill.style.width = `${energyPct}%`;
        }
        if (this.ui.slotMega) {
            this.ui.slotMega.classList.toggle('ready', megaReady);
            this.ui.slotMega.classList.toggle('cooldown', !megaReady);
        }
        if (this.ui.touchMegaFill) {
            this.ui.touchMegaFill.style.width = `${this.state === GAME_STATE.DEMO ? 100 : energyPct}%`;
        }
        if (this.ui.touchBtnMega) {
            this.ui.touchBtnMega.classList.toggle('ready', megaReady);
            this.ui.touchBtnMega.classList.toggle('cooldown', !megaReady);
        }

        const fReady = this.player.frisbeeCooldown <= 0 || this.state === GAME_STATE.DEMO;
        if (this.ui.hudFrisbeeFill) {
            this.ui.hudFrisbeeFill.style.width = `${frisbeeReady}%`;
        }
        if (this.ui.slotFrisbee) {
            this.ui.slotFrisbee.classList.toggle('ready', fReady);
            this.ui.slotFrisbee.classList.toggle('cooldown', !fReady);
        }
        if (this.ui.touchFrisbeeFill) {
            this.ui.touchFrisbeeFill.style.width = `${this.state === GAME_STATE.DEMO ? 100 : frisbeeReady}%`;
        }
        if (this.ui.touchBtnFrisbee) {
            this.ui.touchBtnFrisbee.classList.toggle('ready', fReady);
            this.ui.touchBtnFrisbee.classList.toggle('cooldown', !fReady);
        }

        const shieldReady = this.player.blockCooldown <= 0
            ? 100
            : Math.max(0, 100 - (this.player.blockCooldown / this.player.maxBlockCooldown) * 100);
        const sReady = this.player.blockCooldown <= 0 || this.state === GAME_STATE.DEMO;
        if (this.ui.hudShieldFill) {
            this.ui.hudShieldFill.style.width = `${shieldReady}%`;
        }
        if (this.ui.slotShield) {
            this.ui.slotShield.classList.toggle('ready', sReady);
            this.ui.slotShield.classList.toggle('cooldown', !sReady);
        }
        if (this.ui.touchShieldFill) {
            this.ui.touchShieldFill.style.width = `${this.state === GAME_STATE.DEMO ? 100 : shieldReady}%`;
        }
        if (this.ui.touchBtnBlock) {
            this.ui.touchBtnBlock.classList.toggle('ready', sReady);
            this.ui.touchBtnBlock.classList.toggle('cooldown', !sReady);
        }

        const gesetzReady = this.player.lawBookCooldown <= 0
            ? 100
            : Math.max(0, 100 - (this.player.lawBookCooldown / this.player.maxLawBookCooldown) * 100);
        const gReady = this.player.lawBookCooldown <= 0;
        if (this.ui.hudGesetzFill) {
            this.ui.hudGesetzFill.style.width = `${gesetzReady}%`;
        }
        if (this.ui.slotGesetz) {
            this.ui.slotGesetz.classList.toggle('ready', gReady);
            this.ui.slotGesetz.classList.toggle('cooldown', !gReady);
        }
        if (this.ui.touchGesetzFill) {
            this.ui.touchGesetzFill.style.width = `${gesetzReady}%`;
        }
        if (this.ui.touchBtnAttack) {
            this.ui.touchBtnAttack.classList.toggle('ready', gReady);
            this.ui.touchBtnAttack.classList.toggle('cooldown', !gReady);
        }
    }

    updateBossHUD() {
        if (!this.boss || (this.state !== GAME_STATE.PRE_BOSS_WALK && this.state !== GAME_STATE.PRE_BOSS_DIALOGUE && this.state !== GAME_STATE.BOSS_FIGHT)) {
            this.ui.bossHudBanner.classList.add('hidden');
            return;
        }
        this.ui.bossHudBanner.classList.remove('hidden');
        this.ui.bossHudAvatar.src = this.boss.avatar;
        const prefix = this.boss.isWaveEnemy
            ? `🌊 WELLE ${this.currentWaveIndex + 1}/${(this.level.waves && this.level.waves.length) || 3}: `
            : (this.boss.isStageVanguard
                ? '🛡️ STAGE 1 VORHUT: '
                : (this.boss.isMiniBoss ? '⚡ MINI-BOSS: ' : ''));
        this.ui.bossHudName.textContent = prefix + this.boss.name.toUpperCase();
        this.ui.bossHudHpText.textContent = `${Math.max(0, Math.round(this.boss.hp))} / ${this.boss.maxHp} HP`;
        this.ui.bossHudFill.style.width = `${Math.max(0, (this.boss.hp / this.boss.maxHp) * 100)}%`;

        if (this.duoPartner) {
            this.ui.bossPartnerRow.classList.remove('hidden');
            this.ui.bossPartnerAvatar.classList.remove('hidden');
            this.ui.bossPartnerAvatar.src = this.duoPartner.avatar || 'assets/sprites/adam_avatar.png';
            this.ui.bossPartnerName.textContent = (this.duoPartner.name || 'PARTNER').toUpperCase();
            this.ui.bossPartnerHpText.textContent = `${Math.max(0, Math.round(this.duoPartner.hp))} HP`;
            this.ui.bossPartnerFill.style.width = `${Math.max(0, (this.duoPartner.hp / this.duoPartner.maxHp) * 100)}%`;
        } else {
            this.ui.bossPartnerRow.classList.add('hidden');
            this.ui.bossPartnerAvatar.classList.add('hidden');
        }
    }

    triggerLevelWin() {
        this.clearFrisbeeTimers();
        this.isPaused = false;
        this.state = GAME_STATE.LEVEL_WIN;
        if (this.ui.screenPause) this.ui.screenPause.classList.add('hidden');
        if (this.ui.btnPauseToggle) this.ui.btnPauseToggle.textContent = '⏸';
        this.updateTouchControlsVisibility();
        this.updateComboAndPowerHUD();
        this.updateMissionPill();
        this.ui.bossHudBanner.classList.add('hidden');

        this.saveLevelProgress(this.level.id, this.player.score, this.elapsedSeconds, this.maxCombo);

        this.ui.winGrade.textContent = this.player.score.toFixed(1);
        const hpRatio = Math.max(0, Math.min(100, (this.player.hp / Math.max(1, this.player.maxHp || 150)) * 100));
        this.ui.winHp.textContent = `${Math.round(hpRatio)}%`;
        if (this.ui.winTime) this.ui.winTime.textContent = this.formatTime(this.elapsedSeconds);
        if (this.ui.winCombo) this.ui.winCombo.textContent = `${this.maxCombo}×`;
        if (this.ui.winDesc) {
            if (this.level.hasBoss === false) {
                this.ui.winDesc.textContent = `Pünktlich durchs GIBB-Tor im ${this.level.yearText} (${this.timeRemaining.toFixed(1)}s Restzeit)! Keine Verspätung!`;
            } else if (this.level.mode === 'wave_rush') {
                this.ui.winDesc.textContent = `Alle ${(this.level.waves && this.level.waves.length) || 3} Rivalen-Wellen im ${this.level.yearText} komplett dominiert!`;
            } else {
                this.ui.winDesc.textContent = this.player.score >= 5.8
                    ? `Bestnote im ${this.level.yearText}! ${this.level.bossName} hat keine Chance gegen Thenerean!`
                    : `Stark durchgekämpft gegen ${this.level.bossName}! Das GIBB-Lehrjahr ist bestanden!`;
            }
        }
        if (this.ui.btnNextLvl) {
            this.ui.btnNextLvl.textContent = (this.currentLevelIndex + 1 < LEVELS_CONFIG.length)
                ? 'NÄCHSTES LEHRJAHR ANTRETEN ▶'
                : '🏆 EFZ-DIPLOM ABHOLEN ▶';
        }

        this.ui.screenWin.classList.remove('hidden');
        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playClip('thenerean_stah');
    }

    triggerGameOver() {
        this.clearFrisbeeTimers();
        this.isPaused = false;
        this.state = GAME_STATE.GAME_OVER;
        if (this.ui.screenPause) this.ui.screenPause.classList.add('hidden');
        if (this.ui.btnPauseToggle) this.ui.btnPauseToggle.textContent = '⏸';
        this.updateTouchControlsVisibility();
        this.updateComboAndPowerHUD();
        this.updateMissionPill();
        this.ui.bossHudBanner.classList.add('hidden');

        const reason = this.lastDamageReason;
        let badge = 'DISZIPLINAR-STOPP';
        let title = '💀 VERWARNUNG ERHALTEN!';
        let desc = 'Monika Schneider hat dich wegen Verspätung nach Hause geschickt!';
        let quote = '"Pünktlichkeit ist oberste Gebot! Ohne Disziplin lernt man nicht!"';

        if (reason === 'timeout') {
            badge = 'VERSPÄTUNG!';
            title = '⏰ SCHULGLOCKE HAT GELÄUTET!';
            desc = 'Monika Schneider hat das Klassenzimmer abgesperrt! Sammle Kaffee (+2.5s) und nutze die Sprint-Felder!';
            quote = '"2.54 Sekunden zu spät — Pünktlichkeit ist oberste Gebot!"';
        } else if (reason === 'chaser') {
            badge = 'VERFOLGUNGS-CRASH';
            title = '🛺 VOM TUKTUK EINGEHOLT!';
            desc = 'Das rasende TukTuk hat dich im Serverraum eingeholt! Bleib mit Sprint & [D] in Bewegung bis zum Not-Aus!';
            quote = '"Verdammti Maschine! Wenn du bremst, überrollt dich das TukTuk!"';
        } else if (reason === 'floor_zone') {
            badge = 'PRÜFUNGS-SPERRFRIST';
            title = '⚡ BODEN-SPERRZONE GETROFFEN!';
            desc = 'Wenn der Boden gelb-blau warnt (⬆ AUF PLATTFORM!), springe schnell auf die Podeste oder den Lift!';
            quote = '"In der Halle gilt: Plattformen nutzen statt auf dem Boden stehen!"';
        } else if (reason === 'lava') {
            badge = 'PARCOURS-UNFALL';
            title = '🔥 IN DIE LAVA GEFALLEN!';
            desc = `Im ${this.level.yearText} war die Lücke zu heiss! Nutze Sprint (S) + Plattformen für sichere Sprünge.`;
            quote = '"Wer beim GIBB-Parcours zögert, landet in der Gefahrenzone!"';
        } else if (reason === 'energy_can' || reason === 'laptop') {
            badge = 'RIVALEN-DUELL';
            title = '⚡ VOM GIBB SCHÜLER GESTOPPT!';
            desc = 'Der Average GIBB Schüler hat dich mit Energy-Dosen & Laptops eingedeckt! Blocke mit [R] oder spring auf Plattformen!';
            quote = '"Erst mal Energy exen — an mir chunnsch nöd verbi!"';
        } else if (reason === 'tuktuk_charge' || reason === 'fire' || reason === 'broken_cable') {
            badge = 'HARDWARE-CRASH';
            title = '🛺 VOM TUKTUK ÜBERFAHREN!';
            desc = 'Die überhitzte RTX-GPU hat zu stark zugeschlagen! Springe über das TukTuk und meide die Flammen!';
            quote = '"Verdammti Maschine! Mini Grafikkarte brennt scho wieder!"';
        } else if (reason === 'frisbee' || reason === 'basketball' || reason === 'whistle' || reason === 'whistle_wave') {
            badge = 'SPORTHALLEN-K.O.';
            title = '🥏 VON HERR ADAM ABGEWORFEN!';
            desc = 'Herr Adams Sportgeräte waren schneller! Ducke dich bei hohen Würfen [CTRL] und kontere mit Perfekt-Block [R]!';
            quote = '"Silvankumar, ist der Thenerean da?! Da hast du 20 Frisbees!"';
        }

        if (this.ui.loseBadge) this.ui.loseBadge.textContent = badge;
        if (this.ui.loseTitle) this.ui.loseTitle.textContent = title;
        if (this.ui.loseReason) this.ui.loseReason.textContent = desc;
        if (this.ui.loseQuote) this.ui.loseQuote.textContent = quote;

        this.ui.screenLose.classList.remove('hidden');
        window.soundManager.setMusicQuietMode(false);
        let loseClip = 'monika_zspaet';
        if (reason === 'frisbee' || reason === 'basketball' || reason === 'whistle' || reason === 'whistle_wave') {
            loseClip = 'adam_strafe_verpasst';
        } else if (reason === 'energy_can' || reason === 'laptop') {
            loseClip = 'student_cringe_king';
        } else if (reason === 'tuktuk_charge' || reason === 'fire' || reason === 'broken_cable') {
            loseClip = 'tuktuk_taeschfresser_gpu';
        } else if (reason === 'floor_zone') {
            loseClip = 'monika_abu_eingesperrt';
        }
        window.soundManager.playClip(loseClip);
    }

    triggerVictory() {
        this.clearFrisbeeTimers();
        this.isPaused = false;
        this.state = GAME_STATE.VICTORY;
        if (this.ui.screenPause) this.ui.screenPause.classList.add('hidden');
        if (this.ui.btnPauseToggle) this.ui.btnPauseToggle.textContent = '⏸';
        this.hideGameplayHUDs();
        this.ui.screenVictory.classList.remove('hidden');
        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playMusic('assets/music/Crimson_Shell.mp3');
        window.soundManager.playClip('thenerean_heilig_gral');
    }

    checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    // =====================================================================
    // RENDER ENGINE (3-LAYER PARALLAX, SPRITE ANIMATION & COMIC VFX)
    // =====================================================================
    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        if (this.screenShake > 0) {
            const rx = (Math.random() - 0.5) * this.screenShake;
            const ry = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(rx, ry);
        }

        // Layer 1 & 2: Seamless Parallax Stage Artwork + Atmospheric Beams
        this.drawParallaxStage();

        // Menu Preview stops after scenic stage + subtle vignette
        if (this.state === GAME_STATE.MENU || this.state === GAME_STATE.OPENING || this.state === GAME_STATE.INTRO) {
            ctx.restore();
            return;
        }

        // Layer 3: Foreground Ground Accent, Lava Pits, Boost Pads & Elevated Platforms
        this.drawGroundOverlay();
        const inBossPhase = this.state === GAME_STATE.PRE_BOSS_WALK ||
            this.state === GAME_STATE.PRE_BOSS_DIALOGUE ||
            this.state === GAME_STATE.BOSS_FIGHT;
        if (this.state === GAME_STATE.RUNNING) {
            this.drawLavaPits();
            this.drawBoostPads();
            this.drawPlatforms();
            this.drawGoalArch();
        } else if (inBossPhase) {
            this.drawPlatforms();
            this.drawArenaSwitch();
        }
        this.drawHazards();

        // Collectibles, Obstacles & Mode Targets
        if (this.state === GAME_STATE.RUNNING) {
            this.drawObstacles();
            this.drawCollectibles();
            this.drawTargets();
        } else if (this.state === GAME_STATE.DEMO) {
            this.drawObstacles();
            this.drawCollectibles();
        }

        // Expanding Shockwave Rings
        this.drawShockwaves();

        // Chasing TukTuk behind player during escape run
        if (this.chaser && this.state === GAME_STATE.RUNNING) {
            this.drawChaser();
        }

        // Bosses (drawn behind player projectiles so projectiles visibly impact them)
        if (
            this.boss &&
            (this.state === GAME_STATE.PRE_BOSS_WALK ||
             this.state === GAME_STATE.PRE_BOSS_DIALOGUE ||
             this.state === GAME_STATE.BOSS_FIGHT ||
             this.state === GAME_STATE.DEMO)
        ) {
            if (this.boss.hp > 0) this.drawBoss(this.boss);
            if (this.duoPartner && this.duoPartner.hp > 0) this.drawBoss(this.duoPartner);
        }

        // Player Character Sprite
        this.drawPlayer();
        this.drawPlayerStatus();

        // Flying Projectiles + Trails
        this.drawProjectiles();

        // Particle Bursts
        this.drawParticles();

        // Outlined Comic Floating Numbers
        this.drawFloatingTexts();

        // Radial Comic Speedlines on Mega-Shock / Fight Start
        if (this.radialFlashTimer > 0) {
            this.drawComicSpeedLines();
        }

        ctx.restore();

        // Screen-Edge Red Damage Vignette on Player Hit
        if (this.damageVignetteTimer > 0) {
            const alpha = Math.min(0.45, (this.damageVignetteTimer / 16) * 0.42);
            const vGrad = ctx.createRadialGradient(
                canvas.width * 0.5, canvas.height * 0.5, Math.min(canvas.width, canvas.height) * 0.28,
                canvas.width * 0.5, canvas.height * 0.5, Math.max(canvas.width, canvas.height) * 0.72
            );
            vGrad.addColorStop(0, 'rgba(255, 56, 56, 0)');
            vGrad.addColorStop(1, `rgba(255, 45, 65, ${alpha})`);
            ctx.fillStyle = vGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    getStageImageKey() {
        if (this.state === GAME_STATE.MENU) {
            return 'bg_lobby';
        }
        if (this.state === GAME_STATE.OPENING) {
            return 'bg_intro_stage';
        }
        if (this.state === GAME_STATE.INTRO) {
            return 'bg_story_intro_crazy';
        }
        const bg = this.level.bgType;
        if (bg === 'classroom') return 'bg_classroom';
        if (bg === 'gym_hallway') return 'bg_gym_hallway';
        if (bg === 'gym_turnhalle') return 'bg_gym_turnhalle';
        if (bg === 'server_room') return 'bg_server_srilanka';
        if (bg === 'abu_room') return 'bg_abu_room';
        if (bg === 'mensa_kiosk') return 'bg_mensa_kiosk';
        if (bg === 'srilanka_highway') return 'bg_srilanka_highway';
        if (bg === 'cyber_bunker') return 'bg_cyber_bunker';
        if (bg === 'exam_auditorium') return 'bg_exam_auditorium';
        return 'bg_gibb_entrance';
    }

    drawParallaxStage() {
        const bgKey = this.getStageImageKey();
        const bgImg = images[bgKey];
        const groundY = this.player.groundY;

        if (bgImg && bgImg.complete && bgImg.naturalWidth > 0 && this.state === GAME_STATE.MENU) {
            const scale = Math.max((canvas.width * 1.06) / bgImg.naturalWidth, (canvas.height * 1.06) / bgImg.naturalHeight);
            const drawW = bgImg.naturalWidth * scale;
            const drawH = bgImg.naturalHeight * scale;
            const maxSway = Math.max(0, (drawW - canvas.width) * 0.45);
            const drawX = -(drawW - canvas.width) * 0.5 + Math.sin(this.animClock * 0.35) * maxSway;
            const drawY = Math.min(0, Math.max(canvas.height - drawH, groundY - drawH * 0.74));
            ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
        } else if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
            // Scale illustration so full image height matches viewport height (aligning floor at 0.74!)
            const scale = Math.max(canvas.height / bgImg.naturalHeight, canvas.width / (bgImg.naturalWidth * 1.15));
            const tileW = bgImg.naturalWidth * scale;
            const tileH = bgImg.naturalHeight * scale;
            // Align horizon line (~74% of source art) cleanly with player.groundY
            const drawY = groundY - tileH * 0.74;

            const scrollDist = (this.state === GAME_STATE.OPENING)
                ? this.menuPan
                : this.worldDistance * 0.35;

            const rawOffset = scrollDist % tileW;
            let startX = -rawOffset;

            // Draw non-mirrored seamless tiles so wall jokes & cyber signs stay forward-readable
            while (startX < canvas.width + tileW) {
                if (startX + tileW > -10) {
                    ctx.drawImage(bgImg, startX, drawY, tileW + 2, tileH);
                    if (startX > 0 && startX < canvas.width) {
                        const seamGrad = ctx.createLinearGradient(startX - 18, 0, startX + 18, 0);
                        seamGrad.addColorStop(0, 'rgba(8, 12, 22, 0)');
                        seamGrad.addColorStop(0.5, 'rgba(8, 12, 22, 0.38)');
                        seamGrad.addColorStop(1, 'rgba(8, 12, 22, 0)');
                        ctx.fillStyle = seamGrad;
                        ctx.fillRect(startX - 18, 0, 36, groundY + 12);
                    }
                }
                startX += tileW;
            }
        } else {
            // Clean dark gradient before image decode completes
            const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
            g.addColorStop(0, '#101524');
            g.addColorStop(1, '#1e273d');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Subtle atmospheric mood overlay & light rays
        this.drawAtmosphericEffects(groundY);
    }

    drawAtmosphericEffects(groundY) {
        const style = (this.level && this.level.ambientStyle) || 'daylight';

        // Moving spotlights in Auditorium or Gym
        if (style === 'finale' || style === 'gym') {
            ctx.save();
            const beamCount = style === 'finale' ? 3 : 2;
            for (let b = 0; b < beamCount; b++) {
                const baseX = canvas.width * (0.22 + b * 0.28);
                const sway = Math.sin(this.animClock * (1.2 + b * 0.35) + b * 2) * 140;
                const grad = ctx.createLinearGradient(baseX, 0, baseX + sway, groundY + 80);
                grad.addColorStop(0, style === 'finale' ? 'rgba(255, 220, 90, 0.14)' : 'rgba(255, 255, 255, 0.08)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(baseX - 30, 0);
                ctx.lineTo(baseX + 30, 0);
                ctx.lineTo(baseX + sway + 170, groundY + 80);
                ctx.lineTo(baseX + sway - 170, groundY + 80);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }

        // Drifting dust motes / confetti / cyber sparks
        ctx.save();
        for (const p of this.ambientParticles) {
            p.x = (p.x + p.speedX + 1) % 1;
            p.y = (p.y + p.speedY + 0.78) % 0.78;
            const px = p.x * canvas.width;
            const py = p.y * canvas.height;
            const twinkle = 0.65 + 0.35 * Math.sin(this.animClock * 3 + p.phase);

            if (style === 'server') {
                ctx.fillStyle = p.phase > 3.1 ? `rgba(0, 210, 211, ${p.alpha * twinkle})` : `rgba(255, 165, 2, ${p.alpha * twinkle})`;
            } else if (style === 'finale') {
                const colors = ['#ffd32a', '#ff4757', '#2ed573', '#00d2d3'];
                ctx.fillStyle = colors[Math.floor(p.phase) % colors.length];
                ctx.globalAlpha = p.alpha * 0.7;
            } else {
                ctx.fillStyle = `rgba(255, 250, 230, ${p.alpha * 0.45 * twinkle})`;
            }
            ctx.beginPath();
            ctx.arc(px, py, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawGroundOverlay() {
        const groundY = this.player.groundY;
        const accent = (this.level && this.level.accentColor) || '#2ed573';

        // Soft feathered ground vignette so characters and items pop off every stage floor naturally
        const grad = ctx.createLinearGradient(0, groundY - 12, 0, canvas.height);
        grad.addColorStop(0.0, 'rgba(8, 10, 18, 0.0)');
        grad.addColorStop(0.18, 'rgba(8, 10, 18, 0.24)');
        grad.addColorStop(1.0, 'rgba(5, 7, 14, 0.54)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, groundY - 12, canvas.width, canvas.height - groundY + 12);

        // Subtle atmospheric horizon tint rather than a harsh wireframe stripe
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.24;
        ctx.beginPath();
        ctx.moveTo(0, groundY + 1);
        ctx.lineTo(canvas.width, groundY + 1);
        ctx.stroke();
        ctx.restore();

        // Subtle perspective floor markers on lower floor strip so running speed reads clearly
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        ctx.lineWidth = 2;
        const step = 120;
        const offset = this.worldDistance % step;
        for (let x = -offset; x < canvas.width + step; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, groundY + 18);
            ctx.lineTo(x - 32, canvas.height);
            ctx.stroke();
        }
    }

    // Foot-anchored sprite drawing helper preserving natural aspect ratio + squash/stretch + crisp white hit-flash
    drawCharacterSprite(img, footCenterX, footY, targetHeight, facing = 1, hitFlash = 0, scaleX = 1, scaleY = 1, tiltRad = 0) {
        if (!img || !img.complete || img.naturalWidth === 0) return null;

        const aspect = img.naturalWidth / img.naturalHeight;
        const drawH = targetHeight * scaleY;
        const drawW = targetHeight * aspect * scaleX;

        ctx.save();
        ctx.translate(footCenterX, footY);
        if (tiltRad !== 0) ctx.rotate(tiltRad);
        if (facing < 0) ctx.scale(-1, 1);

        ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);

        // Crisp white hit-flash overlay via cached scratch canvas
        if (hitFlash > 0 && hitFlash % 3 !== 0) {
            const cw = Math.max(1, Math.round(drawW));
            const ch = Math.max(1, Math.round(drawH));
            if (flashCanvas.width !== cw || flashCanvas.height !== ch) {
                flashCanvas.width = cw;
                flashCanvas.height = ch;
            }
            flashCtx.globalCompositeOperation = 'source-over';
            flashCtx.clearRect(0, 0, cw, ch);
            flashCtx.drawImage(img, 0, 0, cw, ch);
            flashCtx.globalCompositeOperation = 'source-in';
            flashCtx.fillStyle = 'rgba(255, 255, 255, 0.78)';
            flashCtx.fillRect(0, 0, cw, ch);

            ctx.drawImage(flashCanvas, -drawW / 2, -drawH, drawW, drawH);
        }

        ctx.restore();
        return { w: drawW, h: drawH };
    }

    drawPlayer() {
        if (this.player.invulnerableTime % 5 > 2) return;

        const p = this.player;
        const footX = p.x + p.w / 2;
        const footY = p.y + p.h;

        // Ground Drop Shadow (shrinks slightly when jumping high)
        const heightAboveGround = Math.max(0, p.groundY - footY);
        const shadowScale = Math.max(0.42, 1 - heightAboveGround / 280);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(footX, p.groundY + 3, (p.w * 0.6) * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Animation State Selection
        const isMoving = Math.abs(p.vx) > 0.35;
        let poseKey = 'thenerean_idle';
        let sx = 1.0, sy = 1.0, tilt = 0;

        if (p.isBlocking) {
            poseKey = 'thenerean_block';
            sx = 1.05;
            sy = 0.98;
            tilt = 0.03 * p.facing;
        } else if (p.isDucking && p.isGrounded) {
            poseKey = 'thenerean_duck';
            sx = 1.05;
            sy = 0.95;
        } else if (p.attackAnimTimer > 0) {
            poseKey = 'thenerean_attack';
            sx = 1.04;
            sy = 0.98;
            tilt = 0.04 * p.facing;
        } else if (!p.isGrounded) {
            poseKey = 'thenerean_jump';
            sx = 0.96;
            sy = 1.04;
        } else if (isMoving) {
            // Energetic 2-frame stride between sprint & stance with smooth bob
            const stride = Math.sin(this.animClock * 16);
            poseKey = stride > -0.25 ? 'thenerean_run' : 'thenerean_idle';
            sy = 1.0 + 0.04 * Math.abs(stride);
            sx = 1.0 - 0.02 * Math.abs(stride);
            tilt = 0.045 * p.facing;
        } else {
            const breathe = Math.sin(this.animClock * 4.2);
            sy = 1.0 + 0.022 * breathe;
            sx = 1.0 - 0.014 * breathe;
        }

        // Energy-Rush Halo behind Thenerean
        if (p.powerTimer > 0) {
            ctx.save();
            const pulse = 1.0 + Math.sin(this.animClock * 14) * 0.08;
            const cy = footY - p.h * 0.48;
            const r = p.h * 0.72 * pulse;
            const pGrad = ctx.createRadialGradient(footX, cy, r * 0.15, footX, cy, r);
            pGrad.addColorStop(0, 'rgba(0, 210, 211, 0.42)');
            pGrad.addColorStop(0.55, 'rgba(255, 211, 42, 0.24)');
            pGrad.addColorStop(1, 'rgba(255, 211, 42, 0)');
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(footX, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const sprite = images[poseKey] || images.thenerean_idle || images.thenerean_hero;
        this.drawCharacterSprite(sprite, footX, footY, p.h, p.facing, p.hitFlash, sx, sy, tilt);

        if (p.isBlocking) {
            this.drawShieldAura(footX, footY, p.h, p.facing);
        }

        // Name Plate pill above head
        if (p.sprintTimer > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 210, 211, 0.75)';
            ctx.lineWidth = 3;
            for (let s = 0; s < 3; s++) {
                const sy = p.y + p.h * (0.28 + s * 0.24);
                ctx.beginPath();
                ctx.moveTo(p.x - 10 - s * 12, sy);
                ctx.lineTo(p.x + 12, sy);
                ctx.stroke();
            }
            ctx.restore();
        }

        const powerTag = p.powerTimer > 0 ? ' [⚡1.5×]' : '';
        const baseLabel = p.isBlocking
            ? "Thenerean [BLOCK]"
            : (p.isDucking ? "Thenerean [DUCK]" : (p.sprintTimer > 0 ? "Thenerean ⚡ SPRINT" : "Thenerean"));
        const nameLabel = baseLabel + powerTag;
        const nameY = (p.isDucking && p.isGrounded) ? (p.y + p.h * 0.38) : (p.y - 14);
        this.drawNamePill(nameLabel, footX, nameY, p.powerTimer > 0 ? '#00d2d3' : '#ffd32a');
    }

    drawShieldAura(footX, footY, h, facing) {
        ctx.save();
        const shieldX = footX + facing * (h * 0.28);
        const shieldY = footY - h * 0.5;
        const radius = h * 0.54;

        const pulse = 1.0 + Math.sin(this.animClock * 28) * 0.06;

        // Outer glow
        const grad = ctx.createRadialGradient(shieldX, shieldY, radius * 0.2, shieldX, shieldY, radius * 1.3);
        grad.addColorStop(0, 'rgba(0, 210, 211, 0.45)');
        grad.addColorStop(0.65, 'rgba(0, 210, 211, 0.18)');
        grad.addColorStop(1, 'rgba(255, 211, 42, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(shieldX, shieldY, radius * 1.25 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Energy Barrier Arc
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 4.5;
        ctx.shadowColor = '#00d2d3';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        const startAngle = facing > 0 ? -Math.PI * 0.38 : Math.PI * 0.62;
        const endAngle = facing > 0 ? Math.PI * 0.38 : Math.PI * 1.38;
        ctx.arc(shieldX, shieldY, radius * 0.9 * pulse, startAngle, endAngle);
        ctx.stroke();

        // Inner golden reinforcement line
        ctx.strokeStyle = '#ffd32a';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffd32a';
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(shieldX, shieldY, radius * 0.76 * pulse, startAngle + 0.14, endAngle - 0.14);
        ctx.stroke();

        ctx.restore();
    }

    drawBoss(bossEntity) {
        const isStudent = bossEntity.type === 'gibb_student';
        const isAdam = !isStudent && (bossEntity.name.includes("Adam") || bossEntity.type === 'adam' || bossEntity.type === 'adam_miniboss' || bossEntity.isDummy);
        const isTukTuk = this.isTukTukType(bossEntity.type);
        const ai = bossEntity.ai;
        const telegraphing = !!(ai && ai.telegraph);
        const p2Thresh = (this.level && this.level.phase2Threshold) || 0.5;

        const footX = bossEntity.x + bossEntity.w / 2;
        const footY = bossEntity.y + bossEntity.h;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
        ctx.beginPath();
        ctx.ellipse(footX, this.player.groundY + 4, bossEntity.w * 0.56, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pose & Facing Selection (All extracted boss sprites naturally face LEFT!)
        let spriteKey;
        let sx = 1.0, sy = 1.0, tilt = 0;

        if (isStudent) {
            if (bossEntity.attackAnimTimer > 0) {
                spriteKey = 'gibb_student_attack';
            } else if (telegraphing) {
                spriteKey = 'gibb_student_windup';
                sx = 1.03;
            } else {
                const step = Math.sin(this.animClock * 11);
                spriteKey = step > -0.1 ? 'gibb_student_walk' : 'gibb_student_idle';
                sy = 1.0 + 0.025 * Math.abs(step);
            }
        } else if (isTukTuk) {
            const isRage = bossEntity.attackAnimTimer > 0 || bossEntity.hp < bossEntity.maxHp * p2Thresh || telegraphing || !!(ai && ai.charge);
            spriteKey = bossEntity.type === 'tuktuk_dual_gpu'
                ? (isRage ? 'tuktuk_dual_rage' : 'tuktuk_dual_idle')
                : (isRage ? 'tuktuk_rage' : 'tuktuk_idle');
            const rumble = Math.sin(this.animClock * (isRage ? 28 : 14));
            sy = 1.0 + 0.02 * rumble;
            tilt = isRage ? -0.02 * rumble : 0;
        } else if (isAdam) {
            if (bossEntity.attackAnimTimer > 0) {
                spriteKey = 'adam_throw';
            } else if (telegraphing || (!ai && bossEntity.attackTimer > 0 && bossEntity.attackTimer <= 18)) {
                spriteKey = 'adam_windup';
                sx = 1.03;
            } else {
                const step = Math.sin(this.animClock * 11);
                spriteKey = step > 0 ? 'adam_run' : 'adam_idle';
                sy = 1.0 + 0.025 * Math.abs(step);
            }
        } else {
            // Monika Schneider
            if (bossEntity.attackAnimTimer > 0) {
                spriteKey = 'monika_attack';
            } else if (bossEntity.banterAnimTimer > 0 || telegraphing) {
                spriteKey = 'monika_point';
            } else {
                const walkCycle = Math.sin(this.animClock * 9);
                spriteKey = walkCycle > -0.3 ? 'monika_walk' : 'monika_idle';
                sy = 1.0 + 0.02 * Math.abs(walkCycle);
            }
        }

        // Extracted Monika, Adam, and TukTuk sprites naturally face LEFT (facing = -1).
        // So flip horizontally only if facing becomes +1 (player jumped behind boss).
        const spriteFlip = bossEntity.facing > 0 ? -1 : 1;
        const img = images[spriteKey] || images.monika_idle;
        if (ai && ai.stun > 0) tilt = Math.sin(this.animClock * 7) * 0.08;
        this.drawBossRageAura(bossEntity, footX, footY);
        this.drawCharacterSprite(img, footX, footY, bossEntity.h, spriteFlip, bossEntity.hitFlash, sx, sy, tilt);

        // Crisp Floating Overhead HP Bar
        const barW = bossEntity.isDummy ? 175 : 142;
        const barH = 11;
        const barX = footX - barW / 2;
        const barY = bossEntity.y - 24;

        ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 6);
        ctx.fill();

        const ratio = Math.max(0, Math.min(1, bossEntity.hp / bossEntity.maxHp));
        const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        if (bossEntity.isDummy) {
            fillGrad.addColorStop(0, '#f39c12');
            fillGrad.addColorStop(1, '#ffd32a');
        } else {
            fillGrad.addColorStop(0, '#ff3838');
            fillGrad.addColorStop(1, '#ff9f1a');
        }
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, Math.max(0, barW * ratio), barH, 4);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.stroke();

        // Phase 2 threshold marker
        if (!bossEntity.isDummy) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(barX + barW * p2Thresh - 1, barY - 2, 2, barH + 4);
        }

        const shortName = bossEntity.name.replace(/\s*\(.*?\)/g, '');
        const label = bossEntity.isDummy ? `DUMMY (HP: ${bossEntity.hp})` : shortName;
        this.drawNamePill(label, footX, barY - 8, '#ffffff');
        this.drawBossStatus(bossEntity, footX, barY);
    }

    drawNamePill(text, cx, y, color) {
        ctx.save();
        ctx.font = '900 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(8, 10, 18, 0.92)';
        ctx.strokeText(text, cx, y);
        ctx.fillStyle = color;
        ctx.fillText(text, cx, y);
        ctx.restore();
    }

    getObstacleSpriteKey(type) {
        switch (type) {
            case 'frisbee': return 'frisbee';
            case 'basketball': return 'basketball';
            case 'warning_letter': return 'red_card';
            case 'whistle': return 'whistle';
            case 'traffic_cone': return 'traffic_cone';
            case 'broken_cable': return 'broken_cable';
            case 'server_stack': return 'server_stack';
            case 'clock': return 'item_clock';
            default: return 'traffic_cone';
        }
    }

    drawLavaPits() {
        const gy = this.player.groundY;
        const h = canvas.height - gy + 12;
        for (const pit of this.lavaPits) {
            const sx = pit.x - this.worldDistance;
            if (sx > canvas.width + 60 || sx + pit.w < -60) continue;

            ctx.save();
            const isChasm = pit.theme === 'chasm';
            const grad = ctx.createLinearGradient(0, gy - 6, 0, canvas.height);
            if (isChasm) {
                grad.addColorStop(0, '#120814');
                grad.addColorStop(0.55, '#2b0b18');
                grad.addColorStop(1, '#ff3838');
            } else {
                grad.addColorStop(0, '#ffd32a');
                grad.addColorStop(0.28, '#ff6348');
                grad.addColorStop(1, '#8c1010');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(sx, gy - 2, pit.w, h);

            // Animated bubbling surface wave
            ctx.fillStyle = isChasm ? 'rgba(255, 71, 87, 0.75)' : 'rgba(255, 224, 90, 0.92)';
            ctx.beginPath();
            ctx.moveTo(sx, gy + 18);
            for (let dx = 0; dx <= pit.w; dx += 18) {
                const wave = Math.sin(this.animClock * 7 + (pit.x + dx) * 0.08) * 5;
                ctx.lineTo(sx + dx, gy + wave);
            }
            ctx.lineTo(sx + pit.w, gy + 18);
            ctx.closePath();
            ctx.fill();

            // Inked hazard border lips
            ctx.fillStyle = '#ffd32a';
            ctx.strokeStyle = '#11141e';
            ctx.lineWidth = 3;
            ctx.fillRect(sx - 8, gy - 6, 12, 24);
            ctx.strokeRect(sx - 8, gy - 6, 12, 24);
            ctx.fillRect(sx + pit.w - 4, gy - 6, 12, 24);
            ctx.strokeRect(sx + pit.w - 4, gy - 6, 12, 24);
            ctx.restore();
            this.drawNamePill(isChasm ? '⚠️ SPERRZONE!' : '🔥 LAVA! SPRINGEN!', sx + pit.w * 0.5, gy + 26, '#ffd32a');
        }
    }

    drawBoostPads() {
        const gy = this.player.groundY;
        for (const pad of this.boostPads) {
            const sx = pad.x - this.worldDistance;
            if (sx > canvas.width + 80 || sx + pad.w < -80) continue;
            ctx.save();
            const pulse = 0.75 + 0.25 * Math.sin(this.animClock * 10);
            ctx.fillStyle = `rgba(0, 210, 211, ${0.35 * pulse})`;
            ctx.strokeStyle = '#00d2d3';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(sx, gy - 10, pad.w, 12, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffd32a';
            ctx.font = '900 13px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ SPRINT >>>', sx + pad.w * 0.5, gy - 16);
            ctx.restore();
        }
    }

    drawPlatforms() {
        const colors = {
            concrete:          { body: '#4b5563', top: '#9ca3af', edge: '#ffd32a' },
            desk:              { body: '#8b5a2b', top: '#d49a58', edge: '#4b65ff' },
            abu_desk:          { body: '#7c4d25', top: '#d9a462', edge: '#2ed573' },
            mensa_tile:        { body: '#374151', top: '#f59e0b', edge: '#ffd32a' },
            highway_deck:      { body: '#2c303a', top: '#ff6348', edge: '#00d2d3' },
            gym_box:           { body: '#b46528', top: '#f59e0b', edge: '#ffffff' },
            server_rack:       { body: '#1e293b', top: '#0ea5e9', edge: '#00d2d3' },
            auditorium_bridge: { body: '#27272a', top: '#eab308', edge: '#ff4757' }
        };
        const inBossPhase = this.state === GAME_STATE.PRE_BOSS_WALK ||
            this.state === GAME_STATE.PRE_BOSS_DIALOGUE ||
            this.state === GAME_STATE.BOSS_FIGHT;

        for (const plat of this.platforms) {
            if (inBossPhase ? !plat.isArena : plat.isArena) continue;
            const sx = plat.x - this.worldDistance;
            if (sx > canvas.width + 80 || sx + plat.w < -80) continue;
            const pal = colors[plat.style] || colors.concrete;
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
            ctx.beginPath();
            ctx.roundRect(sx + 4, plat.y + 6, plat.w, plat.h, 8);
            ctx.fill();
            ctx.fillStyle = pal.body;
            ctx.strokeStyle = plat.moveAxis ? '#00d2d3' : '#11141e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(sx, plat.y, plat.w, plat.h, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = pal.top;
            ctx.fillRect(sx + 6, plat.y + 3, plat.w - 12, 6);
            ctx.fillStyle = pal.edge;
            ctx.fillRect(sx + 10, plat.y + plat.h - 6, plat.w - 20, 3);

            // Visual indicator for moving platforms (x or y)
            if (plat.moveAxis) {
                ctx.fillStyle = '#00d2d3';
                const pulse = 0.75 + 0.25 * Math.sin(this.animClock * 9 + (plat.phase || 0));
                ctx.globalAlpha = pulse;
                ctx.beginPath();
                ctx.arc(sx + 14, plat.y + plat.h * 0.5, 4, 0, Math.PI * 2);
                ctx.arc(sx + plat.w - 14, plat.y + plat.h * 0.5, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    drawGoalArch() {
        if (!this.level || !this.level.targetDistance || this.level.targetDistance <= 0) return;
        const mode = this.level.mode || 'standard';
        if (mode !== 'time_attack' && mode !== 'tuktuk_chase_boss') return;

        const screenX = (this.level.targetDistance - this.worldDistance) + canvas.width * 0.35 + this.player.w;
        if (screenX < -120 || screenX > canvas.width + 140) return;

        const gy = this.player.groundY;
        const archW = 112;
        const archH = 190;
        const isNotAus = mode === 'tuktuk_chase_boss';
        const mainColor = isNotAus ? '#ff4757' : '#2ed573';
        const pulse = 0.78 + 0.22 * Math.sin(this.animClock * 8);

        ctx.save();
        // Arch pillars
        ctx.fillStyle = '#141928';
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 3;
        ctx.fillRect(screenX, gy - archH, 16, archH);
        ctx.strokeRect(screenX, gy - archH, 16, archH);
        ctx.fillRect(screenX + archW - 16, gy - archH, 16, archH);
        ctx.strokeRect(screenX + archW - 16, gy - archH, 16, archH);

        // Glowing top sign
        ctx.globalAlpha = pulse;
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.roundRect(screenX - 18, gy - archH - 34, archW + 36, 40, 10);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#080b12';
        ctx.font = '900 14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isNotAus ? '🔴 NOT-AUS!' : '🏁 GIBB TOR!', screenX + archW * 0.5, gy - archH - 14);
        ctx.restore();
    }

    drawTargets() {
        if (!this.targets || this.targets.length === 0) return;
        for (const tgt of this.targets) {
            if (tgt.hit) continue;
            const screenX = tgt.x - this.worldDistance;
            if (screenX < -80 || screenX > canvas.width + 80) continue;
            const ty = tgt.baseY + Math.sin(this.animClock * 4.2 + tgt.phase) * 6;
            const cx = screenX + tgt.w * 0.5;
            const cy = ty + tgt.h * 0.5;
            const r = tgt.w * 0.5;
            const pulse = 0.88 + 0.12 * Math.sin(this.animClock * 8 + tgt.phase);

            ctx.save();
            ctx.fillStyle = 'rgba(255, 211, 42, 0.22)';
            ctx.beginPath();
            ctx.arc(cx, cy, r * 1.32 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff3838';
            ctx.strokeStyle = '#ffd32a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.66, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff3838';
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.34, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffd32a';
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            this.drawNamePill('🎯 [E]', cx, ty - 10, '#ffd32a');
        }
    }

    drawChaser() {
        if (!this.chaser) return;
        const ch = this.chaser;
        const gy = this.player.groundY;
        const footX = ch.x + ch.w * 0.5;
        const shakeY = Math.sin(this.animClock * 28) * 2.2;
        const img = images.tuktuk_rage || images.tuktuk_idle;

        ctx.save();
        // Danger engine glow
        const glowGrad = ctx.createRadialGradient(footX, gy - ch.h * 0.4, 10, footX, gy - ch.h * 0.4, ch.h * 0.85);
        glowGrad.addColorStop(0, 'rgba(255, 71, 87, 0.38)');
        glowGrad.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(footX, gy - ch.h * 0.4, ch.h * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // TukTuk sprite faces left natively -> -1 flips it right to chase player
        this.drawCharacterSprite(img, footX, gy + shakeY, ch.h, -1, 0, 1.0, 1.0, -0.04);

        if (ch.warnTimer > 0) {
            this.drawNamePill('⚠️ FEUER-SCHUSS!', footX + 18, gy - ch.h - 14, '#ff4757');
        } else {
            this.drawNamePill('🛺 LAUF WEITER!', footX, gy - ch.h - 12, '#ffa502');
        }
    }

    drawArenaSwitch() {
        if (!this.arenaSwitch || !this.level || !this.level.arenaSwitch) return;
        const sw = this.arenaSwitch;
        const cfg = this.level.arenaSwitch;
        const cx = sw.x + sw.w * 0.5;
        const cy = sw.y + sw.h * 0.5;
        const ready = sw.cooldown <= 0;

        ctx.save();
        if (ready) {
            const pulse = 1.0 + 0.14 * Math.sin(this.animClock * 9);
            ctx.fillStyle = 'rgba(255, 211, 42, 0.25)';
            ctx.beginPath();
            ctx.arc(cx, cy, sw.w * 0.72 * pulse, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = ready ? '#1e293b' : 'rgba(18, 24, 42, 0.72)';
        ctx.strokeStyle = ready ? '#ffd32a' : 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = ready ? 3.5 : 2;
        ctx.beginPath();
        ctx.arc(cx, cy, sw.w * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!ready) {
            const pct = 1 - sw.cooldown / Math.max(1, sw.maxCooldown);
            ctx.strokeStyle = '#00d2d3';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, sw.w * 0.5 + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
            ctx.stroke();
        }

        ctx.globalAlpha = ready ? 1 : 0.45;
        ctx.font = '900 22px "Segoe UI Emoji", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cfg.icon || '⚡', cx, cy + 1);
        ctx.restore();

        if (ready) {
            this.drawNamePill('⚡ SCHALTER [E]/SPRING', cx, sw.y - 10, '#ffd32a');
        } else {
            this.drawNamePill(`⏳ ${Math.ceil(sw.cooldown / 60)}s`, cx, sw.y - 10, '#94a3b8');
        }
    }

    drawObstacles() {
        for (const obs of this.obstacles) {
            const screenX = obs.x - this.worldDistance;
            if (screenX > -90 && screenX < canvas.width + 90) {
                const key = this.getObstacleSpriteKey(obs.type);
                const img = images[key];
                const bobY = obs.type === 'frisbee' ? Math.sin(this.animClock * 6 + obs.phase) * 5 : 0;

                if (obs.high) {
                    // Overhead Duck-Under Hazard Beam + Warning Tape & Icon!
                    ctx.save();
                    ctx.strokeStyle = '#ff4757';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(screenX + 12, 0);
                    ctx.lineTo(screenX + 12, obs.y);
                    ctx.moveTo(screenX + obs.w - 12, 0);
                    ctx.lineTo(screenX + obs.w - 12, obs.y);
                    ctx.stroke();
                    ctx.fillStyle = '#141928';
                    ctx.strokeStyle = '#ffd32a';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.roundRect(screenX, obs.y + bobY, obs.w, obs.h, 10);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = '#ff4757';
                    ctx.fillRect(screenX + 8, obs.y + bobY + obs.h - 10, obs.w - 16, 6);
                    if (img && img.complete && img.naturalWidth > 0) {
                        ctx.drawImage(img, screenX + obs.w * 0.5 - 16, obs.y + bobY + 4, 32, 32);
                    }
                    ctx.restore();
                    this.drawNamePill('⬇ DUCK [CTRL]', screenX + obs.w * 0.5, obs.y - 8, '#ffd32a');
                } else {
                    // Ground shadow
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                    ctx.beginPath();
                    ctx.ellipse(screenX + obs.w / 2, this.player.groundY + 2, obs.w * 0.45, 7, 0, 0, Math.PI * 2);
                    ctx.fill();

                    if (img && img.complete && img.naturalWidth > 0) {
                        ctx.drawImage(img, screenX, obs.y + bobY, obs.w, obs.h);
                    } else {
                        ctx.fillStyle = '#ff4757';
                        ctx.fillRect(screenX, obs.y + bobY, obs.w, obs.h);
                    }
                }
            }
        }
    }

    drawCollectibles() {
        for (const col of this.collectibles) {
            if (col.collected) continue;
            const screenX = col.x - this.worldDistance;
            if (screenX > -80 && screenX < canvas.width + 80) {
                const floatY = col.y + Math.sin(this.animClock * 4.5 + (col.phase || 0)) * 7;
                const cx = screenX + col.w / 2;
                const cy = floatY + col.h / 2;

                // Soft glowing aura behind collectible
                const pulse = 0.85 + 0.15 * Math.sin(this.animClock * 6);
                ctx.save();
                ctx.globalAlpha = col.type === 'energy_drink' ? 0.5 : 0.38;
                ctx.fillStyle = col.type === 'coffee'
                    ? '#ffa502'
                    : (col.type === 'diploma_shard' || col.type === 'jeton'
                        ? '#ffd32a'
                        : (col.type === 'energy_drink'
                            ? '#00d2d3'
                            : (col.type === 'law_book' ? '#45aaf2' : '#2ed573')));
                ctx.beginPath();
                ctx.arc(cx, cy, col.w * 0.65 * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                const img = col.type === 'coffee'
                    ? images.item_coffee
                    : col.type === 'energy_drink'
                        ? images.item_energy
                        : col.type === 'diploma_shard'
                            ? images.item_diplom
                            : (col.type === 'jeton' ? images.item_jeton : images.item_gesetz);

                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, screenX, floatY, col.w, col.h);
                }
            }
        }
    }

    drawProjectiles() {
        for (const p of this.projectiles) {
            if (this.drawSpecialProjectile(p)) continue;
            ctx.save();
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;

            // Additive glow behind active projectile
            ctx.globalAlpha = p.type === 'mega_beam' ? 0.55 : 0.35;
            ctx.fillStyle = p.trailColor || (p.isPlayer ? '#45aaf2' : '#ff4757');
            ctx.beginPath();
            ctx.arc(cx, cy, p.w * (p.type === 'mega_beam' ? 0.65 : 0.48), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            ctx.translate(cx, cy);
            if (p.type === 'mega_beam' && p.vx < 0) {
                ctx.scale(-1, 1);
            } else if (p.type !== 'mega_beam') {
                ctx.rotate(p.rotation);
            }

            const img = this.getProjectileImage(p);

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -p.w / 2, -p.h / 2, p.w, p.h);
            } else {
                ctx.fillStyle = p.trailColor || '#ffd32a';
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            }
            ctx.restore();
        }
    }

    drawShockwaves() {
        for (const sw of this.shockwaves) {
            ctx.save();
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = sw.alpha;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawComicSpeedLines() {
        const cx = canvas.width * 0.42;
        const cy = canvas.height * 0.5;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 224, 102, ${Math.min(0.45, this.radialFlashTimer / 22)})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 24; i++) {
            const ang = (Math.PI * 2 * i) / 24 + this.animClock * 0.6;
            const inner = 160 + (i % 3) * 40;
            const outer = Math.max(canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
            ctx.lineTo(cx + Math.cos(ang) * outer, cy + Math.sin(ang) * outer);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawParticles() {
        for (const p of this.particles) {
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawFloatingTexts() {
        for (const ft of this.floatingTexts) {
            const age = ft.maxLife - ft.life;
            const popScale = age < 8 ? 0.65 + (age / 8) * 0.5 : 1.0;
            const alpha = Math.min(1, ft.life / 18);

            ctx.save();
            ctx.translate(ft.x, ft.y);
            ctx.scale(popScale, popScale);
            ctx.globalAlpha = alpha;
            ctx.font = `900 ${ft.size}px "Segoe UI", sans-serif`;
            ctx.textAlign = 'center';
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#080b12';
            ctx.strokeText(ft.text, 0, 0);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, 0, 0);
            ctx.restore();
        }
    }

    loop(timestamp) {
        const rawDt = Math.max(0, (timestamp - this.lastFrameTime) / 1000);
        this.lastFrameTime = timestamp;

        const FIXED_STEP = 1 / 60;
        const safeDt = Math.min(rawDt, 0.1);
        const isActiveAction = !this.isPaused && (
            this.state === GAME_STATE.RUNNING ||
            this.state === GAME_STATE.PRE_BOSS_WALK ||
            this.state === GAME_STATE.PRE_BOSS_DIALOGUE ||
            this.state === GAME_STATE.BOSS_FIGHT ||
            this.state === GAME_STATE.DEMO
        );

        if (isActiveAction) {
            // Snap tiny 60Hz jitter cleanly to 1/60s while normalizing 120Hz/144Hz monitors to 60Hz physics
            const normalizedDt = (safeDt > 0.0145 && safeDt < 0.0195) ? FIXED_STEP : safeDt;
            this.fixedAccumulator = Math.min(this.fixedAccumulator + normalizedDt, FIXED_STEP * 5);
            let substeps = 0;
            while (this.fixedAccumulator >= FIXED_STEP && substeps < 5) {
                this.update(FIXED_STEP);
                this.fixedAccumulator -= FIXED_STEP;
                substeps++;
            }
        } else {
            this.fixedAccumulator = 0;
            this.update(safeDt);
        }

        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }
}

window.addEventListener('load', () => {
    window.game = new Game();
});
