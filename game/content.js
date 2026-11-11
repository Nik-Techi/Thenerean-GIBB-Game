/**
 * Thenerean Selvabankumar — V9 content pass
 *
 * 1. Boss attacks that ask for the new moves (dash through, stay airborne, double jump / pogo)
 * 2. Guided training: the training room teaches every move step by step
 * 3. Tower levels: patrolling spike mines you can pogo off; rocket levels: scripted formations
 * 4. Movement animation: squash & stretch, dash lean with afterimages, flip on the air jump
 */

// =========================================================================
// 1. BOSS ATTACKS
// =========================================================================
Object.assign(BOSS_ATTACKS, {
    card_wall:     { telegraph: 46, warn: 'KARTEN-WAND! 💨 DASH DURCH ODER ⬆⬆!', clip: 'monika_gang_uf_platz' },
    cable_wall:    { telegraph: 46, warn: 'KABEL-WAND! 💨 DASH DURCH ODER ⬆⬆!', clip: 'tuktuk_taeschfresser_gpu' },
    ball_rain:     { telegraph: 40, warn: 'BALL-REGEN! 💨 DURCH DEN VORHANG DASHEN!', clip: 'adam_strafe_verpasst' },
    laptop_rain:   { telegraph: 40, warn: 'LAPTOP-REGEN! 💨 DURCH DEN VORHANG DASHEN!', clip: 'student_cringe_king' },
    short_circuit: { telegraph: 52, warn: 'KURZSCHLUSS! ⬆ BODEN VERLASSEN!', clip: 'thenerean_gpu' },
    bonk_quake:    { telegraph: 46, warn: 'TUNG-BEBEN! ⬆⬆ DOPPELSPRUNG ODER POGO!', clip: 'sahur_bat_smash' },
    drone_grid:    { telegraph: 42, warn: 'PIZZA-GITTER! ↕ LÜCKE ODER DASH!', clip: 'tuktuk_taeschfresser_gpu' }
});

BOSS_PATTERNS.monika.p2.push('card_wall');
BOSS_PATTERNS.duo.p2.push('card_wall');
BOSS_PATTERNS.adam.p2.push('ball_rain');
BOSS_PATTERNS.duo_partner.p2.push('ball_rain');
BOSS_PATTERNS.gibb_student.p2.push('laptop_rain');
BOSS_PATTERNS.tuktuk_gpu.p2.push('short_circuit');
BOSS_PATTERNS.tuktuk_dual_gpu.p1.push('short_circuit');
BOSS_PATTERNS.tuktuk_dual_gpu.p2.push('short_circuit', 'cable_wall');
BOSS_PATTERNS.tung_sahur.p1.push('bonk_quake');
BOSS_PATTERNS.tung_sahur.p2.push('bonk_quake');
BOSS_PATTERNS.drone_tuktuk.p1.push('drone_grid');
BOSS_PATTERNS.drone_tuktuk.p2.push('drone_grid', 'drone_grid');

ACHIEVEMENTS.push({ id: 'tutorial', icon: '🎯', name: 'Ausgelernt', desc: 'Schliesse das geführte Training ab', reward: 30, test: (s) => s.tutorial >= 1 });
DEFAULT_STATS.tutorial = 0;

