#!/usr/bin/env bash
# Slider-Formate fuer die Website: Small 1440x1440, Medium 1600x560, Large 3200x1120.
# Je Format: Frames rendern (Einblendung ab Sekunde 1) -> GIF (globale Palette, gifsicle) + MP4 + Standbild.
# Voraussetzungen: node + playwright, ffmpeg, gifsicle
#
#   ./build.sh                 alle drei Formate
#   ./build.sh small medium    nur einzelne
set -euo pipefail
cd "$(dirname "$0")"

FPS=25
mkdir -p build export

# Hintergruende: Small = quadratischer Ausschnitt aus dem 3:4-Motiv, Medium/Large = 20:7-Ausschnitt aus dem 21:9-Motiv
python3 - ../portrait-3x4/src/hintergrund-higgsfield.jpg src/hintergrund-higgsfield-21x9.jpg build <<'PY'
import sys
from PIL import Image
p34, w219, out = sys.argv[1:4]
im = Image.open(p34).convert('RGB'); w, h = im.size; off = round(150 * w / 1080)
im.crop((0, off, w, off + w)).resize((1440, 1440), Image.LANCZOS).save(f'{out}/hintergrund-small.png')
im = Image.open(w219).convert('RGB'); w, h = im.size; ch = round(w * 7 / 20); y0 = (h - ch) // 2
c = im.crop((0, y0, w, y0 + ch))
c.resize((3200, 1120), Image.LANCZOS).save(f'{out}/hintergrund-wide-3200.png')
c.resize((1600, 560), Image.LANCZOS).save(f'{out}/hintergrund-wide-1600.png')
PY

build () {   # $1 name, $2 html, $3 DPR, $4 Breite, $5 Hoehe, $6 lossy, $7 GIF-fps
  local name=$1 html=$2 dpr=$3 w=$4 h=$5 lossy=$6 gfps=$7
  local out="export/cyber-monday-$name-${w}x${h}" frames="build/frames-$name"
  echo "== $name ${w}x${h}"
  DPR=$dpr ANIM_HTML=$html node ../src/render.js "$frames" "$FPS" 0          # Start mit der Einblendung
  DPR=$dpr ANIM_HTML=$html node ../src/render.js --still "build/still-$name.png" hold
  ffmpeg -hide_banner -loglevel error -y -i "build/still-$name.png" -q:v 2 "$out.jpg"
  local f="fps=$gfps"
  ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i "$frames/f%04d.png" \
    -vf "$f,palettegen=max_colors=256:stats_mode=full" "build/palette-$name.png"
  ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i "$frames/f%04d.png" -i "build/palette-$name.png" \
    -lavfi "$f[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" -loop 0 "build/raw-$name.gif"
  gifsicle -O3 --lossy="$lossy" --no-comments --no-names --no-extensions "build/raw-$name.gif" -o "$out.gif"
  ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i "$frames/f%04d.png" \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "$out.mp4"
  for x in jpg gif mp4; do printf '   %-48s %6s KB\n' "$out.$x" "$(( $(stat -c %s "$out.$x") / 1024 ))"; done
}

targets=${*:-small medium large}
for t in $targets; do
  case $t in
    small)  build small  src/small.html 1.3333333333333333 1440 1440 60 20 ;;
    medium) build medium src/wide.html  1                  1600 560  40 25 ;;
    large)  build large  src/wide.html  2                  3200 1120 60 20 ;;
    *) echo "unbekannt: $t"; exit 1 ;;
  esac
done
