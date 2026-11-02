#!/usr/bin/env bash
# Baut das Cyber-Monday-GIF neu: Frames rendern -> GIF (globale Palette) -> gifsicle-Kompression.
# Voraussetzungen: node + playwright, ffmpeg, gifsicle
set -euo pipefail
cd "$(dirname "$0")"

FPS=25
START=4.0      # erster Frame zeigt bereits das komplette Angebot (Outlook/Vorschauen zeigen nur Frame 1)
LOSSY=${LOSSY:-40}
NAME=cyber-monday-cyber15

mkdir -p build export
ffmpeg -hide_banner -loglevel error -y -i src/hintergrund.webp -vf scale=1080:1080:flags=lanczos build/hintergrund-1080.png
node src/render.js build/frames "$FPS" "$START"

make_gif () {   # $1 = Kantenlaenge, $2 = Ausgabe
  local size=$1 out=$2 scale="scale=$1:$1:flags=lanczos"
  ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i build/frames/f%04d.png \
    -vf "$scale,palettegen=max_colors=256:stats_mode=full" "build/palette-$size.png"
  ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i build/frames/f%04d.png -i "build/palette-$size.png" \
    -lavfi "$scale[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" -loop 0 "build/raw-$size.gif"
  gifsicle -O3 --lossy="$LOSSY" --no-comments --no-names --no-extensions "build/raw-$size.gif" -o "$out"
  printf '%-40s roh %6s KB  ->  komprimiert %6s KB\n' "$out" \
    "$(( $(stat -c %s "build/raw-$size.gif") / 1024 ))" "$(( $(stat -c %s "$out") / 1024 ))"
}

make_gif 1080 "export/$NAME-1080.gif"   # Social / Website
make_gif 600  "export/$NAME-600.gif"    # Newsletter

# MP4 fuer Instagram/Facebook (dort laufen keine GIFs)
ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i build/frames/f%04d.png \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart "export/$NAME-1080.mp4"
printf '%-40s %6s KB\n' "export/$NAME-1080.mp4" "$(( $(stat -c %s "export/$NAME-1080.mp4") / 1024 ))"
