/**
 * Thenerean Selvabankumar — Ski-Modus (Kapitel 4: Alpen-Skilager)
 *
 * The slope is seen from above and scrolls upwards while Thenerean rides his frisbee
 * downhill. One engine, four variants picked by `level.ski.variant`:
 *   - 'downhill'  free ride to the valley, Herr Adam throws sports gear in from the top
 *   - 'slalom'    pass between the gate poles before Herr Adam's stopwatch runs out
 *   - 'race'      first to the finish wins — against Herr Adam on his board
 *   - 'avalanche' an avalanche chases from behind, every crash lets it catch up
 *
 * All game logic runs in a virtual 720px-high coordinate system so the slope plays the
 * same on every resolution; rendering scales it up to the real canvas.
 */

const SKI_VH = 720;
const SKI_PY = 250;        // fixed screen row of the player
const SKI_HORIZON = 96;    // slope starts below the mountain panorama
const SKI_MAX_VX = 8.5;

const SKI_DEFAULTS = {
    variant: 'downhill',
    goal: 30000,
    baseSpeed: 9,
    density: 0.5,        // 0..1 obstacle density
    throwEvery: 0,       // frames between Herr Adam's throws (0 = never)
    throwBurst: 1,
    cows: false,
    night: false,
    timeLimitSec: 60,    // slalom only
    gateGap: 520,
    gateWidth: 170,
    rivalSpeed: 9.4,     // race only
    avalanche: null      // { lead, speed, maxLead }
};

const SKI_THROWN_TYPES = ['frisbee', 'frisbee', 'basketball', 'whistle', 'item_clock'];

