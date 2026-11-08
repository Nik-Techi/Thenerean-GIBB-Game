/**
 * Thenerean Selvabankumar - Expanded Levels Configuration
 * 6 rich levels with authentic backgrounds (Turnhalle / Sportunterricht,
 * Schulzimmer / Theorieunterricht, Serverraum, Bern GIBB Eingang, Finale)
 */

const LEVELS_CONFIG = [
    {
        id: 1,
        yearText: "1. LEHRJAHR (TEIL 1)",
        name: "GIBB Vorplatz: Die 4-Minuten Panik",
        bgType: "gibb_entrance",
        targetDistance: 1900,
        music: "assets/music/That_s_The_One.mp3",
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
        bossHP: 80,
        bossLines: [
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Du bisch z spät da gits nüt z dispetierä!", clip: "monika_zspaet" }
        ],
        playerLines: [
            { text: "Ich bi genau 2.54 später!", clip: "thenerean_254" },
            { text: "Ich stah doch da!", clip: "thenerean_stah" }
        ],
        obstacleTypes: ["warning_letter", "clock", "traffic_cone"],
        collectibleTypes: ["coffee", "energy_drink"]
    },
    {
        id: 2,
        yearText: "1. LEHRJAHR (TEIL 2)",
        name: "Klassenzimmer 302: Modul-Test & Disziplin",
        bgType: "classroom",
        targetDistance: 2200,
        music: "assets/music/Sirünän_Silicancumar.mp3",
        preBossEncounter: {
            speaker: "Monika Schneider",
            avatar: "assets/sprites/monika_avatar.png",
            text: "Pünktlichkeit ist oberste Gebot! Ohne Disziplin lernt man nicht, setz dich auf die Platz!",
            clip: "monika_puenktlichkeit",
            playerResponse: "Ich will doch nur Gesetzestext lernen!",
            playerClip: "thenerean_gesetz"
        },
        bossType: "monika",
        bossName: "Frau Schneider (Klassenlehrerin)",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 110,
        bossLines: [
            { text: "Gang auf die Platz!", clip: "monika_gang_platz" },
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Es ist alles Schuld von der Monika Schneider!", clip: "monika_schuld" }
        ],
        playerLines: [
            { text: "Ich bi genau 2.54 später!", clip: "thenerean_254" },
            { text: "Herr Adam, ich stah doch da!", clip: "thenerean_stah" }
        ],
        obstacleTypes: ["warning_letter", "desk", "clock"],
        collectibleTypes: ["coffee", "law_book"]
    },
    {
        id: 3,
        yearText: "2. LEHRJAHR (TEIL 1)",
        name: "Sporthalle Korridor: Aufwärmen für den Turnunterricht",
        bgType: "gym_hallway",
        targetDistance: 2100,
        music: "assets/music/Sivassklicumar_Morning.mp3",
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
        bossHP: 100,
        bossLines: [
            { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" }
        ],
        playerLines: [
            { text: "Herr Adam, ich stah doch da!", clip: "thenerean_stah" },
            { text: "Ich bin zu spät für den Sport!", clip: "thenerean_sport_spaet" }
        ],
        obstacleTypes: ["whistle", "bench", "frisbee"],
        collectibleTypes: ["coffee", "energy_drink"]
    },
    {
        id: 4,
        yearText: "2. LEHRJAHR (TEIL 2)",
        name: "Die GIBB Sporthalle: Der 20-Frisbee Hagel",
        bgType: "gym_turnhalle",
        targetDistance: 2600,
        music: "assets/music/Thanuran_Takeover.mp3",
        preBossEncounter: {
            speaker: "Herr Adam",
            avatar: "assets/sprites/adam_avatar.png",
            text: "Da hast du 20 Frisbees! Silvankumar, ist der Thenerean da?!",
            clip: "adam_20_frisbees",
            playerResponse: "HERR ADAM, ICH STAH DOCH DA! ICH SPIELE TENEREAN!",
            playerClip: "thenerean_stah"
        },
        bossType: "adam",
        bossName: "Herr Adam (Sportlehrer)",
        bossAvatar: "assets/sprites/adam_avatar.png",
        bossSprite: "assets/sprites/adam_sprite.png",
        bossHP: 130,
        bossLines: [
            { text: "Da hast du 20 Frisbees!", clip: "adam_20_frisbees" },
            { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" }
        ],
        playerLines: [
            { text: "Herr Adam, ich stah doch da!", clip: "thenerean_stah" },
            { text: "Ich raste gerade komplett aus!", clip: "thenerean_raste_aus" }
        ],
        obstacleTypes: ["frisbee", "basketball", "whistle"],
        collectibleTypes: ["coffee", "energy_drink"]
    },
    {
        id: 5,
        yearText: "3. LEHRJAHR",
        name: "Serverraum & Sri Lanka: Der GPU-Crash",
        bgType: "server_room",
        targetDistance: 2700,
        music: "assets/music/Chasin_Dreams_Tharunan_s_Theme_.mp3",
        preBossEncounter: {
            speaker: "Thenerean Selvabankumar",
            avatar: "assets/sprites/thenerean_avatar.png",
            text: "Ich bin in Sri Lanka im TukTuk gefahren und jetzt brennt der Server mit Grafikkarte-Fehler!",
            clip: "thenerean_tuktuk",
            playerResponse: "Ich will doch nur Gesetzestext du verdammt die Maschine!",
            playerClip: "thenerean_verdammt_maschine"
        },
        bossType: "tuktuk_gpu",
        bossName: "Überhitzter Server & TukTuk",
        bossAvatar: "assets/sprites/thenerean_avatar.png",
        bossSprite: "assets/sprites/tuktuk_sprite.png",
        bossHP: 140,
        bossLines: [
            { text: "Nein! Nicht schon wieder ein Grafikkarte Fehler!", clip: "thenerean_gpu" },
            { text: "Ich bin der Tanne an und selber Bankomat!", clip: "thenerean_bankomat" }
        ],
        playerLines: [
            { text: "Ich will Gesetzestext!", clip: "thenerean_gesetz" },
            { text: "HERR ADAM, ICH STAH DOCH DA!", clip: "thenerean_stah" }
        ],
        obstacleTypes: ["broken_cable", "server_stack", "fire"],
        collectibleTypes: ["law_book", "coffee"]
    },
    {
        id: 6,
        yearText: "4. LEHRJAHR (GROSSES FINALE)",
        name: "Das EFZ Prüfungs-Auditorium: Schneider & Adam",
        bgType: "exam_auditorium",
        targetDistance: 3200,
        music: "assets/music/Sirünän_Reign.mp3",
        preBossEncounter: {
            speaker: "Monika Schneider & Herr Adam",
            avatar: "assets/sprites/adam_avatar.png",
            text: "Letzte Prüfung, Thenerean! Silvankumar, bist du pünktlich anwesend?!",
            clip: "adam_silvankumar",
            playerResponse: "HERR ADAM! FRAU SCHNEIDER! ICH STAH DOCH DA - UND ICH HOL DAS DIPLOM!",
            playerClip: "thenerean_stah"
        },
        bossType: "duo",
        bossName: "Duo Schneider & Herr Adam",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 220,
        bossLines: [
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" },
            { text: "Da hast du 20 Frisbees!", clip: "adam_20_frisbees" },
            { text: "Gang auf die Platz!", clip: "monika_gang_platz" }
        ],
        playerLines: [
            { text: "HERR ADAM, ICH STAH DOCH DA!", clip: "thenerean_stah" },
            { text: "Ich bi genau 2.54 später!", clip: "thenerean_254" },
            { text: "Ich will doch nur Gesetzestext!", clip: "thenerean_verdammt_maschine" }
        ],
        obstacleTypes: ["frisbee", "warning_letter", "basketball", "broken_cable"],
        collectibleTypes: ["law_book", "coffee", "diploma_shard"]
    }
];

window.LEVELS_CONFIG = LEVELS_CONFIG;
