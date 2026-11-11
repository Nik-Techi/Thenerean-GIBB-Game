/**
 * Thenerean Selvabankumar — V9 "LEHRLINGSLOHN" Expansion
 *
 * Adds on top of the core engine (game.js) and boss AI (boss_ai.js):
 * - New core moves: DASH (Shift, i-frames, perfect dodge) and DOUBLE JUMP
 * - Game feel: critical hits, hit-stop, K.O. slow-motion
 * - Lehrlingslohn (coins) earned from K.O.s, level wins, items and achievements
 * - Mensa-Kiosk: permanent upgrades and unlocks bought with coins
 * - NACHSITZEN: endless roguelike arena with a perk pick after every wave
 * - Achievements (Erfolge) with coin rewards, plus lifetime statistics
 */

const META_STORAGE_KEY = 'thenerean_gibb_meta_v1';

const SHOP_ITEMS = [
    { id: 'hp',      icon: '❤️', name: 'Geduldsfaden',      desc: '+15 Max-HP pro Stufe',                     max: 5, base: 60 },
    { id: 'dmg',     icon: '📜', name: 'Gesetzes-Kraft',     desc: '+8% Schaden auf alle Angriffe',            max: 5, base: 80 },
    { id: 'regen',   icon: '⚡', name: 'Energy-Abo',         desc: '+15% Mega-Energie-Regeneration',           max: 5, base: 60 },
    { id: 'frisbee', icon: '🥏', name: 'Frisbee-Nachschub',  desc: '−8% Cooldown für die 20 Frisbees',         max: 5, base: 60 },
    { id: 'shield',  icon: '🛡️', name: 'Schild-Training',    desc: '−10% Cooldown für den Schild-Block',       max: 4, base: 60 },
    { id: 'crit',    icon: '💥', name: 'Volltreffer',        desc: '+4% Chance auf kritische Treffer (2×)',    max: 5, base: 80 },
    { id: 'dash',    icon: '💨', name: 'Turnschuhe',         desc: '−10% Dash-Cooldown',                       max: 4, base: 60 },
    { id: 'coins',   icon: '🪙', name: 'Lohnerhöhung',       desc: '+12% Lehrlingslohn aus allen Quellen',     max: 5, base: 90 },
    { id: 'triple',     icon: '🦘', name: 'Dreifachsprung',     desc: 'FREISCHALTUNG: ein zusätzlicher Luftsprung',              max: 1, base: 350, unlock: true },
    { id: 'startpower', icon: '🥤', name: 'Energy zum Zmorge',  desc: 'FREISCHALTUNG: jedes Level startet mit 8s Energy-Rush',   max: 1, base: 300, unlock: true },
    { id: 'dashstrike', icon: '⚔️', name: 'Konter-Dash',        desc: 'FREISCHALTUNG: Dash durch Gegner verursacht 45 Schaden',  max: 1, base: 400, unlock: true },
    { id: 'revive',     icon: '🍀', name: 'Zweite Chance',      desc: 'FREISCHALTUNG: 1× pro Level mit 50% HP wieder aufstehen', max: 1, base: 450, unlock: true }
];

const RUN_PERKS = [
    { id: 'dmg',     icon: '🔨', name: 'Gesetzes-Hammer',  desc: '+20% Schaden auf alles' },
    { id: 'hp',      icon: '🥐', name: 'Znüni-Pause',      desc: '+40 Max-HP und sofort 40 HP heilen' },
    { id: 'rapid',   icon: '📚', name: 'Schnellleser',     desc: 'Gesetzestext lädt 22% schneller nach' },
    { id: 'crit',    icon: '🎯', name: 'Volltreffer',      desc: '+12% Krit-Chance (2× Schaden)' },
    { id: 'vamp',    icon: '🧛', name: 'Energy-Vampir',    desc: '+1 HP pro Treffer am Gegner' },
    { id: 'multi',   icon: '📑', name: 'Doppel-Paragraph', desc: '+1 Gesetzestext pro Wurf' },
    { id: 'frisbee', icon: '🥏', name: '30 Frisbees!',     desc: '+10 Frisbees pro Salve' },
    { id: 'mega',    icon: '📢', name: 'Lautsprecher',     desc: 'Mega-Schrei: −8 Energie-Kosten, +30% Schaden' },
    { id: 'regen',   icon: '☕', name: 'Koffein-Tropf',    desc: '+60% Mega-Energie-Regeneration' },
    { id: 'dash',    icon: '👟', name: 'Sprint-Spikes',    desc: 'Dash lädt 30% schneller nach' },
    { id: 'jump',    icon: '🦘', name: 'Luftakrobat',      desc: '+1 zusätzlicher Luftsprung' },
    { id: 'shield',  icon: '🛡️', name: 'Stahl-Schild',     desc: 'Schild-Block lädt 30% schneller nach' },
    { id: 'strike',  icon: '⚔️', name: 'Konter-Dash',      desc: 'Dash durch Gegner: +45 Schaden' },
    { id: 'heal',    icon: '🍝', name: 'Mensa-Menü',       desc: 'Sofort 80 HP heilen', instant: true }
];

const ACHIEVEMENTS = [
    { id: 'first_win',  icon: '🎓', name: 'Erster Schultag',       desc: 'Schliesse dein erstes Level ab',                reward: 30,  test: (s) => s.wins >= 1 },
    { id: 'chapter1',   icon: '📖', name: 'Bern überlebt',         desc: 'Schliesse alle 10 Levels von Kapitel 1 ab',     reward: 90, test: (s, g) => g.countCleared(1, 10) >= 10 },
    { id: 'chapter2',   icon: '🚀', name: 'Melonen-Pilot',         desc: 'Schliesse alle 10 Levels von Kapitel 2 ab',     reward: 120, test: (s, g) => g.countCleared(11, 20) >= 10 },
    { id: 'chapter3',   icon: '🏆', name: 'EFZ in der Tasche',     desc: 'Schliesse alle 10 Levels von Kapitel 3 ab',     reward: 180, test: (s, g) => g.countCleared(21, 30) >= 10 },
    { id: 'grade6',     icon: '💯', name: 'Bestnote 6.0',          desc: 'Beende ein Level mit Note 6.0',                 reward: 60, test: (s) => s.grade6 >= 1 },
    { id: 'combo20',    icon: '🔥', name: 'Kombo-Lehrling',        desc: 'Erreiche eine 20er-Kombo',                      reward: 50,  test: (s) => s.bestCombo >= 20 },
    { id: 'combo50',    icon: '🌋', name: 'Kombo-Meister',         desc: 'Erreiche eine 50er-Kombo',                      reward: 120, test: (s) => s.bestCombo >= 50 },
    { id: 'dodge10',    icon: '💨', name: 'Nicht mit mir!',        desc: 'Weiche 10 Projektilen per Dash perfekt aus',    reward: 40,  test: (s) => s.dodges >= 10 },
    { id: 'pogo25',     icon: '🦘', name: 'Pogo-Profi',            desc: 'Lande 25 Pogo-Sprünge (↓ in der Luft auf ein Hindernis)', reward: 50,  test: (s) => s.pogos >= 25 },
    { id: 'block15',    icon: '🛡️', name: 'Niemert chunt verbi',   desc: 'Lande 15 Perfekt-Blocks',                       reward: 50,  test: (s) => s.perfectBlocks >= 15 },
    { id: 'nohit',      icon: '🧘', name: 'Die Ruhe selbst',       desc: 'Gewinne ein Boss-Level ohne einen Treffer',     reward: 90, test: (s) => s.noHitBossWins >= 1 },
    { id: 'crit100',    icon: '💥', name: 'Paragraphen-Reiter',    desc: 'Lande 100 kritische Treffer',                   reward: 50,  test: (s) => s.crits >= 100 },
    { id: 'kills50',    icon: '🥊', name: 'Klassensprecher',       desc: 'Besiege 50 Gegner',                             reward: 70, test: (s) => s.kills >= 50 },
    { id: 'hardwin',    icon: '😈', name: 'Freiwillig SCHWER',     desc: 'Gewinne ein Level auf SCHWER oder EXTREM',      reward: 90, test: (s) => s.hardWins >= 1 },
    { id: 'shop1',      icon: '🛒', name: 'Erster Lohn',           desc: 'Kaufe etwas im Mensa-Kiosk',                    reward: 20,  test: (s) => s.purchases >= 1 },
    { id: 'rich',       icon: '🤑', name: 'Selber Bankomat',       desc: 'Verdiene insgesamt 1500 CHF Lehrlingslohn',     reward: 60, test: (s) => s.coinsEarned >= 1500 },
    { id: 'endless5',   icon: '♾️', name: 'Nachsitzer',            desc: 'Überstehe 5 Wellen im Nachsitzen',              reward: 60, test: (s) => s.endlessBest >= 5 },
    { id: 'endless10',  icon: '⏳', name: 'Dauer-Nachsitzer',      desc: 'Überstehe 10 Wellen im Nachsitzen',             reward: 150, test: (s) => s.endlessBest >= 10 },
    { id: 'endless20',  icon: '👑', name: 'Legende vom Nachsitzen', desc: 'Überstehe 20 Wellen im Nachsitzen',            reward: 300, test: (s) => s.endlessBest >= 20 }
];

