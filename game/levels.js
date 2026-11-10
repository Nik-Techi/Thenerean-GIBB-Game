/**
 * Thenerean Selvabankumar - High-End Levels Configuration
 * 10 abwechslungsreiche GIBB Bern & Sri Lanka Levels quer durch alle 4 Lehrjahre:
 * - Level 1:  GIBB Vorplatz — 34s Time-Attack Sprint (ohne Boss, faire Sprung/Duck-Parcours)
 * - Level 2:  Klassenzimmer 302 — Direkt-Duell gegen Monika mit Beamer-Schalter & Schild
 * - Level 3:  Sporthalle Korridor — 3-Wellen Rivalen-Ansturm (inkl. Duo-Welle)
 * - Level 4:  GIBB Turnhalle — Zielschuss-Parcours (6 Ziele) -> Herr Adam mit Boden-Sperrzonen
 * - Level 5:  Serverraum & Sri Lanka — TukTuk-Verfolgungsjagd -> Pflicht-Bosskampf TukTuk MK-I
 * - Level 6:  ABU-Zimmer B404 (mit Tafel-Witzen) — Monika + GIBB Schüler Boss-Kombo #1
 * - Level 7:  GIBB Mensa & Kiosk — Bankomat-Jeton-Rush -> Herr Adam + GIBB Schüler Kombo #2 (+HP-Switch)
 * - Level 8:  Colombo Cyber-Highway (Sri Lanka) — High-Speed Lauf -> Dual-GPU TukTuk MK-II (Turbo-Rebound!)
 * - Level 9:  GIBB Server-Bunker — Monika + Dual-GPU TukTuk MK-II Super-Kombo (1580 HP)
 * - Level 10: EFZ Prüfungs-Auditorium — Grosses Finale: Stage A Aufsicht -> Stage B Ultimatives Duo (Monika + Adam, 2230 HP)
 */

