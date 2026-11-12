/**
 * Thenerean Selvabankumar — extra level types
 *
 *  1. Side wall ("the floor is lava — from the side"): any run level with `sideHazard`
 *     gets a wall of lava or an avalanche that rolls in from the left. Standing still,
 *     falling into pits or getting hit lets it catch up; touching it ends the run.
 *
 *  2. Snowball fight (`mode: 'snowball'`): a shooting gallery. Rivals pop up behind snow
 *     forts on three heights, the player has to climb to the matching height and land
 *     the required number of hits before the clock runs out.
 */

// =========================================================================
// 1. SIDE WALL
// =========================================================================
const SideWall = {
    start(g) {
        const cfg = g.level && g.level.sideHazard;
        g.sideWall = cfg ? { x: -(cfg.lead || 560), cfg, warned: false } : null;
    },

    playerWorldX(g) {
        return g.worldDistance + g.player.x;
    },

    tick(g) {
        const w = g.sideWall;
        if (!w || g.state !== GAME_STATE.RUNNING) return;
        const cfg = w.cfg;
        const diff = g.getActiveDifficulty();
        const prog = Math.max(0, Math.min(1, g.worldDistance / Math.max(1, g.level.targetDistance)));
        const speed = (cfg.speed || 5.4) * (0.9 + 0.1 * (diff.speedMult || 1)) * (1 + (cfg.ramp || 0.16) * prog);
        w.x += speed;
        const px = SideWall.playerWorldX(g);
        const maxLead = cfg.maxLead || 640;
        if (px - w.x > maxLead) w.x = px - maxLead;

        const gap = px - w.x;
        if (gap < 260) {
            g.screenShake = Math.max(g.screenShake, (260 - gap) / 40);
            if (!w.warned) {
                w.warned = true;
                g.showMemePopup(cfg.theme === 'avalanche' ? '🌨️ DIE LAWINE IST DIREKT HINTER DIR — LAUF!' : '🔥 DIE LAVA-WAND IST DIREKT HINTER DIR — LAUF!');
            }
        } else if (gap > 420) {
            w.warned = false;
        }
        // Embers / snow dust thrown ahead of the wall
        const sx = w.x - g.worldDistance;
        if (sx > -80 && Math.random() < 0.6) {
            g.particles.push({
                x: sx + Math.random() * 30, y: Math.random() * g.player.groundY,
                vx: 2 + Math.random() * 4, vy: -1 - Math.random() * 2,
                life: 22, maxLife: 22,
                color: cfg.theme === 'avalanche' ? '#ffffff' : (Math.random() < 0.5 ? '#ffd32a' : '#ff6348'),
                size: 4 + Math.random() * 5
            });
        }

        if (gap <= 18) {
            g.lastDamageReason = cfg.theme === 'avalanche' ? 'avalanche_wall' : 'lava_wall';
            g.player.hp = 0;
            g.updateBars();
            window.soundManager.playLavaSplash();
            g.triggerGameOver();
            // "Zweite Chance" revive: give the player room to get going again
            if (g.state === GAME_STATE.RUNNING) w.x -= 520;
        }
    },

    draw(g) {
        const w = g.sideWall;
        if (!w || g.state !== GAME_STATE.RUNNING) return;
        const snowy = w.cfg.theme === 'avalanche';
        const sx = w.x - g.worldDistance;
        const H = canvas.height;
        const t = g.animClock;

        if (sx > -70) {
            ctx.save();
            const grad = ctx.createLinearGradient(sx - 260, 0, sx + 40, 0);
            if (snowy) {
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.8, '#e8f2ff');
                grad.addColorStop(1, 'rgba(232, 242, 255, 0.9)');
            } else {
                grad.addColorStop(0, '#8c1010');
                grad.addColorStop(0.7, '#ff6348');
                grad.addColorStop(1, '#ffd32a');
            }
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(sx, -10);
            for (let y = 0; y <= H + 24; y += 24) {
                ctx.lineTo(sx + 22 + Math.sin(t * 6 + y * 0.045) * 20 + Math.sin(t * 11 + y * 0.11) * 8, y);
            }
            ctx.lineTo(-10, H + 10);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = snowy ? 'rgba(160, 190, 230, 0.9)' : 'rgba(255, 240, 150, 0.95)';
            ctx.lineWidth = 5;
            ctx.stroke();
            // Rolling blobs on the leading edge
            ctx.fillStyle = snowy ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 211, 42, 0.85)';
            for (let i = 0; i < 9; i++) {
                const by = ((i * 97 + t * 90) % (H + 60)) - 30;
                ctx.beginPath();
                ctx.arc(sx + 18 + Math.sin(t * 5 + i) * 14, by, 16 + (i % 3) * 7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Distance marker while the wall is still off-screen
        const gapM = Math.max(0, Math.round((SideWall.playerWorldX(g) - w.x) / 40));
        if (sx < 30) {
            g.drawNamePill(`◀ ${snowy ? '🌨️ LAWINE' : '🔥 LAVA-WAND'} ${gapM}m`, 110, g.player.groundY - g.player.h - 60, snowy ? '#45aaf2' : '#ff4757');
        }
    }
};

Object.assign(Game.prototype.customLoseTexts, {
    lava_wall: {
        badge: 'DER BODEN IST LAVA',
        title: '🔥 VON DER LAVA-WAND VERSCHLUCKT!',
        desc: 'Die Wand rollt von links heran und wird immer schneller. Bleib in Bewegung, nimm Sprint-Felder mit und verliere keine Zeit in den Gruben.',
        quote: '"Alles brennt — und zwar von der Seite!"',
        clip: 'thenerean_alles_brennt'
    },
    avalanche_wall: {
        badge: 'VERSCHÜTTET',
        title: '🌨️ VON DER LAWINE ÜBERROLLT!',
        desc: 'Die Lawine kommt von links und wird immer schneller. Nicht stehen bleiben, über die Spalten springen und den Dash [SHIFT] nutzen.',
        quote: '"Morgartenstrasse isch blockiert — jetzt au no de ganz Berg!"',
        clip: 'thenerean_morgarten_blockiert'
    },
    snow_time: {
        badge: 'SCHNEEBALLSCHLACHT VERLOREN',
        title: '❄️ ZU WENIG TREFFER!',
        desc: 'Klettere auf die Plattform, die zur Höhe der Schneeburg passt, und wirf mit [E]. Schneemänner nicht treffen — das kostet Zeit.',
        quote: '"Ich will Fortnite und TikTok spiele — und du triffsch nüt!"',
        clip: 'student_cringe_king'
    }
});

// =========================================================================
// 2. SNOWBALL FIGHT
// =========================================================================
const SNOW_CAST = {
    student: { idle: 'gibb_student_idle', windup: 'gibb_student_windup', attack: 'gibb_student_attack', name: 'GIBB SCHÜLER' },
    adam: { idle: 'adam_idle', windup: 'adam_windup', attack: 'adam_throw', name: 'HERR ADAM' },
    monika: { idle: 'monika_idle', windup: 'monika_point', attack: 'monika_attack', name: 'MONIKA' },
    sahur: { idle: 'sahur_idle', windup: 'sahur_idle', attack: 'sahur_attack', name: 'TUNG SAHUR' }
};

const Snow = {
    isActive(g) {
        return Boolean(g.snow && g.level && g.level.mode === 'snowball');
    },

    scale() {
        return Math.max(0.78, Math.min(1.38, canvas.height / 720));
    },

    // Height (above the ground) of the player's throw line when standing `platOff` px up
    throwLine(g, platOff) {
        return platOff + g.player.h * 0.62 - 22;
    },

    init() {
        const cfg = { hits: 16, timeLimitSec: 70, spawnEvery: 95, maxUp: 2, aimFrames: 60, cast: ['student'], decoys: 0.12, ...(this.level.snowball || {}) };
        const sc = Snow.scale();
        const gy = this.player.groundY;
        const W = canvas.width;
        const offLow = Math.round(112 * sc);
        const offHigh = Math.round(218 * sc);

        this.platforms = [
            { x: Math.round(W * 0.07), y: gy - offLow, offsetY: offLow, w: Math.round(160 * sc), h: 22, style: 'concrete' },
            { x: Math.round(W * 0.25), y: gy - offHigh, offsetY: offHigh, w: Math.round(160 * sc), h: 22, style: 'concrete' }
        ];
        const lines = [Snow.throwLine(this, 0), Snow.throwLine(this, offLow), Snow.throwLine(this, offHigh)];
        // Forts: fx = screen fraction, tier = which throw line hits it
        const forts = [
            { fx: 0.55, tier: 0 }, { fx: 0.63, tier: 1 }, { fx: 0.71, tier: 2 },
            { fx: 0.79, tier: 0 }, { fx: 0.87, tier: 1 }, { fx: 0.95, tier: 2 }
        ].map((f) => ({ ...f, line: lines[f.tier], busy: false }));

        this.snow = { cfg, forts, pops: [], hits: 0, spawnTimer: 70, sc };
        this.timeRemaining = cfg.timeLimitSec;
        this.lastTickSec = Math.ceil(this.timeRemaining);
        this.player.x = Math.round(W * 0.16);
        this.ui.progBar.style.width = '0%';
        this.ui.progValText.textContent = `0/${cfg.hits}`;
    },

    update(dt) {
        const g = this;
        const sn = g.snow;
        const p = g.player;
        const cfg = sn.cfg;
        const gy = p.groundY;
        const W = canvas.width;
        const diff = g.getActiveDifficulty();

        // Clock
        g.timeRemaining = Math.max(0, g.timeRemaining - dt);
        const secCeil = Math.ceil(g.timeRemaining);
        if (secCeil !== g.lastTickSec) {
            g.lastTickSec = secCeil;
            if (secCeil <= 6 && secCeil > 0) window.soundManager.playWarningTick();
        }
        if (g.timeRemaining <= 0) {
            g.lastDamageReason = 'snow_time';
            g.triggerGameOver();
            return;
        }

        // Player movement: left half of the screen, two platforms to climb
        if (p.sprintTimer > 0) p.sprintTimer--;
        const speedMult = p.sprintTimer > 0 ? 1.4 : 1;
        if (g.keys['arrowright'] || g.keys['d']) { p.vx = p.speed * speedMult; p.facing = 1; }
        else if (g.keys['arrowleft'] || g.keys['a']) { p.vx = -p.speed * speedMult; }
        else p.vx = 0;
        g.applyDashMove();
        if (p.isDucking && p.isGrounded) p.vx *= 0.8;
        else if (p.isDucking && !p.isGrounded && p.vy > -1) p.vy += 0.45;
        p.facing = 1;

        const prevBottom = p.y + p.h;
        p.x = Math.max(24, Math.min(W * 0.44 - p.w, p.x + p.vx));
        p.y += p.vy;
        p.vy += 0.68;
        p.isGrounded = false;
        p.standingPlatform = null;
        const dropThrough = p.isDucking && (g.keys['arrowdown'] || g.touchDuckHeld);
        if (!dropThrough) {
            for (const plat of g.platforms) {
                if (p.x + p.w - 14 > plat.x && p.x + 14 < plat.x + plat.w && p.vy >= 0 && prevBottom <= plat.y + 18 && p.y + p.h >= plat.y) {
                    p.y = plat.y - p.h;
                    p.vy = 0;
                    p.isGrounded = true;
                    p.standingPlatform = plat;
                    break;
                }
            }
        }
        if (!p.isGrounded && p.y >= gy - p.h) {
            p.y = gy - p.h;
            p.vy = 0;
            p.isGrounded = true;
        }
        if (p.isGrounded && p.jumpBuffered) {
            p.jumpBuffered = false;
            g.playerJump();
        }

        // Spawn rivals behind free forts
        sn.spawnTimer--;
        if (sn.spawnTimer <= 0 && sn.pops.length < cfg.maxUp) {
            const free = sn.forts.filter((f) => !f.busy);
            if (free.length) {
                const fort = free[Math.floor(Math.random() * free.length)];
                fort.busy = true;
                const decoy = Math.random() < cfg.decoys;
                sn.pops.push({
                    fort, decoy,
                    who: cfg.cast[Math.floor(Math.random() * cfg.cast.length)],
                    phase: 'rise', timer: 16, rise: 0, hitFlash: 0
                });
            }
            sn.spawnTimer = Math.round((cfg.spawnEvery * (0.7 + Math.random() * 0.6)) / (diff.aggroMult || 1));
        }

        const sc = sn.sc;
        const bodyH = 150 * sc;
        for (let i = sn.pops.length - 1; i >= 0; i--) {
            const e = sn.pops[i];
            const fx = e.fort.fx * W;
            const cy = gy - e.fort.line;
            e.timer--;
            if (e.hitFlash > 0) e.hitFlash--;
            if (e.phase === 'rise') {
                e.rise = 1 - e.timer / 16;
                if (e.timer <= 0) { e.phase = 'aim'; e.timer = e.decoy ? 150 : Math.round(cfg.aimFrames / (diff.aggroMult || 1)); e.rise = 1; }
            } else if (e.phase === 'aim') {
                if (e.timer <= 0) {
                    if (!e.decoy) Snow.enemyThrow(g, e, fx, cy);
                    e.phase = 'linger';
                    e.timer = e.decoy ? 1 : 42;
                }
            } else if (e.phase === 'linger') {
                if (e.timer <= 0) { e.phase = 'hide'; e.timer = 16; }
            } else if (e.phase === 'hide' || e.phase === 'ko') {
                e.rise = Math.max(0, e.timer / 16);
                if (e.timer <= 0) {
                    e.fort.busy = false;
                    sn.pops.splice(i, 1);
                    continue;
                }
            }
            e.box = { x: fx - 38 * sc, y: cy - bodyH * 0.42, w: 76 * sc, h: bodyH * 0.7 };
        }

        // Thenerean's throws against the rivals
        for (let i = g.projectiles.length - 1; i >= 0; i--) {
            const pr = g.projectiles[i];
            if (!pr.isPlayer) continue;
            for (const e of sn.pops) {
                if (e.phase !== 'aim' && e.phase !== 'linger') continue;
                if (pr.hitPops && pr.hitPops.includes(e)) continue;
                if (!g.checkCollision(pr.x, pr.y, pr.w, pr.h, e.box.x, e.box.y, e.box.w, e.box.h)) continue;
                e.phase = 'ko';
                e.timer = 16;
                e.hitFlash = 10;
                const cx = e.box.x + e.box.w * 0.5;
                g.spawnBurst(cx, e.box.y + e.box.h * 0.4, 18, '#ffffff', 8, 20);
                window.soundManager.playTargetHit();
                if (e.decoy) {
                    g.timeRemaining = Math.max(0, g.timeRemaining - 3);
                    g.comboCount = 0;
                    g.updateComboAndPowerHUD();
                    g.addFloatingText('⛄ SCHNEEMANN! −3s', cx, e.box.y - 10, '#ff4757', 22);
                } else {
                    sn.hits++;
                    g.registerCombo(1, `❄️ TREFFER ${sn.hits}/${cfg.hits}`);
                    g.addCoins(1, { raw: true });
                    if (g.meta) g.meta.stats.kills++;
                }
                if (pr.type === 'mega_beam') {
                    (pr.hitPops = pr.hitPops || []).push(e);
                } else {
                    g.projectiles.splice(i, 1);
                }
                break;
            }
        }

        const prog = Math.min(100, (sn.hits / cfg.hits) * 100);
        g.ui.progBar.style.width = `${prog}%`;
        g.ui.progValText.textContent = `${sn.hits}/${cfg.hits}`;
        g.updateMissionPill();
        g.tickPlayerBanter();

        if (sn.hits >= cfg.hits) {
            if (g.timeRemaining >= cfg.timeLimitSec * 0.25) g.player.score = Math.min(6.0, +(g.player.score + 0.3).toFixed(1));
            g.updateBars();
            g.projectiles = [];
            window.soundManager.playWaveClear();
            g.triggerLevelWin();
            return;
        }
        g.updateProjectiles();
    },

    enemyThrow(g, e, fx, cy) {
        const p = g.player;
        const diff = g.getActiveDifficulty();
        const tx = p.x + p.w * 0.5;
        const ty = p.y + p.h * 0.45;
        const speed = (e.who === 'monika' ? 11 : 8.6) * (diff.projSpeedMult || 1);
        const dmg = Math.max(6, Math.round(11 * (diff.dmgMult || 1)));
        const shots = e.who === 'adam' ? [-0.16, 0, 0.16] : (e.who === 'sahur' ? [-0.09, 0.09] : [0]);
        const base = Math.atan2(ty - cy, tx - fx);
        for (const off of shots) {
            const type = e.who === 'adam' ? 'frisbee' : (e.who === 'monika' ? 'red_card' : 'snowball');
            g.projectiles.push({
                x: fx - 16, y: cy - 16, w: 32, h: 32,
                vx: Math.cos(base + off) * speed, vy: Math.sin(base + off) * speed,
                type, isPlayer: false, damage: dmg, rotation: 0, trailColor: '#dfe9f5'
            });
        }
        window.soundManager.playThrow();
    },

    pill() {
        const sn = this.snow;
        if (!sn) return null;
        return {
            icon: '❄️',
            text: `TREFFER ${sn.hits}/${sn.cfg.hits} • ${Math.max(0, this.timeRemaining).toFixed(1)}s`,
            urgent: this.timeRemaining <= 8,
            highlight: sn.hits >= sn.cfg.hits - 2
        };
    },

    render() {
        const g = this;
        const sn = g.snow;
        if (!sn) return;
        const p = g.player;
        const gy = p.groundY;
        const W = canvas.width;
        const sc = sn.sc;

        // Snow field
        const ground = ctx.createLinearGradient(0, gy - 8, 0, canvas.height);
        ground.addColorStop(0, '#ffffff');
        ground.addColorStop(1, '#cfdff0');
        ctx.fillStyle = ground;
        ctx.fillRect(0, gy - 4, W, canvas.height - gy + 4);
        g.drawPlatforms();

        // Player's own snow wall in the middle of the field
        Snow.drawFort(W * 0.47, gy, 70 * sc, 78 * sc);

        const bodyH = 150 * sc;
        for (const fort of sn.forts) {
            const fx = fort.fx * W;
            const baseY = gy - fort.line + bodyH * 0.38;
            // Raised forts stand on a snow pillar
            if (fort.tier > 0) {
                ctx.fillStyle = 'rgba(235, 244, 255, 0.92)';
                ctx.strokeStyle = '#8fa8c4';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(fx - 46 * sc, baseY, 92 * sc, gy - baseY + 6, 14);
                ctx.fill();
                ctx.stroke();
            }
            const e = sn.pops.find((q) => q.fort === fort);
            if (e) {
                const lift = (1 - e.rise) * bodyH * 0.8;
                ctx.save();
                ctx.beginPath();
                ctx.rect(fx - 120 * sc, baseY - bodyH - 40, 240 * sc, bodyH + 40);
                ctx.clip();
                if (e.decoy) {
                    ctx.font = `${Math.round(96 * sc)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'alphabetic';
                    ctx.fillText('⛄', fx, baseY - 14 * sc + lift);
                } else {
                    const cast = SNOW_CAST[e.who] || SNOW_CAST.student;
                    const key = e.phase === 'aim' ? (e.timer < 22 ? cast.windup : cast.idle) : (e.phase === 'linger' ? cast.attack : cast.idle);
                    const tilt = e.phase === 'ko' ? 0.5 : 0;
                    g.drawCharacterSprite(images[key] || images.gibb_student_idle, fx, baseY + bodyH * 0.17 + lift, bodyH, 1, e.hitFlash, 1, 1, tilt);
                }
                ctx.restore();
                if (!e.decoy && e.phase === 'aim' && e.timer < 26 && Math.floor(g.animClock * 12) % 2 === 0) {
                    g.drawNamePill('⚠ WURF!', fx, baseY - bodyH * 0.7, '#ff4757');
                }
            }
            Snow.drawFort(fx, baseY + 6, 50 * sc, 46 * sc);
        }

        g.drawShockwaves();
        g.drawPlayer();
        g.drawPlayerStatus();
        g.drawProjectiles();
        g.drawParticles();
        g.drawFloatingTexts();
    },

    drawFort(cx, baseY, halfW, h) {
        ctx.save();
        ctx.fillStyle = '#f4f9ff';
        ctx.strokeStyle = '#8fa8c4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - halfW, baseY);
        ctx.lineTo(cx - halfW * 0.86, baseY - h * 0.8);
        ctx.quadraticCurveTo(cx - halfW * 0.4, baseY - h * 1.1, cx, baseY - h * 0.92);
        ctx.quadraticCurveTo(cx + halfW * 0.5, baseY - h * 1.12, cx + halfW * 0.86, baseY - h * 0.8);
        ctx.lineTo(cx + halfW, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(143, 168, 196, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - halfW * 0.8, baseY - h * 0.42);
        ctx.lineTo(cx + halfW * 0.8, baseY - h * 0.42);
        ctx.stroke();
        ctx.restore();
    }
};

Game.prototype.customModes.snowball = {
    hint: '<kbd>A</kbd><kbd>D</kbd> Laufen &bull; <kbd>SPACE</kbd> Springen &bull; <kbd>E</kbd> Werfen (auf gleicher Höhe wie die Schneeburg!) &bull; <kbd>R</kbd> Block &bull; <kbd>CTRL</kbd> Ducken &bull; ⛄ nicht treffen',
    init: Snow.init,
    update: Snow.update,
    render: Snow.render,
    pill: Snow.pill
};

(function wrapModes() {
    const P = Game.prototype;
    const wrap = (name, fn) => {
        const orig = P[name];
        P[name] = function (...args) { return fn.call(this, orig.bind(this), ...args); };
    };

    wrap('resetRunStats', function (orig) {
        orig();
        this.sideWall = null;
        this.snow = null;
    });

    wrap('startLevel', function (orig, index) {
        orig(index);
        SideWall.start(this);
        if (this.sideWall) this.updateMissionPill();
    });

    wrap('update', function (orig, dt) {
        const wasPaused = this.isPaused;
        orig(dt);
        if (!wasPaused && !this.isPaused) SideWall.tick(this);
    });

    wrap('drawProjectiles', function (orig) {
        orig();
        SideWall.draw(this);
    });

    wrap('drawSpecialProjectile', function (orig, proj) {
        if (proj.type !== 'snowball') return orig(proj);
        const cx = proj.x + proj.w / 2;
        const cy = proj.y + proj.h / 2;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#8fa8c4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, proj.w * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        return true;
    });

    wrap('updateMissionPill', function (orig) {
        orig();
        const w = this.sideWall;
        if (!w || this.state !== GAME_STATE.RUNNING || !this.ui.missionPill) return;
        const gapM = Math.max(0, Math.round((SideWall.playerWorldX(this) - w.x) / 40));
        const remM = Math.max(0, Math.round((this.level.targetDistance - this.worldDistance) / 40));
        const snowy = w.cfg.theme === 'avalanche';
        this.ui.missionPill.classList.remove('hidden', 'boss-side', 'highlight-ready');
        this.ui.missionPill.classList.toggle('urgent', gapM <= 5);
        if (this.ui.missionIcon) this.ui.missionIcon.textContent = snowy ? '🌨️' : '🔥';
        if (this.ui.missionText) this.ui.missionText.textContent = `${snowy ? 'LAWINE' : 'LAVA-WAND'} ${gapM}m HINTER DIR • ZIEL ${remM}m`;
    });
})();
