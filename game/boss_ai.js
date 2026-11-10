/**
 * Thenerean Selvabankumar - Boss AI, Phases & Perfect Block
 *
 * Mixed into Game.prototype (loaded after game.js, before the window 'load' event).
 *
 * - Every boss has its own attack list. Every attack is telegraphed with a
 *   "!" bubble and a danger zone that shows where it will hit and how to dodge.
 * - Below 50% HP each boss enters PHASE 2: new attacks, shorter pauses, faster movement.
 * - Level 6 duo: the two bosses never telegraph at the same time, and the survivor
 *   enrages when its partner goes down.
 * - Perfect block: pressing R just before a hit reflects the projectile (double damage)
 *   and stuns the boss. A stunned boss takes extra damage from the mega shout (Q).
 *
 * All timings are in frames (the rest of the engine is frame-based, ~60 fps).
 */

const BOSS_TUNING = {
    phase2Threshold: 0.5,
    blockDuration: 34,          // must match playerBlock()
    perfectBlockWindow: 10,     // frames after pressing R that count as "perfect"
    reflectDamageMult: 2.0,
    reflectStunFrames: 55,
    perfectBlockEnergy: 15,
    comboDamageMult: 1.6,       // mega shout vs. stunned boss
    chargeStunFrames: 95,       // TukTuk overheats after a charge
    chargeBlockStunFrames: 120, // TukTuk stopped by a perfect block
    playerStunFrames: 45        // whistle hit
};

// Telegraph length, warning text and voice line per attack
const BOSS_ATTACKS = {
    card:       { telegraph: 18 },
    arc:        { telegraph: 30, warn: "ROTE KARTEN!" },
    wave:       { telegraph: 36, warn: "ABSENZEN-WELLE! ⬆ SPRING!", clip: 'monika_puenktlichkeit' },
    shout:      { telegraph: 40, warn: "\"GANG UF D'PLATZ!\" 🛡️ BLOCKEN!", clip: 'monika_gang_uf_platz' },
    frisbee:    { telegraph: 18 },
    lane:       { telegraph: 34, clip: 'adam_20_frisbees' },
    basketball: { telegraph: 30, warn: "BASKETBÄLLE! 🏀" },
    whistle:    { telegraph: 38, warn: "PFIFF! ⬇ DUCKEN!", clip: 'adam_silvankumar' },
    cable:      { telegraph: 18 },
    charge:     { telegraph: 48, warn: "TUKTUK RAST AN! ⬆ SPRING!", clip: 'thenerean_tuktuk' },
    fire:       { telegraph: 34, warn: "GPU ÜBERHITZT! 🔥 AUSWEICHEN!", clip: 'thenerean_gpu' },
    energy_can: { telegraph: 16 },
    laptop_arc: { telegraph: 28, warn: "LAPTOPS FLIEGEN! 💻" },
    bag_high:   { telegraph: 34, warn: "ENERGY-SCHUSS OBEN! ⬇ DUCKEN!" },
    desk_slide: { telegraph: 34, warn: "KABEL-WELLE! ⬆ SPRINGEN!" }
};

// Attack lists per boss type. Duplicates act as weights.
const BOSS_PATTERNS = {
    monika_miniboss: { p1: ['card', 'card', 'arc'],          p2: ['card', 'arc', 'wave'],               cooldown: [70, 100] },
    monika:          { p1: ['card', 'arc', 'wave'],          p2: ['card', 'arc', 'wave', 'shout'],      cooldown: [62, 92] },
    duo:             { p1: ['card', 'arc', 'wave'],          p2: ['arc', 'wave', 'shout'],              cooldown: [80, 115] },
    adam_miniboss:   { p1: ['frisbee', 'frisbee', 'lane'],   p2: ['frisbee', 'lane', 'basketball'],     cooldown: [66, 96] },
    adam:            { p1: ['frisbee', 'lane', 'lane'],      p2: ['lane', 'basketball', 'whistle', 'frisbee'], cooldown: [60, 90] },
    duo_partner:     { p1: ['frisbee', 'lane'],              p2: ['lane', 'basketball', 'whistle'],     cooldown: [85, 120] },
    tuktuk_gpu:      { p1: ['cable', 'cable', 'charge'],     p2: ['cable', 'charge', 'fire'],           cooldown: [64, 94] },
    gibb_student:    { p1: ['energy_can', 'bag_high', 'laptop_arc'], p2: ['energy_can', 'bag_high', 'laptop_arc', 'desk_slide'], cooldown: [60, 86] }
};

