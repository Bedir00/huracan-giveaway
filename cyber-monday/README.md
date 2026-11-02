# Cyber Monday – 15 % auf ALLES (Code CYBER15)

Animiertes Neon-GIF auf dem Wohnzimmer-Motiv, Schrift Poppins.

| Datei | Einsatz | Größe |
|---|---|---|
| `export/cyber-monday-cyber15-1080.gif` | Website, Social (wo GIF geht) | 1080 × 1080 |
| `export/cyber-monday-cyber15-600.gif` | Newsletter (< 1 MB, 20 fps) | 600 × 600 |
| `export/cyber-monday-cyber15-1080.mp4` | Instagram / Facebook (kein GIF-Support) | 1080 × 1080 |

8 s Endlosschleife. Der erste Frame zeigt bereits das komplette Angebot,
weil Outlook und Link-Vorschauen nur Frame 1 anzeigen.

**Gestaltung:** ruhige, zentrierte Typo-Hierarchie (CYBER MONDAY → 15 % → auf ALLES →
Code-Button), dezenter Neon-Schimmer in den Farben des Raums, weißer Code-Button mit
scharfen Ecken in Home-Deluxe-Navy, Logo unten mittig. Jede Zeile wird beim Rendern
an ihren tatsächlichen Pixeln gemessen und exakt auf die Bildmitte gesetzt (±1 px),
der Textblock sitzt vertikal mittig.

**Ablauf:** Zeilen steigen nacheinander weich ein (Fade + Rise + Unschärfe) → der
Code-Button öffnet sich aus der Mitte → ein ruhiger Kontur-Puls lenkt den Blick auf
den Code (2× je Schleife) → Halten → alles blendet weich aus.

## Neu bauen

```bash
./build.sh            # Frames rendern, GIFs + MP4 erzeugen, mit gifsicle komprimieren
```

Benötigt: node mit `playwright`, `ffmpeg`, `gifsicle`.
Texte und Timing stehen in `src/animation.html` (im Browser öffnen = Live-Vorschau,
nach einmaligem `./build.sh`, das den Hintergrund skaliert).
Poppins liegt unter `src/fonts/` (SIL Open Font License).
