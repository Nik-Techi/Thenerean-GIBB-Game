/**
 * Thenerean Selvabankumar — Kapitel 4: Alpen-Skilager (v12 Complete Graphical & Gameplay Overhaul)
 *
 * Implements 4 distinct, cel-shaded comic ski gameplay modes in `Game.prototype.customModes.ski`:
 *
 *  1. `downhill` (Normale Ski-Talabfahrt & Lawinen-Talabfahrt):
 *     - Camera & Slope Direction: LEFT (high mountain peak) -> RIGHT (down into the sunny alpine valley).
 *     - Carve, tuck for high speed, jump off kicker ramps, perform mid-air 360° Frisbee-Grab stunts,
 *       dodge pine trees/rocks/fences, race Herr Adam, and outrun the roaring snow avalanche from the left peak!
 *
 *  2. `slalom` (Slalom-Rennen LIVE gegen Herr Adam):
 *     - Camera & Slope Direction: TOP -> BOTTOM (vertical steep race piste down into the valley).
 *     - Weave through alternating Red & Blue articulated slalom gates while Herr Adam races LIVE alongside you
 *       on the piste, throwing frisbees and enforcing gate penalties!
 *
 *  3. `ski_jump` (Ski-Weitsprung auf einer Riesen-Schanze):
 *     - Camera & Slope Direction: LEFT (giant Olympic ski-jump tower on the peak) -> RIGHT (deep alpine valley).
 *     - Phase 1 (Anlauf): Build max speed down the steep ramp & hit the green/gold Takeoff Timing Meter at the lip.
 *     - Phase 2 (Flug): Soar hundreds of meters rightward across the valley, controlling aerodynamic V-style pitch,
 *       catching thermal updraft rings & Frisbee-Boosts, and dodging Herr Adam's mid-air frisbees.
 *     - Phase 3 (Landung): Stick the Telemark landing on the valley slope to beat the K-Point / Hill Record!
 *
 *  4. `ski_lift` (Aktiver Skilift-Kampf nach oben):
 *     - Camera & Direction: Fighting UPWARD along an actively moving alpine chairlift & red gondola cableway!
 *     - Jump from moving chairlift seats to gondola roofs, grind the steel haul cable with sparks flying,
 *       dodge descending chairs, falling icicles, and Herr Adam's frisbee barrages until reaching the Gipfelstation!
 */

const SKI_VW = 1280;
const SKI_VH = 720;

