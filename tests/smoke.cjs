// Health check: serves the repo, drives the game in headless Chromium, exits non-zero on any failure.
// Usage: node tests/smoke.cjs   (uses the pre-installed Playwright; no npm install needed)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

(async () => {
  for (const r of require('./docs.cjs').run()) check(r.name, r.ok, r.detail);
  await new Promise(r => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const errors = [];
  try {
    // ---- Desktop ----
    const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    pg.on('pageerror', e => errors.push('desktop: ' + e.message));
    pg.on('console', m => { if (m.type() === 'error') errors.push('desktop console: ' + m.text()); });
    await pg.goto(url);
    await pg.waitForTimeout(400);
    check('title screen visible', await pg.isVisible('#title'));
    check('version shown on title', /^v\d+\.\d+\.\d+$/.test(await pg.textContent('#version')));
    await pg.click('#new-world');
    await pg.waitForTimeout(300);
    check('game started', await pg.evaluate(() => !!window.__lumen?.game && document.getElementById('title').classList.contains('hidden')));

    // Mine straight down from the Nexus.
    await pg.mouse.move(640, 790); await pg.mouse.down(); await pg.keyboard.down('s');
    await pg.waitForTimeout(5000);
    await pg.keyboard.up('s'); await pg.mouse.up();
    const m = await pg.evaluate(() => { const g = window.__lumen.game; return { mined: g.stats.mined, got: g.cargo.shard + g.cargo.prism + g.bank.shard + g.bank.prism, dy: g.player.y - g.nexus.y }; });
    check('beam mines terrain', m.mined >= 4, `mined ${m.mined}`);
    check('core tunnels forward', m.dy > 150, `moved ${Math.round(m.dy)}px`);

    // Deposit + upgrade.
    await pg.evaluate(() => { const g = window.__lumen.game; g.cargo.shard = 30; g.cargo.prism = 5; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; });
    await pg.waitForTimeout(2000);
    const bank = await pg.evaluate(() => ({ ...window.__lumen.game.bank, cargo: window.__lumen.game.cargoTotal() }));
    check('deposit empties cargo into bank', bank.cargo === 0 && bank.shard >= 30, JSON.stringify(bank));
    await pg.keyboard.press('e'); await pg.waitForTimeout(200);
    check('core matrix opens', await pg.isVisible('#matrix'));
    const before = await pg.evaluate(() => window.__lumen.game.bank.shard);
    await pg.click('#upgrade-list .upgrade:first-child .buy:not([disabled])');
    const after = await pg.evaluate(() => window.__lumen.game.bank.shard);
    check('upgrade purchase spends shards', after < before, `${before} -> ${after}`);
    await pg.keyboard.press('Escape');

    // Surge mode: glitches spawn and die to the beam.
    await pg.evaluate(() => { const g = window.__lumen.game; g.setMode('surge'); g.player.x = g.nexus.x + 1200; g.player.y = g.nexus.y + 1200;
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) g.world.destroy(Math.floor(g.player.x / 32) + x, Math.floor(g.player.y / 32) + y); g.spawnTimer = 0; });
    await pg.waitForTimeout(3000);
    check('surge spawns glitches', await pg.evaluate(() => window.__lumen.game.enemies.length > 0));
    await pg.evaluate(() => { const g = window.__lumen.game, p = g.player; g.enemies = [{ x: p.x + 60, y: p.y, r: 11, vx: 0, vy: 0, tier: 0, hp: 1, maxHp: 1, speed: 0, dmg: 1, spin: 0, flash: 0, hitCd: 9, wander: 0, alert: true }]; });
    await pg.mouse.move(900, 400); await pg.mouse.down(); await pg.waitForTimeout(1500); await pg.mouse.up();
    check('beam kills glitches', await pg.evaluate(() => window.__lumen.game.stats.glitches >= 1));

    // Save / reload.
    const snap = await pg.evaluate(() => { dispatchEvent(new Event('pagehide')); const g = window.__lumen.game; return { mined: g.stats.mined, up: JSON.stringify(g.upgrades) }; });
    await pg.reload(); await pg.waitForTimeout(400);
    check('continue offered after reload', await pg.isVisible('#continue'));
    await pg.click('#continue'); await pg.waitForTimeout(200);
    const re = await pg.evaluate(() => { const g = window.__lumen.game; return { mined: g.stats.mined, up: JSON.stringify(g.upgrades), mode: g.mode }; });
    check('save restores progress', re.mined === snap.mined && re.up === snap.up && re.mode === 'surge', JSON.stringify(re));

    // Old saves must load: a save written before format tracking has no `v`.
    await pg.evaluate(() => { dispatchEvent(new Event('pagehide')); const k = 'lumencore.save.v1', s = JSON.parse(localStorage.getItem(k)); delete s.v; localStorage.setItem(k, JSON.stringify(s)); });
    await pg.reload(); await pg.waitForTimeout(400);
    await pg.click('#continue'); await pg.waitForTimeout(200);
    const old = await pg.evaluate(() => window.__lumen.game.stats.mined);
    check('unversioned (format 1) save still loads', old === snap.mined, `mined ${old}`);

    // Frame budget: average frame time while mining.
    const fps = await pg.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { if (++n < 120) requestAnimationFrame(f); else r(1000 * n / (performance.now() - t0)); }; requestAnimationFrame(f); }));
    check('frame rate reasonable (headless)', fps > 20, `${fps.toFixed(1)} fps`);
    await pg.close();

    // ---- Phone (touch) ----
    const ctx = await browser.newContext({ ...devices['Pixel 7'] });
    const ph = await ctx.newPage();
    ph.on('pageerror', e => errors.push('phone: ' + e.message));
    await ph.goto(url); await ph.waitForTimeout(300);
    await ph.evaluate(() => { try { localStorage.clear(); } catch {} });
    await ph.reload(); await ph.waitForTimeout(300);
    await ph.reload(); await ph.waitForTimeout(300); // a fresh visitor leaving + returning must not get a phantom save
    check('title demo world is never saved', !(await ph.isVisible('#continue')));
    await ph.tap('#new-world'); await ph.waitForTimeout(300);
    const cdp = await ctx.newCDPSession(ph);
    const vp = ph.viewportSize();
    const pts = dy => [{ x: 80, y: vp.height - 150 + dy, id: 1 }, { x: vp.width - 80, y: vp.height - 150 + dy, id: 2 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(0) });
    for (let i = 0; i < 30; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(50) }); await ph.waitForTimeout(100); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const t = await ph.evaluate(() => { const g = window.__lumen.game; return { mined: g.stats.mined, moved: Math.round(Math.hypot(g.player.x - g.nexus.x, g.player.y - g.nexus.y - 40)), beam: g.beam.on }; });
    check('touch stick moves the core', t.moved > 60, JSON.stringify(t));
    check('touch aim stick fires the beam', t.mined > 0 || t.beam, JSON.stringify(t));
    await ctx.close();
  } catch (e) {
    check('smoke run completed', false, e.message);
  } finally {
    check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
    await browser.close();
    server.close();
    const failed = results.filter(r => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} checks passed`);
    process.exit(failed ? 1 : 0);
  }
})();