const TUTORIAL_STEPS = [
    { text: 'Laufe mit <kbd>A</kbd> / <kbd>D</kbd> nach links und rechts', init: (g) => ({ x: g.player.x, moved: 0 }), done: (g, s) => { s.moved += Math.abs(g.player.x - s.x); s.x = g.player.x; return s.moved > 260; } },
    { text: 'Tippe <kbd>SPACE</kbd> kurz für einen kleinen Hüpfer', init: () => ({ air: false, peak: 0 }), done: (g, s) => g.tutorialJumpCheck(s) && s.result === 'short' },
    { text: 'Halte <kbd>SPACE</kbd> gedrückt für einen hohen Sprung', init: () => ({ air: false, peak: 0 }), done: (g, s) => g.tutorialJumpCheck(s) && s.result === 'high' },
    { text: 'Doppelsprung: drücke <kbd>SPACE</kbd> ein zweites Mal in der Luft', init: () => ({}), done: (g) => !g.player.isGrounded && g.player.spinTimer > 0 },
    { text: 'Dash mit <kbd>SHIFT</kbd> — dabei bist du kurz unverwundbar', init: (g) => ({ n: g.meta.stats.dashes }), done: (g, s) => g.meta.stats.dashes > s.n },
    { text: 'Dash in der Luft: springe und drücke <kbd>SHIFT</kbd> (1× pro Sprung)', init: () => ({}), done: (g) => g.player.dashTimer > 0 && !g.player.isGrounded },
    { text: 'Pogo: springe über den Dummy und halte <kbd>↓</kbd>, um von seinem Kopf abzuprallen', init: (g) => ({ n: g.meta.stats.pogos }), done: (g, s) => g.meta.stats.pogos > s.n },
    { text: 'Wirf Gesetzestexte mit <kbd>E</kbd> auf den Dummy (3 Treffer)', init: (g) => ({ n: g.demoComboHits }), done: (g, s) => g.demoComboHits >= s.n + 3 },
    { text: 'Blocke mit <kbd>R</kbd> — im letzten Moment gedrückt wirfst du Projektile zurück', init: () => ({}), done: (g) => g.player.isBlocking },
    { text: 'Mega-Schrei mit <kbd>Q</kbd>, danach die Frisbee-Salve mit <kbd>F</kbd>', init: () => ({ q: false, f: false }), done: (g, s) => { if (g.projectiles.some((p) => p.type === 'mega_beam')) s.q = true; if (g.projectiles.some((p) => p.isPlayer && p.type === 'frisbee')) s.f = true; return s.q && s.f; } }
];