const DEFAULT_STATS = {
    wins: 0, kills: 0, crits: 0, dodges: 0, perfectBlocks: 0, bestCombo: 0, coinsEarned: 0,
    purchases: 0, endlessBest: 0, noHitBossWins: 0, grade6: 0, hardWins: 0, deaths: 0, dashes: 0,
    endlessRuns: 0, damageDealt: 0, pogos: 0
};

const DEFAULT_MODS = {
    dmgMult: 1, maxHp: 150, energyRegenMult: 1, frisbeeCdMult: 1, blockCdMult: 1, lawCdMult: 1,
    megaCost: 40, megaDmgMult: 1, critChance: 0.05, coinMult: 1, lifesteal: 0, frisbeeCount: 20,
    multiShot: 0, dashCd: 40, maxAirJumps: 1, dashDamage: 0
};

const ENDLESS_ARENAS = ['gym_turnhalle', 'abu_room', 'mensa_kiosk', 'kloten_fire', 'cyber_bunker', 'castle_alps', 'exam_auditorium'];
const ENDLESS_BOSSES = [
    { name: 'Monika Schneider (Nachsitz-Aufsicht)', type: 'monika',          hp: 500, avatar: 'assets/sprites/monika_avatar.png' },
    { name: 'Herr Adam (Straf-Training)',           type: 'adam',            hp: 540, avatar: 'assets/sprites/adam_avatar.png' },
    { name: 'Tung Tung Tung Sahur',                 type: 'tung_sahur',      hp: 580, avatar: 'assets/sprites/sahur_avatar.png' },
    { name: 'TukTuk MK-I',                          type: 'tuktuk_gpu',      hp: 620, avatar: 'assets/sprites/tuktuk_avatar.png' },
    { name: 'Dual-GPU TukTuk MK-II',                type: 'tuktuk_dual_gpu', hp: 700, avatar: 'assets/sprites/tuktuk_dual_avatar.png' }
];
const ENDLESS_STUDENT_NAMES = ['Average GIBB Schüler', 'TikTok Cringe King', 'Fortnite Kolleg', 'Modul-Streber', 'Energy-Junkie', 'Zuspätkommer'];

