/**
 * Thenerean Selvabankumar - High-End Levels Configuration
 * 6 hand-crafted GIBB Bern & Sri Lanka stages with custom parallax backgrounds,
 * authentic voice banter, unique per-level traversal mechanics (Duck Barriers, Sprint Pads,
 * Jump-and-Run Platforms over Lava Pits), and Mid-Level Mini-Bosses ("Average GIBB Schüler").
 */

const LEVELS_CONFIG = [
    {
        id: 1,
        yearText: "1. LEHRJAHR (TEIL 1)",
        name: "GIBB Vorplatz: Die 4-Minuten Panik",
        featureTag: "⚡ SPRINT-BOOSTS & HINDERNISSE",
        bgType: "gibb_entrance",
        bgPath: "assets/backgrounds/bg_gibb_entrance.jpg",
        accentColor: "#ff4757",
        ambientStyle: "daylight",
        targetDistance: 2100,
        music: "assets/music/That_s_The_One.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: false,
            duckObstacles: false,
            lavaPits: false,
            sprintPads: true,
            platformStyle: "concrete"
        },
        preBossEncounter: {
            speaker: "Monika Schneider",
            avatar: "assets/sprites/monika_avatar.png",
            text: "Du bisch z'spät! Da git's nüt z'dischputiere!",
            clip: "monika_zspaet",
            playerResponse: "Entschuldigung Monika Schneider, ich bi 4 Minute später!",
            playerClip: "thenerean_entschuldigung"
        },
        bossType: "monika_miniboss",
        bossName: "Monika Schneider (Vorplatz)",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 350,
        bossLines: [
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Du bisch z'spät, da git's nüt z'dischputiere!", clip: "monika_zspaet" },
            { text: "Ganz ruhig bleiben!", clip: "monika_ganz_ruhig" }
        ],
        playerLines: [
            { text: "Ich bi genau 2.54 später!", clip: "thenerean_254" },
            { text: "Ich stah doch da!", clip: "thenerean_stah" },
            { text: "Lippenstift?!", clip: "thenerean_lippenstift" }
        ],
        obstacleTypes: ["warning_letter", "clock", "traffic_cone"],
        collectibleTypes: ["coffee", "energy_drink"]
    },
    {
        id: 2,
        yearText: "1. LEHRJAHR (TEIL 2)",
        name: "Klassenzimmer 302: Modul-Test & Disziplin",
        featureTag: "💨 DUCKEN (CTRL) & SCHULBANK-SPRÜNGE",
        bgType: "classroom",
        bgPath: "assets/backgrounds/bg_classroom.jpg",
        accentColor: "#3742fa",
        ambientStyle: "classroom",
        targetDistance: 2500,
        music: "assets/music/Sirünän_Silicancumar.mp3",
        hasMiniBoss: false,
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: false,
            sprintPads: true,
            platformStyle: "desk"
        },
        preBossEncounter: {
            speaker: "Monika Schneider",
            avatar: "assets/sprites/monika_avatar.png",
            text: "Pünktlichkeit ist oberste Gebot! Ohne Disziplin lernt man nicht — gang uf die Platz!",
            clip: "monika_puenktlichkeit",
            playerResponse: "Ich will doch nur Gesetzestext lernen!",
            playerClip: "thenerean_gesetz"
        },
        bossType: "monika",
        bossName: "Monika Schneider (Klassenlehrerin)",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 520,
        bossLines: [
            { text: "Gang uf die Platz!", clip: "monika_gang_uf_platz" },
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Es ist alles Schuld von der Monika Schneider!", clip: "monika_schuld" },
            { text: "Ganz ruhig!", clip: "monika_ganz_ruhig" }
        ],
        playerLines: [
            { text: "Ich bi genau 2.54 später!", clip: "thenerean_254" },
            { text: "Herr Adam, ich stah doch da!", clip: "thenerean_stah" },
            { text: "Ich will Gesetzestext!", clip: "thenerean_gesetz" }
        ],
        obstacleTypes: ["warning_letter", "clock", "traffic_cone"],
        collectibleTypes: ["coffee", "law_book", "energy_drink"]
    },
    {
        id: 3,
        yearText: "2. LEHRJAHR (TEIL 1)",
        name: "Sporthalle Korridor: Hürden & GIBB-Rivale",
        featureTag: "🎒 MINI-BOSS • 💨 HÜRDEN • 🕳️ BODENGRUBEN",
        bgType: "gym_hallway",
        bgPath: "assets/backgrounds/bg_gym_hallway.jpg",
        accentColor: "#ffa502",
        ambientStyle: "corridor",
        targetDistance: 3100,
        music: "assets/music/Sivassklicumar_Morning.mp3",
        hasMiniBoss: true,
        miniBossTriggerRatio: 0.50,
        miniBossType: "gibb_student",
        miniBossName: "Average GIBB Schüler (Korridor-Rivale)",
        miniBossAvatar: "assets/sprites/gibb_student_avatar.png",
        miniBossHP: 260,
        preMiniBossEncounter: {
            speaker: "Average GIBB Schüler",
            avatar: "assets/sprites/gibb_student_avatar.png",
            text: "Ey Thenerean! Bevor du zu Herr Adam gaahsch, muesch zerst an mir verbi — han grad en frische Energy!",
            clip: null,
            playerResponse: "Du hesch gmeint du chasch mi schlah?! Mach Platz!",
            playerClip: "thenerean_chasch_mi_schlah"
        },
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: true,
            pitTheme: "chasm",
            sprintPads: true,
            platformStyle: "gym_box"
        },
        preBossEncounter: {
            speaker: "Herr Adam",
            avatar: "assets/sprites/adam_avatar.png",
            text: "Silvankumar, ist der Thenerean da?!",
            clip: "adam_silvankumar",
            playerResponse: "Herr Adam, ich stah doch da! Ich bin doch da!",
            playerClip: "thenerean_stah"
        },
        bossType: "adam_miniboss",
        bossName: "Herr Adam (Aufwärm-Phase)",
        bossAvatar: "assets/sprites/adam_avatar.png",
        bossSprite: "assets/sprites/adam_sprite.png",
        bossHP: 480,
        bossLines: [
            { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" },
            { text: "Frisbees!", clip: "adam_frisbee" },
            { text: "Hilf mir!", clip: "adam_hilf_mir" }
        ],
        playerLines: [
            { text: "Herr Adam, ich stah doch da!", clip: "thenerean_stah" },
            { text: "Ich bin zu spät für den Sport!", clip: "thenerean_sport_spaet" },
            { text: "Ultra Shout!", clip: "thenerean_ultra" }
        ],
        obstacleTypes: ["whistle", "basketball", "frisbee"],
        collectibleTypes: ["coffee", "energy_drink"]
    },
    {
        id: 4,
        yearText: "2. LEHRJAHR (TEIL 2)",
        name: "Die GIBB Sporthalle: Lava-Parcours & Frisbees",
        featureTag: "🌋 BODEN IST LAVA • 🎒 MINI-BOSS • 🥏 20 FRISBEES",
        bgType: "gym_turnhalle",
        bgPath: "assets/backgrounds/bg_gym_turnhalle.jpg",
        accentColor: "#ff6348",
        ambientStyle: "gym",
        targetDistance: 3300,
        music: "assets/music/Thanuran_Takeover.mp3",
        hasMiniBoss: true,
        miniBossTriggerRatio: 0.50,
        miniBossType: "gibb_student",
        miniBossName: "Average GIBB Schüler (Turn-Rivale)",
        miniBossAvatar: "assets/sprites/gibb_student_avatar.png",
        miniBossHP: 310,
        preMiniBossEncounter: {
            speaker: "Average GIBB Schüler",
            avatar: "assets/sprites/gibb_student_avatar.png",
            text: "De Bode isch Lava, Kolleg! Und die Turnhall gehört hüt mir!",
            clip: null,
            playerResponse: "Niemert chunt an mir verbi — ich gang dur d'Mitti!",
            playerClip: "thenerean_niemert_verbi"
        },
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: true,
            pitTheme: "lava",
            sprintPads: true,
            platformStyle: "gym_box"
        },
        preBossEncounter: {
            speaker: "Herr Adam",
            avatar: "assets/sprites/adam_avatar.png",
            text: "Da hast du 20 Frisbees! Silvankumar, ist der Thenerean da?!",
            clip: "adam_20_frisbees",
            playerResponse: "HERR ADAM, ICH STAH DOCH DA! ICH SPIELE THENEREAN!",
            playerClip: "thenerean_stah"
        },
        bossType: "adam",
        bossName: "Herr Adam (Sportlehrer)",
        bossAvatar: "assets/sprites/adam_avatar.png",
        bossSprite: "assets/sprites/adam_sprite.png",
        bossHP: 650,
        bossLines: [
            { text: "Da hast du 20 Frisbees!", clip: "adam_20_frisbees" },
            { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" },
            { text: "Hilf mir!", clip: "adam_hilf_mir" },
            { text: "Frisbees!", clip: "adam_frisbee" }
        ],
        playerLines: [
            { text: "Herr Adam, ich stah doch da!", clip: "thenerean_stah" },
            { text: "Ich raste gerade komplett aus!", clip: "thenerean_raste_aus" },
            { text: "ULTRA FRISBEE!", clip: "thenerean_ultra_frisbee" }
        ],
        obstacleTypes: ["frisbee", "basketball", "whistle"],
        collectibleTypes: ["coffee", "energy_drink"]
    },
    {
        id: 5,
        yearText: "3. LEHRJAHR",
        name: "Serverraum & Sri Lanka: Magma & GPU-Crash",
        featureTag: "🔥 GPU-MAGMA JUMP & RUN • 💻 MINI-BOSS • ⚡ SPRINT",
        bgType: "server_room",
        bgPath: "assets/backgrounds/bg_server_srilanka.jpg",
        accentColor: "#00d2d3",
        ambientStyle: "server",
        targetDistance: 3500,
        music: "assets/music/Chasin_Dreams_Tharunan_s_Theme_.mp3",
        hasMiniBoss: true,
        miniBossTriggerRatio: 0.50,
        miniBossType: "gibb_student",
        miniBossName: "Average GIBB Schüler (Server-Nerd)",
        miniBossAvatar: "assets/sprites/gibb_student_avatar.png",
        miniBossHP: 350,
        preMiniBossEncounter: {
            speaker: "Average GIBB Schüler",
            avatar: "assets/sprites/gibb_student_avatar.png",
            text: "Bro, mini Grafikkarte überhitzt de ganze Serverbode — fang mis Laptop ab!",
            clip: null,
            playerResponse: "Verdammte Maschine! Ich will doch nur Gesetzestext!",
            playerClip: "thenerean_verdammt_maschine"
        },
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: true,
            pitTheme: "lava",
            sprintPads: true,
            platformStyle: "server_rack"
        },
        preBossEncounter: {
            speaker: "TukTuk & Overheating GPU",
            avatar: "assets/sprites/tuktuk_avatar.png",
            text: "Ich bin in Sri Lanka im TukTuk gefahren — und jetzt brennt die Grafikkarte!",
            clip: "thenerean_tuktuk",
            playerResponse: "Ich will doch nur Gesetzestext du verdammte Maschine!",
            playerClip: "thenerean_verdammt_maschine"
        },
        bossType: "tuktuk_gpu",
        bossName: "Überhitzter Server & TukTuk",
        bossAvatar: "assets/sprites/tuktuk_avatar.png",
        bossSprite: "assets/sprites/tuktuk_sprite.png",
        bossHP: 700,
        bossLines: [
            { text: "Nein! Nicht schon wieder ein Grafikkarte Fehler!", clip: "thenerean_gpu" },
            { text: "Verdammte Grafikkarte!", clip: "thenerean_grafikkarte" },
            { text: "Ich bin der Thenerean und selber Bankomat!", clip: "thenerean_bankomat" },
            { text: "Direkt aus Sri Lanka!", clip: "thenerean_srilanka" }
        ],
        playerLines: [
            { text: "Ich will Gesetzestext!", clip: "thenerean_gesetz" },
            { text: "HERR ADAM, ICH STAH DOCH DA!", clip: "thenerean_stah" },
            { text: "Verdammte Maschine!", clip: "thenerean_verdammt_maschine" }
        ],
        obstacleTypes: ["broken_cable", "server_stack", "clock"],
        collectibleTypes: ["law_book", "coffee", "energy_drink"]
    },
    {
        id: 6,
        yearText: "4. LEHRJAHR (GROSSES FINALE)",
        name: "Das EFZ Prüfungs-Auditorium: Parcours & Duo",
        featureTag: "👑 LAVA-PARCOURS • 🎒 MINI-BOSS • 🏆 DUO-FINALE",
        bgType: "exam_auditorium",
        bgPath: "assets/backgrounds/bg_exam_auditorium.jpg",
        accentColor: "#ffd32a",
        ambientStyle: "finale",
        targetDistance: 3800,
        music: "assets/music/Sirünän_Reign.mp3",
        hasMiniBoss: true,
        miniBossTriggerRatio: 0.50,
        miniBossType: "gibb_student",
        miniBossName: "Average GIBB Schüler (Klassenbester)",
        miniBossAvatar: "assets/sprites/gibb_student_avatar.png",
        miniBossHP: 390,
        preMiniBossEncounter: {
            speaker: "Average GIBB Schüler",
            avatar: "assets/sprites/gibb_student_avatar.png",
            text: "Nur wer mich schlaht dörf zur EFZ-Abschlussprüefig vor d'Schneider & Herr Adam!",
            clip: null,
            playerResponse: "Ich stah bis zum Schluss — gib mer das Diplom!",
            playerClip: "thenerean_stah_bis_schluss"
        },
        mechanics: {
            platforms: true,
            duckObstacles: true,
            lavaPits: true,
            pitTheme: "lava",
            sprintPads: true,
            platformStyle: "auditorium_bridge"
        },
        preBossEncounter: {
            speaker: "Monika Schneider & Herr Adam",
            avatar: "assets/sprites/adam_avatar.png",
            text: "Letzte Prüfung, Thenerean! Silvankumar, bist du pünktlich anwesend?!",
            clip: "adam_silvankumar",
            playerResponse: "HERR ADAM! FRAU SCHNEIDER! ICH STAH DOCH DA - UND ICH HOL DAS DIPLOM!",
            playerClip: "thenerean_stah"
        },
        bossType: "duo",
        bossName: "Monika Schneider (Prüfungsleitung)",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 900,
        partnerHP: 850,
        bossLines: [
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" },
            { text: "Da hast du 20 Frisbees!", clip: "adam_20_frisbees" },
            { text: "Gang uf die Platz!", clip: "monika_gang_platz" },
            { text: "Du bisch z'spät, da git's nüt z'dischputiere!", clip: "monika_zspaet" }
        ],
        playerLines: [
            { text: "HERR ADAM, ICH STAH DOCH DA!", clip: "thenerean_stah" },
            { text: "Ich bi genau 2.54 später!", clip: "thenerean_254" },
            { text: "Verdammte Maschine!", clip: "thenerean_verdammt_maschine" },
            { text: "ULTRA SHOUT!", clip: "thenerean_ultra" }
        ],
        obstacleTypes: ["frisbee", "warning_letter", "basketball", "broken_cable"],
        collectibleTypes: ["law_book", "coffee", "diploma_shard"]
    }
];

window.LEVELS_CONFIG = LEVELS_CONFIG;
