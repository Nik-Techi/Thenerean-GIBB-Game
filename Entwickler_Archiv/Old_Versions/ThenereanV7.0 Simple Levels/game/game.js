/**
 * Thenerean Selvabankumar - High-End 2D Arcade Engine (Gemini Argon Edition)
 *
 * Features:
 * - Full-viewport responsive 16:9+ canvas scaling (100vw / 100vh)
 * - 3-Layer Seamless Mirrored Parallax Stage Backgrounds for all 6 levels
 * - Crisp Foot-Anchored 2D Sprite Animation System (Idle, Run, Jump, Attack, Windup, Rage)
 * - Comic White-Mask Hit-Flash, Speedlines, Shockwave Rings, Trails & Floating Combat Text
 * - Attack 1 (E): Straight-ahead Gesetzestext (28 DMG)
 * - Attack 2 (Q / Shift): "ICH STAH DOCH DA!" Mega Shockwave (70 DMG)
 * - Attack 3 (F): "DA HAST DU 20 FRISBEES!" 20-Frisbee Machine-Gun Barrage (12 DMG x 20)
 * - Boss phases, telegraphed attack patterns & perfect block / shout combo: see boss_ai.js
 * - 10s Meme-Spam Opening Intro -> Main Menu -> Demo Training Room -> 30s Story Intro -> 6 Levels
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
    gibb_student_avatar: 'assets/sprites/gibb_student_avatar.png',

    // Stage Backgrounds (Lobby + All 6 Levels)
    bg_lobby: 'assets/backgrounds/bg_lobby.jpg',
    bg_gibb_entrance: 'assets/backgrounds/bg_gibb_entrance.jpg',
    bg_classroom: 'assets/backgrounds/bg_classroom.jpg',
    bg_gym_hallway: 'assets/backgrounds/bg_gym_hallway.jpg',
    bg_gym_turnhalle: 'assets/backgrounds/bg_gym_turnhalle.jpg',
    bg_server_srilanka: 'assets/backgrounds/bg_server_srilanka.jpg',
    bg_exam_auditorium: 'assets/backgrounds/bg_exam_auditorium.jpg',

    // HD Cel-Shaded Items, Obstacles & Projectiles
    frisbee: 'assets/sprites/frisbee.png',
    item_gesetz: 'assets/sprites/item_gesetz.png',
    item_coffee: 'assets/sprites/item_coffee.png',
    item_energy: 'assets/sprites/item_energy.png',
    item_diplom: 'assets/sprites/item_diplom.png',
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
            hp: 100,
            maxHp: 100,
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

        // 14s Balanced Meme Opening Intro (original clips with clean pacing)
        this.openingState = {
            active: true,
            elapsed: 0,
            totalDuration: 14.2,
            currentStep: -1
        };

        this.openingSteps = [
            { time: 0.0, duration: 3.1, title: "⚠️ GIBB ALARM: ABSENZENLISTE!", quote: "HERR ADAM: 'Silvankumar, ist der Thenerean da?!'", clip: 'adam_silvankumar', focus: 'left', shake: 12, color: '#ff4757' },
            { time: 3.1, duration: 3.2, title: "🔥 DER LEGENDE-SCHREI!", quote: "THENEREAN: 'HERR ADAM, ICH STAH DOCH DA!'", clip: 'thenerean_stah', focus: 'center', shake: 22, color: '#ffd32a' },
            { time: 6.3, duration: 2.6, title: "🥏 FRISBEE-SALVE STARTET!", quote: "HERR ADAM: 'DA HAST DU 20 FRISBEES!'", clip: 'adam_20_frisbees', focus: 'left', shake: 20, color: '#ff4757' },
            { time: 8.9, duration: 2.9, title: "📢 KLASSENZIMMER DISZIPLIN!", quote: "MONIKA: 'Gang uf die Platz! Sofort!'", clip: 'monika_gang_platz', focus: 'right', shake: 16, color: '#a55eea' },
            { time: 11.8, duration: 2.4, title: "🛡️ NIEMERT CHUNT AN MIR VERBI!", quote: "THENEREAN: 'BERUFSSCHULE GIBB — BIST DU BEREIT?!'", clip: 'thenerean_niemert_verbi', focus: 'all', shake: 24, color: '#2ed573' }
        ];

        // 24s Cinematic Story Intro (synced to actual clip lengths)
        this.introState = {
            active: false,
            elapsed: 0,
            totalDuration: 24.0,
            currentStep: 0
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
            openingCard: document.querySelector('#screen-opening .opening-card'),
            openingFlashText: document.getElementById('opening-flash-text'),
            openingImgLeft: document.getElementById('opening-img-left'),
            openingImgCenter: document.getElementById('opening-img-center'),
            openingImgRight: document.getElementById('opening-img-right'),
            openingShoutBanner: document.getElementById('opening-shout-banner'),
            openingProgress: document.getElementById('opening-progress'),
            openingCountdownTxt: document.getElementById('opening-countdown-txt'),
            btnSkipOpening: document.getElementById('btn-skip-opening'),
            btnReplayOpening: document.getElementById('btn-replay-opening'),

            screenMenu: document.getElementById('screen-menu'),
            screenIntro: document.getElementById('screen-intro'),
            screenLvlSelect: document.getElementById('screen-level-select'),
            screenStory: document.getElementById('screen-story'),
            screenWin: document.getElementById('screen-win'),
            screenPause: document.getElementById('screen-pause'),
            screenLose: document.getElementById('screen-lose'),
            screenVictory: document.getElementById('screen-victory'),
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

            introImg: document.getElementById('intro-img'),
            introStepTitle: document.getElementById('intro-step-title'),
            introSpeechText: document.getElementById('intro-speech-text'),
            introQuote: document.getElementById('intro-quote'),
            introTimerBar: document.getElementById('intro-timer-bar'),
            introTimeHint: document.getElementById('intro-time-hint'),
            introDots: document.querySelectorAll('.chap-dot'),
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

        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
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
        if (this.boss) {
            this.boss.h = Math.round((this.boss.type === 'tuktuk_gpu' ? 195 : 162) * scale);
            this.boss.y = newGroundY - this.boss.h;
        }
        if (this.duoPartner) {
            this.duoPartner.h = Math.round(162 * scale);
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
            if (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
                this.player.isDucking = true;
                e.preventDefault();
            }

            if (this.state === GAME_STATE.OPENING) {
                window.soundManager.initWebAudio();
                if (e.code === 'Space' || e.key === 'Escape' || e.key === 'Enter') {
                    this.finishOpening();
                }
            } else if (this.state === GAME_STATE.INTRO) {
                if (e.code === 'Space' || e.key === 'Escape' || e.key === 'Enter') {
                    this.skipIntro();
                }
            } else if (this.state === GAME_STATE.MENU) {
                if (e.key === 'Escape') {
                    if (this.ui.screenLvlSelect && !this.ui.screenLvlSelect.classList.contains('hidden')) {
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
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
            if (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
                this.player.isDucking = false;
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
            this.startCinematicIntro();
        });

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

        document.getElementById('btn-skip-intro').addEventListener('click', () => this.skipIntro());

        document.getElementById('btn-level-select').addEventListener('click', () => {
            this.ui.screenMenu.classList.add('hidden');
            this.populateLevelSelectGrid();
            this.ui.screenLvlSelect.classList.remove('hidden');
        });

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
            () => { this.player.isDucking = true; },
            () => { this.player.isDucking = false; }
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
                    window.soundManager.stopAllClips();
                    window.soundManager.playClip(clip);
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
    }

    // =====================================================================
    // CHARAKTER-GALERIE (Lobby): Thenerean, Monika Schneider, Herr Adam
    // =====================================================================
    getCharacterData() {
        return {
            thenerean: {
                accent: '#2ed573',
                role: 'HELD • INFORMATIK-LERNENDER EFZ',
                name: 'Thenerean Selvabankumar',
                sprite: 'assets/sprites/characters/thenerean_idle.png',
                bio: 'Will seine 4-jährige Informatik-Lehre an der GIBB Bern mit Bestnote 6.0 abschliessen. Kämpft mit Gesetzestexten, dem legendären "ICH STAH DOCH DA!"-Schrei und 20 Frisbees gegen Verspätungs-Verwarnungen, Mini-Bosse und ein überhitztes TukTuk.',
                stats: [['WAFFE', '📜 Gesetz'], ['SPEZIAL', '⚡ Mega-Schrei'], ['ZIEL', '🏆 EFZ 6.0']],
                sounds: [
                    { clip: 'thenerean_stah', text: '"Herr Adam, ich stah doch da!"' },
                    { clip: 'thenerean_niemert_verbi', text: '"Niemert chunt an mir verbi!"' },
                    { clip: 'thenerean_chasch_mi_schlah', text: '"Du hesch gmeint du chasch mi schlah?!"' },
                    { clip: 'thenerean_entschuldigung', text: '"Entschuldigung, ich bi 4 Minuten später!"' },
                    { clip: 'thenerean_tuktuk', text: '🛺 TukTuk-Fahrt in Sri Lanka' }
                ]
            },
            monika: {
                accent: '#a55eea',
                role: 'BOSS • HERRSCHERIN DER PÜNKTLICHKEIT',
                name: 'Monika Schneider',
                sprite: 'assets/sprites/characters/monika_idle.png',
                bio: 'Selbst 2.54 Sekunden Verspätung werden nicht toleriert. Wirft rote Karten im Bogen, schickt Absenzen-Wellen über den Boden und schreit in Phase 2 "Gang uf d\'Platz!" — nur ein Schild-Block hilft.',
                stats: [['ANGRIFF', '🟥 Rote Karten'], ['PHASE 2', '📢 Schrei'], ['SCHWÄCHE', '🛡 Perfekt-Block']],
                sounds: [
                    { clip: 'monika_puenktlichkeit', text: '"Pünktlichkeit ist oberste Gebot!"' },
                    { clip: 'monika_gang_uf_platz', text: '"Gang uf die Platz!"' },
                    { clip: 'monika_zspaet', text: '"Z\'spät — da git es nüt z\'dischputiere!"' },
                    { clip: 'monika_ganz_ruhig', text: '"Ganz ruhig bleiben!"' },
                    { clip: 'monika_schuld', text: '🎙️ Original-Spruch: "Schuld"' }
                ]
            },
            adam: {
                accent: '#00d2d3',
                role: 'BOSS • SPORTLEHRER & ABSENZEN-PRÜFER',
                name: 'Herr Adam',
                sprite: 'assets/sprites/characters/adam_idle.png',
                bio: 'Prüft die Absenzenliste mit fliegenden Sportgeräten. Frisbee-Salven oben (ducken) oder unten (springen), springende Basketbälle und in Phase 2 ein Pfiff, der dich betäubt.',
                stats: [['ANGRIFF', '🥏 Frisbees'], ['PHASE 2', '📯 Pfiff'], ['SCHWÄCHE', '⬇ Ducken']],
                sounds: [
                    { clip: 'adam_silvankumar', text: '"Silvankumar, ist der Thenerean da?!"' },
                    { clip: 'adam_20_frisbees', text: '"Da hast du 20 Frisbees!"' },
                    { clip: 'adam_frisbee', text: '🥏 Frisbee-Wurf' },
                    { clip: 'adam_hilf_mir', text: '"Hilf mir!"' }
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
        window.soundManager.playClip(clip, reset);
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

        this.player.hp = 100;
        this.player.maxHp = 100;
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

        this.comboCount = 0;
        this.maxCombo = 0;
        this.damageVignetteTimer = 0;
        this.lastDamageReason = null;
        this.updateComboAndPowerHUD();
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
        if (this.ui.btnPauseToggle) this.ui.btnPauseToggle.textContent = '⏸';
        this.ui.screenMenu.classList.remove('hidden');
        this.state = GAME_STATE.MENU;
        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playMenuMusic();
    }

    hideGameplayHUDs() {
        this.ui.bar.classList.add('hidden');
        this.ui.bossHudBanner.classList.add('hidden');
        this.ui.demoComboHud.classList.add('hidden');
        if (this.ui.hudStatusPills) this.ui.hudStatusPills.classList.add('hidden');
        this.ui.abilityDock.classList.add('hidden');
        this.ui.controlHintPill.classList.add('hidden');
        this.ui.dialogueBox.classList.add('hidden');
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

            const div = document.createElement('div');
            div.className = 'level-btn-card';
            div.innerHTML = `
                <img class="lvl-thumb" src="${lvl.bgPath}" alt="${lvl.name}">
                <div class="lvl-info">
                    <div class="lvl-num">${lvl.yearText}</div>
                    <div class="lvl-title">${lvl.name}</div>
                    <div class="lvl-feature-tag">${lvl.featureTag || ''}</div>
                    <p>${lvl.hasMiniBoss ? 'Mini-Boss + ' : ''}Boss: <strong>${lvl.bossName}</strong> (HP: ${lvl.bossHP})</p>
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
        this.demoComboHits = 0;
        this.demoTotalDamage = 0;
        this.resetCombatExtras();

        this.ui.screenMenu.classList.add('hidden');
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
            this.player.vx *= 0.52;
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
        this.player.hp = 100;
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
    // 10-SEKUNDEN MEME SPAM OPENING INTRO
    // =====================================================================
    startOpening() {
        this.clearFrisbeeTimers();
        window.soundManager.stopAllClips();
        this.hideGameplayHUDs();

        this.state = GAME_STATE.OPENING;
        this.openingState.active = true;
        this.openingState.elapsed = 0;
        this.openingState.currentStep = -1;

        this.ui.screenMenu.classList.add('hidden');
        this.ui.screenIntro.classList.add('hidden');
        this.ui.screenOpening.classList.remove('hidden');

        this.ui.openingImgLeft.className = 'opening-avatar left-avatar';
        this.ui.openingImgCenter.className = 'opening-avatar center-avatar';
        this.ui.openingImgRight.className = 'opening-avatar right-avatar';
    }

    updateOpening(dt) {
        if (!this.openingState.active) return;
        this.openingState.elapsed += dt;

        const ratio = Math.min(1.0, this.openingState.elapsed / this.openingState.totalDuration);
        const remainingSec = Math.max(0, Math.ceil(this.openingState.totalDuration - this.openingState.elapsed));

        if (this.ui.openingProgress) this.ui.openingProgress.style.width = `${ratio * 100}%`;
        if (this.ui.openingCountdownTxt) this.ui.openingCountdownTxt.textContent = `${remainingSec}s`;

        const stepIndex = this.openingSteps.findIndex(
            (st) => this.openingState.elapsed >= st.time && this.openingState.elapsed < st.time + st.duration
        );
        if (stepIndex !== -1 && stepIndex !== this.openingState.currentStep) {
            this.openingState.currentStep = stepIndex;
            const step = this.openingSteps[stepIndex];

            if (this.ui.openingFlashText) {
                this.ui.openingFlashText.textContent = step.title;
                this.ui.openingFlashText.style.color = step.color || '#ffd32a';
            }
            if (this.ui.openingShoutBanner) {
                this.ui.openingShoutBanner.textContent = step.quote;
                this.ui.openingShoutBanner.style.borderColor = step.color || '#ffeb3b';
            }

            this.ui.openingImgLeft.classList.toggle('highlight-pulse', step.focus === 'left' || step.focus === 'all');
            this.ui.openingImgCenter.classList.toggle('highlight-pulse', step.focus === 'center' || step.focus === 'all');
            this.ui.openingImgRight.classList.toggle('highlight-pulse', step.focus === 'right' || step.focus === 'all');

            this.screenShake = step.shake || 14;
            if (step.clip) {
                window.soundManager.stopAllClips();
                window.soundManager.playClip(step.clip);
            }
        }

        if (this.ui.openingCard && this.screenShake > 0) {
            const rx = (Math.random() - 0.5) * this.screenShake * 1.2;
            const ry = (Math.random() - 0.5) * this.screenShake * 1.2;
            this.ui.openingCard.style.transform = `translate(${rx}px, ${ry}px)`;
        } else if (this.ui.openingCard) {
            this.ui.openingCard.style.transform = 'none';
        }

        if (this.openingState.elapsed >= this.openingState.totalDuration) {
            this.finishOpening();
        }
    }

    finishOpening() {
        if (this.state !== GAME_STATE.OPENING) return;
        this.openingState.active = false;
        window.soundManager.stopAllClips();
        if (this.ui.openingCard) {
            this.ui.openingCard.style.transform = 'none';
        }
        if (this.ui.screenOpening) {
            this.ui.screenOpening.classList.add('hidden');
            this.ui.screenOpening.style.transform = 'none';
        }
        this.ui.screenMenu.classList.remove('hidden');
        this.state = GAME_STATE.MENU;
        this.screenShake = 14;
        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playMenuMusic();
    }

    // =====================================================================
    // 30-SEKUNDEN CINEMATIC STORY INTRO
    // =====================================================================
    startCinematicIntro() {
        this.state = GAME_STATE.INTRO;
        this.ui.screenMenu.classList.add('hidden');
        this.ui.screenIntro.classList.remove('hidden');

        this.introChapters = [
            {
                time: 0.0,
                duration: 6.0,
                title: "KAPITEL 1: DER EINSTIEG AN DER GIBB (2022)",
                text: "Thenerean Selvabankumar betritt voller Hoffnung die Berufsschule GIBB Bern. Doch bereits an Tag 1 wartet Monika Schneider...",
                quote: "Pünktlichkeit ist oberste Gebot! Ohne Disziplin lernt man nicht!",
                img: "assets/sprites/photo_IMG_20260119_133741.jpg",
                clip: "monika_puenktlichkeit"
            },
            {
                time: 6.0,
                duration: 4.4,
                title: "KAPITEL 2: DIE 4-MINUTEN AUSREDE",
                text: "Der Zug hatte Verspätung! Thenerean versucht verzweifelt die 4 Minuten Verspätung zu erklären...",
                quote: "Entschuldigung Monika Schneider, ich bi 4 Minuten später!",
                img: "assets/sprites/photo_IMG_20260317_114652.jpg",
                clip: "thenerean_entschuldigung"
            },
            {
                time: 10.4,
                duration: 3.8,
                title: "KAPITEL 3: HERR ADAMS FRISBEE-HAGEL",
                text: "Im 2. Lehrjahr wartet die Sporthalle — mit fliegenden Frisbees, Parcours und GIBB-Rivalen...",
                quote: "Da hast du 20 Frisbees! Silvankumar, ist der Thenerean da?!",
                img: "assets/sprites/adam_full.png",
                clip: "adam_silvankumar"
            },
            {
                time: 14.2,
                duration: 4.0,
                title: "KAPITEL 4: DER LEGENDE-SCHREI",
                text: "Thenerean lässt sich nicht unterkriegen und brüllt seinen ikonischen Satz durch die gesamte GIBB Turnhalle!",
                quote: "HERR ADAM, ICH STAH DOCH DA!",
                img: "assets/sprites/thenerean_stah_full.png",
                clip: "thenerean_stah"
            },
            {
                time: 18.2,
                duration: 5.8,
                title: "KAPITEL 5: DIE ABSCHLUSSPRÜFUNG BEGINNT!",
                text: "Über Lava-Gruben, TukTuk-Rennen und Mini-Bosse geht es direkt zum EFZ-Diplom. KÄMPFE!",
                quote: "Da git es nüt z dischputiere! Gang uf die Platz!",
                img: "assets/sprites/photo_IMG_20260623_113237.jpg",
                clip: "monika_zspaet"
            }
        ];

        this.introState.active = true;
        this.introState.elapsed = 0;
        this.introState.currentStep = -1;

        window.soundManager.playMusic('assets/music/That_s_The_One.mp3');
    }

    updateCinematicIntro(dt) {
        if (!this.introState.active) return;
        this.introState.elapsed += dt;

        const progressPercent = Math.min(100, (this.introState.elapsed / this.introState.totalDuration) * 100);
        this.ui.introTimerBar.style.width = `${progressPercent}%`;
        if (this.ui.introTimeHint) {
            const rem = Math.max(0, Math.ceil(this.introState.totalDuration - this.introState.elapsed));
            this.ui.introTimeHint.textContent = `Cinematic Story • ${rem}s`;
        }

        const idx = this.introChapters.findIndex(
            (ch) => this.introState.elapsed >= ch.time && this.introState.elapsed < ch.time + ch.duration
        );
        if (idx !== -1 && idx !== this.introState.currentStep) {
            this.introState.currentStep = idx;
            const currentChap = this.introChapters[idx];
            this.ui.introStepTitle.textContent = currentChap.title;
            this.ui.introSpeechText.textContent = currentChap.text;
            this.ui.introQuote.textContent = `"${currentChap.quote}"`;
            this.ui.introImg.src = currentChap.img;

            if (this.ui.introDots) {
                this.ui.introDots.forEach((dot, dIdx) => {
                    dot.classList.toggle('done', dIdx < idx);
                    dot.classList.toggle('active', dIdx === idx);
                });
            }

            if (currentChap.clip) {
                window.soundManager.stopAllClips();
                window.soundManager.playClip(currentChap.clip);
            }
        }

        if (this.introState.elapsed >= this.introState.totalDuration) {
            this.skipIntro();
        }
    }

    skipIntro() {
        this.introState.active = false;
        window.soundManager.stopAllClips();
        this.ui.screenIntro.classList.add('hidden');
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
        this.resetCombatExtras();

        this.ui.screenMenu.classList.add('hidden');
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

        this.generateLevelObstacles();
        if (this.level.featureTag) {
            this.showMemePopup(this.level.featureTag);
        }
        this.state = GAME_STATE.RUNNING;
        this.updateTouchControlsVisibility();
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

        const p1X = baseWorld + Math.round(canvas.width * 0.12);
        const off1 = 78;
        this.platforms.push({
            x: p1X, baseX: p1X, y: gy - off1, offsetY: off1, baseOffsetY: off1,
            w: 136, h: 20, style: pStyle, isArena: true
        });

        const p2X = baseWorld + Math.round(canvas.width * 0.28);
        const off2 = 128;
        this.platforms.push({
            x: p2X, baseX: p2X, y: gy - off2, offsetY: off2, baseOffsetY: off2,
            w: 136, h: 20, style: pStyle, isArena: true
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

        const addCollectible = (wx, wy, forcedType) => {
            const cType = forcedType || this.level.collectibleTypes[Math.floor(Math.random() * this.level.collectibleTypes.length)];
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
        };

        const addDuckObs = (wx, type) => {
            const oType = type || (this.level.id >= 5 ? 'broken_cable' : (this.level.id >= 3 ? 'frisbee' : 'warning_letter'));
            const barH = Math.round(ph * 0.30);
            this.obstacles.push({
                x: wx, y: gy - Math.round(ph * 0.96), w: 84, h: barH,
                type: oType, high: true, cleared: false, phase: Math.random() * Math.PI * 2
            });
        };

        // Build deterministic themed traversal sectors inside non-arena spans (clear runway before/after Mini-Boss!)
        const spans = mbDist > 0
            ? [[660, mbDist - 110], [mbDist + 560, totalDist - 110]]
            : [[660, totalDist - 110]];

        const addLavaBridge = (startX, rem) => {
            if (mech.sprintPads) {
                this.boostPads.push({ x: startX, w: 92, label: '⚡ SPRINT' });
            }
            const pitX = startX + (mech.sprintPads ? 115 : 30);
            const pitW = Math.min(370, Math.max(230, rem - 230));
            this.lavaPits.push({ x: pitX, w: pitW, theme: pitTheme });

            const plat1X = pitX + 34;
            const plat1W = pitW > 310 ? 150 : Math.max(148, pitW - 68);
            const off1 = 88;
            const plat1Y = gy - off1;
            this.platforms.push({ x: plat1X, y: plat1Y, offsetY: off1, w: plat1W, h: 22, style: pStyle });
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
                addCollectible(plat2X + plat2W * 0.5 - 21, plat2Y - 56, 'energy_drink');
            }
            return pitX + pitW + 135;
        };

        spans.forEach(([spanStart, spanEnd], spanIdx) => {
            let cursor = spanStart;
            let step = 0;
            while (cursor < spanEnd - 170) {
                const rem = spanEnd - cursor;
                let mode = 'hurdle';
                if (mech.lavaPits && mech.platforms && ((spanIdx === 0 && step === 0) || (spanIdx === 1 && step === 1)) && rem >= 460) {
                    mode = 'lava';
                } else if (mech.duckObstacles && ((step % 2 === 1) || (!mech.platforms && !mech.lavaPits)) && rem >= 175) {
                    mode = 'duck';
                } else if (mech.platforms && ((spanIdx === 0 && !mech.lavaPits && step === 0) || (spanIdx === 1 && step === 0)) && rem >= 310) {
                    mode = 'highlow';
                } else if (mech.lavaPits && mech.platforms && rem >= 460) {
                    mode = 'lava';
                }
                step++;

                if (mode === 'lava') {
                    cursor = addLavaBridge(cursor, rem);
                } else if (mode === 'highlow') {
                    const pw = 190;
                    const offP = 96;
                    const py = gy - offP;
                    const movingY = this.level.id >= 5;
                    this.platforms.push({
                        x: cursor, baseX: cursor, y: py, offsetY: offP, baseOffsetY: offP, w: pw, h: 22,
                        style: pStyle,
                        moveAxis: movingY ? 'y' : null,
                        moveAmp: movingY ? 20 : 0,
                        moveSpeed: movingY ? 2.0 : 0,
                        phase: Math.random() * Math.PI * 2
                    });
                    addCollectible(cursor + 32, py - 56);
                    addCollectible(cursor + 115, py - 56, 'coffee');
                    addGroundObs(cursor + 74);
                    if (mech.duckObstacles && rem >= 450) {
                        addDuckObs(cursor + 275);
                        cursor += 420;
                    } else {
                        cursor += 340;
                    }
                } else if (mode === 'duck') {
                    addDuckObs(cursor);
                    addCollectible(cursor + 20, gy - 68);
                    if (rem >= 390) {
                        addGroundObs(cursor + 225);
                        cursor += 390;
                    } else {
                        cursor += 235;
                    }
                } else {
                    if (mech.sprintPads && step % 2 === 1 && rem >= 360) {
                        this.boostPads.push({ x: cursor, w: 96, label: '⚡ SPRINT' });
                        addGroundObs(cursor + 225);
                        addCollectible(cursor + 235, gy - 155);
                        cursor += 375;
                    } else {
                        addGroundObs(cursor);
                        addCollectible(cursor + 95, gy - 135 - Math.random() * 45);
                        cursor += 280;
                    }
                }
            }
        });
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

        if (Math.random() > 0.45) {
            const blockCounters = ['thenerean_chasch_mi_schlah', 'thenerean_niemert_verbi'];
            const clip = blockCounters[Math.floor(Math.random() * blockCounters.length)];
            window.soundManager.playClip(clip);
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
        const hp = this.level.miniBossHP || 280;

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

    triggerPreBossEncounter() {
        this.state = GAME_STATE.PRE_BOSS_WALK;
        this.ui.controlHintPill.classList.add('hidden');
        window.soundManager.setMusicQuietMode(true);

        const groundPos = this.player.groundY;
        const scale = Math.max(0.78, Math.min(1.38, canvas.height / 720));
        const isDuo = this.level.bossType === 'duo';
        const isTukTuk = this.level.bossType === 'tuktuk_gpu';
        this.resetCombatExtras();
        this.spawnArenaPlatforms();
        const bossH = Math.round((isTukTuk ? 195 : 162) * scale);
        const bossW = Math.round((isTukTuk ? 175 : 94) * scale);

        this.boss = {
            name: this.level.bossName,
            type: this.level.bossType,
            avatar: this.level.bossAvatar,
            x: canvas.width * (isDuo ? 0.67 : 0.74),
            y: groundPos - bossH,
            w: bossW,
            h: bossH,
            hp: this.level.bossHP,
            maxHp: this.level.bossHP,
            facing: -1,
            attackTimer: 55,
            attackAnimTimer: 0,
            banterAnimTimer: 0,
            moveDir: -1,
            hitFlash: 0,
            banterTimer: 95
        };

        if (isDuo) {
            const pH = Math.round(162 * scale);
            const pW = Math.round(92 * scale);
            this.duoPartner = {
                name: "Herr Adam",
                type: "adam",
                isDuoPartner: true,
                avatar: 'assets/sprites/adam_avatar.png',
                x: canvas.width * 0.86,
                y: groundPos - pH,
                w: pW,
                h: pH,
                hp: this.level.partnerHP || 850,
                maxHp: this.level.partnerHP || 850,
                facing: -1,
                attackTimer: 82,
                attackAnimTimer: 0,
                banterAnimTimer: 0,
                moveDir: 1,
                hitFlash: 0
            };
        }

        this.updateBossHUD();
    }

    startPreBossDialogue() {
        this.state = GAME_STATE.PRE_BOSS_DIALOGUE;
        this.updateTouchControlsVisibility();
        this.ui.abilityDock.classList.add('hidden');
        this.ui.memePopup.classList.add('hidden');
        const encounter = (this.boss && this.boss.isMiniBoss && this.level.preMiniBossEncounter)
            ? this.level.preMiniBossEncounter
            : this.level.preBossEncounter;
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
                window.soundManager.playClip(next.clip);
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
            const bannerText = (this.boss && this.boss.isMiniBoss)
                ? "⚡ MINI-BOSS: AN MIR CHUNNSCH NÖD VERBI!"
                : `⚔️ ${this.boss ? this.boss.name.toUpperCase() : 'KAMPF BEGINNT!'}`;
            this.addFloatingText(bannerText, canvas.width / 2, fightY, '#ff4757', 26);
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
        const dmg = this.touchControlsEnabled ? 12 : 18;
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
            this.addFloatingText("🔥 LAVA! RECHTSZEITIG SPRINGEN!", this.player.x + 140, this.player.groundY - 170, '#ffd32a', 20);
        }
    }

    updateRunning(dt) {
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
            this.player.vx *= 0.52;
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

        // Mid-Level Mini-Boss Checkpoint (Average GIBB Schüler)
        const mbDist = this.level.targetDistance * (this.level.miniBossTriggerRatio || 0.50);
        if (this.level.hasMiniBoss && !this.midBossDefeated && !this.midBossTriggered && this.worldDistance >= mbDist) {
            this.triggerMiniBossEncounter();
            return;
        }

        if (this.worldDistance >= this.level.targetDistance) {
            this.triggerPreBossEncounter();
            return;
        }

        for (const obs of this.obstacles) {
            const screenX = obs.x - this.worldDistance;
            if (screenX > -120 && screenX < canvas.width + 120) {
                const isDuck = this.player.isDucking && this.player.isGrounded;
                const pHitY = isDuck ? this.player.y + this.player.h * 0.48 : this.player.y + 12;
                const pHitH = isDuck ? this.player.h * 0.50 : this.player.h - 14;
                if (obs.high && isDuck && !obs.duckDodged) {
                    const standHit = this.checkCollision(this.player.x + 12, this.player.y + 12, this.player.w - 24, this.player.h - 14, screenX + 4, obs.y + 4, obs.w - 8, obs.h - 8);
                    const crouchHit = this.checkCollision(this.player.x + 12, pHitY, this.player.w - 24, pHitH, screenX + 4, obs.y + 4, obs.w - 8, obs.h - 8);
                    if (standHit && !crouchHit) {
                        obs.duckDodged = true;
                        this.addFloatingText("💨 SAUBER GEDUCKT!", this.player.x + this.player.w * 0.5, this.player.y + 14, '#2ed573', 19);
                        this.registerCombo(1);
                    }
                }
                if (this.checkCollision(this.player.x + 12, pHitY, this.player.w - 24, pHitH, screenX + 4, obs.y + 4, obs.w - 8, obs.h - 8)) {
                    if (this.player.isBlocking) {
                        this.onBlockSuccess(screenX, obs.y);
                    } else {
                        const dmg = this.touchControlsEnabled ? 10 : 14;
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
            'thenerean_srilanka'
        ];
        if (Math.random() > 0.35) {
            const clip = dodgeClips[Math.floor(Math.random() * dodgeClips.length)];
            window.soundManager.playClip(clip);
        }
    }

    tickPlayerBanter() {
        this.player.banterTimer--;
        if (this.player.banterTimer <= 0) {
            this.player.banterTimer = 330 + Math.random() * 140;
            if (this.level && this.level.playerLines && this.level.playerLines.length > 0) {
                const line = this.level.playerLines[Math.floor(Math.random() * this.level.playerLines.length)];
                window.soundManager.playClip(line.clip);
                this.shoutAvatarTimer = Math.max(this.shoutAvatarTimer, 28);
                this.addFloatingText(`"${line.text}"`, this.player.x + this.player.w * 0.5, this.player.y - 36, '#2ed573', 16);
            }
        }
    }

    updatePreBossWalk(dt) {
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
            this.player.vx *= 0.52;
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

        if (this.boss && this.boss.hp > 0) {
            if (this.boss.hitFlash > 0) this.boss.hitFlash--;
            if (this.boss.attackAnimTimer > 0) this.boss.attackAnimTimer--;
            if (this.boss.banterAnimTimer > 0) this.boss.banterAnimTimer--;

            this.boss.facing = this.player.x < this.boss.x ? -1 : 1;
            const spd = this.boss.type === 'tuktuk_gpu' ? 3.5 : 3.0;
            if (this.bossCanMove(this.boss)) this.boss.x += this.boss.moveDir * spd * this.bossSpeedMult(this.boss);
            if (this.boss.x < canvas.width * 0.46) this.boss.moveDir = 1;
            else if (this.boss.x > canvas.width - this.boss.w - 30) this.boss.moveDir = -1;

            // Burning GPU smoke effect on TukTuk
            if (this.boss.type === 'tuktuk_gpu' && Math.random() > 0.55) {
                this.particles.push({
                    x: this.boss.x + this.boss.w * 0.72,
                    y: this.boss.y + 22,
                    vx: 1.5 + Math.random() * 2,
                    vy: -2.2 - Math.random() * 2,
                    life: 24,
                    maxLife: 24,
                    color: this.boss.hp < this.boss.maxHp * 0.5 ? '#ff6348' : '#ffa502',
                    size: 6 + Math.random() * 5
                });
            }

            this.updateBossAI(this.boss, this.duoPartner);

            this.boss.banterTimer--;
            if (this.boss.banterTimer <= 0) {
                this.boss.banterTimer = 175 + Math.random() * 110;
                if (this.boss.isMiniBoss) {
                    this.boss.banterAnimTimer = 35;
                    const mbTaunts = [
                        'Erst mal Energy exen! ⚡',
                        'An mir chunnsch nöd verbi!',
                        'Laptop-Wurf incoming! 💻',
                        'Han d Modul-Prüefig scho gmacht!'
                    ];
                    const msg = mbTaunts[Math.floor(Math.random() * mbTaunts.length)];
                    this.addFloatingText(`"${msg}"`, this.boss.x + this.boss.w * 0.4, this.boss.y - 26, '#38bdf8', 17);
                } else {
                    const speakerEntity = (this.duoPartner && this.duoPartner.hp > 0 && Math.random() > 0.5) ? this.duoPartner : this.boss;
                    speakerEntity.banterAnimTimer = 35;
                    const line = this.level.bossLines[Math.floor(Math.random() * this.level.bossLines.length)];
                    window.soundManager.playClip(line.clip);
                    this.addFloatingText(`"${line.text}"`, speakerEntity.x + speakerEntity.w * 0.4, speakerEntity.y - 26, '#ffd32a', 17);
                }
            }
        }

        if (this.duoPartner && this.duoPartner.hp > 0) {
            if (this.duoPartner.hitFlash > 0) this.duoPartner.hitFlash--;
            if (this.duoPartner.attackAnimTimer > 0) this.duoPartner.attackAnimTimer--;
            if (this.duoPartner.banterAnimTimer > 0) this.duoPartner.banterAnimTimer--;

            this.duoPartner.facing = this.player.x < this.duoPartner.x ? -1 : 1;
            if (this.bossCanMove(this.duoPartner)) this.duoPartner.x += this.duoPartner.moveDir * 3.3 * this.bossSpeedMult(this.duoPartner);
            if (this.duoPartner.x < canvas.width * 0.52) this.duoPartner.moveDir = 1;
            else if (this.duoPartner.x > canvas.width - this.duoPartner.w - 25) this.duoPartner.moveDir = -1;

            this.updateBossAI(this.duoPartner, this.boss);

            if (!this.boss || this.boss.hp <= 0) {
                this.duoPartner.banterTimer = (this.duoPartner.banterTimer || 140) - 1;
                if (this.duoPartner.banterTimer <= 0) {
                    this.duoPartner.banterTimer = 180 + Math.random() * 100;
                    this.duoPartner.banterAnimTimer = 35;
                    const adamLine = Math.random() > 0.5
                        ? { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" }
                        : { text: "Da hast du 20 Frisbees!", clip: "adam_20_frisbees" };
                    window.soundManager.playClip(adamLine.clip);
                    this.addFloatingText(`"${adamLine.text}"`, this.duoPartner.x + this.duoPartner.w * 0.4, this.duoPartner.y - 26, '#00d2d3', 17);
                }
            }
        }

        this.checkDuoEnrage();
        this.updateBossHazards();

        if (this.boss && this.boss.hp <= 0 && (!this.duoPartner || this.duoPartner.hp <= 0)) {
            if (this.boss.isMiniBoss) {
                this.onMiniBossDefeated();
                return;
            }
            this.triggerLevelWin();
        }

        this.updateBossHUD();
        this.updateProjectiles();
    }

    bossFireAttack(bossEntity, forcedType) {
        bossEntity.attackAnimTimer = 22;
        const type = forcedType || (bossEntity.name.includes("Adam") ? 'frisbee' : (bossEntity.type === 'tuktuk_gpu' ? 'broken_cable' : 'red_card'));
        const isAdam = type === 'frisbee';
        const isTukTuk = type === 'broken_cable';
        const dir = this.player.x < bossEntity.x ? -1 : 1;

        this.projectiles.push({
            x: dir < 0 ? bossEntity.x : bossEntity.x + bossEntity.w,
            y: bossEntity.y + bossEntity.h * 0.36,
            vx: 9.4 * dir,
            vy: (this.player.y - bossEntity.y) * 0.018,
            w: 44,
            h: type === 'frisbee' ? 28 : 42,
            isPlayer: false,
            type: type,
            damage: 20,
            rotation: 0,
            trailColor: isAdam ? '#ff4757' : (isTukTuk ? '#00d2d3' : '#ff3838')
        });

        if (isAdam) {
            if (Math.random() > 0.45) window.soundManager.playClip(Math.random() > 0.5 ? 'adam_20_frisbees' : 'adam_frisbee');
        } else if (isTukTuk) {
            if (Math.random() > 0.45) window.soundManager.playClip(Math.random() > 0.5 ? 'thenerean_gpu' : 'thenerean_grafikkarte');
        } else {
            if (Math.random() > 0.45) window.soundManager.playClip(Math.random() > 0.5 ? 'monika_zspaet' : 'monika_gang_platz');
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
                        this.addFloatingText("HERR ADAM K.O.!", this.duoPartner.x + this.duoPartner.w * 0.5, this.duoPartner.y - 20, '#00d2d3', 24);
                    }
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // Boss projectile hits player
            if (!p.isPlayer) {
                const isDucking = this.player.isDucking && this.player.isGrounded;
                const pHitY = isDucking ? this.player.y + this.player.h * 0.44 : this.player.y + 10;
                const pHitH = isDucking ? this.player.h * 0.54 : this.player.h - 14;

                // Check if normal standing hitbox would have hit, but crouch dodged under it
                if (isDucking && !p.duckDodged) {
                    const standingHit = this.checkCollision(p.x, p.y, p.w, p.h, this.player.x + 10, this.player.y + 10, this.player.w - 20, this.player.h - 14);
                    const crouchHit = this.checkCollision(p.x, p.y, p.w, p.h, this.player.x + 10, pHitY, this.player.w - 20, pHitH);
                    if (standingHit && !crouchHit) {
                        p.duckDodged = true;
                        this.addFloatingText("GEDUCKT! 💨", this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.25, '#2ed573', 20);
                        this.registerCombo(1);
                        if (Math.random() > 0.5) window.soundManager.playClip('thenerean_stah');
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
        this.player.invulnerableTime = 52;
        this.player.hitFlash = 10;
        this.damageVignetteTimer = 16;
        this.player.score = Math.max(1.0, +(this.player.score - 0.2).toFixed(1));
        this.screenShake = 13;
        this.updateBars();
        window.soundManager.playHit();

        this.addFloatingText(`-${damage} HP!`, this.player.x + this.player.w * 0.5, this.player.y, '#ff4757', 21);
        this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.45, 15, '#ff4757', 7, 20);

        if (this.player.hp <= 0 && this.state !== GAME_STATE.DEMO) {
            this.triggerGameOver();
        }
        return true;
    }

    onCollectItem(type) {
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

        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
        this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 35);
        this.player.score = Math.min(6.0, +(this.player.score + 0.1).toFixed(1));
        this.updateBars();

        const label = type === 'coffee' ? "+Kaffee & Energie!" : "+EFZ Energie!";
        this.addFloatingText(label, this.player.x + 25, this.player.y - 10, '#2ed573', 19);
        this.spawnBurst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.35, 12, '#2ed573', 5, 18);
    }

    updateBars() {
        const hpPct = Math.max(0, Math.min(100, this.player.hp));
        const energyPct = Math.max(0, Math.min(100, (this.player.megaEnergy / this.player.maxMegaEnergy) * 100));
        const frisbeeReady = this.player.frisbeeCooldown <= 0
            ? 100
            : Math.max(0, 100 - (this.player.frisbeeCooldown / this.player.maxFrisbeeCooldown) * 100);

        this.ui.hpBar.style.width = `${hpPct}%`;
        this.ui.hpValText.textContent = `${Math.round(hpPct)}`;
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
        this.ui.bossHudName.textContent = (this.boss.isMiniBoss ? '⚡ MINI-BOSS: ' : '') + this.boss.name.toUpperCase();
        this.ui.bossHudHpText.textContent = `${Math.max(0, Math.round(this.boss.hp))} / ${this.boss.maxHp} HP`;
        this.ui.bossHudFill.style.width = `${Math.max(0, (this.boss.hp / this.boss.maxHp) * 100)}%`;

        if (this.duoPartner) {
            this.ui.bossPartnerRow.classList.remove('hidden');
            this.ui.bossPartnerAvatar.classList.remove('hidden');
            this.ui.bossPartnerName.textContent = "HERR ADAM";
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
        this.ui.bossHudBanner.classList.add('hidden');

        this.saveLevelProgress(this.level.id, this.player.score, this.elapsedSeconds, this.maxCombo);

        this.ui.winGrade.textContent = this.player.score.toFixed(1);
        this.ui.winHp.textContent = `${Math.round(this.player.hp)}%`;
        if (this.ui.winTime) this.ui.winTime.textContent = this.formatTime(this.elapsedSeconds);
        if (this.ui.winCombo) this.ui.winCombo.textContent = `${this.maxCombo}×`;
        if (this.ui.winDesc) {
            this.ui.winDesc.textContent = this.player.score >= 5.8
                ? `Bestnote im ${this.level.yearText}! ${this.level.bossName} hat keine Chance gegen Thenerean!`
                : `Stark durchgekämpft gegen ${this.level.bossName}! Das GIBB-Lehrjahr ist bestanden!`;
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
        this.ui.bossHudBanner.classList.add('hidden');

        const reason = this.lastDamageReason;
        let badge = 'DISZIPLINAR-STOPP';
        let title = '💀 VERWARNUNG ERHALTEN!';
        let desc = 'Monika Schneider hat dich wegen Verspätung nach Hause geschickt!';
        let quote = '"Pünktlichkeit ist oberste Gebot! Ohne Disziplin lernt man nicht!"';

        if (reason === 'lava') {
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
        window.soundManager.playClip('monika_zspaet');
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
        window.soundManager.playMusic('assets/music/Sirünän_Reign.mp3');
        window.soundManager.playClip('thenerean_stah');
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
        } else if (inBossPhase) {
            this.drawPlatforms();
        }
        this.drawHazards();

        // Collectibles & Obstacles
        if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.DEMO) {
            this.drawObstacles();
            this.drawCollectibles();
        }

        // Expanding Shockwave Rings
        this.drawShockwaves();

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
            return 'bg_gibb_entrance';
        }
        const bg = this.level.bgType;
        if (bg === 'classroom') return 'bg_classroom';
        if (bg === 'gym_hallway') return 'bg_gym_hallway';
        if (bg === 'gym_turnhalle') return 'bg_gym_turnhalle';
        if (bg === 'server_room') return 'bg_server_srilanka';
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

            const cycleW = tileW * 2;
            const rawOffset = scrollDist % cycleW;
            let startX = -rawOffset;

            // Draw seamlessly tiled alternating normal + horizontal-mirror strips
            let flipIndex = 0;
            while (startX < canvas.width + tileW) {
                if (startX + tileW > -10) {
                    const isMirrored = (flipIndex % 2) === 1;
                    if (!isMirrored) {
                        ctx.drawImage(bgImg, startX, drawY, tileW + 1, tileH);
                    } else {
                        ctx.save();
                        ctx.translate(startX + tileW, drawY);
                        ctx.scale(-1, 1);
                        ctx.drawImage(bgImg, 0, 0, tileW + 1, tileH);
                        ctx.restore();
                    }
                }
                startX += tileW;
                flipIndex++;
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
        const isTukTuk = bossEntity.type === 'tuktuk_gpu';
        const ai = bossEntity.ai;
        const telegraphing = !!(ai && ai.telegraph);

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
            const isRage = bossEntity.attackAnimTimer > 0 || bossEntity.hp < bossEntity.maxHp * 0.5 || telegraphing || !!(ai && ai.charge);
            spriteKey = isRage ? 'tuktuk_rage' : 'tuktuk_idle';
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
            ctx.fillRect(barX + barW * 0.5 - 1, barY - 2, 2, barH + 4);
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
                    : (col.type === 'diploma_shard'
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
                            : images.item_gesetz;

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
