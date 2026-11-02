# Cyber Monday – 16:9-Banner mit echten Home-Deluxe-Artikeln

Motiv mit Higgsfield erzeugt (Modell Nano Banana 2.1, 2752 × 1536): das Neon-Wohnzimmer
aus dem Quadrat-Motiv als Szenen-Referenz, dazu die Shopfotos von vier echten Artikeln.
Darauf die Motion Graphics in Poppins (wie im Quadrat-Motiv) plus Produkt-Hotspots.

| Datei | Einsatz |
|---|---|
| `export/cyber-monday-banner-1920x1080.mp4` | Website-Hero (`<video autoplay muted loop playsinline>`), Social, Display – **empfohlen** |
| `export/cyber-monday-banner-1920x1080.gif` | GIF-Fallback in voller Größe (20 fps) |
| `export/cyber-monday-banner-1280x720.gif` | leichtere GIF-Variante (Newsletter, Marktplätze) |
| `export/cyber-monday-banner-1920x1080.jpg` | Standbild (kompletter Endzustand) |

## Artikel im Bild

| Hotspot | Artikel im Shop | Link |
|---|---|---|
| Modulares Sofa VERONA XL | Modulares Sofa VERONA - XL Anthrazit | https://www.homedeluxe.de/modulares-sofa-verona-xl-anthrazit_21558_51305/ |
| Couchtisch Marmor AMIRI XL | AMIRI XL Couchtisch Marmor - 95 x 95 cm Schwarz | https://www.homedeluxe.de/couchtisch-marmor-amiri-xl-farbauswahl_21756_51593/ |
| Relaxsessel CHILL | Relaxsessel CHILL - Anthrazit | https://www.homedeluxe.de/relaxsessel-chill_25025_60375/ |
| Stehlampe LUNA | Stehlampe LUNA - Schwarz/Gold | https://www.homedeluxe.de/stehlampe-luna_21516_51200/ |

Die Möbel im Motiv sind KI-Nachbildungen der Shopfotos: sehr nah am Original,
aber nicht pixelgenau. Vor der Veröffentlichung kurz gegen den Shop prüfen.

## Ablauf (9 s Schleife)

Text steigt wie im Quadrat-Motiv weich ein → Code-Button öffnet sich aus der Mitte →
die vier Produkt-Hotspots erscheinen nacheinander von links nach rechts (Punkt, Linie,
Etikett mit scharfen Ecken) und pulsieren ruhig → Halten → alles blendet weich aus.
Erster Frame = kompletter Endzustand. Textblock exakt horizontal mittig und vertikal
mittig auf der Marmorwand (über dem Couchtisch).

## Neu bauen

```bash
./build.sh
```

Nutzt `../src/render.js` (optische Zentrierung), Schrift und Logo aus `../src/`.