const Content = {
    // ---------------------------------------------------------------------
    // 1. BOSS ATTACKS
    // ---------------------------------------------------------------------
    runNewBossAttack(b, tg) {
        const dir = tg.dir;
        const gy = this.player.groundY;
        const diff = this.getActiveDifficulty();
        const pSpd = diff.projSpeedMult || 1;
        const sDmg = (base) => Math.max(3, Math.round(base * (diff.dmgMult || 1)));
        const originX = dir < 0 ? b.x : b.x + b.w;
        const p2 = b.ai.phase === 2;
        b.attackAnimTimer = 22;

        // Full-height wall: too tall for one jump. Dash through it, double jump over it or block.
        const fireWall = (type, color) => {
            if (b.hp <= 0) return;
            for (let i = 0; i < 3; i++) {
                this.projectiles.push({
                    x: originX, y: gy - 48 - i * 52,
                    vx: 9.2 * pSpd * dir, vy: 0, w: 44, h: 44,
                    isPlayer: false, type, damage: sDmg(12), rotation: 0, noSpin: true, trailColor: color
                });
            }
            window.soundManager.playThrow();
        };

        // Curtain of falling projectiles sweeping from the boss toward the player.
        const fireRain = (type, color) => {
            const startX = b.x + b.w * 0.5 + dir * 90;
            const cols = Math.min(9, Math.floor(Math.abs((dir < 0 ? startX - 30 : canvas.width - 30 - startX)) / 105));
            for (let i = 0; i < cols; i++) {
                b.ai.pending.push({
                    delay: 1 + i * 8,
                    fire: () => {
                        if (b.hp <= 0) return;
                        const x = startX + dir * i * 105 - 21;
                        this.projectiles.push({
                            x, y: -50, vx: 0, vy: 10.5 * pSpd, w: 42, h: 42,
                            isPlayer: false, type, damage: sDmg(11), rotation: 0, trailColor: color
                        });
                        this.spawnBurst(x + 21, 70, 4, color, 3, 12);
                    }
                });
            }
        };

        switch (tg.attack) {
            case 'card_wall':
                fireWall('red_card', '#ff3838');
                if (p2 && b.ai.enraged) b.ai.pending.push({ delay: 46, fire: () => fireWall('red_card', '#ff3838') });
                break;
            case 'cable_wall':
                fireWall('broken_cable', '#00d2d3');
                b.ai.pending.push({ delay: 44, fire: () => fireWall('broken_cable', '#ff6348') });
                break;
            case 'ball_rain':
                fireRain('basketball', '#ffa502');
                break;
            case 'laptop_rain':
                fireRain('laptop', '#38bdf8');
                break;
            case 'short_circuit':
                // The whole floor goes live: be in the air, on a platform or on the boss's head.
                this.hazards.push({ x: 24, w: canvas.width - 48, armIn: 40, life: 46, theme: 'electric', dmg: 16 });
                this.screenShake = 10;
                window.soundManager.playSwitch();
                break;
            case 'bonk_quake': {
                // Three ground waves in a row: one jump is too short to clear them all.
                const fire = () => {
                    if (b.hp <= 0) return;
                    b.attackAnimTimer = 18;
                    this.projectiles.push({
                        x: originX, y: gy - 50, vx: 8.6 * pSpd * dir, vy: 0, w: 80, h: 50,
                        isPlayer: false, type: 'sahur_shockwave', damage: sDmg(11), rotation: 0, noSpin: true, trailColor: '#ffa502'
                    });
                    this.spawnBurst(originX, gy - 22, 12, '#ffa502', 5.5, 16);
                    window.soundManager.playBatSmash();
                };
                fire();
                b.ai.pending.push({ delay: 20, fire }, { delay: 40, fire });
                break;
            }
            case 'drone_grid': {
                // Vertical wall of pizzas with one gap (rocket fight)
                const top = 84;
                const slots = Math.max(5, Math.floor((canvas.height - 150 - top) / 64));
                const gap = Math.floor(Math.random() * (slots - 1));
                for (let i = 0; i < slots; i++) {
                    if (i === gap || i === gap + 1) continue;
                    this.projectiles.push({
                        x: b.x - 20, y: top + i * 64, vx: -8.2 * pSpd, vy: 0, w: 44, h: 44,
                        isPlayer: false, type: 'fire_pizza', damage: sDmg(11), rotation: 0, trailColor: '#ff6348'
                    });
                }
                window.soundManager.playThrow();
                break;
            }
        }
    },

    // ---------------------------------------------------------------------
    // 2. GUIDED TRAINING
    // ---------------------------------------------------------------------
    buildTutorialDOM() {
        const el = document.createElement('div');
        el.id = 'tutorial-panel';
        el.className = 'tutorial-panel hidden';
        document.getElementById('game-container').appendChild(el);
        this.tutorialEl = el;
    },

    startTutorial() {
        this.tutorial = { step: 0, state: TUTORIAL_STEPS[0].init(this), hold: 0, finished: false };
        this.renderTutorial();
    },

    renderTutorial() {
        const el = this.tutorialEl;
        if (!el) return;
        const t = this.tutorial;
        if (!t || this.state !== GAME_STATE.DEMO) { el.classList.add('hidden'); return; }
        el.classList.remove('hidden');
        if (t.finished) {
            el.innerHTML = '<span class="tut-step">✓ TRAINING ABGESCHLOSSEN</span><span class="tut-text">Du kennst alle Moves. Übe frei weiter oder geh zurück ins Menü.</span>';
            el.classList.add('done');
            return;
        }
        el.classList.remove('done');
        const pips = TUTORIAL_STEPS.map((_, i) => `<i class="${i < t.step ? 'ok' : (i === t.step ? 'cur' : '')}"></i>`).join('');
        el.innerHTML = `<span class="tut-step">TRAINING ${t.step + 1} / ${TUTORIAL_STEPS.length}</span><span class="tut-text">${TUTORIAL_STEPS[t.step].text}</span><span class="tut-pips">${pips}</span>`;
    },

    // Tracks one jump from take-off to landing and classifies its height.
    tutorialJumpCheck(s) {
        const p = this.player;
        const height = p.groundY - (p.y + p.h);
        if (!p.isGrounded) {
            s.air = true;
            s.peak = Math.max(s.peak, height);
            if (p.spinTimer > 0) s.double = true;
            return false;
        }
        if (!s.air) return false;
        s.result = s.double ? 'double' : (s.peak < 105 ? 'short' : (s.peak > 135 ? 'high' : 'mid'));
        const landed = true;
        if (s.result !== 'short' && s.result !== 'high') { s.air = false; s.peak = 0; s.double = false; }
        else { const r = s.result; s.air = false; s.peak = 0; s.double = false; s.result = r; }
        return landed;
    },

    tickTutorial() {
        const t = this.tutorial;
        if (this.state !== GAME_STATE.DEMO || !t || t.finished) return;
        if (t.hold > 0) {
            if (--t.hold === 0) {
                t.step++;
                if (t.step >= TUTORIAL_STEPS.length) {
                    t.finished = true;
                    this.meta.stats.tutorial = 1;
                    this.checkAchievements();
                    this.saveMeta();
                    window.soundManager.playWaveClear();
                } else {
                    t.state = TUTORIAL_STEPS[t.step].init(this);
                }
                this.renderTutorial();
            }
            return;
        }
        const step = TUTORIAL_STEPS[t.step];
        const prevResult = t.state.result;
        if (step.done(this, t.state)) {
            t.hold = 40;
            window.soundManager.playCollect();
            this.addFloatingText('✓ GESCHAFFT!', this.player.x + this.player.w * 0.5, this.player.y - 40, '#2ed573', 24);
            if (this.tutorialEl) this.tutorialEl.classList.add('flash');
            setTimeout(() => this.tutorialEl && this.tutorialEl.classList.remove('flash'), 500);
        } else if (t.state.result && t.state.result !== prevResult) {
            // Jump landed but was the wrong kind: give a hint and reset
            const want = t.step === 1 ? 'Kürzer! Taste sofort loslassen.' : 'Höher! Taste gedrückt halten.';
            this.addFloatingText(want, this.player.x + this.player.w * 0.5, this.player.y - 40, '#ffa502', 20);
            t.state.result = null;
        }
    },

    // ---------------------------------------------------------------------
    // 3a. TOWER: spike mines (pogo-able)
    // ---------------------------------------------------------------------
    spawnClimbMines() {
        this.climbMines = [];
        const t = this.climbTier();
        const chance = 0.24 + t * 0.06;
        this.platforms.forEach((pl, idx) => {
            if (idx < 4 || pl.isSummit || pl.isBounce || pl.crumble || pl.moveAxis) return;
            if (Math.random() > chance) return;
            const cx = pl.x + pl.w * 0.5;
            this.climbMines.push({
                baseX: cx - 23, x: cx - 23, y: pl.y - 112, w: 46, h: 46,
                amp: pl.w * 0.5 + 70, spd: 1.3 + t * 0.15, phase: idx * 1.3
            });
        });
    },

    tickClimbMines() {
        if (this.state !== GAME_STATE.RUNNING || !this.level || this.level.mode !== 'vertical_climb' || !this.climbMines) return;
        const p = this.player;
        const diff = this.getActiveDifficulty();
        for (const m of this.climbMines) {
            m.x = m.baseX + Math.sin(this.animClock * m.spd + m.phase) * m.amp;
            if (m.hitCd > 0) { m.hitCd--; continue; }
            if (this.checkCollision(p.x + 12, p.y + 10, p.w - 24, p.h - 16, m.x + 6, m.y + 6, m.w - 12, m.h - 12)) {
                m.hitCd = 30;
                if (this.player.isBlocking) this.onBlockSuccess(m.x + m.w * 0.5, m.y + m.h * 0.5);
                else this.onPlayerHit(Math.round((14 + this.climbTier() * 2) * (diff.dmgMult || 1)), 'laptop');
                if (this.state !== GAME_STATE.RUNNING) return;
            }
        }
    },

    tryClimbPogo() {
        const p = this.player;
        if (this.state !== GAME_STATE.RUNNING || !this.level || this.level.mode !== 'vertical_climb' || !this.climbMines) return;
        if (p.isGrounded || !p.isDucking || p.vy <= 1 || p.pogoCd > 0) return;
        const bottom = p.y + p.h;
        const next = bottom + p.vy;
        for (const m of this.climbMines) {
            if (p.x + p.w - 10 > m.x && p.x + 10 < m.x + m.w && bottom <= m.y + 18 && next >= m.y - 2) {
                p.y = m.y - p.h - 2;
                p.vy = -19.5;
                p.jumpCut = false;
                p.airJumps = this.mods.maxAirJumps;
                p.airDashUsed = false;
                p.pogoCd = 8;
                p.landTimer = 6;
                p.invulnerableTime = Math.max(p.invulnerableTime, 12);
                m.hitCd = 20;
                this.meta.stats.pogos++;
                window.soundManager.playJump();
                this.shockwaves.push({ x: m.x + m.w * 0.5, y: m.y, radius: 8, maxRadius: 90, color: '#2ed573', alpha: 0.8 });
                this.spawnBurst(m.x + m.w * 0.5, m.y, 14, '#2ed573', 6, 18);
                this.registerCombo(1, '⬇ POGO-KATAPULT!');
                return;
            }
        }
    },

    drawClimbMines() {
        if (!this.climbMines) return;
        for (const m of this.climbMines) {
            const cx = m.x + m.w * 0.5;
            const cy = m.y + m.h * 0.5;
            if (cy < this.climbCameraY - 80 || cy > this.climbCameraY + canvas.height + 80) continue;
            const spin = this.animClock * 3 + m.phase;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(spin);
            ctx.fillStyle = '#ff4757';
            ctx.strokeStyle = '#080b12';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i = 0; i < 16; i++) {
                const a = (Math.PI * 2 * i) / 16;
                const r = i % 2 === 0 ? 27 : 15;
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#1e272e';
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffd32a';
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            this.drawNamePill('⬇ POGO', cx, m.y - 12, '#2ed573');
        }
    },

    // ---------------------------------------------------------------------
    // 3b. ROCKET: scripted formations
    // ---------------------------------------------------------------------
    rocketPizza(x, y, phase, hp) {
        const diff = this.getActiveDifficulty();
        const ch = (this.level && this.level.chapter) || 2;
        return {
            kind: 'fire_pizza', x, y, baseY: y, w: 52, h: 52,
            vx: -6.0 * (diff.speedMult || 1), hp, maxHp: hp,
            damage: Math.max(6, Math.round((10 + ch * 3) * (diff.dmgMult || 1))),
            phase, rot: 0
        };
    },

    tickRocketFormations() {
        if (this.state !== GAME_STATE.RUNNING || !this.level || this.level.mode !== 'rocket_flight') return;
        if (!this.rocketQueue) this.rocketQueue = [];
        for (let i = this.rocketQueue.length - 1; i >= 0; i--) {
            const job = this.rocketQueue[i];
            if (--job.delay <= 0) {
                this.rocketQueue.splice(i, 1);
                job.fire();
            }
        }
        if (this.rocketDistance > this.rocketGoalDistance * 0.9) return;
        if (--this.formationTimer > 0) return;

        const ch = this.level.chapter || 2;
        const diff = this.getActiveDifficulty();
        this.formationTimer = Math.round((560 - ch * 45) / (diff.aggroMult || 1) + Math.random() * 120);
        this.rocketSpawnTimer = Math.max(this.rocketSpawnTimer, 150);

        const top = 86;
        const slotH = 62;
        const slots = Math.max(5, Math.floor((canvas.height - 150 - top) / slotH));
        const kind = ['wall', 'tunnel', 'squad'][Math.floor(Math.random() * 3)];
        const phase = Math.random() * 6.28;

        if (kind === 'wall') {
            this.showMemePopup('🍕 PIZZA-WAND! LÜCKE SUCHEN, FREISCHIESSEN ODER DASH!');
            const gap = Math.floor(Math.random() * (slots - 1));
            for (let i = 0; i < slots; i++) {
                if (i === gap || i === gap + 1) continue;
                this.rocketHazards.push(this.rocketPizza(canvas.width + 70, top + i * slotH, phase, 70));
            }
        } else if (kind === 'tunnel') {
            this.showMemePopup('🌀 PIZZA-TUNNEL! BLEIB IN DER LÜCKE!');
            const cols = 11 + ch;
            const start = Math.random() * 6.28;
            for (let c = 0; c < cols; c++) {
                this.rocketQueue.push({
                    delay: 1 + c * 14,
                    fire: () => {
                        const center = Math.round((slots - 3) * (0.5 + 0.45 * Math.sin(start + c * 0.28)));
                        for (let i = 0; i < slots; i++) {
                            if (i >= center && i <= center + 2) continue;
                            this.rocketHazards.push(this.rocketPizza(canvas.width + 70, top + i * slotH, phase, 70));
                        }
                    }
                });
            }
        } else {
            this.showMemePopup('🚁 DROHNEN-STAFFEL IM ANFLUG!');
            const mid = top + (slots * slotH) / 2;
            for (let i = 0; i < 5; i++) {
                const off = (i - 2);
                const hp = Math.round(48 * (diff.hpMult || 1));
                this.rocketHazards.push({
                    kind: 'mini_drone',
                    x: canvas.width + 70 + Math.abs(off) * 85, y: mid + off * 78, baseY: mid + off * 78,
                    w: 76, h: 58, vx: -4.6 * (diff.speedMult || 1), hp, maxHp: hp,
                    damage: Math.max(6, Math.round((10 + ch * 3) * (diff.dmgMult || 1))),
                    phase, fireCd: 50 + Math.abs(off) * 30
                });
            }
        }
    },

    // ---------------------------------------------------------------------
    // 4. MOVEMENT ANIMATION
    // ---------------------------------------------------------------------
    tickMoveAnim() {
        const p = this.player;
        if (p.landTimer > 0) p.landTimer--;
        if (p.spinTimer > 0) p.spinTimer--;
        const rocket = this.level && this.level.mode === 'rocket_flight';
        if (!rocket && p.isGrounded && p.wasAirborne) {
            p.landTimer = 9;
            p.spinTimer = 0;
            if (p.lastFallVy > 9) {
                this.spawnRunDust(p.x + p.w * 0.25, p.y + p.h);
                this.spawnRunDust(p.x + p.w * 0.75, p.y + p.h);
            }
        }
        p.wasAirborne = !p.isGrounded;
        if (!p.isGrounded) p.lastFallVy = p.vy;

        if (!this.dashGhosts) this.dashGhosts = [];
        for (let i = this.dashGhosts.length - 1; i >= 0; i--) {
            if (--this.dashGhosts[i].life <= 0) this.dashGhosts.splice(i, 1);
        }
        if (p.dashTimer > 0 && !rocket && p.dashTimer % 2 === 0) {
            this.dashGhosts.push({ x: p.x + p.w / 2, y: p.y + p.h, wd: this.worldDistance, facing: p.dashDir, life: 10 });
        }
    },

    drawPlayerSpriteFx(poseKey, footX, footY, sx, sy, tilt) {
        const p = this.player;
        const air = !p.isGrounded;
        let pose = poseKey;

        if (p.dashTimer > 0) {
            pose = 'thenerean_run';
            sx = 1.3;
            sy = 0.8;
            tilt = 0.2 * p.dashDir;
        } else if (air && !p.isBlocking && p.attackAnimTimer <= 0) {
            if (p.isDucking) {
                // Dive / pogo stance
                pose = 'thenerean_duck';
                sx = 0.9;
                sy = 1.12;
            } else {
                const v = Math.max(-1, Math.min(1, p.vy / 14));
                sy = 1.03 + 0.13 * Math.abs(v);
                sx = 0.97 - 0.09 * Math.abs(v);
                tilt = 0.07 * p.facing * (v < 0 ? 1 : -0.5);
            }
        }
        if (p.landTimer > 0) {
            const k = p.landTimer / 9;
            sx *= 1 + 0.22 * k;
            sy *= 1 - 0.2 * k;
        }

        const isClimb = this.level && this.level.mode === 'vertical_climb';
        const runImg = images.thenerean_run || images.thenerean_idle;
        for (const g of (this.dashGhosts || [])) {
            const gx = isClimb ? g.x : g.x - (this.worldDistance - g.wd);
            ctx.save();
            ctx.globalAlpha = (g.life / 10) * 0.4;
            this.drawCharacterSprite(runImg, gx, g.y, p.h, g.facing, 0, 1.3, 0.8, 0.2 * g.facing);
            ctx.restore();
        }

        const sprite = images[pose] || images.thenerean_idle || images.thenerean_hero;
        if (p.spinTimer > 0 && air && p.dashTimer <= 0) {
            const angle = p.facing * Math.PI * 2 * (1 - p.spinTimer / 20);
            const cy = footY - p.h * 0.5;
            ctx.save();
            ctx.translate(footX, cy);
            ctx.rotate(angle);
            ctx.translate(-footX, -cy);
            this.drawCharacterSprite(sprite, footX, footY, p.h, p.facing, p.hitFlash, 0.94, 0.94, 0);
            ctx.restore();
        } else {
            this.drawCharacterSprite(sprite, footX, footY, p.h, p.facing, p.hitFlash, sx, sy, tilt);
        }
    }
};

