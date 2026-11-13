/**
 * Thenerean Selvabankumar — Kapitel 4: Alpen-Skilager (v13 Complete Overhaul)
 *
 * Implements 4 distinct cel-shaded comic ski gameplay modes in `Game.prototype.customModes.ski`:
 *
 *  1. `downhill` (Normale Ski-Talabfahrt & Lawinen-Flucht — Links → Rechts):
 *     - Layered comic snow ridges, cliffs, pine silhouettes, chalets, kickers, 360° grabs,
 *       Herr Adam rivalry, and a multi-wave roaring snow avalanche.
 *
 *  2. `slalom` (Live-Slalom gegen Herr Adam — Oben ↓ Unten):
 *     - Realistic, rhythmic, 100%-reachable S-curve dual-pole gates with glowing Ideallinie,
 *       snappy carving + Carve-Dash, live drafting/passing vs Herr Adam, and OR-Gesetz combat.
 *
 *  3. `ski_lift` (Aktiver Skilift bergauf über die Todesschlucht):
 *     - Camera climbs uphill along detachable lift cable sectors with moving 4-seaters, timed
 *       cracking ice chairs, trampoline panoramic gondolas, express gold grind wires, steel mast
 *       catwalks with telegraphed icicles, jump trajectory guides, and LETHAL abyss falls!
 *
 *  4. `ski_jump` (Riesen-Schanze Weitsprung — Links → Rechts):
 *     - Four active skill phases: Crosswind Track Balance + Egg-Tuck In-Run, Schanzentisch Takeoff,
 *       Gust-Fighting V-Style Flight + Thermal Rings + Grabs + Frisbee Combat, and mandatory
 *       Telemark Flare Landing (forgetting to flare or crashing stalls causes dramatic snow crash!).
 */

const SKI_VW = 1280;
const SKI_VH = 720;

