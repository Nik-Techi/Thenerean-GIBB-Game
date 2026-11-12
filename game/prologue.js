/**
 * Thenerean Selvabankumar — Animated Chapter Prologues (Chapters 1, 2, 3 & 4)
 *
 * Plays a staged animated canvas cutscene before each chapter (1..4):
 *  - Chapter 1: Bernmobil Linie 12 bus arrival at GIBB, 2.54s late, Monika, Herr Adam & TukTuk MK-I.
 *  - Chapter 2: Rooftop launchpad with the Mega-Melonen-Rakete, Kloten Fire Pizzas, Tung Tung Tung Sahur & Dual-GPU MK-II.
 *  - Chapter 3: Orbit & Stratosphere at 100 km altitude, Cyber Drone TukTuk MK-III, orbital laser & return to GIBB for EFZ 6.0.
 *  - Chapter 4: Arrival at the Swiss Alps Ski Resort! GIBB-Skibus rolls in, moving chairlift & gondola in the background,
 *               Herr Adam hands Thenerean a yellow Frisbee ("Nimm das Frisbee und fahr!") to ride down the mountain,
 *               explaining the Downhill, Live Slalom, Active Ski Lift climb, and Giant Ski Jump ramp!
 */

GAME_STATE.PROLOGUE = 'PROLOGUE';

const PROLOGUE_CAST = {
    thenerean: {
        name: 'THENEREAN SELVABANKUMAR',
        color: '#2ed573',
        avatar: 'thenerean_avatar',
        sprites: {
            idle: 'thenerean_idle',
            walk: 'thenerean_run',
            jump: 'thenerean_jump',
            talk: 'thenerean_attack',
            duck: 'thenerean_duck',
            rocket: 'thenerean_rocket'
        }
    },
    monika: {
        name: 'MONIKA SCHNEIDER',
        color: '#ff4757',
        avatar: 'monika_avatar',
        sprites: {
            idle: 'monika_idle',
            walk: 'monika_walk',
            talk: 'monika_point',
            attack: 'monika_attack'
        }
    },
    adam: {
        name: 'HERR ADAM (SPORTLEHRER)',
        color: '#ffa502',
        avatar: 'adam_avatar',
        sprites: {
            idle: 'adam_idle',
            walk: 'adam_run',
            talk: 'adam_windup',
            throw: 'adam_throw'
        }
    },
    student: {
        name: 'GIBB SCHÜLER',
        color: '#70a1ff',
        avatar: 'gibb_student_avatar',
        sprites: {
            idle: 'gibb_student_idle',
            walk: 'gibb_student_walk',
            talk: 'gibb_student_windup'
        }
    },
    tuktuk: {
        name: 'TUKTUK MK-I',
        color: '#a55eea',
        avatar: 'tuktuk_avatar',
        sprites: {
            idle: 'tuktuk_idle',
            walk: 'tuktuk_rage',
            talk: 'tuktuk_rage'
        }
    },
    tuktuk_dual: {
        name: 'DUAL-GPU TUKTUK MK-II',
        color: '#ff6b81',
        avatar: 'tuktuk_dual_avatar',
        sprites: {
            idle: 'tuktuk_dual_idle',
            walk: 'tuktuk_dual_rage',
            talk: 'tuktuk_dual_rage'
        }
    },
    sahur: {
        name: 'TUNG TUNG TUNG SAHUR',
        color: '#eccc68',
        avatar: 'sahur_avatar',
        sprites: {
            idle: 'sahur_idle',
            walk: 'sahur_attack',
            talk: 'sahur_attack'
        }
    },
    drone_tuktuk: {
        name: 'CYBER DRONE TUKTUK MK-III',
        color: '#00d2d3',
        avatar: 'drone_tuktuk_avatar',
        sprites: {
            idle: 'drone_tuktuk',
            walk: 'drone_tuktuk',
            talk: 'drone_tuktuk'
        }
    }
};

