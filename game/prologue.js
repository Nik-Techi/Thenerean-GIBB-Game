/**
 * Thenerean Selvabankumar — animated story intro ("Lehre starten")
 *
 * Replaces the text-only Chapter 1 trailer with a staged cutscene on the game canvas:
 * the bus drops Thenerean off late, Monika Schneider walks in, Herr Adam jogs in,
 * they argue, frisbees fly — and then Level 1 starts.
 *
 * The scene is a list of beats. Each beat moves actors, sets poses, shows one speech
 * bubble and plays one voice clip. ENTER / click = next beat, ESC / SPACE = skip.
 */

GAME_STATE.PROLOGUE = 11;

// Monika, Adam sprites face LEFT in their source art; Thenerean faces RIGHT.
const PROLOGUE_CAST = {
    thenerean: { name: 'THENEREAN', color: '#2ed573', nativeFacing: 1, h: 1.0, walk: ['thenerean_run', 'thenerean_idle'], idle: 'thenerean_idle' },
    monika: { name: 'MONIKA SCHNEIDER', color: '#ff4757', nativeFacing: -1, h: 1.04, walk: ['monika_walk', 'monika_idle'], idle: 'monika_idle' },
    adam: { name: 'HERR ADAM', color: '#45aaf2', nativeFacing: -1, h: 1.08, walk: ['adam_run', 'adam_idle'], idle: 'adam_idle' }
};

// x positions are fractions of the screen width; `to` walks there, `at` teleports.
const PROLOGUE_BEATS = [
    {
        dur: 4.2, caption: 'MONTAG, 08:03 UHR — BERUFSSCHULE GIBB BERN',
        bus: 'arrive'
    },
    {
        dur: 4.4, bus: 'leave',
        move: { thenerean: { at: 0.2, to: 0.4, show: true } },
        say: { who: 'thenerean', text: "Entschuldigung, ich bi 4 Minute später! De Bus isch schuld!", clip: 'thenerean_entschuldigung' }
    },
    {
        dur: 4.6,
        move: { monika: { at: 1.12, to: 0.68, show: true } },
        pose: { thenerean: 'thenerean_idle' },
        say: { who: 'monika', text: "Pünktlichkeit ist oberste Gebot!", clip: 'monika_puenktlichkeit', poseAfterWalk: 'monika_point' }
    },
    {
        dur: 4.4,
        pose: { thenerean: 'thenerean_attack', monika: 'monika_idle' },
        say: { who: 'thenerean', text: "Ich bi genau 2.54 später! D'Morgartenstrasse isch kaputt und blockiert!", clip: 'thenerean_254' }
    },
    {
        dur: 4.4,
        pose: { thenerean: 'thenerean_idle', monika: 'monika_attack' },
        shake: 8,
        say: { who: 'monika', text: "Du bisch z'spät, da git's nüt z'dischputiere!", clip: 'monika_zspaet' }
    },
    {
        dur: 4.6,
        move: { adam: { at: -0.14, to: 0.14, show: true } },
        pose: { monika: 'monika_idle' },
        face: { thenerean: -1 },
        say: { who: 'adam', text: "Silvankumar, ist der Thenerean da?!", clip: 'adam_silvankumar' }
    },
    {
        dur: 4.2,
        pose: { thenerean: 'thenerean_attack', adam: 'adam_idle' },
        shake: 22, shout: true,
        say: { who: 'thenerean', text: "HERR ADAM, ICH STAH DOCH DA!!", clip: 'thenerean_stah', big: true }
    },
    {
        dur: 4.8,
        pose: { adam: 'adam_windup', thenerean: 'thenerean_idle' },
        frisbees: true,
        say: { who: 'adam', text: "Da hast du 20 Frisbees!!", clip: 'adam_20_frisbees' }
    },
    {
        dur: 5.0,
        pose: { adam: 'adam_idle', monika: 'monika_point', thenerean: 'thenerean_idle' },
        face: { thenerean: 1 },
        say: { who: 'monika', text: "Wenn du dis EFZ willsch, muesch an üs verbi — dur alli Lehrjahr! Dini Lehrziit gaht i d'Altstadt abe!", clip: 'monika_altstadt_lehre' }
    },
    {
        dur: 4.4,
        pose: { thenerean: 'thenerean_block', monika: 'monika_idle' },
        say: { who: 'thenerean', text: "Niemert chunt an mir verbi! Ich hol mir d'Note 6.0!", clip: 'thenerean_niemert_verbi' }
    },
    {
        dur: 3.2, caption: 'DAS GIBB ABENTEUER BEGINNT — 1. LEHRJAHR!',
        move: { thenerean: { to: 1.2, run: true }, monika: { to: 1.25 }, adam: { to: 1.3 } }
    }
];

