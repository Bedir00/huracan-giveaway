#!/usr/bin/env bash
# Baut das 3:4-Motiv neu: Frames rendern -> MP4 + GIFs (globale Palette, gifsicle) + Standbild.
# Voraussetzungen: node + playwright, ffmpeg, gifsicle
set -euo pipefail
cd "$(dirname "$0")"

FPS=25
NAME=cyber-monday-3x4
mkdir -p build export

# Higgsfield-Motiv (1792x2400) auf 1080x1440: auf 1080 Breite skalieren, mittig beschneiden
ffmpeg -hide_banner -loglevel error -y -i src/hintergrund-higgsfield.jpg -vf "scale=1080:-2:flags=lanczos,crop=1080:1440" build/hintergrund-1080x1440.png
# Start bei 0: die Einblendung laeuft direkt ab der ersten Sekunde
ANIM_HTML=src/animation.html node ../src/render.js build/frames "$FPS" 0

make_gif () {   # $1 = Breite, $2 = Hoehe, $3 = Ausgabe, $4 = lossy, $5 = Ziel-fps
  local tag="$1x$2" scale="fps=$5,scale=$1:$2:flags=lanczos"
  ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i build/frames/f%04d.png \
    -vf "$scale,palettegen=max_colors=256:stats_mode=full" "build/palette-$tag.png"
  ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i build/frames/f%04d.png -i "build/palette-$tag.png" \
    -lavfi "$scale[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" -loop 0 "build/raw-$tag.gif"
  gifsicle -O3 --lossy="$4" --no-comments --no-names --no-extensions "build/raw-$tag.gif" -o "$3"
  printf '%-48s roh %6s KB  ->  komprimiert %6s KB\n' "$3" \
    "$(( $(stat -c %s "build/raw-$tag.gif") / 1024 ))" "$(( $(stat -c %s "$3") / 1024 ))"
}

make_gif 1080 1440 "export/$NAME-1080x1440.gif" 40 25   # Social, Website
make_gif 600  800  "export/$NAME-600x800.gif"   60 20   # Newsletter

# MP4 (Instagram, Facebook) + Standbild
ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i build/frames/f%04d.png \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "export/$NAME-1080x1440.mp4"
ANIM_HTML=src/animation.html node ../src/render.js --still build/still.png hold   # Standbild = kompletter Endzustand
ffmpeg -hide_banner -loglevel error -y -i build/still.png -q:v 2 "export/$NAME-1080x1440.jpg"
for f in "export/$NAME-1080x1440.mp4" "export/$NAME-1080x1440.jpg"; do
  printf '%-48s %6s KB\n' "$f" "$(( $(stat -c %s "$f") / 1024 ))"
done
