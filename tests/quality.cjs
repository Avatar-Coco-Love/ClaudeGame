// S-41 adaptive graphics (D-109). Node: the Quality controller steps down on a slow p90, up after 10 s fast, never past
// L2, and High / Low never step. Browser: a slow frame stream steps Auto to L1 (DPR 2 → 1) then L2; High holds L0;
// the Graphics button cycles and is saved; the same seed + input gives the same game state at L0 and L2.
// smoke.cjs calls nodeChecks and browserChecks; `node tests/quality.cjs` runs both alone.
const path = require('path');

async function nodeChecks(check) {
  const { Quality } = await import(path.join(__dirname, '../src/quality.js'));
  // `ms` is a frame time, or level => frame time (a renderer that really gets faster at lower levels; audit 79, B-073).
  const feed = (q, ms, s) => { const log = []; for (let t = 0, f; t < s * 1000; t += f) { f = typeof ms === 'function' ? ms(q.level) : ms; if (q.sample(f)) log.push(q.level); } return log; };
  const q = new Quality('auto');
  check('S-41 Auto: 2.5 s of 30 ms frames is not enough to step (3 s window)', feed(q, 30, 2.5).length === 0 && q.level === 0);
  const down = feed(q, l => [30, 25, 10][l], 10); // each step pays (25 < 0.85 × 30)
  check('S-41 Auto: slow frames step L0 → L1 → L2 and stop there', down.join() === '1,2' && q.level === 2, down.join());
  const mid = feed(q, 18, 30);
  check('S-41 Auto: 18 ms frames (between the bars) never step', mid.length === 0 && q.level === 2, mid.join());
  const spiky = new Quality('low'); spiky.setMode('auto'); // L2, then a stream that's fast but 1 in 5 frames slow
  let n = 0; for (let t = 0; t < 30000; t += 10) if (spiky.sample(++n % 5 ? 8 : 30)) break;
  check('S-41 Auto: p90 (not the mean) decides: 20 % slow frames step down, not up', spiky.level === 2, String(spiky.level));
  const up = feed(q, 16.7, 9);
  check('S-41 Auto: under 10 s of fast frames does not step up', up.length === 0 && q.level === 2, up.join());
  const up2 = feed(q, 16.7, 25);
  check('S-41 Auto: 10 s fast steps up one level at a time, back to L0', up2.join() === '1,0' && q.level === 0, up2.join());
  const stall = new Quality('auto'); feed(stall, 30, 2); stall.sample(5000); const s2 = feed(stall, 30, 2.5);
  check('S-41 Auto: a stall (> 1 s, tab switch) resets the window', s2.length === 0 && stall.level === 0);
  const bq = new Quality('auto'); feed(bq, 30, 3.05); feed(bq, 16.7, 13.1); const b1 = bq.level; feed(bq, 30, 3.05); // L1 → L0 → L1 (16.7 after 30: the step paid)
  const b2 = feed(bq, 16.7, 13.1 + 5).length, b3 = feed(bq, 16.7, 6).length;
  check('S-41 Auto: a step down right after a step up doubles the wait to step up again (10 → 20 s)', b1 === 0 && bq.upS === 20 && b2 === 0 && b3 === 1 && bq.level === 0, [b1, bq.upS, b2, b3].join());
  const hi = new Quality('high'), lo = new Quality('low');
  check('S-41 High never steps (L0) and Low is L2 fixed', !feed(hi, 60, 20).length && hi.level === 0 && !feed(lo, 5, 30).length && lo.level === 2);
  const cap = new Quality('auto'), c1 = feed(cap, 33.3, 6.2), c2 = feed(cap, 33.3, 60); // a 30 Hz rAF cap: no level helps
  check('Auto: a step down that buys no faster frames (30 Hz cap) is undone and Auto stops stepping down (B-073, D-110)',
    c1.join() === '1,0' && c2.length === 0 && cap.level === 0 && cap.capped, JSON.stringify([c1, c2, cap.level]));
  cap.setMode('auto');
  check('Auto: choosing Auto again in Settings gives the step down another try (B-073)', !cap.capped && feed(cap, 33.3, 3.2).join() === '1');
  const one = new Quality('auto'); one.skip1 = true; const o1 = feed(one, l => [50, 50, 10][l], 7), o2 = feed(one, 16.7, 14);
  check('Auto on a DPR ≤ 1 screen skips L1 (it draws as L0): L0 → L2 and back (audit 79)', o1.join() === '2' && o2.join() === '0', JSON.stringify([o1, o2]));
  const bad = new Quality('ultra');
  check('S-41 an unknown graphics mode falls back to Auto', bad.mode === 'auto');
}

