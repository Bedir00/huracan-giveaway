// Renders animation.html frame by frame into PNGs.
//
//   node render.js <outDir> [fps=25]          all frames, starting at HOLD (full offer in frame 1:
//                                             Outlook and link previews only ever show the first frame)
//   node render.js --still <out.png> <t>      single frame for checking the layout
//
// Before rendering, every line is centred optically: the real ink of each line is
// measured from a transparent screenshot and shifted onto the centre axis, so side
// bearings, tracking and the "%" sign cannot pull a line off-centre.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CENTER = 540;
const cx = b => (b.x0 + b.x1) / 2;
const cy = b => (b.y0 + b.y1) / 2;

async function inkBox(page, stage, sel) {
  await page.evaluate(sel => {
    document.documentElement.classList.add('measure');
    document.querySelector(sel).classList.add('m-target');
  }, sel);
  const png = await stage.screenshot({ omitBackground: true });
  await page.evaluate(sel => {
    document.documentElement.classList.remove('measure');
    document.querySelector(sel).classList.remove('m-target');
  }, sel);
  return page.evaluate(async b64 => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
    let x0 = width, y0 = height, x1 = -1, y1 = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 96) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
  }, png.toString('base64')).then(b => {
    if (b.x1 <= b.x0 || b.y1 <= b.y0) throw new Error(`Kalibrierung: ${sel} hat keine sichtbaren Pixel`);
    return b;
  });
}

const rect = (page, sel) => page.evaluate(sel => {
  const r = document.querySelector(sel).getBoundingClientRect();
  return { x0: r.left, x1: r.right, y0: r.top, y1: r.bottom };
}, sel);

const shift = (page, sel, prop, v) => page.evaluate(([sel, prop, v]) => {
  const e = document.querySelector(sel);
  const cur = parseFloat(e.style[prop]) || parseFloat(getComputedStyle(e)[prop]) || 0;
  e.style[prop] = (cur + v).toFixed(2) + 'px';
}, [sel, prop, v]);

async function calibrate(page, stage, log) {
  await page.evaluate(() => window.seek(window.ANIM.HOLD));
  // 1. every line: ink centred on x = 540
  for (const [measure, move] of [['#eyebrowText', '#eyebrow'], ['#headline', '#headline'], ['#sub', '#sub'], ['#logo', '#logo']]) {
    await shift(page, move, 'left', CENTER - cx(await inkBox(page, stage, measure)));
  }
  // 2. code text centred inside its box, both axes
  const box = await rect(page, '#codebox');
  const t = await inkBox(page, stage, '#codeText');
  await shift(page, '#codeText', 'left', cx(box) - cx(t));
  await shift(page, '#codeText', 'top', cy(box) - cy(t));
  // 3. block from the cap line of CYBER MONDAY to the bottom of the code box: centred on y = 540
  const top = (await inkBox(page, stage, '#eyebrowText')).y0;
  const bottom = (await rect(page, '#codebox')).y1;
  await shift(page, '#copy', 'top', CENTER - (top + bottom) / 2);

  if (log) {
    const rep = [];
    for (const sel of ['#eyebrowText', '#headline', '#sub', '#logo']) rep.push(`${sel} ${(cx(await inkBox(page, stage, sel)) - CENTER).toFixed(1)}px`);
    const b = await rect(page, '#codebox'), c = await inkBox(page, stage, '#codeText');
    rep.push(`#codebox ${(cx(b) - CENTER).toFixed(1)}px`, `code text in box ${(cx(c) - cx(b)).toFixed(1)}/${(cy(c) - cy(b)).toFixed(1)}px`);
    const tt = (await inkBox(page, stage, '#eyebrowText')).y0;
    rep.push(`block y ${tt}..${b.y1.toFixed(0)} centre ${((tt + b.y1) / 2 - CENTER).toFixed(1)}px`);
    console.log('Abweichung von der Mitte: ' + rep.join(' | '));
  }
}

(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'animation.html'));
  await page.waitForFunction(() => window.ANIM && window.ANIM.ready, null, { timeout: 15000 });
  const stage = await page.$('#stage');
  await calibrate(page, stage, args[0] !== '--still');
  const { T, HOLD } = await page.evaluate(() => window.ANIM);

  if (args[0] === '--still') {
    await page.evaluate(t => window.seek(t), parseFloat(args[2]));
    await stage.screenshot({ path: args[1] });
  } else {
    const outDir = args[0];
    const fps = parseInt(args[1] || '25', 10);
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of fs.readdirSync(outDir)) if (f.endsWith('.png')) fs.unlinkSync(path.join(outDir, f));
    const n = Math.round(T * fps);
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.seek(t), HOLD + i / fps);
      await stage.screenshot({ path: path.join(outDir, `f${String(i).padStart(4, '0')}.png`) });
    }
    console.log(`${n} frames, ${T}s @ ${fps} fps -> ${outDir}`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
