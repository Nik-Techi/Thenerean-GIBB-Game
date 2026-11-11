/**
 * Thenerean Selvabankumar — V9 course design & character dossiers
 *
 * Makes the jump-and-run and tower levels harder and more varied:
 * - Run levels: tall walls (double jump), patrolling and hopping obstacles, double hurdles,
 *   open pits without bridges, thrown frisbees from off-screen, coin trails on the risky line,
 *   obstacle damage that scales per chapter
 * - Tower levels: regenerated with narrower platforms, uneven steps, crumbling and moving
 *   platforms, a faster rising hazard and falling debris
 * - Character gallery: two extra entries, a dossier per character and a defeat counter
 */

const CLIMB_TIER = { 5: 0, 13: 1, 17: 2, 23: 3, 27: 4 };

const CHARACTER_DOSSIERS = {
    thenerean: [
        ['📍 REVIER', 'Überall zwischen GIBB Bern, Kloten, Sri Lanka und dem Orbit.'],
        ['⚔️ TAKTIK', 'Dash [SHIFT] durch Projektile lädt Energie. Perfekt-Block [R] betäubt den Boss — direkt danach Mega [Q] für die Kombo.'],
        ['💡 TRIVIA', 'Doppelsprung und Dash hat er sich im Nachsitzen selbst beigebracht.']
    ],
    monika: [
        ['📍 REVIER', 'Klassenzimmer 302, ABU-Zimmer B404 und das Prüfungs-Auditorium.'],
        ['⚔️ TAKTIK', 'Rote Karten fliegen gerade: ducken oder im letzten Moment blocken und zurückwerfen. In Phase 2 dem Schrei per Dash ausweichen.'],
        ['💡 TRIVIA', 'Der Beamer-Schalter im Klassenzimmer bringt sie kurz aus dem Konzept.']
    ],
    adam: [
        ['📍 REVIER', 'GIBB Turnhalle, Mensa und das EFZ-Finale.'],
        ['⚔️ TAKTIK', 'Hohe Frisbees ducken, Basketbälle überspringen. Beim Pfiff Abstand halten, sonst bist du betäubt.'],
        ['💡 TRIVIA', 'Die 20-Frisbee-Salve [F] ist von seinem Lieblingsspruch abgeschaut.']
    ],
    tuktuk: [
        ['📍 REVIER', 'Der Serverraum am Ende von Kapitel 1.'],
        ['⚔️ TAKTIK', 'Den Ramm-Angriff mit Doppelsprung überspringen — danach steht es kurz offen. Flammen am Boden meiden.'],
        ['💡 TRIVIA', 'Verfolgt dich zuerst durch den ganzen Serverraum, bevor es sich dem Kampf stellt.']
    ],
    tuktuk_dual: [
        ['📍 REVIER', 'Colombo Cyber-Highway und der Server-Bunker.'],
        ['⚔️ TAKTIK', 'Doppel-Kabel kommen auf zwei Höhen: eins ducken, eins springen. Nach dem Wand-Rebound sofort dashen.'],
        ['💡 TRIVIA', 'Zwei übertaktete Grafikkarten, null Kühlung — die Stickstoff-Schalter helfen.']
    ],
    gibb_student: [
        ['📍 REVIER', 'Korridore, Kiosk und praktisch jede Welle im Nachsitzen.'],
        ['⚔️ TAKTIK', 'Energy-Dosen fliegen flach, Laptops im Bogen. Zu zweit zuerst den schwächeren ausschalten.'],
        ['💡 TRIVIA', 'Tritt im Nachsitzen unter sechs verschiedenen Namen auf.']
    ],
    tung_sahur: [
        ['📍 REVIER', 'Sri Lanka Dschungel und die brennende Bäckerei Kloten.'],
        ['⚔️ TAKTIK', 'Über die Bonk-Schockwelle springen, den Schläger blocken. Sein Dash ist schnell — eigenen Dash bereithalten.'],
        ['💡 TRIVIA', 'Ab Welle 9 hilft er im Nachsitzen als Aushilfe aus.']
    ],
    drone: [
        ['📍 REVIER', 'Der Orbit über der Erde (Level 24).'],
        ['⚔️ TAKTIK', 'Vertikal ausweichen, Dash in Flugrichtung nutzen und mit dem Melonen-Laser [E] Dauerfeuer geben.'],
        ['💡 TRIVIA', 'Der einzige Boss, den du im Raketenflug bekämpfst.']
    ]
};

