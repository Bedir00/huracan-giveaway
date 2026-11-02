# Cyber Monday – 15 % auf ALLES (Code CYBER15)

Animiertes Neon-GIF auf dem Wohnzimmer-Motiv, Schrift Poppins.

| Datei | Einsatz | Größe |
|---|---|---|
| `export/cyber-monday-cyber15-1080.gif` | Website, Social (wo GIF geht) | 1080 × 1080 |
| `export/cyber-monday-cyber15-600.gif` | Newsletter | 600 × 600 |
| `export/cyber-monday-cyber15-1080.mp4` | Instagram / Facebook (kein GIF-Support) | 1080 × 1080 |

7,6 s Endlosschleife, 25 fps. Der erste Frame zeigt bereits das komplette Angebot,
weil Outlook und Link-Vorschauen nur Frame 1 anzeigen.

**Ablauf:** CYBER MONDAY flackert Buchstabe für Buchstabe an wie eine Neonröhre →
„15 %" schlägt mit Blur und RGB-Glitch ein → „auf ALLES" wischt von unten herein →
der Rahmen des Code-Buttons zeichnet sich, „CYBER15" tippt sich ein, ein Lichtreflex
läuft über den Button → Halten → das Schild flackert aus, die Schleife beginnt neu.

## Neu bauen

```bash
./build.sh            # Frames rendern, GIFs + MP4 erzeugen, mit gifsicle komprimieren
LOSSY=60 ./build.sh   # stärker komprimieren (Standard 40)
```

Benötigt: node mit `playwright`, `ffmpeg`, `gifsicle`.
Texte und Timing stehen in `src/animation.html` (im Browser öffnen = Live-Vorschau,
nach einmaligem `./build.sh`, das den Hintergrund skaliert).
Poppins liegt unter `src/fonts/` (SIL Open Font License).
