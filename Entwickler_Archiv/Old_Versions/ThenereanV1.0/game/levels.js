/**
 * Thenerean Selvabankumar - Level Definitions
 * 4 Lehrjahre at GIBB Bern
 */

const LEVELS_CONFIG = [
    {
        id: 1,
        yearText: "1. LEHRJAHR",
        name: "GIBB Eingang: Der 4-Minuten Sprint",
        bgType: "gibb_entrance",
        targetDistance: 2400,
        music: "assets/music/Sirünän_Silicancumar.mp3",
        introDialogue: {
            speaker: "Monika Schneider",
            avatar: "assets/sprites/monika_avatar.png",
            text: "Pünktlichkeit ist oberste Gebot! Du bist schon wieder 4 Minuten zu spät, Thenerean!",
            clip: "monika_puenktlichkeit"
        },
        bossType: "monika",
        bossName: "Monika Schneider",
        bossAvatar: "assets/sprites/monika_avatar.png",
        bossSprite: "assets/sprites/monika_sprite.png",
        bossHP: 100,
        bossLines: [
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Jetzt ist genug, Gang auf die Platz!", clip: "monika_gang_platz" }
        ],
        playerLines: [
            { text: "Entschuldigung Monika Schneider, ich bi 4 Minuten später!", clip: "thenerean_entschuldigung" }
        ],
        obstacleTypes: ["warning_letter", "clock", "traffic_cone"],
        collectibleTypes: ["coffee", "badge"]
    },
    {
        id: 2,
        yearText: "2. LEHRJAHR",
        name: "Turnhalle & Herr Adams Frisbee-Hagel",
        bgType: "gym_frisbee",
        targetDistance: 2800,
        music: "assets/music/Thanuran_Takeover.mp3",
        introDialogue: {
            speaker: "Herr Adam",
            avatar: "assets/sprites/adam_avatar.png",
            text: "Da hast du 20 Frisbees! Silvankumar, ist der Thenerean da?!",
            clip: "adam_silvankumar"
        },
        bossType: "adam",
        bossName: "Herr Adam",
        bossAvatar: "assets/sprites/adam_avatar.png",
        bossSprite: "assets/sprites/adam_sprite.png",
        bossHP: 120,
        bossLines: [
            { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" },
            { text: "Da hast du 20 Frisbees!", clip: "adam_frisbee" }
        ],
        playerLines: [
            { text: "Herr Adam, ich stah doch da!", clip: "thenerean_stah" }
        ],
        obstacleTypes: ["frisbee", "whistle", "bench"],
        collectibleTypes: ["coffee", "frisbee_catch"]
    },
    {
        id: 3,
        yearText: "3. LEHRJAHR",
        name: "Sri Lanka TukTuk & Serverraum-Brand",
        bgType: "srilanka_servers",
        targetDistance: 3200,
        music: "assets/music/Chasin_Dreams_Tharunan_s_Theme_.mp3",
        introDialogue: {
            speaker: "Thenerean Selvabankumar",
            avatar: "assets/sprites/thenerean_avatar.png",
            text: "Jetzt fahr ich da im TukTuk durch Sri Lanka und plötzlich stürzt der GIBB Server ab!",
            clip: "thenerean_srilanka"
        },
        bossType: "tuktuk_gpu",
        bossName: "Überhitzte GPU & TukTuk",
        bossAvatar: "assets/sprites/thenerean_avatar.png",
        bossSprite: "assets/sprites/tuktuk_sprite.png",
        bossHP: 140,
        bossLines: [
            { text: "Nein! Nicht schon wieder ein Grafikkarte-Fehler!", clip: "thenerean_grafikkarte" }
        ],
        playerLines: [
            { text: "Ich will doch nur Gesetzestext studieren!", clip: "thenerean_gesetz" }
        ],
        obstacleTypes: ["gpu_fire", "coconuts", "broken_cable"],
        collectibleTypes: ["law_book", "energy_drink"]
    },
    {
        id: 4,
        yearText: "4. LEHRJAHR (FINALE)",
        name: "Die EFZ Abschlussprüfung: Adam & Schneider",
        bgType: "gibb_exam_hall",
        targetDistance: 3600,
        music: "assets/music/Sirünän_Reign.mp3",
        introDialogue: {
            speaker: "Monika & Herr Adam",
            avatar: "assets/sprites/adam_avatar.png",
            text: "Letzte Chance Thenerean! Wenn du nicht pünktlich antwortest, kein Diplom!",
            clip: "monika_ganz_ruhig"
        },
        bossType: "duo",
        bossName: "Duo Schneider & Adam",
        bossAvatar: "assets/sprites/adam_avatar.png",
        bossSprite: "assets/sprites/adam_sprite.png",
        bossHP: 180,
        bossLines: [
            { text: "Silvankumar, ist der Thenerean da?", clip: "adam_silvankumar" },
            { text: "Pünktlichkeit ist oberste Gebot!", clip: "monika_puenktlichkeit" },
            { text: "Gang auf die Platz!", clip: "monika_gang_platz" }
        ],
        playerLines: [
            { text: "HERR ADAM, ICH STAH DOCH DA!", clip: "thenerean_stah" },
            { text: "Ich will mein Diplom!", clip: "thenerean_gesetz" }
        ],
        obstacleTypes: ["frisbee", "warning_letter", "gpu_fire"],
        collectibleTypes: ["diploma_shard", "coffee", "law_book"]
    }
];

window.LEVELS_CONFIG = LEVELS_CONFIG;