const Prologue = {
    start(g, targetLevelIndex) {
        g.state = GAME_STATE.PROLOGUE;
        for (const el of [g.ui.screenMenu, g.ui.screenPrestart, g.ui.screenChapters, g.ui.screenStory, g.ui.screenLvlSelect, g.ui.screenIntro]) {
            if (el) el.classList.add('hidden');
        }
        g.resizeCanvas();
        g.prologue = {
            target: targetLevelIndex || 0,
            beat: -1,
            beatTime: 0,
            actors: {},
            bus: { x: -0.5, state: 'off' },
            frisbees: [],
            shake: 0,
            flash: 0,
            fade: 1
        };
        for (const key of Object.keys(PROLOGUE_CAST)) {
            g.prologue.actors[key] = { key, x: -1, to: -1, show: false, pose: null, face: 0, run: false, walking: false, poseAfterWalk: null };
        }
        Prologue.ensureDom(g);
        g.prologueEl.classList.remove('hidden');
        window.soundManager.setMusicQuietMode(true);
        window.soundManager.playMusic('assets/music/That_s_The_One.mp3');
        Prologue.nextBeat(g);
    },

    ensureDom(g) {
        if (g.prologueEl) return;
        const el = document.createElement('div');
        el.id = 'prologue-controls';
        el.className = 'prologue-controls hidden';
        el.innerHTML = '<button type="button" class="btn btn-demo btn-sm" data-act="next">WEITER [ENTER] ▶</button>' +
            '<button type="button" class="btn btn-primary btn-sm" data-act="skip">ÜBERSPRINGEN &amp; SPIELEN [ESC] ▶</button>';
        document.getElementById('game-container').appendChild(el);
        el.querySelector('[data-act="next"]').addEventListener('click', () => Prologue.nextBeat(g));
        el.querySelector('[data-act="skip"]').addEventListener('click', () => Prologue.finish(g));
        g.prologueEl = el;
    },

    nextBeat(g) {
        const pr = g.prologue;
        if (!pr || g.state !== GAME_STATE.PROLOGUE) return;
        // Finish any walk that was cut short so actors never end up in the wrong place
        for (const a of Object.values(pr.actors)) {
            if (a.walking) { a.x = a.to; a.walking = false; if (a.poseAfterWalk) { a.pose = a.poseAfterWalk; a.poseAfterWalk = null; } }
        }
        pr.beat++;
        pr.beatTime = 0;
        const beat = PROLOGUE_BEATS[pr.beat];
        if (!beat) {
            Prologue.finish(g);
            return;
        }
        window.soundManager.stopAllClips();
        if (beat.bus === 'arrive') { pr.bus.state = 'arrive'; pr.bus.x = -0.5; }
        if (beat.bus === 'leave') pr.bus.state = 'leave';
        for (const [key, m] of Object.entries(beat.move || {})) {
            const a = pr.actors[key];
            if (m.show) a.show = true;
            if (m.at !== undefined) a.x = m.at;
            if (m.to !== undefined) { a.to = m.to; a.walking = true; }
            a.run = Boolean(m.run);
            a.pose = null;
        }
        for (const [key, pose] of Object.entries(beat.pose || {})) pr.actors[key].pose = pose;
        for (const [key, face] of Object.entries(beat.face || {})) pr.actors[key].face = face;
        if (beat.say && beat.say.poseAfterWalk) pr.actors[beat.say.who].poseAfterWalk = beat.say.poseAfterWalk;
        if (beat.shake) pr.shake = beat.shake;
        if (beat.shout) {
            pr.flash = 18;
            g.shoutAvatarTimer = 0;
        }
        if (beat.frisbees) pr.frisbeeTimer = 0.9;
        // Let a voice line finish before the scene moves on
        pr.beatDur = beat.dur;
        if (beat.say && beat.say.clip) {
            window.soundManager.playClip(beat.say.clip, null, 1.0, { forceSolo: true });
            const audio = window.soundManager.clips[beat.say.clip];
            if (window.soundManager.enabled && audio && isFinite(audio.duration)) {
                pr.beatDur = Math.min(9, Math.max(beat.dur, audio.duration + 0.7));
            }
        }
        const btn = g.prologueEl && g.prologueEl.querySelector('[data-act="next"]');
        if (btn) btn.textContent = pr.beat + 1 >= PROLOGUE_BEATS.length ? 'INS LEVEL 1 ▶' : 'WEITER [ENTER] ▶';
    },

    finish(g) {
        const pr = g.prologue;
        if (!pr) return;
        g.prologue = null;
        window.soundManager.stopAllClips();
        if (g.prologueEl) g.prologueEl.classList.add('hidden');
        g.startLevel(pr.target);
    },

    update(g, dt) {
        const pr = g.prologue;
        if (!pr) return;
        const beat = PROLOGUE_BEATS[pr.beat];
        pr.beatTime += dt;
        pr.fade = Math.max(0, pr.fade - dt * 1.4);
        if (pr.shake > 0) pr.shake *= 0.9;
        if (pr.flash > 0) pr.flash--;

        // Bus drives in, waits, drives off
        if (pr.bus.state === 'arrive') {
            pr.bus.x += (0.2 - pr.bus.x) * Math.min(1, dt * 2.6);
            if (Math.abs(pr.bus.x - 0.2) < 0.004) pr.bus.state = 'wait';
        } else if (pr.bus.state === 'leave') {
            pr.bus.x += dt * (0.25 + (pr.bus.x - 0.2) * 2.2);
            if (pr.bus.x > 1.5) pr.bus.state = 'off';
        }

        for (const a of Object.values(pr.actors)) {
            if (!a.walking) continue;
            const speed = (a.run ? 0.62 : 0.3) * dt;
            const dx = a.to - a.x;
            if (Math.abs(dx) <= speed) {
                a.x = a.to;
                a.walking = false;
                if (a.poseAfterWalk) { a.pose = a.poseAfterWalk; a.poseAfterWalk = null; }
            } else {
                a.x += Math.sign(dx) * speed;
                a.face = Math.sign(dx);
            }
        }

        // Herr Adam's frisbee volley over Thenerean's head
        if (beat && beat.frisbees) {
            pr.frisbeeTimer -= dt;
            const adam = pr.actors.adam;
            const then = pr.actors.thenerean;
            if (pr.beatTime > 0.9) {
                adam.pose = 'adam_throw';
                then.pose = 'thenerean_duck';
                if (pr.frisbeeTimer <= 0 && pr.frisbees.length < 20) {
                    pr.frisbeeTimer = 0.11;
                    pr.frisbees.push({ x: adam.x + 0.04, y: 0.42 + Math.random() * 0.2, vx: 0.9 + Math.random() * 0.5, rot: Math.random() * 6 });
                    if (pr.frisbees.length % 3 === 1) window.soundManager.playThrow();
                }
            }
        }
        for (let i = pr.frisbees.length - 1; i >= 0; i--) {
            const f = pr.frisbees[i];
            f.x += f.vx * dt;
            f.rot += dt * 14;
            if (f.x > 1.2) pr.frisbees.splice(i, 1);
        }

        if (beat && pr.beatTime >= pr.beatDur) Prologue.nextBeat(g);
    },

    render(g) {
        const pr = g.prologue;
        if (!pr) return;
        const W = canvas.width;
        const H = canvas.height;
        const beat = PROLOGUE_BEATS[pr.beat] || {};
        const sc = Math.max(0.78, Math.min(1.38, H / 720));
        const gy = H * 0.76;
        const t = g.animClock;

        ctx.clearRect(0, 0, W, H);
        ctx.save();
        if (pr.shake > 0.3) ctx.translate((Math.random() - 0.5) * pr.shake, (Math.random() - 0.5) * pr.shake);

        // Stage: GIBB entrance, slow push-in
        const bg = images.bg_gibb_entrance;
        if (bg && bg.complete && bg.naturalWidth > 0) {
            const zoom = 1.06 + Math.min(0.06, pr.beat * 0.006);
            const scale = Math.max(W / bg.naturalWidth, H / bg.naturalHeight) * zoom;
            const dw = bg.naturalWidth * scale;
            const dh = bg.naturalHeight * scale;
            ctx.drawImage(bg, (W - dw) * 0.5, Math.min(0, gy - dh * 0.74), dw, dh);
        } else {
            ctx.fillStyle = '#1e273d';
            ctx.fillRect(0, 0, W, H);
        }
        const floor = ctx.createLinearGradient(0, gy - 10, 0, H);
        floor.addColorStop(0, 'rgba(8, 10, 18, 0)');
        floor.addColorStop(1, 'rgba(5, 7, 14, 0.6)');
        ctx.fillStyle = floor;
        ctx.fillRect(0, gy - 10, W, H - gy + 10);

        // Bus (behind the actors)
        if (pr.bus.state !== 'off') Prologue.drawBus(pr.bus.x * W, gy + 6, sc, t, pr.bus.state !== 'wait');

        // Actors, the speaker is drawn last and slightly bigger
        const speaker = beat.say && beat.say.who;
        const order = Object.values(pr.actors).filter((a) => a.show).sort((a, b) => (a.key === speaker) - (b.key === speaker));
        for (const a of order) {
            const cast = PROLOGUE_CAST[a.key];
            const stride = Math.sin(t * (a.run ? 18 : 11));
            let key = a.pose || cast.idle;
            let bob = 0;
            if (a.walking) {
                key = stride > 0 ? cast.walk[0] : cast.walk[1];
                bob = Math.abs(stride) * 7 * sc;
            } else if (a.key === speaker) {
                bob = Math.abs(Math.sin(t * 9)) * 3 * sc;
            }
            const wantFacing = a.face || cast.nativeFacing;
            const flip = wantFacing === cast.nativeFacing ? 1 : -1;
            const h = 176 * sc * cast.h * (a.key === speaker ? 1.06 : 1);
            const ax = a.x * W;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
            ctx.beginPath();
            ctx.ellipse(ax, gy + 4, 46 * sc, 9 * sc, 0, 0, Math.PI * 2);
            ctx.fill();
            g.drawCharacterSprite(images[key] || images[cast.idle], ax, gy - bob, h, flip, 0, 1, 1, a.walking ? stride * 0.03 : 0);
        }

        for (const f of pr.frisbees) {
            const img = images.frisbee;
            if (!img || !img.complete) continue;
            ctx.save();
            ctx.translate(f.x * W, f.y * H);
            ctx.rotate(f.rot);
            ctx.drawImage(img, -30 * sc, -19 * sc, 60 * sc, 38 * sc);
            ctx.restore();
        }

        // Shout flash
        if (pr.flash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(pr.flash / 18) * 0.55})`;
            ctx.fillRect(0, 0, W, H);
        }
        ctx.restore();

        // Cinema bars
        const bar = Math.round(H * 0.085);
        ctx.fillStyle = '#05070c';
        ctx.fillRect(0, 0, W, bar);
        ctx.fillRect(0, H - bar, W, bar);

        // Speech bubble above the speaker
        if (beat.say && pr.actors[beat.say.who].show) {
            const a = pr.actors[beat.say.who];
            const cast = PROLOGUE_CAST[a.key];
            const shown = beat.say.text.slice(0, Math.floor(pr.beatTime * 46));
            Prologue.drawBubble(a.x * W, gy - 176 * sc * cast.h - 26 * sc, cast, shown, beat.say.text, sc, beat.say.big, bar);
        }

        // Caption card
        if (beat.caption) {
            const alpha = Math.min(1, pr.beatTime * 2.2) * Math.min(1, (pr.beatDur - pr.beatTime) * 2.2);
            ctx.save();
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.font = `900 ${Math.round(34 * sc)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const tw = ctx.measureText(beat.caption).width;
            ctx.fillStyle = 'rgba(8, 11, 18, 0.82)';
            ctx.beginPath();
            ctx.roundRect(W * 0.5 - tw * 0.5 - 30, H * 0.2 - 34 * sc, tw + 60, 68 * sc, 16);
            ctx.fill();
            ctx.fillStyle = '#ffd32a';
            ctx.fillText(beat.caption, W * 0.5, H * 0.2);
            ctx.restore();
        }

        // Progress dots
        const n = PROLOGUE_BEATS.length;
        for (let i = 0; i < n; i++) {
            ctx.fillStyle = i < pr.beat ? '#2ed573' : (i === pr.beat ? '#ffd32a' : 'rgba(255, 255, 255, 0.28)');
            ctx.beginPath();
            ctx.arc(W * 0.5 + (i - (n - 1) / 2) * 18, bar * 0.5, i === pr.beat ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();
        }

        if (pr.fade > 0) {
            ctx.fillStyle = `rgba(5, 7, 12, ${pr.fade})`;
            ctx.fillRect(0, 0, W, H);
        }
    },

    drawBus(x, groundY, sc, t, moving) {
        const w = 420 * sc;
        const h = 170 * sc;
        const y = groundY - h - 26 * sc + (moving ? Math.sin(t * 22) * 1.5 : 0);
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, groundY + 2, w * 0.52, 12 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f1f2f6';
        ctx.strokeStyle = '#11141e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(x - w * 0.5, y, w, h, 18 * sc);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(x - w * 0.5 + 2, y + h * 0.66, w - 4, h * 0.14);
        ctx.fillStyle = '#2f3542';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.roundRect(x - w * 0.5 + 22 * sc + i * w * 0.2, y + 18 * sc, w * 0.16, h * 0.36, 6);
            ctx.fill();
        }
        ctx.fillStyle = '#57606f';
        ctx.fillRect(x + w * 0.34, y + 16 * sc, w * 0.12, h * 0.72);
        ctx.fillStyle = '#11141e';
        ctx.fillRect(x - w * 0.5 + 16 * sc, y - 4 * sc, w * 0.5, 16 * sc);
        ctx.fillStyle = '#ffd32a';
        ctx.font = `900 ${Math.round(12 * sc)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('20 • GIBB LORRAINE', x - w * 0.5 + 22 * sc, y + 4 * sc);
        for (const wx of [x - w * 0.3, x + w * 0.3]) {
            ctx.fillStyle = '#11141e';
            ctx.beginPath();
            ctx.arc(wx, groundY - 24 * sc, 26 * sc, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#a4b0be';
            ctx.lineWidth = 4;
            ctx.beginPath();
            const spin = moving ? t * 12 : 0;
            ctx.moveTo(wx + Math.cos(spin) * 16 * sc, groundY - 24 * sc + Math.sin(spin) * 16 * sc);
            ctx.lineTo(wx - Math.cos(spin) * 16 * sc, groundY - 24 * sc - Math.sin(spin) * 16 * sc);
            ctx.stroke();
        }
        ctx.restore();
    },

    drawBubble(cx, bottomY, cast, shown, full, sc, big, topLimit) {
        const fontSize = Math.round((big ? 30 : 21) * sc);
        ctx.save();
        ctx.font = `800 ${fontSize}px sans-serif`;
        const maxW = Math.min(canvas.width * 0.42, 520 * sc);
        // Wrap on the full text so the bubble does not resize while typing
        const wrap = (text) => {
            const lines = [];
            let line = '';
            for (const word of text.split(' ')) {
                const test = line ? `${line} ${word}` : word;
                if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
                else line = test;
            }
            if (line) lines.push(line);
            return lines;
        };
        const fullLines = wrap(full);
        const lineH = fontSize * 1.28;
        const bw = Math.min(maxW, Math.max(...fullLines.map((l) => ctx.measureText(l).width))) + 44 * sc;
        const bh = fullLines.length * lineH + 54 * sc;
        const bx = Math.max(16, Math.min(canvas.width - bw - 16, cx - bw * 0.5));
        const by = Math.max(topLimit + 12, bottomY - bh);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#11141e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 20 * sc);
        ctx.fill();
        ctx.stroke();
        const tailX = Math.max(bx + 30, Math.min(bx + bw - 30, cx));
        ctx.beginPath();
        ctx.moveTo(tailX - 14 * sc, by + bh - 2);
        ctx.lineTo(tailX, by + bh + 20 * sc);
        ctx.lineTo(tailX + 14 * sc, by + bh - 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tailX - 14 * sc, by + bh);
        ctx.lineTo(tailX, by + bh + 20 * sc);
        ctx.lineTo(tailX + 14 * sc, by + bh);
        ctx.stroke();

        ctx.font = `900 ${Math.round(13 * sc)}px sans-serif`;
        const tagW = ctx.measureText(cast.name).width + 22 * sc;
        ctx.fillStyle = cast.color;
        ctx.beginPath();
        ctx.roundRect(bx + 16 * sc, by - 12 * sc, tagW, 26 * sc, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(cast.name, bx + 27 * sc, by + 1 * sc);

        ctx.font = `800 ${fontSize}px sans-serif`;
        ctx.fillStyle = '#11141e';
        ctx.textBaseline = 'top';
        let remaining = shown.length;
        fullLines.forEach((line, i) => {
            if (remaining <= 0) return;
            ctx.fillText(line.slice(0, remaining), bx + 22 * sc, by + 26 * sc + i * lineH);
            remaining -= line.length + 1;
        });
        ctx.restore();
    }
};

(function wrapPrologue() {
    const P = Game.prototype;
    const wrap = (name, fn) => {
        const orig = P[name];
        P[name] = function (...args) { return fn.call(this, orig.bind(this), ...args); };
    };

    // The Chapter 1 campaign start plays the animated intro; other chapters keep their trailers
    wrap('startCinematicIntro', function (orig, opts = {}) {
        const target = typeof opts.targetLevelIndex === 'number' ? opts.targetLevelIndex : 0;
        const chapter = opts.chapter || ((LEVELS_CONFIG[target] && LEVELS_CONFIG[target].chapter) || 1);
        if (chapter === 1 && !opts.randomChaos) Prologue.start(this, target);
        else orig(opts);
    });

    wrap('update', function (orig, dt) {
        if (this.state === GAME_STATE.PROLOGUE) {
            this.animClock += dt;
            Prologue.update(this, Math.min(dt, 0.05));
            return;
        }
        orig(dt);
    });

    wrap('render', function (orig) {
        if (this.state === GAME_STATE.PROLOGUE) Prologue.render(this);
        else orig();
    });

    wrap('returnToMenu', function (orig) {
        this.prologue = null;
        if (this.prologueEl) this.prologueEl.classList.add('hidden');
        orig();
    });

    window.addEventListener('keydown', (e) => {
        const g = window.game;
        if (!g || g.state !== GAME_STATE.PROLOGUE || e.repeat) return;
        if (e.key === 'Enter' || e.code === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            e.preventDefault();
            Prologue.nextBeat(g);
        } else if (e.key === 'Escape' || e.code === 'Space') {
            e.preventDefault();
            Prologue.finish(g);
        }
    });

    canvas.addEventListener('mousedown', () => {
        const g = window.game;
        if (g && g.state === GAME_STATE.PROLOGUE) Prologue.nextBeat(g);
    });
})();