// =========================================================================
// CHAPTER 1–4 STAGED PROLOGUE SCRIPTS
// =========================================================================
const CHAPTER_PROLOGUES = {
    1: {
        badge: 'KAPITEL 1 • BERN, GIBB & TUKTUK-AUSBRUCH',
        subtitle: 'LORRAINESTRASSE 1 • 08:00:02.54 UHR',
        bgKey: 'bg_gibb_entrance',
        sceneType: 'gibb',
        music: 'assets/music/Override_the_Kill_Switch.mp3',
        initialActors: {
            monika: { x: 0.70, pose: 'idle', facing: -1, visible: true, scale: 1 },
            adam: { x: 0.80, pose: 'idle', facing: -1, visible: true, scale: 1 },
            student: { x: 0.89, pose: 'idle', facing: -1, visible: true, scale: 0.94 },
            tuktuk: { x: 1.16, pose: 'idle', facing: -1, visible: false, scale: 1.05 },
            thenerean: { x: 0.22, pose: 'idle', facing: 1, visible: false, scale: 1.04 }
        },
        beats: [
            {
                duration: 4.5,
                busTargetX: 0.04,
                clockText: '08:00:00',
                speaker: 'ERZÄHLER',
                speakerKey: null,
                clip: null,
                text: 'Bern, Lorrainestrasse 1 — Punkt 08:00 Uhr. Vor dem GIBB-Haupteingang fährt der Bernmobil-Bus Linie 12 quietschend vor…',
                actors: {
                    monika: { x: 0.70, pose: 'idle', facing: -1, visible: true },
                    adam: { x: 0.80, pose: 'idle', facing: -1, visible: true },
                    student: { x: 0.89, pose: 'idle', facing: -1, visible: true },
                    thenerean: { x: 0.22, pose: 'idle', facing: 1, visible: false }
                }
            },
            {
                duration: 5.0,
                busTargetX: 0.04,
                busDoorOpen: true,
                clockText: '08:00:02.54',
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_stah',
                bubble: 'Ich stah doch da!',
                text: 'Die Bustür springt auf! Thenerean Selvabankumar hechtet aus dem Bus: „Herr Adam, Frau Schneider — ich stah doch da!“',
                actors: {
                    thenerean: { x: 0.34, pose: 'walk', facing: 1, visible: true },
                    monika: { x: 0.68, pose: 'talk', facing: -1, visible: true },
                    adam: { x: 0.79, pose: 'idle', facing: -1, visible: true },
                    student: { x: 0.89, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 5.2,
                busTargetX: -0.48,
                clockText: '08:00:02.54',
                speaker: 'MONIKA SCHNEIDER',
                speakerKey: 'monika',
                clip: 'monika_zspaet',
                bubble: '2,54 Sekunden zu spät!',
                text: 'Monika Schneider tippt auf ihre goldene Taschenuhr: „Zwei Komma fünf vier Sekunden zu spät! Das gibt einen Eintrag ins Klassenbuch!“',
                actors: {
                    thenerean: { x: 0.38, pose: 'idle', facing: 1, visible: true },
                    monika: { x: 0.62, pose: 'talk', facing: -1, visible: true },
                    adam: { x: 0.78, pose: 'idle', facing: -1, visible: true },
                    student: { x: 0.89, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 5.0,
                busTargetX: -0.48,
                clockText: '08:00:05',
                speaker: 'HERR ADAM',
                speakerKey: 'adam',
                clip: 'adam_silvankumar',
                bubble: 'Silvankumar! 20 Frisbees warten!',
                text: 'Sportlehrer Herr Adam zückt seine gelben Sport-Frisbees: „Silvankumar! In der Turnhalle warten 20 Frisbees und Liegestütze auf dich!“',
                actors: {
                    thenerean: { x: 0.38, pose: 'idle', facing: 1, visible: true },
                    monika: { x: 0.62, pose: 'idle', facing: -1, visible: true },
                    adam: { x: 0.72, pose: 'talk', facing: -1, visible: true },
                    student: { x: 0.89, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 4.8,
                busTargetX: -0.48,
                clockText: '08:00:08',
                speaker: 'GIBB SCHÜLER',
                speakerKey: 'student',
                clip: 'student_tiktok_fortnite',
                bubble: 'Schon 175 Puls vor Lektion 1!',
                text: 'Ein Mitschüler schüttelt fassungslos den Kopf: „Bro hat schon 175 Puls vor der ersten Lektion — und im Keller röhrt das TukTuk!“',
                actors: {
                    thenerean: { x: 0.40, pose: 'idle', facing: 1, visible: true },
                    monika: { x: 0.62, pose: 'idle', facing: -1, visible: true },
                    adam: { x: 0.73, pose: 'idle', facing: -1, visible: true },
                    student: { x: 0.83, pose: 'talk', facing: -1, visible: true },
                    tuktuk: { x: 0.94, pose: 'walk', facing: -1, visible: true }
                }
            },
            {
                duration: 5.0,
                busTargetX: -0.48,
                clockText: '08:00:10',
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_frechheit',
                bubble: 'Das isch e Frechheit — OR & ZGB parat!',
                text: 'Thenerean zieht sein dickes OR/ZGB-Gesetzbuch: „Wegen 2,54 Sekunden so ein Theater?! Das ist eine bodenlose Frechheit!“',
                actors: {
                    thenerean: { x: 0.44, pose: 'talk', facing: 1, visible: true },
                    monika: { x: 0.64, pose: 'idle', facing: -1, visible: true },
                    adam: { x: 0.75, pose: 'idle', facing: -1, visible: true },
                    student: { x: 0.85, pose: 'idle', facing: -1, visible: true },
                    tuktuk: { x: 0.94, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 3.8,
                busTargetX: -0.48,
                clockText: '08:00:12',
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_stah_bis_schluss',
                bubble: 'Auf ins 1. Lehrjahr!',
                text: 'Die Schulglocke schrillt! Thenerean stürmt durch das Schultor der GIBB — Kapitel 1 beginnt jetzt!',
                actors: {
                    thenerean: { x: 0.56, pose: 'walk', facing: 1, visible: true },
                    monika: { x: 0.68, pose: 'attack', facing: -1, visible: true },
                    adam: { x: 0.78, pose: 'throw', facing: -1, visible: true },
                    student: { x: 0.88, pose: 'idle', facing: -1, visible: true },
                    tuktuk: { x: 0.95, pose: 'walk', facing: -1, visible: true }
                }
            }
        ]
    },

    2: {
        badge: 'KAPITEL 2 • MELONEN-RAKETE, KLOTEN & SRI LANKA',
        subtitle: 'GIBB DACH-STARTPLATZ • FLUG NACH KLOTEN & COLOMBO',
        bgKey: 'bg_sky_rocket',
        sceneType: 'rocket',
        music: 'assets/music/Rewrite_The_Sky.mp3',
        initialActors: {
            thenerean: { x: 0.25, pose: 'idle', facing: 1, visible: true, scale: 1.05 },
            monika: { x: 0.12, pose: 'walk', facing: 1, visible: true, scale: 0.98 },
            adam: { x: 0.74, pose: 'idle', facing: -1, visible: true, scale: 0.98 },
            sahur: { x: 0.86, pose: 'idle', facing: -1, visible: false, scale: 1.02 },
            tuktuk_dual: { x: 0.94, pose: 'idle', facing: -1, visible: false, scale: 1.08 }
        },
        beats: [
            {
                duration: 4.8,
                rocketY: 0,
                rocketFlame: 0.3,
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_mega_melone_rakete',
                bubble: 'WASSERMELONE! Rakete vollgetankt!',
                text: 'Nach dem Ausbruch aus dem GIBB-Serverkeller steht Thenerean auf dem Dach vor seiner selbstgebauten Mega-Melonen-Rakete!',
                actors: {
                    thenerean: { x: 0.34, pose: 'talk', facing: 1, visible: true },
                    monika: { x: 0.14, pose: 'walk', facing: 1, visible: true },
                    adam: { x: 0.76, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 4.8,
                rocketY: 0,
                rocketFlame: 0.45,
                speaker: 'MONIKA SCHNEIDER',
                speakerKey: 'monika',
                clip: 'monika_abu_eingesperrt',
                bubble: 'Unglaublich! Sofort aussteigen!',
                text: 'Monika stürmt schnaufend aufs Dach: „Unglaublich! Sie können doch während der ABU-Stunde nicht mit einer Wassermelone abheben!“',
                actors: {
                    thenerean: { x: 0.42, pose: 'idle', facing: -1, visible: true },
                    monika: { x: 0.22, pose: 'talk', facing: 1, visible: true },
                    adam: { x: 0.74, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 4.8,
                rocketY: 0,
                rocketFlame: 0.6,
                speaker: 'HERR ADAM',
                speakerKey: 'adam',
                clip: 'adam_setup_genehmigt',
                bubble: 'Ist dieses Setup überhaupt genehmigt?!',
                text: 'Herr Adam fuchtelt mit dem Klemmbrett: „Silvankumar! Ist dieses Melonen-Raketen-Setup überhaupt von der Schulleitung genehmigt?!“',
                actors: {
                    thenerean: { x: 0.46, pose: 'idle', facing: 1, visible: true },
                    monika: { x: 0.22, pose: 'idle', facing: 1, visible: true },
                    adam: { x: 0.70, pose: 'talk', facing: -1, visible: true }
                }
            },
            {
                duration: 5.0,
                rocketY: -12,
                rocketFlame: 0.85,
                speaker: 'TUNG TUNG TUNG SAHUR',
                speakerKey: 'sahur',
                clip: 'sahur_baseball_swing',
                bubble: 'TUNG TUNG SAHUR! Kloten brennt!',
                text: 'Am Horizont tauchen Tung Tung Tung Sahur und das Dual-GPU TukTuk MK-II auf: „In der Bäckerei Kloten fliegen schon die Feuer-Pizzas!“',
                actors: {
                    thenerean: { x: 0.48, pose: 'rocket', facing: 1, visible: true },
                    monika: { x: 0.20, pose: 'idle', facing: 1, visible: true },
                    adam: { x: 0.68, pose: 'idle', facing: -1, visible: true },
                    sahur: { x: 0.82, pose: 'talk', facing: -1, visible: true },
                    tuktuk_dual: { x: 0.92, pose: 'walk', facing: -1, visible: true }
                }
            },
            {
                duration: 4.8,
                rocketY: -36,
                rocketFlame: 1.15,
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_kloten_taronuman',
                bubble: 'Auf nach Kloten & Sri Lanka!',
                text: 'Thenerean setzt den Pilotenhelm auf und startet die Melonen-Triebwerke: „Nächster Halt: Bäckerei Kloten und Dschungel-Highway Sri Lanka!“',
                actors: {
                    thenerean: { x: 0.50, pose: 'rocket', facing: 1, visible: true },
                    monika: { x: 0.18, pose: 'attack', facing: 1, visible: true },
                    adam: { x: 0.70, pose: 'throw', facing: -1, visible: true },
                    sahur: { x: 0.83, pose: 'idle', facing: -1, visible: true },
                    tuktuk_dual: { x: 0.92, pose: 'walk', facing: -1, visible: true }
                }
            },
            {
                duration: 4.0,
                rocketY: -110,
                rocketFlame: 1.5,
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_alles_brennt',
                bubble: 'VOLLGAS IN DIE WOLKEN!',
                text: 'ZÜNDUNG! Mit donnerndem Melonen-Schub schiesst Thenerean in den Himmel — Kapitel 2 startet!',
                actors: {
                    thenerean: { x: 0.54, pose: 'rocket', facing: 1, visible: true },
                    monika: { x: 0.16, pose: 'talk', facing: 1, visible: true },
                    adam: { x: 0.72, pose: 'throw', facing: -1, visible: true },
                    sahur: { x: 0.84, pose: 'walk', facing: -1, visible: true },
                    tuktuk_dual: { x: 0.93, pose: 'walk', facing: -1, visible: true }
                }
            }
        ]
    },

    3: {
        badge: 'KAPITEL 3 • ORBIT, ALPENFESTUNG & EFZ 6.0',
        subtitle: 'ERD-ORBIT 100 KM HÖHE • DAS GROSSE DIPLOM-FINALE',
        bgKey: 'bg_orbit_space',
        sceneType: 'orbit',
        music: 'assets/music/Beyond_the_Frame.mp3',
        initialActors: {
            thenerean: { x: 0.28, pose: 'rocket', facing: 1, visible: true, scale: 1.06 },
            drone_tuktuk: { x: 0.82, pose: 'idle', facing: -1, visible: true, scale: 1.1 },
            monika: { x: 0.64, pose: 'idle', facing: -1, visible: false, scale: 0.96 },
            adam: { x: 0.74, pose: 'idle', facing: -1, visible: false, scale: 0.96 }
        },
        beats: [
            {
                duration: 4.8,
                orbitPulse: 0.5,
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_to_the_moon',
                bubble: 'TO THE MOON! 100 km über Bern!',
                text: 'Die Melonen-Rakete durchbricht die Stratosphäre! Thenerean schwebt im Orbit über der Erde — doch selbst im All hat er keine Ruhe!',
                actors: {
                    thenerean: { x: 0.32, pose: 'rocket', facing: 1, visible: true },
                    drone_tuktuk: { x: 0.80, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 4.8,
                orbitPulse: 0.8,
                speaker: 'CYBER DRONE TUKTUK MK-III',
                speakerKey: 'drone_tuktuk',
                clip: 'tuktuk_melone_sinn',
                bubble: 'ORBITAL-LASER GELADEN!',
                text: 'Das hochgerüstete Cyber Drone TukTuk MK-III enttarnt sich zwischen den Satelliten und visiert Thenerean mit Plasma-Lasern an!',
                actors: {
                    thenerean: { x: 0.34, pose: 'rocket', facing: 1, visible: true },
                    drone_tuktuk: { x: 0.74, pose: 'talk', facing: -1, visible: true }
                }
            },
            {
                duration: 5.0,
                orbitPulse: 1.0,
                speaker: 'MONIKA SCHNEIDER',
                speakerKey: 'monika',
                clip: 'monika_abu_test',
                bubble: 'Die EFZ-Abschlussprüfung läuft!',
                text: 'Über ein gigantisches Orbital-Hologramm schaltet sich Monika ein: „Thenerean! Die EFZ-Prüfung hat begonnen — sofort zurück zur Erde!“',
                actors: {
                    thenerean: { x: 0.32, pose: 'idle', facing: 1, visible: true },
                    monika: { x: 0.58, pose: 'talk', facing: -1, visible: true },
                    adam: { x: 0.70, pose: 'idle', facing: -1, visible: true },
                    drone_tuktuk: { x: 0.86, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 4.8,
                orbitPulse: 1.1,
                speaker: 'HERR ADAM',
                speakerKey: 'adam',
                clip: 'adam_20_frisbees',
                bubble: '20 Frisbees sind meine Waffe!',
                text: 'Herr Adam funkt aus der Alpenfestung dazwischen: „Erst musst du an unserer Alpenfestung vorbei — 20 Frisbees sind meine Waffe!“',
                actors: {
                    thenerean: { x: 0.34, pose: 'idle', facing: 1, visible: true },
                    monika: { x: 0.58, pose: 'idle', facing: -1, visible: true },
                    adam: { x: 0.69, pose: 'talk', facing: -1, visible: true },
                    drone_tuktuk: { x: 0.86, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 4.8,
                orbitPulse: 1.3,
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_zurueck_erde',
                bubble: 'Zurück zur Erde — Note 6.0!',
                text: 'Thenerean klappt das Visier herunter: „Weder Orbital-TukTuks noch eure Doppel-Prüfung halten mich auf — ich hol mir die Note 6.0!“',
                actors: {
                    thenerean: { x: 0.42, pose: 'talk', facing: 1, visible: true },
                    monika: { x: 0.60, pose: 'attack', facing: -1, visible: true },
                    adam: { x: 0.71, pose: 'throw', facing: -1, visible: true },
                    drone_tuktuk: { x: 0.86, pose: 'walk', facing: -1, visible: true }
                }
            },
            {
                duration: 3.8,
                orbitPulse: 1.6,
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_niemert_verbi',
                bubble: 'Keiner schlägt mich! Auf ins Finale!',
                text: 'Wiedereintritt in die Atmosphäre! Der Kampf um das Informatik-EFZ-Diplom in Kapitel 3 beginnt!',
                actors: {
                    thenerean: { x: 0.50, pose: 'rocket', facing: 1, visible: true },
                    monika: { x: 0.62, pose: 'attack', facing: -1, visible: true },
                    adam: { x: 0.73, pose: 'throw', facing: -1, visible: true },
                    drone_tuktuk: { x: 0.86, pose: 'walk', facing: -1, visible: true }
                }
            }
        ]
    },

    4: {
        badge: 'KAPITEL 4 • ALPEN-SKILAGER MIT HERR ADAM',
        subtitle: 'BERNER OBERLAND 2850m • FRISBEE-PISTE, SLALOM, SKILIFT & RIESEN-SCHANZE',
        bgKey: 'bg_ski_alps',
        sceneType: 'ski_alps',
        music: 'assets/music/Optical_Glide.mp3',
        initialActors: {
            adam: { x: 0.68, pose: 'idle', facing: -1, visible: true, scale: 1.04 },
            monika: { x: 0.82, pose: 'idle', facing: -1, visible: true, scale: 0.96 },
            student: { x: 0.90, pose: 'idle', facing: -1, visible: true, scale: 0.92 },
            thenerean: { x: 0.22, pose: 'idle', facing: 1, visible: false, scale: 1.06 }
        },
        beats: [
            {
                duration: 4.8,
                skiBusX: 0.03,
                skiBusDoor: false,
                frisbeeProp: 'hidden',
                speaker: 'HERR ADAM',
                speakerKey: 'adam',
                clip: 'adam_silvankumar',
                bubble: 'Willkommen im GIBB-Alpen-Skilager!',
                text: 'Hoch in den verschneiten Schweizer Alpen auf 2’850 Metern hält der gelbe GIBB-Skibus vor der grossen Talabfahrt, dem Skilift und der Riesen-Schanze!',
                actors: {
                    adam: { x: 0.66, pose: 'talk', facing: -1, visible: true },
                    monika: { x: 0.81, pose: 'idle', facing: -1, visible: true },
                    student: { x: 0.90, pose: 'idle', facing: -1, visible: true },
                    thenerean: { x: 0.22, pose: 'idle', facing: 1, visible: false }
                }
            },
            {
                duration: 5.0,
                skiBusX: 0.03,
                skiBusDoor: true,
                frisbeeProp: 'hidden',
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_wo_bleibt_bus',
                bubble: 'Wo bliibt de Bus?! Und wo sind meine Ski?!',
                text: 'Thenerean steigt frierend in den Tiefschnee: „Brrr… Herr Adam, wo bliibt eigentli de Bus zurück nach Bern?! Und warum hab ich keine Ski bekommen?!“',
                actors: {
                    thenerean: { x: 0.34, pose: 'walk', facing: 1, visible: true },
                    adam: { x: 0.64, pose: 'idle', facing: -1, visible: true },
                    monika: { x: 0.80, pose: 'idle', facing: -1, visible: true },
                    student: { x: 0.90, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 5.4,
                skiBusX: -0.52,
                skiBusDoor: false,
                frisbeeProp: 'thrown',
                speaker: 'HERR ADAM',
                speakerKey: 'adam',
                clip: 'adam_nimm_frisbee_fahr',
                bubble: 'NIMM DAS FRISBEE UND FAHR!',
                text: 'Herr Adam wirft ein riesiges gelbes Sport-Frisbee vor Thenereans Füsse in den Schnee: „Für Zuspätkommer gibt’s keine Ski! NIMM DAS FRISBEE UND FAHR damit den Berg runter!“',
                actors: {
                    thenerean: { x: 0.38, pose: 'idle', facing: 1, visible: true },
                    adam: { x: 0.60, pose: 'throw', facing: -1, visible: true },
                    monika: { x: 0.78, pose: 'idle', facing: -1, visible: true },
                    student: { x: 0.89, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 5.2,
                skiBusX: -0.52,
                frisbeeProp: 'ground',
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_frechheit',
                bubble: 'Mit dem Frisbee den Berg runter?! Frechheit!',
                text: 'Thenerean starrt fassungslos auf die runde Plastikscheibe: „Ich soll auf einem FRISBEE vom Berggipfel rechts runter ins Tal brettern?! Das isch e bodelosi Frechheit!“',
                actors: {
                    thenerean: { x: 0.40, pose: 'talk', facing: 1, visible: true },
                    adam: { x: 0.60, pose: 'idle', facing: -1, visible: true },
                    monika: { x: 0.78, pose: 'idle', facing: -1, visible: true },
                    student: { x: 0.89, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 5.4,
                skiBusX: -0.52,
                frisbeeProp: 'ground',
                speaker: 'HERR ADAM',
                speakerKey: 'adam',
                clip: 'adam_20_frisbees',
                bubble: 'Talabfahrt, Live-Slalom, Skilift & Riesen-Schanze!',
                text: 'Herr Adam deutet auf die Gipfel: „Zuerst die steile Talabfahrt ins Tal, dann Live-Slalom gegen mich, den aktiven Skilift hochkämpfen und Weitsprung von der Riesen-Schanze!“',
                actors: {
                    thenerean: { x: 0.40, pose: 'idle', facing: 1, visible: true },
                    adam: { x: 0.58, pose: 'talk', facing: -1, visible: true },
                    monika: { x: 0.76, pose: 'talk', facing: -1, visible: true },
                    student: { x: 0.88, pose: 'idle', facing: -1, visible: true }
                }
            },
            {
                duration: 4.8,
                skiBusX: -0.52,
                frisbeeProp: 'ground',
                speaker: 'HERR ADAM',
                speakerKey: 'adam',
                clip: 'adam_strafe_verpasst',
                bubble: 'Bei Torfehler gibt es sofort Strafe!',
                text: 'Herr Adam pfeift schrill in seine Trillerpfeife: „Und wehe du verpasst im Slalom ein Tor oder stürzt an der Schanze — dann wird dir sofort eine Strafe verpasst!“',
                actors: {
                    thenerean: { x: 0.42, pose: 'idle', facing: 1, visible: true },
                    adam: { x: 0.58, pose: 'talk', facing: -1, visible: true },
                    monika: { x: 0.76, pose: 'attack', facing: -1, visible: true },
                    student: { x: 0.88, pose: 'talk', facing: -1, visible: true }
                }
            },
            {
                duration: 4.4,
                skiBusX: -0.52,
                frisbeeProp: 'board',
                speaker: 'THENEREAN',
                speakerKey: 'thenerean',
                clip: 'thenerean_komplett_verrueckt',
                bubble: 'Frisbee unter die Füsse — AB INS TAL!',
                text: 'Thenerean springt entschlossen auf das gelbe Riesen-Frisbee: „Ich bin komplett verrückt — haltet eure Skistöcke fest, jetzt wird der Alpen-Gipfel gerockt!“',
                actors: {
                    thenerean: { x: 0.52, pose: 'jump', facing: 1, visible: true },
                    adam: { x: 0.66, pose: 'throw', facing: -1, visible: true },
                    monika: { x: 0.78, pose: 'idle', facing: -1, visible: true },
                    student: { x: 0.90, pose: 'idle', facing: -1, visible: true }
                }
            }
        ]
    }
};

const Prologue = {
    active: false,
    chapter: 1,
    beatIndex: 0,
    beatTimer: 0,
    clock: 0,
    targetLevelIndex: 0,
    busX: -0.45,
    busDoor: 0,
    skiBusX: -0.50,
    skiBusDoor: 0,
    rocketY: 0,
    rocketFlame: 0.3,
    orbitPulse: 0.5,
    frisbeeProp: 'hidden',
    frisbeeAnim: 0,
    actors: {},
    particles: [],
    snowflakes: [],
    controlsEl: null,

    ensureControls(game) {
        if (this.controlsEl) return;
        const bar = document.createElement('div');
        bar.id = 'prologue-controls';
        bar.className = 'prologue-controls hidden';
        bar.innerHTML = `
            <button type="button" id="btn-prologue-next" class="btn btn-secondary btn-sm">WEITER ▶</button>
            <button type="button" id="btn-prologue-skip" class="btn btn-primary btn-sm">⏭ ÜBERSPRINGEN</button>
        `;
        document.getElementById('game-container').appendChild(bar);
        bar.querySelector('#btn-prologue-next').addEventListener('click', () => {
            window.soundManager.initWebAudio();
            this.advance(game);
        });
        bar.querySelector('#btn-prologue-skip').addEventListener('click', () => {
            window.soundManager.initWebAudio();
            this.finish(game);
        });
        this.controlsEl = bar;
    },

    getScript() {
        return CHAPTER_PROLOGUES[this.chapter] || CHAPTER_PROLOGUES[1];
    },

    start(game, targetLevelIndex = 0, chapterNum = null) {
        this.ensureControls(game);
        const inferredChapter = chapterNum || (LEVELS_CONFIG[targetLevelIndex] ? LEVELS_CONFIG[targetLevelIndex].chapter : 1);
        this.chapter = CHAPTER_PROLOGUES[inferredChapter] ? inferredChapter : 1;
        const script = this.getScript();

        this.active = true;
        this.beatIndex = 0;
        this.beatTimer = 0;
        this.clock = 0;
        this.targetLevelIndex = targetLevelIndex;
        this.busX = -0.45;
        this.busDoor = 0;
        this.skiBusX = -0.50;
        this.skiBusDoor = 0;
        this.rocketY = 0;
        this.rocketFlame = 0.3;
        this.orbitPulse = 0.5;
        this.frisbeeProp = 'hidden';
        this.frisbeeAnim = 0;
        this.particles = [];

        // Initialize snow/ambient particles
        this.snowflakes = [];
        for (let i = 0; i < 75; i++) {
            this.snowflakes.push({
                x: Math.random(),
                y: Math.random(),
                r: 1.5 + Math.random() * 3.2,
                vx: -0.04 - Math.random() * 0.06,
                vy: 0.10 + Math.random() * 0.16,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Copy initial actor states for this chapter
        this.actors = {};
        for (const [k, cfg] of Object.entries(script.initialActors)) {
            this.actors[k] = {
                x: cfg.x,
                targetX: cfg.x,
                pose: cfg.pose || 'idle',
                facing: cfg.facing || 1,
                visible: Boolean(cfg.visible),
                scale: cfg.scale || 1
            };
        }

        // Hide modal overlays so the canvas is unobstructed
        ['screenMenu', 'screenPrestart', 'screenChapters', 'screenStory', 'screenLvlSelect', 'screenIntro', 'hud', 'bossHud', 'controlsHint'].forEach((k) => {
            if (game.ui[k]) game.ui[k].classList.add('hidden');
        });
        this.controlsEl.classList.remove('hidden');

        game.state = GAME_STATE.PROLOGUE;
        window.soundManager.playMusic(script.music);
        this.enterBeat(0);
    },

    enterBeat(index) {
        const script = this.getScript();
        const beats = script.beats;
        if (index >= beats.length) return;
        this.beatIndex = index;
        this.beatTimer = 0;
        const beat = beats[index];

        if (beat.actors) {
            for (const [key, cfg] of Object.entries(beat.actors)) {
                const a = this.actors[key];
                if (!a) continue;
                if (typeof cfg.x === 'number') {
                    if (!a.visible && cfg.visible) a.x = cfg.x - (cfg.facing === -1 ? -0.06 : 0.06);
                    a.targetX = cfg.x;
                }
                if (cfg.pose) a.pose = cfg.pose;
                if (cfg.facing) a.facing = cfg.facing;
                if (typeof cfg.visible === 'boolean') a.visible = cfg.visible;
            }
        }

        if (beat.frisbeeProp) {
            this.frisbeeProp = beat.frisbeeProp;
            this.frisbeeAnim = 0;
        }

        window.soundManager.stopAllClips();
        if (beat.clip) window.soundManager.playClip(beat.clip, null, 1.0, { forceSolo: true });

        const nextBtn = this.controlsEl && this.controlsEl.querySelector('#btn-prologue-next');
        if (nextBtn) {
            const lvlNum = (this.targetLevelIndex || 0) + 1;
            nextBtn.textContent = index === beats.length - 1 ? `INS LEVEL ${lvlNum} ▶` : 'WEITER ▶';
        }
    },

    advance(game) {
        const beats = this.getScript().beats;
        if (this.beatIndex + 1 < beats.length) {
            this.enterBeat(this.beatIndex + 1);
        } else {
            this.finish(game);
        }
    },

    finish(game) {
        if (!this.active) return;
        this.active = false;
        this.hideControls();
        window.soundManager.stopAllClips();
        game.startLevel(this.targetLevelIndex);
    },

    hideControls() {
        if (this.controlsEl) this.controlsEl.classList.add('hidden');
    },

    update(game, dt) {
        if (!this.active) return;
        this.clock += dt;
        this.beatTimer += dt;
        this.frisbeeAnim += dt;

        const script = this.getScript();
        const beat = script.beats[this.beatIndex];
        if (!beat) {
            this.finish(game);
            return;
        }

        // Chapter 1 bus interpolation
        if (typeof beat.busTargetX === 'number') {
            const prevBusX = this.busX;
            this.busX += (beat.busTargetX - this.busX) * Math.min(1, dt * 3.0);
            if (Math.abs(this.busX - prevBusX) > 0.0006 && Math.random() < 0.6) {
                this.particles.push({
                    x: this.busX - 0.01,
                    y: 0.77 + (Math.random() - 0.5) * 0.02,
                    vx: -0.05 - Math.random() * 0.04,
                    vy: -0.02 - Math.random() * 0.02,
                    r: 8 + Math.random() * 10,
                    life: 1
                });
            }
        }
        this.busDoor += ((beat.busDoorOpen ? 1 : 0) - this.busDoor) * Math.min(1, dt * 5);

        // Chapter 4 ski bus interpolation
        if (typeof beat.skiBusX === 'number') {
            this.skiBusX += (beat.skiBusX - this.skiBusX) * Math.min(1, dt * 3.0);
        }
        this.skiBusDoor += ((beat.skiBusDoor ? 1 : 0) - this.skiBusDoor) * Math.min(1, dt * 5);

        // Chapter 2 rocket interpolation
        if (typeof beat.rocketY === 'number') {
            this.rocketY += (beat.rocketY - this.rocketY) * Math.min(1, dt * 2.5);
        }
        if (typeof beat.rocketFlame === 'number') {
            this.rocketFlame += (beat.rocketFlame - this.rocketFlame) * Math.min(1, dt * 3.5);
        }

        // Chapter 3 orbit pulse
        if (typeof beat.orbitPulse === 'number') {
            this.orbitPulse += (beat.orbitPulse - this.orbitPulse) * Math.min(1, dt * 3.0);
        }

        // Actor movement
        for (const a of Object.values(this.actors)) {
            const dx = a.targetX - a.x;
            if (Math.abs(dx) > 0.002) {
                a.x += dx * Math.min(1, dt * 4.2);
                a.moving = Math.abs(dx) > 0.008;
            } else {
                a.x = a.targetX;
                a.moving = false;
            }
        }

        // Exhaust particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.r += 14 * dt;
            p.life -= dt * 1.1;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Update snowflakes (used in Chapter 4)
        for (const s of this.snowflakes) {
            s.x += (s.vx + Math.sin(this.clock * 1.8 + s.phase) * 0.02) * dt;
            s.y += s.vy * dt;
            if (s.y > 1.02) { s.y = -0.02; s.x = Math.random(); }
            if (s.x < -0.02) s.x = 1.02;
        }

        if (this.beatTimer >= beat.duration) {
            this.advance(game);
        }
    },

    render(game) {
        if (!this.active) return;
        const W = canvas.width;
        const H = canvas.height;
        const script = this.getScript();
        const beat = script.beats[this.beatIndex] || script.beats[0];
        const groundY = H * 0.80;

        ctx.save();

        // 1. Chapter Backdrop
        const bg = images[script.bgKey] || images.bg_gibb_entrance;
        if (bg && bg.complete && bg.naturalWidth > 0) {
            const zoom = 1.03 + Math.sin(this.clock * 0.35) * 0.015;
            const dw = W * zoom;
            const dh = H * zoom;
            ctx.drawImage(bg, (W - dw) * 0.5, (H - dh) * 0.5, dw, dh);
        } else {
            const g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, '#101935');
            g.addColorStop(1, '#1e2f4f');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }

        // 2. Scene-specific Stage & Props
        if (script.sceneType === 'gibb') {
            this.renderGibbStage(W, H, groundY, beat);
        } else if (script.sceneType === 'rocket') {
            this.renderRocketStage(W, H, groundY, beat);
        } else if (script.sceneType === 'orbit') {
            this.renderOrbitStage(W, H, groundY, beat);
        } else if (script.sceneType === 'ski_alps') {
            this.renderSkiAlpsStage(W, H, groundY, beat);
        }

        // 3. Draw Cast Actors
        const drawOrder = Object.keys(this.actors);
        for (const key of drawOrder) {
            this.drawActor(key, this.actors[key], W, H, groundY, beat.speakerKey === key);
        }

        // 4. Foreground Props (e.g. Frisbee in Chapter 4)
        if (script.sceneType === 'ski_alps') {
            this.renderSkiForegroundProps(W, H, groundY, beat);
        }

        // 5. Top Badge + Dialogue Card
        this.drawTopBanner(W, H, script, beat);
        this.drawDialogueBox(W, H, script, beat);

        ctx.restore();
    },

    // =====================================================================
    // SCENE 1: GIBB ENTRANCE & BERNMOBIL BUS
    // =====================================================================
    renderGibbStage(W, H, groundY, beat) {
        const shade = ctx.createLinearGradient(0, 0, 0, H);
        shade.addColorStop(0, 'rgba(6, 10, 22, 0.42)');
        shade.addColorStop(0.65, 'rgba(6, 10, 22, 0.10)');
        shade.addColorStop(1, 'rgba(5, 8, 16, 0.78)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, W, H);

        // Street / sidewalk
        ctx.fillStyle = '#182030';
        ctx.fillRect(0, groundY, W, H - groundY);
        ctx.fillStyle = '#2c364c';
        ctx.fillRect(0, groundY - 6, W, 8);
        ctx.strokeStyle = 'rgba(255, 211, 42, 0.55)';
        ctx.lineWidth = 4;
        ctx.setLineDash([28, 22]);
        ctx.beginPath();
        ctx.moveTo(0, groundY + (H - groundY) * 0.45);
        ctx.lineTo(W, groundY + (H - groundY) * 0.45);
        ctx.stroke();
        ctx.setLineDash([]);

        this.drawSchoolSign(W * 0.74, groundY - Math.min(H * 0.42, 310), beat.clockText || '08:00');

        for (const p of this.particles) {
            ctx.fillStyle = `rgba(200, 210, 225, ${Math.max(0, p.life * 0.45)})`;
            ctx.beginPath();
            ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawBus(this.busX * W, groundY, W, H, 'BERNMOBIL • LINIE 12 → GIBB', '#c8202f', '#9a1420');
    },

    // =====================================================================
    // SCENE 2: ROOFTOP MELON ROCKET LAUNCHPAD
    // =====================================================================
    renderRocketStage(W, H, groundY, beat) {
        const shade = ctx.createLinearGradient(0, 0, 0, H);
        shade.addColorStop(0, 'rgba(10, 14, 34, 0.35)');
        shade.addColorStop(0.7, 'rgba(20, 14, 28, 0.15)');
        shade.addColorStop(1, 'rgba(8, 10, 20, 0.82)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, W, H);

        // Launchpad platform
        ctx.fillStyle = '#1b2234';
        ctx.fillRect(0, groundY, W, H - groundY);
        ctx.fillStyle = '#ffd32a';
        for (let x = 0; x < W; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(x + 32, groundY);
            ctx.lineTo(x + 18, groundY + 14);
            ctx.lineTo(x - 14, groundY + 14);
            ctx.closePath();
            ctx.fill();
        }

        // Giant Melon Rocket on the launch gantry in the center-left
        const rx = W * 0.48;
        const ry = groundY - 125 + this.rocketY;
        ctx.save();
        ctx.translate(rx, ry);

        // Gantry tower
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.strokeRect(-95, -90 - this.rocketY, 44, 210);
        for (let y = -80 - this.rocketY; y < 110 - this.rocketY; y += 32) {
            ctx.beginPath();
            ctx.moveTo(-95, y);
            ctx.lineTo(-51, y + 32);
            ctx.stroke();
        }

        // Thruster flame
        const flameH = (55 + Math.sin(this.clock * 28) * 16) * this.rocketFlame;
        const fg = ctx.createLinearGradient(0, 60, 0, 60 + flameH);
        fg.addColorStop(0, '#ffffff');
        fg.addColorStop(0.35, '#ffd32a');
        fg.addColorStop(0.75, '#ff4757');
        fg.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(-26, 58);
        ctx.lineTo(26, 58);
        ctx.lineTo(0, 65 + flameH);
        ctx.closePath();
        ctx.fill();

        // Rocket body (Watermelon styled)
        ctx.fillStyle = '#2ed573';
        ctx.strokeStyle = '#0b0e18';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 38, 76, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Red melon core window
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.ellipse(0, -6, 24, 48, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit glass
        ctx.fillStyle = '#70a1ff';
        ctx.beginPath();
        ctx.arc(0, -22, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Fins
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.moveTo(-34, 28);
        ctx.lineTo(-62, 68);
        ctx.lineTo(-24, 56);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(34, 28);
        ctx.lineTo(62, 68);
        ctx.lineTo(24, 56);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MELON-V', 0, 26);
        ctx.restore();

        // Floating fire pizzas in the sky on later beats
        if (this.beatIndex >= 3 && images.fire_pizza && images.fire_pizza.complete) {
            for (let i = 0; i < 3; i++) {
                const px = W * (0.65 + i * 0.11) + Math.sin(this.clock * 2.5 + i) * 24;
                const py = H * (0.24 + (i % 2) * 0.08) + Math.cos(this.clock * 3 + i) * 14;
                ctx.drawImage(images.fire_pizza, px - 28, py - 28, 56, 56);
            }
        }
    },

    // =====================================================================
    // SCENE 3: ORBITAL SPACE STATION & HOLOGRAM STAGE
    // =====================================================================
    renderOrbitStage(W, H, groundY, beat) {
        const shade = ctx.createLinearGradient(0, 0, 0, H);
        shade.addColorStop(0, 'rgba(4, 8, 22, 0.38)');
        shade.addColorStop(0.7, 'rgba(6, 16, 38, 0.22)');
        shade.addColorStop(1, 'rgba(4, 10, 24, 0.85)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, W, H);

        // Twinkling stars
        for (const s of this.snowflakes) {
            const alpha = 0.35 + 0.55 * Math.abs(Math.sin(this.clock * 2.2 + s.phase));
            ctx.fillStyle = `rgba(220, 240, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(s.x * W, s.y * H * 0.75, s.r * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }

        // Futuristic orbital deck platform
        const deckGrad = ctx.createLinearGradient(0, groundY - 8, 0, H);
        deckGrad.addColorStop(0, '#00d2d3');
        deckGrad.addColorStop(0.08, '#132038');
        deckGrad.addColorStop(1, '#070c18');
        ctx.fillStyle = deckGrad;
        ctx.fillRect(0, groundY - 4, W, H - groundY + 4);

        // Hologram projection ring for Monika & Adam when visible
        if (this.actors.monika && this.actors.monika.visible) {
            const hx = W * 0.64;
            const hy = groundY - 4;
            ctx.save();
            const holoGrad = ctx.createLinearGradient(hx, hy - 250, hx, hy);
            holoGrad.addColorStop(0, 'rgba(0, 210, 211, 0)');
            holoGrad.addColorStop(0.5, 'rgba(0, 210, 211, 0.16)');
            holoGrad.addColorStop(1, 'rgba(0, 210, 211, 0.42)');
            ctx.fillStyle = holoGrad;
            ctx.beginPath();
            ctx.moveTo(hx - 150, hy);
            ctx.lineTo(hx - 110, hy - 250);
            ctx.lineTo(hx + 150, hy - 250);
            ctx.lineTo(hx + 190, hy);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    },

    // =====================================================================
    // SCENE 4: SWISS ALPS SKI RESORT (BUS, LIFT, RAMP & FRISBEE!)
    // =====================================================================
    renderSkiAlpsStage(W, H, groundY, beat) {
        // Subtle alpine atmosphere overlay
        const shade = ctx.createLinearGradient(0, 0, 0, H);
        shade.addColorStop(0, 'rgba(8, 22, 48, 0.18)');
        shade.addColorStop(0.65, 'rgba(255, 255, 255, 0.04)');
        shade.addColorStop(1, 'rgba(12, 26, 48, 0.45)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, W, H);

        // Animated Chairlift & Red Gondola moving up the mountain cable in background!
        this.drawAnimatedBackgroundLift(W, H);

        // Snowy alpine ground & groomed piste at the bottom
        const snowGrad = ctx.createLinearGradient(0, groundY - 16, 0, H);
        snowGrad.addColorStop(0, '#f8fbff');
        snowGrad.addColorStop(0.25, '#e6f2ff');
        snowGrad.addColorStop(1, '#bdd6f2');
        ctx.fillStyle = snowGrad;
        ctx.beginPath();
        ctx.moveTo(0, groundY - 8);
        ctx.quadraticCurveTo(W * 0.35, groundY - 22, W * 0.7, groundY - 4);
        ctx.lineTo(W, groundY + 6);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();

        // Subtle blue snow contour line
        ctx.strokeStyle = '#90b8e6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY - 6);
        ctx.quadraticCurveTo(W * 0.35, groundY - 20, W * 0.7, groundY - 2);
        ctx.lineTo(W, groundY + 8);
        ctx.stroke();

        // Alpine Resort Signpost on the right ("GIBB SKILAGER • 2850m")
        this.drawSkiResortSignpost(W * 0.72, groundY - 6);

        // Yellow Swiss PostAuto / GIBB-Skibus arriving on the left
        this.drawBus(
            this.skiBusX * W,
            groundY,
            W,
            H,
            'GIBB SKILAGER-EXPRESS • ALPEN 2850m',
            '#f59e0b',
            '#d97706',
            true,
            this.skiBusDoor
        );

        // Falling snow particles
        for (const s of this.snowflakes) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawAnimatedBackgroundLift(W, H) {
        // Diagonal cable from mid-left (0.06 W, 0.49 H) up toward mountain station (0.36 W, 0.28 H)
        const x1 = W * 0.02, y1 = H * 0.56;
        const x2 = W * 0.34, y2 = H * 0.35;
        ctx.save();
        ctx.strokeStyle = 'rgba(20, 32, 48, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Moving chairs/gondolas along the cable
        for (let i = 0; i < 3; i++) {
            const t = ((this.clock * 0.11 + i / 3) % 1);
            const cx = x1 + (x2 - x1) * t;
            const cy = y1 + (y2 - y1) * t;
            const swing = Math.sin(this.clock * 3 + i) * 3;

            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + swing, cy + 18);
            ctx.stroke();

            if (i === 0) {
                // Red Alpine Gondola
                ctx.fillStyle = '#ef4444';
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2;
                this.roundRect(cx - 14 + swing, cy + 18, 28, 22, 6);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#bae6fd';
                ctx.fillRect(cx - 9 + swing, cy + 22, 18, 9);
            } else {
                // Chairlift seat
                ctx.fillStyle = '#334155';
                ctx.fillRect(cx - 9 + swing, cy + 18, 18, 6);
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(cx - 9 + swing, cy + 12, 18, 6);
            }
        }
        ctx.restore();
    },

    drawSkiResortSignpost(x, groundY) {
        ctx.save();
        // Wooden post
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#0b0e18';
        ctx.lineWidth = 3;
        ctx.fillRect(x - 5, groundY - 128, 10, 128);
        ctx.strokeRect(x - 5, groundY - 128, 10, 128);

        // Direction arrows
        const signs = [
            { y: groundY - 118, text: '⛷️ TALABFAHRT & LAWINE →', bg: '#2563eb' },
            { y: groundY - 88,  text: '🚩 LIVE-SLALOM VS. ADAM ↓', bg: '#dc2626' },
            { y: groundY - 58,  text: '🚡 AKTIVER SKILIFT & SCHANZE ↗', bg: '#f59e0b' }
        ];
        ctx.font = '900 10.5px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        for (const s of signs) {
            ctx.fillStyle = s.bg;
            ctx.strokeStyle = '#0b0e18';
            ctx.lineWidth = 2.5;
            this.roundRect(x - 92, s.y, 184, 23, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillText(s.text, x, s.y + 15);
        }
        ctx.restore();
    },

    renderSkiForegroundProps(W, H, groundY, beat) {
        if (this.frisbeeProp === 'hidden') return;

        const tActor = this.actors.thenerean;
        const aActor = this.actors.adam;
        let fx = W * 0.49;
        let fy = groundY - 14;
        let rx = 44;
        let ry = 14;
        let rot = 0;

        if (this.frisbeeProp === 'thrown' && aActor && tActor) {
            const p = Math.min(1, this.frisbeeAnim / 0.85);
            const startX = aActor.x * W - 30;
            const startY = groundY - 95;
            const endX = (tActor.x + 0.08) * W;
            const endY = groundY - 12;
            fx = startX + (endX - startX) * p;
            fy = startY + (endY - startY) * p - Math.sin(p * Math.PI) * 75;
            rot = this.clock * 14;
        } else if (this.frisbeeProp === 'ground' && tActor) {
            fx = (tActor.x + 0.08) * W;
            fy = groundY - 12;
        } else if (this.frisbeeProp === 'board' && tActor) {
            fx = tActor.x * W;
            fy = groundY - 10;
            rx = 58;
            ry = 17;
        }

        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(rot * 0.08);

        // Glow under the Frisbee-Snowboard
        ctx.fillStyle = 'rgba(255, 211, 42, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 4, rx + 10, ry + 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Giant yellow GIBB Sport-Frisbee disc
        const fg = ctx.createRadialGradient(-8, -4, 4, 0, 0, rx);
        fg.addColorStop(0, '#fff7ae');
        fg.addColorStop(0.55, '#ffd32a');
        fg.addColorStop(1, '#f39c12');
        ctx.fillStyle = fg;
        ctx.strokeStyle = '#0b0e18';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner Frisbee ring
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * 0.66, ry * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#0b0e18';
        ctx.font = '900 10px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GIBB FRISBEE-SKI', 0, 3);
        ctx.restore();
    },

    drawSchoolSign(x, y, clockText) {
        ctx.save();
        ctx.fillStyle = 'rgba(12, 18, 34, 0.92)';
        ctx.strokeStyle = '#ffd32a';
        ctx.lineWidth = 3;
        this.roundRect(x - 135, y, 270, 66, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffd32a';
        ctx.font = '900 13px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏫 GIBB BERUFSSCHULE BERN', x, y + 23);

        const late = clockText.includes('02.54') || clockText > '08:00:00';
        ctx.fillStyle = late ? '#ff4757' : '#2ed573';
        ctx.font = '900 22px "Montserrat", monospace';
        ctx.fillText(`🕒 ${clockText}`, x, y + 52);
        ctx.restore();
    },

    drawBus(x, groundY, W, H, labelText, topColor, bottomColor, isSkiBus = false, doorVal = null) {
        const busW = Math.min(430, W * 0.34);
        const busH = Math.min(165, H * 0.23);
        if (x + busW < -40) return;
        const busY = groundY - busH - 12;
        const doorOpen = doorVal !== null ? doorVal : this.busDoor;

        ctx.save();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
        ctx.beginPath();
        ctx.ellipse(x + busW * 0.5, groundY + 4, busW * 0.48, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Roof ski rack if Chapter 4 Ski Bus
        if (isSkiBus) {
            ctx.fillStyle = '#1e293b';
            this.roundRect(x + busW * 0.18, busY - 12, busW * 0.64, 10, 4);
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x + busW * 0.22, busY - 14);
            ctx.lineTo(x + busW * 0.48, busY - 14);
            ctx.stroke();
            ctx.strokeStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(x + busW * 0.52, busY - 14);
            ctx.lineTo(x + busW * 0.78, busY - 14);
            ctx.stroke();
        }

        // Body
        const bodyGrad = ctx.createLinearGradient(x, busY, x, busY + busH);
        bodyGrad.addColorStop(0, topColor || '#c8202f');
        bodyGrad.addColorStop(0.55, bottomColor || '#9a1420');
        bodyGrad.addColorStop(1, '#1f2633');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#0b0e18';
        ctx.lineWidth = 4;
        this.roundRect(x, busY, busW, busH, 18);
        ctx.fill();
        ctx.stroke();

        // White / dark stripe
        ctx.fillStyle = isSkiBus ? '#0f172a' : '#f1f5f9';
        ctx.fillRect(x + 6, busY + busH * 0.56, busW - 12, 10);

        // Destination header
        ctx.fillStyle = '#0b0e18';
        this.roundRect(x + 18, busY + 10, busW - 36, 26, 7);
        ctx.fill();
        ctx.fillStyle = '#ffd32a';
        ctx.font = `900 ${Math.max(10, Math.floor(busW * 0.031))}px "Montserrat", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(labelText, x + busW * 0.5, busY + 28);

        // Windows
        const winY = busY + 44;
        const winH = busH * 0.34;
        const winW = (busW - 120) / 3;
        for (let i = 0; i < 3; i++) {
            const wx = x + 18 + i * (winW + 10);
            ctx.fillStyle = 'rgba(180, 230, 255, 0.78)';
            this.roundRect(wx, winY, winW, winH, 6);
            ctx.fill();
            ctx.strokeStyle = '#0b0e18';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        // Front door (opens on Beat 1)
        const doorX = x + busW - 76;
        const doorW = 54;
        const doorH = busH - 54;
        ctx.fillStyle = '#0b0e18';
        this.roundRect(doorX, winY, doorW, doorH, 6);
        ctx.fill();

        const panelW = (doorW * 0.48) * (1 - doorOpen * 0.82);
        ctx.fillStyle = 'rgba(255, 211, 42, 0.85)';
        ctx.fillRect(doorX + 2, winY + 2, panelW, doorH - 4);
        ctx.fillRect(doorX + doorW - 2 - panelW, winY + 2, panelW, doorH - 4);

        // Headlight
        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.arc(x + busW - 8, busY + busH - 26, 8, 0, Math.PI * 2);
        ctx.fill();

        // Wheels
        const wheelY = groundY - 12;
        [x + busW * 0.24, x + busW * 0.74].forEach((wx) => {
            ctx.fillStyle = '#111622';
            ctx.beginPath();
            ctx.arc(wx, wheelY, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0b0e18';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.arc(wx, wheelY, 10, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    },

    drawActor(key, actor, W, H, groundY, isSpeaking) {
        if (!actor || !actor.visible) return;
        const meta = PROLOGUE_CAST[key];
        if (!meta) return;

        let spriteKey = meta.sprites[actor.pose] || meta.sprites.idle;
        if (actor.moving && meta.sprites.walk) {
            spriteKey = (Math.floor(this.clock * 8) % 2 === 0) ? meta.sprites.walk : meta.sprites.idle;
        }
        const img = images[spriteKey] || images[meta.sprites.idle];

        const baseH = Math.min(205, H * 0.29) * (actor.scale || 1);
        const ratio = (img && img.naturalHeight > 0) ? (img.naturalWidth / img.naturalHeight) : 0.72;
        const drawH = baseH;
        const drawW = drawH * ratio;

        const cx = actor.x * W;
        const bob = actor.moving ? Math.abs(Math.sin(this.clock * 12)) * 9 : Math.sin(this.clock * 3 + cx) * 2.5;
        const jumpLift = (this.chapter === 4 && key === 'thenerean' && this.frisbeeProp === 'board') ? 14 : 0;
        const footY = groundY + 4 - bob - jumpLift;

        ctx.save();

        // Ground shadow
        ctx.fillStyle = isSpeaking ? 'rgba(255, 211, 42, 0.45)' : 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.ellipse(cx, groundY + 6, drawW * 0.36, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (isSpeaking) {
            ctx.shadowColor = meta.color;
            ctx.shadowBlur = 22;
        }

        ctx.translate(cx, footY);
        ctx.scale(actor.facing || 1, 1);
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -drawW * 0.5, -drawH, drawW, drawH);
        } else {
            ctx.fillStyle = meta.color;
            ctx.fillRect(-drawW * 0.35, -drawH, drawW * 0.7, drawH);
        }
        ctx.restore();

        // Nameplate under feet
        ctx.save();
        const tag = meta.name.split(' ')[0];
        ctx.font = '900 11px "Montserrat", sans-serif';
        const tw = ctx.measureText(tag).width + 16;
        ctx.fillStyle = 'rgba(11, 14, 24, 0.88)';
        ctx.strokeStyle = isSpeaking ? '#ffd32a' : meta.color;
        ctx.lineWidth = 2;
        this.roundRect(cx - tw * 0.5, groundY + 11, tw, 20, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isSpeaking ? '#ffd32a' : '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(tag, cx, groundY + 25);
        ctx.restore();

        // Speech bubble above speaker
        const beat = this.getScript().beats[this.beatIndex];
        if (isSpeaking && beat && beat.bubble) {
            this.drawSpeechBubble(cx, footY - drawH - 14, beat.bubble, meta.color, W);
        }
    },

    drawSpeechBubble(cx, topY, text, borderColor, W) {
        ctx.save();
        ctx.font = '900 14px "Montserrat", sans-serif';
        const padX = 16;
        const bw = Math.min(370, ctx.measureText(text).width + padX * 2);
        const bh = 38;
        const bx = Math.max(16, Math.min(W - bw - 16, cx - bw * 0.5));
        const by = Math.max(66, topY - bh);

        ctx.fillStyle = '#fffbeb';
        ctx.strokeStyle = borderColor || '#ffd32a';
        ctx.lineWidth = 3;
        this.roundRect(bx, by, bw, bh, 12);
        ctx.fill();
        ctx.stroke();

        // Pointer triangle
        ctx.beginPath();
        ctx.moveTo(Math.max(bx + 16, Math.min(bx + bw - 16, cx - 8)), by + bh);
        ctx.lineTo(Math.max(bx + 20, Math.min(bx + bw - 12, cx + 8)), by + bh);
        ctx.lineTo(cx, by + bh + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0b0e18';
        ctx.textAlign = 'center';
        ctx.fillText(text, bx + bw * 0.5, by + 24);
        ctx.restore();
    },

    drawTopBanner(W, H, script, beat) {
        ctx.save();
        const text = `${script.badge}  •  SZENE ${this.beatIndex + 1} / ${script.beats.length}`;
        ctx.font = '900 12px "Montserrat", sans-serif';
        const bw = Math.max(360, ctx.measureText(text).width + 44);
        const bx = (W - bw) * 0.5;
        ctx.fillStyle = 'rgba(11, 14, 24, 0.88)';
        ctx.strokeStyle = '#ffd32a';
        ctx.lineWidth = 2;
        this.roundRect(bx, 14, bw, 32, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffd32a';
        ctx.textAlign = 'center';
        ctx.fillText(text, W * 0.5, 34);
        ctx.restore();
    },

    drawDialogueBox(W, H, script, beat) {
        const boxW = Math.min(920, W - 40);
        const boxH = 104;
        const boxX = (W - boxW) * 0.5;
        const boxY = H - boxH - 14;
        const cast = beat.speakerKey ? PROLOGUE_CAST[beat.speakerKey] : null;
        const accent = cast ? cast.color : '#ffd32a';

        ctx.save();
        ctx.fillStyle = 'rgba(10, 14, 26, 0.93)';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        this.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();
        ctx.stroke();

        // Avatar portrait
        let textX = boxX + 22;
        if (cast && images[cast.avatar] && images[cast.avatar].complete) {
            const avSize = 72;
            const avX = boxX + 16;
            const avY = boxY + (boxH - avSize) * 0.5;
            ctx.fillStyle = '#161e31';
            this.roundRect(avX, avY, avSize, avSize, 12);
            ctx.fill();
            ctx.drawImage(images[cast.avatar], avX, avY, avSize, avSize);
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2.5;
            this.roundRect(avX, avY, avSize, avSize, 12);
            ctx.stroke();
            textX = avX + avSize + 18;
        }

        // Speaker header
        ctx.fillStyle = accent;
        ctx.font = '900 13px "Montserrat", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(cast ? cast.name : (beat.speaker || 'ERZÄHLER'), textX, boxY + 26);

        // Wrapped dialogue text
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 15.5px "Montserrat", sans-serif';
        this.wrapText(beat.text || '', textX, boxY + 50, boxW - (textX - boxX) - 180, 21);

        // Beat progress bar at bottom of dialogue card
        const pct = Math.min(1, this.beatTimer / (beat.duration || 4));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(boxX + 16, boxY + boxH - 8, boxW - 32, 4);
        ctx.fillStyle = accent;
        ctx.fillRect(boxX + 16, boxY + boxH - 8, (boxW - 32) * pct, 4);

        ctx.restore();
    },

    wrapText(text, x, y, maxW, lineH) {
        const words = text.split(' ');
        let line = '';
        let row = 0;
        for (const w of words) {
            const test = line ? `${line} ${w}` : w;
            if (ctx.measureText(test).width > maxW && line) {
                ctx.fillText(line, x, y + row * lineH);
                line = w;
                row++;
            } else {
                line = test;
            }
        }
        if (line) ctx.fillText(line, x, y + row * lineH);
    },

    roundRect(x, y, w, h, r) {
        const rad = Math.min(r, w * 0.5, h * 0.5);
        ctx.beginPath();
        ctx.moveTo(x + rad, y);
        ctx.arcTo(x + w, y, x + w, y + h, rad);
        ctx.arcTo(x + w, y + h, x, y + h, rad);
        ctx.arcTo(x, y + h, x, y, rad);
        ctx.arcTo(x, y, x + w, y, rad);
        ctx.closePath();
    }
};

// =========================================================================
// WIRE INTO GAME LIFECYCLE FOR ALL 4 CHAPTERS
// =========================================================================
(function wrapPrologue() {
    const P = Game.prototype;

    const origIntro = P.startCinematicIntro;
    P.startCinematicIntro = function (targetLevelIndex = 0, options = {}) {
        const opts = (targetLevelIndex && typeof targetLevelIndex === 'object') ? targetLevelIndex : (options || {});
        const target = typeof targetLevelIndex === 'number' ? targetLevelIndex : (opts.targetLevelIndex || 0);
        const chapter = opts.chapter || (LEVELS_CONFIG[target] ? LEVELS_CONFIG[target].chapter : 1);
        if (CHAPTER_PROLOGUES[chapter] && !opts.randomChaos) {
            Prologue.start(this, target, chapter);
            return;
        }
        return origIntro.call(this, targetLevelIndex, options);
    };

    const origUpdate = P.update;
    P.update = function (dt) {
        if (this.state === GAME_STATE.PROLOGUE) {
            this.animClock += dt;
            Prologue.update(this, dt);
            return;
        }
        if (Prologue.active) {
            Prologue.active = false;
            Prologue.hideControls();
        }
        return origUpdate.call(this, dt);
    };

    const origRender = P.render;
    P.render = function () {
        if (this.state === GAME_STATE.PROLOGUE) {
            Prologue.render(this);
            return;
        }
        return origRender.call(this);
    };

    window.addEventListener('keydown', (e) => {
        if (!window.game || window.game.state !== GAME_STATE.PROLOGUE) return;
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
            e.preventDefault();
            Prologue.advance(window.game);
        } else if (e.code === 'Escape') {
            e.preventDefault();
            Prologue.finish(window.game);
        }
    });
})();