// Every draw busy-waits window.__slow ms (0 = normal speed): a slow renderer, adjustable mid-test (cf. spire.cjs slowFrames).
// The wait shrinks with the level (×1 / ×0.6 / ×0.2), as a real renderer's does; a fixed wait is a frame cap (B-073).
const slowable = page => page.evaluate(() => { window.__slow = 0; const R = window.__lumen.renderer, draw = R.draw.bind(R);
  R.draw = (...a) => { const end = performance.now() + window.__slow * [1, 0.6, 0.2][R.quality]; while (performance.now() < end); return draw(...a); }; });

async function browserChecks(browser, url, check, errors) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errors.push('quality: ' + e.message));
  await page.goto(url); await page.waitForTimeout(200);
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
  await slowable(page);
  const st = () => page.evaluate(() => { const L = window.__lumen; return { lv: L.quality.level, r: L.renderer.quality, dpr: L.renderer.dpr, cw: L.renderer.canvas.width, mode: L.settings.graphics }; });
  const s0 = await st();
  check('S-41 a fresh start is Auto at L0 with DPR 2 on a 2× screen', s0.mode === 'auto' && s0.lv === 0 && s0.dpr === 2 && s0.cw === 1600, JSON.stringify(s0));
  await page.evaluate(() => { window.__slow = 50; }); await page.waitForTimeout(2500);
  const sT = await st();
  check('S-41 slow frames on the title (paused) never step', sT.lv === 0, JSON.stringify(sT));
  await page.evaluate(() => { window.__slow = 0; });
  await page.click('#new-world'); await page.waitForTimeout(200);
  await page.evaluate(() => { const g = window.__lumen.game; g.demo = true; window.__slow = 50; });
  await page.waitForFunction(() => window.__lumen.quality.level >= 1, null, { timeout: 15000 }).catch(() => {});
  const s1 = await st();
  check('S-41 Auto: a slow frame stream steps to L1 and the canvas drops to DPR 1', s1.lv === 1 && s1.r === 1 && s1.dpr === 1 && s1.cw === 800, JSON.stringify(s1));
  await page.waitForFunction(() => window.__lumen.quality.level >= 2, null, { timeout: 15000 }).catch(() => {});
  const s2 = await st();
  check('S-41 Auto: still slow → L2', s2.lv === 2 && s2.r === 2 && s2.dpr === 1, JSON.stringify(s2));
  await page.evaluate(() => { window.__slow = 0; });
  await page.waitForFunction(() => window.__lumen.quality.level <= 1, null, { timeout: 25000 }).catch(() => {});
  const s3 = await st();
  check('S-41 Auto: fast frames for 10 s step back up a level', s3.lv === 1 && s3.dpr === 1, JSON.stringify(s3));

  // Settings → Graphics cycles Auto → High → Low → Auto, applies at once, and is saved.
  await page.click('#menu-btn'); await page.click('#settings-btn');
  const seen = [];
  for (let i = 0; i < 3; i++) {
    await page.click('#set-graphics'); await page.waitForTimeout(50);
    seen.push(await page.evaluate(() => { const L = window.__lumen; return [document.getElementById('set-graphics').textContent, L.renderer.quality, L.renderer.dpr,
      JSON.parse(localStorage.getItem('lumencore.settings.v1')).graphics].join(':'); }));
  }
  check('S-41 the Graphics button cycles High (L0, DPR 2) → Low (L2, DPR 1) → Auto, saved each time',
    seen.join() === 'High:0:2:high,Low:2:1:low,Auto:2:1:auto', seen.join());
  await page.click('#set-graphics'); await page.click('#settings-close'); await page.click('#continue');
  await page.evaluate(() => { window.__lumen.game.demo = true; window.__slow = 50; }); await page.waitForTimeout(4500);
  const sH = await st();
  check('S-41 High never steps down under slow frames', sH.mode === 'high' && sH.lv === 0 && sH.dpr === 2, JSON.stringify(sH));
  await page.evaluate(() => { window.__slow = 0; });
  await page.evaluate(() => localStorage.setItem('lumencore.settings.v1', JSON.stringify({ graphics: 'low' })));
  await page.reload(); await page.waitForTimeout(300); await slowable(page);
  const sL = await st();
  check('S-41 a saved Low loads as L2 with DPR 1', sL.mode === 'low' && sL.lv === 2 && sL.dpr === 1, JSON.stringify(sL));
  await page.evaluate(() => localStorage.setItem('lumencore.settings.v1', JSON.stringify({ graphics: 7 })));
  await page.reload(); await page.waitForTimeout(300);
  check('S-41 a damaged graphics value loads as Auto', (await st()).mode === 'auto');

  // Simulation untouched: the same seed + scripted input + fixed dt, drawn every step, at L0 and at L2.
  const runs = await page.evaluate(async () => {
    const { Game } = await import('./src/game.js');
    const L = window.__lumen, R = L.renderer, silent = new Proxy({}, { get: () => () => {} }), out = [];
    for (const lv of [0, 2]) {
      R.setQuality(lv);
      const g = new Game({ seed: 4242, mode: 'surge', save: null, settings: L.settings, audio: silent });
      R.attach(g);
      for (let i = 0; i < 900; i++) {
        const a = i * 0.013, sp = R.worldToScreen(g.player.x, g.player.y);
        const intent = { move: { x: Math.cos(a), y: Math.sin(a * 0.7) }, aim: { x: sp.x + Math.cos(a * 3) * 120, y: sp.y + Math.sin(a * 2) * 120 }, fire: i % 200 < 150, scan: false, beamMode: false, place: false };
        if (g.hitstop > 0) g.hitstop -= 1 / 60; else g.update(1 / 60, intent);
        R.draw(1 / 60, L.input);
      }
      out.push(JSON.stringify({ stats: g.stats, bank: g.bank, cargo: g.cargo, p: [g.player.x, g.player.y, g.player.hp], e: g.enemies.length, pk: g.pickups.length })); // particles are Math.random (visual only, D-025)
    }
    R.attach(L.game);
    return out;
  });
  check('S-41 the same seed + input gives the same game at L0 and L2 (drawing only)', runs[0] === runs[1], runs[0] === runs[1] ? runs[0].slice(0, 120) : runs.join(' ≠ '));
  check('S-41 the determinism run did something (mined or moved)', /"mined":[1-9]|"cells":[1-9]/.test(runs[0]) || !runs[0].includes('"p":[0,0'), runs[0].slice(0, 160));
  await page.close();
}

module.exports = { nodeChecks, browserChecks };

if (require.main === module) {
  const http = require('http'), fs = require('fs'), { chromium } = require('playwright');
  const ROOT = path.join(__dirname, '..');
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  let failed = 0; const errors = [];
  const check = (name, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
  (async () => {
    await nodeChecks(check);
    await new Promise(r => server.listen(0, r));
    const browser = await chromium.launch();
    try { await browserChecks(browser, `http://localhost:${server.address().port}/`, check, errors); }
    finally { await browser.close(); server.close(); }
    check('no page errors', errors.length === 0, errors.join(' | '));
    process.exit(failed ? 1 : 0);
  })();
}
