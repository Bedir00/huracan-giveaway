// Renders animation.html frame by frame into PNGs.
//
//   node render.js <outDir> [fps=25] [start=4.0]
//   node render.js --still <out.png> <t>     single frame for checking the layout
//
// "start" rotates the loop so the first frame already shows the full offer:
// Outlook and most link previews only ever show the first GIF frame.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'animation.html'));
  await page.waitForFunction(() => window.ANIM && window.ANIM.ready, null, { timeout: 15000 });
  const stage = await page.$('#stage');
  const T = await page.evaluate(() => window.ANIM.T);

  if (args[0] === '--still') {
    await page.evaluate(t => window.seek(t), parseFloat(args[2]));
    await stage.screenshot({ path: args[1] });
  } else {
    const outDir = args[0];
    const fps = parseInt(args[1] || '25', 10);
    const start = parseFloat(args[2] || '4.0');
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of fs.readdirSync(outDir)) if (f.endsWith('.png')) fs.unlinkSync(path.join(outDir, f));
    const n = Math.round(T * fps);
    for (let i = 0; i < n; i++) {
      const t = (start + i / fps) % T;
      await page.evaluate(t => window.seek(t), t);
      await stage.screenshot({ path: path.join(outDir, `f${String(i).padStart(4, '0')}.png`) });
    }
    console.log(`${n} frames, ${T}s @ ${fps} fps -> ${outDir}`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