const Expansion = {
    // ---------------------------------------------------------------------
    // SETUP, PERSISTENCE
    // ---------------------------------------------------------------------
    initExpansion() {
        this.meta = this.loadMeta();
        this.run = this.newRunState();
        this.hitStop = 0;
        this.slowMo = 0;
        this.perkDraftOpen = false;
        this.jumpPressFresh = true;
        this.achToastQueue = [];
        this.achToastBusy = false;
        Object.assign(this.player, { dashTimer: 0, dashCooldown: 0, dashDir: 1, dashDX: 1, dashDY: 0, dashId: 0, airJumps: 1 });
        this.recomputeMods();
        this.buildExpansionDOM();
        this.buildCharacterExtras();
        this.bindExpansionInput();
        this.refreshCoinUI();
    },

    newRunState() {
        return { perks: {}, damageTaken: 0, reviveUsed: false, coins: 0, kills: 0 };
    },

    loadMeta() {
        const meta = { coins: 0, upgrades: {}, achievements: {}, bestiary: {}, stats: { ...DEFAULT_STATS } };
        try {
            const parsed = JSON.parse(localStorage.getItem(META_STORAGE_KEY) || 'null');
            if (parsed && typeof parsed === 'object') this.mergeMetaInto(meta, parsed);
        } catch (e) {}
        return meta;
    },

    mergeMetaInto(meta, src) {
        meta.coins = Math.max(0, Math.round(Number(src.coins) || 0));
        if (src.upgrades && typeof src.upgrades === 'object') {
            for (const item of SHOP_ITEMS) {
                const lv = Math.round(Number(src.upgrades[item.id]) || 0);
                if (lv > 0) meta.upgrades[item.id] = Math.min(item.max, lv);
            }
        }
        if (src.achievements && typeof src.achievements === 'object') {
            for (const a of ACHIEVEMENTS) if (src.achievements[a.id]) meta.achievements[a.id] = true;
        }
        if (!meta.bestiary) meta.bestiary = {};
        if (src.bestiary && typeof src.bestiary === 'object') {
            for (const [k, v] of Object.entries(src.bestiary)) meta.bestiary[k] = Math.max(0, Math.round(Number(v) || 0));
        }
        if (src.stats && typeof src.stats === 'object') {
            for (const k of Object.keys(DEFAULT_STATS)) meta.stats[k] = Math.max(0, Number(src.stats[k]) || 0);
        }
        return meta;
    },

    // Disk save (portable EXE) wins only if it holds more lifetime progress than the browser copy.
    adoptDiskMeta(diskMeta) {
        if (!diskMeta || typeof diskMeta !== 'object' || !diskMeta.stats) return;
        if ((Number(diskMeta.stats.coinsEarned) || 0) <= this.meta.stats.coinsEarned) return;
        this.meta = this.mergeMetaInto({ coins: 0, upgrades: {}, achievements: {}, bestiary: {}, stats: { ...DEFAULT_STATS } }, diskMeta);
        try { localStorage.setItem(META_STORAGE_KEY, JSON.stringify(this.meta)); } catch (e) {}
        this.recomputeMods();
        this.refreshCoinUI();
    },

    saveMeta() {
        try { localStorage.setItem(META_STORAGE_KEY, JSON.stringify(this.meta)); } catch (e) {}
        if (this.localSaveEnabled) {
            clearTimeout(this.metaDiskTimer);
            this.metaDiskTimer = setTimeout(() => this.persistSaveToDisk(), 1500);
        }
    },

    upgradeLevel(id) {
        return (this.meta && this.meta.upgrades[id]) || 0;
    },

    upgradeCost(item, lv) {
        return Math.round((item.base * 1.6 * (1 + lv * 1.0)) / 10) * 10;
    },

    countCleared(fromId, toId) {
        let n = 0;
        const levels = (this.saveData && this.saveData.levels) || {};
        for (let id = fromId; id <= toId; id++) if (levels[String(id)] && levels[String(id)].cleared) n++;
        return n;
    },

    // ---------------------------------------------------------------------
    // STAT MODIFIERS (shop upgrades + in-run perks)
    // ---------------------------------------------------------------------
    recomputeMods() {
        const u = (id) => this.upgradeLevel(id);
        const p = (id) => (this.run && this.run.perks[id]) || 0;
        this.mods = {
            dmgMult: 1 + 0.08 * u('dmg') + 0.20 * p('dmg'),
            maxHp: 150 + 15 * u('hp') + 40 * p('hp'),
            energyRegenMult: 1 + 0.15 * u('regen') + 0.60 * p('regen'),
            frisbeeCdMult: 1 - 0.08 * u('frisbee'),
            blockCdMult: (1 - 0.10 * u('shield')) * Math.pow(0.70, p('shield')),
            lawCdMult: Math.pow(0.78, p('rapid')),
            megaCost: Math.max(16, 40 - 8 * p('mega')),
            megaDmgMult: 1 + 0.30 * p('mega'),
            critChance: Math.min(0.75, 0.05 + 0.04 * u('crit') + 0.12 * p('crit')),
            coinMult: 1 + 0.12 * u('coins'),
            lifesteal: p('vamp'),
            frisbeeCount: 20 + 10 * p('frisbee'),
            multiShot: p('multi'),
            dashCd: Math.max(16, Math.round(40 * (1 - 0.10 * u('dash')) * Math.pow(0.70, p('dash')))),
            maxAirJumps: 1 + u('triple') + p('jump'),
            dashDamage: 45 * (u('dashstrike') + p('strike'))
        };
        return this.mods;
    },

    applyModsToPlayer(fullHeal) {
        const pl = this.player;
        const prevMax = pl.maxHp;
        pl.maxHp = this.mods.maxHp;
        if (fullHeal) pl.hp = pl.maxHp;
        else if (pl.maxHp > prevMax) pl.hp = Math.min(pl.maxHp, pl.hp + (pl.maxHp - prevMax));
        pl.hp = Math.min(pl.hp, pl.maxHp);
        pl.maxFrisbeeCooldown = Math.round(140 * this.mods.frisbeeCdMult);
        pl.maxBlockCooldown = Math.round(48 * this.mods.blockCdMult);
        pl.maxLawBookCooldown = Math.max(8, Math.round(24 * this.mods.lawCdMult));
    },

    difficultyCoinMult() {
        return { easy: 0.8, normal: 1.0, hard: 1.3, nightmare: 1.6 }[this.difficulty] || 1.0;
    },

    // ---------------------------------------------------------------------
    // COINS, ACHIEVEMENTS
    // ---------------------------------------------------------------------
    addCoins(amount, opts = {}) {
        let n = Math.round(amount * (opts.raw ? 1 : this.mods.coinMult * this.difficultyCoinMult()));
        if (n <= 0) return 0;
        this.meta.coins += n;
        this.meta.stats.coinsEarned += n;
        if (this.run) this.run.coins += n;
        if (opts.x !== undefined) {
            this.addFloatingText(`+${n} CHF 🪙`, opts.x, opts.y, '#ffd32a', opts.size || 20);
        }
        this.refreshCoinUI();
        this.checkAchievements();
        this.saveMeta();
        return n;
    },

    checkAchievements() {
        const s = this.meta.stats;
        for (const a of ACHIEVEMENTS) {
            if (this.meta.achievements[a.id]) continue;
            let ok = false;
            try { ok = a.test(s, this); } catch (e) {}
            if (!ok) continue;
            this.meta.achievements[a.id] = true;
            this.meta.coins += a.reward;
            this.meta.stats.coinsEarned += a.reward;
            this.queueAchievementToast(a);
        }
        this.refreshCoinUI();
    },

    queueAchievementToast(a) {
        this.achToastQueue.push(a);
        if (!this.achToastBusy) this.showNextAchievementToast();
    },

    showNextAchievementToast() {
        const a = this.achToastQueue.shift();
        const el = this.xui.achToast;
        if (!a || !el) { this.achToastBusy = false; return; }
        this.achToastBusy = true;
        el.innerHTML = `<span class="ach-toast-icon">${a.icon}</span><div><div class="ach-toast-head">🏅 ERFOLG FREIGESCHALTET</div><div class="ach-toast-name">${a.name}</div><div class="ach-toast-reward">+${a.reward} CHF</div></div>`;
        el.classList.remove('hidden');
        el.classList.remove('show');
        void el.offsetWidth;
        el.classList.add('show');
        if (window.soundManager.playPowerUp) window.soundManager.playPowerUp();
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => this.showNextAchievementToast(), 350);
        }, 3200);
    },

    refreshCoinUI() {
        if (!this.xui) return;
        const coins = this.meta.coins;
        if (this.xui.coinVal) this.xui.coinVal.textContent = String(coins);
        if (this.xui.btnKiosk) this.xui.btnKiosk.textContent = `🛒 KIOSK • ${coins} CHF`;
        if (this.xui.kioskBalance) this.xui.kioskBalance.textContent = `${coins} CHF`;
        if (this.xui.btnEndless) {
            const best = this.meta.stats.endlessBest;
            this.xui.btnEndless.textContent = best > 0 ? `♾️ NACHSITZEN • REKORD ${best}` : '♾️ NACHSITZEN';
        }
    },

    // ---------------------------------------------------------------------
    // DOM (HUD additions, Kiosk, Perk draft, Toast)
    // ---------------------------------------------------------------------
    buildExpansionDOM() {
        const container = document.getElementById('game-container');
        this.xui = {};

        // HUD: coin counter
        const uiRight = document.querySelector('#ui-bar .ui-right');
        if (uiRight) {
            const coin = document.createElement('div');
            coin.className = 'stat-counter coin-counter';
            coin.innerHTML = '<span class="stat-icon">🪙</span><div class="stat-text-col"><span class="stat-title">LOHN</span><span id="coin-val" class="stat-num">0</span></div>';
            uiRight.insertBefore(coin, uiRight.firstChild);
            this.xui.coinVal = coin.querySelector('#coin-val');
        }

        // HUD: dash ability slot
        const dock = document.getElementById('ability-dock');
        if (dock) {
            const megaKey = dock.querySelector('#slot-mega .ability-key');
            if (megaKey) megaKey.textContent = 'Q';
            const slot = document.createElement('div');
            slot.className = 'ability-slot ready';
            slot.id = 'slot-dash';
            slot.innerHTML = '<div class="ability-key key-dash">⇧</div><span class="ability-emoji">💨</span><div class="ability-info"><span class="ability-title">Dash</span><div class="ability-mini-track"><div id="hud-dash-fill" class="ability-mini-fill dash-mini"></div></div></div>';
            dock.appendChild(slot);
            this.xui.slotDash = slot;
            this.xui.dashFill = slot.querySelector('#hud-dash-fill');
        }

        // Lobby: new mode + shop buttons, key hints
        const actions = document.querySelector('.lobby-actions-row');
        const btnStart = document.getElementById('btn-start');
        if (actions && btnStart) {
            actions.classList.add('lobby-actions-v9');
            const btnEndless = document.createElement('button');
            btnEndless.id = 'btn-endless';
            btnEndless.className = 'btn btn-endless';
            btnEndless.title = 'Endlos-Arena: Welle für Welle, nach jeder Welle ein Perk';
            const btnKiosk = document.createElement('button');
            btnKiosk.id = 'btn-kiosk';
            btnKiosk.className = 'btn btn-kiosk';
            btnKiosk.title = 'Upgrades, Erfolge & Statistik';
            btnStart.after(btnEndless, btnKiosk);
            this.xui.btnEndless = btnEndless;
            this.xui.btnKiosk = btnKiosk;
            btnEndless.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                this.startLevel('endless');
            });
            btnKiosk.addEventListener('click', () => {
                window.soundManager.initWebAudio();
                this.openKiosk('shop');
            });
        }
        const keysBar = document.querySelector('.lobby-keys-bar');
        if (keysBar) {
            const k = document.createElement('div');
            k.className = 'key-item';
            k.innerHTML = '<kbd>SHIFT</kbd> Dash';
            keysBar.insertBefore(k, keysBar.children[2] || null);
            const first = keysBar.querySelector('.key-item:nth-child(2)');
            if (first) first.innerHTML = '<kbd>SPACE</kbd> Sprung (halten = höher, 2×)';
            const pogo = document.createElement('div');
            pogo.className = 'key-item';
            pogo.innerHTML = '<kbd>↓</kbd> in der Luft: Pogo';
            keysBar.insertBefore(pogo, keysBar.children[3] || null);
        }

        // Touch: dash button
        if (this.ui.touchOverlay) {
            const left = this.ui.touchOverlay.querySelector('.touch-cluster-left');
            if (left) {
                const b = document.createElement('button');
                b.id = 'touch-btn-dash';
                b.className = 'touch-btn touch-action touch-sprint';
                b.setAttribute('aria-label', 'Dash');
                b.innerHTML = '<span class="touch-icon">💨</span><span class="touch-sub">DASH</span>';
                left.appendChild(b);
                b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.tryDash(); });
            }
        }

        // Win screen: coin line
        const winStats = document.querySelector('#screen-win .win-stats');
        if (winStats) {
            const line = document.createElement('div');
            line.id = 'win-coins';
            line.className = 'win-coins';
            winStats.after(line);
            this.xui.winCoins = line;
        }

        // Kiosk screen
        const kiosk = document.createElement('div');
        kiosk.id = 'screen-kiosk';
        kiosk.className = 'screen-overlay hidden';
        kiosk.innerHTML = `
            <div class="menu-card glass-panel modal-card kiosk-card">
                <div class="modal-header-bar">
                    <div>
                        <div class="game-badge badge-gold">LEHRLINGSLOHN AUSGEBEN</div>
                        <h2 class="kiosk-title">🛒 MENSA-KIOSK</h2>
                        <p class="campaign-summary">Verdiene CHF durch K.O.s, Level-Siege, Erfolge und im Nachsitzen.</p>
                    </div>
                    <div class="kiosk-head-right">
                        <div class="kiosk-balance">🪙 <span id="kiosk-balance">0 CHF</span></div>
                        <button id="btn-close-kiosk" class="btn btn-secondary">ZURÜCK</button>
                    </div>
                </div>
                <div class="kiosk-tabs">
                    <button class="kiosk-tab active" data-tab="shop">🛒 UPGRADES</button>
                    <button class="kiosk-tab" data-tab="ach">🏅 ERFOLGE</button>
                    <button class="kiosk-tab" data-tab="stats">📊 STATISTIK</button>
                </div>
                <div id="kiosk-body" class="kiosk-body"></div>
            </div>`;
        container.appendChild(kiosk);
        this.xui.screenKiosk = kiosk;
        this.xui.kioskBody = kiosk.querySelector('#kiosk-body');
        this.xui.kioskBalance = kiosk.querySelector('#kiosk-balance');
        this.xui.kioskTabs = kiosk.querySelectorAll('.kiosk-tab');
        kiosk.querySelector('#btn-close-kiosk').addEventListener('click', () => this.closeKiosk());
        this.xui.kioskTabs.forEach((tab) => tab.addEventListener('click', () => this.openKiosk(tab.dataset.tab)));
        this.xui.kioskBody.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-buy]');
            if (btn) this.buyUpgrade(btn.dataset.buy);
        });

        // Perk draft screen (Nachsitzen)
        const perks = document.createElement('div');
        perks.id = 'screen-perks';
        perks.className = 'screen-overlay hidden';
        perks.innerHTML = `
            <div class="perk-wrap">
                <div class="game-badge badge-green" id="perk-badge">WELLE GESCHAFFT</div>
                <h2 class="perk-title">WÄHLE DEINEN BONUS</h2>
                <p class="campaign-summary" id="perk-sub">Klick oder Taste 1 / 2 / 3</p>
                <div id="perk-cards" class="perk-cards"></div>
                <div id="perk-owned" class="perk-owned"></div>
            </div>`;
        container.appendChild(perks);
        this.xui.screenPerks = perks;
        this.xui.perkCards = perks.querySelector('#perk-cards');
        this.xui.perkBadge = perks.querySelector('#perk-badge');
        this.xui.perkOwned = perks.querySelector('#perk-owned');
        this.xui.perkCards.addEventListener('click', (e) => {
            const card = e.target.closest('[data-perk]');
            if (card) this.choosePerk(card.dataset.perk);
        });

        // Achievement toast
        const toast = document.createElement('div');
        toast.id = 'ach-toast';
        toast.className = 'ach-toast hidden';
        container.appendChild(toast);
        this.xui.achToast = toast;
    },

    bindExpansionInput() {
        // Capture phase: runs before the engine's own keydown handler.
        window.addEventListener('keydown', (e) => {
            this.jumpPressFresh = !e.repeat;
            if (this.perkDraftOpen) {
                const idx = ['1', '2', '3'].indexOf(e.key);
                if (idx >= 0 && this.currentPerkOffer && this.currentPerkOffer[idx]) {
                    this.choosePerk(this.currentPerkOffer[idx].id);
                }
                return;
            }
            if (this.state === GAME_STATE.MENU && e.key === 'Escape' && this.xui.screenKiosk && !this.xui.screenKiosk.classList.contains('hidden')) {
                this.closeKiosk();
                return;
            }
            if (!e.repeat && (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key.toLowerCase() === 'v')) {
                this.tryDash();
            }
        }, true);
        window.addEventListener('keyup', (e) => {
            this.jumpPressFresh = true;
            const k = e.key.toLowerCase();
            if (e.code === 'Space' || k === 'w' || k === 'arrowup') this.cutJump();
        }, true);
        if (this.ui.touchBtnJump) {
            ['pointerup', 'pointercancel', 'touchend'].forEach((ev) => this.ui.touchBtnJump.addEventListener(ev, () => this.cutJump()));
        }
    },

    // ---------------------------------------------------------------------
    // KIOSK (shop / achievements / stats)
    // ---------------------------------------------------------------------
    openKiosk(tab = 'shop') {
        this.kioskTab = tab;
        this.checkAchievements();
        this.ui.screenMenu.classList.add('hidden');
        this.xui.screenKiosk.classList.remove('hidden');
        this.xui.kioskTabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
        this.renderKiosk();
    },

    closeKiosk() {
        this.xui.screenKiosk.classList.add('hidden');
        this.ui.screenMenu.classList.remove('hidden');
        this.refreshCoinUI();
    },

    renderKiosk() {
        const body = this.xui.kioskBody;
        const tab = this.kioskTab || 'shop';
        this.refreshCoinUI();
        if (tab === 'shop') {
            body.innerHTML = '<div class="kiosk-grid">' + SHOP_ITEMS.map((item) => {
                const lv = this.upgradeLevel(item.id);
                const maxed = lv >= item.max;
                const cost = this.upgradeCost(item, lv);
                const afford = this.meta.coins >= cost;
                const pips = item.unlock ? '' : '<div class="kiosk-pips">' + Array.from({ length: item.max }, (_, i) => `<span class="pip${i < lv ? ' on' : ''}"></span>`).join('') + '</div>';
                const btn = maxed
                    ? `<button class="btn btn-secondary btn-sm" disabled>${item.unlock ? '✓ AKTIV' : '✓ MAX'}</button>`
                    : `<button class="btn ${afford ? 'btn-primary' : 'btn-secondary'} btn-sm" data-buy="${item.id}" ${afford ? '' : 'disabled'}>${cost} CHF</button>`;
                return `<div class="kiosk-item${maxed ? ' maxed' : ''}${item.unlock ? ' unlock' : ''}">
                    <div class="kiosk-icon">${item.icon}</div>
                    <div class="kiosk-info"><div class="kiosk-name">${item.name}</div><div class="kiosk-desc">${item.desc}</div>${pips}</div>
                    ${btn}
                </div>`;
            }).join('') + '</div>';
        } else if (tab === 'ach') {
            const done = ACHIEVEMENTS.filter((a) => this.meta.achievements[a.id]).length;
            body.innerHTML = `<p class="kiosk-note">${done} / ${ACHIEVEMENTS.length} Erfolge freigeschaltet</p><div class="kiosk-grid">` + ACHIEVEMENTS.map((a) => {
                const got = !!this.meta.achievements[a.id];
                return `<div class="kiosk-item ach${got ? ' got' : ''}">
                    <div class="kiosk-icon">${got ? a.icon : '🔒'}</div>
                    <div class="kiosk-info"><div class="kiosk-name">${a.name}</div><div class="kiosk-desc">${a.desc}</div></div>
                    <div class="ach-reward">${got ? '✓' : '+' + a.reward + ' CHF'}</div>
                </div>`;
            }).join('') + '</div>';
        } else {
            const s = this.meta.stats;
            const rows = [
                ['Level-Siege', s.wins], ['Gegner besiegt', s.kills], ['Schaden ausgeteilt', Math.round(s.damageDealt)],
                ['Kritische Treffer', s.crits], ['Beste Kombo', s.bestCombo + '×'], ['Dashes', s.dashes],
                ['Perfekte Ausweicher', s.dodges], ['Pogo-Sprünge', s.pogos], ['Perfekt-Blocks', s.perfectBlocks], ['Niederlagen', s.deaths],
                ['Nachsitzen: Rekord', s.endlessBest + ' Wellen'], ['Nachsitzen: Versuche', s.endlessRuns],
                ['Lohn insgesamt', s.coinsEarned + ' CHF'], ['Levels abgeschlossen', this.countCleared(1, 30) + ' / 30']
            ];
            body.innerHTML = '<div class="stats-grid">' + rows.map(([k, v]) => `<div class="stats-row"><span>${k}</span><strong>${v}</strong></div>`).join('') + '</div>';
        }
    },

    buyUpgrade(id) {
        const item = SHOP_ITEMS.find((i) => i.id === id);
        if (!item) return;
        const lv = this.upgradeLevel(id);
        const cost = this.upgradeCost(item, lv);
        if (lv >= item.max || this.meta.coins < cost) return;
        this.meta.coins -= cost;
        this.meta.upgrades[id] = lv + 1;
        this.meta.stats.purchases++;
        if (window.soundManager.playPowerUp) window.soundManager.playPowerUp();
        this.recomputeMods();
        this.checkAchievements();
        this.saveMeta();
        this.renderKiosk();
    },

    // ---------------------------------------------------------------------
    // NEW MOVES: DASH + AIR JUMP
    // ---------------------------------------------------------------------
    tryDash() {
        const p = this.player;
        const active = this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO;
        if (!active || this.isPaused || this.isPlayerStunned()) return;
        if (p.dashTimer > 0) return;
        if (p.dashCooldown > 0 && this.state !== GAME_STATE.DEMO) return;
        const isRocketMode = this.level && this.level.mode === 'rocket_flight';
        if (!isRocketMode && !p.isGrounded) {
            if (p.airDashUsed) return;
            p.airDashUsed = true;
        }

        const left = this.keys['a'] || this.keys['arrowleft'];
        const right = this.keys['d'] || this.keys['arrowright'];
        const isRocket = this.level && this.level.mode === 'rocket_flight';
        if (isRocket) {
            const up = this.keys['w'] || this.keys['arrowup'] || this.touchJumpHeld;
            const down = this.keys['s'] || this.keys['arrowdown'] || this.touchDuckHeld;
            let dx = right ? 1 : (left ? -1 : 0);
            let dy = down ? 1 : (up ? -1 : 0);
            if (!dx && !dy) dx = 1;
            const len = Math.hypot(dx, dy);
            p.dashDX = dx / len;
            p.dashDY = dy / len;
        } else {
            p.dashDir = right ? 1 : (left ? -1 : (p.facing || 1));
            p.facing = p.dashDir;
        }
        p.dashTimer = 11;
        p.dashCooldown = this.mods.dashCd;
        p.dashId++;
        p.invulnerableTime = Math.max(p.invulnerableTime, 15);
        this.meta.stats.dashes++;
        window.soundManager.playSprint();
        this.shockwaves.push({ x: p.x + p.w * 0.5, y: p.y + p.h * 0.5, radius: 8, maxRadius: 70, color: '#00d2d3', alpha: 0.6 });
    },

    // Variable jump height: letting go of jump early cuts the rise short
    cutJump() {
        const p = this.player;
        if (p.jumpCut && p.vy < -5 && !(this.level && this.level.mode === 'rocket_flight')) {
            p.vy *= 0.45;
        }
        p.jumpCut = false;
    },

    applyDashMove() {
        const p = this.player;
        if (p.dashTimer > 0) {
            p.vx = p.dashDir * 19;
            p.vy = 0;
        }
    },

    applyRocketDash() {
        const p = this.player;
        if (p.dashTimer > 0) {
            p.vx = p.dashDX * 15;
            p.vy = p.dashDY * 15;
        }
    },

    tryAirJump() {
        const p = this.player;
        if (this.jumpPressFresh === false) return false;
        if (this.level && this.level.mode === 'rocket_flight') return false;
        if (!(p.airJumps > 0)) return false;
        p.airJumps--;
        p.vy = p.jumpPower * 0.92;
        p.jumpBuffered = false;
        p.jumpCut = true;
        window.soundManager.playJump();
        const cx = p.x + p.w * 0.5;
        const cy = p.y + p.h;
        this.shockwaves.push({ x: cx, y: cy, radius: 6, maxRadius: 58, color: '#ffffff', alpha: 0.7 });
        this.spawnBurst(cx, cy, 10, '#e2e8f0', 4, 14);
        return true;
    },

    onPerfectDodge(proj) {
        if (proj.dodged) return;
        proj.dodged = true;
        const p = this.player;
        this.meta.stats.dodges++;
        this.slowMo = Math.max(this.slowMo, 14);
        p.megaEnergy = Math.min(p.maxMegaEnergy, p.megaEnergy + 12);
        p.dashCooldown = Math.min(p.dashCooldown, 10);
        this.addFloatingText('💨 PERFEKT AUSGEWICHEN!', p.x + p.w * 0.5, p.y - 22, '#00d2d3', 22);
        this.registerCombo(2);
        this.addCoins(1, { x: p.x + p.w * 0.5, y: p.y - 48, size: 16 });
    },

    // ---------------------------------------------------------------------
    // COMBAT HOOKS
    // ---------------------------------------------------------------------
    damageEnemy(e, dmg, color) {
        if (!e || e.hp <= 0) return;
        const lethal = e.hp - dmg <= 0;
        e.hp = Math.max(0, e.hp - dmg);
        e.hitFlash = 9;
        this.meta.stats.damageDealt += dmg;
        window.soundManager.playHit();
        this.addFloatingText(`-${dmg}`, e.x + e.w * 0.5, e.y + 12, color || '#00d2d3', 24);
        this.spawnBurst(e.x + e.w * 0.5, e.y + e.h * 0.45, 12, color || '#00d2d3', 7, 16);
        if (lethal) {
            e.defeated = true;
            this.onEnemyDefeated(e);
        }
    },

    onEnemyDefeated(e) {
        if (this.state === GAME_STATE.DEMO || e.isDummy) return;
        const other = e === this.boss ? this.duoPartner : this.boss;
        const lastOne = !other || other.hp <= 0 || other === e;
        this.meta.stats.kills++;
        this.run.kills++;
        const bKey = this.bestiaryKey(e);
        this.meta.bestiary[bKey] = (this.meta.bestiary[bKey] || 0) + 1;
        this.hitStop = 7;
        this.screenShake = 22;
        if (lastOne) {
            this.slowMo = 46;
            this.radialFlashTimer = 14;
        }
        const cx = e.x + e.w * 0.5;
        this.addFloatingText('K.O.!', cx, e.y - 54, '#ff4757', 44);
        this.spawnBurst(cx, e.y + e.h * 0.5, 26, '#ffd32a', 10, 30);
        this.shockwaves.push({ x: cx, y: e.y + e.h * 0.5, radius: 20, maxRadius: 260, color: '#ffd32a', alpha: 0.9 });
        const divisor = this.level && this.level.endless ? 45 : 30;
        this.addCoins((e.maxHp || 300) / divisor, { x: cx, y: e.y - 92, size: 24 });
    },

    // ---------------------------------------------------------------------
    // PER-FRAME TICK
    // ---------------------------------------------------------------------
    tickExpansion() {
        const p = this.player;
        const active = this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO;
        if (!active) return;

        if (p.isGrounded) {
            p.airJumps = this.mods.maxAirJumps;
            p.airDashUsed = false;
        }
        if (p.dashCooldown > 0) p.dashCooldown--;

        if (p.dashTimer > 0) {
            // Afterimage streaks
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: p.x + Math.random() * p.w,
                    y: p.y + 10 + Math.random() * (p.h - 20),
                    vx: -(p.dashDir || 1) * (2 + Math.random() * 3),
                    vy: 0,
                    life: 12, maxLife: 12,
                    color: i === 0 ? '#ffffff' : '#00d2d3',
                    size: 5 + Math.random() * 5
                });
            }
            if (this.mods.dashDamage > 0 && (this.state === GAME_STATE.BOSS_FIGHT || this.state === GAME_STATE.DEMO)) {
                for (const e of [this.boss, this.duoPartner]) {
                    if (!e || e.hp <= 0 || e.dashHitId === p.dashId) continue;
                    if (this.checkCollision(p.x, p.y, p.w, p.h, e.x, e.y, e.w, e.h)) {
                        e.dashHitId = p.dashId;
                        this.damageEnemy(e, Math.round(this.mods.dashDamage * this.mods.dmgMult), '#00d2d3');
                        this.addFloatingText('⚔️ KONTER-DASH!', p.x + p.w * 0.5, p.y - 20, '#00d2d3', 20);
                    }
                }
            }
        }

        if (this.comboCount > this.meta.stats.bestCombo) {
            this.meta.stats.bestCombo = this.comboCount;
            if (this.comboCount === 20 || this.comboCount === 50) this.checkAchievements();
        }
    },

    // ---------------------------------------------------------------------
    // NACHSITZEN — ENDLESS ROGUELIKE ARENA
    // ---------------------------------------------------------------------
    buildEndlessLevel() {
        return {
            id: 0,
            endless: true,
            chapter: 1,
            yearText: '♾️ NACHSITZEN',
            name: 'Endlos-Arena: Wie lange hältst du durch?',
            mode: 'wave_rush',
            featureTag: '♾️ NACHSITZEN! NACH JEDER WELLE: 1 BONUS WÄHLEN!',
            hasBoss: true,
            bgType: ENDLESS_ARENAS[0],
            accentColor: '#a55eea',
            ambientStyle: 'gym',
            targetDistance: 0,
            music: 'assets/music/Thanuran_Takeover.mp3',
            bossAggression: 1.06,
            waves: [this.genEndlessWave(1)],
            mechanics: { platforms: true, duckObstacles: false, lavaPits: false, sprintPads: false, platformStyle: 'concrete' },
            bossType: 'gibb_student',
            bossName: 'Nachsitz-Gegner',
            bossAvatar: 'assets/sprites/gibb_student_avatar.png',
            bossHP: 300,
            bossLines: [
                { text: 'Ich will Fortnite und TikTok spiele!', clip: 'student_tiktok_fortnite' },
                { text: 'Ich bin der Cringe King von TikTok!', clip: 'student_cringe_king' }
            ],
            playerLines: [
                { text: 'Das isch e absoluti Frechheit!', clip: 'thenerean_frechheit' },
                { text: 'Du bisch selber en Bankomat!', clip: 'thenerean_bankomat' }
            ],
            obstacleTypes: [],
            collectibleTypes: []
        };
    },

    genEndlessWave(n) {
        const hpScale = 1 + 0.13 * (n - 1);
        const hp = (base) => Math.round((base * hpScale) / 10) * 10;
        const pick = (arr, salt = 0) => arr[(n + salt) % arr.length];
        const student = (salt, base) => ({ name: pick(ENDLESS_STUDENT_NAMES, salt), type: 'gibb_student', hp: hp(base), avatar: 'assets/sprites/gibb_student_avatar.png' });

        if (n % 5 === 0) {
            const boss = ENDLESS_BOSSES[(n / 5 - 1) % ENDLESS_BOSSES.length];
            const wave = {
                title: `👑 WELLE ${n}: BOSS!`,
                banner: `👑 BOSS-WELLE ${n}: ${boss.name.toUpperCase()}!`,
                primary: { ...boss, hp: hp(boss.hp) }
            };
            if (n >= 10) wave.partner = student(1, 200);
            return wave;
        }
        const kind = n % 5;
        if (kind === 1) return { title: `♾️ WELLE ${n}`, banner: `🎒 WELLE ${n}: EINZEL-DUELL!`, primary: student(0, 280) };
        if (kind === 2) return { title: `♾️ WELLE ${n}: DUO!`, banner: `📱 WELLE ${n}: DOPPEL-RIVALEN!`, primary: student(0, 230), partner: student(2, 210) };
        if (kind === 3) {
            const adam = n % 2 === 1;
            return {
                title: `♾️ WELLE ${n}: AUFSICHT!`,
                banner: adam ? `🥏 WELLE ${n}: HERR ADAM WÄRMT SICH AUF!` : `📢 WELLE ${n}: MONIKA KONTROLLIERT!`,
                primary: adam
                    ? { name: 'Herr Adam (Aufwärm-Runde)', type: 'adam_miniboss', hp: hp(340), avatar: 'assets/sprites/adam_avatar.png' }
                    : { name: 'Monika Schneider (Kontrolle)', type: 'monika_miniboss', hp: hp(340), avatar: 'assets/sprites/monika_avatar.png' }
            };
        }
        return {
            title: `♾️ WELLE ${n}: ELITE-DUO!`,
            banner: `⚡ WELLE ${n}: ELITE + VERSTÄRKUNG!`,
            primary: { name: 'Modul-Prüfer (GIBB Elite)', type: 'gibb_student', hp: hp(330), avatar: 'assets/sprites/gibb_student_avatar.png' },
            partner: n >= 9
                ? { name: 'Tung Sahur (Aushilfe)', type: 'tung_sahur', hp: hp(260), avatar: 'assets/sprites/sahur_avatar.png' }
                : student(3, 200)
        };
    },

    onEndlessWaveCleared() {
        if (this.perkDraftOpen) return;
        const cleared = this.currentWaveIndex + 1;
        this.projectiles = [];
        this.hazards = [];
        this.clearFrisbeeTimers();
        if (cleared > this.meta.stats.endlessBest) this.meta.stats.endlessBest = cleared;
        this.addCoins(4 + cleared * 2, { x: canvas.width * 0.5, y: canvas.height * 0.36, size: 26 });
        window.soundManager.playWaveClear();
        this.openPerkDraft(cleared);
    },

    openPerkDraft(cleared) {
        const pool = RUN_PERKS.filter((perk) => {
            if (perk.id === 'heal') return this.player.hp < this.player.maxHp * 0.8;
            if (perk.id === 'mega') return this.mods.megaCost > 16;
            if (perk.id === 'jump') return this.mods.maxAirJumps < 4;
            return true;
        });
        const offer = [];
        while (offer.length < 3 && pool.length > 0) {
            offer.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        this.currentPerkOffer = offer;
        this.perkDraftOpen = true;
        this.isPaused = true;
        this.xui.perkBadge.textContent = `WELLE ${cleared} GESCHAFFT • REKORD ${this.meta.stats.endlessBest}`;
        this.xui.perkCards.innerHTML = offer.map((perk, i) => {
            const owned = this.run.perks[perk.id] || 0;
            return `<button class="perk-card" data-perk="${perk.id}">
                <span class="perk-key">${i + 1}</span>
                <span class="perk-icon">${perk.icon}</span>
                <span class="perk-name">${perk.name}</span>
                <span class="perk-desc">${perk.desc}</span>
                <span class="perk-stack">${perk.instant ? 'SOFORT' : (owned > 0 ? `Stufe ${owned} → ${owned + 1}` : 'NEU')}</span>
            </button>`;
        }).join('');
        const ownedList = RUN_PERKS.filter((perk) => this.run.perks[perk.id]).map((perk) => `<span class="perk-chip">${perk.icon} ${perk.name} ×${this.run.perks[perk.id]}</span>`);
        this.xui.perkOwned.innerHTML = ownedList.length ? ownedList.join('') : '<span class="perk-chip muted">Noch keine Boni gesammelt</span>';
        this.xui.screenPerks.classList.remove('hidden');
    },

    choosePerk(id) {
        if (!this.perkDraftOpen) return;
        const perk = RUN_PERKS.find((x) => x.id === id);
        if (!perk) return;
        if (perk.instant) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 80);
        } else {
            this.run.perks[id] = (this.run.perks[id] || 0) + 1;
            this.recomputeMods();
            this.applyModsToPlayer(false);
        }
        if (window.soundManager.playPowerUp) window.soundManager.playPowerUp();
        this.xui.screenPerks.classList.add('hidden');
        this.perkDraftOpen = false;
        this.isPaused = false;

        const next = this.currentWaveIndex + 1;
        const waveNo = next + 1;
        this.level.waves.push(this.genEndlessWave(waveNo));
        this.level.bgType = ENDLESS_ARENAS[Math.floor(next / 5) % ENDLESS_ARENAS.length];
        this.level.bossAggression = Math.max(0.62, 1.08 - 0.025 * waveNo);
        this.startWave(next);
        this.updateBars();
    }
};

