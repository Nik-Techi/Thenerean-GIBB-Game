# 🎮 Thenerean Selvabankumar - Das GIBB Abenteuer

Ein humorvolles 2D-Action-Game über Thenerean Selvabankumar, der an der Berufsschule GIBB Bern versucht, seine 4-jährige Informatik-Lehre erfolgreich mit Bestnote abzuschliessen – während ihn Monika Schneider und Herr Adam mit Verspätungs-Verwarnungen und Frisbee-Hageln auf Trab halten.

---

## 🕹️ Features
- **4 Lehrjahre & 6 Level:** Vom GIBB-Vorplatz über Klassenzimmer 302, Sporthalle und Serverraum bis zum grossen EFZ-Abschluss-Auditorium.
- **30-Sekunden Cinematic Intro:** Humorvoller Rückblick auf Thenereans 4 Lehrjahre mit originalen Video- und Tonaufnahmen.
- **Echte Audio-Zitate & Memes:** 
  - *"Silvankumar, ist der Thenerean da?!"*
  - *"Herr Adam, ich stah doch da!"*
  - *"Pünktlichkeit ist oberste Gebot!"*
  - *"Da git es nüt z dischputiere! Gang auf die Platz!"*
  - *"Da hast du 20 Frisbees!"*
- **Kampfsystem & Demo-Modus:**
  - `E`: Gesetzestext geradeaus schleudern (28 DMG).
  - `Q` / `Shift`: **„ICH STAH DOCH DA!“** Mega-Schockwelle abfeuern (70 DMG).
  - `F`: **„DA HAST DU 20 FRISBEES!“** 20-Frisbee-Salve mit Original-Sound abfeuern.
  - `R`: **Schild-Block:** Thenerean aktiviert ein taktisches Schild mit Energie-Aura (*„Niemert chunt an mir verbi!“* / *„Ich stah bis zum Schluss!“*) und wehrt Angriffe komplett ab (0 Schaden).
  - `CTRL`: **Ducken:** Thenerean duckt sich geschmeidig unter Projektilen und Hindernissen durch.
  - **Trainingsraum (Demo-Modus):** Direkt vom Hauptmenü aus alle Fähigkeiten und Abwehrmechaniken ausprobieren.
- **Dedizierte Sound- & Musiksteuerung:**
  - Musik kann separat ein- oder ausgeschaltet werden.
  - Lautstärkeregler (0% bis 100%) für Hintergrundmusik, damit Stimmen und Soundeffekte auch ganz ohne Musik gespielt werden können.
- **Mobile Touch-Steuerung & Android APK:**
  - Vollwertige **`Thenerean_Selvabankumar.apk`** für Android-Smartphones (vollständig offline, keine Berechtigungen, natives Vollbild).
  - Ergonomische On-Screen Touch-Buttons:
    - **Linker Daumen:** `◀ LINKS` und `RECHTS ▶` für flüssige Bewegung.
    - **Rechter Daumen:** Großer grüner `▲ SPRUNG`-Button, `💨 DUCK` (Ducken), `🛡️ BLOCK` (Schild), `📜 GESETZ`, `⚡ MEGA` und `🎯 20 FRISB`.
  - **Mobile-Friendly & bisschen einfacher:**
    - Intelligentes **Jump-Buffering**: Tippen kurz vor dem Boden springt nahtlos beim Aufkommen ab.
    - Vergrösserter Sammelradius für Items & Kaffee.
    - Leicht reduzierter Hindernis-Schaden und verlängertes Unverwundbarkeitsfenster nach Treffern.
    - Breitere Trefferzone für eigene Gesetzestexte.
    - Touch-Buttons können jederzeit auch per 📱 Button in der Leiste ein- oder ausgeschaltet werden.

---

## 🚀 Spiel starten

### Auf dem Android-Handy (APK):
Die Datei **`Thenerean_Selvabankumar.apk`** auf dein Smartphone übertragen (per USB, WhatsApp, E-Mail oder Google Drive) und antippen zum Installieren.

### Einzelne Portable EXE (Windows / USB-Stick):
Einfach **`Thenerean_Selvabankumar.exe`** doppelklicken (keine Installation nötig).

### Schnellstart:
Einfach die Datei **`START_SPIEL.bat`** doppelklicken.

### Alternativ per Terminal:
```bash
python start_game.py
```
Das Spiel öffnet sich automatisch im Browser unter `http://localhost:8080`.

---

## ⌨️ Steuerung
| Taste | Aktion |
| --- | --- |
| `A` / `D` oder `←` / `→` | Laufen (kein Zwangs-Lauf) |
| `LEERTASTE` | Springen / Dialog weiter |
| `CTRL` | Ducken (weicht hohen Angriffen aus) |
| `R` | Schild-Block (*„Niemert chunt an mir verbi!“*) |
| `E` / Linksklick | Gesetzestext werfen (28 DMG) |
| `Q` / `Shift` | „ICH STAH DOCH DA!“ Mega-Schockwelle (70 DMG) |
| `F` | „Da hast du 20 Frisbees!“ (20x Salve) |
| `F11` oder ⛶ Button | Vollbild ein/aus |