const Ski = {
    isActive(g) {
        return Boolean(g.ski && g.level && g.level.mode === 'ski' && g.state === GAME_STATE.RUNNING);
    },

    slopeY(x) {
        // Gentle downhill slant Left (high) -> Right (valley) leaving room below for stratified cliffs
        return 410 + (x / SKI_VW) * 145;
    },

    liftSlopeY(worldX) {
        // Ascending mountain slope for Ski-Lift: Left low -> Right climbing high
        return 510 - worldX * 0.145;
    },

    abyssFloorY(worldX) {
        // Deadly alpine gorge floor below the lift cable
        return Ski.liftSlopeY(worldX) + 335;
    },

    jumpRampY(x) {
        // Olympic Ski-Jump In-Run on Left (x: 0..1460) ending at Schanzentisch lip (1460, 405)
        if (x <= 1220) {
            const t = Math.max(0, x) / 1220;
            return 108 + Math.pow(t, 0.86) * 308;
        }
        const lt = Math.min(1, (x - 1220) / 240);
        // Smooth concave upward curve toward the Schanzentisch lip
        return 416 - Math.sin(lt * Math.PI * 0.5) * 14;
    },

    jumpValleyY(x) {
        // Parabolic landing bowl Right of the Schanzentisch (x >= 1460) transitioning to stadium flat
        if (x < 1460) return Ski.jumpRampY(x);
        const dx = x - 1460;
        const transition = Math.min(1, dx / 260);
        const hillDrop = 1040 * (1 - Math.exp(-dx / 2200));
        return 456 + hillDrop * transition * 0.88 + Math.min(130, dx * 0.028);
    },

    slalomScale(screenY) {
        const t = Math.max(0, Math.min(1, (screenY - 220) / (SKI_VH - 220)));
        return 0.26 + t * 0.72;
    },

    slalomScreenX(worldX, screenY) {
        const t = Math.max(0, Math.min(1, (screenY - 220) / (SKI_VH - 220)));
        const scale = 0.26 + t * 0.72;
        const center = 626 + (1 - t) * 4;
        return center + (worldX - SKI_VW * 0.5) * scale;
    },

    playVoice(g, isBoss, force = false) {
        if (!window.soundManager || !g.ski || (g.ski.voiceCd > 0 && !force)) return;
        const pool = isBoss ? (g.level.bossLines || []) : (g.level.playerLines || []);
        if (!pool.length) return;
        const line = pool[Math.floor(Math.random() * pool.length)];
        if (line && line.clip && window.soundManager.playClip) {
            window.soundManager.playClip(line.clip, null, 1.0, force ? { forceSolo: true } : { lowPriority: true });
        }
        g.ski.voiceCd = isBoss ? 6.5 : 8.0;
    },

    registerLoseTexts(g) {
        if (!g.customLoseTexts) g.customLoseTexts = {};
        g.customLoseTexts.ski_abyss = {
            badge: 'ABGRUND-STURZ',
            title: '💀 IN DIE ALPEN-SCHLUCHT GESTÜRZT!',
            desc: 'Der Abgrund unter dem Skilift verzeiht keinen Fehltritt! Nutze Doppelsprung [SPACE/W], [SHIFT] Air-Dash und die grünen Trampolin-Gondeln!',
            quote: '"Schau auf die blaue Sprung-Kurve — ein falscher Schritt und ab in die Schlucht!"'
        };
        g.customLoseTexts.ski_avalanche = {
            badge: 'LAWINEN-OPFER',
            title: '🏔️ VON DER SCHNEELAWINE VERSCHÜTTET!',
            desc: 'Halte [S] in glatten Passagen für mehr Tempo, nimm jede Kicker-Schanze für Stunt-Boosts und nutze [SHIFT] Turbo!',
            quote: '"Die Alpen kennen keine Gnade — schneller carven, weniger stürzen!"'
        };
        g.customLoseTexts.ski_slalom = {
            badge: 'TORFEHLER-DQ',
            title: '🚩 ZU WENIGE SLALOM-TORE ERREICHT!',
            desc: 'Folge der eisblauen Ideallinie durch möglichst viele rote & blaue Tore, nutze [SHIFT] Carve-Dash und bremse Herr Adam mit [E]!',
            quote: '"Strafe verpasst! Ohne saubere Schwünge gibt es keine 6.0 im Skilager!"'
        };
        g.customLoseTexts.ski_crash = {
            badge: 'PISTEN-CRASH',
            title: '💥 SCHWERER STURZ IM SCHNEE!',
            desc: 'Im Weitsprung rechtzeitig vor dem Boden mit [SPACE / W] in die Telemark-Landung abfangen — oder im Tal Felsen & Bäumen ausweichen!',
            quote: '"Das isch e absoluti Frechheit — beim nächsten Lauf sauber landen!"'
        };
    },

    readInputs(g, s) {
        const k = g.keys || {};
        const jumpHeld = Boolean(k.space || k[' '] || k.w || k.arrowup);
        const dashHeld = Boolean(k.shift || k.ShiftLeft || k.ShiftRight);
        const lawHeld = Boolean(k.e);
        const frisbeeHeld = Boolean(k.f);
        const megaHeld = Boolean(k.q);

        const prev = s.prevInputs || {};
        const out = {
            left: Boolean(k.a || k.arrowleft),
            right: Boolean(k.d || k.arrowright),
            up: Boolean(k.w || k.arrowup),
            down: Boolean(k.s || k.arrowdown || k.c || k.control),
            jumpHeld,
            jumpPressed: jumpHeld && !prev.jumpHeld,
            dashPressed: dashHeld && !prev.dashHeld,
            lawPressed: lawHeld && !prev.lawHeld,
            frisbeePressed: frisbeeHeld && !prev.frisbeeHeld,
            megaPressed: megaHeld && !prev.megaHeld
        };
        s.prevInputs = { jumpHeld, dashHeld, lawHeld, frisbeeHeld, megaHeld };
        return out;
    },

    init() {
        const g = this;
        const cfg = (g.level && g.level.ski) ? g.level.ski : {};
        const subMode = cfg.skiType || (cfg.slalom ? 'slalom' : 'downhill');

        Ski.registerLoseTexts(g);

        const s = {
            subMode,
            cfg,
            dist: 0,
            worldX: 0,
            length: cfg.length || 9000,
            timeLeft: cfg.timeLimitSec || 90,
            timeLimit: cfg.timeLimitSec || 90,
            baseSpeed: cfg.baseSpeed || 400,
            maxSpeed: cfg.maxSpeed || 700,
            speed: (cfg.baseSpeed || 400) * 0.72,
            px: subMode === 'slalom' ? SKI_VW * 0.5 : (subMode === 'ski_lift' ? 140 : 280),
            py: subMode === 'slalom' ? 172 : (subMode === 'ski_lift' ? Ski.liftSlopeY(140) - 4 : Ski.slopeY(280)),
            vx: 0,
            vy: 0,
            z: 0,
            vz: 0,
            tilt: 0,
            pose: 'carve',
            spinAngle: 0,
            spinDone: 0,
            trickCombo: 0,
            score: 0,
            boostTimer: 0,
            dashCd: 0,
            dashTimer: 0,
            attackAnimTimer: 0,
            invuln: 0,
            hurtFlash: 0,
            voiceCd: 2.2,
            snowSpray: [],
            obstacles: [],
            gates: [],
            gatesPassed: 0,
            gatesRequired: cfg.gatesRequired || 11,
            gatesTotal: cfg.gatesTotal || 16,
            slalomSec: 0,
            slalomSections: 1,
            secTransition: 0,
            gateCombo: 0,
            downhillPhase: 'run1',
            run1Length: Math.round((cfg.length || 8400) * 0.45),
            cutsceneTimer: 0,
            cutsceneDuration: 3.6,
            adamTalkCd: 1.5,
            adamQuote: '',
            adamQuoteTimer: 0,
            projectiles: [],
            collectibles: [],
            frisbees: [],
            frisbeeCd: cfg.frisbeeInterval || 3.2,
            icicles: [],
            icicleCd: 2.3,
            rival: cfg.rival ? {
                x: subMode === 'slalom' ? SKI_VW * 0.5 + 88 : 340,
                y: subMode === 'slalom' ? 164 : Ski.slopeY(340),
                py: 164,
                sec: 0,
                dist: subMode === 'slalom' ? 0 : 95,
                speed: (cfg.baseSpeed || 410) * (cfg.rivalPace || 0.94),
                stunTimer: 0,
                tilt: 0,
                throwCd: 2.8,
                throwAnimTimer: 0
            } : null,
            avalanche: cfg.avalanche ? {
                dist: -(cfg.avalancheLead || 460),
                speed: (cfg.baseSpeed || 410) * (cfg.avalanchePace || 0.89),
                shake: 0,
                waveSeeds: [0.1, 1.3, 2.7, 4.1, 5.4, 6.2]
            } : null,
            jumpState: null,
            liftState: null,
            camX: 0,
            camY: 0,
            camScale: 1,
            bgOffset: 0,
            prevInputs: { jumpHeld: true, dashHeld: false, lawHeld: false, frisbeeHeld: false, megaHeld: false }
        };

        g.ski = s;
        g.particles = [];
        g.floatingTexts = [];
        g.shockwaves = [];
        g.lastDamageReason = '';

        if (subMode === 'downhill') Ski.populateDownhill(g, s);
        else if (subMode === 'slalom') Ski.populateSlalom(g, s);
        else if (subMode === 'ski_lift') Ski.setupSkiLift(g, s);
        else if (subMode === 'ski_jump') Ski.setupSkiJumpAttempt(g, s, true);

        setTimeout(() => Ski.playVoice(g, true, true), 450);
    },

    // =========================================================================
    // SUBMODE GENERATORS
    // =========================================================================
    populateDownhill(g, s) {
        const sp = Math.max(460, s.cfg.obstacleSpacing || 500);
        const midStop = s.run1Length || Math.round(s.length * 0.45);
        let d = 840;
        let idx = 0;
        while (d < s.length - 560) {
            // Leave clean landing/boarding zones around Abfahrt 1 Finish & Abfahrt 2 Start
            if (Math.abs(d - midStop) < 420 || (d > midStop && d < midStop + 560)) {
                d += sp * 0.85;
                continue;
            }
            const roll = Math.random();
            let kind = 'rock';
            if (roll < 0.42) kind = 'ramp';
            else if (roll < 0.60) kind = 'rock';
            else if (roll < 0.76) kind = 'ice_pine';
            else if (roll < 0.89) kind = 'snowman';
            else kind = 'fence_gap';

            const w = kind === 'ramp' ? 124 : (kind === 'fence_gap' ? 90 : 54);
            const h = kind === 'ice_pine' ? 104 : (kind === 'ramp' ? 48 : (kind === 'fence_gap' ? 50 : 44));
            s.obstacles.push({
                id: idx++,
                kind,
                dist: d,
                w,
                h,
                hit: false,
                triggered: false,
                passed: false
            });
            if (Math.random() < 0.74) {
                const cRoll = Math.random();
                s.collectibles.push({
                    dist: d + (kind === 'ramp' ? 105 : 155),
                    z: kind === 'ramp' ? 92 + Math.random() * 48 : (Math.random() < 0.35 ? 36 : 8),
                    kind: cRoll < 0.34 ? 'coffee' : (cRoll < 0.68 ? 'energy' : 'frisbee_gold'),
                    collected: false
                });
            }
            d += sp * (0.90 + Math.random() * 0.38);
        }
    },

    populateSlalom(g, s) {
        // Stationary Slalom: 4 gates planted per mountain section! Skiers travel Top -> Bottom.
        const total = s.gatesTotal || 16;
        const gatesPerSec = 4;
        const numSections = Math.max(1, Math.ceil(total / gatesPerSec));
        s.slalomSections = numSections;
        s.slalomSec = 0;
        s.secTransition = 0;

        const yRows = [252, 358, 464, 570];
        const halfW = s.cfg.gateHalfWidth || 116;

        let prevCenter = SKI_VW * 0.5;
        for (let i = 0; i < total; i++) {
            const sec = Math.floor(i / gatesPerSec);
            const row = i % gatesPerSec;
            const y = yRows[row];
            const side = i % 2 === 0 ? -1 : 1;
            const rawTarget = SKI_VW * 0.5 + side * (102 + Math.sin(i * 1.15) * 44 + Math.random() * 46);
            const delta = Math.max(-245, Math.min(245, rawTarget - prevCenter));
            const centerX = Math.max(335, Math.min(945, prevCenter + delta));
            prevCenter = centerX;

            s.gates.push({
                index: i + 1,
                sec,
                row,
                y,
                dist: sec * 520 + (row + 1) * 105,
                centerX,
                halfW,
                color: side < 0 ? 'red' : 'blue',
                resolved: false,
                hit: false,
                poleWhip: 0
            });
            if (row % 2 === 1 && Math.random() < 0.78) {
                s.collectibles.push({
                    sec,
                    y: y + 52,
                    dist: sec * 520 + (row + 1) * 105 + 50,
                    x: (centerX + SKI_VW * 0.5) * 0.5,
                    kind: Math.random() < 0.48 ? 'coffee' : (Math.random() < 0.78 ? 'energy' : 'frisbee_gold'),
                    collected: false
                });
            }
        }
    },

    setupSkiLift(g, s) {
        const length = s.length || 6400;
        const slopeSpeed = s.cfg.cableSpeed || 120;
        const isHardLift = (s.cfg && s.cfg.id >= 37);

        // Deterministic uphill sector layout with MIXED fixed steel platforms + smooth ping-pong moving chairs (ZERO teleports!)
        const platforms = [];
        const grindWires = [];
        const sectorSpan = 1160;
        const numSectors = Math.max(5, Math.round(length / sectorSpan));
        const actualLength = numSectors * sectorSpan;
        s.length = actualLength;

        // Start Station deck
        platforms.push({
            id: 'start_station',
            kind: 'pylon',
            isFixed: true,
            x: -110,
            w: 440,
            h: 34,
            offsetY: 0,
            vx: 0,
            isStation: true,
            label: 'TALSTATION • SPRINGEN [SPACE / W]'
        });

        for (let sec = 0; sec < numSectors; sec++) {
            const xStart = sec * sectorSpan + 350;
            const pylonX = (sec + 1) * sectorSpan - 80;
            const isFinish = sec === numSectors - 1;
            platforms.push({
                id: `mast_${sec}`,
                kind: 'pylon',
                isFixed: true,
                x: isFinish ? actualLength - 120 : pylonX,
                w: isFinish ? 460 : 205,
                h: 30,
                offsetY: 0,
                vx: 0,
                isFinish,
                label: isFinish ? '🏁 BERGSTATION ZIEL!' : `MAST ${sec + 1}`
            });

            // 4 hops per sector mixing stationary anchored decks with ping-pong chairs, gondolas & timed ice chairs
            const spanLen = (isFinish ? actualLength - 130 : pylonX) - xStart;
            const hopCount = 4;
            const step = spanLen / hopCount;

            for (let hIdx = 0; hIdx < hopCount; hIdx++) {
                const segStart = xStart + hIdx * step;
                if (hIdx === 1 && sec % 2 === 1 && step > 165) {
                    grindWires.push({
                        x1: segStart - 20,
                        x2: segStart + step * 1.15,
                        offsetY: -56
                    });
                }

                // Clear, fair mix: fixed steel decks vs smooth ping-pong chairs/gondolas/crumbling ice chairs
                let kind = 'chair';
                let isFixed = false;
                let w = 122;
                let offsetY = -12 - (hIdx % 2) * 18;
                let moveSpeed = slopeSpeed * (isHardLift ? 0.80 : 0.68);

                if (hIdx === 0 || (hIdx === 2 && sec % 2 === 0)) {
                    kind = 'fixed_deck';
                    isFixed = true;
                    w = 126;
                    offsetY = hIdx === 0 ? -10 : -24;
                    moveSpeed = 0;
                } else if ((sec + hIdx) % 3 === 1 && (sec > 0 || hIdx > 1)) {
                    kind = 'ice_chair';
                    isFixed = (hIdx % 2 === 0);
                    w = 114;
                    offsetY = -18;
                    moveSpeed = isFixed ? 0 : slopeSpeed * 0.60;
                } else if (hIdx === 3) {
                    kind = 'gondola';
                    isFixed = false;
                    w = 138;
                    offsetY = -30;
                    moveSpeed = slopeSpeed * (isHardLift ? 0.62 : 0.48);
                }

                const minX = segStart - 12;
                const maxX = Math.min(pylonX - w - 26, segStart + step - w + 18);
                const clampedMax = Math.max(minX + (isFixed ? 0 : 75), maxX);
                const platX = isFixed ? (segStart + (step - w) * 0.35) : ((hIdx % 2 === 0) ? minX + 10 : clampedMax - 10);

                platforms.push({
                    id: `p_${sec}_${hIdx}`,
                    kind,
                    isFixed,
                    x: platX,
                    baseX: platX,
                    minX,
                    maxX: clampedMax,
                    w,
                    h: kind === 'gondola' ? 26 : 20,
                    offsetY,
                    vx: moveSpeed,
                    dir: (hIdx % 2 === 0) ? 1 : -1,
                    bobPhase: (sec * 1.7 + hIdx * 1.1),
                    iceTimer: 0,
                    iceLimit: isHardLift ? 1.15 : 1.35,
                    fallenTimer: 0
                });

                if (Math.random() < 0.68) {
                    s.collectibles.push({
                        x: platX + w * 0.5,
                        offsetY: offsetY - 76,
                        kind: Math.random() < 0.35 ? 'energy' : (Math.random() < 0.7 ? 'coffee' : 'frisbee_gold'),
                        collected: false
                    });
                }
            }
        }

        s.px = 140;
        s.py = Ski.liftSlopeY(140) - 2;
        s.vx = 0;
        s.vy = 0;
        s.camX = Math.max(-160, s.px - SKI_VW * 0.32);
        s.camY = Ski.liftSlopeY(s.px + 180) - SKI_VH * 0.46;

        s.liftState = {
            goalDist: actualLength,
            progress: s.px,
            bestX: s.px,
            cableSpeed: slopeSpeed,
            platforms,
            grindWires,
            grounded: true,
            currentPlatform: platforms[0],
            onGrindWire: null,
            jumpsLeft: 2,
            coyoteTimer: 0.14,
            jumpBufferTimer: 0,
            dashCharges: 1,
            dashRecharge: 0,
            bounceCd: 0
        };
    },

    setupSkiJumpAttempt(g, s, first = false) {
        const kPoint = s.cfg.kPointMeters || 175;
        const hillSize = s.cfg.hillSizeMeters || 215;

        // Place dynamic floating Thermal Rings + Gold Frisbees across realistic flight corridor
        const rings = [];
        const ringPositions = [
            { m: 38, alt: 105, bonusM: 7 },
            { m: 78, alt: 155, bonusM: 9 },
            { m: 120, alt: 145, bonusM: 10 },
            { m: 162, alt: 105, bonusM: 12 },
            { m: 196, alt: 70, bonusM: 14 }
        ];
        for (const rp of ringPositions) {
            const wx = 1460 + rp.m * 14.5;
            rings.push({
                x: wx,
                y: Ski.jumpValleyY(wx) - rp.alt + (Math.random() - 0.5) * 32,
                r: 44,
                bonusM: rp.bonusM,
                hit: false,
                phase: Math.random() * Math.PI * 2
            });
        }

        const prev = s.jumpState;
        s.jumpState = {
            attempt: first ? 1 : prev.attempt + 1,
            phase: 'inrun',
            inrunX: 140,
            inrunSpeed: 280,
            balance: (Math.random() - 0.5) * 0.22,
            landBalance: 0,
            landBalanceBonusM: 0,
            balanceVel: 0,
            windGustPhase: Math.random() * 6,
            takeoffTimer: 0,
            takeoffPos: 0,
            takeoffQuality: 0,
            wx: 140,
            wy: Ski.jumpRampY(140),
            vx: 280,
            vy: 0,
            pitchDeg: 6,
            windMs: (Math.random() - 0.5) * 3.0,
            windShiftCd: 1.2,
            rings,
            stuntsDone: 0,
            dashReady: true,
            flarePressed: false,
            landedTelemark: false,
            crashed: false,
            flightMeters: 0,
            bestMeters: prev ? prev.bestMeters : 0,
            totalMeters: prev ? prev.totalMeters : 0,
            targetSingleMeters: s.cfg.targetSingleMeters || kPoint,
            targetTotalMeters: s.cfg.targetTotalMeters || 300,
            kPointMeters: kPoint,
            hillSizeMeters: hillSize,
            outRunTimer: 0,
            inrunSfxDone: false,
            frisbeeAirCd: 1.8
        };
        s.camX = 0;
        s.camY = -20;
        s.camScale = 1.0;
    },

    // =========================================================================
    // MASTER UPDATE LOOP
    // =========================================================================
    update(dt) {
        const g = this;
        const s = g.ski;
        if (!s || g.state !== GAME_STATE.RUNNING) return;
        const safeDt = Math.min(0.05, Math.max(0.001, dt));
        const inputs = Ski.readInputs(g, s);

        s.voiceCd = Math.max(0, s.voiceCd - safeDt);
        s.invuln = Math.max(0, s.invuln - safeDt);
        s.hurtFlash = Math.max(0, s.hurtFlash - safeDt * 2.5);
        s.boostTimer = Math.max(0, s.boostTimer - safeDt);
        s.dashCd = Math.max(0, s.dashCd - safeDt);
        s.dashTimer = Math.max(0, s.dashTimer - safeDt);
        s.attackAnimTimer = Math.max(0, (s.attackAnimTimer || 0) - safeDt);
        if (s.adamQuoteTimer > 0) s.adamQuoteTimer = Math.max(0, s.adamQuoteTimer - safeDt);
        if (s.rival && s.rival.throwAnimTimer > 0) {
            s.rival.throwAnimTimer = Math.max(0, s.rival.throwAnimTimer - safeDt);
        }

        // Story/Lift/Debrief cutscenes between Talabfahrt Run 1 and Run 2 pause the countdown timer
        if (s.subMode === 'downhill' && (s.downhillPhase === 'cutscene_lift' || s.downhillPhase === 'cutscene_debrief')) {
            Ski.updateSnowParticles(g, s, safeDt);
            Ski.updateDownhillCutscene(g, s, inputs, safeDt);
            Ski.updateHUDProgress(g, s);
            return;
        }

        s.timeLeft = Math.max(0, s.timeLeft - safeDt);
        if (s.timeLeft <= 6 && Math.ceil(s.timeLeft) !== Math.ceil(s.timeLeft + safeDt)) {
            if (window.soundManager) window.soundManager.playWarningTick();
        }
        if (s.timeLeft <= 0) {
            if (s.subMode === 'slalom') {
                g.lastDamageReason = s.gatesPassed >= s.gatesRequired ? 'timeout' : 'ski_slalom';
                if (s.gatesPassed >= s.gatesRequired && s.slalomSec >= (s.slalomSections || 1) - 1 && s.py >= 620) {
                    Ski.win(g, s);
                    return;
                }
            } else {
                g.lastDamageReason = 'timeout';
            }
            g.triggerGameOver();
            return;
        }

        Ski.handleAbilities(g, s, inputs);
        Ski.updateSnowParticles(g, s, safeDt);

        if (s.subMode === 'downhill') Ski.updateDownhill(g, s, inputs, safeDt);
        else if (s.subMode === 'slalom') Ski.updateSlalom(g, s, inputs, safeDt);
        else if (s.subMode === 'ski_lift') Ski.updateSkiLift(g, s, inputs, safeDt);
        else if (s.subMode === 'ski_jump') Ski.updateSkiJump(g, s, inputs, safeDt);

        if (g.state !== GAME_STATE.RUNNING) return;
        Ski.updateProjectiles(g, s, safeDt);
        Ski.updateHUDProgress(g, s);
    },

    handleAbilities(g, s, inputs) {
        const p = g.player;
        const slalomSX = s.subMode === 'slalom' ? Ski.slalomScreenX(s.px, s.py) : s.px;

        // [E] OR-Gesetzbuch Attack (aimed forward in active submode direction)
        if (inputs.lawPressed && p.lawBookCooldown <= 0) {
            p.lawBookCooldown = p.maxLawBookCooldown;
            s.attackAnimTimer = 0.36;
            if (window.soundManager) window.soundManager.playThrow();
            let dirX = 1, dirY = 0;
            if (s.subMode === 'slalom') { dirX = 0; dirY = 1; }
            else if (s.subMode === 'ski_lift') { dirX = 0.96; dirY = -0.22; }
            else if (s.subMode === 'ski_jump') { dirX = 0.96; dirY = 0.14; }

            const spawnX = (s.subMode === 'ski_lift') ? s.px + 20 : (s.subMode === 'ski_jump' ? s.jumpState.wx + 24 : (s.subMode === 'slalom' ? slalomSX : s.px + 28));
            const spawnY = (s.subMode === 'ski_lift') ? s.py - 32 : (s.subMode === 'ski_jump' ? s.jumpState.wy - 28 : (s.subMode === 'slalom' ? s.py + 12 : s.py - s.z - 28));

            s.projectiles.push({
                kind: 'law_book',
                fromPlayer: true,
                worldSpace: s.subMode === 'ski_lift' || s.subMode === 'ski_jump',
                x: spawnX,
                y: spawnY,
                vx: dirX * 880,
                vy: dirY * 880,
                r: 22,
                life: 2.2
            });
            g.addFloatingText('📘 OR-GESETZ!', SKI_VW * 0.5, 165, '#45aaf2', 18);
        }

        // [F] GIBB-Frisbee Turbo-Salve
        if (inputs.frisbeePressed && p.frisbeeCooldown <= 0) {
            p.frisbeeCooldown = p.maxFrisbeeCooldown;
            s.boostTimer = Math.max(s.boostTimer, 2.2);
            s.attackAnimTimer = 0.36;
            if (window.soundManager) window.soundManager.playPowerUp();
            if (s.subMode === 'ski_jump' && s.jumpState && s.jumpState.phase === 'flight') {
                s.jumpState.vx += 75;
                s.jumpState.vy -= 45;
            }
            const dirY = s.subMode === 'slalom' ? 1 : 0;
            const dirX = s.subMode === 'slalom' ? 0 : 1;
            const baseX = (s.subMode === 'ski_lift') ? s.px + 18 : (s.subMode === 'ski_jump' ? s.jumpState.wx + 22 : (s.subMode === 'slalom' ? slalomSX : s.px + 22));
            const baseY = (s.subMode === 'ski_lift') ? s.py - 28 : (s.subMode === 'ski_jump' ? s.jumpState.wy - 26 : (s.subMode === 'slalom' ? s.py + 10 : s.py - s.z - 26));
            for (const ang of [-0.14, 0, 0.14]) {
                const vx = (dirX * Math.cos(ang) - dirY * Math.sin(ang)) * 840;
                const vy = (dirX * Math.sin(ang) + dirY * Math.cos(ang)) * 840;
                s.projectiles.push({
                    kind: 'player_frisbee',
                    fromPlayer: true,
                    worldSpace: s.subMode === 'ski_lift' || s.subMode === 'ski_jump',
                    x: baseX,
                    y: baseY,
                    vx, vy, r: 20, life: 2.0
                });
            }
            g.addFloatingText('🥏 FRISBEE-TURBO!', SKI_VW * 0.5, 165, '#ffd32a', 20);
        }

        // [Q] Mega-Schrei Schockwelle (destroys all enemy frisbees/icicles + stuns Herr Adam)
        if (inputs.megaPressed && p.megaEnergy >= p.maxMegaEnergy) {
            p.megaEnergy = 0;
            s.boostTimer = Math.max(s.boostTimer, 3.0);
            if (window.soundManager) window.soundManager.playMegaBeam();
            g.shockwaves.push({
                x: s.subMode === 'ski_lift' || s.subMode === 'ski_jump' ? SKI_VW * 0.35 : s.px,
                y: s.subMode === 'ski_lift' || s.subMode === 'ski_jump' ? SKI_VH * 0.45 : s.py - s.z - 28,
                radius: 25,
                maxRadius: 460,
                color: '#00d2d3',
                alpha: 1.0,
                lineWidth: 9
            });
            let cleared = 0;
            for (let i = s.projectiles.length - 1; i >= 0; i--) {
                if (!s.projectiles[i].fromPlayer) {
                    s.projectiles.splice(i, 1);
                    cleared++;
                }
            }
            if (s.subMode === 'ski_lift') {
                for (let i = s.icicles.length - 1; i >= 0; i--) {
                    if (s.icicles[i].falling) { s.icicles.splice(i, 1); cleared++; }
                }
            }
            if (s.rival) {
                s.rival.stunTimer = 2.6;
                s.rival.speed *= 0.62;
                g.showMemePopup('⚡ HERR ADAM VOM MEGA-SCHREI BETÄUBT!');
            }
            g.addFloatingText(cleared > 0 ? `⚡ MEGA-BLAST! (${cleared} GEKLÄRT)` : '⚡ MEGA-SPEED!', SKI_VW * 0.5, 195, '#00d2d3', 24);
        }
    },

    updateSnowParticles(g, s, dt) {
        for (let i = s.snowSpray.length - 1; i >= 0; i--) {
            const sp = s.snowSpray[i];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.vy += 260 * dt;
            sp.life -= dt;
            if (sp.life <= 0) s.snowSpray.splice(i, 1);
        }
    },

    damagePlayer(g, s, dmg, msg, reason) {
        if (s.invuln > 0) return;
        const diff = g.getActiveDifficulty ? g.getActiveDifficulty() : { dmgMult: 1 };
        const actualDmg = Math.max(5, Math.round(dmg * (diff.dmgMult || 1)));
        g.player.hp = Math.max(0, (g.player.hp || 0) - actualDmg);
        s.invuln = 1.05;
        s.hurtFlash = 1.0;
        g.lastDamageReason = reason || 'ski_crash';
        if (window.soundManager) window.soundManager.playHit();
        g.updateBars();
        g.addFloatingText(`${msg} (-${actualDmg} HP)`, SKI_VW * 0.5, 225, '#ff4757', 22);
        if (g.player.hp <= 0) g.triggerGameOver();
    },

    // =========================================================================
    // 1. DOWNHILL (Links Gipfel -> Rechts Tal + Lawinen-Flucht)
    // =========================================================================
    updateDownhill(g, s, inputs, dt) {
        const diff = g.getActiveDifficulty ? g.getActiveDifficulty() : { speedMult: 1, aggroMult: 1 };

        if (inputs.dashPressed && s.dashCd <= 0) {
            s.dashTimer = 0.62;
            s.dashCd = 3.4;
            if (window.soundManager) window.soundManager.playPowerUp();
            g.shockwaves.push({ x: s.px, y: s.py - s.z - 25, radius: 18, maxRadius: 150, color: '#ffd32a', alpha: 0.9, lineWidth: 5 });
        }

        const tucking = inputs.down && s.z <= 2;
        const braking = inputs.left && s.z <= 2;
        let targetSpeed = s.baseSpeed * (tucking ? 1.38 : (braking ? 0.68 : 1.0));
        if (s.boostTimer > 0) targetSpeed = Math.max(targetSpeed, s.maxSpeed * 1.05);
        if (s.dashTimer > 0) targetSpeed = s.maxSpeed * 1.15;
        if (inputs.right && s.z <= 2) targetSpeed += 55;
        s.speed += (Math.min(s.maxSpeed * 1.15, targetSpeed) - s.speed) * Math.min(1, 5.2 * dt);

        if (inputs.jumpPressed && s.z <= 4) {
            s.vz = 575;
            if (window.soundManager) window.soundManager.playJump();
        }
        // Perform 360° Frisbee Grab Stunt mid-air
        if (inputs.jumpPressed && s.z > 54 && s.spinDone < 1.5 && s.vz < 300) {
            s.spinDone += 1;
            s.trickCombo++;
            s.score += 180;
            s.boostTimer = Math.max(s.boostTimer, 1.45);
            g.player.megaEnergy = Math.min(g.player.maxMegaEnergy, g.player.megaEnergy + 22);
            if (window.soundManager) window.soundManager.playPowerUp();
            g.addFloatingText(`🌀 360° FRISBEE-GRAB! (+TEMPO)`, s.px, s.py - s.z - 65, '#ffd32a', 22);
        }

        s.z += s.vz * dt;
        s.vz -= 1520 * dt;
        if (s.z <= 0) {
            if (s.vz < -220) {
                for (let k = 0; k < 10; k++) {
                    s.snowSpray.push({ x: s.px, y: s.py, vx: -80 - Math.random() * 140, vy: -80 - Math.random() * 120, life: 0.45 });
                }
            }
            s.z = 0;
            s.vz = 0;
            s.spinDone = 0;
            s.spinAngle = 0;
        } else {
            s.spinAngle += (s.spinDone > 0 ? 13.5 : 1.5) * dt;
        }

        s.pose = s.z > 6 ? 'air' : (tucking ? 'tuck' : 'carve');
        s.tilt = s.z > 6 ? -0.18 : (tucking ? 0.25 : 0.08);
        s.dist += s.speed * dt;
        s.bgOffset += s.speed * dt;

        // Ground snow spray trail
        if (s.z <= 3 && Math.random() < 0.72) {
            s.snowSpray.push({
                x: s.px - 22,
                y: s.py - 2,
                vx: -s.speed * 0.42 - Math.random() * 60,
                vy: -35 - Math.random() * 55,
                life: 0.38
            });
        }

        // Obstacles & Kickers
        for (const ob of s.obstacles) {
            const screenX = s.px + (ob.dist - s.dist);
            if (screenX < -220 || screenX > SKI_VW + 260) continue;
            const groundY = Ski.slopeY(screenX);
            const horizOverlap = Math.abs(screenX - s.px) < ob.w * 0.42 + 16;

            if (ob.kind === 'ramp') {
                if (!ob.triggered && horizOverlap && s.z <= 28) {
                    ob.triggered = true;
                    s.vz = 685;
                    s.z = 26;
                    s.boostTimer = Math.max(s.boostTimer, 1.5);
                    if (window.soundManager) window.soundManager.playJump();
                    g.addFloatingText('🚀 BIG-AIR SCHANZE! [SPACE] STUNT!', s.px, groundY - 88, '#00d2d3', 20);
                }
            } else if (!ob.hit && horizOverlap && s.z < ob.h * 0.65) {
                ob.hit = true;
                s.speed = Math.max(160, s.speed * 0.46);
                g.spawnBurst(s.px, groundY - 22, 16, '#ffffff', 7, 18);
                Ski.damagePlayer(g, s, 14, '💥 CRASH!', 'ski_crash');
                if (g.state !== GAME_STATE.RUNNING) return;
            }
        }

        // Collectibles
        for (const col of s.collectibles) {
            if (col.collected) continue;
            const screenX = s.px + (col.dist - s.dist);
            const cy = Ski.slopeY(screenX) - col.z;
            if (Math.abs(screenX - s.px) < 42 && Math.abs((s.py - s.z - 22) - cy) < 52) {
                col.collected = true;
                Ski.collectItem(g, s, col.kind, s.px, cy);
            }
        }

        // Herr Adam Companion (flies/carves alongside Thenerean & comments with real audio clips!)
        if (s.rival) {
            const r = s.rival;
            if (r.stunTimer > 0) r.stunTimer -= dt;
            else {
                const targetRel = 140 + Math.sin(s.dist * 0.0024) * 55;
                const desiredRDist = s.dist + targetRel;
                const baseRSpeed = s.baseSpeed * (s.cfg.rivalPace || 0.94) * (diff.speedMult || 1);
                // Smooth companion rubberband so Herr Adam stays visible beside/ahead of Thenerean
                const catchup = Math.max(-135, Math.min(260, (desiredRDist - r.dist) * 2.2));
                r.speed += (baseRSpeed + catchup - r.speed) * 3.0 * dt;
                r.dist += r.speed * dt;
            }

            // Periodic companion encouragement & audio clips from Herr Adam
            s.adamTalkCd = (s.adamTalkCd || 0) - dt;
            if (s.adamTalkCd <= 0 && r.stunTimer <= 0) {
                s.adamTalkCd = 5.6 + Math.random() * 2.4;
                const banter = [
                    { clip: 'adam_nimm_frisbee_fahr', text: '„Nimm d’Frisbee & fahr abe, Thenerean!“' },
                    { clip: 'adam_setup_genehmigt', text: '„Setup isch genehmigt — sauberi Linie!“' },
                    { clip: 'adam_20_frisbees', text: '„20 Frisbees bereit! Kanten setzen!“' },
                    { clip: 'adam_silvankumar', text: '„Selvankumar! Vollgas ins Tal!“' }
                ];
                const pick = banter[Math.floor(Math.random() * banter.length)];
                s.adamQuote = pick.text;
                s.adamQuoteTimer = 3.1;
                if (window.soundManager) {
                    window.soundManager.playClip(pick.clip, null, 0.92, { lowPriority: true });
                }
            }

            r.throwCd -= dt;
            if (r.throwCd <= 0 && Math.abs(r.dist - s.dist) < 760) {
                r.throwCd = Math.max(2.6, (s.cfg.frisbeeInterval || 4.2) / (diff.aggroMult || 1));
                r.throwAnimTimer = 0.45;
                const rx = s.px + (r.dist - s.dist);
                const clampX = Math.max(85, Math.min(SKI_VW - 65, rx));
                const ry = Ski.slopeY(clampX) - 34;
                const toLeft = clampX > s.px;
                s.projectiles.push({
                    kind: 'adam_frisbee',
                    fromPlayer: false,
                    worldSpace: false,
                    x: clampX,
                    y: ry - (Math.random() < 0.35 ? 38 : 0),
                    vx: toLeft ? -485 : 485,
                    vy: -60,
                    r: 18,
                    life: 2.5
                });
                if (window.soundManager) window.soundManager.playThrow();
            }
        }

        // Avalanche
        if (s.avalanche) {
            const av = s.avalanche;
            const targetAvSpeed = s.baseSpeed * (s.cfg.avalanchePace || 0.89) * (diff.speedMult || 1);
            av.speed += (targetAvSpeed - av.speed) * 2 * dt;
            av.dist += av.speed * dt;
            if (s.dist - av.dist > 560) av.dist = s.dist - 560; // Rubberband tension
            av.shake = Math.max(0, 1 - (s.dist - av.dist) / 360);
            if (av.dist >= s.dist - 18) {
                g.lastDamageReason = 'ski_avalanche';
                g.player.hp = 0;
                g.updateBars();
                g.triggerGameOver();
                return;
            }
        }

        // End of Run 1 -> Trigger animated Chairlift return + Monika Schneider Debrief -> Run 2!
        if (s.downhillPhase === 'run1' && s.dist >= s.run1Length) {
            s.downhillPhase = 'cutscene_lift';
            s.cutsceneTimer = 0;
            s.cutsceneDuration = 3.6;
            s.debriefAdamPlayed = false;
            s.projectiles = [];
            s.z = 0;
            s.vz = 0;
            if (s.avalanche) s.avalanche.dist = s.dist - 540;
            s.adamQuote = '„Ab in den Sessel — wir fahren wieder hoch!“';
            s.adamQuoteTimer = 3.4;
            if (window.soundManager) window.soundManager.playClip('adam_setup_genehmigt', null, 0.92, { lowPriority: true });
            g.addFloatingText('🚡 ABFAHRT 1 ZIEL! RÜCKFAHRT IM SKILIFT...', SKI_VW * 0.5, 195, '#00d2d3', 22);
            return;
        }

        if (s.downhillPhase === 'run2' && s.dist >= s.length) Ski.win(g, s);
    },

    updateDownhillCutscene(g, s, inputs, dt) {
        s.cutsceneTimer += dt;
        const canSkip = s.cutsceneTimer >= 0.70 && inputs.jumpPressed;

        if (s.downhillPhase === 'cutscene_lift') {
            if (canSkip || s.cutsceneTimer >= s.cutsceneDuration) {
                s.downhillPhase = 'cutscene_debrief';
                s.cutsceneTimer = 0;
                s.cutsceneDuration = 4.6;
                s.debriefAdamPlayed = false;
                if (window.soundManager) {
                    window.soundManager.playClip('monika_adam_korrigiere', null, 0.95, { lowPriority: true });
                }
            }
        } else if (s.downhillPhase === 'cutscene_debrief') {
            if (s.cutsceneTimer >= 2.25 && !s.debriefAdamPlayed) {
                s.debriefAdamPlayed = true;
                if (window.soundManager) {
                    window.soundManager.playClip('adam_nimm_frisbee_fahr', null, 0.92, { lowPriority: true });
                }
            }
            if (canSkip || s.cutsceneTimer >= s.cutsceneDuration) {
                s.downhillPhase = 'run2';
                s.cutsceneTimer = 0;
                s.dist = Math.max(s.dist, s.run1Length + 30);
                s.speed = s.baseSpeed * 0.85;
                s.invuln = 1.6;
                if (s.rival) {
                    s.rival.dist = s.dist + 130;
                    s.rival.throwCd = 2.4;
                }
                if (s.avalanche) {
                    s.avalanche.dist = s.dist - 520;
                }
                g.player.hp = Math.min(g.player.maxHp, g.player.hp + 20);
                g.updateBars();
                if (window.soundManager) window.soundManager.playPowerUp();
                g.addFloatingText('⛷️ ABFAHRT 2/2 VOLLGAS! (+20 HP)', SKI_VW * 0.5, 195, '#2ed573', 23);
            }
        }
    },

    // =========================================================================
    // 2. LIVE SLALOM VS HERR ADAM (Oben ↓ Unten, Tore FEST im Schnee!)
    // =========================================================================
    updateSlalom(g, s, inputs, dt) {
        const diff = g.getActiveDifficulty ? g.getActiveDifficulty() : { speedMult: 1, aggroMult: 1 };

        // Smooth section transition wipe (when crossing bottom of one slope section to top of next)
        if (s.secTransition > 0) {
            s.secTransition = Math.max(0, s.secTransition - dt);
            if (s.secTransition <= 0) {
                s.slalomSec = Math.min((s.slalomSections || 1) - 1, s.slalomSec + 1);
                s.py = 172;
                s.projectiles = [];
                if (s.rival && s.rival.sec < s.slalomSec) {
                    s.rival.sec = s.slalomSec;
                    s.rival.py = 164;
                }
            }
            return;
        }

        if (inputs.dashPressed && s.dashCd <= 0) {
            s.dashTimer = 0.42;
            s.dashCd = 2.8;
            if (window.soundManager) window.soundManager.playPowerUp();
            g.addFloatingText('💨 CARVE-DASH!', Ski.slalomScreenX(s.px, s.py), s.py - 55, '#00d2d3', 18);
        }

        // Downhill speed & Tuck [S] / Precision Brake [W]
        const tuck = inputs.down;
        const precisionBrake = inputs.up;
        let targetSpeed = s.baseSpeed * (tuck ? 1.24 : (precisionBrake ? 0.74 : 1.0));
        if (s.boostTimer > 0) targetSpeed = Math.max(targetSpeed, s.maxSpeed * 0.98);
        if (s.gateCombo >= 3) targetSpeed += Math.min(80, s.gateCombo * 14);

        // Drafting behind Herr Adam gives visible slipstream boost!
        let inSlipstream = false;
        if (s.rival && s.rival.sec === s.slalomSec) {
            const gapY = s.rival.py - s.py;
            if (gapY > 24 && gapY < 180 && Math.abs(s.rival.x - s.px) < 95) {
                inSlipstream = true;
                targetSpeed += 75;
            }
        }
        s.inSlipstream = inSlipstream;
        s.speed += (Math.min(s.maxSpeed, targetSpeed) - s.speed) * Math.min(1, 5.5 * dt);

        // Responsive snappy lateral carving [A / D]
        const steer = (inputs.right ? 1 : 0) - (inputs.left ? 1 : 0);
        const latMax = s.dashTimer > 0 ? 1040 : (precisionBrake ? 830 : 755);
        s.vx += (steer * latMax - s.vx) * Math.min(1, 17 * dt);
        s.px = Math.max(255, Math.min(SKI_VW - 255, s.px + s.vx * dt));
        s.tilt = Math.max(-0.52, Math.min(0.52, s.vx / 700));

        // Skiers physically glide TOP -> BOTTOM past stationary gates!
        const downSpeed = Math.max(125, s.speed * 0.42);
        s.py += downSpeed * dt;
        const secProgress = Math.max(0, Math.min(1, (s.py - 172) / 496));
        s.dist = ((s.slalomSec + secProgress) / Math.max(1, s.slalomSections || 1)) * s.length;
        const heroSX = Ski.slalomScreenX(s.px, s.py);

        // Carve ice spray
        if (Math.abs(s.vx) > 95 && Math.random() < 0.75) {
            s.snowSpray.push({
                x: heroSX - Math.sign(s.vx) * 14,
                y: s.py - 6,
                vx: -s.vx * 0.22 + (Math.random() - 0.5) * 40,
                vy: -80 - Math.random() * 70,
                life: 0.34
            });
        }

        // Gate Passage Resolution for current stationary section
        for (const gt of s.gates) {
            if (gt.poleWhip > 0) gt.poleWhip = Math.max(0, gt.poleWhip - dt * 3);
            if (gt.sec !== s.slalomSec || gt.resolved) continue;
            if (s.py >= gt.y) {
                gt.resolved = true;
                const dx = Math.abs(s.px - gt.centerX);
                const fx = Ski.slalomScreenX(gt.centerX, gt.y);
                if (dx <= gt.halfW + 16) {
                    gt.hit = true;
                    gt.poleWhip = 1;
                    s.gatesPassed++;
                    s.gateCombo++;
                    s.score += 120 + s.gateCombo * 25;
                    s.boostTimer = Math.max(s.boostTimer, 0.75);
                    if (window.soundManager) window.soundManager.playCollect();
                    g.spawnBurst(fx, gt.y + 8, 10, gt.color === 'red' ? '#ff6b81' : '#70a1ff', 5, 16);
                    g.addFloatingText(
                        s.gateCombo >= 3 ? `✅ TOR #${gt.index} (×${s.gateCombo} KOMBO!)` : `✅ TOR #${gt.index}`,
                        heroSX, s.py - 46, '#2ed573', 19
                    );
                } else {
                    gt.hit = false;
                    s.gateCombo = 0;
                    s.speed = Math.max(270, s.speed * 0.76);
                    g.addFloatingText(`❌ TOR #${gt.index} VERPASST!`, heroSX, s.py - 46, '#ff6b81', 18);
                    if (Math.random() < 0.45 && window.soundManager) {
                        window.soundManager.playClip('adam_strafe_verpasst', null, 0.9, { lowPriority: true });
                    }
                }
            }
        }

        // Collectibles in active section (stationary!)
        for (const col of s.collectibles) {
            if (col.collected || col.sec !== s.slalomSec) continue;
            if (Math.abs(s.px - col.x) < 48 && Math.abs(s.py - col.y) < 38) {
                col.collected = true;
                Ski.collectItem(g, s, col.kind, Ski.slalomScreenX(col.x, col.y), col.y);
            }
        }

        // Herr Adam Live Slalom AI: carves stationary gates Top -> Bottom section by section!
        if (s.rival) {
            const r = s.rival;
            if (r.stunTimer > 0) r.stunTimer -= dt;
            else {
                const targetRSpeed = s.baseSpeed * (s.cfg.rivalPace || 0.92) * (diff.speedMult || 1);
                r.speed += (targetRSpeed - r.speed) * 2.8 * dt;
                const rDown = Math.max(115, r.speed * 0.42);
                r.py = (r.py || 164) + rDown * dt;
                r.y = r.py;

                // Smooth S-curve between stationary gates of Adam's active section
                const secGates = s.gates.filter(gt => gt.sec === (r.sec || 0));
                let targetAX = SKI_VW * 0.5;
                for (let i = 0; i < secGates.length; i++) {
                    const gCur = secGates[i];
                    if (gCur.y >= r.py) {
                        const prevY = i === 0 ? 164 : secGates[i - 1].y;
                        const prevX = i === 0 ? SKI_VW * 0.5 : secGates[i - 1].centerX;
                        const frac = Math.max(0, Math.min(1, (r.py - prevY) / Math.max(1, gCur.y - prevY)));
                        const smooth = frac * frac * (3 - 2 * frac);
                        targetAX = prevX + (gCur.centerX - prevX) * smooth;
                        break;
                    } else if (i === secGates.length - 1) {
                        targetAX = gCur.centerX;
                    }
                }
                const oldX = r.x;
                r.x += (targetAX - r.x) * Math.min(1, 5.5 * dt);
                r.tilt = Math.max(-0.48, Math.min(0.48, (r.x - oldX) * 0.25));

                if (r.py >= 668) {
                    if ((r.sec || 0) < (s.slalomSections || 1) - 1) {
                        r.sec = (r.sec || 0) + 1;
                        r.py = 164;
                    } else {
                        r.py = 668;
                    }
                }
            }

            // Herr Adam tosses frisbees when in the same visible mountain section
            r.throwCd -= dt;
            if (r.throwCd <= 0 && r.stunTimer <= 0 && r.sec === s.slalomSec) {
                r.throwCd = Math.max(2.3, 3.6 / (diff.aggroMult || 1));
                r.throwAnimTimer = 0.45;
                const rSX = Ski.slalomScreenX(r.x, r.py);
                if (r.py > 120 && r.py < SKI_VH - 55) {
                    const dx = heroSX - rSX;
                    const dy = s.py - r.py;
                    const len = Math.max(1, Math.hypot(dx, dy));
                    s.projectiles.push({
                        kind: 'adam_frisbee',
                        fromPlayer: false,
                        worldSpace: false,
                        x: rSX,
                        y: r.py,
                        vx: (dx / len) * 380,
                        vy: (dy / len) * 380,
                        r: 17,
                        life: 2.0
                    });
                    if (window.soundManager) window.soundManager.playThrow();
                }
            }
        }

        // Reached bottom of current section -> snow wipe to next section OR final finish!
        if (s.py >= 668) {
            if (s.slalomSec < (s.slalomSections || 1) - 1) {
                s.secTransition = 0.55;
                g.addFloatingText(`⛷️ HANG ${s.slalomSec + 1} FERTIG — WEITER!`, SKI_VW * 0.5, 210, '#00d2d3', 21);
            } else {
                if (s.gatesPassed >= s.gatesRequired) {
                    Ski.win(g, s);
                } else {
                    g.lastDamageReason = 'ski_slalom';
                    g.showMemePopup(`❌ NUR ${s.gatesPassed}/${s.gatesRequired} TORE — DISQUALIFIZIERT!`);
                    g.triggerGameOver();
                }
            }
        }
    },

    // =========================================================================
    // 3. AKTIVER SKILIFT BERGAUF (Feste Decks + Ping-Pong Sessel, kein Teleport!)
    // =========================================================================
    updateSkiLift(g, s, inputs, dt) {
        const ls = s.liftState;
        const diff = g.getActiveDifficulty ? g.getActiveDifficulty() : { aggroMult: 1 };

        // Fixed decks stay rock-solid (vx===0); moving chairs/gondolas glide smoothly Ping-Pong (ZERO teleport!)
        for (const p of ls.platforms) {
            p.dx = 0;
            if (!p.isFixed && p.vx > 0 && p.fallenTimer <= 0) {
                const prevX = p.x;
                p.dir = p.dir || 1;
                p.x += p.vx * p.dir * dt;
                if (p.x >= p.maxX) {
                    p.x = p.maxX;
                    p.dir = -1;
                } else if (p.x <= p.minX) {
                    p.x = p.minX;
                    p.dir = 1;
                }
                p.dx = p.x - prevX;
            }
            if (p.fallenTimer > 0) {
                p.fallenTimer -= dt;
                if (p.fallenTimer <= 0) {
                    p.iceTimer = 0;
                    p.x = p.baseX;
                    p.dir = 1;
                }
            }
            const bob = (!p.isFixed && p.vx > 0) ? Math.sin(s.timeLeft * 2.4 + (p.bobPhase || 0)) * 3.5 : 0;
            p.topY = Ski.liftSlopeY(p.x + p.w * 0.5) + p.offsetY + bob;
        }

        // Cooldowns & timers
        if (ls.bounceCd > 0) ls.bounceCd -= dt;
        if (ls.coyoteTimer > 0) ls.coyoteTimer -= dt;
        if (ls.jumpBufferTimer > 0) ls.jumpBufferTimer -= dt;
        if (inputs.jumpPressed) ls.jumpBufferTimer = 0.14;
        if (!ls.dashCharges) {
            ls.dashRecharge += dt;
            if (ls.dashRecharge >= 2.2) { ls.dashCharges = 1; ls.dashRecharge = 0; }
        }

        // [SHIFT] Air-Dash across canyon gaps
        if (inputs.dashPressed && ls.dashCharges > 0 && !ls.grounded) {
            ls.dashCharges = 0;
            ls.dashRecharge = 0;
            s.vx = 640;
            s.vy = -175;
            s.dashTimer = 0.28;
            if (window.soundManager) window.soundManager.playPowerUp();
            g.shockwaves.push({
                x: s.px - s.camX, y: s.py - s.camY - 24,
                radius: 14, maxRadius: 120, color: '#00d2d3', alpha: 0.9, lineWidth: 5
            });
            g.addFloatingText('⚡ AIR-DASH!', SKI_VW * 0.45, 220, '#00d2d3', 18);
        }

        // Carry player smoothly with ridden chair (not when chair looped back to minX)
        if (ls.grounded && ls.currentPlatform) {
            if (ls.currentPlatform.fallenTimer > 0) {
                ls.grounded = false;
                ls.currentPlatform = null;
            } else {
                s.px += ls.currentPlatform.dx || 0;
                // Ice chair instability countdown when standing on it
                if (ls.currentPlatform.kind === 'ice_chair') {
                    ls.currentPlatform.iceTimer += dt;
                    if (ls.currentPlatform.iceTimer >= ls.currentPlatform.iceLimit) {
                        ls.currentPlatform.fallenTimer = 3.2;
                        ls.grounded = false;
                        ls.currentPlatform = null;
                        if (window.soundManager) window.soundManager.playHit();
                        g.addFloatingText('❄️ EIS-SESSEL ABGEBROCHEN!', SKI_VW * 0.45, 210, '#70a1ff', 18);
                    }
                }
            }
        } else if (ls.onGrindWire) {
            // Fast automatic spark grind along gleaming gold wire!
            s.px += 470 * dt;
            s.py = Ski.liftSlopeY(s.px) + ls.onGrindWire.offsetY;
            s.vy = 0;
            if (Math.random() < 0.85) {
                s.snowSpray.push({ x: s.px - 10, y: s.py, vx: -180, vy: -80 - Math.random() * 90, life: 0.35, color: '#ffd32a' });
            }
            if (s.px > ls.onGrindWire.x2 + 12) {
                ls.onGrindWire = null;
                ls.coyoteTimer = 0.14;
                ls.jumpsLeft = 2;
            }
        }

        // Horizontal movement in mountain space (A = back left, D = run/jump right uphill)
        const moveInput = (inputs.right ? 1 : 0) - (inputs.left ? 1 : 0);
        if (s.dashTimer <= 0 && !ls.onGrindWire) {
            const targetVx = moveInput * 395;
            s.vx += (targetVx - s.vx) * Math.min(1, (ls.grounded ? 16 : 9) * dt);
        }
        if (!ls.onGrindWire) s.px += s.vx * dt;
        s.px = Math.max(-60, Math.min(ls.goalDist + 240, s.px));

        // Jump execution (Coyote Time + Double Jump + Variable Jump)
        if (ls.jumpBufferTimer > 0) {
            if (ls.grounded || ls.coyoteTimer > 0 || ls.onGrindWire) {
                s.vy = -705;
                ls.grounded = false;
                ls.currentPlatform = null;
                ls.onGrindWire = null;
                ls.coyoteTimer = 0;
                ls.jumpBufferTimer = 0;
                ls.jumpsLeft = 1;
                if (window.soundManager) window.soundManager.playJump();
            } else if (ls.jumpsLeft > 0) {
                s.vy = -665;
                ls.jumpsLeft = 0;
                ls.jumpBufferTimer = 0;
                if (window.soundManager) window.soundManager.playJump();
                g.addFloatingText('⬆️ DOPPELSPRUNG!', SKI_VW * 0.45, 240, '#2ed573', 17);
            }
        }

        // Check stepping off edge of current platform
        if (ls.grounded && ls.currentPlatform) {
            const cp = ls.currentPlatform;
            if (s.px < cp.x - 16 || s.px > cp.x + cp.w + 16) {
                ls.grounded = false;
                ls.currentPlatform = null;
                ls.coyoteTimer = 0.13;
            } else {
                s.py = cp.topY;
                s.vy = 0;
            }
        }

        // Airborne Gravity, Wire-Grind catch, and Platform Landing
        if (!ls.grounded && !ls.onGrindWire) {
            const prevY = s.py;
            s.vy += 1740 * dt;
            s.py += s.vy * dt;

            // Optional Gold Express Wire catch when descending onto it
            if (s.vy >= -40) {
                for (const gw of ls.grindWires) {
                    if (s.px >= gw.x1 && s.px <= gw.x2) {
                        const wy = Ski.liftSlopeY(s.px) + gw.offsetY;
                        if (prevY <= wy + 18 && s.py >= wy - 10) {
                            ls.onGrindWire = gw;
                            ls.jumpsLeft = 2;
                            s.py = wy;
                            s.vy = 0;
                            if (window.soundManager) window.soundManager.playPowerUp();
                            g.addFloatingText('⚡ EXPRESS-SEIL GRIND!', SKI_VW * 0.48, 210, '#ffd32a', 20);
                            break;
                        }
                    }
                }
            }

            // Platform Landing Check (chairs, ice chairs, trampoline gondolas, steel masts)
            if (!ls.onGrindWire && s.vy >= 0) {
                for (const p of ls.platforms) {
                    if (p.fallenTimer > 0) continue;
                    if (s.px >= p.x - 18 && s.px <= p.x + p.w + 18) {
                        if (prevY <= p.topY + 20 && s.py >= p.topY - 6) {
                            if (p.kind === 'gondola' && ls.bounceCd <= 0) {
                                // Super bounce off panoramic red gondola roof!
                                s.py = p.topY;
                                s.vy = inputs.jumpHeld ? -945 : -805;
                                ls.grounded = false;
                                ls.currentPlatform = null;
                                ls.jumpsLeft = 2;
                                ls.bounceCd = 0.18;
                                ls.dashCharges = 1;
                                if (window.soundManager) window.soundManager.playJump();
                                g.spawnBurst(s.px - s.camX, s.py - s.camY, 12, '#2ed573', 6, 16);
                                g.addFloatingText('🟢 GONDEL-SPRUNG!', SKI_VW * 0.45, 225, '#2ed573', 19);
                            } else {
                                s.py = p.topY;
                                s.vy = 0;
                                ls.grounded = true;
                                ls.currentPlatform = p;
                                ls.jumpsLeft = 2;
                                ls.dashCharges = 1;
                            }
                            break;
                        }
                    }
                }
            }
        }

        // LETHAL ABYSS CHECK: Falling past the alpine gorge floor kills the player immediately!
        if (s.py > Ski.abyssFloorY(s.px)) {
            g.lastDamageReason = 'ski_abyss';
            g.player.hp = 0;
            g.updateBars();
            if (window.soundManager) window.soundManager.playHit();
            g.showMemePopup('💀 IN DIE ALPEN-SCHLUCHT GESTÜRZT!');
            g.triggerGameOver();
            return;
        }

        // Collectibles in mountain space
        for (const col of s.collectibles) {
            if (col.collected) continue;
            const cy = Ski.liftSlopeY(col.x) + col.offsetY;
            if (Math.hypot(s.px - col.x, (s.py - 26) - cy) < 44) {
                col.collected = true;
                Ski.collectItem(g, s, col.kind, s.px - s.camX, cy - s.camY);
            }
        }

        // Telegraphed Icicles over canyon / Masts
        s.icicleCd -= dt;
        if (s.icicleCd <= 0) {
            s.icicleCd = Math.max(1.3, 2.15 / (diff.aggroMult || 1));
            const dropX = s.px + 100 + Math.random() * 290;
            if (dropX < ls.goalDist - 120) {
                s.icicles.push({
                    x: dropX,
                    y: Ski.liftSlopeY(dropX) - 290,
                    vy: 0,
                    telegraph: 0.78,
                    falling: false,
                    hit: false
                });
            }
        }
        for (let i = s.icicles.length - 1; i >= 0; i--) {
            const ic = s.icicles[i];
            if (!ic.falling) {
                ic.telegraph -= dt;
                if (ic.telegraph <= 0) ic.falling = true;
            } else {
                ic.vy += 980 * dt;
                ic.y += ic.vy * dt;
                if (!ic.hit && Math.abs(ic.x - s.px) < 26 && Math.abs(ic.y - (s.py - 28)) < 36) {
                    ic.hit = true;
                    Ski.damagePlayer(g, s, 14, '🧊 EISZAPFEN!', 'ski_crash');
                    if (g.state !== GAME_STATE.RUNNING) return;
                }
                if (ic.y > Ski.abyssFloorY(ic.x) + 40) s.icicles.splice(i, 1);
            }
        }

        // Descending rival Frisbees from ahead uphill
        s.frisbeeCd -= dt;
        if (s.frisbeeCd <= 0) {
            s.frisbeeCd = Math.max(1.85, 2.95 / (diff.aggroMult || 1));
            s.projectiles.push({
                kind: 'adam_frisbee',
                fromPlayer: false,
                worldSpace: true,
                x: s.px + 620,
                y: Ski.liftSlopeY(s.px + 620) - 70 - Math.random() * 80,
                vx: -430,
                vy: 55,
                r: 18,
                life: 3.0
            });
            if (window.soundManager) window.soundManager.playThrow();
        }

        // Camera climbs smoothly uphill behind Thenerean
        ls.bestX = Math.max(ls.bestX, s.px);
        ls.progress = s.px;
        const targetCamX = s.px - SKI_VW * 0.32;
        const targetCamY = Ski.liftSlopeY(s.px + 180) - SKI_VH * 0.45;
        s.camX += (targetCamX - s.camX) * Math.min(1, 7.5 * dt);
        s.camY += (targetCamY - s.camY) * Math.min(1, 6.5 * dt);

        if (s.px >= ls.goalDist - 20 && ls.grounded) {
            Ski.win(g, s);
        }
    },

    // =========================================================================
    // 4. RIESEN-SCHANZE WEITSPRUNG (Links -> Rechts, 4 aktive Skill-Phasen!)
    // =========================================================================
    updateSkiJump(g, s, inputs, dt) {
        const js = s.jumpState;
        const diff = g.getActiveDifficulty ? g.getActiveDifficulty() : { aggroMult: 1 };

        // Live alpine crosswind / gust oscillations
        js.windGustPhase += dt * 2.4;

        if (js.phase === 'inrun') {
            // Player must tuck [S] for speed AND counter crosswind track drift using [A / D]
            const gustForce = Math.sin(js.windGustPhase * 1.4) * 1.15 + Math.cos(js.windGustPhase * 2.7) * 0.55;
            const steer = (inputs.right ? 1 : 0) - (inputs.left ? 1 : 0);
            js.balance += (gustForce * 0.72 + steer * 2.3) * dt;
            js.balance = Math.max(-1, Math.min(1, js.balance));

            const inSweetSpot = Math.abs(js.balance) <= 0.38;
            const maxInrun = inputs.down ? (inSweetSpot ? 785 : 680) : (inSweetSpot ? 560 : 490);
            const accel = (inputs.down ? 245 : 135) * (inSweetSpot ? 1.15 : 0.85);

            js.inrunSpeed = Math.min(maxInrun, js.inrunSpeed + accel * dt);
            js.inrunX += js.inrunSpeed * dt;
            js.wx = js.inrunX;
            js.wy = Ski.jumpRampY(js.wx);

            if (js.wx >= 1160) {
                js.phase = 'takeoff';
                js.takeoffPos = 0;
            }
        } else if (js.phase === 'takeoff') {
            const steer = (inputs.right ? 1 : 0) - (inputs.left ? 1 : 0);
            js.balance = Math.max(-1, Math.min(1, js.balance + steer * 1.8 * dt));
            js.takeoffPos = Math.min(1.06, (js.inrunX - 1160) / 300);
            js.inrunSpeed = Math.min(805, js.inrunSpeed + (inputs.down ? 135 : 35) * dt);
            js.inrunX += js.inrunSpeed * dt;
            js.wx = js.inrunX;
            js.wy = Ski.jumpRampY(js.wx);

            if (inputs.jumpPressed || js.takeoffPos >= 1.0) {
                const missed = !inputs.jumpPressed;
                const idealDist = Math.abs(js.takeoffPos - 0.88);
                const timingScore = missed ? 0.1 : Math.max(0.32, 1 - idealDist * 2.0);
                const balBonus = Math.abs(js.balance) <= 0.4 ? 1.08 : 0.88;

                js.phase = 'flight';
                js.takeoffQuality = timingScore;
                if (missed) {
                    js.vx = js.inrunSpeed * 0.74;
                    js.vy = -105;
                    js.pitchDeg = -13;
                } else {
                    js.vx = js.inrunSpeed * (0.90 + timingScore * 0.14) * balBonus;
                    js.vy = -(255 + timingScore * 195);
                    js.pitchDeg = 9 + timingScore * 6;
                }
                if (window.soundManager) window.soundManager.playJump();
                g.addFloatingText(
                    timingScore >= 0.82 ? '🚀 PERFEKTER ABSPRUNG!' : (missed ? '😬 STOLPERER AM TISCH!' : '🎿 GUTES TIMING!'),
                    SKI_VW * 0.5, 195, timingScore >= 0.82 ? '#2ed573' : '#ffd32a', 22
                );
            }
        } else if (js.phase === 'flight') {
            // Live wind gusts drift landing balance -> player corrects smoothly with [A / D] so landing is ALWAYS controlled!
            js.windShiftCd -= dt;
            if (js.windShiftCd <= 0) {
                js.windShiftCd = 0.9 + Math.random() * 0.9;
                js.windMs = Math.max(-4.8, Math.min(4.8, js.windMs + (Math.random() - 0.5) * 3.6));
            }
            const balDrift = Math.sin(js.windGustPhase * 1.45) * 0.44 + js.windMs * 0.14;
            const balCtrl = (inputs.right ? 1 : 0) - (inputs.left ? 1 : 0);
            js.landBalance = Math.max(-1, Math.min(1, (js.landBalance || 0) + (balDrift + balCtrl * 2.35) * dt));
            js.balance = js.landBalance;

            // Self-stabilized aerodynamic flight pitch (+14° V-Style sweet spot, optionally trimmed via [W / S])
            const pitchCtrl = (inputs.up ? 28 : 0) - (inputs.down ? 28 : 0);
            js.pitchDeg += (pitchCtrl + (14 - js.pitchDeg) * 1.65) * dt;
            js.pitchDeg = Math.max(-4, Math.min(26, js.pitchDeg));

            // One mid-air Wing-Dash [SHIFT] + extra glide speed when [A / D] keeps landing balanced!
            if (inputs.dashPressed && js.dashReady) {
                js.dashReady = false;
                js.vx += 115;
                js.vy -= 75;
                if (window.soundManager) window.soundManager.playPowerUp();
                g.addFloatingText('⚡ TURBO-FLÜGELSTOSS!', SKI_VW * 0.5, 220, '#00d2d3', 20);
            }

            const balBalanced = Math.abs(js.landBalance) <= 0.45;
            const liftRatio = Math.max(0.35, 1 - Math.abs(js.pitchDeg - 14) / 18) * (balBalanced ? 1.12 : 0.92);
            const drag = balBalanced ? 8 : 22;

            const grav = 615 * (1 - liftRatio * 0.44);
            js.vx = Math.max(300, js.vx + ((balBalanced ? 42 : -12) + js.windMs * 8 - drag) * dt);
            js.vy += grav * dt;
            js.wx += js.vx * dt;
            js.wy += js.vy * dt;

            const groundY = Ski.jumpValleyY(js.wx);
            const altY = groundY - js.wy;

            // Grab Stunt [SPACE] when high enough in flight
            if (inputs.jumpPressed && altY > 82 && js.stuntsDone < 2 && s.spinAngle <= 0) {
                js.stuntsDone++;
                s.spinAngle = 0.05;
                js.vy -= 40;
                js.vx += 24;
                if (window.soundManager) window.soundManager.playPowerUp();
                g.addFloatingText('🌀 360° V-STYLE STUNT! (+10m)', SKI_VW * 0.5, 282, '#ffd32a', 21);
            }
            if (s.spinAngle > 0) {
                s.spinAngle += 14.5 * dt;
                if (s.spinAngle >= Math.PI * 2) s.spinAngle = 0;
            }

            // Thermal Updraft Rings
            for (const rg of js.rings) {
                if (rg.hit) continue;
                if (Math.hypot(js.wx - rg.x, js.wy - rg.y) < rg.r + 32) {
                    rg.hit = true;
                    js.vx += 46;
                    js.vy -= 38;
                    js.stuntsDone += 0.6;
                    g.player.megaEnergy = Math.min(g.player.maxMegaEnergy, g.player.megaEnergy + 22);
                    if (window.soundManager) window.soundManager.playCollect();
                    g.addFloatingText(`🌀 THERMIK-RING! (+${rg.bonusM}m)`, SKI_VW * 0.5, 282, '#00d2d3', 21);
                }
            }

            // Controlled Touchdown: landing is ALWAYS clean & controlled — [A/D] balance earns Telemark bonus meters!
            if (altY <= 4) {
                js.wy = groundY;
                const balErr = Math.abs(js.landBalance || 0);
                const balBonus = balErr <= 0.44 ? 18 : (balErr <= 0.78 ? 8 : 0);
                js.landBalanceBonusM = balBonus;
                js.landedTelemark = true;
                js.crashed = false;

                const rawMeters = Math.max(30, (js.wx - 1460) / 14.5 + js.stuntsDone * 10);
                js.flightMeters = Math.round(rawMeters + balBonus);
                js.bestMeters = Math.max(js.bestMeters, js.flightMeters);
                js.totalMeters += js.flightMeters;

                g.spawnBurst(SKI_VW * 0.45, SKI_VH * 0.65, 14, '#ffffff', 6, 18);
                if (balErr <= 0.44) {
                    if (window.soundManager) window.soundManager.playWaveClear();
                    g.addFloatingText(`⭐ PERFEKTE LANDUNG (A/D +${balBonus}m): ${js.flightMeters}m!`, SKI_VW * 0.5, 200, '#2ed573', 25);
                } else if (balErr <= 0.78) {
                    if (window.soundManager) window.soundManager.playWaveClear();
                    g.addFloatingText(`✅ SAUBERE LANDUNG (+${balBonus}m): ${js.flightMeters}m!`, SKI_VW * 0.5, 200, '#70a1ff', 24);
                } else {
                    if (window.soundManager) window.soundManager.playCollect();
                    g.addFloatingText(`🎿 KONTROLLIERTE LANDUNG: ${js.flightMeters}m!`, SKI_VW * 0.5, 200, '#ffd32a', 23);
                }

                js.phase = 'outrun';
                js.outRunTimer = 1.55;
                s.spinAngle = 0;

                if (js.bestMeters >= js.targetSingleMeters || js.totalMeters >= js.targetTotalMeters) {
                    setTimeout(() => { if (g.state === GAME_STATE.RUNNING) Ski.win(g, s); }, 700);
                }
            }
        } else if (js.phase === 'outrun') {
            js.vx *= Math.pow(0.28, dt);
            js.wx += js.vx * dt;
            js.wy = Ski.jumpValleyY(js.wx);
            js.outRunTimer -= dt;
            if (js.outRunTimer <= 0 || (js.outRunTimer < 1.15 && inputs.jumpPressed)) {
                if (js.bestMeters >= js.targetSingleMeters || js.totalMeters >= js.targetTotalMeters) {
                    Ski.win(g, s);
                } else {
                    Ski.setupSkiJumpAttempt(g, s, false);
                    g.addFloatingText(`🎿 DURCHGANG #${s.jumpState.attempt} STARTET!`, SKI_VW * 0.5, 210, '#ffd32a', 22);
                }
            }
        }

        // Smooth camera tracking & altitude auto-zoom across Left-to-Right valley
        const alt = Math.max(0, Ski.jumpValleyY(js.wx) - js.wy);
        const targetScale = js.phase === 'flight' ? Math.max(0.68, 0.94 - alt * 0.00055) : (js.phase === 'outrun' ? 0.85 : 0.98);
        s.camScale += (targetScale - s.camScale) * Math.min(1, 3.2 * dt);
        const viewW = SKI_VW / s.camScale;
        const viewH = SKI_VH / s.camScale;
        const targetCamX = Math.max(0, js.wx - viewW * 0.30);
        const targetCamY = js.wy - viewH * 0.44;
        s.camX += (targetCamX - s.camX) * Math.min(1, 6.5 * dt);
        s.camY += (targetCamY - s.camY) * Math.min(1, 6.5 * dt);
    },

    collectItem(g, s, kind, x, y) {
        if (window.soundManager) window.soundManager.playCollect();
        if (kind === 'coffee') {
            s.timeLeft = Math.min(s.timeLimit, s.timeLeft + 4.5);
            s.boostTimer = Math.max(s.boostTimer, 1.3);
            g.addFloatingText('☕ +4.5s & KOFFEIN!', x, y - 24, '#ffd32a', 19);
        } else if (kind === 'energy') {
            g.player.hp = Math.min(g.player.maxHp || 150, (g.player.hp || 0) + 14);
            g.player.megaEnergy = Math.min(g.player.maxMegaEnergy, g.player.megaEnergy + 30);
            g.updateBars();
            g.addFloatingText('⚡ +14 HP & MEGA!', x, y - 24, '#2ed573', 19);
        } else {
            s.score += 300;
            s.boostTimer = Math.max(s.boostTimer, 1.8);
            g.player.megaEnergy = Math.min(g.player.maxMegaEnergy, g.player.megaEnergy + 40);
            g.addFloatingText('🥏 GOLD-FRISBEE! +300', x, y - 24, '#ffd32a', 20);
        }
    },

    updateProjectiles(g, s, dt) {
        for (let i = s.projectiles.length - 1; i >= 0; i--) {
            const p = s.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.fromPlayer) {
                // Shoot down enemy frisbees/icicles
                for (let j = s.projectiles.length - 1; j >= 0; j--) {
                    if (j === i) continue;
                    const o = s.projectiles[j];
                    if (!o.fromPlayer && Math.hypot(p.x - o.x, p.y - o.y) < p.r + o.r + 12) {
                        s.projectiles.splice(j, 1);
                        if (j < i) i--;
                        s.score += 100;
                        if (window.soundManager) window.soundManager.playHit();
                        g.addFloatingText('📘 FRISBEE ABGEFANGEN!', SKI_VW * 0.5, 240, '#45aaf2', 18);
                        break;
                    }
                }
                // Stun Herr Adam in Slalom or Downhill
                if (s.rival && s.rival.stunTimer <= 0 && (s.subMode !== 'slalom' || s.rival.sec === s.slalomSec)) {
                    const rx = s.subMode === 'slalom' ? Ski.slalomScreenX(s.rival.x, s.rival.py) : s.px + (s.rival.dist - s.dist);
                    const ry = s.subMode === 'slalom' ? s.rival.py : Ski.slopeY(rx) - 30;
                    if (Math.hypot(p.x - rx, p.y - ry) < 54) {
                        s.rival.stunTimer = 2.2;
                        s.rival.speed *= 0.65;
                        p.life = 0;
                        if (window.soundManager) window.soundManager.playHit();
                        g.addFloatingText('📘 HERR ADAM GETROFFEN! (-TEMPO)', rx, ry - 52, '#ffd32a', 20);
                    }
                }
            } else {
                // Hit check vs Thenerean
                let tx = s.px, ty = s.py - s.z - 28;
                if (s.subMode === 'slalom') { tx = Ski.slalomScreenX(s.px, s.py); ty = s.py - 22; }
                else if (s.subMode === 'ski_lift') { tx = s.px; ty = s.py - 28; }
                else if (s.subMode === 'ski_jump' && s.jumpState) { tx = s.jumpState.wx; ty = s.jumpState.wy - 22; }

                if (Math.hypot(p.x - tx, p.y - ty) < p.r + 22) {
                    s.projectiles.splice(i, 1);
                    if (s.subMode === 'ski_jump' && s.jumpState) {
                        s.jumpState.vx = Math.max(300, s.jumpState.vx * 0.85);
                        s.jumpState.pitchDeg += (Math.random() > 0.5 ? 10 : -10);
                    } else {
                        s.speed = Math.max(220, s.speed * 0.72);
                    }
                    Ski.damagePlayer(g, s, 12, '🥏 FRISBEE-TREFFER!', 'frisbee');
                    if (g.state !== GAME_STATE.RUNNING) return;
                    continue;
                }
            }

            if (p.life <= 0) s.projectiles.splice(i, 1);
        }
    },

    updateHUDProgress(g, s) {
        let pct = 0;
        if (s.subMode === 'ski_jump' && s.jumpState) {
            const singleRatio = s.jumpState.bestMeters / s.jumpState.targetSingleMeters;
            const totalRatio = s.jumpState.totalMeters / s.jumpState.targetTotalMeters;
            pct = Math.min(100, Math.round(Math.max(singleRatio, totalRatio) * 100));
        } else {
            const cur = s.subMode === 'ski_lift' ? s.liftState.progress : s.dist;
            pct = Math.min(100, Math.max(0, Math.floor((cur / s.length) * 100)));
        }
        if (g.ui && g.ui.progBar) g.ui.progBar.style.width = `${pct}%`;
        if (g.ui && g.ui.progValText) g.ui.progValText.textContent = `${pct}%`;
        g.updateMissionPill();
    },

    win(g, s) {
        if (g.state !== GAME_STATE.RUNNING) return;
        if (window.soundManager) window.soundManager.playWaveClear();
        g.spawnBurst(SKI_VW * 0.5, SKI_VH * 0.45, 36, '#ffd32a', 9, 28);
        g.triggerLevelWin();
    },

    // =========================================================================
    // RENDER MASTER
    // =========================================================================
    render() {
        const g = this;
        const s = g.ski;
        if (!s) return;

        ctx.save();
        ctx.scale(canvas.width / SKI_VW, canvas.height / SKI_VH);
        if (s.subMode === 'downhill') {
            if (s.downhillPhase === 'cutscene_lift' || s.downhillPhase === 'cutscene_debrief') {
                Ski.renderDownhillCutscene(g, s);
            } else {
                Ski.renderDownhill(g, s);
            }
        }
        else if (s.subMode === 'slalom') Ski.renderSlalom(g, s);
        else if (s.subMode === 'ski_lift') Ski.renderSkiLift(g, s);
        else if (s.subMode === 'ski_jump') Ski.renderSkiJump(g, s);

        Ski.renderSnowParticles(s);
        if (!(s.subMode === 'downhill' && (s.downhillPhase === 'cutscene_lift' || s.downhillPhase === 'cutscene_debrief'))) {
            Ski.renderProjectiles(g, s);
        }

        // Ensure standard particles, shockwaves & floating feedback popups always draw visibly!
        if (g.drawShockwaves) g.drawShockwaves();
        if (g.drawParticles) g.drawParticles();
        if (g.drawFloatingTexts) g.drawFloatingTexts();

        if (s.hurtFlash > 0) {
            ctx.fillStyle = `rgba(255, 71, 87, ${Math.min(0.36, s.hurtFlash * 0.35)})`;
            ctx.fillRect(0, 0, SKI_VW, SKI_VH);
        }
        Ski.renderSkiHUD(g, s);
        ctx.restore();
    },

    // =========================================================================
    // CEL-SHADED BACKDROP & COMIC SCENERY HELPERS
    // =========================================================================
    drawSeamlessBackdrop(key, scrollPx, yOffset = 0, scaleY = 1.0) {
        const img = (typeof images !== 'undefined' && (images[key] || images.bg_ski_alps)) || null;
        if (!img || !img.complete || img.naturalWidth === 0) {
            const sky = ctx.createLinearGradient(0, 0, 0, SKI_VH);
            sky.addColorStop(0, '#1e5aa8');
            sky.addColorStop(0.55, '#68b2ee');
            sky.addColorStop(1, '#dceeff');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, SKI_VW, SKI_VH);
            return;
        }
        const imgH = SKI_VH * scaleY;
        const tileW = (img.naturalWidth / img.naturalHeight) * imgH;
        const startIdx = Math.floor(scrollPx / tileW) - 1;
        const endIdx = Math.ceil((scrollPx + SKI_VW) / tileW) + 1;
        for (let idx = startIdx; idx <= endIdx; idx++) {
            const tx = idx * tileW - scrollPx;
            const mirrored = (((idx % 2) + 2) % 2) === 1;
            if (!mirrored) {
                ctx.drawImage(img, tx - 0.5, yOffset, tileW + 1, imgH);
            } else {
                ctx.save();
                ctx.translate(tx + tileW + 0.5, yOffset);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0, tileW + 1, imgH);
                ctx.restore();
            }
        }
    },

    drawStaticFitBackdrop(key) {
        const img = (typeof images !== 'undefined' && (images[key] || images.bg_ski_alps)) || null;
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, 0, 0, SKI_VW, SKI_VH);
        } else {
            Ski.drawSeamlessBackdrop('bg_ski_alps', 0);
        }
    },

    drawComicPine(x, y, h, seed = 0) {
        ctx.save();
        ctx.translate(x, y);
        const w = h * 0.56;
        // Trunk
        ctx.fillStyle = '#4a3222';
        ctx.strokeStyle = '#151c2c';
        ctx.lineWidth = 2.2;
        ctx.fillRect(-w * 0.1, -h * 0.22, w * 0.2, h * 0.24);
        ctx.strokeRect(-w * 0.1, -h * 0.22, w * 0.2, h * 0.24);

        const tiers = 4;
        for (let t = 0; t < tiers; t++) {
            const tierY = -h * (0.20 + t * 0.20);
            const tierW = w * (1 - t * 0.18);
            const tierTop = tierY - h * 0.30;

            ctx.beginPath();
            ctx.moveTo(0, tierTop);
            ctx.lineTo(tierW * 0.52, tierY);
            ctx.quadraticCurveTo(0, tierY + 5, -tierW * 0.52, tierY);
            ctx.closePath();
            ctx.fillStyle = t % 2 === 0 ? '#1b4d3e' : '#246652';
            ctx.fill();
            ctx.stroke();

            // Crisp comic snow pillow per branch tier
            ctx.beginPath();
            ctx.moveTo(0, tierTop);
            ctx.lineTo(tierW * 0.36, tierTop + (tierY - tierTop) * 0.52);
            ctx.quadraticCurveTo(0, tierTop + (tierY - tierTop) * 0.62, -tierW * 0.34, tierTop + (tierY - tierTop) * 0.48);
            ctx.closePath();
            ctx.fillStyle = '#edf6ff';
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    },

    drawComicBoulder(x, y, w, h) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = '#151c2c';
        ctx.lineWidth = 2.6;
        // Angular rock body
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, 4);
        ctx.lineTo(-w * 0.44, -h * 0.55);
        ctx.lineTo(-w * 0.12, -h);
        ctx.lineTo(w * 0.28, -h * 0.88);
        ctx.lineTo(w * 0.5, -h * 0.25);
        ctx.lineTo(w * 0.46, 4);
        ctx.closePath();
        ctx.fillStyle = '#5c6b7c';
        ctx.fill();
        ctx.stroke();

        // Dark left shadow facet
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, 4);
        ctx.lineTo(-w * 0.44, -h * 0.55);
        ctx.lineTo(-w * 0.12, -h);
        ctx.lineTo(-w * 0.02, -h * 0.28);
        ctx.lineTo(-w * 0.16, 4);
        ctx.closePath();
        ctx.fillStyle = '#3b4858';
        ctx.fill();

        // Thick cel-shaded snow cap on top
        ctx.beginPath();
        ctx.moveTo(-w * 0.38, -h * 0.52);
        ctx.lineTo(-w * 0.12, -h);
        ctx.lineTo(w * 0.28, -h * 0.88);
        ctx.lineTo(w * 0.36, -h * 0.48);
        ctx.quadraticCurveTo(w * 0.08, -h * 0.36, -w * 0.18, -h * 0.55);
        ctx.closePath();
        ctx.fillStyle = '#f4f9ff';
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    },

    drawComicChalet(x, y, w, h) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = '#151c2c';
        ctx.lineWidth = 2.5;

        // Stone base & timber walls
        ctx.fillStyle = '#734a2d';
        ctx.fillRect(-w * 0.44, -h * 0.62, w * 0.88, h * 0.64);
        ctx.strokeRect(-w * 0.44, -h * 0.62, w * 0.88, h * 0.64);
        ctx.fillStyle = '#576574';
        ctx.fillRect(-w * 0.44, -h * 0.18, w * 0.88, h * 0.20);
        ctx.strokeRect(-w * 0.44, -h * 0.18, w * 0.88, h * 0.20);

        // Wooden balcony + vertical rails
        ctx.fillStyle = '#5c381f';
        ctx.fillRect(-w * 0.48, -h * 0.38, w * 0.96, h * 0.08);
        ctx.strokeRect(-w * 0.48, -h * 0.38, w * 0.96, h * 0.08);

        // Warm lit chalet windows
        ctx.fillStyle = '#ffd32a';
        for (const wx of [-w * 0.28, w * 0.12]) {
            ctx.fillRect(wx, -h * 0.54, w * 0.16, h * 0.14);
            ctx.strokeRect(wx, -h * 0.54, w * 0.16, h * 0.14);
        }

        // Stone chimney
        ctx.fillStyle = '#636e72';
        ctx.fillRect(w * 0.18, -h * 1.12, w * 0.14, h * 0.34);
        ctx.strokeRect(w * 0.18, -h * 1.12, w * 0.14, h * 0.34);

        // Steep Alpine Gable Roof + Thick Cel-Shaded Snow + Icicles
        ctx.beginPath();
        ctx.moveTo(-w * 0.56, -h * 0.56);
        ctx.lineTo(0, -h * 1.05);
        ctx.lineTo(w * 0.56, -h * 0.56);
        ctx.closePath();
        ctx.fillStyle = '#4c2c17';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-w * 0.58, -h * 0.58);
        ctx.lineTo(0, -h * 1.09);
        ctx.lineTo(w * 0.58, -h * 0.58);
        ctx.quadraticCurveTo(w * 0.25, -h * 0.65, 0, -h * 0.92);
        ctx.quadraticCurveTo(-w * 0.25, -h * 0.65, -w * 0.58, -h * 0.58);
        ctx.fillStyle = '#f1f8ff';
        ctx.fill();
        ctx.stroke();

        // Icicles along eave
        ctx.fillStyle = '#a3dcff';
        for (let ix = -w * 0.45; ix <= w * 0.45; ix += w * 0.18) {
            ctx.beginPath();
            ctx.moveTo(ix, -h * 0.57);
            ctx.lineTo(ix + 5, -h * 0.44);
            ctx.lineTo(ix + 10, -h * 0.57);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    },

    drawSpriteChar(key, footX, footY, targetH, facing = 1, hitFlash = 0, scaleX = 1, scaleY = 1, rot = 0) {
        const img = (typeof images !== 'undefined' && images[key]) || null;
        if (!img || !img.complete || img.naturalWidth === 0) return false;
        if (window.game && typeof window.game.drawCharacterSprite === 'function') {
            window.game.drawCharacterSprite(img, footX, footY, targetH, facing, hitFlash, scaleX, scaleY, rot);
            return true;
        }
        const aspect = img.naturalWidth / img.naturalHeight;
        const dh = targetH * scaleY;
        const dw = targetH * aspect * scaleX;
        ctx.save();
        ctx.translate(footX, footY);
        if (rot) ctx.rotate(rot);
        if (facing < 0) ctx.scale(-1, 1);
        ctx.drawImage(img, -dw * 0.5, -dh, dw, dh);
        ctx.restore();
        return true;
    },

    drawHeroRider(x, y, opts = {}) {
        const scale = opts.scale || 1;
        const tilt = opts.tilt || 0;
        const rot = opts.rot || 0;
        const tuck = opts.tuck || false;
        const air = opts.air || false;
        const slalom = opts.slalom || false;
        const attacking = opts.attacking || false;
        const blocking = opts.blocking || false;
        const hitFlash = opts.hurtFlash ? Math.ceil(opts.hurtFlash * 18) : 0;
        const t = opts.t !== undefined ? opts.t : (window.game ? window.game.animClock : 0);

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Ground drop shadow
        if (opts.shadowOffsetY !== undefined) {
            const shScale = Math.max(0.45, 1 - opts.shadowOffsetY / 260);
            ctx.save();
            ctx.translate(0, opts.shadowOffsetY);
            ctx.fillStyle = 'rgba(18, 34, 62, 0.30)';
            ctx.beginPath();
            ctx.ellipse(0, 2, 36 * shScale, 8.5 * shScale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.rotate(rot + tilt * 0.42);

        // Turbo aura when boosted
        if (opts.boost) {
            const aura = ctx.createRadialGradient(0, -48, 8, 0, -48, 66);
            aura.addColorStop(0, 'rgba(0, 210, 211, 0.38)');
            aura.addColorStop(0.6, 'rgba(255, 211, 42, 0.16)');
            aura.addColorStop(1, 'rgba(255, 211, 42, 0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(0, -48, 66, 0, Math.PI * 2);
            ctx.fill();
        }

        let poseKey = 'thenerean_idle';
        let sx = 1.0, sy = 1.0;
        if (blocking) {
            poseKey = 'thenerean_block';
            sx = 1.04; sy = 0.98;
        } else if (attacking) {
            poseKey = 'thenerean_attack';
            sx = 1.04; sy = 0.98;
        } else if (tuck) {
            poseKey = 'thenerean_duck';
            sx = 1.04; sy = 0.96;
        } else if (air) {
            poseKey = 'thenerean_jump';
            sx = 0.97; sy = 1.03;
        } else {
            const stride = Math.sin(t * 11);
            poseKey = stride > -0.25 ? 'thenerean_run' : 'thenerean_idle';
            sy = 1.0 + 0.028 * Math.abs(stride);
            sx = 1.0 - 0.015 * Math.abs(stride);
        }

        if (slalom) {
            // Slalom Top-Down / Chase Perspective GIBB-Frisbee Carving Board + Real Thenerean Avatar!
            ctx.save();
            ctx.rotate(tilt * 0.38);
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 2.6;
            const bGrad = ctx.createLinearGradient(0, -14, 0, 38);
            bGrad.addColorStop(0, '#ff4757');
            bGrad.addColorStop(0.5, '#ffd32a');
            bGrad.addColorStop(1, '#ff6348');
            ctx.fillStyle = bGrad;
            ctx.beginPath();
            ctx.roundRect(-15, -14, 30, 52, 12);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(-10, 4, 20, 8);
            ctx.restore();

            const slalomFacing = tilt < -0.05 ? -1 : 1;
            const drawn = Ski.drawSpriteChar(poseKey, 0, 7, 108, slalomFacing, hitFlash, sx, sy, 0);
            if (!drawn) {
                ctx.fillStyle = '#2d3748';
                ctx.fillRect(-14, -44, 28, 44);
            }
            if (blocking) {
                ctx.strokeStyle = '#00d2d3';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.arc(0, -45, 52, -Math.PI * 0.85, Math.PI * 0.85);
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        // Side-view cel-shaded GIBB-FRISBEE SNOWBOARD anchored cleanly under Thenerean's sneakers!
        ctx.strokeStyle = '#151c2c';
        ctx.lineWidth = 2.6;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-38, 1);
        ctx.quadraticCurveTo(-48, -9, -32, -8);
        ctx.lineTo(32, -8);
        ctx.quadraticCurveTo(49, -9, 40, 1);
        ctx.closePath();
        const fGrad = ctx.createLinearGradient(-36, -8, 38, 1);
        fGrad.addColorStop(0, '#ff4757');
        fGrad.addColorStop(0.5, '#ffd32a');
        fGrad.addColorStop(1, '#ff6348');
        ctx.fillStyle = fGrad;
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Foot-anchored genuine Thenerean Avatar right onto the Frisbee Snowboard!
        const drawn = Ski.drawSpriteChar(poseKey, 2, -4, 114, 1, hitFlash, sx, sy, 0);
        if (!drawn) {
            ctx.fillStyle = '#38463e';
            ctx.fillRect(-14, -64, 28, 56);
        }

        if (blocking) {
            ctx.strokeStyle = 'rgba(0, 210, 211, 0.85)';
            ctx.fillStyle = 'rgba(0, 210, 211, 0.16)';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(16, -54, 46, -Math.PI * 0.45, Math.PI * 0.45);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    },

    drawAdamRival(x, y, opts = {}) {
        const scale = opts.scale || 1;
        const tilt = opts.tilt || 0;
        const slalom = opts.slalom || false;
        const stunned = opts.stunned || false;
        const throwing = opts.throwing || false;
        const windup = opts.windup || false;
        const t = opts.t !== undefined ? opts.t : (window.game ? window.game.animClock : 0);

        let poseKey = 'adam_idle';
        let sx = 1.0, sy = 1.0;
        if (throwing) {
            poseKey = 'adam_throw';
            sx = 1.04; sy = 0.98;
        } else if (windup) {
            poseKey = 'adam_windup';
            sx = 1.03;
        } else {
            const step = Math.sin(t * 11 + 1.2);
            poseKey = step > -0.1 ? 'adam_run' : 'adam_idle';
            sy = 1.0 + 0.025 * Math.abs(step);
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.strokeStyle = '#151c2c';
        ctx.lineWidth = 2.5;

        if (slalom) {
            ctx.rotate(tilt * 0.40);
            // Real Twin Red Racing Skis + Poles under Herr Adam's shoes!
            for (const skx of [-12, 8]) {
                ctx.fillStyle = '#e8293b';
                ctx.beginPath();
                ctx.roundRect(skx - 4, -18, 8, 56, 4);
                ctx.fill();
                ctx.stroke();
            }
            ctx.lineWidth = 2.2;
            for (const px of [-24, 24]) {
                ctx.beginPath();
                ctx.moveTo(px * 0.72, -46);
                ctx.lineTo(px * 1.45, -10);
                ctx.stroke();
            }
            // Extracted adam_* sprites naturally face LEFT (-1); mirror to face RIGHT when carving right!
            const adamSlalomFacing = tilt < -0.05 ? 1 : -1;
            const drawn = Ski.drawSpriteChar(poseKey, 0, 5, 108, adamSlalomFacing, 0, sx, sy, 0);
            if (!drawn) {
                ctx.fillStyle = '#192a56';
                ctx.fillRect(-13, -60, 26, 60);
            }
        } else {
            // Side view twin Red Racing Skis + genuine Herr Adam sprite (faces right = facing -1!)
            ctx.fillStyle = '#e8293b';
            ctx.beginPath();
            ctx.moveTo(-36, 0);
            ctx.lineTo(30, -5);
            ctx.quadraticCurveTo(44, -9, 38, -14);
            ctx.lineTo(28, -9);
            ctx.lineTo(-36, -6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            const adamFacing = (throwing && opts.throwLeft) ? 1 : -1;
            const drawn = Ski.drawSpriteChar(poseKey, 0, -4, 112, adamFacing, 0, sx, sy, 0);
            if (!drawn) {
                ctx.fillStyle = '#192a56';
                ctx.fillRect(-11, -60, 24, 56);
            }
        }

        if (stunned) {
            ctx.font = '900 16px Outfit, Arial';
            ctx.fillStyle = '#ffd32a';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ BETÄUBT!', 0, -118);
            for (let i = 0; i < 3; i++) {
                const a = t * 6 + i * (Math.PI * 2 / 3);
                ctx.fillText('⭐', Math.cos(a) * 26, -104 + Math.sin(a) * 8);
            }
        }
        ctx.restore();
    },

    drawCollectibles(x, y, kind, t) {
        const bob = Math.sin(t * 5 + x * 0.02) * 5;
        ctx.save();
        ctx.translate(x, y + bob);
        ctx.strokeStyle = '#151c2c';
        ctx.lineWidth = 2.4;

        ctx.fillStyle = kind === 'coffee' ? '#e67e22' : (kind === 'energy' ? '#2ed573' : '#ffd32a');
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '900 16px Outfit, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(kind === 'coffee' ? '☕' : (kind === 'energy' ? '⚡' : '🥏'), 0, 1);
        ctx.restore();
    },

    // =========================================================================
    // DOWNHILL RENDER (Layered Comic Slope + Cliffs + Trees + Avalanche)
    // =========================================================================
    renderDownhill(g, s) {
        Ski.drawSeamlessBackdrop('bg_ski_downhill', s.bgOffset * 0.22);

        // Stratified Mountain Snow Slope + Rocky Cliff Strata Below (eliminates flat empty white triangle!)
        const leftY = Ski.slopeY(0);
        const rightY = Ski.slopeY(SKI_VW);

        // 1) Deep dark slate mountain cliff face underneath slope
        const cliffGrad = ctx.createLinearGradient(0, leftY + 30, 0, SKI_VH);
        cliffGrad.addColorStop(0, '#4f6d92');
        cliffGrad.addColorStop(0.45, '#344c6c');
        cliffGrad.addColorStop(1, '#1d2d44');
        ctx.fillStyle = cliffGrad;
        ctx.beginPath();
        ctx.moveTo(0, leftY + 30);
        ctx.lineTo(SKI_VW, rightY + 30);
        ctx.lineTo(SKI_VW, SKI_VH);
        ctx.lineTo(0, SKI_VH);
        ctx.closePath();
        ctx.fill();

        // Subtle cel-shaded alpine cliff ridges & rocky shadow facets beneath snow deck
        const rockStep = 340;
        const rShift = (s.dist * 0.72) % rockStep;
        for (let rx = -rShift - rockStep; rx < SKI_VW + rockStep; rx += rockStep) {
            const ry = Ski.slopeY(rx) + 54;
            ctx.fillStyle = '#2b4160';
            ctx.beginPath();
            ctx.moveTo(rx, SKI_VH);
            ctx.lineTo(rx + 60, ry + 18);
            ctx.lineTo(rx + 175, ry + 34);
            ctx.lineTo(rx + 280, ry + 16);
            ctx.lineTo(rx + 340, SKI_VH);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(182, 215, 246, 0.22)';
            ctx.beginPath();
            ctx.moveTo(rx + 60, ry + 18);
            ctx.lineTo(rx + 175, ry + 34);
            ctx.lineTo(rx + 135, ry + 84);
            ctx.lineTo(rx + 42, ry + 62);
            ctx.closePath();
            ctx.fill();
        }

        // 2) Sunlit groomed snow deck lip (top surface track)
        const snowGrad = ctx.createLinearGradient(0, leftY - 6, 0, leftY + 56);
        snowGrad.addColorStop(0, '#ffffff');
        snowGrad.addColorStop(0.7, '#d8ecff');
        snowGrad.addColorStop(1, '#9ac4eb');
        ctx.fillStyle = snowGrad;
        ctx.strokeStyle = '#1b2c48';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, leftY);
        ctx.lineTo(SKI_VW, rightY);
        ctx.lineTo(SKI_VW, rightY + 56);
        ctx.lineTo(0, leftY + 56);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Track corduroy shimmer dashes
        const lineStep = 95;
        const lShift = s.dist % lineStep;
        ctx.strokeStyle = 'rgba(130, 178, 225, 0.5)';
        ctx.lineWidth = 2;
        for (let lx = -lShift; lx < SKI_VW; lx += lineStep) {
            const ly = Ski.slopeY(lx);
            ctx.beginPath();
            ctx.moveTo(lx, ly + 10);
            ctx.lineTo(lx + 42, ly + 15);
            ctx.stroke();
        }

        // Trail Guidance Signboard near start of Run 1 & Run 2
        const signDists = [
            { d: 460, text: '[S] HOCKE • [SPACE] SPRINGEN!' },
            { d: (s.run1Length || 3600) + 260, text: 'ABFAHRT 2/2 • VOLLGAS!' }
        ];
        for (const sg of signDists) {
            const sgX = s.px + (sg.d - s.dist);
            if (sgX > -120 && sgX < SKI_VW + 120) {
                const sy = Ski.slopeY(sgX);
                ctx.save();
                ctx.fillStyle = '#5c3c1e';
                ctx.fillRect(sgX - 4, sy - 66, 8, 68);
                ctx.fillStyle = '#ffd32a';
                ctx.strokeStyle = '#151c2c';
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.roundRect(sgX - 108, sy - 96, 216, 32, 8);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#151c2c';
                ctx.font = '900 12px Outfit, Arial';
                ctx.textAlign = 'center';
                ctx.fillText(sg.text, sgX, sy - 76);
                ctx.restore();
            }
        }

        // Finish / Mid-Run Talstation Banner
        const goalDist = s.downhillPhase === 'run1' ? (s.run1Length || Math.round(s.length * 0.45)) : s.length;
        const finX = s.px + (goalDist - s.dist);
        if (finX < SKI_VW + 180 && finX > -220) {
            const fy = Ski.slopeY(finX);
            ctx.fillStyle = s.downhillPhase === 'run1' ? '#0984e3' : '#e8293b';
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 3;
            ctx.fillRect(finX, fy - 140, 14, 142);
            ctx.strokeRect(finX, fy - 140, 14, 142);
            ctx.fillStyle = '#ffd32a';
            ctx.fillRect(finX + 14, fy - 140, 210, 42);
            ctx.strokeRect(finX + 14, fy - 140, 210, 42);
            ctx.fillStyle = '#151c2c';
            ctx.font = '900 16px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.fillText(s.downhillPhase === 'run1' ? '🚡 SESSEL-LIFT 1!' : '🏁 ZIEL TALSTATION!', finX + 119, fy - 113);
            Ski.drawSpriteChar('monika_point', finX + 82, fy + 2, 104, 1, 0, 1, 1, 0);
            Ski.drawSpriteChar('gibb_student_idle', finX + 155, fy + 8, 98, 1, 0, 1, 1, 0);
        }

        // Obstacles
        for (const ob of s.obstacles) {
            const sx = s.px + (ob.dist - s.dist);
            if (sx < -160 || sx > SKI_VW + 160) continue;
            const sy = Ski.slopeY(sx);
            if (ob.kind === 'rock') Ski.drawComicBoulder(sx, sy + 4, ob.w, ob.h);
            else if (ob.kind === 'ice_pine') Ski.drawComicPine(sx, sy + 6, ob.h);
            else if (ob.kind === 'chalet') {
                Ski.drawComicChalet(sx, sy + 6, ob.w, ob.h);
                Ski.drawSpriteChar('monika_idle', sx + ob.w * 0.48, sy + 6, 86, 1, 0, 1, 1, 0);
            } else if (ob.kind === 'snowman') {
                ctx.save();
                ctx.translate(sx, sy + 4);
                ctx.strokeStyle = '#151c2c';
                ctx.lineWidth = 2.4;
                ctx.fillStyle = '#2e86de';
                ctx.beginPath();
                ctx.roundRect(-28, -6, 56, 7, 3);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                const stuKey = Math.sin(s.timeLeft * 9 + ob.dist) > 0 ? 'gibb_student_attack' : 'gibb_student_windup';
                const drawnStu = Ski.drawSpriteChar(stuKey, sx, sy + 1, 96, 1, 0, 1, 1, -0.05);
                if (!drawnStu) Ski.drawComicBoulder(sx, sy + 4, 42, 48);
                ctx.fillStyle = '#ffd32a';
                ctx.font = '900 12px Outfit, Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚡ WEG DA!', sx, sy - 98);
            } else if (ob.kind === 'fence_gap') {
                ctx.save();
                ctx.translate(sx, sy + 4);
                ctx.strokeStyle = '#151c2c';
                ctx.lineWidth = 2.4;
                ctx.fillStyle = 'rgba(255, 71, 87, 0.72)';
                ctx.fillRect(-ob.w * 0.5, -ob.h, ob.w, ob.h);
                ctx.strokeRect(-ob.w * 0.5, -ob.h, ob.w, ob.h);
                ctx.fillStyle = '#fff';
                ctx.font = '900 12px Outfit, Arial';
                ctx.textAlign = 'center';
                ctx.fillText('SPRINGEN ▲', 0, -ob.h * 0.45);
                ctx.restore();
            } else if (ob.kind === 'ramp') {
                ctx.save();
                ctx.translate(sx, sy + 6);
                ctx.rotate(Math.atan2(145, SKI_VW));
                ctx.strokeStyle = '#151c2c';
                ctx.lineWidth = 2.8;
                ctx.beginPath();
                ctx.moveTo(-ob.w * 0.56, 2);
                ctx.quadraticCurveTo(0, -ob.h * 0.35, ob.w * 0.48, -ob.h);
                ctx.lineTo(ob.w * 0.48, 2);
                ctx.closePath();
                const rg = ctx.createLinearGradient(0, -ob.h, 0, 2);
                rg.addColorStop(0, '#ffd32a');
                rg.addColorStop(0.65, '#45aaf2');
                rg.addColorStop(1, '#dceeff');
                ctx.fillStyle = rg;
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#151c2c';
                ctx.font = '900 13px Outfit, Arial';
                ctx.textAlign = 'center';
                ctx.fillText('>>> STUNT', 0, -12);
                ctx.restore();
            }
        }

        // Collectibles
        for (const col of s.collectibles) {
            if (col.collected) continue;
            const cx = s.px + (col.dist - s.dist);
            if (cx < -60 || cx > SKI_VW + 60) continue;
            Ski.drawCollectibles(cx, Ski.slopeY(cx) - col.z - 22, col.kind, s.timeLeft);
        }

        // Companion Herr Adam + Live Speech Bubble!
        if (s.rival) {
            const rx = Math.max(82, Math.min(SKI_VW - 75, s.px + (s.rival.dist - s.dist)));
            const ry = Ski.slopeY(rx) - 4;
            Ski.drawAdamRival(rx, ry, {
                t: s.timeLeft,
                stunned: s.rival.stunTimer > 0,
                throwing: s.rival.throwAnimTimer > 0,
                windup: s.rival.throwCd < 0.38,
                throwLeft: rx > s.px
            });
            if (s.adamQuoteTimer > 0 && s.adamQuote) {
                ctx.save();
                ctx.font = '900 13px Outfit, Arial';
                const tw = Math.min(360, Math.max(170, ctx.measureText(s.adamQuote).width + 38));
                const bx = Math.max(20, Math.min(SKI_VW - tw - 20, rx - tw * 0.5));
                const by = ry - 156;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
                ctx.strokeStyle = '#151c2c';
                ctx.lineWidth = 2.6;
                ctx.beginPath();
                ctx.roundRect(bx, by, tw, 34, 12);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#151c2c';
                ctx.textAlign = 'center';
                ctx.fillText(s.adamQuote, bx + tw * 0.5, by + 22);
                ctx.restore();
            }
        }

        // Hero Thenerean
        Ski.drawHeroRider(s.px, s.py - s.z + 2, {
            t: s.timeLeft,
            tilt: s.tilt,
            rot: s.spinAngle,
            tuck: s.pose === 'tuck',
            air: s.z > 6,
            attacking: s.attackAnimTimer > 0,
            blocking: g.player && g.player.isBlocking,
            hurtFlash: s.hurtFlash > 0,
            boost: s.boostTimer > 0,
            shadowOffsetY: s.z
        });

        // Foreground parallax pine tops sweeping at very bottom so bottom half feels alive!
        const fgStep = 340;
        const fgShift = (s.dist * 1.28) % fgStep;
        for (let fx = -fgShift; fx < SKI_VW + fgStep; fx += fgStep) {
            Ski.drawComicPine(fx + 50, SKI_VH + 14, 118, fx);
        }

        // Volumetric Roaring Multi-Wave Comic Avalanche!
        if (s.avalanche) Ski.renderAvalanche(s);
    },

    renderDownhillCutscene(g, s) {
        const prog = Math.min(1, s.cutsceneTimer / Math.max(0.1, s.cutsceneDuration));
        if (s.downhillPhase === 'cutscene_lift') {
            Ski.drawSeamlessBackdrop('bg_ski_lift_gorge', s.cutsceneTimer * 55);

            // Diagonal haul cable climbing bottom-left -> top-right
            const cableY = (x) => 560 - (x / SKI_VW) * 330;
            // Support steel pylons
            for (const tx of [220, 640, 1060]) {
                const ty = cableY(tx);
                ctx.strokeStyle = '#2d3748';
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx, SKI_VH);
                ctx.stroke();
                ctx.strokeStyle = '#718096';
                ctx.lineWidth = 4;
                ctx.stroke();
            }
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(0, cableY(0));
            ctx.lineTo(SKI_VW, cableY(SKI_VW));
            ctx.stroke();

            // 2-Seater Chair gliding smoothly uphill carrying Thenerean & Herr Adam!
            const chairX = 240 + prog * 790;
            const chairY = cableY(chairX) + 88;
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(chairX, cableY(chairX));
            ctx.lineTo(chairX, chairY - 65);
            ctx.stroke();

            // Seated Riders inside double-chairlift seat
            Ski.drawSpriteChar('thenerean_idle', chairX - 36, chairY + 6, 98, 1, 0, 1, 1, -0.04);
            Ski.drawSpriteChar('adam_idle', chairX + 36, chairY + 6, 102, -1, 0, 1, 1, -0.04);

            // Chair seat frame & dangling skis
            ctx.fillStyle = '#e8293b';
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(chairX - 78, chairY - 2, 156, 20, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#2f3542';
            ctx.fillRect(chairX - 72, chairY - 68, 144, 14);
            ctx.strokeRect(chairX - 72, chairY - 68, 144, 14);

            // Dynamic comic speech bubble from Herr Adam
            const liftMsg = 'Adam: „Top Lauf! Ab im Sessel zurück auf den Gipfel!“';
            ctx.font = '900 14px Outfit, Arial';
            const lbW = Math.max(360, ctx.measureText(liftMsg).width + 38);
            const lbX = Math.max(20, Math.min(SKI_VW - lbW - 20, chairX - lbW * 0.5));
            ctx.fillStyle = 'rgba(255,255,255,0.96)';
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.roundRect(lbX, chairY - 148, lbW, 40, 14);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#151c2c';
            ctx.textAlign = 'center';
            ctx.fillText(liftMsg, lbX + lbW * 0.5, chairY - 123);

            // Top Banner strictly below mission pill (clear of bottom HUD!)
            ctx.fillStyle = 'rgba(11, 16, 30, 0.92)';
            ctx.strokeStyle = '#00d2d3';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(SKI_VW * 0.5 - 325, 148, 650, 38, 13);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#00d2d3';
            ctx.font = '900 15px Outfit, Arial';
            ctx.fillText('🚡 SKILIFT-RÜCKFAHRT ZUR GIPFELHÜTTE... [LEERTASTE = WEITER]', SKI_VW * 0.5, 172);
        } else {
            // Summit Hut Debrief with Monika Schneider, Herr Adam & Thenerean!
            Ski.drawSeamlessBackdrop('bg_ski_downhill', 0);
            ctx.fillStyle = '#dceeff';
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 3.5;
            ctx.fillRect(-10, 520, SKI_VW + 20, 210);
            ctx.strokeRect(-10, 520, SKI_VW + 20, 210);

            Ski.drawComicChalet(980, 524, 240, 175);
            Ski.drawSpriteChar('thenerean_idle', 360, 528, 150, 1, 0, 1, 1, 0);
            Ski.drawSpriteChar('adam_idle', 575, 530, 154, -1, 0, 1, 1, 0);
            Ski.drawSpriteChar('monika_point', 810, 530, 152, 1, 0, 1, 1, 0);

            const step2 = s.cutsceneTimer >= 2.25;
            const speaker = step2 ? 'HERR ADAM' : 'MONIKA SCHNEIDER';
            const line = step2
                ? '„Setup isch genehmigt — nimm d’Frisbee & Vollgas in Abfahrt 2!“'
                : '„Sauberi Kanten jetzt, Thenerean! In Abfahrt 2 wird voll angegriffen!“';
            const borderCol = step2 ? '#00d2d3' : '#ff6b81';

            ctx.fillStyle = 'rgba(12, 18, 34, 0.92)';
            ctx.strokeStyle = borderCol;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(SKI_VW * 0.5 - 390, 162, 780, 94, 18);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = borderCol;
            ctx.font = '900 14px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`🎙️ TAKTIK-BESPRECHUNG • ${speaker}`, SKI_VW * 0.5, 192);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 20px Outfit, Arial';
            ctx.fillText(line, SKI_VW * 0.5, 228);

            ctx.fillStyle = 'rgba(11, 16, 30, 0.92)';
            ctx.strokeStyle = '#2ed573';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(SKI_VW * 0.5 - 290, 266, 580, 38, 13);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#2ed573';
            ctx.font = '900 15px Outfit, Arial';
            ctx.fillText('⛷️ NÄCHSTE ABFAHRT (2/2) STARTET GLEICH • [LEERTASTE]', SKI_VW * 0.5, 290);
        }
    },

    renderAvalanche(s) {
        const gap = s.dist - s.avalanche.dist;
        const frontX = Math.max(92, s.px - gap * 0.65);

        if (gap < 280) {
            const warnGrad = ctx.createLinearGradient(0, 0, 260, 0);
            warnGrad.addColorStop(0, `rgba(255, 71, 87, ${Math.min(0.45, (280 - gap) / 500)})`);
            warnGrad.addColorStop(1, 'rgba(255, 71, 87, 0)');
            ctx.fillStyle = warnGrad;
            ctx.fillRect(0, 0, 260, SKI_VH);
        }

        ctx.save();
        // 1) Roaring billowing dark glacial powder wall (smooth quadratic curves)
        ctx.fillStyle = '#53769c';
        ctx.strokeStyle = '#19263c';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-10, 60);
        let prevY = 60;
        let prevX = frontX + 8;
        for (let y = 115; y <= SKI_VH + 45; y += 58) {
            const crestX = frontX + 26 + Math.sin(y * 0.035 + s.timeLeft * 11) * 24;
            const endX = frontX + 12 + Math.cos(y * 0.06 - s.timeLeft * 9) * 14;
            ctx.quadraticCurveTo(crestX + 24, (prevY + y) * 0.5, endX, y);
            prevX = endX;
            prevY = y;
        }
        ctx.lineTo(-10, SKI_VH + 45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2) Bright foaming inner snow-wave curling puffs
        const foamGrad = ctx.createLinearGradient(0, 0, frontX + 55, 0);
        foamGrad.addColorStop(0, '#9dc2e6');
        foamGrad.addColorStop(0.55, '#e6f3ff');
        foamGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = foamGrad;
        ctx.beginPath();
        ctx.moveTo(-10, 108);
        prevY = 108;
        for (let y = 158; y <= SKI_VH + 40; y += 52) {
            const bulge = frontX + 18 + Math.cos(y * 0.045 + s.timeLeft * 14) * 22;
            const endX = frontX - 2 + Math.sin(y * 0.08 + s.timeLeft * 16) * 12;
            ctx.quadraticCurveTo(bulge + 20, (prevY + y) * 0.5, endX, y);
            prevY = y;
        }
        ctx.lineTo(-10, SKI_VH + 40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3) Spinning alpine rock shards, pine branches & roaring powder blast streaks!
        for (let i = 0; i < 6; i++) {
            const dy = 160 + i * 84 + Math.sin(s.timeLeft * 9 + i) * 18;
            const dx = frontX + 8 + Math.cos(s.timeLeft * 13 + i * 2) * 16;
            ctx.save();
            ctx.translate(dx, dy);
            ctx.rotate(s.timeLeft * (7 + i) * (i % 2 === 0 ? 1 : -1));
            ctx.fillStyle = i % 2 === 0 ? '#4d5d73' : '#1f5e47';
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, -5); ctx.lineTo(7, -8); ctx.lineTo(12, 3); ctx.lineTo(-4, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const sy = 135 + i * 70;
            const sx = frontX + 26 + ((s.timeLeft * 290 + i * 43) % 62);
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 54, sy + 7); ctx.stroke();
        }
        ctx.restore();
    },

    // =========================================================================
    // LIVE SLALOM RENDER (Oben ↓ Unten, Tore FEST im Schnee verankert!)
    // =========================================================================
    renderSlalom(g, s) {
        Ski.drawStaticFitBackdrop('bg_ski_slalom');

        // Subtle stationary groomed snow contour lines (gates do NOT move!)
        ctx.strokeStyle = 'rgba(70, 130, 200, 0.16)';
        ctx.lineWidth = 2;
        for (let sy = 250; sy < SKI_VH; sy += 106) {
            const xl = Ski.slalomScreenX(360, sy);
            const xr = Ski.slalomScreenX(920, sy);
            ctx.beginPath();
            ctx.moveTo(xl, sy);
            ctx.lineTo(xr, sy + 6);
            ctx.stroke();
        }

        // Subtle glowing Ice-Blue Ideallinie through remaining stationary gates in active section!
        const secGates = s.gates.filter(gt => gt.sec === s.slalomSec);
        const upcoming = secGates.filter(gt => !gt.resolved);
        const heroSX = Ski.slalomScreenX(s.px, s.py);
        if (upcoming.length > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(heroSX, s.py + 10);
            for (const gt of upcoming) {
                ctx.lineTo(Ski.slalomScreenX(gt.centerX, gt.y), gt.y);
            }
            ctx.strokeStyle = 'rgba(0, 210, 211, 0.34)';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            ctx.setLineDash([10, 10]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.80)';
            ctx.lineWidth = 2.6;
            ctx.stroke();
            ctx.restore();
        }

        // Bottom of current slope section: either Section Transition Gate OR Final Finish Arena!
        const isLastSec = s.slalomSec >= (s.slalomSections || 1) - 1;
        const finY = 668;
        const flx = Ski.slalomScreenX(290, finY);
        const frx = Ski.slalomScreenX(990, finY);
        const fscale = Ski.slalomScale(finY);
        if (isLastSec) {
            ctx.save();
            ctx.fillStyle = '#e8293b';
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 3.5;
            ctx.fillRect(flx, finY - 70 * fscale, frx - flx, 40 * fscale);
            ctx.strokeRect(flx, finY - 70 * fscale, frx - flx, 40 * fscale);
            ctx.fillStyle = '#ffd32a';
            ctx.font = `900 ${Math.max(12, Math.round(21 * fscale))}px Outfit, Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🏁 ZIEL-ARENA • ALPEN-SLALOM 🏁', (flx + frx) * 0.5, finY - 43 * fscale);
            ctx.restore();
            Ski.drawSpriteChar('monika_point', flx - 16 * fscale, finY + 4, 96 * fscale, -1, 0, 1, 1, 0);
            Ski.drawSpriteChar('gibb_student_walk', frx + 16 * fscale, finY + 4, 92 * fscale, 1, 0, 1, 1, 0);
        } else {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 210, 211, 0.82)';
            ctx.lineWidth = 5;
            ctx.setLineDash([14, 10]);
            ctx.beginPath();
            ctx.moveTo(flx, finY);
            ctx.lineTo(frx, finY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(11, 16, 30, 0.84)';
            ctx.beginPath();
            ctx.roundRect((flx + frx) * 0.5 - 125, finY - 30, 250, 24, 10);
            ctx.fill();
            ctx.fillStyle = '#00d2d3';
            ctx.font = '900 12px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`▼ HANG ${s.slalomSec + 1} / ${s.slalomSections} ENDE ▼`, (flx + frx) * 0.5, finY - 14);
            ctx.restore();
        }

        // Dual-Pole Articulated Olympic Slalom Gates (Stationary in active section!)
        for (const gt of secGates) {
            const gy = gt.y;
            const pScale = Ski.slalomScale(gy);
            const poleScale = 0.54 + pScale * 0.62;
            const colHex = gt.color === 'red' ? '#ff4757' : '#2e86de';
            const lx = Ski.slalomScreenX(gt.centerX - gt.halfW, gy);
            const rx = Ski.slalomScreenX(gt.centerX + gt.halfW, gy);

            // Valid corridor floor highlight
            ctx.fillStyle = gt.resolved
                ? (gt.hit ? 'rgba(46, 213, 115, 0.25)' : 'rgba(255, 71, 87, 0.20)')
                : (gt.color === 'red' ? 'rgba(255, 71, 87, 0.14)' : 'rgba(46, 134, 222, 0.14)');
            ctx.fillRect(lx, gy - 6, rx - lx, 12);

            for (const [poleX, label] of [[lx, `TOR ${gt.index}`], [rx, '']]) {
                ctx.save();
                ctx.translate(poleX, gy);
                ctx.rotate(gt.poleWhip * (poleX < SKI_VW * 0.5 ? -0.35 : 0.35));
                ctx.strokeStyle = '#151c2c';
                ctx.lineWidth = 2.2;
                ctx.fillStyle = 'rgba(20, 40, 75, 0.24)';
                ctx.beginPath(); ctx.ellipse(7, 2, 12 * poleScale, 4 * poleScale, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = colHex;
                ctx.fillRect(-3.5 * poleScale, -54 * poleScale, 7 * poleScale, 56 * poleScale);
                ctx.strokeRect(-3.5 * poleScale, -54 * poleScale, 7 * poleScale, 56 * poleScale);
                if (label) {
                    ctx.fillStyle = colHex;
                    ctx.fillRect(3 * poleScale, -52 * poleScale, 50 * poleScale, 20 * poleScale);
                    ctx.strokeRect(3 * poleScale, -52 * poleScale, 50 * poleScale, 20 * poleScale);
                    ctx.fillStyle = '#fff';
                    ctx.font = `900 ${Math.max(9, Math.round(11 * poleScale))}px Outfit, Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText(label, 28 * poleScale, -38 * poleScale);
                }
                ctx.restore();
            }
        }

        // Stationary Collectibles in active section
        for (const col of s.collectibles) {
            if (col.collected || col.sec !== s.slalomSec) continue;
            Ski.drawCollectibles(Ski.slalomScreenX(col.x, col.y), col.y, col.kind, s.timeLeft);
        }

        // Herr Adam Live Rival (same section OR HUD lead/trail badge!)
        if (s.rival) {
            const r = s.rival;
            const rSec = r.sec || 0;
            const adamSX = Ski.slalomScreenX(r.x, Math.max(164, Math.min(668, r.py || 170)));
            if (rSec === s.slalomSec) {
                Ski.drawAdamRival(adamSX, r.py || 170, {
                    slalom: true,
                    t: s.timeLeft,
                    scale: 0.64 + Ski.slalomScale(r.py || 170) * 0.42,
                    tilt: r.tilt,
                    stunned: r.stunTimer > 0,
                    throwing: r.throwAnimTimer > 0,
                    windup: r.throwCd < 0.38
                });
            } else {
                const ahead = rSec > s.slalomSec;
                const badgeY = ahead ? SKI_VH - 56 : 162;
                ctx.fillStyle = 'rgba(20, 28, 46, 0.90)';
                ctx.strokeStyle = '#ff4757';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.roundRect(adamSX - 98, badgeY - 16, 196, 30, 14);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = '900 12px Outfit, Arial';
                ctx.textAlign = 'center';
                ctx.fillText(ahead ? `👇 ADAM HANG ${rSec + 1}/${s.slalomSections} VORAUS` : `👆 ADAM HANG ${rSec + 1}/${s.slalomSections}`, adamSX, badgeY + 4);
            }
        }

        if (s.inSlipstream) {
            ctx.fillStyle = 'rgba(0, 210, 211, 0.25)';
            ctx.strokeStyle = '#00d2d3';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(heroSX - 75, s.py - 84, 150, 22, 10);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '900 11px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💨 WINDSCHATTEN +TEMPO', heroSX, s.py - 69);
        }

        Ski.drawHeroRider(heroSX, s.py, {
            slalom: true,
            t: s.timeLeft,
            scale: 0.64 + Ski.slalomScale(s.py) * 0.42,
            tilt: s.tilt,
            tuck: Math.abs(s.tilt) > 0.34,
            attacking: s.attackAnimTimer > 0,
            blocking: g.player && g.player.isBlocking,
            hurtFlash: s.hurtFlash > 0,
            boost: s.boostTimer > 0
        });

        // Smooth white alpine snow-wipe between sections
        if (s.secTransition > 0) {
            const alpha = Math.sin((1 - s.secTransition / 0.55) * Math.PI) * 0.85;
            ctx.fillStyle = `rgba(226, 243, 255, ${Math.max(0, Math.min(0.85, alpha))})`;
            ctx.fillRect(0, 0, SKI_VW, SKI_VH);
        }
    },

    // =========================================================================
    // SKI LIFT RENDER (Aktiver Skilift bergauf + Schlucht-Warnung + Sprung-Kurve)
    // =========================================================================
    renderSkiLift(g, s) {
        const ls = s.liftState;
        Ski.drawSeamlessBackdrop('bg_ski_lift_gorge', s.camX * 0.14);

        ctx.save();
        ctx.translate(-s.camX, -s.camY);

        // 1) Abyss fog & jagged gorge cliffs at bottom below cable!
        const leftX = s.camX - 100;
        const rightX = s.camX + SKI_VW + 120;
        const abyssGrad = ctx.createLinearGradient(0, Ski.abyssFloorY(s.px) - 120, 0, Ski.abyssFloorY(s.px) + 220);
        abyssGrad.addColorStop(0, 'rgba(14, 24, 46, 0)');
        abyssGrad.addColorStop(0.55, 'rgba(14, 24, 46, 0.84)');
        abyssGrad.addColorStop(1, '#0b1324');
        ctx.fillStyle = abyssGrad;
        ctx.beginPath();
        ctx.moveTo(leftX, Ski.abyssFloorY(leftX) - 110);
        ctx.lineTo(rightX, Ski.abyssFloorY(rightX) - 110);
        ctx.lineTo(rightX, Ski.abyssFloorY(rightX) + 420);
        ctx.lineTo(leftX, Ski.abyssFloorY(leftX) + 420);
        ctx.closePath();
        ctx.fill();

        // Main Steel Haul Cable running high uphill above all chairs
        ctx.strokeStyle = '#151c2c';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(leftX, Ski.liftSlopeY(leftX) - 118);
        ctx.lineTo(rightX, Ski.liftSlopeY(rightX) - 118);
        ctx.stroke();

        // Express Golden Grind Wires
        for (const gw of ls.grindWires) {
            ctx.strokeStyle = '#ffd32a';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(gw.x1, Ski.liftSlopeY(gw.x1) + gw.offsetY);
            ctx.lineTo(gw.x2, Ski.liftSlopeY(gw.x2) + gw.offsetY);
            ctx.stroke();
            ctx.fillStyle = '#ffd32a';
            ctx.font = '900 12px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ EXPRESS SEIL-GRIND', (gw.x1 + gw.x2) * 0.5, Ski.liftSlopeY((gw.x1 + gw.x2) * 0.5) + gw.offsetY - 12);
        }

        // Next reachable platform ahead highlighted clearly!
        let nextTarget = null;
        for (const p of ls.platforms) {
            if (p.fallenTimer <= 0 && p !== ls.currentPlatform && p.x + p.w > s.px + 25) {
                if (!nextTarget || p.x < nextTarget.x) nextTarget = p;
            }
        }

        // Platforms, Steel Pylons, Panorama Gondolas, 4-Seater Chairs & Ice-Chairs
        for (const p of ls.platforms) {
            if (p.x + p.w < s.camX - 180 || p.x > s.camX + SKI_VW + 180) continue;
            const cy = p.topY;
            const cx = p.x + p.w * 0.5;
            const cableY = Ski.liftSlopeY(cx) - 118;

            if (p.kind === 'pylon') {
                // Tall Steel Truss Mast anchored deep down into rocky canyon!
                ctx.fillStyle = '#3e526b';
                ctx.strokeStyle = '#151c2c';
                ctx.lineWidth = 2.8;
                ctx.fillRect(cx - 24, cy + p.h, 48, 520);
                ctx.strokeRect(cx - 24, cy + p.h, 48, 520);
                // X-braces
                ctx.beginPath();
                for (let by = cy + p.h; by < cy + 440; by += 52) {
                    ctx.moveTo(cx - 24, by); ctx.lineTo(cx + 24, by + 52);
                    ctx.moveTo(cx + 24, by); ctx.lineTo(cx - 24, by + 52);
                }
                ctx.stroke();

                // Steel catwalk deck + safety railing + finish banner if Bergstation
                ctx.fillStyle = p.isFinish ? '#ffd32a' : '#7f8c8d';
                ctx.fillRect(p.x, cy, p.w, p.h);
                ctx.strokeRect(p.x, cy, p.w, p.h);
                if (p.isFinish) {
                    ctx.fillStyle = '#e8293b';
                    ctx.fillRect(cx - 80, cy - 110, 160, 42);
                    ctx.strokeRect(cx - 80, cy - 110, 160, 42);
                    ctx.fillStyle = '#fff';
                    ctx.font = '900 16px Outfit, Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('🏁 BERGSTATION!', cx, cy - 83);
                    Ski.drawSpriteChar('monika_point', cx + 35, cy, 102, 1, 0, 1, 1, 0);
                    Ski.drawSpriteChar('adam_idle', cx + 92, cy, 104, 1, 0, 1, 1, 0);
                } else if (p.label) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '900 13px Outfit, Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(p.label, cx, cy - 12);
                    if (p.label === 'TALSTATION') {
                        Ski.drawSpriteChar('gibb_student_walk', p.x + 36, cy, 94, -1, 0, 1, 1, 0);
                    }
                }
            } else if (p.fallenTimer <= 0) {
                if (p.kind === 'fixed_deck') {
                    // Riveted fixed mountain steel deck anchored by twin diagonal cables!
                    ctx.strokeStyle = '#2d3748';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(p.x + 12, cy + p.h);
                    ctx.lineTo(p.x - 16, cy + 165);
                    ctx.moveTo(p.x + p.w - 12, cy + p.h);
                    ctx.lineTo(p.x + p.w + 16, cy + 165);
                    ctx.stroke();

                    ctx.fillStyle = '#4a5568';
                    ctx.strokeStyle = '#151c2c';
                    ctx.lineWidth = 2.8;
                    ctx.beginPath();
                    ctx.roundRect(p.x, cy, p.w, p.h + 4, 6);
                    ctx.fill();
                    ctx.stroke();
                    // Gold/slate rivet trim so fixed platforms look unmistakably permanent!
                    ctx.fillStyle = '#ffd32a';
                    ctx.fillRect(p.x + 8, cy + 3, p.w - 16, 4);
                    ctx.fillStyle = 'rgba(15, 22, 38, 0.85)';
                    ctx.beginPath();
                    ctx.roundRect(cx - 28, cy - 22, 56, 17, 6);
                    ctx.fill();
                    ctx.fillStyle = '#ffd32a';
                    ctx.font = '900 10px Outfit, Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('⚓ FEST', cx, cy - 10);
                } else {
                    // Hanger arm up to carrier cable
                    ctx.strokeStyle = '#1e272e';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(cx, cableY);
                    ctx.lineTo(cx, cy);
                    ctx.stroke();

                    if (p.kind === 'gondola') {
                        // Red Swiss Panorama Glass Cabin + Glowing Green Trampoline Roof
                        ctx.fillStyle = '#e8293b';
                        ctx.strokeStyle = '#151c2c';
                        ctx.lineWidth = 2.8;
                        ctx.beginPath();
                        ctx.roundRect(p.x, cy, p.w, 68, 12);
                        ctx.fill();
                        ctx.stroke();
                        ctx.fillStyle = '#70a1ff';
                        ctx.fillRect(p.x + 14, cy + 16, p.w * 0.36, 30);
                        ctx.fillRect(p.x + p.w * 0.56, cy + 16, p.w * 0.32, 30);
                        ctx.fillStyle = '#2ed573';
                        ctx.fillRect(p.x + 8, cy - 5, p.w - 16, 10);
                        ctx.strokeRect(p.x + 8, cy - 5, p.w - 16, 10);
                        ctx.fillStyle = '#2ed573';
                        ctx.font = '900 12px Outfit, Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('▲ BOUNCE-DACH ⇄', cx, cy - 13);
                    } else {
                        const isIce = p.kind === 'ice_chair';
                        const shake = (isIce && p.iceTimer > 0) ? Math.sin(p.iceTimer * 35) * 4 : 0;
                        ctx.fillStyle = isIce ? '#70a1ff' : '#dfe6e9';
                        ctx.strokeStyle = '#151c2c';
                        ctx.lineWidth = 2.8;
                        ctx.beginPath();
                        ctx.roundRect(p.x + shake, cy, p.w, p.h, 8);
                        ctx.fill();
                        ctx.stroke();

                        // Chair backrest
                        ctx.fillStyle = isIce ? '#00a8ff' : '#2f3542';
                        ctx.fillRect(p.x + 8 + shake, cy - 38, p.w - 16, 12);
                        ctx.strokeRect(p.x + 8 + shake, cy - 38, p.w - 16, 12);

                        if (isIce && p.iceTimer > 0) {
                            const frac = Math.max(0, 1 - p.iceTimer / p.iceLimit);
                            ctx.fillStyle = '#ff4757';
                            ctx.fillRect(p.x + 10, cy + 6, (p.w - 20) * frac, 6);
                        } else if (!p.isFixed && p.vx > 0) {
                            ctx.fillStyle = 'rgba(15, 22, 38, 0.85)';
                            ctx.beginPath();
                            ctx.roundRect(cx - 42, cy - 60, 84, 17, 6);
                            ctx.fill();
                            ctx.fillStyle = '#00d2d3';
                            ctx.font = '900 10.5px Outfit, Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(p.dir > 0 ? '⇄ FÄHRT ▶' : '◀ FÄHRT ⇄', cx, cy - 48);
                        }
                    }
                }
            }

            // Crisp Green Pulsing Landing Rim + Down-Arrow on Next Reachable Platform!
            if (p === nextTarget) {
                const pulse = 0.65 + 0.35 * Math.sin(s.timeLeft * 9);
                ctx.save();
                ctx.strokeStyle = `rgba(46, 213, 115, ${pulse})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.roundRect(p.x - 4, cy - 6, p.w + 8, 12, 6);
                ctx.stroke();
                ctx.fillStyle = '#2ed573';
                ctx.font = '900 18px Outfit, Arial';
                ctx.textAlign = 'center';
                ctx.fillText('▼', cx, cy - 22 - pulse * 7);
                ctx.restore();
            }
        }

        // Cyan Dotted Jump Trajectory Guide ahead of Thenerean when near edge or airborne!
        if (!ls.onGrindWire) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 210, 211, 0.55)';
            ctx.lineWidth = 3;
            ctx.setLineDash([7, 8]);
            ctx.beginPath();
            const simVx = Math.max(240, ls.grounded ? 345 : Math.abs(s.vx) + 120);
            let simVy = ls.grounded ? -680 : s.vy;
            let sx = s.px, sy = s.py - 12;
            ctx.moveTo(sx, sy);
            for (let step = 0; step < 11; step++) {
                simVy += 1740 * 0.055;
                sx += simVx * 0.055;
                sy += simVy * 0.055;
                ctx.lineTo(sx, sy);
            }
            ctx.stroke();
            ctx.restore();
        }

        // Collectibles
        for (const col of s.collectibles) {
            if (col.collected) continue;
            Ski.drawCollectibles(col.x, Ski.liftSlopeY(col.x) + col.offsetY, col.kind, s.timeLeft);
        }

        // Telegraphed Icicles with red drop laser warning line!
        for (const ic of s.icicles) {
            if (!ic.falling) {
                ctx.strokeStyle = 'rgba(255, 71, 87, 0.72)';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([8, 6]);
                ctx.beginPath();
                ctx.moveTo(ic.x, ic.y);
                ctx.lineTo(ic.x, Ski.liftSlopeY(ic.x) + 35);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            ctx.fillStyle = '#70d6ff';
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(ic.x - 10, ic.y);
            ctx.lineTo(ic.x + 10, ic.y);
            ctx.lineTo(ic.x, ic.y + 38);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Hero Thenerean + Float-Above Double-Jump & Dash Status Pips
        Ski.drawHeroRider(s.px, s.py, {
            t: s.timeLeft,
            air: !ls.grounded,
            attacking: s.attackAnimTimer > 0,
            blocking: g.player && g.player.isBlocking,
            hurtFlash: s.hurtFlash > 0,
            boost: s.boostTimer > 0
        });
        if (!ls.grounded) {
            const pipY = (s.py - 134 < s.camY + 144) ? (s.py + 22) : (s.py - 128);
            ctx.fillStyle = 'rgba(15, 22, 38, 0.88)';
            ctx.strokeStyle = ls.jumpsLeft > 0 ? '#2ed573' : '#ff6348';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(s.px - 76, pipY - 14, 152, 22, 10);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '900 11px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${ls.jumpsLeft > 0 ? '2× SPRUNG: ●' : '2× SPRUNG: ○'} • ${ls.dashCharges > 0 ? '⚡DASH' : '○'}`,
                s.px, pipY + 1
            );
        }

        ctx.restore();
    },

    // =========================================================================
    // RIESEN-SCHANZE WEITSPRUNG RENDER (Links Schanze -> Rechts Alpental)
    // =========================================================================
    renderSkiJump(g, s) {
        const js = s.jumpState;
        Ski.drawSeamlessBackdrop('bg_ski_jump_valley', s.camX * 0.14);

        ctx.save();
        ctx.scale(s.camScale, s.camScale);
        ctx.translate(-s.camX, -s.camY);

        const xStart = Math.max(0, Math.floor(s.camX / 40) * 40 - 80);
        const xEnd = s.camX + SKI_VW / s.camScale + 120;

        // 1) Steel Olympic Ski-Jump Tower Support Pillars & Cross-Truss on Left (x: 100..1460)
        if (xStart < 1520) {
            const pillars = [220, 480, 760, 1060, 1380];
            ctx.strokeStyle = '#1b2638';
            ctx.lineWidth = 3;
            for (let pi = 0; pi < pillars.length - 1; pi++) {
                const x1 = pillars[pi], x2 = pillars[pi + 1];
                const y1 = Ski.jumpRampY(x1) + 28, y2 = Ski.jumpRampY(x2) + 28;
                const b1 = x1 >= 760 ? 500 : y1 + 190;
                const b2 = x2 >= 760 ? 500 : y2 + 190;
                ctx.strokeStyle = 'rgba(30, 44, 68, 0.72)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x1, y1); ctx.lineTo(x2, b2);
                ctx.moveTo(x2, y2); ctx.lineTo(x1, b1);
                ctx.stroke();
            }
            ctx.fillStyle = '#2d3b52';
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 3;
            for (const tx of pillars) {
                const ry = Ski.jumpRampY(tx);
                const legH = tx >= 760 ? Math.max(40, 510 - ry) : 520;
                ctx.fillRect(tx - 15, ry, 30, legH);
                ctx.strokeRect(tx - 15, ry, 30, legH);
            }
            // Smooth concave In-Run ice chute without pinched outline crossover
            ctx.beginPath();
            ctx.moveTo(0, Ski.jumpRampY(0));
            for (let rx = 20; rx <= 1460; rx += 20) ctx.lineTo(rx, Ski.jumpRampY(rx));
            for (let rx = 1460; rx >= 0; rx -= 20) ctx.lineTo(rx, Ski.jumpRampY(rx) + 26);
            ctx.closePath();
            ctx.fillStyle = '#d4edff';
            ctx.fill();
            ctx.stroke();

            // Stadium red banner suspended cleanly inside truss bay between legs 760..1060!
            ctx.fillStyle = '#d63031';
            ctx.fillRect(775, 434, 285, 26);
            ctx.strokeRect(775, 434, 285, 26);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 13px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🏔️ ALPEN-SCHANZE • GIBB CUP', 917, 452);
        }

        // 2) Sweeping Olympic Valley Mountain Slope (Snow Top Crust + Dark Alpine Granite Strata!)
        const hillStart = Math.max(700, xStart);
        if (xEnd > 700) {
            const surfY = (vx) => vx < 1460 ? 504 - (vx - 700) * 0.062 : Ski.jumpValleyY(vx);
            // Deep Alpine granite cliff strata below top snow crust
            ctx.beginPath();
            ctx.moveTo(hillStart, surfY(hillStart) + 34);
            for (let vx = hillStart; vx <= xEnd; vx += 40) ctx.lineTo(vx, surfY(vx) + 34);
            ctx.lineTo(xEnd, surfY(xEnd) + 950);
            ctx.lineTo(hillStart, surfY(hillStart) + 950);
            ctx.closePath();
            const cliffGrad = ctx.createLinearGradient(0, 480, 0, 1450);
            cliffGrad.addColorStop(0, '#446084');
            cliffGrad.addColorStop(0.45, '#2b3f5b');
            cliffGrad.addColorStop(1, '#162336');
            ctx.fillStyle = cliffGrad;
            ctx.fill();

            // Comic rock strata facets & cel-shaded cliff cracks along the landing mountain
            ctx.save();
            for (let rx = Math.ceil(hillStart / 210) * 210; rx < xEnd; rx += 210) {
                const ry = surfY(rx) + 75;
                ctx.fillStyle = (rx % 420 === 0) ? 'rgba(130, 168, 212, 0.14)' : 'rgba(14, 24, 42, 0.24)';
                ctx.beginPath();
                ctx.moveTo(rx - 70, ry + 18);
                ctx.lineTo(rx + 25, ry - 12);
                ctx.lineTo(rx + 95, ry + 62);
                ctx.lineTo(rx - 20, ry + 115);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // Snow deck ribbon along landing slope surface
            ctx.beginPath();
            ctx.moveTo(hillStart, surfY(hillStart));
            for (let vx = hillStart; vx <= xEnd; vx += 40) ctx.lineTo(vx, surfY(vx));
            for (let vx = xEnd; vx >= hillStart; vx -= 40) ctx.lineTo(vx, surfY(vx) + 46);
            ctx.closePath();
            const snowGrad = ctx.createLinearGradient(0, 450, 0, 560);
            snowGrad.addColorStop(0, '#ffffff');
            snowGrad.addColorStop(1, '#b6d8f5');
            ctx.fillStyle = snowGrad;
            ctx.fill();
            ctx.strokeStyle = '#182b49';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Evergreen alpine trees along snow ridge & cliff face
            for (let tx = Math.max(820, Math.ceil(hillStart / 230) * 230); tx < xEnd; tx += 230) {
                Ski.drawComicPine(tx, surfY(tx) + 84, 92, tx);
            }

            // Olympic Meter Flags, Blue K-Point Line & Red Hill-Size Line
            const markers = [50, 100, 150, js.kPointMeters, js.hillSizeMeters];
            for (const m of markers) {
                const mx = 1460 + m * 14.5;
                if (mx < xStart - 40 || mx > xEnd + 40) continue;
                const my = Ski.jumpValleyY(mx);
                const isK = m === js.kPointMeters;
                const isHS = m === js.hillSizeMeters;
                ctx.fillStyle = isK ? '#2e86de' : (isHS ? '#ff4757' : '#576574');
                ctx.fillRect(mx - 3, my - 58, 6, 58);
                ctx.fillStyle = isK ? '#2e86de' : (isHS ? '#ff4757' : '#151c2c');
                ctx.font = `900 ${isK || isHS ? 18 : 14}px Outfit, Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(isK ? `🔵 K-${m}m` : (isHS ? `🔴 HS ${m}m` : `${m}m`), mx, my - 66);
            }
        }

        // 3) Thermal Updraft Rings
        for (const rg of js.rings) {
            if (rg.x < xStart - 80 || rg.x > xEnd + 80) continue;
            ctx.save();
            ctx.translate(rg.x, rg.y);
            ctx.strokeStyle = rg.hit ? '#2ed573' : '#00d2d3';
            ctx.lineWidth = rg.hit ? 4 : 6;
            ctx.beginPath();
            ctx.ellipse(0, 0, rg.r * 0.45, rg.r, 0, 0, Math.PI * 2);
            ctx.stroke();
            if (!rg.hit) {
                ctx.fillStyle = '#00d2d3';
                ctx.font = '900 13px Outfit, Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`+${rg.bonusM}m`, 0, -rg.r - 10);
            }
            ctx.restore();
        }

        // 4) Trainer Herr Adam (Coach am Kampfrichter-Plateau links unter der Schanze) + Stadion-Jury am K-Punkt + Hero Jumper!
        if (xStart < 780 && xEnd > 660) {
            Ski.drawSpriteChar('adam_idle', 718, 504, 102, -1, 0, 1, 1, 0);
        }
        const kpX = 1460 + js.kPointMeters * 14.5 + 88;
        if (kpX >= xStart - 100 && kpX <= xEnd + 100) {
            Ski.drawSpriteChar('monika_point', kpX, Ski.jumpValleyY(kpX) + 4, 102, 1, 0, 1, 1, 0);
            Ski.drawSpriteChar('gibb_student_idle', kpX + 58, Ski.jumpValleyY(kpX + 58) + 4, 98, 1, 0, 1, 1, 0);
        }

        Ski.drawHeroRider(js.wx, js.wy, {
            t: s.timeLeft,
            tuck: js.phase === 'inrun' || js.phase === 'takeoff',
            air: js.phase === 'flight',
            attacking: s.attackAnimTimer > 0,
            blocking: g.player && g.player.isBlocking,
            hurtFlash: s.hurtFlash > 0,
            boost: s.boostTimer > 0,
            tilt: js.phase === 'flight' ? (js.pitchDeg * Math.PI / 180) : 0.25,
            rot: s.spinAngle + (js.crashed ? 1.55 : 0)
        });

        ctx.restore();

        // ---------------- SCREEN-SPACE PHASE INTERACTIVE WIDGETS ----------------
        if (js.phase === 'inrun' || js.phase === 'takeoff') {
            // Balance Gauge (must counter crosswind with [A / D]!)
            const bx = SKI_VW * 0.5 - 140;
            const by = 152;
            ctx.fillStyle = 'rgba(12, 18, 34, 0.88)';
            ctx.strokeStyle = Math.abs(js.balance) <= 0.38 ? '#2ed573' : '#ff6348';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(bx, by, 280, 42, 12);
            ctx.fill();
            ctx.stroke();

            // Sweet Spot Zone + Needle
            ctx.fillStyle = 'rgba(46, 213, 115, 0.35)';
            ctx.fillRect(bx + 140 - 44, by + 22, 88, 12);
            ctx.fillStyle = '#ffd32a';
            const needleX = bx + 140 + js.balance * 115;
            ctx.beginPath(); ctx.arc(needleX, by + 28, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '900 11px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SPUR-BALANCE [A/D] • HOCKE [S] FÜR SPEED', SKI_VW * 0.5, by + 14);
        }

        if (js.phase === 'takeoff') {
            const mx = SKI_VW * 0.5 - 180;
            const my = 204;
            ctx.fillStyle = 'rgba(12, 18, 34, 0.90)';
            ctx.strokeStyle = '#ffd32a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(mx, my, 360, 40, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#2ed573';
            ctx.fillRect(mx + 360 * 0.72, my + 20, 360 * 0.25, 12);
            ctx.fillStyle = '#fff';
            ctx.fillRect(mx + 360 * Math.min(1, js.takeoffPos) - 3, my + 16, 6, 20);
            ctx.font = '900 12px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ SCHRITT 1: OPTIMALER ABSPRUNG! [LEERTASTE / W] ⚡', SKI_VW * 0.5, my + 14);
        }

        if (js.phase === 'flight') {
            const altY = Ski.jumpValleyY(js.wx) - js.wy;
            const curM = Math.max(0, Math.round((js.wx - 1460) / 14.5 + js.stuntsDone * 10));
            const bal = js.landBalance || 0;
            const balGood = Math.abs(bal) <= 0.44;

            // Step 2 HUD Card: V-Style & Controlled [A/D] Landing Balance Meter!
            ctx.fillStyle = 'rgba(12, 18, 34, 0.90)';
            ctx.strokeStyle = balGood ? '#2ed573' : '#ffd32a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(SKI_VW * 0.5 - 248, 148, 496, 76, 14);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = balGood ? '#2ed573' : '#ffd32a';
            ctx.font = '900 13px Outfit, Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `SCHRITT 2: LANDUNG MIT [A / D] KONTROLLIEREN! • WIND ${js.windMs >= 0 ? '➡' : '⬅'} ${Math.abs(js.windMs).toFixed(1)} m/s`,
                SKI_VW * 0.5, 169
            );

            // Balance gauge inside card
            const gx = SKI_VW * 0.5 - 140;
            const gy = 179;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
            ctx.fillRect(gx, gy, 280, 14);
            ctx.fillStyle = 'rgba(46, 213, 115, 0.48)';
            ctx.fillRect(gx + 140 - 62, gy, 124, 14);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(gx + 140 + bal * 124, gy + 7, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#dfe6e9';
            ctx.font = '800 12.5px Outfit, Arial';
            ctx.fillText(
                `WEITE: ${curM}m • HÖHE: ${Math.max(0, Math.round(altY / 10))}m • ${balGood ? '⭐ TELEMARK-BALANCE (+18m)' : '◀ [A] / [D] ▶ ZUR MITTE'}`,
                SKI_VW * 0.5, 212
            );
        }
    },

    renderSnowParticles(s) {
        const wxOff = (s.subMode === 'ski_lift' || s.subMode === 'ski_jump') ? -s.camX : 0;
        const wyOff = (s.subMode === 'ski_lift' || s.subMode === 'ski_jump') ? -s.camY : 0;
        for (const sp of s.snowSpray) {
            ctx.fillStyle = sp.color || `rgba(255, 255, 255, ${Math.min(1, sp.life * 2.5)})`;
            ctx.beginPath();
            ctx.arc(sp.x + wxOff, sp.y + wyOff, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    renderProjectiles(g, s) {
        const offX = (s.subMode === 'ski_lift' || s.subMode === 'ski_jump') ? s.camX : 0;
        const offY = (s.subMode === 'ski_lift' || s.subMode === 'ski_jump') ? s.camY : 0;
        for (const p of s.projectiles) {
            const sx = p.worldSpace ? (p.x - offX) : p.x;
            const sy = p.worldSpace ? (p.y - offY) : p.y;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(s.timeLeft * 12);
            ctx.strokeStyle = '#151c2c';
            ctx.lineWidth = 2.4;
            if (p.kind === 'law_book') {
                ctx.fillStyle = '#2e86de';
                ctx.fillRect(-13, -15, 26, 30);
                ctx.strokeRect(-13, -15, 26, 30);
                ctx.fillStyle = '#ffd32a';
                ctx.font = '900 10px Outfit, Arial';
                ctx.textAlign = 'center';
                ctx.fillText('OR', 0, 4);
            } else {
                ctx.fillStyle = p.fromPlayer ? '#ffd32a' : '#ff4757';
                ctx.beginPath();
                ctx.ellipse(0, 0, p.r, p.r * 0.56, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        }
    },

    renderSkiHUD(g, s) {
        // Sits cleanly at x=18, y=566..636 (strictly ABOVE #ability-dock at bottom: 16..62px -> ZERO overlap!)
        const cardX = 18;
        const cardY = SKI_VH - 154;
        const cardW = 342;
        const cardH = 72;

        ctx.save();
        ctx.fillStyle = 'rgba(11, 16, 30, 0.88)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 14);
        ctx.fill();
        ctx.stroke();

        // Left Metric: Speed or Altitude/Best
        let leftBig = `${Math.round(s.speed * 0.22)} km/h`;
        let rightBadge = s.downhillPhase === 'run2' ? 'ABFAHRT 2/2 →' : (s.downhillPhase === 'cutscene_lift' ? 'SKILIFT ↗' : (s.downhillPhase === 'cutscene_debrief' ? 'BESPRECHUNG' : 'ABFAHRT 1/2 →'));
        let subLine = `DISTANZ: ${Math.floor(s.dist / 10)}m / ${Math.floor(s.length / 10)}m`;

        if (s.subMode === 'slalom') {
            rightBadge = `HANG ${s.slalomSec + 1}/${s.slalomSections} ↓`;
            subLine = `TORE: ${s.gatesPassed} / ${s.gatesRequired} • KOMBO ×${s.gateCombo}`;
        } else if (s.subMode === 'ski_lift' && s.liftState) {
            leftBig = `${Math.floor(s.liftState.progress / 10)}m`;
            rightBadge = 'SKILIFT ↗';
            subLine = `SCHLUCHT = TOD! • DASH: ${s.liftState.dashCharges > 0 ? '⚡BEREIT' : 'LADEN...'}`;
        } else if (s.subMode === 'ski_jump' && s.jumpState) {
            leftBig = `${Math.round(s.jumpState.vx * 0.175)} km/h`;
            rightBadge = `VERSUCH #${s.jumpState.attempt}`;
            subLine = `REKORD: ${s.jumpState.bestMeters}m / ${s.jumpState.targetSingleMeters}m • TOTAL: ${s.jumpState.totalMeters}m`;
        }

        ctx.fillStyle = '#00d2d3';
        ctx.font = '900 22px Outfit, Arial';
        ctx.textAlign = 'left';
        ctx.fillText(leftBig, cardX + 16, cardY + 32);

        ctx.fillStyle = '#ffd32a';
        ctx.font = '900 13px Outfit, Arial';
        ctx.textAlign = 'right';
        ctx.fillText(rightBadge, cardX + cardW - 16, cardY + 30);

        ctx.fillStyle = '#dfe6e9';
        ctx.font = '700 12.5px Outfit, Arial';
        ctx.textAlign = 'left';
        ctx.fillText(subLine, cardX + 16, cardY + 56);
        ctx.restore();
    },

    pill() {
        const g = this;
        const s = g.ski;
        if (!s) return { icon: '⛷️', text: 'SKI-ALPEN', urgent: false, highlight: false };
        if (s.subMode === 'ski_jump' && s.jumpState) {
            const js = s.jumpState;
            return {
                icon: '🎿',
                text: `WEITSPRUNG • REKORD: ${js.bestMeters}m / ${js.targetSingleMeters}m (TOTAL ${js.totalMeters}/${js.targetTotalMeters}m) • ⏱️ ${Math.ceil(s.timeLeft)}s`,
                urgent: s.timeLeft < 15,
                highlight: js.bestMeters >= js.targetSingleMeters * 0.88
            };
        }
        if (s.subMode === 'ski_lift' && s.liftState) {
            const pct = Math.min(100, Math.floor((s.liftState.progress / s.liftState.goalDist) * 100));
            return {
                icon: '🚡',
                text: `SKILIFT BERGAUF • GIPFEL: ${pct}% • ⚠️ SCHLUCHT = TOD • ⏱️ ${Math.ceil(s.timeLeft)}s`,
                urgent: s.timeLeft < 15,
                highlight: pct >= 85
            };
        }
        if (s.subMode === 'slalom') {
            const rSec = s.rival ? (s.rival.sec || 0) : 0;
            const gapStr = s.rival ? (s.slalomSec > rSec || (s.slalomSec === rSec && s.py >= (s.rival.py || 0)) ? ' • 🥇 VOR ADAM' : ' • 🥈 HINTER ADAM') : '';
            return {
                icon: '🚩',
                text: `LIVE-SLALOM HANG ${s.slalomSec + 1}/${s.slalomSections} • TORE: ${s.gatesPassed}/${s.gatesRequired}${gapStr} • ⏱️ ${Math.ceil(s.timeLeft)}s`,
                urgent: s.timeLeft < 15,
                highlight: s.gatesPassed >= s.gatesRequired
            };
        }
        const pct = Math.min(100, Math.floor((s.dist / s.length) * 100));
        const phaseTxt = s.downhillPhase === 'cutscene_lift' ? 'SKILIFT-RÜCKFAHRT ↗'
            : (s.downhillPhase === 'cutscene_debrief' ? 'MONIKA & ADAM BESPRECHUNG'
            : (s.downhillPhase === 'run2' ? `ABFAHRT 2/2: ${pct}%` : `ABFAHRT 1/2: ${pct}%`));
        return {
            icon: '🥏',
            text: `${phaseTxt}${s.avalanche ? ' • 🏔️ LAWINE!' : ''} • ⏱️ ${Math.ceil(s.timeLeft)}s`,
            urgent: s.timeLeft < 15 || Boolean(s.avalanche && s.dist - s.avalanche.dist < 180),
            highlight: pct >= 85
        };
    }
};

Game.prototype.customModes.ski = {
    hint: '<b>[A/D]</b> Steuern &bull; <b>[W/SPACE]</b> Sprung / Telemark &bull; <b>[S]</b> Hocke &bull; <b>[SHIFT]</b> Dash &bull; <b>[E]</b> Gesetz &bull; <b>[F]</b> Frisbee &bull; <b>[Q]</b> Mega',
    init: Ski.init,
    update: Ski.update,
    render: Ski.render,
    pill: Ski.pill
};
