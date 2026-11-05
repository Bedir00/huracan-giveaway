# Cyber Monday – Slider-Formate Small / Medium / Large

Gleiche Animation wie das 3:4-Motiv (ohne Produkt-Hinweise, Einblendung direkt ab
Sekunde 1, 8 s Schleife). Das Logo schließt hier den zentrierten Block unter dem
Code-Button ab, damit es nicht auf den Möbeln liegt.

| Format | Größe | Dateien | Motiv |
|---|---|---|---|
| Small | 1440 × 1440 | `export/cyber-monday-small-1440x1440.{jpg,gif,mp4}` | quadratischer Ausschnitt aus dem 3:4-Motiv |
| Medium | 1600 × 560 | `export/cyber-monday-medium-1600x560.{jpg,gif,mp4}` | 20:7-Ausschnitt aus neuem 21:9-Motiv (Higgsfield, 6336 × 2688) |
| Large | 3200 × 1120 | `export/cyber-monday-large-3200x1120.{jpg,gif,mp4}` | wie Medium, doppelte Pixeldichte |

- **JPG** = Standbild mit komplettem Angebot (statischer Slider / Fallback)
- **GIF** = Animation, mit gifsicle komprimiert (Small und Large mit 20 fps)
- **MP4** = Animation in voller Qualität

Large ist nicht hochskaliert: Motiv in 4K erzeugt, Text mit 2-facher Pixeldichte
gerendert. Textblock in allen drei Formaten exakt mittig (Abweichung < 0,5 px).

## Neu bauen

```bash
./build.sh                # alle drei
./build.sh medium large   # einzelne Formate
```