Object.assign(Game.prototype, Content);

(function wrapContent() {
    const P = Game.prototype;
    const wrap = (name, fn) => {
        const orig = P[name];
        P[name] = function (...args) { return fn.call(this, orig.bind(this), ...args); };
    };
    const NEW_ATTACKS = ['card_wall', 'cable_wall', 'ball_rain', 'laptop_rain', 'short_circuit', 'bonk_quake', 'drone_grid'];

    wrap('executeBossAttack', function (orig, b, tg) {
        if (NEW_ATTACKS.includes(tg.attack)) this.runNewBossAttack(b, tg);
        else orig(b, tg);
    });

    wrap('initExpansion', function (orig) {
        orig();
        this.buildTutorialDOM();
        Object.assign(this.player, { landTimer: 0, spinTimer: 0, wasAirborne: false, lastFallVy: 0 });
        this.dashGhosts = [];
    });

    wrap('resetRunStats', function (orig) {
        orig();
        this.climbMines = [];
        this.rocketQueue = [];
        this.formationTimer = 420;
        this.dashGhosts = [];
        Object.assign(this.player, { landTimer: 0, spinTimer: 0, wasAirborne: false });
    });

    wrap('startDemoMode', function (orig) {
        orig();
        this.startTutorial();
    });

    wrap('initVerticalClimb', function (orig) {
        orig();
        this.spawnClimbMines();
    });

    wrap('drawVerticalClimbVisuals', function (orig) {
        orig();
        this.drawClimbMines();
    });

    wrap('tryAirJump', function (orig) {
        const ok = orig();
        if (ok) this.player.spinTimer = 20;
        return ok;
    });

    wrap('tryPogo', function (orig) {
        const before = this.meta.stats.pogos;
        orig();
        this.tryClimbPogo();
        if (this.meta.stats.pogos > before) this.player.landTimer = 6;
    });

    wrap('update', function (orig, dt) {
        const wasPaused = this.isPaused;
        orig(dt);
        if (wasPaused || this.isPaused) return;
        this.tickClimbMines();
        this.tickRocketFormations();
        this.tickMoveAnim();
        this.tickTutorial();
        if (this.tutorialEl && this.state !== GAME_STATE.DEMO && !this.tutorialEl.classList.contains('hidden')) {
            this.tutorialEl.classList.add('hidden');
        }
    });
})();
