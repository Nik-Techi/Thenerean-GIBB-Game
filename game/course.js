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
        const base = (14 + 5 * ch) * (diff.dmgMult || 1) * (this.touchControlsEnabled ? 0.75 : 1);
        return Math.max(6, Math.round(base));
    },

    // Pogo: hold DOWN while falling onto an obstacle or enemy to bounce off it.
    tryPogo() {
        const p = this.player;
        if (p.isGrounded) p.coyote = 7;
        else if (p.coyote > 0) p.coyote--;
        if (p.pogoCd > 0) p.pogoCd--;
        const st = this.state;
        if (st !== GAME_STATE.RUNNING && st !== GAME_STATE.BOSS_FIGHT && st !== GAME_STATE.DEMO) return;
        const mode = this.level && this.level.mode;
        if (mode === 'rocket_flight' || mode === 'vertical_climb') return;
        if (p.isGrounded || !p.isDucking || p.vy <= 1 || p.pogoCd > 0) return;

        const bottom = p.y + p.h;
        const next = bottom + p.vy;
        const l = p.x + 10;
        const r = p.x + p.w - 10;
        const lands = (tx, ty, tw) => r > tx && l < tx + tw && bottom <= ty + 18 && next >= ty - 2;
        let top = null;
        let enemy = null;
        if (st === GAME_STATE.RUNNING) {
            for (const o of this.obstacles) {
                if (lands(o.x - this.worldDistance, o.y, o.w)) { top = o.y; break; }
            }
        } else {
            for (const e of [this.boss, this.duoPartner]) {
                if (e && e.hp > 0 && lands(e.x, e.y, e.w)) { top = e.y; enemy = e; break; }
            }
        }
        if (top === null) return;

        p.y = top - p.h - 2;
        p.vy = -13.8;
        p.jumpCut = false;
        p.airJumps = this.mods.maxAirJumps;
        p.airDashUsed = false;
        p.dashCooldown = Math.min(p.dashCooldown, 6);
        p.pogoCd = 8;
        p.invulnerableTime = Math.max(p.invulnerableTime, 10);
        this.meta.stats.pogos++;
        window.soundManager.playJump();
        const cx = p.x + p.w * 0.5;
        this.shockwaves.push({ x: cx, y: top, radius: 8, maxRadius: 80, color: '#2ed573', alpha: 0.8 });
        this.spawnBurst(cx, top, 12, '#2ed573', 5, 16);
        this.registerCombo(1, '⬇ POGO!');
        if (enemy) this.damageEnemy(enemy, Math.round(30 * this.mods.dmgMult), '#2ed573');
        if (this.meta.stats.pogos === 25) this.checkAchievements();
    },

    isRunCourse() {
        const mode = this.level && this.level.mode;
        return !!this.level && !this.level.endless && mode !== 'vertical_climb' && mode !== 'rocket_flight' && (this.level.targetDistance || 0) > 0;
    },

    resetCourseState() {
        this.runCoins = [];
        this.runSigns = [];
        this.throwTimer = 260;
        this.throwWarn = null;
        this.crumbled = [];
        this.debrisTimer = 220;
        this.debrisWarn = null;
    },

    // ---------------------------------------------------------------------
    // RUN LEVELS: harder obstacle course
    // ---------------------------------------------------------------------
    // Builds the whole run course from hand-tuned patterns. Jump physics at run speed:
    // one jump covers ~300px and peaks at ~170px, the air jump stretches that to ~500-580px
    // and an air dash adds another ~200px. Pits lose 32px of their width to the edge margin.
    buildRunCourse() {
        const lvl = this.level;
        const gy = this.player.groundY;
        const ph = this.player.h;
        const ch = lvl.chapter || 1;
        const total = lvl.targetDistance;
        const mech = lvl.mechanics || {};
        const pStyle = mech.platformStyle || 'concrete';
        const theme = mech.pitTheme || 'lava';
        const id = lvl.id;
        const types = lvl.obstacleTypes && lvl.obstacleTypes.length ? lvl.obstacleTypes : ['traffic_cone'];
        const pool = (lvl.collectibleTypes || ['coffee']).filter((t) => t !== 'jeton');
        const itemPool = pool.length ? pool : ['coffee'];
        const rnd = (a, b) => a + Math.random() * (b - a);
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const mbDist = lvl.hasMiniBoss ? Math.round(total * (lvl.miniBossTriggerRatio || 0.5)) : -1;

        const obs = (x, extra = {}) => {
            const type = extra.type || pick(types);
            const size = type === 'frisbee' ? 56 : 52;
            const o = { x, y: gy - size, w: size, h: type === 'frisbee' ? 38 : size, type, high: false, cleared: false, phase: rnd(0, 6.28), ...extra };
            this.obstacles.push(o);
            return o;
        };
        const tall = (x) => obs(x, { type: 'server_stack', w: 62, h: 150, y: gy - 150, tall: true });
        const hop = (x) => obs(x, { type: 'basketball', w: 50, h: 50, y: gy - 50, baseY: gy - 50, move: 'hop', amp: 125, spd: 2.1 + ch * 0.2 });
        const patrol = (x) => { const o = obs(x); Object.assign(o, { move: 'patrol', baseX: o.x, amp: 55, spd: 1.5 + ch * 0.25 }); };
        const duck = (x) => this.obstacles.push({
            x, y: gy - Math.round(ph * 0.92), w: 84, h: Math.round(ph * 0.30),
            type: id >= 5 ? 'broken_cable' : (id >= 3 ? 'frisbee' : 'warning_letter'),
            high: true, cleared: false, phase: rnd(0, 6.28)
        });
        const item = (x, h, type) => this.collectibles.push({ x, y: gy - h, w: 42, h: 42, type: type || pick(itemPool), collected: false, phase: rnd(0, 6.28) });
        const coin = (x, h) => this.runCoins.push({ x, y: gy - h, taken: false, phase: rnd(0, 6.28) });
        const plat = (x, off, w, move) => this.platforms.push({
            x, baseX: x, y: gy - off, offsetY: off, baseOffsetY: off, w, h: 22, style: pStyle,
            moveAxis: move ? move.axis : null, moveAmp: move ? move.amp : 0, moveSpeed: move ? move.speed : 0, phase: rnd(0, 6.28)
        });
        const pit = (x, w) => this.lavaPits.push({ x, w, theme });
        const coinArc = (x, w, n) => { for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; coin(x + w * t - 13, 120 + Math.sin(t * Math.PI) * 70); } };

        const hasDuck = !!mech.duckObstacles;
        const hasLava = !!mech.lavaPits;
        const hasPlat = !!mech.platforms;
        const noTall = lvl.mode === 'bankomat_survival';
        const pitW = 335 + ch * 45;      // wider than one jump: needs the air jump
        const pogoW = 560 + ch * 45;
        const dashGapW = 600 + ch * 10;  // only clears with jump + air jump + air dash

        const patterns = [
            { key: 'hurdle', len: 300, w: ch === 1 ? 1 : 0.5, ok: true, place: (x) => { obs(x + 40); if (Math.random() < 0.35) item(x + 135, 150); } },
            { key: 'double', len: 470, w: 1, ok: true, place: (x) => { obs(x + 40); obs(x + 205); coin(x + 130, 175); } },
            { key: 'triple', len: 650, w: 1, ok: id >= 11, place: (x) => { obs(x + 40); obs(x + 215); obs(x + 390); coin(x + 135, 175); coin(x + 310, 175); } },
            { key: 'tall', len: 340, w: 1, ok: id >= 2 && !noTall, place: (x) => { tall(x + 60); coin(x + 66, 245); coin(x + 98, 255); } },
            { key: 'hop', len: 330, w: 1, ok: id >= 3, place: (x) => { hop(x + 60); } },
            { key: 'patrol', len: 400, w: 1, ok: true, place: (x) => { patrol(x + 110); if (Math.random() < 0.3) item(x + 300, 150); } },
            { key: 'duck', len: 420, w: 1, ok: hasDuck, place: (x) => { duck(x + 140); if (Math.random() < 0.4) item(x + 161, 66); } },
            { key: 'duckJump', len: 700, w: 1, ok: hasDuck && id >= 6, place: (x) => { duck(x + 140); obs(x + 424); coin(x + 440, 170); } },
            { key: 'jumpDuck', len: 680, w: 1, ok: hasDuck && id >= 8, place: (x) => { obs(x + 40); duck(x + 392); } },
            { key: 'pit', len: pitW + 300, w: 1.2, ok: hasLava && id >= 6, place: (x) => { pit(x + 60, pitW); coinArc(x + 60, pitW, 4); } },
            { key: 'bridge', len: 800, w: 1, ok: hasLava && hasPlat, place: (x) => { pit(x + 60, 500); plat(x + 250, 88, 115); item(x + 286, 146); } },
            { key: 'movingBridge', len: 940, w: 1, ok: hasLava && hasPlat && id >= 7, place: (x) => { pit(x + 60, 640); plat(x + 320, 96, 120, { axis: 'x', amp: 85, speed: 2.1 }); item(x + 359, 154, 'energy_drink'); } },
            { key: 'islands', len: 1240, w: 1.1, ok: hasLava && hasPlat && id >= 9, place: (x) => {
                pit(x + 60, 940);
                plat(x + 300, 84, 96); plat(x + 600, 132, 96, id >= 15 ? { axis: 'y', amp: 26, speed: 2.4 } : null);
                coin(x + 335, 150); coin(x + 635, 200); item(x + 627, 196);
            } },
            { key: 'dashGap', len: dashGapW + 340, w: 1.1, ok: hasLava && id >= 13, place: (x) => {
                pit(x + 60, dashGapW);
                coinArc(x + 60, dashGapW, 6);
                this.runSigns.push({ x: x + 10, text: '⬆⬆ + SHIFT-DASH!' });
            } },
            { key: 'pogo', len: pogoW + 320, w: 1.2, ok: hasLava && id >= 7, place: (x) => {
                pit(x + 60, pogoW);
                const floatTypes = types.filter((t) => t !== 'frisbee');
                for (let i = 1; i <= 3; i++) {
                    const fx = Math.round(x + 60 + (pogoW * i) / 4 - 28);
                    this.obstacles.push({ x: fx, y: gy - 76, baseY: gy - 76, w: 56, h: 48, type: floatTypes.length ? floatTypes[i % floatTypes.length] : 'traffic_cone', high: false, cleared: false, float: true, move: 'float', phase: i * 1.7 });
                    coin(fx + 15, 168);
                }
            } },
            { key: 'sprintGap', len: 950, w: 1, ok: hasLava && !!mech.sprintPads, place: (x) => { this.boostPads.push({ x: x + 20, w: 96, label: '⚡ SPRINT' }); pit(x + 240, 440); coinArc(x + 240, 440, 5); } },
            { key: 'stairs', len: 780, w: 1, ok: hasPlat && id >= 3, place: (x) => {
                plat(x + 80, 88, 130); plat(x + 285, 150, 130); plat(x + 490, 205, 130);
                obs(x + 300); if (!noTall) tall(x + 520); else obs(x + 520);
                coin(x + 520, 262); coin(x + 550, 262); coin(x + 580, 262); item(x + 329, 208);
            } },
            { key: 'highLow', len: 480, w: 1, ok: hasPlat, place: (x) => {
                plat(x + 60, 96, 200, id >= 5 ? { axis: 'y', amp: 18, speed: 2.0 } : null);
                item(x + 94, 152, 'coffee'); coin(x + 190, 150);
                if (!mech.clearPlatformUnder) obs(x + 134);
            } }
        ].filter((p) => p.ok);

        const gapPad = this.chaser || lvl.mode === 'tuktuk_chase_boss' ? 130 : (ch === 1 ? 60 : (ch === 2 ? 36 : (ch === 3 ? 22 : 14)));
        const end = total - 320;
        let x = 700;
        let last = '';
        let guard = 0;
        while (x < end && guard++ < 400) {
            if (mbDist > 0 && x > mbDist - 200 && x < mbDist + 560) { x = mbDist + 560; continue; }
            const limit = mbDist > 0 && x < mbDist ? mbDist - 200 : end;
            const fits = patterns.filter((p) => p.key !== last && x + p.len <= limit);
            if (!fits.length) {
                if (limit === end) break;
                x = mbDist + 560;
                continue;
            }
            let roll = Math.random() * fits.reduce((s, p) => s + p.w, 0);
            let chosen = fits[0];
            for (const p of fits) { roll -= p.w; if (roll <= 0) { chosen = p; break; } }
            chosen.place(Math.round(x));
            last = chosen.key;
            x += chosen.len + gapPad + rnd(0, 50);
        }

        if (lvl.mode === 'bankomat_survival') {
            this.spawnLevel7Jetons(lvl.targetGoalCount || 8);
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
            } else if (o.move === 'float') {
                o.y = o.baseY + Math.sin(this.animClock * 2.2 + o.phase) * 8;
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
                    const follow = !this.throwWarn.follow && ch >= 2 && Math.random() < 0.35;
                    this.throwWarn = follow ? { lane: high ? 'low' : 'high', timer: 34, follow: true } : null;
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

        for (const sign of this.runSigns) {
            const sx = sign.x - this.worldDistance;
            if (sx > -160 && sx < canvas.width + 160) this.drawNamePill(sign.text, sx, gy - this.player.h - 34, '#00d2d3');
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
        Object.assign(this.player, { coyote: 0, pogoCd: 0, jumpCut: false, airDashUsed: false });
    });

    wrap('update', function (orig, dt) {
        if (!this.isPaused) this.tryPogo();
        orig(dt);
    });

    // Pickups heal less in the platforming levels, and a hit gives a shorter grace period
    wrap('onCollectItem', function (orig, type) {
        const before = this.player.hp;
        orig(type);
        const platforming = this.state === GAME_STATE.RUNNING && this.level && (this.isRunCourse() || this.level.mode === 'vertical_climb');
        if (platforming && this.player.hp > before) {
            this.player.hp = before + Math.ceil((this.player.hp - before) * 0.4);
            this.updateBars();
        }
    });

    wrap('onPlayerHit', function (orig, damage, reason) {
        const landed = orig(damage, reason);
        if (landed && this.state === GAME_STATE.RUNNING && this.player.invulnerableTime > 48) this.player.invulnerableTime = 48;
        return landed;
    });

    wrap('startLevel', function (orig, index) {
        orig(index);
        const mode = (this.level && this.level.mode) || 'standard';
        if (this.ui.controlHintPill && mode !== 'rocket_flight' && mode !== 'vertical_climb' && !this.customModes[mode]) {
            this.ui.controlHintPill.innerHTML = '<span><kbd>SPACE</kbd> halten = höher, 2× &bull; <kbd>SHIFT</kbd> Dash &bull; <kbd>↓</kbd> in der Luft auf Hindernis = Pogo &bull; <kbd>CTRL</kbd> Ducken &bull; <kbd>R</kbd> Block</span>';
        }
    });

    wrap('generateLevelObstacles', function (orig) {
        if (this.level && !this.level.endless && this.level.targetDistance > 0) this.buildRunCourse();
        else orig();
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
            if (!o.tall && !o.float) continue;
            const sx = o.x - this.worldDistance;
            if (sx > -90 && sx < canvas.width + 90) {
                if (o.float) this.drawNamePill('⬇ POGO', sx + o.w * 0.5, o.y - 10, '#2ed573');
                else this.drawNamePill('⬆⬆ DOPPELSPRUNG', sx + o.w * 0.5, o.y - 10, '#00d2d3');
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