const Ski = {
    isActive(g) {
        return Boolean(g.ski && g.level && g.level.mode === 'ski' && g.state === GAME_STATE.RUNNING);
    },

    cfg(g) {
        return (g.level && g.level.ski) || {};
    },

    getSubMode(g) {
        const c = this.cfg(g);
        if (c.skiType) return c.skiType;
        if (c.slalom) return 'slalom';
        return 'downhill';
    },

    sx(x) {
        return (x / SKI_VW) * canvas.width;
    },

    sy(y) {
        return (y / SKI_VH) * canvas.height;
    },

    keyLeft(g) {
        return Boolean(g.keys['arrowleft'] || g.keys['a'] || g.keys.left);
    },

    keyRight(g) {
        return Boolean(g.keys['arrowright'] || g.keys['d'] || g.keys.right);
    },

    keyUp(g) {
        return Boolean(g.keys['arrowup'] || g.keys['w'] || g.keys.up);
    },

    keyDown(g) {
        return Boolean(g.keys['arrowdown'] || g.keys['s'] || g.touchDuckHeld || g.keys.down);
    },

    keySpace(g) {
        return Boolean(g.keys[' '] || g.keys['space'] || g.keys.space);
    },

    keyDash(g) {
        return Boolean(g.keys['shift'] || g.keys.dash);
    },

    keyBook(g) {
        return Boolean(g.keys['e'] || g.keys.lawBook);
    },

    keyFrisbee(g) {
        return Boolean(g.keys['f'] || g.keys.frisbee);
    },

    keyMega(g) {
        return Boolean(g.keys['q'] || g.keys.special);
    },

    playVoice(g, role = 'boss', force = false) {
        if (!g.level) return;
        const pool = role === 'boss' ? (g.level.bossLines || []) : (g.level.playerLines || []);
        if (!pool.length) return;
        const line = pool[Math.floor(Math.random() * pool.length)];
        if (line && line.clip) {
            window.soundManager.playClip(line.clip, null, 1.0, force ? { forceSolo: true } : { lowPriority: true });
        }
    },

    // =====================================================================
    // INITIALIZATION
    // =====================================================================
    init() {
        const g = this;
        const c = Ski.cfg(g);
        const subMode = Ski.getSubMode(g);

        const p = g.player;
        p.hp = p.maxHp || 150;
        p.megaEnergy = Math.max(p.megaEnergy || 0, 50);
        p.maxMegaEnergy = p.maxMegaEnergy || 100;
        p.invulnerableTime = 0;
        p.lawBookCooldown = 0;
        p.frisbeeCooldown = 0;
        p.dashCooldown = 0;

        // Ambient snow particles
        const snow = [];
        for (let i = 0; i < 85; i++) {
            snow.push({
                x: Math.random() * SKI_VW,
                y: Math.random() * SKI_VH,
                r: 1.6 + Math.random() * 3.0,
                vx: -35 - Math.random() * 55,
                vy: 55 + Math.random() * 85,
                phase: Math.random() * Math.PI * 2
            });
        }

        g.ski = {
            subMode,
            clock: 0,
            dist: 0,
            length: c.length || 9500,
            timeLeft: c.timeLimitSec || 95,
            baseSpeed: c.baseSpeed || 390,
            maxSpeed: c.maxSpeed || 680,
            speed: c.baseSpeed || 390,
            boostTimer: 0,
            iceTimer: 0,
            stuntSpin: 0,
            stuntCount: 0,
            snow,
            spray: [],
            tracks: [],
            projectiles: [],
            books: [],
            obstacles: [],
            collectibles: [],
            scenery: [],
            nextSpawnDist: 360,
            nextSceneryDist: 120,
            voiceTimer: 1.6,

            // Shared player coordinates (interpreted per subMode)
            px: subMode === 'slalom' ? SKI_VW * 0.46 : 290,
            py: subMode === 'slalom' ? 235 : 340,
            vx: 0,
            vy: 0,
            airZ: 0,
            airVZ: 0,
            crouching: false,
            carving: 0,

            // Slalom state
            gates: [],
            nextGateDist: 420,
            gateSide: -1,
            gatesPassed: 0,
            gatesMissed: 0,
            gatesTotal: c.gatesTotal || 20,
            gatesRequired: c.gatesRequired || 14,
            gateStreak: 0,

            // Rival (Herr Adam) state
            rival: c.rival ? {
                dist: 80,
                x: subMode === 'slalom' ? SKI_VW * 0.56 : 560,
                y: subMode === 'slalom' ? 255 : 380,
                vx: 0,
                speed: (c.baseSpeed || 390) * (c.rivalPace || 0.96),
                throwTimer: 1.8,
                stunTimer: 0
            } : null,

            // Avalanche state (Downhill)
            avalanche: c.avalanche ? {
                dist: -(c.avalancheLead || 480),
                speed: (c.baseSpeed || 390) * (c.avalanchePace || 0.91),
                roarTimer: 0
            } : null,

            // Ski Jump (`ski_jump`) state
            jumpState: subMode === 'ski_jump' ? {
                phase: 'inrun', // 'inrun' | 'flight' | 'out_run'
                attempt: 1,
                inrunPos: 0,
                inrunLength: 1150,
                takeoffQuality: 0, // 0..1.25
                takeoffTriggered: false,
                flightX: 0, // meters flown * scale
                flightMeters: 0,
                bestMeters: 0,
                totalMeters: 0,
                targetSingleMeters: c.targetSingleMeters || 175,
                targetTotalMeters: c.targetTotalMeters || 310,
                kPointMeters: c.kPointMeters || 170,
                hillSizeMeters: c.hillSizeMeters || 215,
                altY: 0, // height above landing slope
                velX: 320,
                velY: 0,
                pitchDeg: 14, // ideal glide angle is ~12..18 deg
                wind: 0,
                rings: [],
                airHazards: [],
                landingGrade: '',
                outRunTimer: 0
            } : null,

            // Active Ski Lift (`ski_lift`) state
            liftState: subMode === 'ski_lift' ? {
                progress: 0,
                goalDist: c.length || 7200,
                cableSpeed: c.cableSpeed || 210,
                chairs: [],
                returnChairs: [],
                pylons: [],
                icicles: [],
                windGustTimer: 3.5,
                windForce: 0,
                onChair: null,
                onCable: false,
                summitBossHP: c.summitBossHP || 0,
                summitBossMaxHP: c.summitBossHP || 0
            } : null
        };

        if (subMode === 'ski_jump') {
            Ski.setupSkiJumpAttempt(g);
        } else if (subMode === 'ski_lift') {
            Ski.setupSkiLift(g);
        } else {
            // Pre-populate scenery for downhill / slalom
            for (let d = 150; d < 1800; d += 190) {
                Ski.spawnSceneryItem(g, d);
            }
        }

        // Update HUD labels
        g.ui.progBar.style.width = '0%';
        if (subMode === 'ski_jump') {
            g.ui.progValText.textContent = `0m / ${g.ski.jumpState.targetSingleMeters}m`;
            g.showMemePopup(`🎿 RIESEN-SCHANZE: WEITSPRUNG INS TAL (ZIEL: ${g.ski.jumpState.targetSingleMeters}m)!`);
        } else if (subMode === 'ski_lift') {
            g.ui.progValText.textContent = 'TALSTATION 0%';
            g.showMemePopup('🚡 AKTIVER SKILIFT: KÄMPFE DICH DIE SEILBAHN HOCH ZUM GIPFEL!');
        } else if (subMode === 'slalom') {
            g.ui.progValText.textContent = `0 / ${g.ski.gatesRequired} TORE`;
            g.showMemePopup('🚩 LIVE-SLALOM VON OBEN NACH UNTEN GEGEN HERR ADAM!');
        } else if (c.avalanche) {
            g.ui.progValText.textContent = '0%';
            g.showMemePopup('🏔️ LAWINEN-TALABFAHRT: VOM GIPFEL RECHTS RUNTER INS TAL!');
        } else {
            g.ui.progValText.textContent = '0%';
            g.showMemePopup('🥏 FRISBEE-TALABFAHRT: VOM GIPFEL RECHTS HINUNTER INS TAL!');
        }

        if (g.ui.bossHud) g.ui.bossHud.classList.add('hidden');
        g.updateBars();

        setTimeout(() => {
            if (Ski.isActive(g)) Ski.playVoice(g, 'boss', true);
        }, 650);
    },

    // =====================================================================
    // MAIN UPDATE DISPATCHER
    // =====================================================================
    update(dt) {
        const g = this;
        if (!Ski.isActive(g)) return;
        const s = g.ski;
        const p = g.player;
        const step = dt * 60;

        s.clock += dt;
        if (p.invulnerableTime > 0) p.invulnerableTime = Math.max(0, p.invulnerableTime - step);
        if (p.lawBookCooldown > 0) p.lawBookCooldown = Math.max(0, p.lawBookCooldown - step);
        if (p.frisbeeCooldown > 0) p.frisbeeCooldown = Math.max(0, p.frisbeeCooldown - step);
        if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - step);
        if (s.boostTimer > 0) s.boostTimer = Math.max(0, s.boostTimer - dt);
        if (s.iceTimer > 0) s.iceTimer = Math.max(0, s.iceTimer - dt);

        // Passive Mega-Energy regeneration
        p.megaEnergy = Math.min(p.maxMegaEnergy || 100, (p.megaEnergy || 0) + 5.5 * dt);

        // Ambient snow update
        for (const fl of s.snow) {
            fl.x += (fl.vx + Math.sin(s.clock * 2.2 + fl.phase) * 20) * dt;
            fl.y += fl.vy * dt;
            if (fl.y > SKI_VH + 10) { fl.y = -10; fl.x = Math.random() * SKI_VW; }
            if (fl.x < -10) fl.x = SKI_VW + 10;
            if (fl.x > SKI_VW + 10) fl.x = -10;
        }

        // Snow spray particles
        for (let i = s.spray.length - 1; i >= 0; i--) {
            const sp = s.spray[i];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.vy += (sp.gravity || 220) * dt;
            sp.life -= dt;
            if (sp.life <= 0) s.spray.splice(i, 1);
        }

        // Periodic voice lines from Chapter 4 clips
        s.voiceTimer -= dt;
        if (s.voiceTimer <= 0) {
            s.voiceTimer = 6.5 + Math.random() * 4.5;
            Ski.playVoice(g, Math.random() < 0.58 ? 'boss' : 'player', false);
        }

        // Stopwatch countdown
        s.timeLeft -= dt;
        if (s.timeLeft <= 0) {
            s.timeLeft = 0;
            g.showMemePopup('⏱️ ZEIT ABGELAUFEN — HERR ADAM VERPASST DIR EINE STRAFE!');
            Ski.playVoice(g, 'boss', true);
            g.triggerGameOver();
            return;
        }

        // Common combat abilities (E = Law Book, F = Frisbee-Turbo, Q = Mega-Schrei)
        Ski.handleAbilities(g, dt);

        // Sub-mode specific update
        if (s.subMode === 'ski_jump') {
            Ski.updateSkiJump(g, dt);
        } else if (s.subMode === 'ski_lift') {
            Ski.updateSkiLift(g, dt);
        } else if (s.subMode === 'slalom') {
            Ski.updateSlalom(g, dt);
        } else {
            Ski.updateDownhill(g, dt);
        }

        g.updateBars();
        g.updateMissionPill();
    },

    handleAbilities(g, dt) {
        const s = g.ski;
        const p = g.player;

        // [E] Throw OR-Gesetzbuch
        if (Ski.keyBook(g) && p.lawBookCooldown <= 0) {
            p.lawBookCooldown = p.maxLawBookCooldown || 45;
            window.soundManager.playThrow();
            const isVert = s.subMode === 'slalom';
            s.books.push({
                x: s.px + (isVert ? 0 : 34),
                y: s.py - (isVert ? -24 : 24),
                vx: isVert ? 0 : 720,
                vy: isVert ? 640 : 140,
                rot: 0,
                life: 1.6
            });
            g.addFloatingText('📕 OR-GESETZ!', Ski.sx(s.px), Ski.sy(s.py - 50), '#00d2d3', 20);
        }

        // [F] Frisbee-Turbo (360° shockwave + speed/lift boost)
        if (Ski.keyFrisbee(g) && p.frisbeeCooldown <= 0) {
            p.frisbeeCooldown = p.maxFrisbeeCooldown || 210;
            s.boostTimer = Math.max(s.boostTimer, 3.2);
            p.invulnerableTime = Math.max(p.invulnerableTime, 90);
            window.soundManager.playPowerUp();
            Ski.playVoice(g, 'player', false);
            g.addFloatingText('🥏 FRISBEE-TURBO!', Ski.sx(s.px), Ski.sy(s.py - 60), '#ffd32a', 26);

            // Clear nearby enemy projectiles
            s.projectiles.length = 0;
            if (s.jumpState && s.jumpState.phase === 'flight') {
                s.jumpState.velX += 110;
                s.jumpState.velY -= 135;
                s.jumpState.airHazards.length = 0;
            }
            if (s.liftState) {
                s.liftState.icicles.length = 0;
            }
        }

        // [Q] Mega-Schrei (Full screen clear + heal + boost)
        if (Ski.keyMega(g) && (p.megaEnergy || 0) >= (p.maxMegaEnergy || 100)) {
            p.megaEnergy = 0;
            s.boostTimer = Math.max(s.boostTimer, 4.0);
            p.invulnerableTime = Math.max(p.invulnerableTime, 120);
            g.screenShake = 16;
            g.radialFlashTimer = 22;
            window.soundManager.playMegaBeam();
            Ski.playVoice(g, 'player', true);
            g.addFloatingText('⚡ MEGA-ALPEN-SCHREI!', Ski.sx(SKI_VW * 0.5), Ski.sy(220), '#ffd32a', 30);

            s.projectiles.length = 0;
            s.obstacles.forEach((o) => { o.smashed = true; });
            if (s.rival) s.rival.stunTimer = 2.6;
            if (s.avalanche) s.avalanche.dist -= 320;
            if (s.jumpState && s.jumpState.phase === 'flight') {
                s.jumpState.velX += 140;
                s.jumpState.velY -= 160;
                s.jumpState.airHazards.length = 0;
            }
            if (s.liftState) {
                s.liftState.icicles.length = 0;
                s.liftState.returnChairs.forEach((rc) => { rc.enemy = null; });
            }
        }

        // Update thrown Law Books
        for (let i = s.books.length - 1; i >= 0; i--) {
            const b = s.books[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.rot += 11 * dt;
            b.life -= dt;
            if (b.life <= 0 || b.x > SKI_VW + 80 || b.y > SKI_VH + 80) {
                s.books.splice(i, 1);
            }
        }
    },

    // =====================================================================
    // MODE 1: DOWNHILL (`downhill`) — LEFT (PEAK) TO RIGHT (VALLEY)
    // =====================================================================
    slopeSurfaceY(screenX, worldDist) {
        // Left side is high mountain peak (~215px), descending rightward into the valley (~515px)
        const base = 215 + (screenX / SKI_VW) * 295;
        const w1 = Math.sin((worldDist + screenX * 1.15) * 0.0038) * 22;
        const w2 = Math.cos((worldDist * 0.7 + screenX * 0.85) * 0.0075) * 11;
        return base + w1 + w2;
    },

    updateDownhill(g, dt) {
        const s = g.ski;
        const p = g.player;
        const c = Ski.cfg(g);

        const jumpPressed = Ski.keyUp(g) || Ski.keySpace(g);
        const crouchHeld = Ski.keyDown(g);
        const rightHeld = Ski.keyRight(g);
        const leftHeld = Ski.keyLeft(g);

        s.crouching = crouchHeld && s.airZ <= 0;

        // Horizontal position on the left-to-right slope (210..560)
        const targetVX = (rightHeld ? 240 : 0) - (leftHeld ? 260 : 0);
        s.vx += (targetVX - s.vx) * Math.min(1, dt * 8);
        if (Ski.keyDash(g) && p.dashCooldown <= 0) {
            p.dashCooldown = p.dashMaxCooldown || 95;
            s.vx = 480;
            s.boostTimer = Math.max(s.boostTimer, 1.1);
            p.invulnerableTime = Math.max(p.invulnerableTime, 30);
            window.soundManager.playJump();
            g.addFloatingText('💨 CARVING-DASH!', Ski.sx(s.px), Ski.sy(s.py - 45), '#00d2d3', 20);
        }
        s.px = Math.max(190, Math.min(560, s.px + s.vx * dt));

        // Downhill speed physics (tucking or pressing right accelerates down into the valley; pressing left brakes)
        let targetSpeed = s.baseSpeed;
        if (s.crouching || rightHeld) targetSpeed = s.maxSpeed * (s.crouching ? 1.0 : 0.92);
        else if (leftHeld) targetSpeed = s.baseSpeed * 0.58;
        if (s.boostTimer > 0) targetSpeed = s.maxSpeed * 1.24;
        else if (s.iceTimer > 0) targetSpeed = Math.max(targetSpeed, s.maxSpeed * 1.08);

        s.speed += (targetSpeed - s.speed) * Math.min(1, dt * 3.8);
        s.dist += s.speed * dt;

        // Jump & Air Stunts
        if (jumpPressed && s.airZ <= 0) {
            s.airVZ = 430;
            s.airZ = 1;
            s.stuntSpin = 0;
            window.soundManager.playJump();
        }
        if (s.airZ > 0 || s.airVZ > 0) {
            s.airZ += s.airVZ * dt;
            s.airVZ -= 920 * dt;
            // Perform 360° Frisbee-Grab Stunt in high air
            if (s.airZ > 55 && (Ski.keySpace(g) || Ski.keyUp(g)) && s.stuntSpin === 0) {
                s.stuntSpin = 0.01;
            }
            if (s.stuntSpin > 0) {
                s.stuntSpin += dt * Math.PI * 4.2;
                if (s.stuntSpin >= Math.PI * 2) {
                    s.stuntSpin = 0;
                    s.stuntCount++;
                    s.boostTimer = Math.max(s.boostTimer, 1.4);
                    p.megaEnergy = Math.min(p.maxMegaEnergy || 100, (p.megaEnergy || 0) + 18);
                    g.comboCount = (g.comboCount || 0) + 1;
                    g.maxComboRecord = Math.max(g.maxComboRecord || 0, g.comboCount);
                    g.addFloatingText('🌀 360° FRISBEE-GRAB! +TEMPO', Ski.sx(s.px), Ski.sy(s.py - 85), '#ffd32a', 22);
                    window.soundManager.playCollect();
                }
            }
            if (s.airZ <= 0) {
                s.airZ = 0;
                s.airVZ = 0;
                s.stuntSpin = 0;
            }
        }

        const groundY = Ski.slopeSurfaceY(s.px, s.dist);
        s.py = groundY - s.airZ;

        // Snow spray & carving tracks when on snow
        if (s.airZ <= 0 && Math.random() < 0.75) {
            s.spray.push({
                x: s.px - 22,
                y: groundY - 4,
                vx: -110 - Math.random() * 90,
                vy: -50 - Math.random() * 70,
                r: 3 + Math.random() * 4.5,
                life: 0.38
            });
            s.tracks.push({ dist: s.dist, screenXOffset: 0, life: 1.2 });
            if (s.tracks.length > 70) s.tracks.shift();
        }

        // Spawn scenery & obstacles ahead on the right (higher worldDist)
        while (s.nextSceneryDist < s.dist + 1350) {
            Ski.spawnSceneryItem(g, s.nextSceneryDist);
            s.nextSceneryDist += 160 + Math.random() * 110;
        }
        while (s.nextSpawnDist < s.dist + 1250 && s.nextSpawnDist < s.length - 450) {
            Ski.spawnDownhillRow(g, s.nextSpawnDist);
            s.nextSpawnDist += (c.obstacleSpacing || 265) * (0.85 + Math.random() * 0.35);
        }

        // Update & collide obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
            const o = s.obstacles[i];
            const ox = s.px + (o.dist - s.dist);
            const oy = Ski.slopeSurfaceY(ox, s.dist);
            o.screenX = ox;
            o.screenY = oy;

            if (ox < -160) {
                s.obstacles.splice(i, 1);
                continue;
            }
            if (o.smashed) continue;

            // Check Law Book hit on obstacle
            for (let bi = s.books.length - 1; bi >= 0; bi--) {
                const b = s.books[bi];
                if (Math.hypot(b.x - ox, b.y - (oy - o.h * 0.5)) < o.w * 0.65 + 24) {
                    if (o.type !== 'ramp' && o.type !== 'ice') {
                        o.smashed = true;
                        s.books.splice(bi, 1);
                        window.soundManager.playHit();
                        g.addFloatingText('💥 ZERTRÜMMERT!', Ski.sx(ox), Ski.sy(oy - 40), '#ffd32a', 18);
                        break;
                    }
                }
            }
            if (o.smashed) continue;

            // Player collision with obstacle
            if (!o.triggered && Math.abs(ox - s.px) < (o.w * 0.45 + 24)) {
                if (o.type === 'ramp') {
                    if (s.airZ < 32) {
                        o.triggered = true;
                        s.airVZ = 540;
                        s.airZ = 8;
                        s.boostTimer = Math.max(s.boostTimer, 1.8);
                        window.soundManager.playJump();
                        g.addFloatingText('🚀 SCHANZEN-BOOST!', Ski.sx(s.px), Ski.sy(s.py - 55), '#00d2d3', 23);
                    }
                } else if (o.type === 'ice') {
                    if (s.airZ < 16) {
                        o.triggered = true;
                        s.iceTimer = 1.6;
                        g.addFloatingText('🧊 EISPLATTE! +TEMPO', Ski.sx(s.px), Ski.sy(s.py - 45), '#70a1ff', 18);
                    }
                } else {
                    // Solid obstacle (tree, rock, fence, snowman, cow) — can jump over if airZ >= o.jumpClearH
                    const clearH = o.jumpClearH || 48;
                    if (s.airZ < clearH) {
                        o.triggered = true;
                        o.smashed = true;
                        if (p.invulnerableTime <= 0 && s.boostTimer <= 0) {
                            Ski.hurtPlayer(g, o.dmg || 16, `${o.label || 'HINDERNIS'}!`);
                            s.speed = Math.max(170, s.speed * 0.58);
                        } else {
                            window.soundManager.playHit();
                            g.addFloatingText('💥 DURCHBROCHEN!', Ski.sx(ox), Ski.sy(oy - 40), '#ffd32a', 19);
                        }
                    }
                }
            }
        }

        // Collectibles
        for (let i = s.collectibles.length - 1; i >= 0; i--) {
            const col = s.collectibles[i];
            const cx = s.px + (col.dist - s.dist);
            const cy = Ski.slopeSurfaceY(cx, s.dist) - (col.hoverH || 34);
            col.screenX = cx;
            col.screenY = cy;
            if (cx < -100) {
                s.collectibles.splice(i, 1);
                continue;
            }
            if (!col.taken && Math.hypot(cx - s.px, cy - (s.py - 28)) < 48) {
                col.taken = true;
                Ski.collectItem(g, col);
                s.collectibles.splice(i, 1);
            }
        }

        // Update Rival Herr Adam (if active)
        if (s.rival) {
            const r = s.rival;
            if (r.stunTimer > 0) {
                r.stunTimer -= dt;
                r.speed = s.baseSpeed * 0.55;
            } else {
                const targetRivalSpeed = s.baseSpeed * (c.rivalPace || 0.96);
                const rubberBand = (s.dist - r.dist) * 0.18;
                r.speed = Math.max(240, Math.min(s.maxSpeed * 1.02, targetRivalSpeed + rubberBand));
            }
            r.dist += r.speed * dt;
            r.x = s.px + (r.dist - s.dist);
            r.y = Ski.slopeSurfaceY(r.x, s.dist);

            // Herr Adam throws Frisbees toward Thenerean
            r.throwTimer -= dt;
            if (r.throwTimer <= 0 && r.stunTimer <= 0 && Math.abs(r.x - s.px) < 620) {
                r.throwTimer = (c.frisbeeInterval || 2.2) * (0.85 + Math.random() * 0.35);
                const dir = r.x >= s.px ? -1 : 1;
                s.projectiles.push({
                    x: r.x,
                    y: r.y - 38,
                    vx: dir * 340,
                    vy: -30,
                    kind: 'frisbee',
                    life: 2.8
                });
            }

            // Law books can stun Herr Adam
            for (let bi = s.books.length - 1; bi >= 0; bi--) {
                const b = s.books[bi];
                if (Math.hypot(b.x - r.x, b.y - (r.y - 38)) < 54) {
                    r.stunTimer = 2.0;
                    s.books.splice(bi, 1);
                    window.soundManager.playHit();
                    g.addFloatingText('📕 HERR ADAM GEBREMST!', Ski.sx(r.x), Ski.sy(r.y - 70), '#2ed573', 21);
                    break;
                }
            }
        }

        // Update Projectiles
        for (let i = s.projectiles.length - 1; i >= 0; i--) {
            const pr = s.projectiles[i];
            pr.x += pr.vx * dt;
            pr.y = Ski.slopeSurfaceY(pr.x, s.dist) - 34;
            pr.life -= dt;
            if (pr.life <= 0 || pr.x < -80 || pr.x > SKI_VW + 80) {
                s.projectiles.splice(i, 1);
                continue;
            }
            if (Math.hypot(pr.x - s.px, pr.y - (s.py - 32)) < 40) {
                s.projectiles.splice(i, 1);
                if (p.invulnerableTime <= 0 && s.boostTimer <= 0) {
                    Ski.hurtPlayer(g, 14, '🥏 FRISBEE-TREFFER!');
                    s.speed = Math.max(200, s.speed * 0.72);
                }
            }
        }

        // Update Avalanche (rolls down from top-left behind Thenerean!)
        if (s.avalanche) {
            const av = s.avalanche;
            av.dist += av.speed * dt;
            // Keep avalanche visibly roaring on the left side of the screen (within 230m behind player)
            if (s.dist - av.dist > 220) av.dist = s.dist - 220;
            if (av.dist >= s.dist - 38) {
                if (p.invulnerableTime <= 0) {
                    Ski.hurtPlayer(g, 24, '🏔️ VON DER LAWINE ERFASST!');
                }
                av.dist = s.dist - 190;
                s.boostTimer = Math.max(s.boostTimer, 1.3);
            }
        }

        // Progress UI
        const pct = Math.min(100, Math.floor((s.dist / s.length) * 100));
        g.ui.progBar.style.width = `${pct}%`;
        g.ui.progValText.textContent = `${pct}% INS TAL`;

        // Win check at valley finish line
        if (s.dist >= s.length) {
            if (s.rival && s.rival.dist > s.dist + 45) {
                g.showMemePopup('❌ HERR ADAM WAR SCHNELLER IM TAL!');
                Ski.playVoice(g, 'boss', true);
                g.triggerGameOver();
                return;
            }
            window.soundManager.playWaveClear();
            g.triggerLevelWin();
        }
    },

    spawnSceneryItem(g, dist) {
        const s = g.ski;
        const kinds = ['chalet', 'pine_cluster', 'flag_swiss', 'lift_pylon_bg'];
        s.scenery.push({
            dist,
            kind: kinds[Math.floor(Math.random() * kinds.length)],
            scale: 0.85 + Math.random() * 0.35
        });
        if (s.scenery.length > 30) s.scenery.shift();
    },

    spawnDownhillRow(g, dist) {
        const s = g.ski;
        const roll = Math.random();
        if (roll < 0.24) {
            s.obstacles.push({ dist, type: 'ramp', w: 96, h: 36, jumpClearH: 0, label: 'SCHANZE' });
            // Place a floating collectible in the air after a kicker ramp!
            s.collectibles.push({
                dist: dist + 195,
                kind: Math.random() < 0.65 ? 'frisbee_gold' : 'energy',
                hoverH: 105
            });
        } else if (roll < 0.40) {
            s.obstacles.push({ dist, type: 'ice', w: 115, h: 18, jumpClearH: 0, label: 'EISPLATTE' });
        } else if (roll < 0.62) {
            s.obstacles.push({ dist, type: 'pine', w: 64, h: 92, jumpClearH: 44, dmg: 16, label: 'ALPEN-TANNE' });
        } else if (roll < 0.78) {
            s.obstacles.push({ dist, type: 'rock', w: 68, h: 52, jumpClearH: 38, dmg: 18, label: 'GRANIT-FELS' });
        } else if (roll < 0.90) {
            s.obstacles.push({ dist, type: 'fence', w: 86, h: 48, jumpClearH: 40, dmg: 15, label: 'FANGZAUN' });
        } else {
            s.obstacles.push({ dist, type: 'snowman', w: 58, h: 68, jumpClearH: 42, dmg: 14, label: 'GIBB-SCHNEEMANN' });
        }

        if (Math.random() < 0.55) {
            const cKinds = ['frisbee_gold', 'coffee', 'energy', 'coin'];
            s.collectibles.push({
                dist: dist + 115,
                kind: cKinds[Math.floor(Math.random() * cKinds.length)],
                hoverH: 34
            });
        }
    },

    // =====================================================================
    // MODE 2: SLALOM (`slalom`) — TOP TO BOTTOM LIVE AGAINST HERR ADAM
    // =====================================================================
    updateSlalom(g, dt) {
        const s = g.ski;
        const p = g.player;
        const c = Ski.cfg(g);

        const leftHeld = Ski.keyLeft(g);
        const rightHeld = Ski.keyRight(g);
        const downHeld = Ski.keyDown(g);
        const upHeld = Ski.keyUp(g);
        const jumpPressed = Ski.keySpace(g);

        // Horizontal carving across the vertical piste (240 .. 1040)
        const steer = (rightHeld ? 1 : 0) - (leftHeld ? 1 : 0);
        s.carving = steer;
        const targetVX = steer * 450;
        s.vx += (targetVX - s.vx) * Math.min(1, dt * 9.5);

        if (Ski.keyDash(g) && p.dashCooldown <= 0) {
            p.dashCooldown = p.dashMaxCooldown || 95;
            s.vx = (steer !== 0 ? steer : 1) * 680;
            s.boostTimer = Math.max(s.boostTimer, 0.9);
            window.soundManager.playJump();
            g.addFloatingText('💨 SLALOM-CUT!', Ski.sx(s.px), Ski.sy(s.py - 35), '#00d2d3', 20);
        }

        s.px = Math.max(235, Math.min(SKI_VW - 235, s.px + s.vx * dt));

        // Hop over ice/hazards with SPACE
        if (jumpPressed && s.airZ <= 0) {
            s.airVZ = 340;
            s.airZ = 1;
            window.soundManager.playJump();
        }
        if (s.airZ > 0 || s.airVZ > 0) {
            s.airZ += s.airVZ * dt;
            s.airVZ -= 880 * dt;
            if (s.airZ <= 0) { s.airZ = 0; s.airVZ = 0; }
        }

        // Top-to-Bottom downhill speed
        const carveDrag = Math.abs(steer) * 35;
        let targetSpeed = s.baseSpeed - carveDrag;
        if (downHeld) targetSpeed = s.maxSpeed * 0.96;
        else if (upHeld) targetSpeed = s.baseSpeed * 0.62;
        if (s.boostTimer > 0) targetSpeed = s.maxSpeed * 1.18;

        s.speed += (targetSpeed - s.speed) * Math.min(1, dt * 4.2);
        s.dist += s.speed * dt;

        // Carving tracks trailing ABOVE player (since skiing from top to bottom)
        if (s.airZ <= 0 && Math.random() < 0.8) {
            s.tracks.push({ x: s.px, dist: s.dist, life: 1.1 });
            if (s.tracks.length > 80) s.tracks.shift();
            if (steer !== 0) {
                s.spray.push({
                    x: s.px - steer * 18,
                    y: s.py - 8,
                    vx: -steer * (90 + Math.random() * 80),
                    vy: -80 - Math.random() * 60,
                    gravity: 160,
                    r: 3 + Math.random() * 3.5,
                    life: 0.32
                });
            }
        }

        // Spawn Slalom Gates along the vertical course
        const gateSpacing = (s.length - 700) / Math.max(1, s.gatesTotal);
        while (s.gates.length + s.gatesPassed + s.gatesMissed < s.gatesTotal && s.nextGateDist < s.dist + 950) {
            const idx = s.gates.length + s.gatesPassed + s.gatesMissed;
            const side = (idx % 2 === 0) ? -1 : 1;
            const centerX = SKI_VW * 0.5 + side * (120 + (idx % 3) * 42);
            const halfW = c.gateHalfWidth || 98;
            s.gates.push({
                index: idx + 1,
                dist: s.nextGateDist,
                x: centerX,
                halfW,
                color: side < 0 ? 'red' : 'blue',
                state: 'pending' // 'pending' | 'passed' | 'missed'
            });
            // Occasional collectible inside the gate line
            if (idx % 3 === 1) {
                s.collectibles.push({
                    dist: s.nextGateDist + gateSpacing * 0.45,
                    x: SKI_VW * 0.5 - side * 55,
                    kind: idx % 2 === 0 ? 'frisbee_gold' : 'energy'
                });
            }
            s.nextGateDist += gateSpacing;
        }

        // Update Gates (player at py = 235; gates approach from bottom y > 235 upward to y < 235)
        for (let i = s.gates.length - 1; i >= 0; i--) {
            const gate = s.gates[i];
            const gy = s.py + (gate.dist - s.dist) * 0.65;
            gate.screenY = gy;

            if (gate.state === 'pending' && gy <= s.py) {
                if (Math.abs(s.px - gate.x) <= gate.halfW + 18) {
                    gate.state = 'passed';
                    s.gatesPassed++;
                    s.gateStreak++;
                    s.speed = Math.min(s.maxSpeed * 1.15, s.speed + 55);
                    p.megaEnergy = Math.min(p.maxMegaEnergy || 100, (p.megaEnergy || 0) + 10);
                    g.comboCount = (g.comboCount || 0) + 1;
                    g.maxComboRecord = Math.max(g.maxComboRecord || 0, g.comboCount);
                    window.soundManager.playCollect();
                    g.addFloatingText(
                        `✔ TOR ${gate.index}! ${s.gateStreak >= 3 ? `🔥x${s.gateStreak}` : '+TEMPO'}`,
                        Ski.sx(gate.x),
                        Ski.sy(s.py - 30),
                        '#2ed573',
                        20
                    );
                } else {
                    gate.state = 'missed';
                    s.gatesMissed++;
                    s.gateStreak = 0;
                    s.speed = Math.max(190, s.speed * 0.68);
                    s.timeLeft = Math.max(1, s.timeLeft - 1.5);
                    window.soundManager.playHit();
                    g.addFloatingText('❌ TOR VERPASST! (-1.5s)', Ski.sx(s.px), Ski.sy(s.py - 32), '#ff4757', 21);
                    if (Math.random() < 0.6) window.soundManager.playClip('adam_strafe_verpasst');
                }
            }

            if (gy < -120) {
                s.gates.splice(i, 1);
            }
        }

        // Collectibles in Slalom
        for (let i = s.collectibles.length - 1; i >= 0; i--) {
            const col = s.collectibles[i];
            const cy = s.py + (col.dist - s.dist) * 0.65;
            col.screenX = col.x;
            col.screenY = cy;
            if (cy < -80) {
                s.collectibles.splice(i, 1);
                continue;
            }
            if (!col.taken && Math.hypot(col.x - s.px, cy - s.py) < 46) {
                col.taken = true;
                Ski.collectItem(g, col);
                s.collectibles.splice(i, 1);
            }
        }

        // Live Rival Herr Adam weaving through the slalom gates!
        if (s.rival) {
            const r = s.rival;
            if (r.stunTimer > 0) {
                r.stunTimer -= dt;
                r.speed = s.baseSpeed * 0.55;
            } else {
                const baseRival = s.baseSpeed * (c.rivalPace || 0.94);
                const gap = s.dist - r.dist;
                r.speed = Math.max(240, Math.min(s.maxSpeed * 0.98, baseRival + gap * 0.14));
            }
            r.dist += r.speed * dt;

            // Steer Herr Adam toward the next upcoming gate
            const nextGate = s.gates.find((gt) => gt.dist >= r.dist - 20);
            const targetX = nextGate ? nextGate.x : SKI_VW * 0.55;
            r.x += (targetX - r.x) * Math.min(1, dt * 4.5);
            r.y = s.py + (r.dist - s.dist) * 0.65;

            // Law books hit Herr Adam
            for (let bi = s.books.length - 1; bi >= 0; bi--) {
                const b = s.books[bi];
                if (Math.hypot(b.x - r.x, b.y - r.y) < 52) {
                    r.stunTimer = 2.2;
                    s.books.splice(bi, 1);
                    window.soundManager.playHit();
                    g.addFloatingText('📕 HERR ADAM AUSGEBREMST!', Ski.sx(r.x), Ski.sy(r.y - 40), '#2ed573', 20);
                    break;
                }
            }
        }

        // Update HUD progress
        const pct = Math.min(100, Math.floor((s.dist / s.length) * 100));
        g.ui.progBar.style.width = `${pct}%`;
        g.ui.progValText.textContent = `TORE: ${s.gatesPassed} / ${s.gatesRequired}`;

        // Finish check
        if (s.dist >= s.length) {
            if (s.gatesPassed < s.gatesRequired) {
                g.showMemePopup(`❌ NUR ${s.gatesPassed}/${s.gatesRequired} TORE — DISQUALIFIZIERT!`);
                window.soundManager.playClip('adam_strafe_verpasst');
                g.triggerGameOver();
                return;
            }
            if (s.rival && s.rival.dist > s.dist + 55) {
                g.showMemePopup('❌ HERR ADAM HAT DAS SLALOM-RENNEN GEWONNEN!');
                Ski.playVoice(g, 'boss', true);
                g.triggerGameOver();
                return;
            }
            window.soundManager.playWaveClear();
            g.triggerLevelWin();
        }
    },

    // =====================================================================
    // MODE 3: GIANT SKI JUMP (`ski_jump`) — LEFT (TOWER) TO RIGHT (VALLEY)
    // =====================================================================
    setupSkiJumpAttempt(g) {
        const s = g.ski;
        const js = s.jumpState;
        js.phase = 'inrun';
        js.inrunPos = 0;
        js.takeoffQuality = 0;
        js.takeoffTriggered = false;
        js.flightX = 0;
        js.flightMeters = 0;
        js.altY = 230;
        js.velX = 340;
        js.velY = 0;
        js.pitchDeg = 14;
        js.landingGrade = '';
        js.outRunTimer = 0;
        js.rings = [];
        js.airHazards = [];

        // Populate thermal updraft rings and mid-air hazards across the valley (left-to-right)
        for (let m = 35; m <= 245; m += 28) {
            js.rings.push({
                meters: m,
                alt: 85 + Math.sin(m * 0.08) * 55 + (m < 130 ? 45 : 0),
                taken: false,
                kind: m % 56 === 0 ? 'frisbee_boost' : 'updraft'
            });
            if (m >= 60 && m % 42 === 7) {
                js.airHazards.push({
                    meters: m,
                    alt: 75 + Math.cos(m * 0.11) * 55,
                    hit: false,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
        s.speed = 260;
    },

    updateSkiJump(g, dt) {
        const s = g.ski;
        const js = s.jumpState;
        const p = g.player;

        if (js.phase === 'inrun') {
            // PHASE 1: Steep In-Run down the Giant Ski Jump Ramp (Top-Left to Center-Left)
            const tuckHeld = Ski.keyDown(g) || Ski.keyRight(g);
            s.crouching = tuckHeld;
            const accel = tuckHeld ? 290 : 185;
            s.speed = Math.min(s.maxSpeed * 1.12, s.speed + accel * dt);
            js.inrunPos += s.speed * dt;

            // Screen position along the giant ramp on the left
            const t = Math.min(1, js.inrunPos / js.inrunLength);
            s.px = 130 + t * 340;
            s.py = 145 + Math.pow(t, 1.15) * 235;

            // Takeoff Timing Window (sweet spot is t in 0.82 .. 0.99)
            if ((Ski.keySpace(g) || Ski.keyUp(g)) && t >= 0.65 && !js.takeoffTriggered) {
                js.takeoffTriggered = true;
                const distFromIdeal = Math.abs(t - 0.92);
                if (distFromIdeal <= 0.055) {
                    js.takeoffQuality = 1.25;
                    g.addFloatingText('🌟 PERFEKTER ABSPRUNG! (+25% WEITE)', Ski.sx(s.px), Ski.sy(s.py - 65), '#ffd32a', 26);
                } else if (distFromIdeal <= 0.13) {
                    js.takeoffQuality = 1.08;
                    g.addFloatingText('✔ GUTER ABSPRUNG! (+10% WEITE)', Ski.sx(s.px), Ski.sy(s.py - 60), '#2ed573', 22);
                } else {
                    js.takeoffQuality = 0.88;
                    g.addFloatingText('⚠️ FRÜHER ABSPRUNG!', Ski.sx(s.px), Ski.sy(s.py - 55), '#ffa502', 20);
                }
                window.soundManager.playJump();
            }

            // Launch off the Schanzentisch into the Valley!
            if (js.inrunPos >= js.inrunLength) {
                if (!js.takeoffTriggered) {
                    js.takeoffQuality = 0.85;
                    g.addFloatingText('ABSPRUNG VOM SCHANZENTISCH!', Ski.sx(s.px), Ski.sy(s.py - 55), '#70a1ff', 20);
                }
                js.phase = 'flight';
                js.velX = Math.max(360, s.speed * 0.82 * js.takeoffQuality);
                js.velY = -145 * js.takeoffQuality;
                js.altY = 175 * js.takeoffQuality;
                js.pitchDeg = 15;
                window.soundManager.playJump();
            }
        } else if (js.phase === 'flight') {
            // PHASE 2: Soaring Left-to-Right across the deep Alpine Valley!
            const pitchUp = Ski.keyUp(g) || Ski.keyLeft(g);
            const pitchDown = Ski.keyDown(g) || Ski.keyRight(g);
            if (pitchUp) js.pitchDeg = Math.min(34, js.pitchDeg + 38 * dt);
            else if (pitchDown) js.pitchDeg = Math.max(-18, js.pitchDeg - 38 * dt);
            else js.pitchDeg += (14 - js.pitchDeg) * Math.min(1, dt * 1.8);

            // Air-Dash boost
            if (Ski.keyDash(g) && p.dashCooldown <= 0) {
                p.dashCooldown = p.dashMaxCooldown || 95;
                js.velX += 85;
                js.altY += 28;
                window.soundManager.playJump();
                g.addFloatingText('💨 LUFT-SCHUB!', Ski.sx(s.px), Ski.sy(s.py - 50), '#00d2d3', 21);
            }

            // Aerodynamic V-Style Lift calculation (ideal pitch is 10..20 degrees)
            const pitchDiff = Math.abs(js.pitchDeg - 15);
            const aeroEfficiency = Math.max(0.25, 1 - pitchDiff / 24);
            const gravity = 46 - aeroEfficiency * 24 - (s.boostTimer > 0 ? 14 : 0);

            js.altY -= gravity * dt;
            js.velX = Math.max(280, js.velX + (aeroEfficiency * 22 - 12) * dt);
            js.flightX += js.velX * dt;
            js.flightMeters = Math.round((js.flightX / 15.5) * 10) / 10;

            // Player visual position during flight (left-to-right into the valley)
            const progressNorm = Math.min(1, js.flightMeters / 240);
            s.px = 310 + progressNorm * 320;
            const valleySlopeY = 390 + progressNorm * 165;
            s.py = Math.max(115, valleySlopeY - js.altY * 1.15);

            // Check Thermal Updraft Rings & Frisbee-Boosts
            for (const ring of js.rings) {
                if (!ring.taken && Math.abs(ring.meters - js.flightMeters) < 7.5 && Math.abs(ring.alt - js.altY) < 46) {
                    ring.taken = true;
                    js.altY += ring.kind === 'frisbee_boost' ? 42 : 28;
                    js.velX += ring.kind === 'frisbee_boost' ? 65 : 40;
                    p.megaEnergy = Math.min(p.maxMegaEnergy || 100, (p.megaEnergy || 0) + 16);
                    g.comboCount = (g.comboCount || 0) + 1;
                    window.soundManager.playCollect();
                    g.addFloatingText(
                        ring.kind === 'frisbee_boost' ? '🥏 FRISBEE-THERMIK! +25m' : '🌬️ AUFWIND-RING! +18m',
                        Ski.sx(s.px),
                        Ski.sy(s.py - 45),
                        '#00d2d3',
                        22
                    );
                }
            }

            // Check Mid-Air Frisbee Hazards
            for (const hz of js.airHazards) {
                const curAlt = hz.alt + Math.sin(s.clock * 3.5 + hz.phase) * 22;
                if (!hz.hit && Math.abs(hz.meters - js.flightMeters) < 6.0 && Math.abs(curAlt - js.altY) < 34) {
                    hz.hit = true;
                    if (p.invulnerableTime <= 0 && s.boostTimer <= 0) {
                        Ski.hurtPlayer(g, 12, '🥏 LUFT-FRISBEE!');
                        js.altY = Math.max(10, js.altY - 22);
                    }
                }
            }

            // Touchdown on the Valley Landing Slope!
            if (js.altY <= 0) {
                js.altY = 0;
                js.phase = 'out_run';
                js.outRunTimer = 2.1;

                // Evaluate Telemark Landing
                const goodAngle = Math.abs(js.pitchDeg - 12) <= 16;
                if (goodAngle || Ski.keySpace(g)) {
                    js.flightMeters = Math.round((js.flightMeters + 12) * 10) / 10;
                    js.landingGrade = `TELEMARK-LANDUNG! 🌟 ${js.flightMeters.toFixed(1)} METER!`;
                    window.soundManager.playPowerUp();
                    g.addFloatingText(js.landingGrade, Ski.sx(s.px), Ski.sy(s.py - 60), '#2ed573', 26);
                } else {
                    js.landingGrade = `WACKEL-LANDUNG: ${js.flightMeters.toFixed(1)} METER`;
                    window.soundManager.playHit();
                    g.addFloatingText(js.landingGrade, Ski.sx(s.px), Ski.sy(s.py - 60), '#ffa502', 22);
                }

                js.bestMeters = Math.max(js.bestMeters, js.flightMeters);
                js.totalMeters = Math.round((js.totalMeters + js.flightMeters) * 10) / 10;
            }
        } else if (js.phase === 'out_run') {
            // PHASE 3: Out-Run in the Valley Stadium
            js.outRunTimer -= dt;
            s.px = Math.min(SKI_VW - 180, s.px + 260 * dt);
            s.py = 555;

            if (js.outRunTimer <= 0) {
                // Did we beat the Single Jump K-Point OR Cumulative Distance Target?
                if (js.bestMeters >= js.targetSingleMeters || js.totalMeters >= js.targetTotalMeters) {
                    window.soundManager.playWaveClear();
                    g.triggerLevelWin();
                    return;
                }
                // Otherwise launch next jump attempt from the top-left tower!
                js.attempt++;
                g.showMemePopup(`🚡 NÄCHSTER SPRUNG (${js.attempt}. VERSUCH) — BESTWEITE: ${js.bestMeters.toFixed(0)}m!`);
                Ski.setupSkiJumpAttempt(g);
            }
        }

        // Update Top Progress Bar
        const bestPct = Math.min(100, Math.floor((Math.max(js.bestMeters, js.flightMeters) / js.targetSingleMeters) * 100));
        const totalPct = Math.min(100, Math.floor((js.totalMeters / js.targetTotalMeters) * 100));
        const pct = Math.max(bestPct, totalPct);
        g.ui.progBar.style.width = `${pct}%`;
        const liveM = js.phase === 'flight' ? js.flightMeters.toFixed(0) : js.bestMeters.toFixed(0);
        g.ui.progValText.textContent = `WEITE: ${liveM}m / ${js.targetSingleMeters}m`;
    },

    // =====================================================================
    // MODE 4: ACTIVE SKI LIFT (`ski_lift`) — FIGHTING UP MOVING CABLEWAY
    // =====================================================================
    cableYAtScreenX(screenX) {
        // Ascending steel cable runs from bottom-left (x=0, y=575) up to top-right (x=1280, y=215)
        return 575 - (screenX / SKI_VW) * 360;
    },

    setupSkiLift(g) {
        const s = g.ski;
        const ls = s.liftState;
        ls.chairs = [];
        ls.returnChairs = [];
        ls.pylons = [];
        ls.icicles = [];

        // Spawn ascending chairs & gondolas along the cable
        for (let x = 80; x <= SKI_VW + 360; x += 225) {
            const idx = ls.chairs.length;
            ls.chairs.push({
                x,
                kind: idx % 3 === 1 ? 'gondola' : 'chair',
                w: idx % 3 === 1 ? 116 : 98,
                swing: 0,
                icy: idx % 4 === 3,
                hasItem: idx % 2 === 1 ? (idx % 4 === 1 ? 'frisbee_gold' : 'coffee') : null
            });
        }

        // Spawn descending return chairs on the upper cable carrying Herr Adam / GIBB students
        for (let x = 350; x <= SKI_VW + 500; x += 380) {
            ls.returnChairs.push({
                x,
                enemy: Math.random() < 0.75 ? (Math.random() < 0.45 ? 'adam' : 'student') : null,
                throwTimer: 1.4 + Math.random() * 1.5
            });
        }

        // Steel Lift Pylons
        for (let d = 550; d <= ls.goalDist; d += 850) {
            ls.pylons.push({
                dist: d,
                num: ls.pylons.length + 1,
                passed: false
            });
        }

        // Start Thenerean standing on the second ascending chair
        const startChair = ls.chairs[1] || ls.chairs[0];
        s.px = startChair.x;
        s.py = Ski.cableYAtScreenX(s.px) + 58;
        s.vy = 0;
        ls.onChair = startChair;
    },

    updateSkiLift(g, dt) {
        const s = g.ski;
        const ls = s.liftState;
        const p = g.player;

        // Alpine wind gusts
        ls.windGustTimer -= dt;
        if (ls.windGustTimer <= 0) {
            ls.windGustTimer = 4.2 + Math.random() * 2.5;
            ls.windForce = (Math.random() < 0.5 ? -1 : 1) * (55 + Math.random() * 45);
        } else {
            ls.windForce *= Math.pow(0.4, dt);
        }

        // Advance progress up the active ski lift
        const climbSpeed = ls.cableSpeed * (s.boostTimer > 0 ? 1.45 : 1.0) + (Ski.keyRight(g) ? 95 : 0);
        ls.progress += climbSpeed * dt;
        s.dist = ls.progress;

        // Move ascending chairs slowly across screen so player jumps from chair to chair
        for (const ch of ls.chairs) {
            ch.x -= 48 * dt;
            ch.swing = Math.sin(s.clock * 3.2 + ch.x * 0.01) * 6;
            if (ch.x < -140) {
                ch.x += (ls.chairs.length) * 225;
                ch.hasItem = Math.random() < 0.55 ? (Math.random() < 0.5 ? 'frisbee_gold' : 'energy') : null;
            }
        }

        // Move descending return chairs (top-right to bottom-left)
        for (const rc of ls.returnChairs) {
            rc.x -= 210 * dt;
            const rcy = Ski.cableYAtScreenX(rc.x) - 68;
            if (rc.enemy) {
                rc.throwTimer -= dt;
                if (rc.throwTimer <= 0 && rc.x > 120 && rc.x < SKI_VW - 80) {
                    rc.throwTimer = 1.9 + Math.random() * 1.2;
                    const dx = s.px - rc.x;
                    const dy = s.py - rcy;
                    const len = Math.max(1, Math.hypot(dx, dy));
                    s.projectiles.push({
                        x: rc.x,
                        y: rcy + 25,
                        vx: (dx / len) * 290,
                        vy: (dy / len) * 290,
                        kind: rc.enemy === 'adam' ? 'frisbee' : 'snowball',
                        life: 2.8
                    });
                }
            }
            if (rc.x < -160) {
                rc.x = SKI_VW + 220 + Math.random() * 180;
                rc.enemy = Math.random() < 0.78 ? (Math.random() < 0.5 ? 'adam' : 'student') : null;
                rc.throwTimer = 1.2;
            }
        }

        // Player horizontal movement & jumping across moving chairs/gondolas/cable
        const moveDir = (Ski.keyRight(g) ? 1 : 0) - (Ski.keyLeft(g) ? 1 : 0);
        const targetVX = moveDir * 330 + ls.windForce * 0.35;
        s.vx += (targetVX - s.vx) * Math.min(1, dt * 8.5);

        if (Ski.keyDash(g) && p.dashCooldown <= 0) {
            p.dashCooldown = p.dashMaxCooldown || 95;
            s.vx = (moveDir !== 0 ? moveDir : 1) * 560;
            s.vy = Math.min(s.vy, -120);
            p.invulnerableTime = Math.max(p.invulnerableTime, 30);
            window.soundManager.playJump();
            g.addFloatingText('💨 SEILBAHN-DASH!', Ski.sx(s.px), Ski.sy(s.py - 45), '#00d2d3', 20);
        }

        s.px = Math.max(110, Math.min(SKI_VW - 130, s.px + s.vx * dt));

        // Jump from chair / cable (with Double-Jump!)
        const jumpKey = Ski.keyUp(g) || Ski.keySpace(g);
        if (jumpKey && !s._jumpHeld) {
            if (ls.onChair || ls.onCable) {
                s.vy = -490;
                ls.onChair = null;
                ls.onCable = false;
                s.doubleJumpReady = true;
                window.soundManager.playJump();
            } else if (s.doubleJumpReady) {
                s.vy = -440;
                s.doubleJumpReady = false;
                window.soundManager.playJump();
                g.addFloatingText('⚡ DOPPELSPRUNG!', Ski.sx(s.px), Ski.sy(s.py - 40), '#ffd32a', 19);
            }
        }
        s._jumpHeld = jumpKey;

        // Vertical gravity & landing on chairs, gondola roofs, or grinding the steel cable!
        s.vy += 940 * dt;
        const prevY = s.py;
        s.py += s.vy * dt;

        ls.onChair = null;
        ls.onCable = false;

        if (s.vy >= 0) {
            // 1. Check landing on ascending Chairs / Gondolas
            for (const ch of ls.chairs) {
                const cableY = Ski.cableYAtScreenX(ch.x);
                const platformY = ch.kind === 'gondola' ? (cableY + 34) : (cableY + 62);
                if (Math.abs(s.px - ch.x) <= ch.w * 0.54 && prevY <= platformY + 14 && s.py >= platformY - 8) {
                    s.py = platformY;
                    if (ch.kind === 'gondola' && (Ski.keyUp(g) || Ski.keySpace(g))) {
                        s.vy = -590;
                        s.doubleJumpReady = true;
                        window.soundManager.playJump();
                        g.addFloatingText('🚡 GONDEL-TRAMPOLIN!', Ski.sx(s.px), Ski.sy(s.py - 50), '#ffd32a', 22);
                    } else {
                        s.vy = 0;
                        ls.onChair = ch;
                        s.doubleJumpReady = true;
                    }
                    if (ch.hasItem) {
                        Ski.collectItem(g, { kind: ch.hasItem });
                        ch.hasItem = null;
                    }
                    break;
                }
            }

            // 2. Check landing on the steel Haul Cable itself (Cable Grind!)
            if (!ls.onChair && !Ski.keyDown(g)) {
                const cableY = Ski.cableYAtScreenX(s.px);
                if (prevY <= cableY + 10 && s.py >= cableY - 8) {
                    s.py = cableY;
                    s.vy = 0;
                    ls.onCable = true;
                    s.doubleJumpReady = true;
                    if (Math.random() < 0.65) {
                        s.spray.push({
                            x: s.px - 12,
                            y: cableY,
                            vx: -120 - Math.random() * 80,
                            vy: -40 - Math.random() * 60,
                            r: 2.5 + Math.random() * 2.5,
                            color: '#ffd32a',
                            life: 0.25
                        });
                    }
                }
            }
        }

        // Safety net bounce if falling below the lift ravine
        if (s.py > SKI_VH - 35) {
            s.py = Ski.cableYAtScreenX(s.px) - 20;
            s.vy = -380;
            s.doubleJumpReady = true;
            if (p.invulnerableTime <= 0) {
                Ski.hurtPlayer(g, 16, '🕸️ FANGNETZ-RETTUNG!');
            }
        }

        // Update Pylons & drop icicles
        for (const py of ls.pylons) {
            const px = s.px + (py.dist - ls.progress) * 0.85;
            py.screenX = px;
            if (!py.passed && px < s.px) {
                py.passed = true;
                p.megaEnergy = Math.min(p.maxMegaEnergy || 100, (p.megaEnergy || 0) + 12);
                g.addFloatingText(`✔ LIFTMAST ${py.num} PASSIERT!`, Ski.sx(s.px), Ski.sy(s.py - 55), '#2ed573', 20);
            }
            // Spawn falling icicle ahead of pylon
            if (px > 260 && px < SKI_VW - 120 && Math.abs(px - s.px) < 280 && !py.icicleDropped) {
                py.icicleDropped = true;
                ls.icicles.push({
                    x: px - 30,
                    y: Ski.cableYAtScreenX(px) - 85,
                    vy: 240
                });
            }
        }

        // Update falling icicles
        for (let i = ls.icicles.length - 1; i >= 0; i--) {
            const ic = ls.icicles[i];
            ic.y += ic.vy * dt;
            ic.vy += 320 * dt;
            if (ic.y > SKI_VH + 40) {
                ls.icicles.splice(i, 1);
                continue;
            }
            if (Math.hypot(ic.x - s.px, ic.y - (s.py - 28)) < 38) {
                ls.icicles.splice(i, 1);
                if (p.invulnerableTime <= 0 && s.boostTimer <= 0) {
                    Ski.hurtPlayer(g, 15, '🧊 EISZAPFEN!');
                }
            }
        }

        // Update enemy projectiles on the lift
        for (let i = s.projectiles.length - 1; i >= 0; i--) {
            const pr = s.projectiles[i];
            pr.x += pr.vx * dt;
            pr.y += pr.vy * dt;
            pr.life -= dt;
            if (pr.life <= 0 || pr.x < -80 || pr.x > SKI_VW + 80 || pr.y > SKI_VH + 80) {
                s.projectiles.splice(i, 1);
                continue;
            }
            if (Math.hypot(pr.x - s.px, pr.y - (s.py - 30)) < 38) {
                s.projectiles.splice(i, 1);
                if (p.invulnerableTime <= 0 && s.boostTimer <= 0) {
                    Ski.hurtPlayer(g, 14, pr.kind === 'frisbee' ? '🥏 LIFT-FRISBEE!' : '❄️ SCHNEEBALL!');
                }
            }
        }

        // Law books hit enemies on descending chairs
        for (let bi = s.books.length - 1; bi >= 0; bi--) {
            const b = s.books[bi];
            for (const rc of ls.returnChairs) {
                if (!rc.enemy) continue;
                const rcy = Ski.cableYAtScreenX(rc.x) - 42;
                if (Math.hypot(b.x - rc.x, b.y - rcy) < 54) {
                    rc.enemy = null;
                    s.books.splice(bi, 1);
                    ls.progress += 140;
                    p.megaEnergy = Math.min(p.maxMegaEnergy || 100, (p.megaEnergy || 0) + 18);
                    window.soundManager.playHit();
                    g.addFloatingText('💥 GEGNER VOM SESSEL GEFEGT! +SCHUB', Ski.sx(rc.x), Ski.sy(rcy - 25), '#ffd32a', 21);
                    break;
                }
            }
        }

        const pct = Math.min(100, Math.floor((ls.progress / ls.goalDist) * 100));
        g.ui.progBar.style.width = `${pct}%`;
        g.ui.progValText.textContent = `GIPFELBAHN: ${pct}%`;

        if (ls.progress >= ls.goalDist) {
            window.soundManager.playWaveClear();
            g.triggerLevelWin();
        }
    },

    // =====================================================================
    // SHARED HELPERS (DAMAGE & COLLECTIBLES)
    // =====================================================================
    hurtPlayer(g, dmg, label) {
        const p = g.player;
        const diff = g.getActiveDifficulty ? g.getActiveDifficulty() : { dmgMult: 1 };
        const scaled = Math.max(6, Math.round(dmg * (diff.dmgMult || 1)));
        p.hp = Math.max(0, p.hp - scaled);
        p.invulnerableTime = 55;
        g.screenShake = 11;
        g.comboCount = 0;
        window.soundManager.playHit();
        g.addFloatingText(`${label} -${scaled} HP`, Ski.sx(g.ski.px), Ski.sy(g.ski.py - 55), '#ff4757', 22);
        if (p.hp <= 0) {
            g.triggerGameOver();
        }
    },

    collectItem(g, col) {
        const s = g.ski;
        const p = g.player;
        window.soundManager.playCollect();
        if (col.kind === 'frisbee_gold') {
            s.boostTimer = Math.max(s.boostTimer, 2.2);
            p.megaEnergy = Math.min(p.maxMegaEnergy || 100, (p.megaEnergy || 0) + 22);
            g.addFloatingText('🥏 GOLD-FRISBEE! +TURBO', Ski.sx(s.px), Ski.sy(s.py - 55), '#ffd32a', 21);
        } else if (col.kind === 'coffee') {
            p.hp = Math.min(p.maxHp || 150, p.hp + 26);
            g.addFloatingText('☕ GIPFEL-KAFFEE! +26 HP', Ski.sx(s.px), Ski.sy(s.py - 55), '#2ed573', 20);
        } else if (col.kind === 'energy') {
            s.boostTimer = Math.max(s.boostTimer, 1.6);
            p.megaEnergy = Math.min(p.maxMegaEnergy || 100, (p.megaEnergy || 0) + 34);
            g.addFloatingText('⚡ ENERGY-BOOST! +MEGA', Ski.sx(s.px), Ski.sy(s.py - 55), '#00d2d3', 20);
        } else {
            if (g.saveData) g.saveData.coins = (g.saveData.coins || 0) + 12;
            g.addFloatingText('🪙 +12 CHF SKILAGER-BONUS', Ski.sx(s.px), Ski.sy(s.py - 55), '#ffd32a', 19);
        }
    },

    // =====================================================================
    // RENDERING DISPATCHER & CEL-SHADED GRAPHICS
    // =====================================================================
    render() {
        const g = this;
        const s = g.ski;
        if (!s) return;

        ctx.save();
        ctx.scale(canvas.width / SKI_VW, canvas.height / SKI_VH);

        if (s.subMode === 'ski_jump') {
            Ski.renderSkiJump(g);
        } else if (s.subMode === 'ski_lift') {
            Ski.renderSkiLift(g);
        } else if (s.subMode === 'slalom') {
            Ski.renderSlalom(g);
        } else {
            Ski.renderDownhill(g);
        }

        // Common HUD overlay (Speedometer, Stopwatch, Mode-specific telemetry)
        Ski.renderSkiHUD(g);

        ctx.restore();
    },

    drawAlpineBackdrop(g, scrollFactor = 0.08) {
        const s = g.ski;
        const bg = images.bg_ski_alps;
        if (bg && bg.complete && bg.naturalWidth > 0) {
            const shift = ((s.dist * scrollFactor) % 240);
            ctx.drawImage(bg, -shift * 0.4, -10, SKI_VW + 120, SKI_VH + 20);
        } else {
            const sky = ctx.createLinearGradient(0, 0, 0, SKI_VH);
            sky.addColorStop(0, '#0c4a6e');
            sky.addColorStop(0.55, '#38bdf8');
            sky.addColorStop(1, '#e0f2fe');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, SKI_VW, SKI_VH);
        }
    },

    // ---------------------------------------------------------------------
    // RENDER 1: DOWNHILL (LEFT PEAK TO RIGHT VALLEY)
    // ---------------------------------------------------------------------
    renderDownhill(g) {
        const s = g.ski;
        Ski.drawAlpineBackdrop(g, 0.06);

        // Soft atmospheric mist over distant mountains
        const mist = ctx.createLinearGradient(0, 0, 0, SKI_VH);
        mist.addColorStop(0, 'rgba(12, 28, 58, 0.14)');
        mist.addColorStop(0.55, 'rgba(255, 255, 255, 0.08)');
        mist.addColorStop(1, 'rgba(186, 230, 253, 0.25)');
        ctx.fillStyle = mist;
        ctx.fillRect(0, 0, SKI_VW, SKI_VH);

        // Distant mountain ridge silhouette
        ctx.fillStyle = 'rgba(219, 234, 254, 0.72)';
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 240);
        for (let x = 0; x <= SKI_VW; x += 80) {
            const py = 185 + (x / SKI_VW) * 165 + Math.sin((x + s.dist * 0.18) * 0.008) * 32;
            ctx.lineTo(x, py);
        }
        ctx.lineTo(SKI_VW, SKI_VH);
        ctx.lineTo(0, SKI_VH);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Main Left-to-Right Alpine Snow Slope (High on Left -> Low Valley on Right)
        const snowGrad = ctx.createLinearGradient(0, 200, 0, SKI_VH);
        snowGrad.addColorStop(0, '#ffffff');
        snowGrad.addColorStop(0.35, '#f0f9ff');
        snowGrad.addColorStop(0.75, '#dbeafe');
        snowGrad.addColorStop(1, '#93c5fd');
        ctx.fillStyle = snowGrad;
        ctx.beginPath();
        ctx.moveTo(0, Ski.slopeSurfaceY(0, s.dist));
        for (let x = 0; x <= SKI_VW; x += 24) {
            ctx.lineTo(x, Ski.slopeSurfaceY(x, s.dist));
        }
        ctx.lineTo(SKI_VW, SKI_VH);
        ctx.lineTo(0, SKI_VH);
        ctx.closePath();
        ctx.fill();

        // Bold cel-shaded slope surface line & icy blue sub-layer
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 8;
        ctx.beginPath();
        for (let x = 0; x <= SKI_VW; x += 24) {
            const y = Ski.slopeSurfaceY(x, s.dist) + 5;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (let x = 0; x <= SKI_VW; x += 24) {
            const y = Ski.slopeSurfaceY(x, s.dist);
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Background piste scenery (Chalets, Swiss flags, Pylons)
        for (const sc of s.scenery) {
            const sx = s.px + (sc.dist - s.dist);
            if (sx < -200 || sx > SKI_VW + 200) continue;
            const sy = Ski.slopeSurfaceY(sx, s.dist);
            Ski.drawSceneryProp(sx, sy, sc.kind, sc.scale);
        }

        // Valley Finish Arch when approaching end of course
        const finishX = s.px + (s.length - s.dist);
        if (finishX > -120 && finishX < SKI_VW + 220) {
            Ski.drawValleyFinishArch(finishX, Ski.slopeSurfaceY(finishX, s.dist));
        }

        // Obstacles on the slope
        for (const o of s.obstacles) {
            if (o.smashed) continue;
            const ox = s.px + (o.dist - s.dist);
            if (ox < -120 || ox > SKI_VW + 120) continue;
            const oy = Ski.slopeSurfaceY(ox, s.dist);
            Ski.drawDownhillObstacle(ox, oy, o, s.clock);
        }

        // Collectibles
        for (const col of s.collectibles) {
            if (col.taken) continue;
            const cx = s.px + (col.dist - s.dist);
            if (cx < -80 || cx > SKI_VW + 80) continue;
            const cy = Ski.slopeSurfaceY(cx, s.dist) - (col.hoverH || 34) + Math.sin(s.clock * 4 + col.dist) * 6;
            Ski.drawCollectibleIcon(cx, cy, col.kind, s.clock);
        }

        // Rival Herr Adam on the slope
        if (s.rival) {
            const rx = s.rival.x;
            const ry = s.rival.y;
            if (rx > -100 && rx < SKI_VW + 100) {
                Ski.drawSkierCharacter('adam', rx, ry, 0.22, false, s.rival.stunTimer > 0, s.clock);
            }
        }

        // Thenerean on his glowing yellow Frisbee-Board!
        const slopeAngle = 0.21;
        Ski.drawSkierCharacter('thenerean', s.px, s.py, slopeAngle + s.stuntSpin, s.crouching, s.boostTimer > 0, s.clock, s.airZ);

        // Projectiles & Thrown Law Books
        Ski.drawProjectilesAndBooks(s);

        // Roaring Snow Avalanche from the Left Peak!
        if (s.avalanche) {
            const avX = s.px + (s.avalanche.dist - s.dist);
            Ski.drawAvalancheWall(avX, s.dist, s.clock);
        }

        // Snow spray & falling snow
        Ski.drawSnowAndSpray(s);
    },

    // ---------------------------------------------------------------------
    // RENDER 2: SLALOM (TOP TO BOTTOM LIVE AGAINST HERR ADAM)
    // ---------------------------------------------------------------------
    renderSlalom(g) {
        const s = g.ski;
        Ski.drawAlpineBackdrop(g, 0.03);

        // Steep vertical race piste perspective (Top-to-Bottom)
        const pisteGrad = ctx.createLinearGradient(0, 0, 0, SKI_VH);
        pisteGrad.addColorStop(0, '#dbeafe');
        pisteGrad.addColorStop(0.35, '#f0f9ff');
        pisteGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = pisteGrad;
        ctx.beginPath();
        ctx.moveTo(185, 0);
        ctx.lineTo(SKI_VW - 185, 0);
        ctx.lineTo(SKI_VW - 90, SKI_VH);
        ctx.lineTo(90, SKI_VH);
        ctx.closePath();
        ctx.fill();

        // Groomed snow corduroy lines scrolling upward as skiers race downward
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.45)';
        ctx.lineWidth = 2;
        const stripeOffset = (s.dist * 0.65) % 56;
        for (let y = -stripeOffset; y < SKI_VH; y += 56) {
            const inset = 185 - (y / SKI_VH) * 95;
            ctx.beginPath();
            ctx.moveTo(inset + 20, y);
            ctx.lineTo(SKI_VW - inset - 20, y);
            ctx.stroke();
        }

        // Red & Blue Safety B-Nets and Pine Trees along Left & Right piste borders
        for (let y = -((s.dist * 0.65) % 90); y < SKI_VH + 90; y += 90) {
            const t = Math.max(0, y / SKI_VH);
            const leftEdge = 185 - t * 95;
            const rightEdge = SKI_VW - leftEdge;
            const isRed = Math.floor((y + s.dist * 0.65) / 90) % 2 === 0;

            // Left & right safety net posts
            ctx.fillStyle = isRed ? '#ef4444' : '#2563eb';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.fillRect(leftEdge - 14, y - 28, 12, 34);
            ctx.strokeRect(leftEdge - 14, y - 28, 12, 34);
            ctx.fillRect(rightEdge + 2, y - 28, 12, 34);
            ctx.strokeRect(rightEdge + 2, y - 28, 12, 34);

            // Outer pine trees
            Ski.drawPineTree(leftEdge - 65, y + 10, 0.78);
            Ski.drawPineTree(rightEdge + 65, y + 10, 0.78);
        }

        // Carved ski tracks trailing ABOVE Thenerean (showing top-to-bottom descent!)
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.38)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i < s.tracks.length; i++) {
            const tr = s.tracks[i];
            const ty = s.py - (s.dist - tr.dist) * 0.65;
            if (ty < -20 || ty > s.py) continue;
            if (i === 0) ctx.moveTo(tr.x - 12, ty);
            else ctx.lineTo(tr.x - 12, ty);
        }
        ctx.stroke();

        // Slalom Finish Banner at the bottom when reaching target distance
        const finishY = s.py + (s.length - s.dist) * 0.65;
        if (finishY > -80 && finishY < SKI_VH + 100) {
            ctx.save();
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(210, finishY - 85, 14, 90);
            ctx.fillRect(SKI_VW - 224, finishY - 85, 14, 90);
            ctx.fillStyle = '#ffd32a';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3.5;
            ctx.fillRect(210, finishY - 85, SKI_VW - 420, 34);
            ctx.strokeRect(210, finishY - 85, SKI_VW - 420, 34);
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 18px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏁 SLALOM-ZIEL IM TAL • GIBB SKIRENNEN 🏁', SKI_VW * 0.5, finishY - 62);
            ctx.restore();
        }

        // Draw Articulated Red & Blue Slalom Gates
        for (const gate of s.gates) {
            const gy = s.py + (gate.dist - s.dist) * 0.65;
            if (gy < -90 || gy > SKI_VH + 90) continue;
            Ski.drawSlalomGate(gate, gy, s.clock);
        }

        // Collectibles on piste
        for (const col of s.collectibles) {
            if (col.taken) continue;
            const cy = s.py + (col.dist - s.dist) * 0.65;
            if (cy < -60 || cy > SKI_VH + 60) continue;
            Ski.drawCollectibleIcon(col.x, cy, col.kind, s.clock);
        }

        // Live Rival Herr Adam racing top-to-bottom alongside Thenerean!
        if (s.rival) {
            const ry = Math.max(95, Math.min(SKI_VH - 95, s.rival.y));
            Ski.drawSkierCharacter('adam', s.rival.x, ry, 0, false, s.rival.stunTimer > 0, s.clock, 0, true);
        }

        // Thenerean racing top-to-bottom on his yellow Frisbee-Board!
        Ski.drawSkierCharacter('thenerean', s.px, s.py - s.airZ, s.carving * 0.16, false, s.boostTimer > 0, s.clock, s.airZ, true);

        Ski.drawProjectilesAndBooks(s);
        Ski.drawSnowAndSpray(s);
    },

    // ---------------------------------------------------------------------
    // RENDER 3: GIANT SKI JUMP (`ski_jump` — LEFT PEAK TOWER TO RIGHT VALLEY)
    // ---------------------------------------------------------------------
    renderSkiJump(g) {
        const s = g.ski;
        const js = s.jumpState;
        Ski.drawAlpineBackdrop(g, 0.04);

        // Draw either In-Run Giant Ramp (Left) or Panoramic Flight into the Valley (Left-to-Right)
        if (js.phase === 'inrun') {
            // Monumental Olympic Ski Jump Tower on the Left descending Rightward
            ctx.save();
            // Wooden/Steel Tower truss under the ramp
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.fillRect(65, 110, 56, 420);
            ctx.strokeRect(65, 110, 56, 420);

            // Start house at the top-left peak
            ctx.fillStyle = '#78350f';
            ctx.fillRect(48, 74, 92, 48);
            ctx.strokeRect(48, 74, 92, 48);
            ctx.fillStyle = '#ffd32a';
            ctx.font = '900 11px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GIBB SCHANZE', 94, 102);

            // Ramp curve from (95, 125) down to Takeoff Table (490, 390)
            ctx.fillStyle = '#e0f2fe';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(85, 125);
            ctx.quadraticCurveTo(280, 350, 495, 385);
            ctx.lineTo(495, 425);
            ctx.quadraticCurveTo(270, 390, 85, 165);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Green/Gold Takeoff Table Zone (Schanzentisch)
            ctx.fillStyle = '#2ed573';
            ctx.fillRect(425, 374, 70, 14);
            ctx.strokeRect(425, 374, 70, 14);
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 12px "Montserrat", sans-serif';
            ctx.fillText('ABSPRUNG [LEERTASTE]!', 455, 362);

            // Deep Alpine Valley dropping away to the right
            ctx.fillStyle = '#dbeafe';
            ctx.beginPath();
            ctx.moveTo(495, 425);
            ctx.lineTo(SKI_VW, 620);
            ctx.lineTo(SKI_VW, SKI_VH);
            ctx.lineTo(0, SKI_VH);
            ctx.lineTo(0, 425);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Draw Thenerean crouching down the giant ramp (left-to-right)
            Ski.drawSkierCharacter('thenerean', s.px, s.py, 0.35, s.crouching, true, s.clock);

            // Prominent Takeoff Timing Bar (placed clearly below top banners)
            const t = Math.min(1, js.inrunPos / js.inrunLength);
            const barX = SKI_VW * 0.5 - 210;
            const barY = 205;
            ctx.save();
            ctx.fillStyle = 'rgba(11, 14, 24, 0.92)';
            ctx.strokeStyle = '#ffd32a';
            ctx.lineWidth = 3;
            ctx.fillRect(barX, barY, 420, 34);
            ctx.strokeRect(barX, barY, 420, 34);
            // Ideal green zone (0.86 .. 0.97)
            ctx.fillStyle = 'rgba(46, 213, 115, 0.85)';
            ctx.fillRect(barX + 420 * 0.84, barY + 3, 420 * 0.13, 28);
            // Marker
            ctx.fillStyle = '#ffd32a';
            ctx.fillRect(barX + 420 * t - 4, barY - 5, 8, 44);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 12px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ANLAUF-TIMING: DRÜCKE [LEERTASTE / W] IM GRÜNEN BEREICH!', SKI_VW * 0.5, barY - 10);
            ctx.restore();
        } else {
            // Flight & Valley Landing Panorama (Left-to-Right into the Valley)
            const progressNorm = Math.min(1, js.flightMeters / 240);
            const slopeLeftY = 355;
            const slopeRightY = 610;

            // Valley Landing Slope descending from Left to Right
            const snowGrad = ctx.createLinearGradient(0, slopeLeftY, 0, SKI_VH);
            snowGrad.addColorStop(0, '#ffffff');
            snowGrad.addColorStop(0.5, '#e0f2fe');
            snowGrad.addColorStop(1, '#93c5fd');
            ctx.fillStyle = snowGrad;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(0, slopeLeftY);
            ctx.lineTo(SKI_VW, slopeRightY);
            ctx.lineTo(SKI_VW, SKI_VH);
            ctx.lineTo(0, SKI_VH);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Distance markers along the valley landing slope (60m .. 240m, plus Red K-Point & Gold Hill Size!)
            for (let m = 40; m <= 260; m += 20) {
                const mx = s.px + (m - js.flightMeters) * 14;
                if (mx < -60 || mx > SKI_VW + 60) continue;
                const my = slopeLeftY + (mx / SKI_VW) * (slopeRightY - slopeLeftY);
                const isK = m === js.kPointMeters || Math.abs(m - js.targetSingleMeters) < 10;
                ctx.save();
                ctx.fillStyle = isK ? '#ef4444' : '#1e3a8a';
                ctx.fillRect(mx - 2, my - 34, 4, 34);
                ctx.fillStyle = isK ? '#ef4444' : '#0f172a';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.fillRect(mx - 28, my - 56, 56, 22);
                ctx.strokeRect(mx - 28, my - 56, 56, 22);
                ctx.fillStyle = isK ? '#ffd32a' : '#ffffff';
                ctx.font = '900 11px "Montserrat", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(isK ? `K-${m}m` : `${m}m`, mx, my - 41);
                ctx.restore();
            }

            // Thermal Updraft Rings & Frisbee-Boosts in the valley air
            for (const ring of js.rings) {
                if (ring.taken) continue;
                const rx = s.px + (ring.meters - js.flightMeters) * 14;
                if (rx < -80 || rx > SKI_VW + 80) continue;
                const valleyY = slopeLeftY + (rx / SKI_VW) * (slopeRightY - slopeLeftY);
                const ry = valleyY - ring.alt * 1.15;

                ctx.save();
                ctx.strokeStyle = ring.kind === 'frisbee_boost' ? '#ffd32a' : '#00d2d3';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.ellipse(rx, ry, 20, 38, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = ring.kind === 'frisbee_boost' ? 'rgba(255, 211, 42, 0.22)' : 'rgba(0, 210, 211, 0.20)';
                ctx.fill();
                ctx.restore();
            }

            // Mid-air Frisbee Hazards
            for (const hz of js.airHazards) {
                if (hz.hit) continue;
                const hx = s.px + (hz.meters - js.flightMeters) * 14;
                if (hx < -60 || hx > SKI_VW + 60) continue;
                const valleyY = slopeLeftY + (hx / SKI_VW) * (slopeRightY - slopeLeftY);
                const curAlt = hz.alt + Math.sin(s.clock * 3.5 + hz.phase) * 22;
                const hy = valleyY - curAlt * 1.15;
                Ski.drawCollectibleIcon(hx, hy, 'hazard_frisbee', s.clock);
            }

            // Draw Thenerean soaring in V-style flight posture (or landing in the valley)
            const rad = (-js.pitchDeg * Math.PI) / 180;
            Ski.drawSkierCharacter('thenerean', s.px, s.py, rad, false, true, s.clock, js.altY);

            // Aerodynamic Flight Pitch Gauge (Left of player during flight)
            if (js.phase === 'flight') {
                const gx = 96;
                const gy = 260;
                ctx.save();
                ctx.fillStyle = 'rgba(11, 14, 24, 0.90)';
                ctx.strokeStyle = '#00d2d3';
                ctx.lineWidth = 2.5;
                ctx.fillRect(gx - 38, gy - 90, 76, 180);
                ctx.strokeRect(gx - 38, gy - 90, 76, 180);
                // Ideal green pitch window
                ctx.fillStyle = 'rgba(46, 213, 115, 0.45)';
                ctx.fillRect(gx - 32, gy - 32, 64, 52);
                // Current pitch needle
                const needleY = gy - (js.pitchDeg - 14) * 3.0;
                ctx.fillStyle = '#ffd32a';
                ctx.fillRect(gx - 34, Math.max(gy - 82, Math.min(gy + 82, needleY)) - 4, 68, 8);
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 10px "Montserrat", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('FLUGWINKEL', gx, gy - 98);
                ctx.fillText('[W/S] HALTUNG', gx, gy + 106);
                ctx.restore();
            }
        }

        Ski.drawSnowAndSpray(s);
    },

    // ---------------------------------------------------------------------
    // RENDER 4: ACTIVE SKI LIFT (`ski_lift` — CLIMBING MOVING CABLEWAY)
    // ---------------------------------------------------------------------
    renderSkiLift(g) {
        const s = g.ski;
        const ls = s.liftState;
        Ski.drawAlpineBackdrop(g, 0.05);

        // Deep snow gorge below the ski lift with Safety Net
        ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
        ctx.fillRect(0, 0, SKI_VW, SKI_VH);

        // Safety Net at the bottom of the ravine
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.setLineDash([18, 12]);
        ctx.beginPath();
        ctx.moveTo(0, SKI_VH - 24);
        ctx.lineTo(SKI_VW, SKI_VH - 24);
        ctx.stroke();
        ctx.setLineDash([]);

        // Steel Lift Pylons (`Liftmasten`) along the slope
        for (const py of ls.pylons) {
            const px = py.screenX;
            if (px < -120 || px > SKI_VW + 120) continue;
            const cy = Ski.cableYAtScreenX(px);
            ctx.save();
            // Steel lattice tower
            ctx.fillStyle = '#64748b';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.fillRect(px - 16, cy - 95, 32, SKI_VH - (cy - 95));
            ctx.strokeRect(px - 16, cy - 95, 32, SKI_VH - (cy - 95));
            // Crossbar at top of pylon
            ctx.fillStyle = '#475569';
            ctx.fillRect(px - 58, cy - 88, 116, 18);
            ctx.strokeRect(px - 58, cy - 88, 116, 18);
            // Pylon number sign
            ctx.fillStyle = '#ffd32a';
            ctx.fillRect(px - 28, cy + 16, 56, 22);
            ctx.strokeRect(px - 28, cy + 16, 56, 22);
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 11px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`MAST ${py.num}`, px, cy + 31);
            ctx.restore();
        }

        // Upper Descending Return Cable & Ascending Main Haul Cable
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, Ski.cableYAtScreenX(0) - 68);
        ctx.lineTo(SKI_VW, Ski.cableYAtScreenX(SKI_VW) - 68);
        ctx.stroke();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.moveTo(0, Ski.cableYAtScreenX(0));
        ctx.lineTo(SKI_VW, Ski.cableYAtScreenX(SKI_VW));
        ctx.stroke();

        // Descending Return Chairs (carrying Herr Adam / GIBB students)
        for (const rc of ls.returnChairs) {
            if (rc.x < -120 || rc.x > SKI_VW + 120) continue;
            const rcy = Ski.cableYAtScreenX(rc.x) - 68;
            ctx.save();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(rc.x, rcy);
            ctx.lineTo(rc.x, rcy + 36);
            ctx.stroke();
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#0f172a';
            ctx.fillRect(rc.x - 28, rcy + 36, 56, 10);
            ctx.strokeRect(rc.x - 28, rcy + 36, 56, 10);

            if (rc.enemy) {
                const img = rc.enemy === 'adam' ? images.adam_throw : images.gibb_student_attack;
                if (img && img.complete) {
                    ctx.drawImage(img, rc.x - 28, rcy - 22, 56, 64);
                }
            }
            ctx.restore();
        }

        // Ascending Chairs & Red Alpine Gondolas (Platforms for Thenerean!)
        for (const ch of ls.chairs) {
            if (ch.x < -140 || ch.x > SKI_VW + 140) continue;
            const cy = Ski.cableYAtScreenX(ch.x);
            ctx.save();
            // Hanger arm from cable
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(ch.x, cy);
            ctx.lineTo(ch.x + ch.swing, cy + 56);
            ctx.stroke();
            // Cable grip wheel
            ctx.fillStyle = '#ffd32a';
            ctx.beginPath();
            ctx.arc(ch.x, cy, 6, 0, Math.PI * 2);
            ctx.fill();

            if (ch.kind === 'gondola') {
                // Red Swiss Panorama Gondola (bouncy roof at cy + 34!)
                const gx = ch.x - ch.w * 0.5 + ch.swing;
                const gy = cy + 34;
                ctx.fillStyle = '#dc2626';
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 3.5;
                ctx.fillRect(gx, gy, ch.w, 68);
                ctx.strokeRect(gx, gy, ch.w, 68);
                // Bouncy yellow roof pad
                ctx.fillStyle = '#ffd32a';
                ctx.fillRect(gx - 4, gy - 6, ch.w + 8, 8);
                ctx.strokeRect(gx - 4, gy - 6, ch.w + 8, 8);
                // Windows
                ctx.fillStyle = '#bae6fd';
                ctx.fillRect(gx + 12, gy + 14, ch.w - 24, 26);
                ctx.strokeRect(gx + 12, gy + 14, ch.w - 24, 26);
            } else {
                // 4-seater Alpine Chairlift Seat (platform at cy + 62)
                const cx = ch.x - ch.w * 0.5 + ch.swing;
                const sy = cy + 56;
                // Blue weather bubble canopy
                ctx.fillStyle = ch.icy ? 'rgba(125, 211, 252, 0.78)' : 'rgba(37, 99, 235, 0.72)';
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 3;
                ctx.fillRect(cx + 4, sy - 18, ch.w - 8, 20);
                ctx.strokeRect(cx + 4, sy - 18, ch.w - 8, 20);
                // Seat bench
                ctx.fillStyle = ch.icy ? '#38bdf8' : '#1e293b';
                ctx.fillRect(cx, sy, ch.w, 12);
                ctx.strokeRect(cx, sy, ch.w, 12);
            }

            if (ch.hasItem) {
                const itemY = ch.kind === 'gondola' ? (cy + 10) : (cy + 34);
                Ski.drawCollectibleIcon(ch.x + ch.swing, itemY, ch.hasItem, s.clock);
            }
            ctx.restore();
        }

        // Falling Icicles
        for (const ic of ls.icicles) {
            ctx.save();
            ctx.fillStyle = '#7dd3fc';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(ic.x - 11, ic.y - 24);
            ctx.lineTo(ic.x + 11, ic.y - 24);
            ctx.lineTo(ic.x, ic.y + 22);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // Draw Thenerean fighting his way up the active ski lift!
        Ski.drawSkierCharacter('thenerean', s.px, s.py, -0.18, false, s.boostTimer > 0 || ls.onCable, s.clock);

        Ski.drawProjectilesAndBooks(s);
        Ski.drawSnowAndSpray(s);
    },

    // =====================================================================
    // DETAILED CEL-SHADED SPRITE & PROP HELPERS
    // =====================================================================
    drawSkierCharacter(who, x, y, tiltRad, crouching, boosting, clock, airZ = 0, isVerticalSlalom = false) {
        ctx.save();
        ctx.translate(x, y);

        // Ground shadow
        if (airZ > 0) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
            ctx.beginPath();
            ctx.ellipse(0, airZ, 34, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.rotate(tiltRad || 0);

        if (who === 'thenerean') {
            // Turbo aura when boosting
            if (boosting) {
                ctx.fillStyle = 'rgba(255, 211, 42, 0.32)';
                ctx.beginPath();
                ctx.ellipse(0, -34, 48, 54, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Glowing Yellow GIBB Frisbee-Snowboard under Thenerean's feet!
            const fg = ctx.createRadialGradient(-6, -3, 3, 0, 0, 44);
            fg.addColorStop(0, '#fef08a');
            fg.addColorStop(0.6, '#facc15');
            fg.addColorStop(1, '#ea580c');
            ctx.fillStyle = fg;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.ellipse(0, -4, isVerticalSlalom ? 34 : 46, isVerticalSlalom ? 14 : 13, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Inner frisbee ring
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, -4, isVerticalSlalom ? 22 : 30, 7, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Thenerean Sprite
            const sprKey = airZ > 25 ? 'thenerean_jump' : (crouching ? 'thenerean_duck' : 'thenerean_run');
            const img = images[sprKey] || images.thenerean_idle;
            const h = crouching ? 74 : 96;
            const w = 74;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -w * 0.5, -h - 4, w, h);
            }
        } else {
            // Herr Adam on Red/Gold Racing Skis!
            ctx.fillStyle = '#ef4444';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            if (isVerticalSlalom) {
                ctx.fillRect(-18, -14, 10, 34);
                ctx.strokeRect(-18, -14, 10, 34);
                ctx.fillRect(8, -14, 10, 34);
                ctx.strokeRect(8, -14, 10, 34);
            } else {
                ctx.fillRect(-44, -8, 88, 9);
                ctx.strokeRect(-44, -8, 88, 9);
            }

            const img = images.adam_run || images.adam_idle;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -36, -98, 72, 94);
            }
            // Name tag above Herr Adam
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.strokeStyle = '#ffa502';
            ctx.lineWidth = 2;
            ctx.fillRect(-46, -124, 92, 20);
            ctx.strokeRect(-46, -124, 92, 20);
            ctx.fillStyle = '#ffd32a';
            ctx.font = '900 10px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('HERR ADAM', 0, -110);
        }

        ctx.restore();
    },

    drawDownhillObstacle(x, y, o, clock) {
        ctx.save();
        if (o.type === 'pine') {
            Ski.drawPineTree(x, y, 1.0);
        } else if (o.type === 'rock') {
            ctx.fillStyle = '#64748b';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(x - 34, y + 4);
            ctx.lineTo(x - 22, y - 44);
            ctx.lineTo(x + 8, y - 52);
            ctx.lineTo(x + 34, y - 22);
            ctx.lineTo(x + 36, y + 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Snow cap
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(x - 22, y - 44);
            ctx.lineTo(x + 8, y - 52);
            ctx.lineTo(x + 22, y - 32);
            ctx.lineTo(x - 8, y - 28);
            ctx.closePath();
            ctx.fill();
        } else if (o.type === 'fence') {
            ctx.fillStyle = '#f97316';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.fillRect(x - 42, y - 44, 84, 38);
            ctx.strokeRect(x - 42, y - 44, 84, 38);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 11px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ACHTUNG PISTE', x, y - 21);
        } else if (o.type === 'snowman') {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y - 18, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y - 50, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Top hat
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(x - 14, y - 74, 28, 18);
        } else if (o.type === 'ramp') {
            // Blue/Gold Ski Kicker Ramp ascending left-to-right!
            const rg = ctx.createLinearGradient(x - 48, y, x + 48, y - 42);
            rg.addColorStop(0, '#38bdf8');
            rg.addColorStop(1, '#ffd32a');
            ctx.fillStyle = rg;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(x - 48, y + 6);
            ctx.lineTo(x + 48, y - 38);
            ctx.lineTo(x + 48, y + 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 11px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('BOOST ↗', x + 8, y - 4);
        } else if (o.type === 'ice') {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(x, y + 2, 56, 11, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    },

    drawPineTree(x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        // Trunk
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.fillRect(-7, -20, 14, 22);
        ctx.strokeRect(-7, -20, 14, 22);
        // 3 snow-topped green tiers
        const tiers = [
            { y: -18, w: 36, h: 34 },
            { y: -42, w: 28, h: 32 },
            { y: -64, w: 20, h: 28 }
        ];
        for (const t of tiers) {
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.moveTo(-t.w, t.y);
            ctx.lineTo(t.w, t.y);
            ctx.lineTo(0, t.y - t.h);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // White snow cap on branches
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(-t.w * 0.55, t.y - t.h * 0.45);
            ctx.lineTo(t.w * 0.55, t.y - t.h * 0.45);
            ctx.lineTo(0, t.y - t.h);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    },

    drawSceneryProp(x, y, kind, scale = 1) {
        ctx.save();
        ctx.translate(x, y - 8);
        ctx.scale(scale, scale);
        if (kind === 'chalet') {
            ctx.fillStyle = '#92400e';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.fillRect(-46, -54, 92, 54);
            ctx.strokeRect(-46, -54, 92, 54);
            // Snow roof
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(-58, -50);
            ctx.lineTo(0, -86);
            ctx.lineTo(58, -50);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Warm glowing windows
            ctx.fillStyle = '#fde047';
            ctx.fillRect(-28, -38, 18, 18);
            ctx.strokeRect(-28, -38, 18, 18);
            ctx.fillRect(10, -38, 18, 18);
            ctx.strokeRect(10, -38, 18, 18);
        } else if (kind === 'flag_swiss') {
            ctx.fillStyle = '#334155';
            ctx.fillRect(-3, -78, 5, 78);
            ctx.fillStyle = '#dc2626';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.fillRect(2, -76, 34, 24);
            ctx.strokeRect(2, -76, 34, 24);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(16, -71, 6, 14);
            ctx.fillRect(12, -67, 14, 6);
        } else {
            Ski.drawPineTree(-22, 0, 0.85);
            Ski.drawPineTree(22, 4, 0.72);
        }
        ctx.restore();
    },

    drawValleyFinishArch(x, y) {
        ctx.save();
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;
        ctx.fillRect(x - 65, y - 125, 16, 130);
        ctx.strokeRect(x - 65, y - 125, 16, 130);
        ctx.fillRect(x + 49, y - 125, 16, 130);
        ctx.strokeRect(x + 49, y - 125, 16, 130);

        ctx.fillStyle = '#ffd32a';
        ctx.fillRect(x - 75, y - 135, 150, 36);
        ctx.strokeRect(x - 75, y - 135, 150, 36);
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 14px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 ZIEL TALSTATION', x, y - 112);
        ctx.restore();
    },

    drawSlalomGate(gate, gy, clock) {
        const isRed = gate.color === 'red';
        const poleCol = gate.state === 'passed' ? '#2ed573' : (gate.state === 'missed' ? '#ef4444' : (isRed ? '#ef4444' : '#2563eb'));
        const leftX = gate.x - gate.halfW;
        const rightX = gate.x + gate.halfW;

        ctx.save();
        // Snow gate line between the two poles
        ctx.strokeStyle = gate.state === 'passed' ? 'rgba(46, 213, 115, 0.55)' : 'rgba(59, 130, 246, 0.32)';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(leftX, gy);
        ctx.lineTo(rightX, gy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Left & Right Articulated Slalom Poles + Flags
        [leftX, rightX].forEach((px) => {
            ctx.fillStyle = poleCol;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.fillRect(px - 4, gy - 54, 8, 54);
            ctx.strokeRect(px - 4, gy - 54, 8, 54);

            // Fluttering Gate Flag Panel
            const wave = Math.sin(clock * 6 + px) * 3;
            ctx.fillStyle = poleCol;
            ctx.beginPath();
            ctx.moveTo(px + 4, gy - 52);
            ctx.lineTo(px + 34, gy - 48 + wave);
            ctx.lineTo(px + 34, gy - 26 + wave);
            ctx.lineTo(px + 4, gy - 30);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // Gate number badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(gate.x - 24, gy - 14, 48, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`TOR ${gate.index}`, gate.x, gy - 2);
        ctx.restore();
    },

    drawCollectibleIcon(x, y, kind, clock) {
        ctx.save();
        ctx.translate(x, y);
        const imgKey = kind === 'frisbee_gold' || kind === 'hazard_frisbee' ? 'frisbee'
            : (kind === 'coffee' ? 'item_coffee' : (kind === 'energy' ? 'item_energy' : 'item_jeton'));
        const img = images[imgKey];
        ctx.fillStyle = kind === 'hazard_frisbee' ? 'rgba(255, 71, 87, 0.35)' : 'rgba(255, 211, 42, 0.32)';
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.rotate(kind.includes('frisbee') ? clock * 6 : 0);
            ctx.drawImage(img, -20, -20, 40, 40);
        }
        ctx.restore();
    },

    drawProjectilesAndBooks(s) {
        for (const pr of s.projectiles) {
            Ski.drawCollectibleIcon(pr.x, pr.y, 'hazard_frisbee', s.clock);
        }
        for (const b of s.books) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rot);
            if (images.item_gesetz && images.item_gesetz.complete) {
                ctx.drawImage(images.item_gesetz, -20, -20, 40, 40);
            } else {
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(-16, -12, 32, 24);
            }
            ctx.restore();
        }
    },

    drawAvalancheWall(avX, worldDist, clock) {
        if (avX < -280) return;
        ctx.save();
        const frontX = Math.max(45, avX);
        const grad = ctx.createLinearGradient(0, 0, frontX + 60, 0);
        grad.addColorStop(0, 'rgba(241, 245, 249, 0.98)');
        grad.addColorStop(0.75, 'rgba(226, 232, 240, 0.94)');
        grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, frontX + 60, SKI_VH);

        // Billowing comic snow cloud boulders along the avalanche front
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 3.5;
        for (let y = 60; y < SKI_VH; y += 58) {
            const r = 44 + Math.sin(clock * 8 + y) * 10;
            const cx = frontX + Math.cos(clock * 6 + y * 0.05) * 16;
            ctx.beginPath();
            ctx.arc(cx, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.fillStyle = '#ef4444';
        ctx.font = '900 14px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ LAWINE! ⚠️', Math.max(65, frontX - 20), 170);
        ctx.restore();
    },

    drawSnowAndSpray(s) {
        for (const sp of s.spray) {
            ctx.fillStyle = sp.color || 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
            ctx.fill();
        }
        for (const fl of s.snow) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
            ctx.beginPath();
            ctx.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // =====================================================================
    // TOP-QUALITY TELEMETRY & RACE HUD
    // =====================================================================
    renderSkiHUD(g) {
        const s = g.ski;
        ctx.save();

        // Bottom-left Speedometer & Stopwatch Card (positioned cleanly above #ability-bar)
        const cardX = 20;
        const cardY = SKI_VH - 150;
        ctx.fillStyle = 'rgba(11, 15, 28, 0.92)';
        ctx.strokeStyle = s.boostTimer > 0 ? '#ffd32a' : '#00d2d3';
        ctx.lineWidth = 2.5;
        ctx.fillRect(cardX, cardY, 285, 68);
        ctx.strokeRect(cardX, cardY, 285, 68);

        const kmh = Math.round(s.speed * 0.24);
        ctx.fillStyle = s.boostTimer > 0 ? '#ffd32a' : '#ffffff';
        ctx.font = '900 21px "Montserrat", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🎿 ${kmh} km/h`, cardX + 14, cardY + 28);

        const urgentTime = s.timeLeft <= 15;
        ctx.fillStyle = urgentTime ? '#ff4757' : '#cbd5e1';
        ctx.font = '800 13.5px "Montserrat", sans-serif';
        ctx.fillText(`⏱️ ZEIT: ${s.timeLeft.toFixed(1)}s`, cardX + 14, cardY + 52);

        // Mode-specific live status on the right side of the card
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd32a';
        ctx.font = '900 12px "Montserrat", sans-serif';
        if (s.subMode === 'ski_jump' && s.jumpState) {
            ctx.fillText(`REKORD: ${s.jumpState.bestMeters.toFixed(0)}m`, cardX + 272, cardY + 28);
            ctx.fillStyle = '#2ed573';
            ctx.fillText(`TOTAL: ${s.jumpState.totalMeters.toFixed(0)}m`, cardX + 272, cardY + 52);
        } else if (s.subMode === 'slalom') {
            ctx.fillText(`TORE: ${s.gatesPassed}/${s.gatesRequired}`, cardX + 272, cardY + 28);
            if (s.rival) {
                const gapM = Math.round((s.dist - s.rival.dist) / 25);
                ctx.fillStyle = gapM >= 0 ? '#2ed573' : '#ff4757';
                ctx.fillText(gapM >= 0 ? `🥇 +${gapM}m VOR ADAM` : `🥈 ${gapM}m HINTER ADAM`, cardX + 272, cardY + 52);
            }
        } else if (s.subMode === 'ski_lift') {
            ctx.fillText(s.liftState.onCable ? '⚡ SEIL-GRIND!' : '🚡 SKILIFT AKTIV', cardX + 272, cardY + 28);
            ctx.fillStyle = '#00d2d3';
            ctx.fillText('DOPPEL-SPRUNG BEREIT', cardX + 272, cardY + 52);
        } else {
            ctx.fillText('TALABFAHRT →', cardX + 272, cardY + 28);
            if (s.avalanche) {
                const avGap = Math.max(0, Math.round((s.dist - s.avalanche.dist) / 10));
                ctx.fillStyle = avGap < 12 ? '#ff4757' : '#38bdf8';
                ctx.fillText(`🏔️ LAWINE: ${avGap}m`, cardX + 272, cardY + 52);
            }
        }

        ctx.restore();
    },

    // =====================================================================
    // MISSION PILL (TOP CENTER HUD)
    // =====================================================================
    pill() {
        const g = this;
        const s = g.ski;
        if (!s) return null;

        if (s.subMode === 'ski_jump' && s.jumpState) {
            const js = s.jumpState;
            return {
                icon: '🎿',
                text: `RIESEN-SCHANZE • WEITE: ${Math.max(js.bestMeters, js.flightMeters).toFixed(0)}m / ${js.targetSingleMeters}m (TOTAL: ${js.totalMeters.toFixed(0)}/${js.targetTotalMeters}m)`,
                urgent: s.timeLeft < 15,
                highlight: js.bestMeters >= js.targetSingleMeters * 0.85
            };
        }
        if (s.subMode === 'ski_lift' && s.liftState) {
            const pct = Math.min(100, Math.floor((s.liftState.progress / s.liftState.goalDist) * 100));
            return {
                icon: '🚡',
                text: `AKTIVER SKILIFT • GIPFEL: ${pct}% • ⏱️ ${Math.ceil(s.timeLeft)}s`,
                urgent: s.timeLeft < 15,
                highlight: pct >= 85
            };
        }
        if (s.subMode === 'slalom') {
            const gapM = s.rival ? Math.round((s.dist - s.rival.dist) / 25) : 0;
            const gapStr = s.rival ? (gapM >= 0 ? ` • 🥇 +${gapM}m vs. Adam` : ` • 🥈 ${gapM}m vs. Adam`) : '';
            return {
                icon: '🚩',
                text: `LIVE-SLALOM • TORE: ${s.gatesPassed}/${s.gatesRequired}${gapStr} • ⏱️ ${Math.ceil(s.timeLeft)}s`,
                urgent: s.timeLeft < 15 || (s.rival && gapM < -8),
                highlight: s.gatesPassed >= s.gatesRequired
            };
        }
        const pct = Math.min(100, Math.floor((s.dist / s.length) * 100));
        return {
            icon: '🥏',
            text: `TALABFAHRT INS TAL: ${pct}%${s.avalanche ? ' • ⚠️ LAWINE!' : ''} • ⏱️ ${Math.ceil(s.timeLeft)}s`,
            urgent: s.timeLeft < 15 || Boolean(s.avalanche && s.dist - s.avalanche.dist < 180),
            highlight: pct >= 85
        };
    }
};

Game.prototype.customModes.ski = {
    hint: '<b>[A/D]</b> Steuern &bull; <b>[W/SPACE]</b> Sprung / Absprung &bull; <b>[S]</b> Hocke &bull; <b>[SHIFT]</b> Dash &bull; <b>[E]</b> Gesetz &bull; <b>[F]</b> Frisbee-Turbo &bull; <b>[Q]</b> Mega',
    init: Ski.init,
    update: Ski.update,
    render: Ski.render,
    pill: Ski.pill
};