const LEVELS_CONFIG = [
    {
        id: 1,
        yearText: "1. LEHRJAHR (TEIL 1)",
        name: "GIBB Vorplatz: 4-Minuten-Sprint",
        mode: "time_attack",
        modeBadge: "⏱️ ZEIT-SPRINT",
        featureTag: "⏱️ KEIN BOSS! SCHAFF ES IN 34s DURCHS GIBB-TOR (+2.5s PRO KAFFEE)!",
        missionBadge: "⏱️ SCHULGLOCKE",
        timeLimitSec: 34,
        hasBoss: false,
        bgType: "gibb_entrance",
        bgPath: "assets/backgrounds/bg_gibb_entrance.jpg",
        accentColor: "#ff4757",
        ambientStyle: "daylight",
        targetDistance: 2950,
        music: "assets/music/That_s_The_One.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: false,
            sprintPads: true,
            platformStyle: "concrete",
            clearPlatformUnder: true
        },
        bossType: "monika_miniboss",
        bossName: "Schulglocke 08:00 Uhr",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 0,
        bossLines: [
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Du bisch z'spät, da git's nüt z'dischputiere!", clip: "monika_zspaet" }
        ],
        playerLines: [
            { text: "Ich bi genau 2.54 später!", clip: "thenerean_254" },
            { text: "Morgartenstrasse isch kaputt und blockiert!", clip: "thenerean_morgarten_blockiert" },
            { text: "Gsetzestext?! Ich rascht us!", clip: "thenerean_zspaet_raschtaus" },
            { text: "Entschuldigung, ich bi 4 Minute später!", clip: "thenerean_entschuldigung" },
            { text: "Lippenstift?!", clip: "thenerean_lippenstift" }
        ],
        obstacleTypes: ["warning_letter", "clock", "traffic_cone"],
        collectibleTypes: ["coffee", "energy_drink"]
    },
    {
        id: 2,
        yearText: "1. LEHRJAHR (TEIL 2)",
        name: "Klassenzimmer 302: Direkt-Duell Monika",
        mode: "direct_boss",
        modeBadge: "🔔 SCHALTER-ARENA",
        featureTag: "🔔 DIREKT IM KLASSENZIMMER! NUTZE DEN BEAMER-SCHALTER & PERFEKT-BLOCK [R]!",
        missionBadge: "🔔 SCHUL-BEAMER",
        bgType: "classroom",
        bgPath: "assets/backgrounds/bg_classroom.jpg",
        accentColor: "#3742fa",
        ambientStyle: "classroom",
        targetDistance: 0,
        music: "assets/music/Sirünän_Silicancumar.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: true,
            duckObstacles: false,
            lavaPits: false,
            sprintPads: false,
            platformStyle: "desk"
        },
        arenaSwitch: {
            enabled: true,
            label: "🔔 BEAMER-SCHALTER",
            icon: "🔔",
            dmg: 70,
            stunFrames: 75,
            cooldownFrames: 480,
            effectText: "🔔 BEAMER KRACHT AUF MONIKA!"
        },
        bossShieldEnabled: true,
        preBossEncounter: {
            speaker: "Monika Schneider",
            avatar: "assets/sprites/monika_avatar.png",
            text: "Sofort weg mit dem Ding! Kei Chopfhörer im Unterricht — gang uf die Platz!",
            clip: "monika_keine_kopfhoerer",
            playerResponse: "Ich will doch nur d'Gsetzestext! DNS Request cha nöd gmacht werde!",
            playerClip: "thenerean_gesetz_dns"
        },
        bossType: "monika",
        bossName: "Monika Schneider (Klassenlehrerin)",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 540,
        bossLines: [
            { text: "Kei Chopfhörer im Unterricht! Gib mir das da ane!", clip: "monika_keine_kopfhoerer" },
            { text: "S'Mikrofon gaht scho wieder nöd! — Moment!", clip: "monika_mikrofon_hilfe" },
            { text: "Mis Passwort staht im Buech i de Gsetzestext!", clip: "monika_passwort_buech" },
            { text: "Gang uf die Platz!", clip: "monika_gang_uf_platz" },
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Ganz ruhig!", clip: "monika_ganz_ruhig" }
        ],
        playerLines: [
            { text: "Ich bi genau 2.54 später!", clip: "thenerean_254" },
            { text: "Ich will doch nur d'Gsetzestext!", clip: "thenerean_gesetz_dns" },
            { text: "Herr Adam, ich stah doch da!", clip: "thenerean_stah" },
            { text: "Gsetzestext?! Das isch mir egal — ich rascht us!", clip: "thenerean_zspaet_raschtaus" }
        ],
        obstacleTypes: ["warning_letter", "clock", "traffic_cone"],
        collectibleTypes: ["coffee", "law_book", "energy_drink"]
    },
    {
        id: 3,
        yearText: "2. LEHRJAHR (TEIL 1)",
        name: "Sporthalle Korridor: 3-Wellen Rivalen-Ansturm",
        mode: "wave_rush",
        modeBadge: "🌊 3-WELLEN-BRAWL",
        featureTag: "🎒 KEIN VORLAUF! ÜBERSTEHE 3 RIVALEN-WELLEN IM KORRIDOR!",
        missionBadge: "🎒 WELLE 1 / 3",
        bgType: "gym_hallway",
        bgPath: "assets/backgrounds/bg_gym_hallway.jpg",
        accentColor: "#ffa502",
        ambientStyle: "corridor",
        targetDistance: 0,
        music: "assets/music/Sivassklicumar_Morning.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: true,
            duckObstacles: false,
            lavaPits: false,
            sprintPads: false,
            platformStyle: "gym_box"
        },
        waves: [
            {
                title: "WELLE 1 / 3: KORRIDOR-SCOUT",
                banner: "⚡ WELLE 1 / 3 — ENERGY-SPRINTER GREIFT AN!",
                primary: { name: "Average GIBB Schüler (Scout)", type: "gibb_student", hp: 200, avatar: "assets/sprites/gibb_student_avatar.png" },
                partner: null
            },
            {
                title: "WELLE 2 / 3: DOPPEL-TEAM!",
                banner: "🎒🎒 WELLE 2 / 3 — ZWEI GIBB-RIVALEN GLEICHZEITIG!",
                primary: { name: "GIBB Energy-Sprinter", type: "gibb_student", hp: 185, avatar: "assets/sprites/gibb_student_avatar.png" },
                partner: { name: "GIBB Laptop-Nerd", type: "gibb_student", hp: 185, avatar: "assets/sprites/gibb_student_avatar.png" }
            },
            {
                title: "WELLE 3 / 3: CHEF-RIVALE!",
                banner: "🔥 LETZTE WELLE 3 / 3 — KLASSEN-BOSS!",
                primary: { name: "Chef-Rivale (Average GIBB Schüler)", type: "gibb_student", hp: 310, avatar: "assets/sprites/gibb_student_avatar.png" },
                partner: null
            }
        ],
        bossType: "gibb_student",
        bossName: "Average GIBB Schüler",
        bossAvatar: "assets/sprites/gibb_student_avatar.png",
        bossSprite: "assets/sprites/gibb_student_sprite.png",
        bossHP: 200,
        bossLines: [
            { text: "Ich will Fortnite spiele! Ich bi de King vo TikTok!", clip: "student_tiktok_fortnite" },
            { text: "Ich bin der Cringe King von TikTok!", clip: "student_cringe_king" },
            { text: "Erst mal Energy exen!", clip: "thenerean_raste_aus" },
            { text: "An mir chunnsch nöd verbi!", clip: "thenerean_sport_late" }
        ],
        playerLines: [
            { text: "Du hesch gmeint du chasch mi schlah?!", clip: "thenerean_chasch_mi_schlah" },
            { text: "Niemert chunt an mir verbi!", clip: "thenerean_niemert_verbi" },
            { text: "TARONUMAN!! AAAAAH!!", clip: "thenerean_taronuman_scream" },
            { text: "Ultra Shout!", clip: "thenerean_ultra" }
        ],
        obstacleTypes: ["whistle", "basketball", "frisbee"],
        collectibleTypes: ["coffee", "energy_drink"]
    },
    {
        id: 4,
        yearText: "2. LEHRJAHR (TEIL 2)",
        name: "GIBB Turnhalle: Ziel-Parcours & Herr Adam",
        mode: "target_run_boss",
        modeBadge: "🎯 ZIELE + HERR ADAM",
        featureTag: "🎯 TRIFF 6 PRÜFUNGS-ZIELE IM LAUF → SCHWÄCHT HERR ADAM IN DER HALLE!",
        missionBadge: "🎯 ZIELE: 0 / 6",
        targetGoalCount: 6,
        bgType: "gym_turnhalle",
        bgPath: "assets/backgrounds/bg_gym_turnhalle.jpg",
        accentColor: "#ff6348",
        ambientStyle: "gym",
        targetDistance: 3000,
        music: "assets/music/Optical_Glide.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: true,
            pitTheme: "lava",
            sprintPads: true,
            platformStyle: "gym_box"
        },
        arenaSwitch: {
            enabled: true,
            label: "🏀 KORBWURF-SCHALTER",
            icon: "🏀",
            dmg: 65,
            stunFrames: 75,
            cooldownFrames: 500,
            effectText: "🏀 KORBWURF! HERR ADAM BETÄUBT!"
        },
        arenaFloorHazards: true,
        preBossEncounter: {
            speaker: "Herr Adam",
            avatar: "assets/sprites/adam_avatar.png",
            text: "Silvankumar?! Du bisch abwesend... Moment — als Sportlehrer isch das Setup genehmigt!",
            clip: "adam_abwesend_sketch",
            playerResponse: "HERR ADAM, ICH STAH DOCH DA — VOLLTREFFER!",
            playerClip: "thenerean_stah"
        },
        bossType: "adam",
        bossName: "Herr Adam (Sportlehrer)",
        bossAvatar: "assets/sprites/adam_avatar.png",
        bossSprite: "assets/sprites/adam_sprite.png",
        bossHP: 680,
        bossLines: [
            { text: "Da hast du 20 Frisbees!", clip: "adam_20_frisbees" },
            { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" },
            { text: "Als Sportlehrer: Setup top, genehmigt!", clip: "adam_setup_genehmigt" },
            { text: "Du hesch de Schuss verpasst — Strafe!", clip: "adam_strafe_verpasst" },
            { text: "Abwesend?! Mach en Sketch!", clip: "adam_abwesend_sketch" },
            { text: "Hilf mir!", clip: "adam_hilf_mir" }
        ],
        playerLines: [
            { text: "Herr Adam, ich stah doch da!", clip: "thenerean_stah" },
            { text: "Sportlehrer, ich bi z'spät im Turnunterricht!", clip: "thenerean_sport_late" },
            { text: "Banana Monika!", clip: "thenerean_banana_monika" },
            { text: "Ich raste gerade komplett aus!", clip: "thenerean_raste_aus" },
            { text: "ULTRA FRISBEE!", clip: "thenerean_ultra_frisbee" }
        ],
        obstacleTypes: ["frisbee", "basketball", "whistle"],
        collectibleTypes: ["coffee", "energy_drink"]
    },
    {
        id: 5,
        yearText: "3. LEHRJAHR (TEIL 1)",
        name: "Serverraum: TukTuk-Flucht & Pflicht-Bosskampf",
        mode: "tuktuk_chase_boss",
        modeBadge: "🛺 FLUCHT + TUKTUK-BOSS",
        featureTag: "🛺 ENTKOMME DEM TUKTUK BIS ZUM NOT-AUS — DANACH FINALER TUKTUK-KAMPF!",
        missionBadge: "🛺 FLUCHT ZUM NOT-AUS",
        chaserActive: true,
        bgType: "server_room",
        bgPath: "assets/backgrounds/bg_server_srilanka.jpg",
        accentColor: "#00d2d3",
        ambientStyle: "server",
        targetDistance: 3000,
        music: "assets/music/Die_Rache_der_Maschine.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: true,
            pitTheme: "lava",
            sprintPads: true,
            platformStyle: "server_rack"
        },
        arenaSwitch: {
            enabled: true,
            label: "❄️ SERVER-KÜHLUNG",
            icon: "❄️",
            dmg: 80,
            stunFrames: 90,
            cooldownFrames: 480,
            effectText: "❄️ KÄLTESCHOCK! GPU ÜBERKÜHLT!"
        },
        preBossEncounter: {
            speaker: "TukTuk & Overheating GPU",
            avatar: "assets/sprites/tuktuk_avatar.png",
            text: "TÄSCHFRESSER! Du bisch mir entcho — ABER JETZT KÄMPFEN WIR IM SERVERRAUM!",
            clip: "tuktuk_taeschfresser_gpu",
            playerResponse: "Verdammte Maschine! Jetzt mach ich deine GPU kalt!",
            playerClip: "thenerean_verdammt_maschine"
        },
        bossType: "tuktuk_gpu",
        bossName: "TukTuk MK-I (Server-GPU)",
        bossAvatar: "assets/sprites/tuktuk_avatar.png",
        bossSprite: "assets/sprites/tuktuk_sprite.png",
        bossHP: 700,
        bossLines: [
            { text: "TÄSCHFRESSER! GPU überhitzt!", clip: "tuktuk_taeschfresser_gpu" },
            { text: "Isst d'Melone mit zwei Grafikkarten!", clip: "tuktuk_gpu_melone" },
            { text: "Nein! Nicht schon wieder ein Grafikkarte Fehler!", clip: "thenerean_gpu" },
            { text: "Verdammte Grafikkarte!", clip: "thenerean_grafikkarte" },
            { text: "Direkt aus Sri Lanka!", clip: "thenerean_srilanka" }
        ],
        playerLines: [
            { text: "My Silicon Valley bugs are endless!", clip: "thenerean_silicon_bugs" },
            { text: "Ich ha s'geilschte GIBB-Setup überhaupt!", clip: "thenerean_geilschte_setup" },
            { text: "Verdammte Maschine!", clip: "thenerean_verdammt_maschine" },
            { text: "DNS Request cha nöd gmacht werde!", clip: "thenerean_gesetz_dns" }
        ],
        obstacleTypes: ["broken_cable", "server_stack", "clock"],
        collectibleTypes: ["law_book", "coffee", "energy_drink"]
    },
    {
        id: 6,
        yearText: "3. LEHRJAHR (TEIL 2)",
        name: "ABU-Zimmer B404: Or-Gesetz & Klassen-Kombo",
        mode: "abu_duo_ambush",
        modeBadge: "📘 ABU-WITZE + KOMBO",
        featureTag: "📘 OR ART. 321! SAMMLE GESETZESTEXTE → MONIKA & GIBB SCHÜLER KOMBO-ANGRIFF!",
        missionBadge: "📘 ABU B404",
        bgType: "abu_room",
        bgPath: "assets/backgrounds/bg_abu_room.jpg",
        accentColor: "#2ed573",
        ambientStyle: "classroom",
        targetDistance: 2400,
        music: "assets/music/The_Virus_Is_The_Law.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: false,
            sprintPads: true,
            platformStyle: "abu_desk",
            clearPlatformUnder: true
        },
        bossShieldEnabled: true,
        arenaSwitch: {
            enabled: true,
            label: "📜 OR-GESETZ-SCHALTER",
            icon: "📜",
            dmg: 80,
            stunFrames: 85,
            cooldownFrames: 480,
            effectText: "📜 OR ART. 321! MONIKA & RIVALE BETÄUBT!"
        },
        preBossEncounter: {
            speaker: "Monika & Klassen-Streber",
            avatar: "assets/sprites/monika_avatar.png",
            text: "Das isch jetzt würkli en ABU-Test! 2.54 Minuten z'spät — wir prüfen dich zu zweit!",
            clip: "monika_abu_test",
            playerResponse: "OR ART. 321: DNS Request cha nöd gmacht werde — ich will Gesetzestext!",
            playerClip: "thenerean_gesetz_dns"
        },
        bossType: "duo",
        bossName: "Monika Schneider (ABU-Leitung)",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 640,
        partnerType: "gibb_student",
        partnerName: "Average GIBB Schüler (ABU-Streber)",
        partnerAvatar: "assets/sprites/gibb_student_avatar.png",
        partnerHP: 440,
        bossLines: [
            { text: "Das isch jetzt en ABU-Test!", clip: "monika_abu_test" },
            { text: "Kei Zügnis — im ABU-Zimmer igsperrt!", clip: "monika_abu_eingesperrt" },
            { text: "Mis Passwort staht im Buech!", clip: "monika_passwort_buech" },
            { text: "Ich bin der Cringe King von TikTok!", clip: "student_cringe_king" },
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" }
        ],
        playerLines: [
            { text: "Z'spät? Da git's nüt z'dischputiere — ICH RASCHT US!", clip: "thenerean_zspaet_raschtaus" },
            { text: "DNS Request cha nöd gmacht werde!", clip: "thenerean_gesetz_dns" },
            { text: "Selber Bankomat!", clip: "thenerean_bankomat" },
            { text: "Ich bi genau 2.54 später!", clip: "thenerean_254" }
        ],
        obstacleTypes: ["warning_letter", "clock", "traffic_cone"],
        collectibleTypes: ["law_book", "coffee", "energy_drink"]
    },
    {
        id: 7,
        yearText: "3. LEHRJAHR (TEIL 3)",
        name: "GIBB Mensa & Kiosk: Bankomat-Raub & Duo",
        mode: "bankomat_survival",
        modeBadge: "🪙 BANKOMAT + DUO",
        featureTag: "🪙 SCHNAPP BANKOMAT-JETONS (-HP BONUS) → HERR ADAM & KIOSK-RIVALE!",
        missionBadge: "🪙 JETONS: 0 / 8",
        targetGoalCount: 8,
        bgType: "mensa_kiosk",
        bgPath: "assets/backgrounds/bg_mensa_kiosk.jpg",
        accentColor: "#ffa502",
        ambientStyle: "corridor",
        targetDistance: 2700,
        music: "assets/music/Cold_Steel_Beams.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: false,
            sprintPads: true,
            platformStyle: "mensa_tile"
        },
        arenaFloorHazards: true,
        arenaSwitch: {
            enabled: true,
            label: "🏧 BANKOMAT-JACKPOT",
            icon: "🏧",
            dmg: 85,
            stunFrames: 85,
            cooldownFrames: 500,
            healPlayer: 18,
            effectText: "🏧 SELBER BANKOMAT! -85 BOSS HP & +18 HP CASHBACK!"
        },
        preBossEncounter: {
            speaker: "Herr Adam & Kiosk-Boss",
            avatar: "assets/sprites/adam_avatar.png",
            text: "Du hesch de Schuss am Kiosk verpasst! Jetzt gits e Strafe — mir zahled s'Chicken Curry z'zweit heim!",
            clip: "adam_strafe_verpasst",
            playerResponse: "Ich bin der Thenerean und SELBER BANKOMAT! Her mit den V-Bucks & Jetons!",
            playerClip: "thenerean_bankomat"
        },
        bossType: "duo",
        bossName: "Herr Adam (Mensa-Chef)",
        bossAvatar: "assets/sprites/adam_avatar.png",
        bossSprite: "assets/sprites/adam_sprite.png",
        bossHP: 740,
        partnerType: "gibb_student",
        partnerName: "GIBB Kiosk-Boss (Energy-Dealer)",
        partnerAvatar: "assets/sprites/gibb_student_avatar.png",
        partnerHP: 520,
        bossLines: [
            { text: "Du hesch de Schuss verpasst — Strafe!", clip: "adam_strafe_verpasst" },
            { text: "Gell, s'Chicken Curry isch guet!", clip: "monika_chicken_curry" },
            { text: "Ich will Fortnite & TikTok!", clip: "student_tiktok_fortnite" },
            { text: "Da hast du 20 Frisbees!", clip: "adam_20_frisbees" },
            { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" }
        ],
        playerLines: [
            { text: "Tamil V-Bucks Cashback Power!!", clip: "thenerean_tamil_vbucks" },
            { text: "Das isch e absoluti Frechheit!", clip: "thenerean_frechheit" },
            { text: "Ich bin der Thenerean und selber Bankomat!", clip: "thenerean_bankomat" },
            { text: "Lippenstift?!", clip: "thenerean_lippenstift" }
        ],
        obstacleTypes: ["frisbee", "basketball", "whistle"],
        collectibleTypes: ["jeton", "coffee", "energy_drink"]
    },
    {
        id: 8,
        yearText: "4. LEHRJAHR (TEIL 1)",
        name: "Colombo Cyber-Highway: Dual-GPU TukTuk MK-II",
        mode: "tuktuk_overclock_duel",
        modeBadge: "🎮 DUAL-GPU MK-II",
        featureTag: "🔥 SRI LANKA HIGHWAY → MONSTER-BOSS DUAL-GPU TUKTUK MK-II (DOUBLE-TURBO!)",
        missionBadge: "🔥 DUAL-GPU MK-II",
        bgType: "srilanka_highway",
        bgPath: "assets/backgrounds/bg_srilanka_highway.jpg",
        accentColor: "#ff6348",
        ambientStyle: "server",
        targetDistance: 2850,
        music: "assets/music/Motherboard_Bleeding.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: true,
            pitTheme: "lava",
            sprintPads: true,
            platformStyle: "highway_deck"
        },
        bossShieldEnabled: true,
        arenaSwitch: {
            enabled: true,
            label: "🧊 FLÜSSIGSTICKSTOFF",
            icon: "🧊",
            dmg: 95,
            stunFrames: 100,
            cooldownFrames: 490,
            effectText: "🧊 STICKSTOFF-KÜHLUNG! DUAL-GPU GEFROREN!"
        },
        preBossEncounter: {
            speaker: "Dual-GPU TukTuk MK-II",
            avatar: "assets/sprites/tuktuk_dual_avatar.png",
            text: "TÄSCHFRESSER!! DIREKT AUS SRI LANKA MIT ZWEI RTX GRAFIKKARTEN — DOUBLE-TURBO!",
            clip: "tuktuk_taeschfresser_gpu",
            playerResponse: "Jetzt isch Thenerean de Gemini King! Dini Silicon Valley Bugs stoppe mi nöd!",
            playerClip: "thenerean_gemini_king"
        },
        bossType: "tuktuk_dual_gpu",
        bossName: "Dual-GPU TukTuk MK-II (Overclocked)",
        bossAvatar: "assets/sprites/tuktuk_dual_avatar.png",
        bossSprite: "assets/sprites/characters/tuktuk_dual_idle.png",
        bossHP: 980,
        bossAggression: 0.98,
        bossLines: [
            { text: "Isst d'Melone mit zwei Grafikkarten!", clip: "tuktuk_gpu_melone" },
            { text: "TÄSCHFRESSER! RTX Übertaktet!", clip: "tuktuk_taeschfresser_gpu" },
            { text: "MWAHAHAHA!", clip: "boss_evil_laugh" },
            { text: "Nein! Nicht schon wieder ein Grafikkarte Fehler!", clip: "thenerean_gpu" },
            { text: "Direkt aus Sri Lanka!", clip: "thenerean_srilanka" }
        ],
        playerLines: [
            { text: "My Silicon Valley bugs are endless!", clip: "thenerean_silicon_bugs" },
            { text: "TARONUMAN!! AAAAAH!!", clip: "thenerean_taronuman_scream" },
            { text: "Jetzt isch Sirünän de Gemini King!", clip: "thenerean_gemini_king" },
            { text: "Ich raste gerade komplett aus!", clip: "thenerean_raste_aus" }
        ],
        obstacleTypes: ["broken_cable", "server_stack", "traffic_cone"],
        collectibleTypes: ["energy_drink", "law_book", "coffee"]
    },
    {
        id: 9,
        yearText: "4. LEHRJAHR (TEIL 2)",
        name: "Server-Bunker: Monika & Dual-GPU Super-Kombo",
        mode: "gauntlet_trio_combo",
        modeBadge: "⚡ SUPER-KOMBO 1580HP",
        featureTag: "💥 DIREKT IM BUNKER! MONIKA + DUAL-GPU TUKTUK MK-II + NOTSTROM-SCHALTER!",
        missionBadge: "⚡ BUNKER-ALPTRAUM",
        bgType: "cyber_bunker",
        bgPath: "assets/backgrounds/bg_cyber_bunker.jpg",
        accentColor: "#00d2d3",
        ambientStyle: "server",
        targetDistance: 0,
        music: "assets/music/Override_the_Kill_Switch.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: true,
            duckObstacles: false,
            lavaPits: false,
            sprintPads: false,
            platformStyle: "server_rack"
        },
        arenaLiftPlatform: true,
        arenaFloorHazards: true,
        bossShieldEnabled: true,
        arenaSwitch: {
            enabled: true,
            label: "⚡ NOTSTROM-SCHALTER",
            icon: "⚡",
            dmg: 90,
            stunFrames: 85,
            cooldownFrames: 500,
            effectText: "⚡ EMP-STROMSTOSS! MONIKA & DUAL-GPU BETÄUBT!"
        },
        preBossEncounter: {
            speaker: "Monika Schneider & Dual-GPU TukTuk MK-II",
            avatar: "assets/sprites/tuktuk_dual_avatar.png",
            text: "Dini Lehrziit gaht i d'Brüch — hüt hani mir s'Dual-GPU TukTuk us Sri Lanka bstellt!",
            clip: "monika_altstadt_lehre",
            playerResponse: "BANANA MONIKA?! IM SERVER-BUNKER ICH STAH BIS ZUM SCHLUSS!",
            playerClip: "thenerean_banana_monika"
        },
        bossType: "duo",
        bossName: "Monika Schneider (Bunker-Kommandant)",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 780,
        partnerType: "tuktuk_dual_gpu",
        partnerName: "Dual-GPU TukTuk MK-II",
        partnerAvatar: "assets/sprites/tuktuk_dual_avatar.png",
        partnerHP: 800,
        bossAggression: 0.94,
        bossLines: [
            { text: "Dini Lehr gaht i d'Altstadt abe!", clip: "monika_altstadt_lehre" },
            { text: "Zwei Grafikkarten! Overclock!", clip: "tuktuk_gpu_melone" },
            { text: "MWAHAHAHA!", clip: "boss_evil_laugh" },
            { text: "Igsparrt im Server-Bunker!", clip: "monika_abu_eingesperrt" },
            { text: "Verdammte Grafikkarte!", clip: "thenerean_grafikkarte" }
        ],
        playerLines: [
            { text: "Ich stah bis zum Schluss!", clip: "thenerean_stah_bis_schluss" },
            { text: "My Silicon Valley bugs!", clip: "thenerean_silicon_bugs" },
            { text: "Gemini King übernimmt!", clip: "thenerean_gemini_king" },
            { text: "Verdammte Maschine!", clip: "thenerean_verdammt_maschine" }
        ],
        obstacleTypes: ["broken_cable", "warning_letter", "server_stack"],
        collectibleTypes: ["energy_drink", "law_book", "coffee"]
    },
    {
        id: 10,
        yearText: "4. LEHRJAHR (GROSSES EFZ FINALE)",
        name: "EFZ Prüfungs-Auditorium: Die Ultimative Prüfung",
        mode: "final_efz_gauntlet",
        modeBadge: "👑 GROSSES EFZ-FINALE",
        featureTag: "👑 2-PHASEN FINALE: AUFSICHT → MONIKA + ADAM (2230 HP, DUAL-SCHILD, 3× SPERRFRIST)!",
        missionBadge: "👑 EFZ PRÜFUNGS-FINALE",
        bgType: "exam_auditorium",
        bgPath: "assets/backgrounds/bg_exam_auditorium.jpg",
        accentColor: "#ffd32a",
        ambientStyle: "finale",
        targetDistance: 0,
        music: "assets/music/Rewrite_The_Sky_RMX.mp3",
        hasMiniBoss: false,
        hasVanguard: true,
        vanguardName: "Chef-Aufsicht (GIBB Prüfungs-Gatekeeper)",
        vanguardType: "gibb_student",
        vanguardAvatar: "assets/sprites/gibb_student_avatar.png",
        vanguardHP: 420,
        mechanics: {
            platforms: true,
            duckObstacles: false,
            lavaPits: false,
            sprintPads: false,
            platformStyle: "auditorium_bridge"
        },
        arenaLiftPlatform: true,
        arenaFloorHazards: true,
        bossShieldEnabled: true,
        duoShieldEnabled: true,
        phase2Threshold: 0.54,
        bossAggression: 0.88,
        arenaSwitch: {
            enabled: true,
            label: "🏆 EFZ-DIPLOM-SCHALTER",
            icon: "🏆",
            dmg: 95,
            stunFrames: 90,
            cooldownFrames: 520,
            effectText: "🏆 EFZ-DIPLOM-SCHOCK! BEIDE PRÜFER BETÄUBT!"
        },
        preBossEncounter: {
            speaker: "Monika Schneider & Herr Adam",
            avatar: "assets/sprites/monika_avatar.png",
            text: "Grüezi Herr Adam, wie läufts?! — Selberbank! Si müend das a dr EFZ-Endprüefig korrigiere!",
            clip: "monika_adam_korrigiere",
            playerResponse: "ICH HOL MIR DEN HEILIGEN GRAL — DAS EFZ DIPLOM MIT NOTE 6.0!!",
            playerClip: "thenerean_heilig_gral"
        },
        bossType: "duo",
        bossName: "Monika Schneider (Ober-Prüferin)",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 1150,
        partnerType: "adam",
        partnerName: "Herr Adam (Sport-Prüfer)",
        partnerAvatar: "assets/sprites/adam_avatar.png",
        partnerHP: 1080,
        bossLines: [
            { text: "Selberbank! Si müend das korrigiere!", clip: "monika_adam_korrigiere" },
            { text: "Du hesch de Schuss verpasst — Strafe!", clip: "adam_strafe_verpasst" },
            { text: "Abwesend?! Herr Adam prüeft!", clip: "adam_abwesend_sketch" },
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Da hast du 20 Frisbees!", clip: "adam_20_frisbees" },
            { text: "Du bisch z'spät, da git's nüt z'dischputiere!", clip: "monika_zspaet" }
        ],
        playerLines: [
            { text: "DER HEILIGE GRAL DES EFZ!!", clip: "thenerean_heilig_gral" },
            { text: "TARONUMAN!! AAAAAH!!", clip: "thenerean_taronuman_scream" },
            { text: "HERR ADAM, ICH STAH DOCH DA!", clip: "thenerean_stah" },
            { text: "Ich bi genau 2.54 später!", clip: "thenerean_254" },
            { text: "ULTRA SHOUT!", clip: "thenerean_ultra" }
        ],
        obstacleTypes: ["frisbee", "warning_letter", "basketball", "broken_cable"],
        collectibleTypes: ["law_book", "coffee", "diploma_shard"]
    }
];

window.LEVELS_CONFIG = LEVELS_CONFIG;