const Course = {
    // ---------------------------------------------------------------------
    // SHARED HELPERS
    // ---------------------------------------------------------------------
    runHazardDamage() {
        const ch = (this.level && this.level.chapter) || 1;
        const diff = this.getActiveDifficulty();
        const base = (12 + 4 * ch) * (diff.dmgMult || 1) * (this.touchControlsEnabled ? 0.75 : 1);
        return Math.max(6, Math.round(base));
    },

    isRunCourse() {
        const mode = this.level && this.level.mode;
        return !!this.level && !this.level.endless && mode !== 'vertical_climb' && mode !== 'rocket_flight' && (this.level.targetDistance || 0) > 0;
    },

    resetCourseState() {
        this.runCoins = [];
        this.throwTimer = 260;
        this.throwWarn = null;
        this.crumbled = [];
        this.debrisTimer = 220;
        this.debrisWarn = null;
    },

    // ---------------------------------------------------------------------
    // RUN LEVELS: harder obstacle course
    // ---------------------------------------------------------------------
    hardenRunCourse() {
        const lvl = this.level;
        if (!lvl || lvl.endless || !(lvl.targetDistance > 0)) return;
        const gy = this.player.groundY;
        const ch = lvl.chapter || 1;
        const total = lvl.targetDistance;
        const mech = lvl.mechanics || {};
        const highs = this.obstacles.filter((o) => o.high);
        const plain = this.obstacles.filter((o) => !o.high);
        const mbDist = lvl.hasMiniBoss ? Math.round(total * (lvl.miniBossTriggerRatio || 0.5)) : -99999;

        const nearHigh = (x, before = 400, after = 230) => highs.some((h) => x > h.x - before && x < h.x + h.w + after);
        const underPlatform = (x0, x1) => this.platforms.some((p) => !p.isArena && x1 > p.x - 40 && x0 < p.x + p.w + 40);
        const nearPit = (x0, x1) => this.lavaPits.some((p) => x1 > p.x - 240 && x0 < p.x + p.w + 240);
        const nearPad = (x0, x1) => this.boostPads.some((b) => x1 > b.x - 80 && x0 < b.x + b.w + 80);
        const otherObstacle = (self, x0, x1) => this.obstacles.some((q) => q !== self && !q.removed && q.x + q.w > x0 && q.x < x1);
        const addCoin = (x, y) => this.runCoins.push({ x, y, taken: false, phase: Math.random() * Math.PI * 2 });

        const chance = Math.min(0.92, 0.5 + lvl.id * 0.03);
        const allowTall = lvl.mode !== 'bankomat_survival';
        const allowPit = !!mech.lavaPits && lvl.id >= 6;
        const pitW = 280 + ch * 40;
        let sincePit = 2;

        for (const o of plain) {
            sincePit++;
            const x0 = o.x;
            const x1 = o.x + o.w;
            if (x0 < 900 || x1 > total - 420) continue;
            if (Math.abs(x0 - mbDist) < 620) continue;
            if (underPlatform(x0, x1) || nearHigh(x0)) continue;
            if (Math.random() > chance) continue;

            // Open pit without a bridge: needs sprint, double jump or dash
            const pitX = Math.round(x0 + o.w * 0.5 - pitW * 0.5);
            if (allowPit && sincePit >= 5 && !nearPit(pitX, pitX + pitW) && !nearPad(pitX - 120, pitX + pitW + 120) &&
                !otherObstacle(o, pitX - 230, pitX + pitW + 230) && !underPlatform(pitX - 60, pitX + pitW + 60) &&
                !highs.some((h) => h.x + h.w > pitX - 380 && h.x < pitX + pitW + 380)) {
                o.removed = true;
                this.lavaPits.push({ x: pitX, w: pitW, theme: mech.pitTheme || 'lava' });
                for (let i = 0; i < 4; i++) {
                    const t = (i + 0.5) / 4;
                    addCoin(pitX + pitW * t - 13, gy - 120 - Math.sin(t * Math.PI) * 70);
                }
                sincePit = 0;
                continue;
            }

            const r = Math.random();
            if (r < 0.28 && allowTall) {
                // Tall wall: only a double jump clears it
                o.type = 'server_stack';
                o.w = 62;
                o.h = 150;
                o.y = gy - o.h;
                o.tall = true;
                addCoin(o.x + 4, gy - 238);
                addCoin(o.x + 34, gy - 250);
            } else if (r < 0.55) {
                o.move = 'patrol';
                o.baseX = o.x;
                o.amp = 55;
                o.spd = 1.5 + ch * 0.25;
            } else if (r < 0.75) {
                // Hopping ball: jump over it when low, or duck/run under it when high
                o.type = 'basketball';
                o.w = 50;
                o.h = 50;
                o.move = 'hop';
                o.baseY = gy - 50;
                o.y = o.baseY;
                o.amp = 125;
                o.spd = 2.1 + ch * 0.2;
            } else if (!otherObstacle(o, x1 + 40, x1 + 400) && !nearHigh(x0 + 160) && !nearPit(x0, x1 + 220) && !underPlatform(x0 + 150, x1 + 220)) {
                // Double hurdle: stay in the air across both
                const types = lvl.obstacleTypes && lvl.obstacleTypes.length ? lvl.obstacleTypes : ['traffic_cone'];
                const type = types[Math.floor(Math.random() * types.length)];
                const size = type === 'frisbee' ? 56 : 52;
                this.obstacles.push({
                    x: x0 + 160, y: gy - size, w: size, h: type === 'frisbee' ? 38 : size,
                    type, high: false, cleared: false, phase: Math.random() * Math.PI * 2
                });
                addCoin(x0 + 95, gy - 175);
            }
        }
        this.obstacles = this.obstacles.filter((o) => !o.removed);

        // Fill the long empty stretches so there is always something to react to
        const spacing = this.chaser || lvl.mode === 'tuktuk_chase_boss' ? 260 : (ch === 1 ? 215 : (ch === 2 ? 190 : 170));
        const blocked = [[-1e9, 900], [total - 300, 1e9], [mbDist - 620, mbDist + 620]];
        for (const o of this.obstacles) {
            const extra = o.move === 'patrol' ? o.amp : 0;
            if (o.high) blocked.push([o.x - 270, o.x + o.w + 150]);
            else blocked.push([o.x - spacing - extra, o.x + o.w + spacing + extra]);
        }
        for (const p of this.lavaPits) blocked.push([p.x - 230, p.x + p.w + 230]);
        for (const p of this.platforms) if (!p.isArena) blocked.push([p.x - 90, p.x + p.w + 90]);
        for (const b of this.boostPads) blocked.push([b.x - 70, b.x + b.w + 250]);
        for (const c of this.collectibles) if (c.type === 'jeton') blocked.push([c.x - 170, c.x + c.w + 120]);
        const fillTypes = lvl.obstacleTypes && lvl.obstacleTypes.length ? lvl.obstacleTypes : ['traffic_cone'];
        for (let x = 900; x < total - 300; x += 30) {
            if (blocked.some(([a, b]) => x + 52 > a && x < b)) continue;
            const r = Math.random();
            const type = fillTypes[Math.floor(Math.random() * fillTypes.length)];
            const size = type === 'frisbee' ? 56 : 52;
            const o = { x, y: gy - size, w: size, h: type === 'frisbee' ? 38 : size, type, high: false, cleared: false, phase: Math.random() * Math.PI * 2 };
            if (r < 0.22 && allowTall && lvl.id >= 3) {
                Object.assign(o, { type: 'server_stack', w: 62, h: 150, y: gy - 150, tall: true });
                addCoin(o.x + 18, gy - 245);
            } else if (r < 0.45 && lvl.id >= 3) {
                Object.assign(o, { type: 'basketball', w: 50, h: 50, y: gy - 50, baseY: gy - 50, move: 'hop', amp: 125, spd: 2.1 + ch * 0.2 });
            }
            this.obstacles.push(o);
            blocked.push([x - spacing, x + o.w + spacing]);
        }
    },

    tickCourse() {
        if (this.state !== GAME_STATE.RUNNING || !this.level) return;
        if (this.level.mode === 'vertical_climb') {
            this.tickClimbHazards();
            return;
        }
        if (!this.isRunCourse()) return;
        const p = this.player;
        const gy = p.groundY;

        for (const o of this.obstacles) {
            if (o.move === 'patrol') {
                o.x = o.baseX + Math.sin(this.animClock * o.spd + o.phase) * o.amp;
            } else if (o.move === 'hop') {
                o.y = o.baseY - Math.abs(Math.sin(this.animClock * o.spd + o.phase)) * o.amp;
            }
        }

        for (const c of this.runCoins) {
            if (c.taken) continue;
            const sx = c.x - this.worldDistance;
            if (sx < -60 || sx > canvas.width + 60) continue;
            if (this.checkCollision(p.x - 10, p.y - 10, p.w + 20, p.h + 20, sx, c.y, 26, 26)) {
                c.taken = true;
                window.soundManager.playCollect();
                this.addCoins(1, { raw: true });
                this.addFloatingText('+1', sx + 13, c.y - 6, '#ffd32a', 15);
            }
        }

        // Frisbees thrown in from off-screen: high lane = duck, low lane = jump (or block / dash through)
        const lvl = this.level;
        const inZone = this.worldDistance > 500 && this.worldDistance < lvl.targetDistance - 600;
        if (lvl.id >= 3 && !this.chaser && inZone) {
            if (this.throwWarn) {
                this.throwWarn.timer--;
                if (this.throwWarn.timer <= 0) {
                    const diff = this.getActiveDifficulty();
                    const ch = lvl.chapter || 1;
                    const high = this.throwWarn.lane === 'high';
                    this.projectiles.push({
                        x: canvas.width + 20,
                        y: high ? gy - Math.round(p.h * 0.95) : gy - 36,
                        vx: -(7.5 + ch * 1.3) * (diff.projSpeedMult || 1),
                        vy: 0, w: 48, h: 28,
                        type: 'frisbee', isPlayer: false,
                        damage: Math.max(6, this.runHazardDamage() - 2),
                        rotation: 0, trailColor: '#ff4757'
                    });
                    window.soundManager.playThrow();
                    this.throwWarn = null;
                }
            } else {
                this.throwTimer--;
                if (this.throwTimer <= 0) {
                    const diff = this.getActiveDifficulty();
                    this.throwTimer = Math.round((170 - lvl.id * 3) / (diff.aggroMult || 1) + Math.random() * 50);
                    this.throwWarn = { lane: Math.random() < 0.5 ? 'high' : 'low', timer: 42 };
                }
            }
        }
    },

    drawCourseOverlays() {
        if (this.state !== GAME_STATE.RUNNING || !this.isRunCourse()) return;
        const gy = this.player.groundY;

        for (const c of this.runCoins) {
            if (c.taken) continue;
            const sx = c.x - this.worldDistance;
            if (sx < -40 || sx > canvas.width + 40) continue;
            const spin = Math.abs(Math.cos(this.animClock * 4 + c.phase));
            const cy = c.y + 13 + Math.sin(this.animClock * 4.5 + c.phase) * 4;
            ctx.save();
            ctx.translate(sx + 13, cy);
            ctx.scale(0.35 + spin * 0.65, 1);
            ctx.fillStyle = '#ffd32a';
            ctx.strokeStyle = '#7a4b00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#7a4b00';
            ctx.font = '900 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('₣', 0, 1);
            ctx.restore();
        }

        if (this.throwWarn && Math.floor(this.animClock * 10) % 2 === 0) {
            const high = this.throwWarn.lane === 'high';
            const wy = high ? gy - Math.round(this.player.h * 0.95) + 14 : gy - 22;
            const wx = canvas.width - 46;
            ctx.save();
            ctx.fillStyle = '#ff4757';
            ctx.strokeStyle = '#080b12';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(wx, wy - 22);
            ctx.lineTo(wx + 24, wy + 18);
            ctx.lineTo(wx - 24, wy + 18);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '900 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', wx, wy + 4);
            ctx.restore();
            this.drawNamePill(high ? '⬇ DUCKEN' : '⬆ SPRINGEN', wx - 50, wy - 34, '#ff4757');
        }
    },

    // ---------------------------------------------------------------------
    // TOWER LEVELS: harder climb
    // ---------------------------------------------------------------------
    climbTier() {
        const t = CLIMB_TIER[this.level && this.level.id];
        return t === undefined ? 1 : t;
    },

    rebuildClimbTower() {
        const gy = this.player.groundY;
        const t = this.climbTier();
        const summit = this.platforms.find((p) => p.isSummit);
        this.platforms = [];
        this.collectibles = [];

        const pStyle = (this.level.mechanics && this.level.mechanics.platformStyle) || 'concrete';
        const marginX = 54;
        const baseW = Math.max(154, Math.min(220, Math.round(canvas.width * 0.165)));
        const colPool = (this.level.collectibleTypes && this.level.collectibleTypes.length > 0) ? this.level.collectibleTypes : ['coffee', 'energy_drink'];

        let prevX = Math.round(canvas.width * 0.5 - baseW * 0.5);
        let curY = gy - 108;
        let idx = 0;
        let lastSpecial = '';
        while (curY > this.climbGoalY + 95) {
            const narrow = idx >= 3 && Math.random() < 0.25 + t * 0.08;
            const w = Math.max(104, Math.round(baseW * (narrow ? 0.62 : 1 - t * 0.05)));
            const maxX = Math.max(marginX + 40, canvas.width - marginX - w);
            const reach = 205 + t * 8;
            const minNext = Math.max(marginX, prevX - reach);
            const maxNext = Math.min(maxX, prevX + reach);
            let nextX = Math.round(minNext + Math.random() * Math.max(20, maxNext - minNext));
            if (Math.abs(nextX - prevX) < 70) {
                nextX = prevX > canvas.width * 0.45 ? Math.max(marginX, prevX - 150) : Math.min(maxX, prevX + 150);
            }

            let special = '';
            if (idx >= 3) {
                const r = Math.random();
                if (idx % 5 === 4) special = 'bounce';
                else if (lastSpecial !== 'crumble' && r < 0.16 + t * 0.07) special = 'crumble';
                else if (r < 0.34 + t * 0.12) special = 'move';
            }
            lastSpecial = special;
            if (special === 'move') {
                const amp = 36 + t * 6;
                nextX = Math.max(marginX + amp, Math.min(maxX - amp, nextX));
            }

            this.platforms.push({
                x: nextX, baseX: nextX, y: curY,
                offsetY: gy - curY, baseOffsetY: gy - curY,
                w, h: 22, style: pStyle, isClimb: true,
                isBounce: special === 'bounce',
                crumble: special === 'crumble',
                crumbleT: 0,
                moveAxis: special === 'move' ? 'x' : null,
                moveAmp: special === 'move' ? 36 + t * 6 : 0,
                moveSpeed: special === 'move' ? 1.7 + t * 0.15 : 0,
                phase: idx * 0.9
            });

            if (idx % 3 === 1 && special !== 'crumble') {
                const colY = curY - 56;
                this.collectibles.push({
                    x: nextX + w * 0.5 - 20, y: colY, offsetY: gy - colY, w: 40, h: 40,
                    type: colPool[idx % colPool.length], collected: false, isClimb: true, phase: idx * 0.7
                });
            }

            prevX = nextX;
            // Uneven steps; the tallest ones are easiest with a double jump
            curY -= Math.round(108 + Math.random() * Math.min(70, 26 + t * 11));
            idx++;
        }
        if (summit) this.platforms.push(summit);
    },

    tickClimbHazards() {
        const p = this.player;
        const t = this.climbTier();

        const sp = p.standingPlatform;
        if (sp && sp.crumble) {
            sp.crumbleT++;
            if (sp.crumbleT >= 34) {
                this.platforms = this.platforms.filter((pl) => pl !== sp);
                this.crumbled.push({ plat: sp, timer: 210 });
                p.standingPlatform = null;
                this.spawnBurst(sp.x + sp.w * 0.5, sp.y + 8, 16, '#9ca3af', 5, 20);
                window.soundManager.playHit();
            }
        }
        for (let i = this.crumbled.length - 1; i >= 0; i--) {
            const c = this.crumbled[i];
            if (--c.timer <= 0) {
                c.plat.crumbleT = 0;
                this.platforms.push(c.plat);
                this.crumbled.splice(i, 1);
            }
        }

        if (this.debrisWarn) {
            this.debrisWarn.timer--;
            if (this.debrisWarn.timer <= 0) {
                const diff = this.getActiveDifficulty();
                this.projectiles.push({
                    x: this.debrisWarn.x - 20, y: this.climbCameraY - 60,
                    vx: 0, vy: 6.5 + t * 0.6, w: 40, h: 40,
                    type: 'laptop', isPlayer: false,
                    damage: Math.round((14 + t * 2) * (diff.dmgMult || 1)),
                    rotation: 0, trailColor: '#ff6348'
                });
                this.debrisWarn = null;
            }
        } else if (--this.debrisTimer <= 0) {
            this.debrisTimer = Math.round(235 - t * 26 + Math.random() * 60);
            const cx = p.x + p.w * 0.5 + (Math.random() - 0.5) * 300;
            this.debrisWarn = { x: Math.max(60, Math.min(canvas.width - 60, cx)), timer: 48 };
        }
    },

    drawClimbOverlays() {
        for (const plat of this.platforms) {
            if (!plat.crumble) continue;
            const shake = plat.crumbleT > 0 ? (Math.random() - 0.5) * 5 : 0;
            ctx.save();
            ctx.strokeStyle = plat.crumbleT > 0 ? '#ff4757' : '#ffa502';
            ctx.lineWidth = 3;
            ctx.setLineDash([9, 6]);
            ctx.strokeRect(plat.x + shake, plat.y, plat.w, plat.h);
            ctx.setLineDash([]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 1; i <= 3; i++) {
                const cx = plat.x + shake + (plat.w * i) / 4;
                ctx.moveTo(cx - 7, plat.y + 2);
                ctx.lineTo(cx + 2, plat.y + 11);
                ctx.lineTo(cx - 4, plat.y + plat.h - 2);
            }
            ctx.stroke();
            ctx.restore();
        }
        if (this.debrisWarn && Math.floor(this.animClock * 10) % 2 === 0) {
            const wx = this.debrisWarn.x;
            const wy = this.climbCameraY + 122;
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 71, 87, 0.35)';
            ctx.lineWidth = 34;
            ctx.beginPath();
            ctx.moveTo(wx, wy + 20);
            ctx.lineTo(wx, wy + canvas.height);
            ctx.stroke();
            ctx.fillStyle = '#ff4757';
            ctx.strokeStyle = '#080b12';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(wx, wy + 22);
            ctx.lineTo(wx + 24, wy - 18);
            ctx.lineTo(wx - 24, wy - 18);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '900 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', wx, wy - 4);
            ctx.restore();
        }
    },

    // ---------------------------------------------------------------------
    // CHARACTER GALLERY: extra entries, dossiers, defeat counter
    // ---------------------------------------------------------------------
    bestiaryKey(e) {
        if (e.type === 'tuktuk_dual_gpu') return 'tuktuk_dual';
        const fam = this.getBossFamily(e);
        return fam === 'drone_tuktuk' ? 'drone' : fam;
    },

    buildCharacterExtras() {
        const tabs = document.querySelector('.chars-tabs');
        if (tabs) {
            const addTab = (key, avatar, label, beforeKey) => {
                const b = document.createElement('button');
                b.className = 'chars-tab';
                b.setAttribute('data-char', key);
                b.innerHTML = `<img src="${avatar}" alt="">${label}`;
                b.addEventListener('click', () => {
                    window.soundManager.initWebAudio();
                    this.showCharacter(key, true);
                });
                const before = beforeKey ? tabs.querySelector(`[data-char="${beforeKey}"]`) : null;
                tabs.insertBefore(b, before);
            };
            addTab('tuktuk', 'assets/sprites/tuktuk_avatar.png', 'TUKTUK MK-I', 'tuktuk_dual');
            addTab('drone', 'assets/sprites/drone_tuktuk_avatar.png', 'DRONE MK-III', null);
            tabs.classList.add('chars-tabs-v9');
        }
        const stats = document.getElementById('char-stats');
        if (stats) {
            const dossier = document.createElement('div');
            dossier.id = 'char-dossier';
            dossier.className = 'chars-dossier';
            stats.after(dossier);
        }
    }
};

