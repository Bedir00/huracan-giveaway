#!/usr/bin/env bash
# Baut das 16:9-Banner neu: Frames rendern -> MP4 + GIFs (globale Palette, gifsicle) + Standbild.
# Voraussetzungen: node + playwright, ffmpeg, gifsicle
set -euo pipefail
cd "$(dirname "$0")"

FPS=25
NAME=cyber-monday-banner
mkdir -p build export

# Higgsfield-Motiv (2752x1536) auf 1920x1080: auf 1080 Hoehe skalieren, mittig beschneiden
ffmpeg -hide_banner -loglevel error -y -i src/hintergrund-higgsfield.jpg -vf "scale=-2:1080:flags=lanczos,crop=1920:1080" build/hintergrund-1920.png
ANIM_HTML=src/animation.html node ../src/render.js build/frames "$FPS"

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

make_gif 1920 1080 "export/$NAME-1920x1080.gif" 60 20   # Website-Hero (GIF-Fallback, besser: MP4)
make_gif 1280 720  "export/$NAME-1280x720.gif"  60 20   # leichtere Variante (Newsletter, Marktplatz)

# MP4 (Website-Hero als <video>, Social, Display) + Standbild als Fallback
ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i build/frames/f%04d.png \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "export/$NAME-1920x1080.mp4"
ffmpeg -hide_banner -loglevel error -y -i build/frames/f0000.png -q:v 2 "export/$NAME-1920x1080.jpg"
for f in "export/$NAME-1920x1080.mp4" "export/$NAME-1920x1080.jpg"; do
  printf '%-48s %6s KB\n' "$f" "$(( $(stat -c %s "$f") / 1024 ))"
done