const Ski = {
    dims() {
        const u = canvas.height / SKI_VH;
        const VW = canvas.width / u;
        const half = Math.min(VW, 1280) / 2 - 86;
        return { u, VW, left: VW / 2 - half, right: VW / 2 + half };
    },

    isActive(g) {
        return Boolean(g.ski && g.level && g.level.mode === 'ski' && g.state === GAME_STATE.RUNNING);
    },

    // ---------------------------------------------------------------------
    // SETUP
    // ---------------------------------------------------------------------
    init() {
        const cfg = { ...SKI_DEFAULTS, ...(this.level.ski || {}) };
        const { VW, left, right } = Ski.dims();
        const diff = this.getActiveDifficulty();
        const speedMult = 0.9 + 0.1 * (diff.speedMult || 1);
        const s = {
            cfg,
            speedMult,
            dist: 0,
            speed: 0,
            eff: 0,
            x: VW * 0.5,
            vx: 0,
            z: 0,
            vz: 0,
            boost: 0,
            iceTimer: 0,
            count: 170,
            objs: [],
            gates: [],
            shots: [],
            thrown: [],
            pathX: VW * 0.5,
            pathDir: Math.random() < 0.5 ? -1 : 1,
            nextRowD: 900,
            gateSide: Math.random() < 0.5 ? -1 : 1,
            lastGate: { d: 0, x: VW * 0.5 },
            nextGate: null,
            gatesTotal: 0,
            gatesPassed: 0,
            gatesMissed: 0,
            throwTimer: cfg.throwEvery ? cfg.throwEvery + 120 : 0,
            warn: null,
            burstLeft: 0,
            thrower: { x: VW * 0.5, show: 0 },
            rival: null,
            av: null,
            finished: false,
            spray: 0
        };
        if (cfg.variant === 'slalom') {
            this.timeRemaining = cfg.timeLimitSec;
            this.lastTickSec = Math.ceil(this.timeRemaining);
            s.gatesTotal = Math.max(1, Math.floor((cfg.goal - 1700) / cfg.gateGap));
            s.nextGate = { d: 1300, x: Ski.clampX(VW * 0.5 + s.gateSide * 120, left, right, 150), idx: 0 };
        }
        if (cfg.variant === 'race') {
            s.rival = { d: 0, x: VW * 0.5 + 150, tx: VW * 0.5 + 150, speed: 0, stun: 0, hitCd: 0, stumbleCd: 520, retarget: 60, throwAnim: 0 };
            s.x = VW * 0.5 - 150;
        }
        if (cfg.avalanche) {
            s.av = { d: -cfg.avalanche.lead, speed: 0 };
        }
        this.ski = s;
        const p = this.player;
        p.isGrounded = true;
        p.vx = 0;
        p.vy = 0;
        p.facing = 1;
        window.soundManager.playClip('adam_nimm_frisbee_fahr');
    },

    clampX(x, left, right, pad) {
        return Math.max(left + pad, Math.min(right - pad, x));
    },

    // Furthest the player can drift sideways while travelling `gap` px down the slope
    maxShift(cfg, gap) {
        return (gap / cfg.baseSpeed) * SKI_MAX_VX * 0.5;
    },

    pathAt(s, d) {
        if (s.cfg.variant !== 'slalom' || !s.nextGate) return s.pathX;
        const a = s.lastGate;
        const b = s.nextGate;
        const t = Math.max(0, Math.min(1, (d - a.d) / Math.max(1, b.d - a.d)));
        return a.x + (b.x - a.x) * t;
    },

    spawnRow(g) {
        const s = g.ski;
        const cfg = s.cfg;
        const { left, right } = Ski.dims();
        const d = s.nextRowD;
        const rnd = (a, b) => a + Math.random() * (b - a);
        const rowGap = (215 - cfg.density * 75) * rnd(0.8, 1.25);
        s.nextRowD += rowGap;

        // Slalom: place gates along the row stream
        if (cfg.variant === 'slalom') {
            while (s.nextGate && s.nextGate.d <= d + 40) {
                const gate = s.nextGate;
                s.gates.push({ d: gate.d, x: gate.x, w: cfg.gateWidth, idx: gate.idx, state: 0 });
                s.lastGate = gate;
                const nd = gate.d + cfg.gateGap;
                if (gate.idx + 1 >= s.gatesTotal) {
                    s.nextGate = null;
                } else {
                    let nx = gate.x + s.gateSide * Ski.maxShift(cfg, cfg.gateGap) * rnd(0.55, 1);
                    if (nx < left + 150 || nx > right - 150) {
                        s.gateSide *= -1;
                        nx = gate.x + s.gateSide * Ski.maxShift(cfg, cfg.gateGap) * rnd(0.55, 1);
                    } else {
                        s.gateSide *= -1;
                    }
                    s.nextGate = { d: nd, x: Ski.clampX(nx, left, right, 150), idx: gate.idx + 1 };
                }
            }
        } else {
            // Free ride: the guaranteed safe corridor wanders across the slope
            if (Math.random() < 0.3) s.pathDir *= -1;
            let nx = s.pathX + s.pathDir * Ski.maxShift(cfg, rowGap) * rnd(0.3, 1);
            if (nx < left + 120 || nx > right - 120) {
                s.pathDir *= -1;
                nx = Ski.clampX(nx, left, right, 120);
            }
            s.pathX = nx;
        }

        if (d > cfg.goal - 520) return;
        const safeX = Ski.pathAt(s, d);
        const corridor = cfg.variant === 'slalom' ? 135 : 118;

        let count = 1;
        if (Math.random() < cfg.density) count++;
        if (Math.random() < cfg.density * 0.7) count++;
        if (Math.random() < cfg.density - 0.55) count++;
        if (cfg.variant === 'slalom') count = Math.max(1, count - 1);

        for (let i = 0; i < count; i++) {
            let x = 0;
            let ok = false;
            for (let t = 0; t < 8 && !ok; t++) {
                x = rnd(left + 24, right - 24);
                ok = Math.abs(x - safeX) > corridor && !s.objs.some((o) => Math.abs(o.d - d) < 70 && Math.abs(o.x - x) < 70);
            }
            if (!ok) continue;
            const roll = Math.random();
            const od = d + rnd(-40, 40);
            if (roll < 0.42) s.objs.push({ type: 'tree', x, d: od, r: 26, hazard: true });
            else if (roll < 0.64) s.objs.push({ type: 'rock', x, d: od, r: 22, hazard: true, low: true });
            else if (roll < 0.76) s.objs.push({ type: 'snowman', x, d: od, r: 22, hazard: true, soft: true });
            else if (roll < 0.84) s.objs.push({ type: 'ice', x, d: od, r: 48 });
            else if (roll < 0.91) s.objs.push({ type: 'ramp', x, d: od, r: 34 });
            else if (cfg.cows) s.objs.push({ type: 'cow', x, d: od, r: 26, hazard: true, soft: true, vx: (Math.random() < 0.5 ? -1 : 1) * rnd(0.9, 1.7) });
            else s.objs.push({ type: 'tree', x, d: od, r: 26, hazard: true });
        }

        // Rewards along the safe line
        const itemRoll = Math.random();
        if (itemRoll < 0.2) {
            for (let i = 0; i < 3; i++) s.objs.push({ type: 'coin', x: safeX, d: d + 60 + i * 46, r: 16 });
        } else if (itemRoll < 0.27) {
            s.objs.push({ type: Math.random() < 0.6 ? 'coffee' : 'energy_drink', x: safeX + rnd(-40, 40), d: d + 80, r: 22 });
        }
    },

    // ---------------------------------------------------------------------
    // PLAYER ACTIONS (hooked into the normal attack keys)
    // ---------------------------------------------------------------------
    jump(g) {
        const s = g.ski;
        if (s.count > 0 || s.z > 0) return;
        s.vz = 9.6;
        s.z = 0.1;
        window.soundManager.playJump();
    },

    shoot(g) {
        const s = g.ski;
        const p = g.player;
        if (s.count > 0 || p.lawBookCooldown > 0) return;
        p.lawBookCooldown = Math.round(p.maxLawBookCooldown * 1.5);
        p.attackAnimTimer = 18;
        let vx = 0;
        let vd = 16;
        const r = s.rival;
        if (r && Math.abs(r.d - s.dist) < 700) {
            const dx = r.x - s.x;
            const dd = r.d - s.dist;
            const len = Math.max(1, Math.hypot(dx, dd));
            vx = (dx / len) * 16;
            vd = (dd / len) * 16;
        }
        s.shots.push({ x: s.x, d: s.dist + 10, vx, vd, rot: 0, life: 70 });
        window.soundManager.playThrow();
    },

    megaShout(g) {
        const s = g.ski;
        const p = g.player;
        if (s.count > 0) return;
        if (p.megaEnergy < g.mods.megaCost) {
            g.addFloatingText('Energie lädt auf!', p.x + 20, p.y - 14, '#ff4757', 17);
            return;
        }
        p.megaEnergy -= g.mods.megaCost;
        p.attackAnimTimer = 28;
        g.shoutAvatarTimer = 55;
        g.radialFlashTimer = 16;
        g.screenShake = 14;
        window.soundManager.playMegaBeam();
        window.soundManager.playClip('thenerean_stah');
        const { u } = Ski.dims();
        g.shockwaves.push({ x: s.x * u, y: SKI_PY * u, radius: 20, maxRadius: 330 * u, color: '#00d2d3', alpha: 0.9 });
        let cleared = 0;
        for (const o of s.objs) {
            if (!o.hazard || o.done) continue;
            if (Math.hypot(o.x - s.x, o.d - s.dist) < 330) {
                o.done = true;
                o.gone = true;
                cleared++;
                g.spawnBurst(o.x * u, (SKI_PY + o.d - s.dist) * u, 10, '#e2e8f0', 6, 16);
            }
        }
        s.thrown = s.thrown.filter((t) => Math.hypot(t.x - s.x, t.d - s.dist) >= 360);
        if (s.rival && Math.hypot(s.rival.x - s.x, s.rival.d - s.dist) < 380) {
            s.rival.stun = 90;
            g.addFloatingText('HERR ADAM WEGGESCHRIEN!', canvas.width * 0.5, canvas.height * 0.3, '#00d2d3', 24);
        }
        if (s.av) s.av.d -= 190;
        if (cleared > 0) g.registerCombo(cleared, '📢 PISTE FREI!');
        g.updateBars();
    },

    turbo(g) {
        const s = g.ski;
        const p = g.player;
        if (s.count > 0) return;
        if (p.frisbeeCooldown > 0) {
            g.addFloatingText('Frisbee-Turbo lädt nach...', p.x + 20, p.y - 14, '#ffa502', 17);
            return;
        }
        p.frisbeeCooldown = p.maxFrisbeeCooldown;
        s.boost = 130;
        window.soundManager.playSprint();
        g.addFloatingText('🥏 FRISBEE-TURBO!', p.x + p.w * 0.5, p.y - 20, '#ffd32a', 24);
        g.updateBars();
    },

    // ---------------------------------------------------------------------
    // PER-FRAME UPDATE
    // ---------------------------------------------------------------------
    update(dt) {
        const g = this;
        const s = g.ski;
        const p = g.player;
        if (!s) return;
        const cfg = s.cfg;
        const { u, VW, left, right } = Ski.dims();
        const diff = g.getActiveDifficulty();
        const syncPlayer = () => {
            p.x = s.x * u - p.w * 0.5;
            p.y = (SKI_PY - s.z) * u - p.h;
            p.isGrounded = true;
            p.vy = 0;
        };

        // 3-2-1 start countdown
        if (s.count > 0) {
            s.count--;
            if (s.count === 150 || s.count === 105 || s.count === 60) window.soundManager.playWarningTick();
            if (s.count === 15) window.soundManager.playWaveClear();
            syncPlayer();
            return;
        }

        const k = g.keys;
        const goLeft = k['a'] || k['arrowleft'];
        const goRight = k['d'] || k['arrowright'];
        const tuck = Boolean((k['s'] || p.isDucking) && s.z === 0);
        const brake = Boolean(k['w'] || k['arrowup']);
        s.tuck = tuck;

        // Steering
        const grip = s.iceTimer > 0 ? 0.22 : (s.z > 0 ? 0.45 : 1);
        const acc = (tuck ? 0.6 : 1.0) * grip;
        if (goLeft) { s.vx -= acc; p.facing = -1; }
        if (goRight) { s.vx += acc; p.facing = 1; }
        s.vx *= s.iceTimer > 0 ? 0.985 : 0.88;
        s.vx = Math.max(-SKI_MAX_VX, Math.min(SKI_MAX_VX, s.vx));
        if (p.dashTimer > 0) s.vx = (p.dashDir || 1) * 17;
        s.x += s.vx;
        if (s.iceTimer > 0) s.iceTimer--;
        if (s.x < left || s.x > right) {
            s.x = Math.max(left, Math.min(right, s.x));
            s.vx = 0;
            s.speed *= 0.965;
            if (Math.random() < 0.5) g.spawnBurst(s.x * u, SKI_PY * u, 2, '#ffffff', 4, 12);
        }

        // Downhill speed
        let target = cfg.baseSpeed * s.speedMult * (tuck ? 1.32 : 1) * (brake ? 0.55 : 1);
        if (p.powerTimer > 0) target *= 1.08;
        // Quick push-off from a standstill or after a crash, gentle top-end acceleration
        s.speed += (target - s.speed) * (s.speed < target * 0.6 ? 0.05 : (s.speed < target ? 0.024 : 0.05));
        if (s.boost > 0) s.boost--;
        s.eff = s.speed + (s.boost > 0 ? 3.6 : 0);
        const prevDist = s.dist;
        s.dist += s.eff;

        // Jump arc
        if (s.z > 0) {
            s.z += s.vz;
            s.vz -= 0.55;
            if (s.z <= 0) {
                s.z = 0;
                s.vz = 0;
                g.spawnBurst(s.x * u, SKI_PY * u, 8, '#ffffff', 4, 12);
            }
        }

        // Snow spray behind the frisbee
        if (s.z === 0 && Math.random() < 0.55) {
            g.particles.push({
                x: s.x * u + (Math.random() - 0.5) * 30, y: SKI_PY * u - 4,
                vx: -s.vx * 0.4 + (Math.random() - 0.5) * 2, vy: -s.eff * 0.35 * u - Math.random() * 2,
                life: 14, maxLife: 14, color: '#ffffff', size: 4 + Math.random() * 4
            });
        }

        while (s.nextRowD < s.dist + SKI_VH) Ski.spawnRow(g);

        // Slalom stopwatch
        if (cfg.variant === 'slalom') {
            g.timeRemaining = Math.max(0, g.timeRemaining - dt);
            const secCeil = Math.ceil(g.timeRemaining);
            if (secCeil !== g.lastTickSec) {
                g.lastTickSec = secCeil;
                if (secCeil <= 6 && secCeil > 0) window.soundManager.playWarningTick();
            }
            for (const gate of s.gates) {
                if (gate.state !== 0 || gate.d <= prevDist || gate.d > s.dist) continue;
                if (Math.abs(s.x - gate.x) <= gate.w * 0.5 + 12) {
                    gate.state = 1;
                    s.gatesPassed++;
                    window.soundManager.playTargetHit();
                    g.registerCombo(1, `🚩 TOR ${s.gatesPassed}/${s.gatesTotal}`);
                } else {
                    gate.state = 2;
                    s.gatesMissed++;
                    g.timeRemaining = Math.max(0, g.timeRemaining - 3);
                    g.comboCount = 0;
                    g.updateComboAndPowerHUD();
                    g.screenShake = 8;
                    g.addFloatingText('TOR VERPASST! −3s', canvas.width * 0.5, canvas.height * 0.3, '#ff4757', 26);
                    if (s.gatesMissed === 1) window.soundManager.playClip('adam_strafe_verpasst');
                }
            }
            if (g.timeRemaining <= 0) {
                g.lastDamageReason = 'ski_time';
                syncPlayer();
                g.triggerGameOver();
                return;
            }
        }

        // Obstacles, pickups, ramps
        const crashDmg = Math.max(8, Math.round((16 + cfg.density * 8) * (diff.dmgMult || 1)));
        for (let i = s.objs.length - 1; i >= 0; i--) {
            const o = s.objs[i];
            if (o.type === 'cow') {
                o.x += o.vx;
                if (o.x < left + 20 || o.x > right - 20) o.vx *= -1;
            }
            const dd = o.d - s.dist;
            if (dd < -SKI_PY - 90 || o.gone) {
                s.objs.splice(i, 1);
                continue;
            }
            if (o.done) continue;
            if (o.hazard && dd < -34) {
                o.done = true;
                if (Math.abs(o.x - s.x) < o.r + 58) g.registerCombo(1, 'KNAPP VORBEI!');
                continue;
            }
            if (Math.abs(dd) > o.r * 0.8 + 12 || Math.abs(o.x - s.x) > o.r + 16) continue;

            if (o.type === 'coin') {
                o.gone = true;
                window.soundManager.playCollect();
                g.addCoins(1, { raw: true });
            } else if (o.type === 'coffee' || o.type === 'energy_drink') {
                o.gone = true;
                g.onCollectItem(o.type);
            } else if (o.type === 'ice') {
                if (s.z === 0) s.iceTimer = 34;
            } else if (o.type === 'ramp') {
                if (s.z < 4) {
                    o.done = true;
                    s.vz = 12.5;
                    s.z = 0.1;
                    s.boost = Math.max(s.boost, 75);
                    window.soundManager.playSprint();
                    g.registerCombo(1, '🎿 SCHANZE!');
                }
            } else if (o.low && s.z > 10) {
                o.done = true;
                g.registerCombo(1, 'ÜBERSPRUNGEN!');
            } else if (o.hazard) {
                o.done = true;
                if (o.soft) o.gone = true;
                const sx = o.x * u;
                const sy = (SKI_PY + dd) * u;
                g.spawnBurst(sx, sy, 16, '#ffffff', 7, 18);
                if (p.isBlocking) {
                    g.onBlockSuccess(sx, sy);
                    s.speed *= 0.75;
                } else if (p.dashTimer > 0 || p.invulnerableTime > 0) {
                    s.speed *= 0.85;
                } else {
                    g.onPlayerHit(crashDmg, 'ski_crash');
                    if (g.state !== GAME_STATE.RUNNING) { syncPlayer(); return; }
                    s.speed = 3;
                    s.boost = 0;
                    s.vx = (s.x < o.x ? -1 : 1) * 5;
                    g.screenShake = 16;
                }
            }
        }

        // Thenerean's thrown law books
        for (let i = s.shots.length - 1; i >= 0; i--) {
            const b = s.shots[i];
            b.x += b.vx;
            b.d += b.vd + s.eff;
            b.rot += 0.3;
            b.life--;
            let hit = false;
            for (const o of s.objs) {
                if (!o.hazard || o.gone || o.type === 'tree') continue;
                if (Math.abs(o.d - b.d) < o.r + 14 && Math.abs(o.x - b.x) < o.r + 14) {
                    o.gone = true;
                    hit = true;
                    g.spawnBurst(o.x * u, (SKI_PY + o.d - s.dist) * u, 12, '#e2e8f0', 6, 16);
                    g.registerCombo(1, '📜 WEGGERÄUMT!');
                    break;
                }
            }
            if (!hit) {
                for (let ti = s.thrown.length - 1; ti >= 0; ti--) {
                    const t = s.thrown[ti];
                    if (Math.abs(t.d - b.d) < 34 && Math.abs(t.x - b.x) < 34) {
                        s.thrown.splice(ti, 1);
                        hit = true;
                        g.registerCombo(1, '🥏 ABGEWEHRT!');
                        break;
                    }
                }
            }
            const r = s.rival;
            if (!hit && r && r.hitCd <= 0 && Math.abs(r.d - b.d) < 46 && Math.abs(r.x - b.x) < 44) {
                hit = true;
                r.stun = 60;
                r.hitCd = 130;
                window.soundManager.playHit();
                g.registerCombo(1, '📜 HERR ADAM GEBREMST!');
                g.spawnBurst(r.x * u, (SKI_PY + r.d - s.dist) * u, 14, '#45aaf2', 7, 18);
            }
            if (hit || b.life <= 0) s.shots.splice(i, 1);
        }

        Ski.updateThrows(g, diff);
        if (g.state !== GAME_STATE.RUNNING) { syncPlayer(); return; }

        // Race rival: Herr Adam on his board
        const r = s.rival;
        if (r) {
            const gap = r.d - s.dist;
            let rTarget = cfg.rivalSpeed * s.speedMult;
            if (gap > 650) rTarget *= 0.9;
            else if (gap < -650) rTarget *= 1.13;
            if (r.hitCd > 0) r.hitCd--;
            if (r.throwAnim > 0) r.throwAnim--;
            if (r.stun > 0) {
                r.stun--;
                rTarget *= 0.3;
            } else {
                r.stumbleCd--;
                if (r.stumbleCd <= 0) {
                    r.stumbleCd = 430 + Math.random() * 330;
                    r.stun = 42;
                    if (Math.abs(gap) < 420) g.addFloatingText('Herr Adam stolpert!', r.x * u, (SKI_PY + gap) * u - 90, '#2ed573', 20);
                }
            }
            r.speed += (rTarget - r.speed) * 0.035;
            r.d += r.speed;
            r.retarget--;
            if (r.retarget <= 0) {
                r.retarget = 50 + Math.random() * 80;
                r.tx = left + 110 + Math.random() * (right - left - 220);
            }
            r.x += Math.max(-5.5, Math.min(5.5, (r.tx - r.x) * 0.06));
            if (Math.abs(gap) < 46 && Math.abs(r.x - s.x) < 56) {
                const side = s.x < r.x ? -1 : 1;
                s.vx += side * 3.2;
                r.x -= side * 3;
            }
            if (r.d >= cfg.goal) {
                g.lastDamageReason = 'ski_race';
                syncPlayer();
                g.triggerGameOver();
                return;
            }
        }

        // Avalanche chasing from behind
        if (s.av) {
            const a = s.av;
            const prog = Math.min(1, s.dist / cfg.goal);
            a.speed = cfg.avalanche.speed * s.speedMult * (1 + (cfg.avalanche.ramp || 0.2) * prog);
            // The avalanche only breaks loose once the rider is properly under way
            if (s.dist > 450) a.d += a.speed;
            else a.d = s.dist - cfg.avalanche.lead;
            const maxLead = cfg.avalanche.maxLead || 560;
            if (s.dist - a.d > maxLead) a.d = s.dist - maxLead;
            const gap = s.dist - a.d;
            if (gap < 260) g.screenShake = Math.max(g.screenShake, (260 - gap) / 30);
            if (gap < 46) {
                g.lastDamageReason = 'avalanche';
                p.hp = 0;
                g.updateBars();
                syncPlayer();
                g.triggerGameOver();
                return;
            }
        }

        syncPlayer();
        g.tickPlayerBanter();

        const prog = Math.min(100, (s.dist / cfg.goal) * 100);
        g.ui.progBar.style.width = `${prog}%`;
        g.ui.progValText.textContent = `${Math.round(prog)}%`;
        g.updateMissionPill();

        if (s.dist >= cfg.goal && !s.finished) {
            s.finished = true;
            let bonus = 0;
            if (cfg.variant === 'slalom' && s.gatesMissed === 0) bonus = 0.3;
            else if (cfg.variant === 'race') bonus = 0.3;
            else if (g.run && g.run.damageTaken === 0) bonus = 0.2;
            if (bonus) g.player.score = Math.min(6.0, +(g.player.score + bonus).toFixed(1));
            g.updateBars();
            window.soundManager.playWaveClear();
            g.spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, 30, '#ffd32a', 9, 26);
            g.triggerLevelWin();
        }
    },

    // Herr Adam throwing frisbees, basketballs, whistles and stopwatches into the slope
    updateThrows(g, diff) {
        const s = g.ski;
        const cfg = s.cfg;
        const p = g.player;
        const { u, left, right } = Ski.dims();
        const r = s.rival;

        const launch = () => {
            const fromRival = Boolean(r);
            const ox = fromRival ? r.x : s.thrower.x;
            const od = fromRival ? r.d : s.dist - (SKI_PY - SKI_HORIZON) + 30;
            const dd = s.dist - od;
            const relSpeed = 6.4 * (diff.projSpeedMult || 1);
            const frames = Math.max(12, Math.abs(dd) / relSpeed);
            const aimX = Ski.clampX(s.x + s.vx * 9 + (Math.random() - 0.5) * 60, left, right, 10);
            s.thrown.push({
                x: ox, d: od,
                vx: (aimX - ox) / frames,
                vd: (dd >= 0 ? 1 : -1) * relSpeed,
                type: SKI_THROWN_TYPES[Math.floor(Math.random() * SKI_THROWN_TYPES.length)],
                rot: 0, life: 260
            });
            if (fromRival) r.throwAnim = 26;
            window.soundManager.playThrow();
        };

        if (cfg.throwEvery && s.dist < cfg.goal - 700) {
            if (s.warn) {
                s.warn.timer--;
                if (!r) s.thrower.x += (s.warn.x - s.thrower.x) * 0.2;
                if (s.warn.timer <= 0) {
                    launch();
                    s.burstLeft--;
                    s.warn = s.burstLeft > 0 ? { timer: 16, x: Ski.clampX(s.x, left, right, 20) } : null;
                }
            } else {
                s.throwTimer--;
                const inRange = !r || Math.abs(r.d - s.dist) < 620;
                if (s.throwTimer <= 0 && inRange) {
                    s.throwTimer = Math.round((cfg.throwEvery * (0.75 + Math.random() * 0.5)) / (diff.aggroMult || 1));
                    s.burstLeft = cfg.throwBurst;
                    s.warn = { timer: 44, x: Ski.clampX(s.x, left, right, 20) };
                    s.thrower.show = 130;
                    if (Math.random() < 0.3) window.soundManager.playClip(Math.random() < 0.5 ? 'adam_frisbees' : 'adam_20_frisbees', null, 1.0, { lowPriority: true });
                }
            }
        }
        if (s.thrower.show > 0) s.thrower.show--;

        const dmg = Math.max(6, Math.round(13 * (diff.dmgMult || 1)));
        for (let i = s.thrown.length - 1; i >= 0; i--) {
            const t = s.thrown[i];
            t.x += t.vx;
            t.d += t.vd + s.eff;
            t.rot += 0.25;
            t.life--;
            const dd = t.d - s.dist;
            if (t.life <= 0 || dd > SKI_VH || dd < -SKI_PY - 60) {
                s.thrown.splice(i, 1);
                continue;
            }
            if (t.done || Math.abs(dd) > 24 || Math.abs(t.x - s.x) > 36) continue;
            t.done = true;
            if (s.z > 10) {
                g.registerCombo(1, 'ÜBERSPRUNGEN!');
            } else if (p.isBlocking) {
                g.onBlockSuccess(t.x * u, SKI_PY * u - 40);
                s.thrown.splice(i, 1);
            } else if (p.dashTimer > 0) {
                g.registerCombo(1, '💨 AUSGEWICHEN!');
            } else if (g.onPlayerHit(dmg, 'frisbee')) {
                s.thrown.splice(i, 1);
                if (g.state !== GAME_STATE.RUNNING) return;
                s.speed *= 0.6;
            }
        }
    },

    pill() {
        const s = this.ski;
        if (!s) return null;
        const cfg = s.cfg;
        const remM = Math.max(0, Math.round((cfg.goal - s.dist) / 40));
        if (cfg.variant === 'slalom') {
            return {
                icon: '⏱️',
                text: `${Math.max(0, this.timeRemaining).toFixed(1)}s • TORE ${s.gatesPassed}/${s.gatesTotal}`,
                urgent: this.timeRemaining <= 7
            };
        }
        if (cfg.variant === 'race' && s.rival) {
            const lead = Math.round((s.dist - s.rival.d) / 40);
            return {
                icon: '🏁',
                text: lead >= 0 ? `VORSPRUNG +${lead}m • ZIEL ${remM}m` : `RÜCKSTAND ${lead}m • ZIEL ${remM}m`,
                urgent: lead < -6,
                highlight: lead >= 0
            };
        }
        if (s.av) {
            const gap = Math.max(0, Math.round((s.dist - s.av.d) / 40));
            return { icon: '🌨️', text: `LAWINE ${gap}m HINTER DIR • TAL ${remM}m`, urgent: gap <= 5 };
        }
        return { icon: '🎿', text: `TALSTATION IN ${remM}m`, highlight: remM <= 120 };
    },

    // ---------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------
    render() {
        const g = this;
        const s = g.ski;
        if (!s) return;
        const cfg = s.cfg;
        const { u, VW, left, right } = Ski.dims();
        const sy = (d) => SKI_PY + (d - s.dist);
        const t = g.animClock;

        ctx.save();
        ctx.scale(u, u);

        // Sky + alpine panorama
        const sky = ctx.createLinearGradient(0, 0, 0, SKI_HORIZON);
        sky.addColorStop(0, cfg.night ? '#0b1026' : '#7fb6e8');
        sky.addColorStop(1, cfg.night ? '#1b2748' : '#dcefff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, VW, SKI_HORIZON + 2);
        const drift = -s.x * 0.04;
        ctx.fillStyle = cfg.night ? '#27365c' : '#9fb4cc';
        ctx.beginPath();
        ctx.moveTo(0, SKI_HORIZON);
        for (let i = -1; i * 170 < VW + 340; i++) {
            const bx = i * 170 + drift;
            const peak = 26 + ((i * 53) % 46 + 46) % 46;
            ctx.lineTo(bx + 85, SKI_HORIZON - peak);
            ctx.lineTo(bx + 170, SKI_HORIZON - 6);
        }
        ctx.lineTo(VW, SKI_HORIZON);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = cfg.night ? '#c9d6f2' : '#ffffff';
        for (let i = -1; i * 170 < VW + 340; i++) {
            const bx = i * 170 + drift;
            const peak = 26 + ((i * 53) % 46 + 46) % 46;
            ctx.beginPath();
            ctx.moveTo(bx + 85, SKI_HORIZON - peak);
            ctx.lineTo(bx + 85 - peak * 0.5, SKI_HORIZON - peak * 0.55);
            ctx.lineTo(bx + 85 + peak * 0.5, SKI_HORIZON - peak * 0.55);
            ctx.closePath();
            ctx.fill();
        }

        // Snow slope
        const snow = ctx.createLinearGradient(0, SKI_HORIZON, 0, SKI_VH);
        snow.addColorStop(0, '#dfeaf6');
        snow.addColorStop(0.3, '#f4f9ff');
        snow.addColorStop(1, '#ffffff');
        ctx.fillStyle = snow;
        ctx.fillRect(0, SKI_HORIZON, VW, SKI_VH - SKI_HORIZON);

        // Moguls + piste tracks give the scrolling its sense of speed
        ctx.fillStyle = 'rgba(150, 180, 215, 0.22)';
        for (let i = 0; i < 26; i++) {
            const my = SKI_HORIZON + ((((i * 211) - s.dist) % 640) + 640) % 640;
            const mx = left + ((i * 397) % Math.max(1, right - left));
            ctx.beginPath();
            ctx.ellipse(mx, my, 46, 9, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Forest walls left and right
        const rowH = 84;
        const firstRow = Math.floor((s.dist - SKI_PY) / rowH) - 1;
        for (let n = firstRow; n < firstRow + 11; n++) {
            const y = sy(n * rowH);
            if (y < SKI_HORIZON + 14) continue;
            const jit = ((n * 37) % 30 + 30) % 30;
            for (let c = 0; left - 40 - c * 62 > -60; c++) Ski.drawTree(left - 44 - c * 62 + jit - 15, y + (c % 2) * 30, 30);
            for (let c = 0; right + 40 + c * 62 < VW + 60; c++) Ski.drawTree(right + 44 + c * 62 - jit + 15, y + (c % 2) * 30, 30);
        }

        // Start arch with the ski-camp bus, finish arch in the valley
        Ski.drawBanner(left, right, sy(0) - 70, 'START • SKILAGER GIBB', '#3742fa');
        if (sy(0) > SKI_HORIZON) {
            ctx.font = '86px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('🚌', left + 110, sy(0) - 96);
        }
        Ski.drawBanner(left, right, sy(cfg.goal), '🏁 ZIEL • TALSTATION', '#2ed573');

        // Slalom gates
        for (const gate of s.gates) {
            const y = sy(gate.d);
            if (y < SKI_HORIZON + 10 || y > SKI_VH + 60) continue;
            const col = gate.state === 1 ? '#2ed573' : (gate.state === 2 ? '#8395a7' : (gate.idx % 2 ? '#3742fa' : '#ff4757'));
            if (gate.state === 0) {
                ctx.strokeStyle = 'rgba(255, 211, 42, 0.55)';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.moveTo(gate.x - gate.w * 0.5, y);
                ctx.lineTo(gate.x + gate.w * 0.5, y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            for (const side of [-1, 1]) {
                const px = gate.x + side * gate.w * 0.5;
                ctx.fillStyle = 'rgba(40, 60, 90, 0.2)';
                ctx.beginPath();
                ctx.ellipse(px + 6, y + 2, 12, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#1e272e';
                ctx.fillRect(px - 2.5, y - 62, 5, 62);
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.moveTo(px, y - 62);
                ctx.lineTo(px - side * 34, y - 50);
                ctx.lineTo(px, y - 38);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Everything standing on the slope, painted back to front
        const drawables = [];
        for (const o of s.objs) {
            if (o.gone) continue;
            const y = sy(o.d);
            if (y < SKI_HORIZON + 8 || y > SKI_VH + 90) continue;
            drawables.push({ y, draw: () => Ski.drawObject(g, o, y) });
        }
        if (s.rival) {
            const ry = sy(s.rival.d);
            if (ry > SKI_HORIZON + 30 && ry < SKI_VH + 150) drawables.push({ y: ry, draw: () => Ski.drawRider(g, s.rival.x, ry, 0, true) });
        }
        drawables.push({ y: SKI_PY, draw: () => Ski.drawRider(g, s.x, SKI_PY, s.z, false) });
        drawables.sort((a, b) => a.y - b.y);
        for (const d of drawables) d.draw();

        // Flying sports gear + law books
        for (const th of s.thrown) {
            const y = sy(th.d);
            if (y < SKI_HORIZON) continue;
            ctx.fillStyle = 'rgba(40, 60, 90, 0.22)';
            ctx.beginPath();
            ctx.ellipse(th.x + 8, y + 8, 18, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            Ski.drawSpinning(images[th.type] || images.frisbee, th.x, y - 16, 46, th.rot);
        }
        for (const b of s.shots) {
            Ski.drawSpinning(images.item_gesetz, b.x, sy(b.d) - 30, 36, b.rot);
        }

        // Herr Adam throwing from the top of the slope
        if (!s.rival && s.thrower.show > 0) {
            const pose = s.warn ? images.adam_windup : images.adam_throw;
            ctx.globalAlpha = Math.min(1, s.thrower.show / 20);
            g.drawCharacterSprite(pose || images.adam_idle, s.thrower.x, SKI_HORIZON + 92, 104, s.x < s.thrower.x ? 1 : -1);
            ctx.globalAlpha = 1;
        }
        if (s.warn && Math.floor(t * 10) % 2 === 0) {
            const wx = s.warn.x;
            ctx.strokeStyle = 'rgba(255, 71, 87, 0.5)';
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 12]);
            ctx.beginPath();
            ctx.moveTo(wx, SKI_HORIZON + 40);
            ctx.lineTo(wx, SKI_PY + 60);
            ctx.stroke();
            ctx.setLineDash([]);
            g.drawNamePill('⚠ HERR ADAM WIRFT!', wx, SKI_HORIZON + 34, '#ff4757');
        }

        // Avalanche front
        if (s.av) {
            const ay = sy(s.av.d);
            if (ay > SKI_HORIZON - 40) {
                const front = ctx.createLinearGradient(0, ay - 60, 0, ay + 40);
                front.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
                front.addColorStop(1, 'rgba(235, 244, 255, 0)');
                ctx.fillStyle = '#f7fbff';
                ctx.fillRect(0, SKI_HORIZON - 10, VW, Math.max(0, ay - 60 - SKI_HORIZON + 10));
                ctx.fillStyle = front;
                ctx.fillRect(0, ay - 60, VW, 100);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                for (let i = 0; i * 70 < VW + 70; i++) {
                    const puff = 34 + Math.sin(t * 6 + i * 1.7) * 12;
                    ctx.beginPath();
                    ctx.arc(i * 70, ay - 6 + Math.sin(t * 4 + i) * 10, puff, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Night run: only the head-lamp cone is lit
        if (cfg.night) {
            const dark = ctx.createRadialGradient(s.x, SKI_PY + 90, 110, s.x, SKI_PY + 90, 400);
            dark.addColorStop(0, 'rgba(6, 10, 28, 0)');
            dark.addColorStop(1, 'rgba(6, 10, 28, 0.86)');
            ctx.fillStyle = dark;
            ctx.fillRect(0, 0, VW, SKI_VH);
        }

        // Race progress strip
        if (s.rival) {
            const bx = VW - 34;
            const top = 150;
            const h = 400;
            ctx.fillStyle = 'rgba(8, 11, 18, 0.55)';
            ctx.fillRect(bx - 5, top, 10, h);
            const mark = (d, col, label) => {
                const my = top + Math.max(0, Math.min(1, d / cfg.goal)) * h;
                ctx.fillStyle = col;
                ctx.strokeStyle = '#080b12';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(bx, my, 11, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#080b12';
                ctx.font = '900 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, bx, my + 1);
            };
            mark(s.rival.d, '#45aaf2', 'A');
            mark(s.dist, '#ffd32a', 'T');
            ctx.font = '22px sans-serif';
            ctx.fillText('🏁', bx, top + h + 22);
        }

        // Speedometer
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#080b12';
        const kmh = `${Math.round(s.eff * 6.4)} km/h${s.tuck ? ' • HOCKE' : ''}${s.boost > 0 ? ' • TURBO' : ''}`;
        ctx.strokeText(kmh, left + 12, SKI_VH - 150);
        ctx.fillStyle = s.boost > 0 ? '#ffd32a' : '#ffffff';
        ctx.fillText(kmh, left + 12, SKI_VH - 150);

        if (s.count > 0) {
            const label = s.count > 150 ? '' : (s.count > 105 ? '3' : (s.count > 60 ? '2' : (s.count > 15 ? '1' : 'LOS!')));
            if (label) {
                ctx.font = '900 150px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.lineWidth = 14;
                ctx.strokeStyle = '#080b12';
                ctx.strokeText(label, VW * 0.5, SKI_VH * 0.5);
                ctx.fillStyle = '#ffd32a';
                ctx.fillText(label, VW * 0.5, SKI_VH * 0.5);
            }
        }
        ctx.restore();

        g.drawShockwaves();
        g.drawParticles();
        g.drawFloatingTexts();
    },

    drawBanner(left, right, y, text, color) {
        if (y < SKI_HORIZON + 30 || y > SKI_VH + 120) return;
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(left + 20, y - 96, 10, 96);
        ctx.fillRect(right - 30, y - 96, 10, 96);
        ctx.fillStyle = color;
        ctx.fillRect(left + 20, y - 110, right - left - 40, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, (left + right) * 0.5, y - 89);
        ctx.fillStyle = 'rgba(8, 11, 18, 0.35)';
        for (let x = left + 30; x < right - 30; x += 40) ctx.fillRect(x, y - 4, 20, 8);
    },

    drawTree(x, y, r) {
        ctx.fillStyle = 'rgba(40, 60, 90, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 2, r * 0.9, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(x - 5, y - 16, 10, 18);
        for (let i = 0; i < 3; i++) {
            const w = r * (1.15 - i * 0.28);
            const by = y - 12 - i * r * 0.62;
            ctx.fillStyle = i % 2 ? '#1f7a4c' : '#17603b';
            ctx.beginPath();
            ctx.moveTo(x - w, by);
            ctx.lineTo(x + w, by);
            ctx.lineTo(x, by - r * 1.05);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.42, by - r * 0.6);
            ctx.lineTo(x + w * 0.42, by - r * 0.6);
            ctx.lineTo(x, by - r * 1.05);
            ctx.closePath();
            ctx.fill();
        }
    },

    drawObject(g, o, y) {
        const x = o.x;
        if (o.type === 'tree') {
            Ski.drawTree(x, y, o.r + 6);
        } else if (o.type === 'rock') {
            ctx.fillStyle = 'rgba(40, 60, 90, 0.22)';
            ctx.beginPath();
            ctx.ellipse(x + 8, y + 2, 30, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#6c7a89';
            ctx.strokeStyle = '#2f3542';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 26, y);
            ctx.lineTo(x - 16, y - 24);
            ctx.lineTo(x + 6, y - 32);
            ctx.lineTo(x + 26, y - 14);
            ctx.lineTo(x + 24, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(x - 16, y - 24);
            ctx.lineTo(x + 6, y - 32);
            ctx.lineTo(x + 14, y - 24);
            ctx.lineTo(x - 6, y - 19);
            ctx.closePath();
            ctx.fill();
            if (!o.done) g.drawNamePill('⬆ SPRINGEN', x, y - 44, '#00d2d3');
        } else if (o.type === 'snowman') {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#8395a7';
            ctx.lineWidth = 3;
            for (const [cy, cr] of [[y - 16, 18], [y - 42, 13]]) {
                ctx.beginPath();
                ctx.arc(x, cy, cr, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(x - 6, y - 46, 3, 3);
            ctx.fillRect(x + 3, y - 46, 3, 3);
            ctx.fillStyle = '#ff7f50';
            ctx.beginPath();
            ctx.moveTo(x, y - 42);
            ctx.lineTo(x + 12, y - 39);
            ctx.lineTo(x, y - 37);
            ctx.closePath();
            ctx.fill();
        } else if (o.type === 'cow') {
            ctx.font = '50px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.save();
            ctx.translate(x, y);
            if (o.vx > 0) ctx.scale(-1, 1);
            ctx.fillText('🐄', 0, 0);
            ctx.restore();
        } else if (o.type === 'ice') {
            ctx.fillStyle = 'rgba(120, 200, 255, 0.45)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(x, y, o.r, o.r * 0.42, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (o.type === 'ramp') {
            ctx.fillStyle = '#3742fa';
            ctx.strokeStyle = '#080b12';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 38, y - 22);
            ctx.lineTo(x + 38, y - 22);
            ctx.lineTo(x + 30, y + 12);
            ctx.lineTo(x - 30, y + 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffd32a';
            ctx.font = '900 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('▼▼', x, y - 4);
        } else if (o.type === 'coin') {
            const spin = Math.abs(Math.cos(g.animClock * 4 + o.d));
            ctx.save();
            ctx.translate(x, y - 18);
            ctx.scale(0.35 + spin * 0.65, 1);
            ctx.fillStyle = '#ffd32a';
            ctx.strokeStyle = '#7a4b00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#7a4b00';
            ctx.font = '900 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('₣', 0, 1);
            ctx.restore();
        } else {
            const img = o.type === 'coffee' ? images.item_coffee : images.item_energy;
            const bob = Math.sin(g.animClock * 4 + o.d) * 4;
            if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, x - 22, y - 48 + bob, 44, 44);
        }
    },

    drawSpinning(img, x, y, size, rot) {
        if (!img || !img.complete || img.naturalWidth === 0) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
    },

    // Thenerean on his frisbee / Herr Adam on his wooden board
    drawRider(g, x, y, z, isRival) {
        const s = g.ski;
        const p = g.player;
        ctx.fillStyle = 'rgba(40, 60, 90, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 4, 40 - Math.min(18, z * 0.25), 11 - Math.min(5, z * 0.07), 0, 0, Math.PI * 2);
        ctx.fill();
        const fy = y - z;

        if (isRival) {
            const r = s.rival;
            ctx.fillStyle = '#a9713f';
            ctx.strokeStyle = '#4a2c12';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(x, fy - 2, 46, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            const img = r.throwAnim > 0 ? images.adam_throw : (r.stun > 0 ? images.adam_idle : images.adam_run);
            const wobble = r.stun > 0 ? Math.sin(g.animClock * 30) * 0.2 : (r.tx - r.x) * 0.0012;
            g.drawCharacterSprite(img || images.adam_idle, x, fy - 6, 124, r.tx < r.x ? 1 : -1, r.stun > 0 ? 6 : 0, 1, 1, wobble);
            if (r.stun > 0) g.drawStunStars(x, fy - 140, 3, 24);
            g.drawNamePill('HERR ADAM', x, fy - 150, '#45aaf2');
            return;
        }

        if (p.invulnerableTime % 5 > 2) return;
        ctx.fillStyle = s.boost > 0 ? '#ffb142' : '#ffd32a';
        ctx.strokeStyle = '#7a4b00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, fy - 2, 40, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        let img = images.thenerean_idle;
        if (p.isBlocking) img = images.thenerean_block;
        else if (p.attackAnimTimer > 0) img = images.thenerean_attack;
        else if (z > 0) img = images.thenerean_jump;
        else if (s.tuck) img = images.thenerean_duck;
        const tilt = Math.max(-0.3, Math.min(0.3, s.vx * 0.035));
        g.drawCharacterSprite(img || images.thenerean_idle, x, fy - 6, s.tuck && z === 0 ? 92 : 124, p.facing || 1, p.hitFlash, 1, 1, tilt);
        if (p.isBlocking) g.drawShieldAura(x, fy - 6, 124, p.facing || 1);
    }
};

Game.prototype.customModes.ski = {
    hint: '<kbd>A</kbd><kbd>D</kbd> Lenken &bull; <kbd>S</kbd>/<kbd>↓</kbd> Hocke = schneller &bull; <kbd>W</kbd> Bremsen &bull; <kbd>SPACE</kbd> Sprung &bull; <kbd>SHIFT</kbd> Ausweich-Dash &bull; <kbd>E</kbd> Gesetz &bull; <kbd>F</kbd> Turbo',
    init: Ski.init,
    update: Ski.update,
    render: Ski.render,
    pill: Ski.pill
};

Object.assign(Game.prototype.customLoseTexts, {
    ski_crash: {
        badge: 'PISTEN-UNFALL',
        title: '🌲 VOLL IN DEN BAUM!',
        desc: 'Lenke mit [A]/[D] durch die freien Lücken, springe mit [SPACE] über Steine und bremse mit [W], wenn es eng wird.',
        quote: '"Nimm das Frisbee und fahr — aber nicht gegen die Tanne!"',
        clip: 'thenerean_raste_aus'
    },
    ski_race: {
        badge: 'RENNEN VERLOREN',
        title: '🏁 HERR ADAM WAR ZUERST IM TAL!',
        desc: 'Fahre in der Hocke [S], nimm jede Schanze mit und bremse Herr Adam mit Gesetzestexten [E] oder dem Mega-Schrei [Q].',
        quote: '"Silvankumar, zweiter Platz ist erster Verlierer!"',
        clip: 'adam_strafe_verpasst'
    },
    ski_time: {
        badge: 'STOPPUHR ABGELAUFEN',
        title: '⏱️ ZU LANGSAM FÜR DEN SLALOM!',
        desc: 'Jedes verpasste Tor kostet 3 Sekunden. Fahre früh auf das nächste Tor zu und nutze die Hocke [S] auf den Geraden.',
        quote: '"Die Stoppuhr lügt nicht, Silvankumar!"',
        clip: 'adam_strafe_verpasst'
    },
    avalanche: {
        badge: 'VERSCHÜTTET',
        title: '🌨️ VON DER LAWINE EINGEHOLT!',
        desc: 'Jeder Sturz lässt die Lawine aufholen. Bleib in der Hocke [S], nutze Schanzen und den Frisbee-Turbo [F].',
        quote: '"Alles weiss! Wo isch mis Frisbee?!"',
        clip: 'thenerean_alles_brennt'
    }
});

(function wrapSki() {
    const P = Game.prototype;
    const wrap = (name, fn) => {
        const orig = P[name];
        P[name] = function (...args) { return fn.call(this, orig.bind(this), ...args); };
    };

    wrap('resetRunStats', function (orig) {
        orig();
        this.ski = null;
    });

    wrap('playerJump', function (orig) {
        if (Ski.isActive(this)) Ski.jump(this);
        else orig();
    });

    wrap('playerAttackLawBook', function (orig) {
        if (Ski.isActive(this)) Ski.shoot(this);
        else orig();
    });

    wrap('playerAttackMegaShout', function (orig) {
        if (Ski.isActive(this)) Ski.megaShout(this);
        else orig();
    });

    wrap('playerAttackFrisbeeVolley', function (orig) {
        if (Ski.isActive(this)) Ski.turbo(this);
        else orig();
    });

    // S is the tuck key on the slope, not the sprint burst of the run levels
    wrap('triggerSprintBurst', function (orig, frames) {
        if (!Ski.isActive(this)) orig(frames);
    });
})();