Object.assign(Game.prototype, Course);

(function wrapCourse() {
    const P = Game.prototype;
    const wrap = (name, fn) => {
        const orig = P[name];
        P[name] = function (...args) { return fn.call(this, orig.bind(this), ...args); };
    };

    wrap('resetRunStats', function (orig) {
        orig();
        this.resetCourseState();
    });

    wrap('generateLevelObstacles', function (orig) {
        orig();
        this.hardenRunCourse();
    });

    wrap('initVerticalClimb', function (orig) {
        orig();
        this.rebuildClimbTower();
    });

    wrap('updateVerticalClimb', function (orig, dt) {
        // Faster flood that speeds up towards the summit
        const diff = this.getActiveDifficulty();
        const t = this.climbTier();
        const goalSpan = Math.max(1, this.climbStartY - this.climbGoalY);
        const prog = Math.max(0, Math.min(1, (this.climbStartY - (this.player.y + this.player.h)) / goalSpan));
        const gap = this.climbHazardY - (this.player.y + this.player.h);
        let target = (1.45 + 0.15 * t) * (1 + 0.15 * prog) * (diff.speedMult || 1);
        if (gap > canvas.height * 0.9) target *= 1.5;
        let base = (this.level.climbRiseSpeed || 0.78) * (diff.speedMult || 1);
        if (gap > canvas.height * 0.68) base = Math.max(base, 1.38);
        this.climbHazardY -= Math.max(0, target - base);
        orig(dt);
    });

    wrap('drawCollectibles', function (orig) {
        orig();
        this.drawCourseOverlays();
    });

    wrap('drawObstacles', function (orig) {
        orig();
        if (this.state !== GAME_STATE.RUNNING) return;
        for (const o of this.obstacles) {
            if (!o.tall) continue;
            const sx = o.x - this.worldDistance;
            if (sx > -90 && sx < canvas.width + 90) {
                this.drawNamePill('⬆⬆ DOPPELSPRUNG', sx + o.w * 0.5, o.y - 10, '#00d2d3');
            }
        }
    });

    wrap('drawVerticalClimbVisuals', function (orig) {
        orig();
        this.drawClimbOverlays();
    });

    wrap('getCharacterData', function (orig) {
        const data = orig();
        data.tuktuk = {
            accent: '#ff9f1a',
            role: 'KAPITEL-BOSS • TUKTUK MK-I',
            name: 'TukTuk MK-I',
            sprite: 'assets/sprites/characters/tuktuk_idle.png',
            bio: 'Das Original mit nur einer, dafür dauerhaft überhitzten Grafikkarte. Jagt dich durch den Serverraum bis zum Not-Aus und stellt sich dann zum Finale von Kapitel 1.',
            stats: [['HP', '🛺 700 HP'], ['ANGRIFF', '🔌 Kabel & Rammen'], ['SCHWÄCHE', '🔴 Not-Aus']],
            sounds: [
                { clip: 'tuktuk_taeschfresser_gpu', text: '"TÄSCHFRESSER!! GPU am Limit!"' },
                { clip: 'thenerean_verdammt_maschine', text: '"Verdammte Maschine!"' },
                { clip: 'thenerean_grafikkarte', text: '"Verdammte Grafikkarte!"' }
            ]
        };
        data.drone = {
            accent: '#00d2d3',
            role: 'LUFT-BOSS • CYBER DRONE MK-III',
            name: 'Cyber Drone TukTuk MK-III',
            sprite: 'assets/sprites/characters/drone_tuktuk.png',
            bio: 'Die fliegende Weiterentwicklung des TukTuks. Wirft Feuer-Pizzas ab, schiesst blaue Laser und stürzt sich im Sturzflug auf deine Melonen-Rakete.',
            stats: [['HP', '🚁 1050 HP'], ['ANGRIFF', '🍕 Pizza & Laser'], ['ARENA', '🛸 Orbit']],
            sounds: [
                { clip: 'thenerean_to_the_moon', text: '"TO THE MOON!!"' },
                { clip: 'tuktuk_gpu_melone', text: '"Melone mit zwei Grafikkarten!"' },
                { clip: 'thenerean_alles_brennt', text: '"Alles brennt!"' }
            ]
        };
        for (const [key, rows] of Object.entries(CHARACTER_DOSSIERS)) {
            if (data[key]) data[key].dossier = rows;
        }
        return data;
    });

    wrap('showCharacter', function (orig, key, playIntro) {
        orig(key, playIntro);
        const el = document.getElementById('char-dossier');
        const data = this.getCharacterData()[key];
        if (!el || !data) return;
        el.innerHTML = '';
        const addRow = (label, text, cls) => {
            const row = document.createElement('div');
            row.className = 'dossier-row' + (cls ? ' ' + cls : '');
            const l = document.createElement('span');
            l.textContent = label;
            const v = document.createElement('p');
            v.textContent = text;
            row.append(l, v);
            el.appendChild(row);
        };
        (data.dossier || []).forEach(([label, text]) => addRow(label, text));
        if (key === 'thenerean') {
            const s = this.meta.stats;
            addRow('📊 BILANZ', `${s.wins} Level-Siege • ${s.kills} Gegner besiegt • Nachsitz-Rekord ${s.endlessBest} Wellen`, 'record');
        } else {
            const n = (this.meta.bestiary && this.meta.bestiary[key]) || 0;
            addRow('🥊 BESIEGT', n > 0 ? `${n}× von dir besiegt` : 'Noch nie besiegt — hol dir den ersten Sieg!', 'record');
        }
    });
})();
