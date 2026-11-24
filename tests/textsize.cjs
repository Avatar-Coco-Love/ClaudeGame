// S-40 readable text: every text the play HUD shows is >= 12 px at Normal and Large (the title footer alone keeps 11 px);
// Large (Settings, x1.2 via --ts on :root) is saved, survives a reload, and still fits at 320x568 and 568x320 (no HUD box
// overlaps another, the ◎ ⟂ ♪ ≡ targets stay >= 44 px, no HUD text overflows its box). smoke.cjs calls browserChecks.
const { devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const SETTINGS = 'lumencore.settings.v1';

// Start a world with every HUD element on: Surge (integrity), Scanner + Wide (◎ ⟂), a Beacon (✦), all three Anomaly chips,
// a 4-digit bank, the Core Matrix button and a hint.
// bank: 4 digits each (the B-034 landscape case) or, in portrait, a whole world's supply (the B-039 case, 2750 1470 141).
async function busyHud(pg, large, bank = { shard: 8888, prism: 8888, lumen: 8888 }) {
  await pg.evaluate(([k, l]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ largeText: l })); }, [SETTINGS, large]);
  await pg.reload(); await pg.waitForTimeout(300);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  await pg.evaluate(b => { const { game: g, dev } = window.__lumen; dev.setMode('surge'); g.demo = true; g.enemies = []; g.spawnTimer = 1e9;
    g.research.scanner = true; g.research.wide = true; g.craft.beacon = 3; g.buffs = ['overclock', 'lodestone', 'ballast'];
    Object.assign(g.bank, b); g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; }, bank);
  await pg.waitForTimeout(350);
}

