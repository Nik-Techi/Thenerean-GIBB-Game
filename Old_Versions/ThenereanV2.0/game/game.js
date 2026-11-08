/**
 * Thenerean Selvabankumar - Main Game Engine (Fullscreen & Cinematic Overhaul)
 * 
 * Major Fixes & Upgrades:
 * 1. FULLSCREEN / BROWSER FILLING: Dynamic responsive canvas & layout (fills entire viewport).
 * 2. NO AUTO-SCROLLING: World only scrolls when the player moves! Standing still is 100% calm.
 * 3. OBSTACLE DODGING REWARD SOUNDS: Passing/clearing obstacles plays random satisfying meme quotes!
 * 4. 30-SECOND CINEMATIC INTRO: Complete multi-chapter story montage before Level 1 with full audio quotes.
 * 5. BOSSFIGHT OVERHAUL: Ultra action, screen shakes, multi-attacks, and BGM completely muted/whisper quiet during fights!
 * 6. ALL SOUNDS RE-EXPORTED & VERIFIED: Complete, uncut audio clips.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Auto-resize canvas to match viewport smoothly
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Image assets loader
const images = {};
const imageSources = {
    thenerean_hero: 'assets/sprites/thenerean_hero.png',
    thenerean_avatar: 'assets/sprites/thenerean_avatar.png',
    adam_sprite: 'assets/sprites/adam_sprite.png',
    adam_avatar: 'assets/sprites/adam_avatar.png',
    monika_sprite: 'assets/sprites/monika_sprite.png',
    monika_avatar: 'assets/sprites/monika_avatar.png',
    tuktuk_sprite: 'assets/sprites/tuktuk_sprite.png',
    frisbee: 'assets/sprites/frisbee.png',
    item_gesetz: 'assets/sprites/item_gesetz.png',
    item_coffee: 'assets/sprites/item_coffee.png',
    item_diplom: 'assets/sprites/item_diplom.png',
    projectile_mega: 'assets/sprites/projectile_mega.png',
    basketball: 'assets/sprites/basketball.png',
    red_card: 'assets/sprites/red_card.png',
    whistle: 'assets/sprites/whistle.png'
};

for (const [key, src] of Object.entries(imageSources)) {
    const img = new Image();
    img.src = src;
    images[key] = img;
}

const GAME_STATE = {
    MENU: 0,
    INTRO: 1,
    RUNNING: 2,
    PRE_BOSS_WALK: 3,
    PRE_BOSS_DIALOGUE: 4,
    BOSS_FIGHT: 5,
    LEVEL_WIN: 6,
    GAME_OVER: 7,
    VICTORY: 8
};

class Game {
    constructor() {
        this.state = GAME_STATE.MENU;
        this.currentLevelIndex = 0;
        this.level = LEVELS_CONFIG[0];

        // Screen Shake effect
        this.screenShake = 0;

        // Player physics & stats
        this.player = {
            x: 120,
            y: 400,
            w: 72,
            h: 88,
            vx: 0,
            vy: 0,
            speed: 6.5,
            jumpPower: -14.5,
            groundY: 0, // dynamic based on canvas height
            isGrounded: true,
            hp: 100,
            maxHp: 100,
            score: 5.5,
            megaEnergy: 100,
            maxMegaEnergy: 100,
            invulnerableTime: 0,
            banterTimer: 240
        };

        // World distance & camera
        this.worldDistance = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];

        // Bosses
        this.boss = null;
        this.duoPartner = null;

        // Intro Cinematic State (~30 seconds)
        this.introState = {
            active: false,
            elapsed: 0,
            totalDuration: 30, // 30 seconds
            currentStep: 0,
            timerId: null
        };

        // Dialogue
        this.activeDialogue = null;
        this.dialogueQueue = [];
        this.elapsedSeconds = 0;

        // UI references
        this.ui = {
            bar: document.getElementById('ui-bar'),
            hpBar: document.getElementById('hp-bar'),
            energyBar: document.getElementById('energy-bar'),
            progBar: document.getElementById('progress-bar'),
            yearBadge: document.getElementById('current-year-badge'),
            lvlName: document.getElementById('level-name'),
            scoreVal: document.getElementById('score-val'),
            timeVal: document.getElementById('time-val'),
            dialogueBox: document.getElementById('dialogue-box'),
            dialogueAvatar: document.getElementById('dialogue-avatar'),
            dialogueSpeaker: document.getElementById('dialogue-speaker'),
            dialogueText: document.getElementById('dialogue-text'),
            memePopup: document.getElementById('meme-popup'),
            memeText: document.getElementById('meme-text'),
            screenMenu: document.getElementById('screen-menu'),
            screenIntro: document.getElementById('screen-intro'),
            screenLvlSelect: document.getElementById('screen-level-select'),
            screenStory: document.getElementById('screen-story'),
            screenWin: document.getElementById('screen-win'),
            screenLose: document.getElementById('screen-lose'),
            screenVictory: document.getElementById('screen-victory'),
            winGrade: document.getElementById('win-grade'),
            winHp: document.getElementById('win-hp'),
            introImg: document.getElementById('intro-img'),
            introStepTitle: document.getElementById('intro-step-title'),
            introSpeechText: document.getElementById('intro-speech-text'),
            introQuote: document.getElementById('intro-quote'),
            introTimerBar: document.getElementById('intro-timer-bar')
        };

        this.keys = {};
        this.initInput();
        this.initUIEventListeners();

        // Start render loop
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;

            if (this.state === GAME_STATE.INTRO) {
                if (e.code === 'Space' || e.key === 'Escape' || e.key === 'Enter') {
                    this.skipIntro();
                }
            } else if (this.state === GAME_STATE.PRE_BOSS_DIALOGUE) {
                if (e.code === 'Space' || e.key === 'Enter') {
                    this.advancePreBossDialogue();
                }
            } else if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT) {
                if (e.code === 'Space') {
                    this.playerJump();
                }
                if (e.key.toLowerCase() === 'e') {
                    this.playerAttackLawBook(); // Attack 1: Straight ahead
                }
                if (e.key.toLowerCase() === 'q' || e.code === 'ShiftLeft' || e.key.toLowerCase() === 'f') {
                    this.playerAttackMegaShout(); // Attack 2: Mega Shockwave
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        canvas.addEventListener('mousedown', (e) => {
            if (this.state === GAME_STATE.INTRO) {
                this.skipIntro();
            } else if (this.state === GAME_STATE.PRE_BOSS_DIALOGUE) {
                this.advancePreBossDialogue();
            } else if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT) {
                if (e.button === 0) {
                    this.playerAttackLawBook();
                } else if (e.button === 2) {
                    this.playerAttackMegaShout();
                }
            }
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.ui.dialogueBox.addEventListener('click', () => {
            if (this.state === GAME_STATE.PRE_BOSS_DIALOGUE) this.advancePreBossDialogue();
        });
    }

    initUIEventListeners() {
        // Fullscreen Toggle button
        const toggleFS = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {});
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        };

        document.getElementById('btn-fullscreen-toggle').addEventListener('click', toggleFS);
        document.getElementById('btn-fullscreen-menu').addEventListener('click', toggleFS);

        // Start button -> Starts 30-second cinematic intro!
        document.getElementById('btn-start').addEventListener('click', () => {
            window.soundManager.initWebAudio();
            this.startCinematicIntro();
        });

        document.getElementById('btn-skip-intro').addEventListener('click', () => {
            this.skipIntro();
        });

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
            this.ui.screenMenu.classList.add('hidden');
            this.ui.screenStory.classList.remove('hidden');
        });

        document.getElementById('btn-close-story').addEventListener('click', () => {
            this.ui.screenStory.classList.add('hidden');
            this.ui.screenMenu.classList.remove('hidden');
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

        document.getElementById('btn-lose-menu').addEventListener('click', () => {
            this.ui.screenLose.classList.add('hidden');
            this.ui.bar.classList.add('hidden');
            this.ui.screenMenu.classList.remove('hidden');
            this.state = GAME_STATE.MENU;
            window.soundManager.setMusicQuietMode(false);
            window.soundManager.playMenuMusic();
        });

        document.getElementById('btn-victory-restart').addEventListener('click', () => {
            this.ui.screenVictory.classList.add('hidden');
            this.ui.bar.classList.add('hidden');
            this.ui.screenMenu.classList.remove('hidden');
            this.state = GAME_STATE.MENU;
            window.soundManager.setMusicQuietMode(false);
            window.soundManager.playMenuMusic();
        });

        document.getElementById('btn-sound-toggle').addEventListener('click', (e) => {
            const on = window.soundManager.toggleMute();
            e.target.textContent = on ? '🔊' : '🔇';
        });
    }

    populateLevelSelectGrid() {
        const grid = document.querySelector('.level-grid');
        grid.innerHTML = '';
        LEVELS_CONFIG.forEach((lvl, idx) => {
            const div = document.createElement('div');
            div.className = 'level-btn-card';
            div.innerHTML = `
                <div class="lvl-num">${lvl.yearText}</div>
                <div class="lvl-title">${lvl.name}</div>
                <p>Gegner: <strong>${lvl.bossName}</strong></p>
            `;
            div.addEventListener('click', () => {
                this.ui.screenLvlSelect.classList.add('hidden');
                window.soundManager.initWebAudio();
                this.startLevel(idx);
            });
            grid.appendChild(div);
        });
    }

    // ====================================================
    // 30-SEKUNDEN CINEMATIC INTRO SYSTEM
    // ====================================================
    startCinematicIntro() {
        this.state = GAME_STATE.INTRO;
        this.ui.screenMenu.classList.add('hidden');
        this.ui.screenIntro.classList.remove('hidden');

        this.introChapters = [
            {
                time: 0,
                duration: 5.5,
                title: "KAPITEL 1: DER EINSTIEG AN DER GIBB (2022)",
                text: "Thenerean Selvabankumar betritt voller Hoffnung die Berufsschule GIBB Bern. Doch bereits an Tag 1 wartet Monika Schneider...",
                quote: "Pünktlichkeit ist oberste Gebot! Ohne Disziplin lernt man nicht!",
                img: "assets/sprites/photo_IMG_20260119_133741.jpg",
                clip: "monika_puenktlichkeit"
            },
            {
                time: 5.5,
                duration: 5.5,
                title: "KAPITEL 2: DIE 4-MINUTEN AUSREDE",
                text: "Der Zug hatte Verspätung! Thenerean versucht verzweifelt die 4 Minuten Verspätung zu erklären...",
                quote: "Entschuldigung Monika Schneider, ich bi 4 Minuten später!",
                img: "assets/sprites/photo_IMG_20260317_114652.jpg",
                clip: "thenerean_entschuldigung"
            },
            {
                time: 11.0,
                duration: 6.0,
                title: "KAPITEL 3: HERR ADAMS FRISBEE-HAGEL",
                text: "Im 2. Lehrjahr wartet die Sporthalle. Herr Adam kontrolliert die Absenzenliste mit fliegenden Frisbees...",
                quote: "Da hast du 20 Frisbees! Silvankumar, ist der Thenerean da?!",
                img: "assets/sprites/adam_full.png",
                clip: "adam_silvankumar"
            },
            {
                time: 17.0,
                duration: 6.0,
                title: "KAPITEL 4: DER LEGENDE-SCHREI",
                text: "Thenerean lässt sich nicht unterkriegen und brüllt seinen ikonischen Satz durch die gesamte GIBB Turnhalle!",
                quote: "HERR ADAM, ICH STAH DOCH DA!",
                img: "assets/sprites/thenerean_stah_full.png",
                clip: "thenerean_stah"
            },
            {
                time: 23.0,
                duration: 7.0,
                title: "KAPITEL 5: DIE ABSCHLUSSPRÜFUNG BEGINNT!",
                text: "Nach 4 harten Jahren, TukTuk-Fahrten in Sri Lanka und brennenden GPUs steht das finale EFZ-Diplom auf dem Spiel. KÄMPFE!",
                quote: "Da git es nüt z dischputiere! Gang auf die Platz!",
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

        // Check which chapter we are currently on
        const currentChap = this.introChapters.find(ch => this.introState.elapsed >= ch.time && this.introState.elapsed < ch.time + ch.duration);
        if (currentChap && this.introChapters.indexOf(currentChap) !== this.introState.currentStep) {
            this.introState.currentStep = this.introChapters.indexOf(currentChap);
            this.ui.introStepTitle.textContent = currentChap.title;
            this.ui.introSpeechText.textContent = currentChap.text;
            this.ui.introQuote.textContent = `"${currentChap.quote}"`;
            this.ui.introImg.src = currentChap.img;
            if (currentChap.clip) {
                window.soundManager.playClip(currentChap.clip);
            }
        }

        if (this.introState.elapsed >= this.introState.totalDuration) {
            this.skipIntro();
        }
    }

    skipIntro() {
        this.introState.active = false;
        this.ui.screenIntro.classList.add('hidden');
        this.startLevel(0);
    }

    // ====================================================
    // LEVEL START & GAMEPLAY
    // ====================================================
    startLevel(index) {
        this.currentLevelIndex = index;
        this.level = LEVELS_CONFIG[index];

        const groundPos = canvas.height * 0.72;
        this.player.groundY = groundPos;
        this.player.x = 100;
        this.player.y = groundPos - this.player.h;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.hp = 100;
        this.player.megaEnergy = 100;
        this.player.isGrounded = true;
        this.player.invulnerableTime = 0;
        this.player.banterTimer = 220;

        // Reset Camera / World (NO AUTO-SCROLLING!)
        this.worldDistance = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.boss = null;
        this.duoPartner = null;

        // UI Reset
        this.ui.screenMenu.classList.add('hidden');
        this.ui.screenIntro.classList.add('hidden');
        this.ui.screenWin.classList.add('hidden');
        this.ui.screenLose.classList.add('hidden');
        this.ui.screenVictory.classList.add('hidden');
        this.ui.dialogueBox.classList.add('hidden');
        this.ui.bar.classList.remove('hidden');

        this.ui.yearBadge.textContent = this.level.yearText;
        this.ui.lvlName.textContent = this.level.name;
        this.updateBars();

        // Music: Normal running volume
        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playMusicForLevel(index);

        this.generateLevelObstacles();
        this.state = GAME_STATE.RUNNING;
    }

    generateLevelObstacles() {
        const totalDist = this.level.targetDistance;
        let x = 700; // Leave first 700px calm and clear to test attacks!
        while (x < totalDist - 350) {
            x += 240 + Math.random() * 260;
            const type = this.level.obstacleTypes[Math.floor(Math.random() * this.level.obstacleTypes.length)];
            this.obstacles.push({
                x: x,
                y: this.player.groundY - 50,
                w: 52,
                h: 52,
                type: type,
                cleared: false
            });

            if (Math.random() > 0.35) {
                const cType = this.level.collectibleTypes[Math.floor(Math.random() * this.level.collectibleTypes.length)];
                this.collectibles.push({
                    x: x + 90,
                    y: this.player.groundY - 120 - Math.random() * 70,
                    w: 40,
                    h: 40,
                    type: cType,
                    collected: false
                });
            }
        }
    }

    // ATTACK 1: Straight Ahead Gesetzestext (vy = 0)
    playerAttackLawBook() {
        this.projectiles.push({
            x: this.player.x + 60,
            y: this.player.y + 35,
            vx: 14.0,
            vy: 0.0,
            w: 38,
            h: 38,
            type: 'law_book',
            isPlayer: true,
            damage: 28,
            rotation: 0
        });

        window.soundManager.playThrow();

        // Muzzle dust
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.player.x + 65,
                y: this.player.y + 35,
                vx: 3 + Math.random() * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 15,
                maxLife: 15,
                color: '#3498db',
                size: 4
            });
        }
    }

    // ATTACK 2: "ICH STAH DOCH DA!" Mega Energy Shockwave
    playerAttackMegaShout() {
        if (this.player.megaEnergy < 40) {
            this.addFloatingText("Energie lädt auf!", this.player.x, this.player.y - 15, '#e74c3c');
            return;
        }

        this.player.megaEnergy -= 40;
        this.updateBars();

        this.screenShake = 12;
        window.soundManager.playMegaBeam();
        window.soundManager.playClip('thenerean_stah');
        this.showMemePopup("HERR ADAM, ICH STAH DOCH DA!");

        this.projectiles.push({
            x: this.player.x + 70,
            y: this.player.y + 15,
            vx: 16.0,
            vy: 0.0,
            w: 72,
            h: 64,
            type: 'mega_beam',
            isPlayer: true,
            damage: 75,
            rotation: 0
        });

        for (let i = 0; i < 35; i++) {
            const angle = (Math.PI * 2 * i) / 35;
            this.particles.push({
                x: this.player.x + 50,
                y: this.player.y + 40,
                vx: Math.cos(angle) * 9,
                vy: Math.sin(angle) * 9,
                life: 25,
                maxLife: 25,
                color: '#ffd32a',
                size: 8
            });
        }
    }

    playerJump() {
        if (this.player.isGrounded) {
            this.player.vy = this.player.jumpPower;
            this.player.isGrounded = false;
            window.soundManager.playJump();
        }
    }

    triggerPreBossEncounter() {
        this.state = GAME_STATE.PRE_BOSS_WALK;

        // Boss encounter: Mute / silence background music so voices are crystal clear!
        window.soundManager.setMusicQuietMode(true);

        const groundPos = this.player.groundY;
        const isDuo = this.level.bossType === 'duo';

        this.boss = {
            name: this.level.bossName,
            type: this.level.bossType,
            sprite: this.level.bossSprite,
            avatar: this.level.bossAvatar,
            x: canvas.width * 0.75,
            y: groundPos - 120,
            w: 90,
            h: 125,
            hp: this.level.bossHP,
            maxHp: this.level.bossHP,
            attackTimer: 60,
            moveDir: -1,
            hitFlash: 0,
            banterTimer: 100
        };

        if (isDuo) {
            this.duoPartner = {
                name: "Herr Adam",
                sprite: 'assets/sprites/adam_sprite.png',
                avatar: 'assets/sprites/adam_avatar.png',
                x: canvas.width * 0.85,
                y: groundPos - 120,
                w: 90,
                h: 125,
                hp: 180,
                maxHp: 180,
                attackTimer: 85,
                moveDir: 1,
                hitFlash: 0
            };
        }
    }

    startPreBossDialogue() {
        this.state = GAME_STATE.PRE_BOSS_DIALOGUE;
        const encounter = this.level.preBossEncounter;

        this.dialogueQueue = [
            {
                speaker: encounter.speaker,
                avatar: encounter.avatar,
                text: encounter.text,
                clip: encounter.clip
            },
            {
                speaker: "Thenerean Selvabankumar",
                avatar: "assets/sprites/thenerean_avatar.png",
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
                this.showMemePopup(next.text);
            }
        } else {
            this.ui.dialogueBox.classList.add('hidden');
            this.state = GAME_STATE.BOSS_FIGHT;
            this.screenShake = 16;
            this.addFloatingText("KAMPF BEGINNT!", canvas.width / 2, 220, '#ff4757', 32);
        }
    }

    showMemePopup(text) {
        this.ui.memeText.textContent = text;
        this.ui.memePopup.classList.remove('hidden');
        clearTimeout(this.memeTimeout);
        this.memeTimeout = setTimeout(() => {
            this.ui.memePopup.classList.add('hidden');
        }, 3200);
    }

    addFloatingText(text, x, y, color = '#ffd32a', size = 18) {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            size: size,
            vy: -1.6,
            life: 60,
            maxLife: 60
        });
    }

    update(dt) {
        if (this.state === GAME_STATE.INTRO) {
            this.updateCinematicIntro(dt);
            return;
        }

        this.elapsedSeconds += dt;
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = Math.floor(this.elapsedSeconds % 60);
        this.ui.timeVal.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Screen shake decay
        if (this.screenShake > 0) this.screenShake *= 0.88;
        if (this.screenShake < 0.2) this.screenShake = 0;

        // Mega energy passive recharge
        if (this.player.megaEnergy < this.player.maxMegaEnergy) {
            this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 0.15);
            this.updateBars();
        }

        if (this.state === GAME_STATE.RUNNING) {
            this.updateRunning(dt);
        } else if (this.state === GAME_STATE.PRE_BOSS_WALK) {
            this.updatePreBossWalk(dt);
        } else if (this.state === GAME_STATE.BOSS_FIGHT) {
            this.updateBossFight(dt);
        }

        if (this.player.invulnerableTime > 0) this.player.invulnerableTime--;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.life--;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    // RUNNING UPDATE - NO AUTO-SCROLLING!
    updateRunning(dt) {
        // Player moves ONLY when pressing keys
        if (this.keys['arrowright'] || this.keys['d']) {
            this.player.vx = this.player.speed;
        } else if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.vx = -this.player.speed * 0.75;
        } else {
            this.player.vx = 0;
        }

        this.player.x += this.player.vx;
        if (this.player.x < 30) this.player.x = 30;

        // CAMERA ONLY ADVANCES WHEN PLAYER RUNS FORWARD PAST 35% OF SCREEN!
        const scrollThreshold = canvas.width * 0.35;
        if (this.player.x > scrollThreshold && this.player.vx > 0) {
            const advance = this.player.x - scrollThreshold;
            this.player.x = scrollThreshold;
            this.worldDistance += advance;
        }

        // Gravity
        this.player.y += this.player.vy;
        this.player.vy += 0.65;
        if (this.player.y >= this.player.groundY - this.player.h) {
            this.player.y = this.player.groundY - this.player.h;
            this.player.vy = 0;
            this.player.isGrounded = true;
        }

        // Progress
        const prog = Math.min(100, (this.worldDistance / this.level.targetDistance) * 100);
        this.ui.progBar.style.width = `${prog}%`;

        // Check if reached boss
        if (this.worldDistance >= this.level.targetDistance) {
            this.triggerPreBossEncounter();
            return;
        }

        // Check Obstacles & trigger Random Sound when successfully passed!
        for (let obs of this.obstacles) {
            const screenX = obs.x - this.worldDistance;
            if (screenX > -100 && screenX < canvas.width + 100) {
                // Collision
                if (this.checkCollision(this.player.x, this.player.y, this.player.w, this.player.h, screenX, obs.y, obs.w, obs.h)) {
                    this.onPlayerHit(14, obs.type);
                }
                // Cleared / passed safely behind player!
                if (!obs.cleared && screenX + obs.w < this.player.x) {
                    obs.cleared = true;
                    this.onObstacleDodged();
                }
            }
        }

        // Check Collectibles
        for (let col of this.collectibles) {
            if (col.collected) continue;
            const screenX = col.x - this.worldDistance;
            if (screenX > -100 && screenX < canvas.width + 100) {
                if (this.checkCollision(this.player.x, this.player.y, this.player.w, this.player.h, screenX, col.y, col.w, col.h)) {
                    col.collected = true;
                    this.onCollectItem(col.type);
                }
            }
        }

        this.updateProjectiles();
    }

    onObstacleDodged() {
        this.addFloatingText("Ausgewichen! ★", this.player.x, this.player.y - 20, '#2ed573', 16);
        // Play random satisfying Thenerean quote
        const dodgeClips = ['thenerean_stah', 'thenerean_254', 'thenerean_selber_bankomat'];
        if (Math.random() > 0.4) {
            const clip = dodgeClips[Math.floor(Math.random() * dodgeClips.length)];
            window.soundManager.playClip(clip);
        }
    }

    updatePreBossWalk(dt) {
        const targetX = canvas.width * 0.38;
        if (this.player.x < targetX) {
            this.player.x += 4.0;
        } else {
            this.startPreBossDialogue();
        }

        this.player.y += this.player.vy;
        this.player.vy += 0.65;
        if (this.player.y >= this.player.groundY - this.player.h) {
            this.player.y = this.player.groundY - this.player.h;
            this.player.vy = 0;
            this.player.isGrounded = true;
        }
    }

    updateBossFight(dt) {
        // Player Controls in arena
        if (this.keys['arrowright'] || this.keys['d']) {
            this.player.vx = this.player.speed;
        } else if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.vx = -this.player.speed;
        } else {
            this.player.vx = 0;
        }

        this.player.x += this.player.vx;
        if (this.player.x < 30) this.player.x = 30;
        if (this.player.x > canvas.width - 100) this.player.x = canvas.width - 100;

        // Gravity
        this.player.y += this.player.vy;
        this.player.vy += 0.65;
        if (this.player.y >= this.player.groundY - this.player.h) {
            this.player.y = this.player.groundY - this.player.h;
            this.player.vy = 0;
            this.player.isGrounded = true;
        }

        // Boss logic
        if (this.boss) {
            if (this.boss.hitFlash > 0) this.boss.hitFlash--;

            this.boss.x += this.boss.moveDir * 3.0;
            if (this.boss.x < canvas.width * 0.45) this.boss.moveDir = 1;
            else if (this.boss.x > canvas.width - 120) this.boss.moveDir = -1;

            this.boss.attackTimer--;
            if (this.boss.attackTimer <= 0) {
                this.boss.attackTimer = 55 + Math.random() * 40;
                this.bossFireAttack(this.boss);
            }

            this.boss.banterTimer--;
            if (this.boss.banterTimer <= 0) {
                this.boss.banterTimer = 180 + Math.random() * 120;
                const line = this.level.bossLines[Math.floor(Math.random() * this.level.bossLines.length)];
                window.soundManager.playClip(line.clip);
                this.addFloatingText(`"${line.text}"`, this.boss.x - 20, this.boss.y - 15, '#ff4757', 16);
            }

            if (this.boss.hp <= 0 && (!this.duoPartner || this.duoPartner.hp <= 0)) {
                this.triggerLevelWin();
            }
        }

        // Duo Partner Logic (Level 6)
        if (this.duoPartner) {
            if (this.duoPartner.hitFlash > 0) this.duoPartner.hitFlash--;
            this.duoPartner.x += this.duoPartner.moveDir * 3.4;
            if (this.duoPartner.x < canvas.width * 0.5) this.duoPartner.moveDir = 1;
            else if (this.duoPartner.x > canvas.width - 100) this.duoPartner.moveDir = -1;

            this.duoPartner.attackTimer--;
            if (this.duoPartner.attackTimer <= 0) {
                this.duoPartner.attackTimer = 65 + Math.random() * 45;
                this.bossFireAttack(this.duoPartner);
            }
        }

        this.updateProjectiles();
    }

    bossFireAttack(bossEntity) {
        const isAdam = bossEntity.name.includes("Adam");
        const type = isAdam ? 'frisbee' : 'red_card';

        this.projectiles.push({
            x: bossEntity.x,
            y: bossEntity.y + 40,
            vx: -9.0,
            vy: (this.player.y - bossEntity.y) * 0.018,
            w: 42,
            h: 28,
            isPlayer: false,
            type: type,
            damage: 20,
            rotation: 0
        });

        if (isAdam) {
            if (Math.random() > 0.4) window.soundManager.playClip('adam_20_frisbees');
        } else {
            if (Math.random() > 0.4) window.soundManager.playClip('monika_zspaet');
        }
    }

    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += 0.15;

            // Player hits boss
            if (p.isPlayer && this.boss && this.boss.hp > 0) {
                if (this.checkCollision(p.x, p.y, p.w, p.h, this.boss.x, this.boss.y, this.boss.w, this.boss.h)) {
                    this.boss.hp -= p.damage;
                    this.boss.hitFlash = 12;
                    this.screenShake = 6;
                    window.soundManager.playHit();
                    this.addFloatingText(`-${p.damage}`, this.boss.x + 20, this.boss.y, '#ff4757', 22);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // Player hits duo partner
            if (p.isPlayer && this.duoPartner && this.duoPartner.hp > 0) {
                if (this.checkCollision(p.x, p.y, p.w, p.h, this.duoPartner.x, this.duoPartner.y, this.duoPartner.w, this.duoPartner.h)) {
                    this.duoPartner.hp -= p.damage;
                    this.duoPartner.hitFlash = 12;
                    this.screenShake = 6;
                    window.soundManager.playHit();
                    this.addFloatingText(`-${p.damage}`, this.duoPartner.x + 20, this.duoPartner.y, '#ff4757', 22);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // Boss hits player
            if (!p.isPlayer) {
                if (this.checkCollision(p.x, p.y, p.w, p.h, this.player.x, this.player.y, this.player.w, this.player.h)) {
                    this.onPlayerHit(p.damage, p.type);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            if (p.x < -80 || p.x > canvas.width + 100 || p.y < -50 || p.y > canvas.height + 50) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    onPlayerHit(damage, reason) {
        if (this.player.invulnerableTime > 0) return;
        this.player.hp -= damage;
        this.player.invulnerableTime = 55;
        this.player.score = Math.max(1.0, +(this.player.score - 0.2).toFixed(1));
        this.screenShake = 12;
        this.updateBars();
        window.soundManager.playHit();

        this.addFloatingText(`-${damage} HP!`, this.player.x + 20, this.player.y, '#ff4757', 20);

        for (let i = 0; i < 14; i++) {
            this.particles.push({
                x: this.player.x + 35,
                y: this.player.y + 35,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 20,
                maxLife: 20,
                color: '#ff4757',
                size: 5
            });
        }

        if (this.player.hp <= 0) {
            this.triggerGameOver();
        }
    }

    onCollectItem(type) {
        window.soundManager.playCollect();
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
        this.player.megaEnergy = Math.min(this.player.maxMegaEnergy, this.player.megaEnergy + 35);
        this.player.score = Math.min(6.0, +(this.player.score + 0.1).toFixed(1));
        this.updateBars();

        this.addFloatingText("+Kaffee & Energie!", this.player.x + 20, this.player.y, '#2ed573', 18);
    }

    updateBars() {
        this.ui.hpBar.style.width = `${Math.max(0, this.player.hp)}%`;
        this.ui.energyBar.style.width = `${Math.max(0, (this.player.megaEnergy / this.player.maxMegaEnergy) * 100)}%`;
        this.ui.scoreVal.textContent = this.player.score.toFixed(1);
    }

    triggerLevelWin() {
        this.state = GAME_STATE.LEVEL_WIN;
        this.ui.winGrade.textContent = this.player.score.toFixed(1);
        this.ui.winHp.textContent = `${this.player.hp}%`;
        this.ui.screenWin.classList.remove('hidden');
        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playClip('thenerean_stah');
    }

    triggerGameOver() {
        this.state = GAME_STATE.GAME_OVER;
        this.ui.screenLose.classList.remove('hidden');
        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playClip('monika_zspaet');
    }

    triggerVictory() {
        this.state = GAME_STATE.VICTORY;
        this.ui.screenVictory.classList.remove('hidden');
        window.soundManager.setMusicQuietMode(false);
        window.soundManager.playMusic('assets/music/Sirünän_Reign.mp3');
        window.soundManager.playClip('thenerean_stah');
    }

    checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 &&
               x1 + w1 > x2 &&
               y1 < y2 + h2 &&
               y1 + h1 > y2;
    }

    // ====================================================
    // FULLSCREEN DYNAMIC CANVAS RENDER
    // ====================================================
    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply screen shake
        ctx.save();
        if (this.screenShake > 0) {
            const rx = (Math.random() - 0.5) * this.screenShake;
            const ry = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(rx, ry);
        }

        // Draw Environment & Background
        this.drawEnvironment();

        // Ground
        this.drawGround();

        // Obstacles & Collectibles
        if (this.state === GAME_STATE.RUNNING) {
            this.drawObstacles();
            this.drawCollectibles();
        }

        // Projectiles
        this.drawProjectiles();

        // Bosses
        if (this.boss && (this.state === GAME_STATE.PRE_BOSS_WALK || this.state === GAME_STATE.PRE_BOSS_DIALOGUE || this.state === GAME_STATE.BOSS_FIGHT)) {
            this.drawBoss(this.boss);
            if (this.duoPartner) this.drawBoss(this.duoPartner);
        }

        // Player
        this.drawPlayer();

        // Particles & Floating Texts
        this.drawParticles();
        this.drawFloatingTexts();

        ctx.restore();

        // HUD overlay
        if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT) {
            this.drawMegaAttackHUD();
        }
    }

    drawEnvironment() {
        const bg = this.level.bgType;
        const dist = this.worldDistance;
        const groundY = this.player.groundY;

        if (bg === 'classroom') {
            this.drawClassroom(dist, groundY);
        } else if (bg.includes('gym')) {
            this.drawGymTurnhalle(dist, groundY);
        } else if (bg === 'server_room') {
            this.drawServerRoom(dist, groundY);
        } else {
            this.drawGibbVorplatz(dist, groundY);
        }
    }

    drawClassroom(dist, groundY) {
        ctx.fillStyle = '#243342';
        ctx.fillRect(0, 0, canvas.width, groundY);

        // Huge Blackboard with chalk text
        const bw = Math.min(800, canvas.width * 0.7);
        const bx = (canvas.width - bw) / 2;
        ctx.fillStyle = '#1b3223';
        ctx.fillRect(bx, 80, bw, 220);
        ctx.strokeStyle = '#c8a064';
        ctx.lineWidth = 8;
        ctx.strokeRect(bx, 80, bw, 220);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillText("GIBB INFORMATIK - MODUL 100", bx + 30, 125);
        ctx.font = '17px "Courier New", monospace';
        ctx.fillText("• Pünktlichkeit ist oberste Gebot!", bx + 30, 165);
        ctx.fillText("• Wer 4 Minuten zu spät ist, muss nach Hause!", bx + 30, 200);
        ctx.fillText("• Prüfungsstoff: BGP, OSPF, DHCP & Gesetzestext", bx + 30, 235);

        // Clock on the wall
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(canvas.width - 120, 120, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText("08:04", canvas.width - 140, 125);
    }

    drawGymTurnhalle(dist, groundY) {
        ctx.fillStyle = '#bf4f00';
        ctx.fillRect(0, 0, canvas.width, groundY);

        // Wall Bars (Sprossenwände)
        ctx.fillStyle = '#d35400';
        for (let x = 40; x < canvas.width; x += 150) {
            ctx.fillRect(x, 70, 110, groundY - 100);
            ctx.strokeStyle = '#8e3a00';
            ctx.lineWidth = 3;
            for (let y = 90; y < groundY - 110; y += 26) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 110, y);
                ctx.stroke();
            }
        }

        // Basketball Backboard & Hoop
        const hx = canvas.width - 220;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, 110, 110, 80);
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 4;
        ctx.strokeRect(hx + 20, 130, 70, 50);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(hx + 30, 190, 50, 6);

        // Scoreboard
        ctx.fillStyle = '#111';
        ctx.fillRect(canvas.width / 2 - 160, 60, 320, 65);
        ctx.strokeStyle = '#ffd32a';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width / 2 - 160, 60, 320, 65);
        ctx.fillStyle = '#ff4757';
        ctx.font = 'bold 22px "Courier New"';
        ctx.fillText("ADAM: 20 | THENEREAN: 0", canvas.width / 2 - 140, 102);
    }

    drawServerRoom(dist, groundY) {
        ctx.fillStyle = '#0f1420';
        ctx.fillRect(0, 0, canvas.width, groundY);

        for (let i = 0; i < 10; i++) {
            const rx = ((i * 180) - (dist * 0.25) % 180);
            ctx.fillStyle = '#182032';
            ctx.fillRect(rx, 80, 130, groundY - 80);
            ctx.strokeStyle = '#27334d';
            ctx.strokeRect(rx, 80, 130, groundY - 80);

            for (let led = 0; led < 8; led++) {
                ctx.fillStyle = ((Date.now() + i * 200 + led * 120) % 600 > 300) ? '#2ed573' : '#ff4757';
                ctx.fillRect(rx + 20, 110 + led * 45, 10, 10);
                ctx.fillStyle = '#3498db';
                ctx.fillRect(rx + 40, 110 + led * 45, 70, 5);
            }
        }

        ctx.fillStyle = '#ff4757';
        ctx.font = 'bold 24px Arial';
        ctx.fillText("⚠️ ACHTUNG: GRAFIKKARTE FEHLER IM SERVERRAUM ⚠️", canvas.width / 2 - 320, 50);
    }

    drawGibbVorplatz(dist, groundY) {
        const grad = ctx.createLinearGradient(0, 0, 0, groundY);
        grad.addColorStop(0, '#151824');
        grad.addColorStop(1, '#2c3347');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, groundY);

        for (let i = 0; i < 7; i++) {
            const bx = ((i * 260) - (dist * 0.2) % 260) - 80;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.fillRect(bx, 100, 200, groundY - 100);
            ctx.fillStyle = 'rgba(255, 220, 100, 0.12)';
            ctx.fillRect(bx + 30, 140, 60, 70);
            ctx.fillRect(bx + 110, 140, 60, 70);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText("GIBB BERN - BERUFSSCHULE", canvas.width / 2 - 280, 70);
    }

    drawGround() {
        const groundY = this.player.groundY;
        const groundH = canvas.height - groundY;

        if (this.level.bgType.includes('gym')) {
            ctx.fillStyle = '#c79807';
            ctx.fillRect(0, groundY, canvas.width, groundH);

            ctx.strokeStyle = '#ff4757';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, groundY + 50);
            ctx.lineTo(canvas.width, groundY + 50);
            ctx.stroke();

            ctx.strokeStyle = '#1e90ff';
            ctx.beginPath();
            ctx.moveTo(0, groundY + 100);
            ctx.lineTo(canvas.width, groundY + 100);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#171a24';
            ctx.fillRect(0, groundY, canvas.width, groundH);

            ctx.strokeStyle = '#272d3f';
            ctx.lineWidth = 2;
            const groundOffset = (this.worldDistance) % 70;
            for (let x = -groundOffset; x < canvas.width; x += 70) {
                ctx.beginPath();
                ctx.moveTo(x, groundY);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, groundY);
            ctx.lineTo(canvas.width, groundY);
            ctx.stroke();
        }
    }

    drawPlayer() {
        if (this.player.invulnerableTime % 4 > 2) return;

        const p = this.player;
        const img = images.thenerean_hero;
        if (img && img.complete) {
            ctx.drawImage(img, p.x, p.y, p.w, p.h);
        } else {
            ctx.fillStyle = '#2ed573';
            ctx.fillRect(p.x, p.y, p.w, p.h);
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(p.x + p.w / 2, p.groundY + 2, p.w / 2, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffd32a';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Thenerean", p.x + p.w / 2, p.y - 12);
        ctx.textAlign = 'left';
    }

    drawBoss(bossEntity) {
        const isAdam = bossEntity.name.includes("Adam");
        const img = images[isAdam ? 'adam_sprite' : (bossEntity.type === 'tuktuk_gpu' ? 'tuktuk_sprite' : 'monika_sprite')];

        if (bossEntity.hitFlash > 0) {
            ctx.filter = 'brightness(2.2) contrast(1.5)';
        }

        if (img && img.complete) {
            ctx.drawImage(img, bossEntity.x, bossEntity.y, bossEntity.w, bossEntity.h);
        } else {
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(bossEntity.x, bossEntity.y, bossEntity.w, bossEntity.h);
        }
        ctx.filter = 'none';

        // Boss Health Bar
        const barW = 120;
        const barH = 12;
        const barX = bossEntity.x + (bossEntity.w - barW) / 2;
        const barY = bossEntity.y - 24;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(barX, barY, (bossEntity.hp / bossEntity.maxHp) * barW, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX, barY, barW, barH);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bossEntity.name, bossEntity.x + bossEntity.w / 2, barY - 7);
        ctx.textAlign = 'left';
    }

    drawObstacles() {
        for (let obs of this.obstacles) {
            const screenX = obs.x - this.worldDistance;
            if (screenX > -70 && screenX < canvas.width + 70) {
                if (obs.type === 'frisbee') {
                    if (images.frisbee.complete) {
                        ctx.drawImage(images.frisbee, screenX, obs.y + 12, obs.w, obs.h * 0.65);
                    }
                } else if (obs.type === 'basketball') {
                    if (images.basketball.complete) {
                        ctx.drawImage(images.basketball, screenX, obs.y + 10, 42, 42);
                    }
                } else if (obs.type === 'warning_letter') {
                    ctx.fillStyle = '#ff4757';
                    ctx.fillRect(screenX, obs.y, obs.w, obs.h);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.fillText("VERW.", screenX + 6, obs.y + 30);
                } else {
                    ctx.fillStyle = '#e67e22';
                    ctx.beginPath();
                    ctx.moveTo(screenX + obs.w / 2, obs.y);
                    ctx.lineTo(screenX + obs.w, obs.y + obs.h);
                    ctx.lineTo(screenX, obs.y + obs.h);
                    ctx.fill();
                }
            }
        }
    }

    drawCollectibles() {
        for (let col of this.collectibles) {
            if (col.collected) continue;
            const screenX = col.x - this.worldDistance;
            if (screenX > -70 && screenX < canvas.width + 70) {
                const img = col.type.includes('coffee') ? images.item_coffee : images.item_gesetz;
                if (img && img.complete) {
                    ctx.drawImage(img, screenX, col.y, col.w, col.h);
                } else {
                    ctx.fillStyle = '#ffd32a';
                    ctx.fillRect(screenX, col.y, col.w, col.h);
                }
            }
        }
    }

    drawProjectiles() {
        for (let p of this.projectiles) {
            ctx.save();
            ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
            ctx.rotate(p.rotation);

            if (p.isPlayer) {
                if (p.type === 'mega_beam') {
                    if (images.projectile_mega.complete) {
                        ctx.drawImage(images.projectile_mega, -p.w / 2, -p.h / 2, p.w, p.h);
                    } else {
                        ctx.fillStyle = '#ffd32a';
                        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    }
                } else {
                    if (images.item_gesetz.complete) {
                        ctx.drawImage(images.item_gesetz, -p.w / 2, -p.h / 2, p.w, p.h);
                    } else {
                        ctx.fillStyle = '#3498db';
                        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    }
                }
            } else {
                const img = p.type === 'frisbee' ? images.frisbee : images.red_card;
                if (img && img.complete) {
                    ctx.drawImage(img, -p.w / 2, -p.h / 2, p.w, p.h);
                } else {
                    ctx.fillStyle = '#ff4757';
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                }
            }
            ctx.restore();
        }
    }

    drawParticles() {
        for (let p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1.0;
    }

    drawFloatingTexts() {
        for (let ft of this.floatingTexts) {
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${ft.size}px sans-serif`;
            ctx.globalAlpha = ft.life / ft.maxLife;
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1.0;
    }

    drawMegaAttackHUD() {
        const x = 30;
        const y = canvas.height - 70;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 5, y - 28, 280, 54);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.strokeRect(x - 5, y - 28, 280, 54);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText("[E] Gesetzestext  |  [Q/Shift] MEGA-SCHOCK", x, y - 10);

        const barW = 260;
        const barH = 10;
        ctx.fillStyle = '#222';
        ctx.fillRect(x, y - 2, barW, barH);
        ctx.fillStyle = this.player.megaEnergy >= 40 ? '#00e676' : '#f39c12';
        ctx.fillRect(x, y - 2, (this.player.megaEnergy / this.player.maxMegaEnergy) * barW, barH);
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }
}

window.addEventListener('load', () => {
    window.game = new Game();
});