Object.assign(Game.prototype, Expansion);
Game.prototype.mods = { ...DEFAULT_MODS };

// =========================================================================
// WRAPPERS AROUND CORE ENGINE METHODS
// =========================================================================
(function wrapCore() {
    const P = Game.prototype;
    const wrap = (name, fn) => {
        const orig = P[name];
        P[name] = function (...args) { return fn.call(this, orig.bind(this), ...args); };
    };

    wrap('resetRunStats', function (orig) {
        orig();
        this.run = this.newRunState();
        this.recomputeMods();
        this.applyModsToPlayer(true);
        Object.assign(this.player, { dashTimer: 0, dashCooldown: 0, airJumps: this.mods.maxAirJumps });
        this.hitStop = 0;
        this.slowMo = 0;
        this.perkDraftOpen = false;
        if (this.xui && this.xui.screenPerks) this.xui.screenPerks.classList.add('hidden');
    });

    wrap('startLevel', function (orig, index) {
        if (this.xui && this.xui.screenKiosk) this.xui.screenKiosk.classList.add('hidden');
        orig(index);
        if (this.level && this.level.endless) this.meta.stats.endlessRuns++;
        if (this.upgradeLevel('startpower') > 0) {
            this.player.powerTimer = 480;
            this.updateComboAndPowerHUD();
        }
        this.updateBars();
    });

    wrap('startWave', function (orig, idx) {
        orig(idx);
        if (this.level && this.level.endless) {
            this.ui.progBar.style.width = '100%';
            this.ui.progValText.textContent = `W${idx + 1}`;
        }
    });

    wrap('update', function (orig, dt) {
        if (this.isPaused) return;
        if (this.player.dashTimer > 0) this.player.dashTimer--;
        orig(dt);
        this.tickExpansion();
        this.tickCourse();
    });

    wrap('canPause', function (orig) {
        if (this.perkDraftOpen) return false;
        return orig();
    });

    wrap('resolvePlayerHit', function (orig, target, proj) {
        let dmg = Math.round(orig(target, proj) * this.mods.dmgMult);
        const crit = Math.random() < this.mods.critChance;
        if (crit) {
            dmg *= 2;
            this.meta.stats.crits++;
            this.addFloatingText('KRIT!', target.x + target.w * 0.5, target.y - 12, '#ff9f1a', 26);
            this.hitStop = Math.max(this.hitStop, 3);
        }
        if (proj.type === 'mega_beam') this.hitStop = Math.max(this.hitStop, 4);
        if (this.state !== GAME_STATE.DEMO) this.meta.stats.damageDealt += dmg;
        if (this.mods.lifesteal > 0 && this.player.hp > 0) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.mods.lifesteal);
        }
        if (target.hp > 0 && target.hp - dmg <= 0) this.onEnemyDefeated(target);
        return dmg;
    });

    wrap('playerAttackLawBook', function (orig) {
        const before = this.projectiles.length;
        orig();
        if (this.mods.multiShot > 0 && this.projectiles.length === before + 1) {
            const base = this.projectiles[before];
            for (let i = 1; i <= this.mods.multiShot; i++) {
                const side = i % 2 === 1 ? -1 : 1;
                const spread = Math.ceil(i / 2) * 1.5 * side;
                this.projectiles.push({ ...base, vy: base.vy + spread, y: base.y + spread * 4 });
            }
        }
    });

    wrap('onPlayerHit', function (orig, damage, reason) {
        const landed = orig(damage, reason);
        if (landed && this.run) this.run.damageTaken += damage;
        return landed;
    });

    wrap('onCollectItem', function (orig, type) {
        orig(type);
        if (type === 'diploma_shard') this.addCoins(3, { x: this.player.x + this.player.w * 0.5, y: this.player.y - 44, size: 16 });
    });

    wrap('reflectProjectile', function (orig, p) {
        this.meta.stats.perfectBlocks++;
        this.hitStop = Math.max(this.hitStop, 4);
        return orig(p);
    });

    wrap('updateBars', function (orig) {
        orig();
        if (!this.xui) return;
        const p = this.player;
        const ready = p.dashCooldown <= 0 || this.state === GAME_STATE.DEMO;
        if (this.xui.dashFill) {
            const pct = ready ? 100 : Math.max(0, 100 - (p.dashCooldown / Math.max(1, this.mods.dashCd)) * 100);
            this.xui.dashFill.style.width = `${pct}%`;
        }
        if (this.xui.slotDash) {
            this.xui.slotDash.classList.toggle('ready', ready);
            this.xui.slotDash.classList.toggle('cooldown', !ready);
        }
    });

    wrap('updateBossHUD', function (orig) {
        orig();
        if (this.level && this.level.endless && this.boss && !this.ui.bossHudBanner.classList.contains('hidden')) {
            this.ui.bossHudName.textContent = `♾️ WELLE ${this.currentWaveIndex + 1}: ${this.boss.name.toUpperCase()}`;
        }
    });

    wrap('updateMissionPill', function (orig) {
        orig();
        const inFight = this.state === GAME_STATE.BOSS_FIGHT;
        if (this.level && this.level.endless && inFight && this.ui.missionPill) {
            this.ui.missionPill.classList.remove('hidden');
            if (this.ui.missionIcon) this.ui.missionIcon.textContent = '♾️';
            if (this.ui.missionText) this.ui.missionText.textContent = `WELLE ${this.currentWaveIndex + 1} • REKORD ${this.meta.stats.endlessBest} • +${this.run.coins} CHF`;
        }
    });

    wrap('triggerLevelWin', function (orig) {
        const lvl = this.level;
        const key = String(lvl.id);
        const wasCleared = !!(this.saveData && this.saveData.levels && this.saveData.levels[key] && this.saveData.levels[key].cleared);
        this.slowMo = 0;
        this.hitStop = 0;
        orig();
        if (!lvl || lvl.id <= 0) return;

        const s = this.meta.stats;
        s.wins++;
        if (this.player.score >= 6.0) s.grade6++;
        if (this.difficulty === 'hard' || this.difficulty === 'nightmare') s.hardWins++;
        if (lvl.hasBoss !== false && this.run.damageTaken === 0) s.noHitBossWins++;
        if (this.maxCombo > s.bestCombo) s.bestCombo = this.maxCombo;

        const gradeBonus = Math.round(Math.max(0, this.player.score - 4) * 8);
        const comboBonus = Math.min(10, Math.floor(this.maxCombo / 4));
        const firstBonus = wasCleared ? 0 : 20;
        const earned = this.addCoins(10 + gradeBonus + comboBonus + firstBonus);
        if (this.xui.winCoins) {
            const total = this.run.coins;
            this.xui.winCoins.innerHTML = `🪙 <strong>+${total} CHF</strong> Lehrlingslohn in diesem Level` +
                (firstBonus ? ' <span class="win-coins-tag">ERSTABSCHLUSS-BONUS</span>' : '') +
                (this.run.damageTaken === 0 ? ' <span class="win-coins-tag">OHNE TREFFER</span>' : '') +
                `<br><small>Kontostand: ${this.meta.coins} CHF — im Mensa-Kiosk (Lobby) ausgeben</small>`;
        }
        void earned;
        this.checkAchievements();
        this.saveMeta();
    });

    wrap('triggerGameOver', function (orig) {
        const p = this.player;
        const inPlay = this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BOSS_FIGHT;
        if (inPlay && p.hp <= 0 && this.upgradeLevel('revive') > 0 && !this.run.reviveUsed && this.lastDamageReason !== 'timeout') {
            this.run.reviveUsed = true;
            p.hp = Math.round(p.maxHp * 0.5);
            p.invulnerableTime = 150;
            p.megaEnergy = p.maxMegaEnergy;
            this.projectiles = this.projectiles.filter((pr) => pr.isPlayer);
            this.slowMo = 30;
            this.screenShake = 20;
            this.radialFlashTimer = 16;
            const cx = p.x + p.w * 0.5;
            const cy = p.y + p.h * 0.5;
            this.shockwaves.push({ x: cx, y: cy, radius: 20, maxRadius: 320, color: '#2ed573', alpha: 0.95 });
            this.spawnBurst(cx, cy, 30, '#2ed573', 9, 28);
            this.addFloatingText('🍀 ZWEITE CHANCE! ICH STAH DOCH DA!', cx, p.y - 40, '#2ed573', 26);
            window.soundManager.playClip('thenerean_stah');
            this.updateBars();
            return;
        }

        this.slowMo = 0;
        this.hitStop = 0;
        const endless = this.level && this.level.endless;
        const waveNo = this.currentWaveIndex + 1;
        const cleared = this.currentWaveIndex;
        const prevBest = this.meta.stats.endlessBest;
        orig();
        this.meta.stats.deaths++;
        if (endless) {
            const isRecord = cleared > 0 && cleared >= prevBest;
            if (this.ui.loseBadge) this.ui.loseBadge.textContent = '♾️ NACHSITZEN BEENDET';
            if (this.ui.loseTitle) this.ui.loseTitle.textContent = `WELLE ${waveNo} ERREICHT!`;
            if (this.ui.loseReason) {
                this.ui.loseReason.textContent = `${cleared} Wellen überstanden • ${this.run.kills} Gegner besiegt • +${this.run.coins} CHF Lohn verdient. Rekord: ${this.meta.stats.endlessBest} Wellen.`;
            }
            if (this.ui.loseQuote) {
                this.ui.loseQuote.textContent = isRecord
                    ? '"NEUER REKORD! Niemert sitzt so lang nach wie de Thenerean!"'
                    : '"Gib dein Lohn im Mensa-Kiosk aus — und dann nochmal von vorne!"';
            }
        }
        this.checkAchievements();
        this.saveMeta();
    });

    wrap('returnToMenu', function (orig) {
        this.perkDraftOpen = false;
        this.slowMo = 0;
        this.hitStop = 0;
        if (this.xui) {
            this.xui.screenPerks.classList.add('hidden');
            this.xui.screenKiosk.classList.add('hidden');
        }
        orig();
        this.refreshCoinUI();
        this.saveMeta();
    });

    wrap('buildDiskSavePayload', function (orig) {
        const payload = orig();
        if (this.meta) payload.meta = this.meta;
        return payload;
    });
})();