// Smallest computed font size among visible text in #hud, with the offenders.
const fontScan = pg => pg.evaluate(() => {
  const vis = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
  const els = [...document.querySelectorAll('#hud *')].filter(e => vis(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  const sizes = els.map(e => ({ el: (e.id || e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 10), px: parseFloat(getComputedStyle(e).fontSize) }));
  const min = Math.min(...sizes.map(s => s.px));
  return { n: sizes.length, min, small: sizes.filter(s => s.px < 12), bank: parseFloat(getComputedStyle(document.querySelector('.bank')).fontSize),
    large: document.documentElement.classList.contains('text-large') };
});

async function browserChecks(browser, url, check, errors, shots) {
  // ---- Desktop 1280×800: the font floor at both sizes; Large scales the bank by 1.2.
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push('textsize: ' + e.message));
  await page.goto(url); await page.waitForTimeout(300);
  const res = {};
  for (const large of [false, true]) {
    await busyHud(page, large);
    res[large] = await fontScan(page);
    check(`1280×800 ${large ? 'Large' : 'Normal'} text: all ${res[large].n} visible HUD texts ≥ 12 px (S-40, smallest ${res[large].min})`,
      res[large].n >= 12 && res[large].small.length === 0 && res[large].large === large, JSON.stringify(res[large].small));
    if (shots && large) await page.screenshot({ path: `${shots}/hud-large-1280.png` });
  }
  check('Large text scales HUD text ×1.2 (bank 18 → 21.6 px) (S-40)', Math.abs(res.true.bank / res.false.bank - 1.2) < 0.01,
    JSON.stringify({ normal: res.false.bank, large: res.true.bank }));

  // ---- The Settings switch: off by default, a tap turns it on and saves it; a damaged value loads Normal.
  await page.evaluate(k => localStorage.removeItem(k), SETTINGS);
  await page.reload(); await page.waitForTimeout(300);
  const sw = '#settings [data-setting="largeText"]';
  await page.click('#settings-btn'); await page.waitForTimeout(100);
  const before = await page.evaluate(s => [document.querySelector(s).getAttribute('aria-checked'), document.documentElement.classList.contains('text-large')], sw);
  await page.click(sw); await page.waitForTimeout(100);
  const after = await page.evaluate(([s, k]) => [document.querySelector(s).getAttribute('aria-checked'), document.documentElement.classList.contains('text-large'),
    JSON.parse(localStorage.getItem(k)).largeText], [sw, SETTINGS]);
  await page.reload(); await page.waitForTimeout(300);
  const kept = await page.evaluate(() => document.documentElement.classList.contains('text-large'));
  await page.evaluate(k => localStorage.setItem(k, JSON.stringify({ largeText: 'yes' })), SETTINGS);
  await page.reload(); await page.waitForTimeout(300);
  const damaged = await page.evaluate(() => document.documentElement.classList.contains('text-large'));
  check('Settings → Large text: off by default, a tap turns it on and saves it, kept on reload, a damaged value loads Normal (S-40)',
    before[0] === 'false' && !before[1] && after[0] === 'true' && after[1] && after[2] === true && kept && !damaged,
    JSON.stringify({ before, after, kept, damaged }));
  const foot = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.foot')).fontSize));
  check('the title footer keeps 11 px at Normal (S-40)', foot === 11, String(foot));
  await page.evaluate(() => localStorage.clear());
  await page.close();

  // ---- Large text at the narrowest phones: no overlap, 44 px targets, no overflow.
  const P7 = devices['Pixel 7'], { isMobile, hasTouch, deviceScaleFactor, userAgent } = P7;
  for (const vp of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) {
    const ctx = await browser.newContext({ isMobile, hasTouch, deviceScaleFactor, userAgent, viewport: vp }), pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(`textsize ${vp.width}: ` + e.message));
    await pg.goto(url); await pg.waitForTimeout(300);
    await busyHud(pg, true, vp.width < vp.height ? { shard: 2750, prism: 1470, lumen: 141 } : undefined);
    if (shots) await pg.screenshot({ path: `${shots}/hud-large-${vp.width}x${vp.height}.png` });
    const r = await pg.evaluate(() => {
      const box = s => { const e = document.querySelector(s), b = e.getBoundingClientRect(); return { s, l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
      const boxes = ['.top-left', '#minimap', '#scan-btn', '#mode-btn', '#beacon-btn', '#mute-btn', '#menu-btn', '#matrix-btn'].map(box).filter(b => b.w > 0);
      const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b, overlaps = [];
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (hit(boxes[i], boxes[j])) overlaps.push(boxes[i].s + '×' + boxes[j].s);
      const small = boxes.filter(b => b.s.startsWith('#') && b.s !== '#minimap' && (b.w < 44 || b.h < 44)).map(b => `${b.s} ${Math.round(b.w)}×${Math.round(b.h)}`);
      const off = boxes.filter(b => b.l < 0 || b.r > innerWidth + 0.5 || b.b > innerHeight + 0.5).map(b => b.s);
      const over = [...document.querySelectorAll('#hud *')].filter(e => e.offsetParent && !e.children.length && e.textContent.trim() && e.clientWidth > 0)
        .filter(e => e.scrollWidth > e.clientWidth + 1).map(e => `${e.id || e.tagName}:${e.textContent.trim().slice(0, 12)}`);
      return { n: boxes.length, overlaps, small, off, over, large: document.documentElement.classList.contains('text-large') };
    });
    check(`${vp.width}×${vp.height} Large text, Surge, 3 chips, ${vp.width < vp.height ? 'a world\'s supply' : '4-digit bank'}: no HUD overlap, ◎ ⟂ ✦ ♪ ≡ ≥ 44 px, nothing off screen or overflowing (S-40)`,
      r.large && r.n === 8 && !r.overlaps.length && !r.small.length && !r.off.length && !r.over.length, JSON.stringify(r));
    await ctx.close();
  }
}

module.exports = { browserChecks };

if (require.main === module) {
  const http = require('http');
  const { chromium } = require('playwright');
  const ROOT = path.join(__dirname, '..');
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  let failed = 0;
  const errors = [];
  const check = (name, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
  (async () => {
    await new Promise(r => server.listen(0, r));
    const browser = await chromium.launch();
    try { await browserChecks(browser, `http://localhost:${server.address().port}/`, check, errors, process.env.SHOTS); }
    finally { await browser.close(); server.close(); }
    check('no page errors', errors.length === 0, errors.join(' | '));
    process.exit(failed ? 1 : 0);
  })();
}
