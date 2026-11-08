/**
 * Thenerean Selvabankumar - Main Game Engine
 * 2D Action Platformer & Runner with Dialogue, Meme Sound Triggers & Boss Battles
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
    item_diplom: 'assets/sprites/item_diplom.png'
};

let loadedImagesCount = 0;
const totalImages = Object.keys(imageSources).length;
for (const [key, src] of Object.entries(imageSources)) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        loadedImagesCount++;
    };
    images[key] = img;
}

// Game State
const GAME_STATE = {
    MENU: 0,
    DIALOGUE: 1,
    RUNNING: 2,
    BOSS_FIGHT: 3,
    LEVEL_WIN: 4,
    GAME_OVER: 5,
    VICTORY: 6
};

class Game {
    constructor() {
        this.state = GAME_STATE.MENU;
        this.currentLevelIndex = 0;
        this.level = LEVELS_CONFIG[0];

        // Player
        this.player = {
            x: 100,
            y: 350,
            w: 64,
            h: 75,
            vx: 0,
            vy: 0,
            speed: 5.5,
            jumpPower: -13,
            groundY: 380,
            isGrounded: true,
            hp: 100,
            maxHp: 100,
            score: 5.0, // Swiss grade system: 1.0 - 6.0
            shoutCooldown: 0,
            invulnerableTime: 0
        };

        // Camera / World
        this.worldDistance = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.projectiles = []; // Player books or Adam frisbees
        this.particles = [];

        // Boss
        this.boss = null;

        // Input
        this.keys = {};
        this.initInput();

        // Dialogue System
        this.activeDialogue = null;
        this.dialogueQueue = [];

        // Game Timer
        this.startTime = 0;
        this.elapsedSeconds = 0;

        // UI elements cache
        this.ui = {
            bar: document.getElementById('ui-bar'),
            hpBar: document.getElementById('hp-bar'),
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
            screenLvlSelect: document.getElementById('screen-level-select'),
            screenStory: document.getElementById('screen-story'),
            screenWin: document.getElementById('screen-win'),
            screenLose: document.getElementById('screen-lose'),
            screenVictory: document.getElementById('screen-victory'),
            winGrade: document.getElementById('win-grade'),
            winHp: document.getElementById('win-hp')
        };

        this.initUIEventListeners();

        // Animation Loop
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;

            if (this.state === GAME_STATE.DIALOGUE) {
                if (e.code === 'Space' || e.key === 'Enter') {
                    this.advanceDialogue();
                }
            } else if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT) {
                if (e.code === 'Space') {
                    this.playerJumpOrShout();
                }
                if (e.key.toLowerCase() === 'e') {
                    this.playerThrowBook();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        // Click on dialogue advances it
        document.getElementById('dialogue-box').addEventListener('click', () => {
            if (this.state === GAME_STATE.DIALOGUE) {
                this.advanceDialogue();
            }
        });
    }

    initUIEventListeners() {
        document.getElementById('btn-start').addEventListener('click', () => {
            window.soundManager.initWebAudio();
            this.startLevel(0);
        });

        document.getElementById('btn-level-select').addEventListener('click', () => {
            this.ui.screenMenu.classList.add('hidden');
            this.ui.screenLvlSelect.classList.remove('hidden');
        });

        document.getElementById('btn-close-lvl').addEventListener('click', () => {
            this.ui.screenLvlSelect.classList.add('hidden');
            this.ui.screenMenu.classList.remove('hidden');
        });

        document.querySelectorAll('.level-btn-card').forEach(card => {
            card.addEventListener('click', () => {
                const lvl = parseInt(card.dataset.level) - 1;
                this.ui.screenLvlSelect.classList.add('hidden');
                window.soundManager.initWebAudio();
                this.startLevel(lvl);
            });
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
            window.soundManager.playMenuMusic();
        });

        document.getElementById('btn-victory-restart').addEventListener('click', () => {
            this.ui.screenVictory.classList.add('hidden');
            this.ui.bar.classList.add('hidden');
            this.ui.screenMenu.classList.remove('hidden');
            this.state = GAME_STATE.MENU;
            window.soundManager.playMenuMusic();
        });

        document.getElementById('btn-sound-toggle').addEventListener('click', (e) => {
            const on = window.soundManager.toggleMute();
            e.target.textContent = on ? '🔊' : '🔇';
        });
    }

    startLevel(index) {
        this.currentLevelIndex = index;
        this.level = LEVELS_CONFIG[index];

        // Reset player
        this.player.x = 100;
        this.player.y = 350;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.hp = 100;
        this.player.isGrounded = true;
        this.player.shoutCooldown = 0;
        this.player.invulnerableTime = 0;

        this.worldDistance = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.projectiles = [];
        this.particles = [];
        this.boss = null;

        // UI update
        this.ui.screenMenu.classList.add('hidden');
        this.ui.screenWin.classList.add('hidden');
        this.ui.screenLose.classList.add('hidden');
        this.ui.screenVictory.classList.add('hidden');
        this.ui.bar.classList.remove('hidden');

        this.ui.yearBadge.textContent = this.level.yearText;
        this.ui.lvlName.textContent = this.level.name;
        this.updateBars();

        // Start music
        window.soundManager.playMusicForLevel(index + 1);

        // Prepopulate obstacles along level course
        this.generateLevelObstacles();

        // Play intro dialogue
        if (this.level.introDialogue) {
            this.showDialogue(this.level.introDialogue.speaker, this.level.introDialogue.avatar, this.level.introDialogue.text, this.level.introDialogue.clip);
        } else {
            this.state = GAME_STATE.RUNNING;
        }
    }

    generateLevelObstacles() {
        const totalDist = this.level.targetDistance;
        let x = 600;
        while (x < totalDist - 400) {
            x += 220 + Math.random() * 250;
            const type = this.level.obstacleTypes[Math.floor(Math.random() * this.level.obstacleTypes.length)];
            this.obstacles.push({
                x: x,
                y: 390,
                w: 48,
                h: 48,
                type: type,
                counted: false
            });

            // Occasional collectible
            if (Math.random() > 0.4) {
                const cType = this.level.collectibleTypes[Math.floor(Math.random() * this.level.collectibleTypes.length)];
                this.collectibles.push({
                    x: x + 80,
                    y: 310 - Math.random() * 60,
                    w: 36,
                    h: 36,
                    type: cType,
                    collected: false
                });
            }
        }
    }

    showDialogue(speaker, avatar, text, clipName = null) {
        this.state = GAME_STATE.DIALOGUE;
        this.activeDialogue = { speaker, avatar, text, clipName };
        this.ui.dialogueSpeaker.textContent = speaker;
        this.ui.dialogueAvatar.src = avatar;
        this.ui.dialogueText.textContent = `"${text}"`;
        this.ui.dialogueBox.classList.remove('hidden');

        if (clipName) {
            window.soundManager.playClip(clipName);
            this.showMemePopup(text);
        }
    }

    advanceDialogue() {
        this.ui.dialogueBox.classList.add('hidden');
        this.activeDialogue = null;
        if (this.boss) {
            this.state = GAME_STATE.BOSS_FIGHT;
        } else {
            this.state = GAME_STATE.RUNNING;
        }
    }

    showMemePopup(text) {
        this.ui.memeText.textContent = text;
        this.ui.memePopup.classList.remove('hidden');
        clearTimeout(this.memeTimeout);
        this.memeTimeout = setTimeout(() => {
            this.ui.memePopup.classList.add('hidden');
        }, 2800);
    }

    playerJumpOrShout() {
        if (this.player.isGrounded) {
            this.player.vy = this.player.jumpPower;
            this.player.isGrounded = false;
            window.soundManager.playJump();
        } else if (this.player.shoutCooldown <= 0) {
            // Air Shout: "HERR ADAM, ICH STAH DOCH DA!"
            this.player.shoutCooldown = 120; // 2 seconds cooldown
            window.soundManager.playClip('thenerean_stah');
            this.showMemePopup("HERR ADAM, ICH STAH DOCH DA!");
            this.createShockwave(this.player.x + 30, this.player.y + 35);
        }
    }

    playerThrowBook() {
        if (this.projectiles.length > 6) return;
        this.projectiles.push({
            x: this.player.x + 50,
            y: this.player.y + 20,
            vx: 10,
            vy: -2,
            w: 32,
            h: 32,
            isPlayer: true
        });
        window.soundManager.playThrow();
    }

    createShockwave(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 7,
                vy: Math.sin(angle) * 7,
                life: 30,
                maxLife: 30,
                color: '#ffd32a',
                size: 6
            });
        }
        // Repel or damage nearby boss/obstacles
        if (this.boss && Math.abs(this.boss.x - this.player.x) < 220) {
            this.boss.hp -= 20;
            this.boss.hitFlash = 10;
            window.soundManager.playHit();
        }
    }

    spawnBoss() {
        this.state = GAME_STATE.BOSS_FIGHT;
        this.boss = {
            name: this.level.bossName,
            type: this.level.bossType,
            sprite: this.level.bossSprite,
            avatar: this.level.bossAvatar,
            x: 750,
            y: 320,
            w: 80,
            h: 110,
            hp: this.level.bossHP,
            maxHp: this.level.bossHP,
            attackTimer: 60,
            moveDir: -1,
            hitFlash: 0
        };

        // Trigger boss line
        const line = this.level.bossLines[0];
        this.showDialogue(this.boss.name, this.boss.avatar, line.text, line.clip);
    }

    update(dt) {
        this.elapsedSeconds += dt;
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = Math.floor(this.elapsedSeconds % 60);
        this.ui.timeVal.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (this.state === GAME_STATE.RUNNING) {
            this.updateRunning(dt);
        } else if (this.state === GAME_STATE.BOSS_FIGHT) {
            this.updateBossFight(dt);
        }

        // Always update particles and cooldowns
        if (this.player.shoutCooldown > 0) this.player.shoutCooldown--;
        if (this.player.invulnerableTime > 0) this.player.invulnerableTime--;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateRunning(dt) {
        // Player Horizontal Movement
        if (this.keys['arrowright'] || this.keys['d']) {
            this.player.vx = this.player.speed;
        } else if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.vx = -this.player.speed * 0.7;
        } else {
            this.player.vx = 0;
        }

        this.player.x += this.player.vx;
        if (this.player.x < 20) this.player.x = 20;

        // Auto scrolling speed when moving right
        let worldAdvance = 3.5;
        if (this.player.x > 300) {
            const overflow = this.player.x - 300;
            this.player.x = 300;
            worldAdvance += overflow;
        }
        this.worldDistance += worldAdvance;

        // Gravity & Vertical physics
        this.player.y += this.player.vy;
        this.player.vy += 0.65; // Gravity
        if (this.player.y >= this.player.groundY - this.player.h) {
            this.player.y = this.player.groundY - this.player.h;
            this.player.vy = 0;
            this.player.isGrounded = true;
        }

        // Progress bar
        const prog = Math.min(100, (this.worldDistance / this.level.targetDistance) * 100);
        this.ui.progBar.style.width = `${prog}%`;

        // Check if reached boss zone
        if (this.worldDistance >= this.level.targetDistance) {
            this.spawnBoss();
            return;
        }

        // Check Obstacles Collision
        for (let obs of this.obstacles) {
            const screenX = obs.x - this.worldDistance;
            if (screenX > -100 && screenX < 1000) {
                if (this.checkCollision(this.player.x, this.player.y, this.player.w, this.player.h, screenX, obs.y, obs.w, obs.h)) {
                    this.onPlayerHit(15, obs.type);
                }
            }
        }

        // Check Collectibles Collision
        for (let col of this.collectibles) {
            if (col.collected) continue;
            const screenX = col.x - this.worldDistance;
            if (screenX > -100 && screenX < 1000) {
                if (this.checkCollision(this.player.x, this.player.y, this.player.w, this.player.h, screenX, col.y, col.w, col.h)) {
                    col.collected = true;
                    this.onCollectItem(col.type);
                }
            }
        }

        // Update Projectiles
        this.updateProjectiles();
    }

    updateBossFight(dt) {
        // Player controls in boss arena
        if (this.keys['arrowright'] || this.keys['d']) {
            this.player.vx = this.player.speed;
        } else if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.vx = -this.player.speed;
        } else {
            this.player.vx = 0;
        }

        this.player.x += this.player.vx;
        if (this.player.x < 30) this.player.x = 30;
        if (this.player.x > 880) this.player.x = 880;

        // Gravity
        this.player.y += this.player.vy;
        this.player.vy += 0.65;
        if (this.player.y >= this.player.groundY - this.player.h) {
            this.player.y = this.player.groundY - this.player.h;
            this.player.vy = 0;
            this.player.isGrounded = true;
        }

        // Boss Logic
        if (this.boss) {
            if (this.boss.hitFlash > 0) this.boss.hitFlash--;

            // Boss hover / patrol
            this.boss.x += this.boss.moveDir * 2.2;
            if (this.boss.x < 450) {
                this.boss.moveDir = 1;
            } else if (this.boss.x > 840) {
                this.boss.moveDir = -1;
            }

            // Boss attacks
            this.boss.attackTimer--;
            if (this.boss.attackTimer <= 0) {
                this.boss.attackTimer = 70 + Math.random() * 40;
                this.bossFireAttack();
            }

            // Check Boss Defeated
            if (this.boss.hp <= 0) {
                this.triggerLevelWin();
            }
        }

        // Update Projectiles
        this.updateProjectiles();
    }

    bossFireAttack() {
        if (!this.boss) return;
        // Shoot Frisbee or warning letter
        const isFrisbee = this.level.bossType === 'adam' || Math.random() > 0.5;
        this.projectiles.push({
            x: this.boss.x,
            y: this.boss.y + 40,
            vx: -7.5,
            vy: (this.player.y - this.boss.y) * 0.02,
            w: 36,
            h: 24,
            isPlayer: false,
            type: isFrisbee ? 'frisbee' : 'letter'
        });

        if (isFrisbee) {
            window.soundManager.playClip('adam_frisbee');
            this.showMemePopup("DA HAST DU 20 FRISBEES!");
        } else {
            window.soundManager.playClip('monika_gang_platz');
            this.showMemePopup("GANG AUF DIE PLATZ!");
        }
    }

    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;

            // Player projectile hits boss
            if (p.isPlayer && this.boss) {
                if (this.checkCollision(p.x, p.y, p.w, p.h, this.boss.x, this.boss.y, this.boss.w, this.boss.h)) {
                    this.boss.hp -= 25;
                    this.boss.hitFlash = 12;
                    window.soundManager.playHit();
                    this.projectiles.splice(i, 1);

                    // Boss voice response
                    if (Math.random() > 0.6) {
                        window.soundManager.playClip('thenerean_gesetz');
                    }
                    continue;
                }
            }

            // Boss projectile hits player
            if (!p.isPlayer) {
                if (this.checkCollision(p.x, p.y, p.w, p.h, this.player.x, this.player.y, this.player.w, this.player.h)) {
                    this.onPlayerHit(18, 'boss_attack');
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // Out of bounds
            if (p.x < -50 || p.x > 1050 || p.y < -50 || p.y > 600) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    onPlayerHit(damage, reason) {
        if (this.player.invulnerableTime > 0) return;
        this.player.hp -= damage;
        this.player.invulnerableTime = 60; // 1 sec invulnerable
        this.player.score = Math.max(1.0, +(this.player.score - 0.2).toFixed(1));
        this.updateBars();
        window.soundManager.playHit();

        // Screen shake or blood particles
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: this.player.x + 30,
                y: this.player.y + 30,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 20,
                maxLife: 20,
                color: '#ff4757',
                size: 5
            });
        }

        // Random angry voice clip trigger
        if (Math.random() > 0.5) {
            window.soundManager.playClip('monika_puenktlichkeit');
            this.showMemePopup("PÜNKTLICHKEIT IST OBERSTE GEBOT!");
        }

        if (this.player.hp <= 0) {
            this.triggerGameOver();
        }
    }

    onCollectItem(type) {
        window.soundManager.playCollect();
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
        this.player.score = Math.min(6.0, +(this.player.score + 0.1).toFixed(1));
        this.updateBars();

        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x + 30,
                y: this.player.y + 20,
                vx: (Math.random() - 0.5) * 5,
                vy: -Math.random() * 5,
                life: 25,
                maxLife: 25,
                color: '#2ed573',
                size: 4
            });
        }
    }

    updateBars() {
        this.ui.hpBar.style.width = `${Math.max(0, this.player.hp)}%`;
        this.ui.scoreVal.textContent = this.player.score.toFixed(1);
    }

    triggerLevelWin() {
        this.state = GAME_STATE.LEVEL_WIN;
        this.ui.winGrade.textContent = this.player.score.toFixed(1);
        this.ui.winHp.textContent = `${this.player.hp}%`;
        this.ui.screenWin.classList.remove('hidden');
        window.soundManager.playClip('thenerean_stah');
    }

    triggerGameOver() {
        this.state = GAME_STATE.GAME_OVER;
        this.ui.screenLose.classList.remove('hidden');
        window.soundManager.playClip('monika_gang_platz');
    }

    triggerVictory() {
        this.state = GAME_STATE.VICTORY;
        this.ui.screenVictory.classList.remove('hidden');
        window.soundManager.playMusic('assets/music/Sirünän_Reign.mp3');
        window.soundManager.playClip('thenerean_stah');
    }

    checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 &&
               x1 + w1 > x2 &&
               y1 < y2 + h2 &&
               y1 + h1 > y2;
    }

    // RENDER FUNCTIONS
    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        this.drawBackground();

        // Floor / Ground
        this.drawGround();

        // Obstacles & Collectibles
        if (this.state === GAME_STATE.RUNNING) {
            this.drawObstacles();
            this.drawCollectibles();
        }

        // Projectiles
        this.drawProjectiles();

        // Boss
        if (this.boss && (this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DIALOGUE)) {
            this.drawBoss();
        }

        // Player
        this.drawPlayer();

        // Particles
        this.drawParticles();
    }

    drawBackground() {
        const dist = this.worldDistance;
        // Parallax Bern / GIBB skyline
        const grad = ctx.createLinearGradient(0, 0, 0, 400);
        if (this.level.id === 1) {
            grad.addColorStop(0, '#1e272e');
            grad.addColorStop(1, '#485460');
        } else if (this.level.id === 2) {
            grad.addColorStop(0, '#2c3e50');
            grad.addColorStop(1, '#2980b9');
        } else if (this.level.id === 3) {
            grad.addColorStop(0, '#e67e22');
            grad.addColorStop(1, '#f39c12');
        } else {
            grad.addColorStop(0, '#8e44ad');
            grad.addColorStop(1, '#2c3e50');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, 380);

        // Background decorative pillars / school building
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 8; i++) {
            const bx = ((i * 180) - (dist * 0.3) % 180) - 50;
            ctx.fillRect(bx, 100, 90, 280);
            // Window squares
            ctx.fillStyle = 'rgba(255, 255, 100, 0.15)';
            ctx.fillRect(bx + 15, 130, 25, 35);
            ctx.fillRect(bx + 50, 130, 25, 35);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        }

        // Big GIBB school sign on building
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = 'bold 36px Arial';
        ctx.fillText("GIBB BERN - BERUFSSCHULE", 260 - (dist * 0.1) % 800, 80);
    }

    drawGround() {
        ctx.fillStyle = '#1e222d';
        ctx.fillRect(0, 380, canvas.width, 160);

        // Ground tiles pattern
        ctx.strokeStyle = '#2f3640';
        ctx.lineWidth = 2;
        const groundOffset = (this.worldDistance) % 60;
        for (let x = -groundOffset; x < canvas.width; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 380);
            ctx.lineTo(x, 540);
            ctx.stroke();
        }
        // Top neon line of floor
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 380);
        ctx.lineTo(canvas.width, 380);
        ctx.stroke();
    }

    drawPlayer() {
        if (this.player.invulnerableTime % 4 > 2) return; // Flash effect

        const p = this.player;
        const img = images.thenerean_hero;
        if (img && img.complete) {
            ctx.drawImage(img, p.x, p.y, p.w, p.h);
        } else {
            ctx.fillStyle = '#00e676';
            ctx.fillRect(p.x, p.y, p.w, p.h);
        }

        // Name tag over player
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Thenerean", p.x + p.w / 2, p.y - 8);
        ctx.textAlign = 'left';
    }

    drawBoss() {
        const b = this.boss;
        const img = images[this.level.bossType === 'adam' ? 'adam_sprite' : (this.level.bossType === 'tuktuk_gpu' ? 'tuktuk_sprite' : 'monika_sprite')];

        if (b.hitFlash > 0) {
            ctx.filter = 'brightness(2.0) contrast(1.5)';
        }

        if (img && img.complete) {
            ctx.drawImage(img, b.x, b.y, b.w, b.h);
        } else {
            ctx.fillStyle = '#ff3838';
            ctx.fillRect(b.x, b.y, b.w, b.h);
        }
        ctx.filter = 'none';

        // Boss Health Bar over head
        const barW = 100;
        const barH = 10;
        const barX = b.x + (b.w - barW) / 2;
        const barY = b.y - 20;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(barX, barY, (b.hp / b.maxHp) * barW, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        // Boss label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.name, b.x + b.w / 2, barY - 5);
        ctx.textAlign = 'left';
    }

    drawObstacles() {
        for (let obs of this.obstacles) {
            const screenX = obs.x - this.worldDistance;
            if (screenX > -60 && screenX < 1000) {
                if (obs.type === 'frisbee') {
                    if (images.frisbee.complete) {
                        ctx.drawImage(images.frisbee, screenX, obs.y + 10, obs.w, obs.h * 0.6);
                    }
                } else if (obs.type === 'warning_letter') {
                    ctx.fillStyle = '#ff4757';
                    ctx.fillRect(screenX, obs.y, obs.w, obs.h);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.fillText("VERW.", screenX + 5, obs.y + 26);
                } else {
                    // Traffic cone / barrier
                    ctx.fillStyle = '#ff9f43';
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
            if (screenX > -60 && screenX < 1000) {
                const img = col.type.includes('coffee') ? images.item_coffee : images.item_gesetz;
                if (img && img.complete) {
                    ctx.drawImage(img, screenX, col.y, col.w, col.h);
                } else {
                    ctx.fillStyle = '#feca57';
                    ctx.fillRect(screenX, col.y, col.w, col.h);
                }
            }
        }
    }

    drawProjectiles() {
        for (let p of this.projectiles) {
            if (p.isPlayer) {
                if (images.item_gesetz && images.item_gesetz.complete) {
                    ctx.drawImage(images.item_gesetz, p.x, p.y, p.w, p.h);
                } else {
                    ctx.fillStyle = '#00d2d3';
                    ctx.fillRect(p.x, p.y, p.w, p.h);
                }
            } else {
                if (images.frisbee && images.frisbee.complete) {
                    ctx.drawImage(images.frisbee, p.x, p.y, p.w, p.h);
                } else {
                    ctx.fillStyle = '#ff3838';
                    ctx.fillRect(p.x, p.y, p.w, p.h);
                }
            }
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

    loop(timestamp) {
        const dt = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Start Game Engine when DOM is ready
window.addEventListener('load', () => {
    window.game = new Game();
});