const BOSS_PHASE2_LINES = {
    monika: { text: "Ganz ruhig bleiben?! JETZT NÖD MEH!", clip: 'monika_ganz_ruhig' },
    adam:   { text: "Hilf mir! ...NEI, JETZT GITS FRISBEES!", clip: 'adam_hilf_mir' },
    tuktuk:       { text: "Verdammti Maschine! GPU AM LIMIT!", clip: 'thenerean_verdammt_maschine' },
    gibb_student: { text: "2. DOSE ENERGY! JETZT WIRD'S SCHNELL! ⚡", clip: null }
};

const BossAI = {
    // ---------------------------------------------------------------------
    // SETUP & HELPERS
    // ---------------------------------------------------------------------
    ensureBossAI(b) {
        if (!b.ai) {
            b.ai = {
                phase: 1,
                cooldown: 55,
                telegraph: null,
                pending: [],
                stun: 0,
                charge: null,
                last: null,
                enraged: false
            };
        }
        return b.ai;
    },

    getBossFamily(b) {
        if (b.type === 'gibb_student') return 'gibb_student';
        if (b.type === 'tuktuk_gpu') return 'tuktuk';
        if (b.type === 'adam' || b.type === 'adam_miniboss' || b.isDuoPartner) return 'adam';
        return 'monika';
    },

    getBossPattern(b) {
        if (b.isDuoPartner) return BOSS_PATTERNS.duo_partner;
        return BOSS_PATTERNS[b.type] || BOSS_PATTERNS.monika;
    },

    bossCanMove(b) {
        const ai = b.ai;
        if (!ai) return true;
        return ai.stun <= 0 && !ai.charge && !ai.telegraph;
    },

    bossSpeedMult(b) {
        if (!b.ai) return 1;
        if (b.ai.enraged) return 1.55;
        return b.ai.phase === 2 ? 1.3 : 1;
    },

    isBossStunned(b) {
        return !!(b && b.ai && b.ai.stun > 0);
    },

    resetCombatExtras() {
        this.hazards = [];
        this.player.stunTimer = 0;
        this.player.pushVx = 0;
    },

    dirToPlayer(b) {
        return (this.player.x + this.player.w / 2) < (b.x + b.w / 2) ? -1 : 1;
    },

    // ---------------------------------------------------------------------
    // MAIN AI TICK
    // ---------------------------------------------------------------------
    updateBossAI(b, other) {
        const ai = this.ensureBossAI(b);

        if (ai.phase === 1 && b.hp <= b.maxHp * BOSS_TUNING.phase2Threshold) {
            this.enterBossPhase2(b, false);
        }

        // Queued follow-up shots (volleys, double waves)
        for (let i = ai.pending.length - 1; i >= 0; i--) {
            const job = ai.pending[i];
            job.delay--;
            if (job.delay <= 0) {
                ai.pending.splice(i, 1);
                job.fire();
            }
        }

        if (ai.stun > 0) {
            ai.stun--;
            if (ai.stun % 14 === 0) {
                this.spawnBurst(b.x + b.w * 0.5, b.y + 6, 3, '#ffd32a', 2.5, 18);
            }
            return;
        }

        if (ai.charge) {
            this.updateTukTukCharge(b);
            return;
        }

        if (ai.telegraph) {
            const tg = ai.telegraph;
            tg.timer--;
            b.facing = tg.dir;
            if (tg.timer <= 0) {
                ai.telegraph = null;
                this.executeBossAttack(b, tg);
                const [minCd, maxCd] = this.getBossPattern(b).cooldown;
                let cd = minCd + Math.random() * (maxCd - minCd);
                if (ai.phase === 2) cd *= 0.78;
                if (ai.enraged) cd *= 0.7;
                ai.cooldown = cd;
            }
            return;
        }

        // In the duo fight, wait while the other boss is winding up or charging
        const otherBusy = other && other.hp > 0 && other.ai && (other.ai.telegraph || other.ai.charge);
        if (otherBusy) return;

        ai.cooldown--;
        if (ai.cooldown <= 0) {
            this.startBossTelegraph(b);
        }
    },

    enterBossPhase2(b, enraged) {
        const ai = this.ensureBossAI(b);
        ai.phase = 2;
        ai.telegraph = null;
        ai.pending = [];
        ai.cooldown = 50;
        if (enraged) ai.enraged = true;

        const family = this.getBossFamily(b);
        const line = BOSS_PHASE2_LINES[family];
        const cx = b.x + b.w * 0.5;

        this.screenShake = 16;
        this.radialFlashTimer = 14;
        this.spawnBurst(cx, b.y + b.h * 0.5, 30, '#ff3838', 9, 26);
        this.shockwaves.push({ x: cx, y: b.y + b.h * 0.5, radius: 18, maxRadius: 220, color: '#ff3838', alpha: 0.9 });
        this.addFloatingText(enraged ? "ALLEI NO WÜETENDER! 💢" : "PHASE 2: WÜTEND! 💢", cx, b.y - 60, '#ff3838', 28);
        this.addFloatingText(`"${line.text}"`, cx, b.y - 26, '#ffd32a', 17);
        if (line && line.clip) window.soundManager.playClip(line.clip);
    },

    checkDuoEnrage() {
        const pairs = [[this.boss, this.duoPartner], [this.duoPartner, this.boss]];
        for (const [survivor, fallen] of pairs) {
            if (survivor && fallen && survivor.hp > 0 && fallen.hp <= 0) {
                const ai = this.ensureBossAI(survivor);
                if (!ai.enraged) this.enterBossPhase2(survivor, true);
            }
        }
    },

    // ---------------------------------------------------------------------
    // TELEGRAPH
    // ---------------------------------------------------------------------
    startBossTelegraph(b) {
        const ai = b.ai;
        const pattern = this.getBossPattern(b);
        const list = ai.phase === 2 ? pattern.p2 : pattern.p1;

        let attack = list[Math.floor(Math.random() * list.length)];
        // Avoid the same special attack twice in a row
        if (attack === ai.last && BOSS_ATTACKS[attack].warn !== undefined) {
            attack = list[Math.floor(Math.random() * list.length)];
        }
        ai.last = attack;

        const info = BOSS_ATTACKS[attack];
        const tg = {
            attack: attack,
            timer: info.telegraph,
            max: info.telegraph,
            dir: this.dirToPlayer(b),
            lane: null,
            spots: null
        };

        let warn = info.warn;
        if (attack === 'lane') {
            tg.lane = Math.random() < 0.5 ? 'high' : 'low';
            warn = tg.lane === 'high' ? "FRISBEES OBEN! ⬇ DUCKEN!" : "FRISBEES UNTEN! ⬆ SPRING!";
        }
        if (attack === 'fire') {
            const minX = 60;
            const maxX = Math.max(minX + 200, canvas.width * 0.56);
            tg.spots = [];
            const count = ai.enraged ? 4 : 3;
            for (let i = 0; i < count; i++) {
                const slice = (maxX - minX) / count;
                tg.spots.push(minX + slice * i + Math.random() * Math.max(10, slice - 90));
            }
            // Always put one patch under the player so standing still is not safe
            tg.spots[Math.floor(Math.random() * count)] = Math.max(minX, this.player.x - 10);
        }

        ai.telegraph = tg;

        if (warn) {
            this.addFloatingText(warn, b.x + b.w * 0.5, b.y - 58, '#ff6b81', 19);
        }
        if (info.clip && Math.random() > 0.35) {
            window.soundManager.playClip(info.clip);
        }
    },

    // ---------------------------------------------------------------------
    // ATTACK EXECUTION
    // ---------------------------------------------------------------------
    executeBossAttack(b, tg) {
        const dir = tg.dir;
        const gy = this.player.groundY;
        const ph = this.player.h;
        const originX = dir < 0 ? b.x : b.x + b.w;
        const p2 = b.ai.phase === 2;
        b.attackAnimTimer = 22;

        switch (tg.attack) {
            case 'card':
                this.bossFireAttack(b, 'red_card');
                break;
            case 'frisbee':
                this.bossFireAttack(b, 'frisbee');
                break;
            case 'cable':
                this.bossFireAttack(b, 'broken_cable');
                break;

            case 'arc': {
                // 3 red cards lobbed in arcs around the player
                const targetX = this.player.x + this.player.w / 2;
                const flight = 52;
                const spreads = p2 ? [0.7, 0.9, 1.1, 1.3] : [0.75, 1.0, 1.25];
                for (const s of spreads) {
                    const vx = ((targetX - originX) / flight) * s;
                    this.projectiles.push({
                        x: originX, y: b.y + b.h * 0.2,
                        vx: vx, vy: -10.5, g: 0.42,
                        w: 40, h: 40,
                        isPlayer: false, type: 'red_card', damage: 16,
                        rotation: 0, trailColor: '#ff3838'
                    });
                }
                window.soundManager.playThrow();
                break;
            }

            case 'wave': {
                // Ground wave of absence slips: jump over it
                const fireWave = () => {
                    if (b.hp <= 0) return;
                    this.projectiles.push({
                        x: originX, y: gy - 46,
                        vx: 8.4 * dir, vy: 0,
                        w: 78, h: 46,
                        isPlayer: false, type: 'absenz_wave', damage: 18,
                        rotation: 0, noSpin: true, trailColor: '#ff4757'
                    });
                    this.spawnBurst(originX, gy - 20, 10, '#ff4757', 5, 16);
                };
                fireWave();
                if (p2) b.ai.pending.push({ delay: 34, fire: fireWave });
                break;
            }

            case 'shout': {
                // Full-height blast that pushes the player back: block it
                this.projectiles.push({
                    x: originX, y: gy - 175,
                    vx: 10.5 * dir, vy: 0,
                    w: 70, h: 175,
                    isPlayer: false, type: 'shout_blast', damage: 12,
                    rotation: 0, noSpin: true, trailColor: '#ffd32a',
                    effect: 'push'
                });
                this.shockwaves.push({ x: originX, y: b.y + b.h * 0.35, radius: 14, maxRadius: 160, color: '#ffd32a', alpha: 0.85 });
                this.screenShake = 9;
                break;
            }

            case 'lane': {
                // Frisbee volley at one height: high = duck, low = jump
                const y = tg.lane === 'high' ? gy - ph * 0.85 : gy - 40;
                const count = p2 ? 5 : 4;
                for (let i = 0; i < count; i++) {
                    b.ai.pending.push({
                        delay: i * 9 + 1,
                        fire: () => {
                            if (b.hp <= 0) return;
                            b.attackAnimTimer = 12;
                            this.projectiles.push({
                                x: originX, y: y,
                                vx: 10.2 * dir, vy: 0,
                                w: 46, h: 28,
                                isPlayer: false, type: 'frisbee', damage: 14,
                                rotation: 0, trailColor: '#ff4757'
                            });
                            window.soundManager.playThrow();
                        }
                    });
                }
                break;
            }

            case 'basketball': {
                const speeds = p2 ? [4.6, 6.4, 8.2] : [5.2, 7.4];
                for (const s of speeds) {
                    this.projectiles.push({
                        x: originX, y: b.y + b.h * 0.3,
                        vx: s * dir, vy: -7 - Math.random() * 3, g: 0.5, bounce: 0.8, bounces: 0,
                        w: 42, h: 42,
                        isPlayer: false, type: 'basketball', damage: 16,
                        rotation: 0, trailColor: '#ffa502'
                    });
                }
                window.soundManager.playThrow();
                break;
            }

            case 'whistle': {
                // Head-height sound wave: duck under it or get stunned
                this.projectiles.push({
                    x: originX, y: gy - ph * 0.98,
                    vx: 10.0 * dir, vy: 0,
                    w: 60, h: ph * 0.36,
                    isPlayer: false, type: 'whistle_wave', damage: 8,
                    rotation: 0, noSpin: true, trailColor: '#00d2d3',
                    effect: 'stun'
                });
                window.soundManager.playThrow();
                break;
            }

            case 'charge': {
                b.ai.charge = {
                    dir: dir,
                    speed: p2 ? 16.5 : 13.5,
                    hitDone: false
                };
                b.facing = dir;
                this.screenShake = 10;
                break;
            }

            case 'fire': {
                for (const x of tg.spots || []) {
                    this.hazards.push({ x: x, w: 92, armIn: 26, life: 210 });
                }
                this.screenShake = 8;
                break;
            }

            case 'energy_can': {
                this.projectiles.push({
                    x: originX, y: b.y + b.h * 0.36,
                    vx: 9.8 * dir, vy: (this.player.y - b.y) * 0.015,
                    w: 38, h: 42,
                    isPlayer: false, type: 'energy_can', damage: 15,
                    rotation: 0, trailColor: '#38bdf8'
                });
                window.soundManager.playThrow();
                break;
            }

            case 'laptop_arc': {
                const targetX = this.player.x + this.player.w / 2;
                const flight = 50;
                const spreads = p2 ? [0.72, 0.95, 1.18] : [0.80, 1.12];
                for (const s of spreads) {
                    const vx = ((targetX - originX) / flight) * s;
                    this.projectiles.push({
                        x: originX, y: b.y + b.h * 0.22,
                        vx: vx, vy: -10.8, g: 0.43,
                        w: 46, h: 40,
                        isPlayer: false, type: 'laptop', damage: 18,
                        rotation: 0, trailColor: '#00d2d3'
                    });
                }
                window.soundManager.playThrow();
                break;
            }

            case 'bag_high': {
                this.projectiles.push({
                    x: originX, y: gy - ph * 0.96,
                    vx: 9.6 * dir, vy: 0,
                    w: 54, h: ph * 0.34,
                    isPlayer: false, type: 'energy_can', damage: 16,
                    rotation: 0, trailColor: '#38bdf8'
                });
                window.soundManager.playThrow();
                break;
            }

            case 'desk_slide': {
                this.projectiles.push({
                    x: originX, y: gy - 44,
                    vx: 8.8 * dir, vy: 0,
                    w: 66, h: 44,
                    isPlayer: false, type: 'broken_cable', damage: 17,
                    rotation: 0, noSpin: true, trailColor: '#ff9f1a'
                });
                this.spawnBurst(originX, gy - 18, 8, '#38bdf8', 5, 14);
                window.soundManager.playThrow();
                break;
            }
        }
    },

    updateTukTukCharge(b) {
        const c = b.ai.charge;
        b.x += c.dir * c.speed;
        b.facing = c.dir;

        if (Math.random() > 0.3) this.spawnRunDust(b.x + (c.dir < 0 ? b.w : 0), this.player.groundY);
        if (Math.random() > 0.5) {
            this.particles.push({
                x: b.x + b.w * 0.5, y: b.y + 20,
                vx: -c.dir * (2 + Math.random() * 2), vy: -2 - Math.random() * 2,
                life: 22, maxLife: 22, color: '#ff6348', size: 6 + Math.random() * 5
            });
        }

        // Only the lower part of the TukTuk hurts, so it can be jumped over
        const hitY = b.y + b.h * 0.55;
        const hitH = b.h * 0.45;
        const p = this.player;
        if (!c.hitDone && this.checkCollision(b.x + 12, hitY, b.w - 24, hitH, p.x + 10, p.y + 10, p.w - 20, p.h - 14)) {
            c.hitDone = true;
            if (p.isBlocking && this.isPerfectBlockTiming()) {
                // "Niemert chunt an mir verbi!" - the charge is stopped dead
                b.ai.charge = null;
                b.x -= c.dir * 30;
                this.stunBoss(b, BOSS_TUNING.chargeBlockStunFrames);
                this.onPerfectBlockReward(p.x + p.w * 0.5, p.y + p.h * 0.45, "PERFEKT! TUKTUK GSTOPPT! ⚡");
                return;
            }
            if (p.isBlocking) {
                this.onBlockSuccess(p.x + p.w * 0.5, p.y + p.h * 0.45);
            } else if (this.onPlayerHit(28, 'tuktuk_charge')) {
                p.pushVx = c.dir * 14;
            }
        }

        const minX = 20;
        const maxX = canvas.width - b.w - 20;
        if (b.x <= minX || b.x >= maxX) {
            b.x = Math.max(minX, Math.min(maxX, b.x));
            b.ai.charge = null;
            b.moveDir = -c.dir;
            this.screenShake = 14;
            this.spawnBurst(b.x + (c.dir < 0 ? 0 : b.w), b.y + b.h * 0.6, 22, '#ffa502', 8, 22);
            this.addFloatingText("ÜBERHITZT! [Q] KOMBO!", b.x + b.w * 0.5, b.y - 58, '#ffd32a', 21);
            this.stunBoss(b, BOSS_TUNING.chargeStunFrames);
        }
    },

    // ---------------------------------------------------------------------
    // GROUND HAZARDS (TukTuk fire)
    // ---------------------------------------------------------------------
    updateBossHazards() {
        if (!this.hazards) return;
        const p = this.player;
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const h = this.hazards[i];
            if (h.armIn > 0) {
                h.armIn--;
                continue;
            }
            h.life--;
            if (Math.random() > 0.5) {
                this.particles.push({
                    x: h.x + Math.random() * h.w, y: p.groundY - 4,
                    vx: (Math.random() - 0.5) * 1.2, vy: -2 - Math.random() * 2.5,
                    life: 20, maxLife: 20,
                    color: Math.random() > 0.5 ? '#ff6348' : '#ffa502',
                    size: 5 + Math.random() * 5
                });
            }
            const feetOnFire = p.isGrounded && p.x + p.w - 16 > h.x && p.x + 16 < h.x + h.w;
            if (feetOnFire) this.onPlayerHit(10, 'fire');
            if (h.life <= 0) this.hazards.splice(i, 1);
        }
    },

    drawHazards() {
        if (!this.hazards || this.hazards.length === 0) return;
        const gy = this.player.groundY;
        ctx.save();
        for (const h of this.hazards) {
            if (h.armIn > 0) {
                // Flickering warning outline before the fire ignites
                const blink = Math.floor(this.animClock * 14) % 2 === 0;
                ctx.globalAlpha = blink ? 0.85 : 0.35;
                ctx.strokeStyle = '#ff6348';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 6]);
                ctx.beginPath();
                ctx.ellipse(h.x + h.w / 2, gy, h.w / 2, 12, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                continue;
            }
            const fade = Math.min(1, h.life / 30);
            const flick = 0.85 + Math.sin(this.animClock * 22 + h.x) * 0.15;
            const grad = ctx.createLinearGradient(0, gy - 46, 0, gy + 6);
            grad.addColorStop(0, 'rgba(255, 211, 42, 0)');
            grad.addColorStop(0.45, 'rgba(255, 165, 2, 0.75)');
            grad.addColorStop(1, 'rgba(255, 56, 56, 0.95)');
            ctx.globalAlpha = fade;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(h.x, gy + 4);
            const peaks = 5;
            for (let k = 0; k <= peaks; k++) {
                const px = h.x + (h.w / peaks) * k;
                const tall = (k % 2 === 0 ? 44 : 28) * flick;
                ctx.lineTo(px, gy - tall);
            }
            ctx.lineTo(h.x + h.w, gy + 4);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    },

    // ---------------------------------------------------------------------
    // PLAYER STATUS (stun from whistle, push from shout / charge)
    // ---------------------------------------------------------------------
    applyPlayerStatus() {
        const p = this.player;
        if (p.stunTimer > 0) {
            p.stunTimer--;
            p.vx = 0;
            p.isBlocking = false;
        }
        if (p.pushVx) {
            p.x += p.pushVx;
            p.pushVx *= 0.85;
            if (Math.abs(p.pushVx) < 0.3) p.pushVx = 0;
        }
    },

    isPlayerStunned() {
        return this.player.stunTimer > 0;
    },

    applyHitEffect(proj) {
        if (proj.effect === 'push') {
            this.player.pushVx = Math.sign(proj.vx) * 16;
        } else if (proj.effect === 'stun') {
            this.player.stunTimer = BOSS_TUNING.playerStunFrames;
            this.addFloatingText("BETÄUBT! 💫", this.player.x + this.player.w * 0.5, this.player.y - 34, '#00d2d3', 21);
        }
    },

    drawPlayerStatus() {
        const p = this.player;
        if (p.stunTimer <= 0) return;
        this.drawStunStars(p.x + p.w / 2, p.y - 30, 3, 22);
    },

    // ---------------------------------------------------------------------
    // PERFECT BLOCK & SHOUT COMBO
    // ---------------------------------------------------------------------
    isPerfectBlockTiming() {
        const p = this.player;
        if (!p.isBlocking) return false;
        return (BOSS_TUNING.blockDuration - p.blockTimer) <= BOSS_TUNING.perfectBlockWindow;
    },

    // Turns an enemy projectile around toward the nearest living boss.
    reflectProjectile(proj) {
        const targets = [this.boss, this.duoPartner].filter(t => t && t.hp > 0);
        const px = this.player.x + this.player.w / 2;
        let target = null;
        let best = Infinity;
        for (const t of targets) {
            const d = Math.abs(t.x + t.w / 2 - px);
            if (d < best) { best = d; target = t; }
        }

        const dir = target ? Math.sign(target.x + target.w / 2 - px) || 1 : -Math.sign(proj.vx) || 1;
        const speed = Math.max(12, Math.abs(proj.vx) * 1.35);
        proj.isPlayer = true;
        proj.reflected = true;
        proj.vx = speed * dir;
        proj.g = 0;
        proj.bounce = 0;
        proj.effect = null;
        proj.x = dir > 0 ? this.player.x + this.player.w : this.player.x - proj.w;
        if (target) {
            const frames = Math.max(8, best / speed);
            const ty = target.y + target.h * 0.4;
            proj.vy = (ty - (proj.y + proj.h / 2)) / frames;
        } else {
            proj.vy = 0;
        }
        proj.damage = Math.round(Math.max(proj.damage, 15) * BOSS_TUNING.reflectDamageMult);
        proj.trailColor = '#00d2d3';

        this.onPerfectBlockReward(proj.x + proj.w / 2, proj.y + proj.h / 2, "PERFEKT! ⚡ ZRUGG!");
    },

    onPerfectBlockReward(x, y, label) {
        const p = this.player;
        p.blockCooldown = 0;
        p.megaEnergy = Math.min(p.maxMegaEnergy, p.megaEnergy + BOSS_TUNING.perfectBlockEnergy);
        this.updateBars();

        window.soundManager.playBlockSfx();
        window.soundManager.playClip('thenerean_niemert_verbi');
        this.showMemePopup("Niemert chunt an mir verbi! ⚡");
        this.screenShake = 11;
        this.radialFlashTimer = 8;
        this.spawnBurst(x, y, 22, '#ffd32a', 7, 22);
        this.spawnBurst(x, y, 14, '#00d2d3', 5, 18);
        this.shockwaves.push({ x: x, y: y, radius: 10, maxRadius: 130, color: '#ffd32a', alpha: 0.95 });
        this.addFloatingText(label, p.x + p.w * 0.5, p.y - 30, '#ffd32a', 26);
    },

    stunBoss(b, frames) {
        const ai = this.ensureBossAI(b);
        ai.stun = Math.max(ai.stun, frames);
        ai.telegraph = null;
        ai.pending = [];
        ai.charge = null;
    },

    // Damage of a player projectile against a boss, incl. reflect stun and shout combo.
    resolvePlayerHit(target, proj) {
        let dmg = proj.damage;
        if (proj.type === 'mega_beam' && this.isBossStunned(target)) {
            dmg = Math.round(dmg * BOSS_TUNING.comboDamageMult);
            this.addFloatingText("KOMBO! ×" + BOSS_TUNING.comboDamageMult, target.x + target.w * 0.5, target.y - 52, '#00d2d3', 30);
            this.screenShake = 18;
            this.radialFlashTimer = 12;
        }
        if (proj.reflected) {
            this.stunBoss(target, BOSS_TUNING.reflectStunFrames);
            this.addFloatingText("BENOMMEN! [Q] KOMBO!", target.x + target.w * 0.5, target.y - 58, '#ffd32a', 20);
        }
        return dmg;
    },

    // ---------------------------------------------------------------------
    // PROJECTILE PHYSICS & DRAWING FOR NEW ATTACK TYPES
    // ---------------------------------------------------------------------
    // Returns true if the projectile should be removed.
    applyProjectileGravity(proj) {
        if (!proj.g) return false;
        proj.vy += proj.g;
        const gy = this.player.groundY;
        if (proj.y + proj.h < gy) return false;

        if (proj.bounce) {
            proj.y = gy - proj.h;
            proj.vy = -Math.abs(proj.vy) * proj.bounce;
            proj.bounces = (proj.bounces || 0) + 1;
            return proj.bounces > 4;
        }
        this.spawnBurst(proj.x + proj.w / 2, gy - 4, 6, proj.trailColor || '#ff3838', 4, 14);
        return true;
    },

    // Returns true if it drew the projectile itself.
    drawSpecialProjectile(proj) {
        const cx = proj.x + proj.w / 2;
        const cy = proj.y + proj.h / 2;
        const color = proj.reflected ? '#00d2d3' : null;

        if (proj.type === 'absenz_wave') {
            ctx.save();
            const grad = ctx.createLinearGradient(proj.x, 0, proj.x + proj.w, 0);
            grad.addColorStop(0, 'rgba(255, 71, 87, 0.15)');
            grad.addColorStop(0.5, color || 'rgba(255, 71, 87, 0.9)');
            grad.addColorStop(1, 'rgba(255, 71, 87, 0.15)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(proj.x, proj.y, proj.w, proj.h, 10);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 13px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ABSENZ', cx, cy);
            ctx.restore();
            return true;
        }

        if (proj.type === 'shout_blast' || proj.type === 'whistle_wave') {
            ctx.save();
            const base = color || (proj.type === 'shout_blast' ? '#ffd32a' : '#00d2d3');
            const facing = Math.sign(proj.vx) || -1;
            ctx.strokeStyle = base;
            ctx.shadowColor = base;
            ctx.shadowBlur = 14;
            for (let k = 0; k < 3; k++) {
                ctx.globalAlpha = 0.9 - k * 0.25;
                ctx.lineWidth = 6 - k * 1.5;
                ctx.beginPath();
                const r = proj.h * 0.55 + k * 10;
                const ox = cx - facing * (r * 0.6 + k * 12);
                const a0 = facing > 0 ? -0.9 : Math.PI - 0.9;
                ctx.arc(ox, cy, r, a0, a0 + 1.8);
                ctx.stroke();
            }
            ctx.restore();
            return true;
        }

        return false;
    },

    getProjectileImage(proj) {
        switch (proj.type) {
            case 'mega_beam': return images.projectile_mega;
            case 'frisbee': return images.frisbee;
            case 'broken_cable': return images.broken_cable;
            case 'basketball': return images.basketball;
            case 'red_card': return images.red_card;
            case 'law_book': return images.item_gesetz;
            case 'energy_can': return images.energy_can;
            case 'laptop': return images.projectile_laptop;
            default: return proj.isPlayer ? images.item_gesetz : images.red_card;
        }
    },

    // ---------------------------------------------------------------------
    // BOSS OVERLAYS: telegraph, danger zones, stun, rage aura
    // ---------------------------------------------------------------------
    drawBossRageAura(b, footX, footY) {
        if (!b.ai || b.ai.phase !== 2) return;
        ctx.save();
        const pulse = 0.55 + Math.sin(this.animClock * 9) * 0.2;
        const cy = footY - b.h * 0.5;
        const grad = ctx.createRadialGradient(footX, cy, b.h * 0.1, footX, cy, b.h * 0.75);
        grad.addColorStop(0, `rgba(255, 56, 56, ${0.4 * pulse})`);
        grad.addColorStop(1, 'rgba(255, 56, 56, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(footX, cy, b.h * 0.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    drawBossStatus(b, footX, barY) {
        const ai = b.ai;
        if (!ai) return;

        if (ai.stun > 0) {
            this.drawStunStars(footX, barY - 34, 4, 30);
            this.drawNamePill("BENOMMEN — [Q] KOMBO!", footX, barY - 62, '#ffd32a');
        }

        if (ai.telegraph) {
            this.drawTelegraph(b, ai.telegraph, footX, barY);
        }
    },

    drawTelegraph(b, tg, footX, barY) {
        const progress = 1 - tg.timer / tg.max;
        const gy = this.player.groundY;
        const ph = this.player.h;
        const blink = 0.45 + 0.4 * Math.abs(Math.sin(this.animClock * (8 + progress * 14)));

        ctx.save();

        // Danger zone toward the player
        let zone = null;
        switch (tg.attack) {
            case 'wave':    zone = { y: gy - 46, h: 46, label: '⬆ SPRING' }; break;
            case 'shout':   zone = { y: gy - 175, h: 175, label: '🛡 BLOCK' }; break;
            case 'whistle': zone = { y: gy - ph * 0.98, h: ph * 0.36, label: '⬇ DUCK' }; break;
            case 'charge':     zone = { y: gy - b.h * 0.45, h: b.h * 0.45, label: '⬆ SPRING' }; break;
            case 'bag_high':   zone = { y: gy - ph * 0.96, h: ph * 0.34, label: '⬇ DUCK' }; break;
            case 'desk_slide': zone = { y: gy - 44, h: 44, label: '⬆ SPRING' }; break;
            case 'lane':
                zone = tg.lane === 'high'
                    ? { y: gy - ph * 0.85, h: 28, label: '⬇ DUCK' }
                    : { y: gy - 40, h: 28, label: '⬆ SPRING' };
                break;
        }

        if (zone) {
            const startX = tg.dir < 0 ? 0 : b.x + b.w;
            const endX = tg.dir < 0 ? b.x : canvas.width;
            const reach = (endX - startX) * Math.min(1, 0.35 + progress);
            const x = tg.dir < 0 ? endX - reach : startX;
            ctx.globalAlpha = 0.18 + 0.22 * blink;
            ctx.fillStyle = '#ff3838';
            ctx.fillRect(x, zone.y, reach, zone.h);
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = '#ff6b81';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 7]);
            ctx.strokeRect(x, zone.y, reach, zone.h);
            ctx.setLineDash([]);

            ctx.globalAlpha = blink + 0.15;
            ctx.font = '900 18px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#080b12';
            const lx = tg.dir < 0 ? Math.max(70, x + reach * 0.35) : Math.min(canvas.width - 70, x + reach * 0.65);
            const ly = zone.y + Math.min(zone.h / 2, 30);
            ctx.strokeText(zone.label, lx, ly);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(zone.label, lx, ly);
        }

        if (tg.attack === 'fire' && tg.spots) {
            ctx.globalAlpha = 0.3 + 0.4 * blink;
            ctx.fillStyle = '#ff6348';
            for (const sx of tg.spots) {
                ctx.beginPath();
                ctx.ellipse(sx + 46, gy, 46, 10, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // "!" bubble above the boss, growing as the attack gets closer
        ctx.globalAlpha = 1;
        const r = 15 + progress * 7;
        const by = barY - 40;
        ctx.fillStyle = progress > 0.7 ? '#ff3838' : '#ffa502';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 16 * blink;
        ctx.beginPath();
        ctx.arc(footX, by, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${Math.round(r * 1.5)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', footX, by + 1);

        ctx.restore();
    },

    drawStunStars(cx, cy, count, radius) {
        ctx.save();
        ctx.fillStyle = '#ffd32a';
        ctx.strokeStyle = '#080b12';
        ctx.lineWidth = 2;
        ctx.font = '900 20px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < count; i++) {
            const a = this.animClock * 5 + (Math.PI * 2 * i) / count;
            const x = cx + Math.cos(a) * radius;
            const y = cy + Math.sin(a) * radius * 0.35;
            ctx.strokeText('★', x, y);
            ctx.fillText('★', x, y);
        }
        ctx.restore();
    }
};

Object.assign(Game.prototype, BossAI);
