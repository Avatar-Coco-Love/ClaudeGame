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

// Plant a save, then reload. Always use this: a plain reload fires `pagehide`, which saves the running game over the
// planted one (bit sessions 4 and 5). `edit(save)` runs in the page and returns the save to store (null = current save).
async function plantSaveAndReload(page, edit) {
  await page.evaluate(src => {
    dispatchEvent(new Event('pagehide')); // flush the live game first so edit() sees current state
    window.__lumen.game.demo = true;      // ...then stop it from saving again during the reload
    const k = 'lumencore.save.v1', cur = JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify((0, eval)(src)(cur)));
  }, edit.toString());
  await page.reload(); await page.waitForTimeout(400);
}

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
    await pg.keyboard.press('e'); await pg.waitForTimeout(150);
    check('E on the title does not open the Core Matrix (B-003)', !(await pg.isVisible('#matrix')));
    await pg.focus('#new-world'); await pg.keyboard.press('Enter'); // keyboard start: Enter is the button's, not a Matrix toggle
    await pg.waitForTimeout(300);
    check('Enter on New World starts without opening the Matrix', !(await pg.isVisible('#matrix')));
    check('game started', await pg.evaluate(() => !!window.__lumen?.game && document.getElementById('title').classList.contains('hidden')));

    // Mine straight down from the Nexus.
    // Real input, but timed by GAME time (B-006): the loop clamps dt to 0.05 s, so under load 5 s of wall clock was
    // as little as ~3 s of play and the cell count swung 3-8. Wait for 5 s of stats.time instead.
    await pg.mouse.move(640, 790); await pg.mouse.down(); await pg.keyboard.down('s');
    const mineT0 = await pg.evaluate(() => window.__lumen.game.stats.time);
    const mineWall = Date.now();
    await pg.waitForFunction(t => window.__lumen.game.stats.time >= t + 5, mineT0, { timeout: 60000, polling: 'raf' });
    await pg.keyboard.up('s'); await pg.mouse.up();
    const m = await pg.evaluate(() => { const g = window.__lumen.game; return { mined: g.stats.mined, got: g.cargo.shard + g.cargo.prism + g.bank.shard + g.bank.prism, dy: g.player.y - g.nexus.y }; });
    check('beam mines terrain', m.mined >= 4, `mined ${m.mined} in 5 s game time (${((Date.now() - mineWall) / 1000).toFixed(1)} s wall)`);
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

    // Nexus Development (S-1): Radiance costs Prisms only, widens the light, and reveals more of the map.
    const nx0 = await pg.evaluate(() => { const g = window.__lumen.game; g.bank.prism = 10; return { light: g.nexusLight(), shard: g.bank.shard, explored: g.world.explored.reduce((a, b) => a + b, 0) }; });
    await pg.click('#matrix .tabs button[data-tab="nexus"]');
    await pg.click('#upgrade-list .upgrade:first-child .buy:not([disabled])');
    const nx1 = await pg.evaluate(() => { const g = window.__lumen.game; return { light: g.nexusLight(), shard: g.bank.shard, prism: g.bank.prism, lvl: g.nexusLevels.radiance, explored: g.world.explored.reduce((a, b) => a + b, 0) }; });
    check('Radiance spends Prisms, not Shards', nx1.lvl === 1 && nx1.prism === 4 && nx1.shard === nx0.shard, JSON.stringify(nx1));
    check('Radiance widens Nexus light by 96 and reveals map', nx1.light === nx0.light + 96 && nx1.explored > nx0.explored, `${nx0.light}->${nx1.light}, explored ${nx0.explored}->${nx1.explored}`);
    await pg.keyboard.press('Escape'); await pg.keyboard.press('e'); await pg.waitForTimeout(100);
    check('Matrix remembers the last tab', await pg.evaluate(() => document.querySelector('#matrix .tabs .selected')?.dataset.tab === 'nexus'));
    await pg.keyboard.press('Escape');

    // Surge mode: glitches spawn and die to the beam.
    await pg.evaluate(() => { const g = window.__lumen.game; g.setMode('surge'); g.player.x = g.nexus.x + 1200; g.player.y = g.nexus.y + 1200;
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) g.world.destroy(Math.floor(g.player.x / 32) + x, Math.floor(g.player.y / 32) + y); g.spawnTimer = 0; });
    await pg.waitForTimeout(3000);
    check('surge spawns glitches', await pg.evaluate(() => window.__lumen.game.enemies.length > 0));
    await pg.evaluate(() => { const g = window.__lumen.game, p = g.player; g.enemies = [{ x: p.x + 60, y: p.y, r: 11, vx: 0, vy: 0, tier: 0, hp: 1, maxHp: 1, speed: 0, dmg: 1, spin: 0, flash: 0, hitCd: 9, wander: 0, alert: true }]; });
    await pg.mouse.move(900, 400); await pg.mouse.down(); await pg.waitForTimeout(1500); await pg.mouse.up();
    check('beam kills glitches', await pg.evaluate(() => window.__lumen.game.stats.glitches >= 1));
    // B-007: dying to the last of several Glitches near the Nexus emptied the list mid-loop and froze the game.
    const t0 = await pg.evaluate(() => { const g = window.__lumen.game, p = g.player; p.x = g.nexus.x + 600; p.y = g.nexus.y; p.integrity = 1; p.invuln = 0;
      g.enemies = [0, 1, 2].map(() => ({ x: p.x, y: p.y, r: 11, vx: 0, vy: 0, tier: 0, hp: 9, maxHp: 9, speed: 0, dmg: 50, spin: 0, flash: 0, hitCd: 0, wander: 0, alert: true }));
      return g.stats.time; });
    await pg.waitForTimeout(500);
    const d7 = await pg.evaluate(t => { const g = window.__lumen.game; return { ran: g.stats.time - t, home: Math.round(Math.hypot(g.player.x - g.nexus.x, g.player.y - g.nexus.y)) }; }, t0);
    check('death among several Glitches keeps the game running (B-007)', d7.ran > 0.2 && d7.home < 200, JSON.stringify(d7));
    // S-6: a Glitch boxed in by dense rock gives up (fades, no kill credit); one with a clear line keeps chasing. Stepped in-page, 8 s.
    const s6 = await pg.evaluate(() => {
      const g = window.__lumen.game, p = g.player, w = g.world, C = 32;
      p.x = g.nexus.x + 1200.5; p.y = g.nexus.y + 1216; p.integrity = 1e6; p.vx = p.vy = 0;
      const set = (cx, cy, t) => { w.cells[w.idx(cx, cy)] = t; w.damage[w.idx(cx, cy)] = 0; };
      const pcx = Math.floor(p.x / C), pcy = Math.floor(p.y / C);
      for (let y = -1; y <= 1; y++) for (let x = -10; x <= 1; x++) set(pcx + x, pcy + y, 0); // open corridor to the west (player invulnerable: hits would knock it toward the box)
      for (let y = -1; y <= 1; y++) for (let x = 8; x <= 10; x++) set(pcx + x, pcy + y, x === 9 && y === 0 ? 0 : 2); // dense box to the east
      const mk = cx => ({ x: (cx + 0.5) * C, y: (pcy + 0.5) * C, r: 11, vx: 0, vy: 0, tier: 0, hp: 99, maxHp: 99, speed: 120, dmg: 0, spin: 0, flash: 0, hitCd: 0, wander: 0, alert: false });
      const boxed = mk(pcx + 9), open = mk(pcx - 9);
      g.enemies = [boxed, open];
      const kills = g.stats.glitches, d0 = Math.hypot(open.x - p.x, open.y - p.y);
      for (let i = 0; i < 480; i++) { g.spawnTimer = 99; p.invuln = 9; g.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null }); }
      return { boxedGone: !g.enemies.includes(boxed), openHere: g.enemies.includes(open), d0: Math.round(d0),
        d1: Math.round(Math.hypot(open.x - p.x, open.y - p.y)), killsSame: g.stats.glitches === kills };
    });
    check('boxed-in Glitch gives up and frees its slot (S-6)', s6.boxedGone && s6.killsSame, JSON.stringify(s6));
    check('Glitch with a clear line keeps chasing (S-6)', s6.openHere && s6.d1 < s6.d0, JSON.stringify(s6));

    // Save / reload.
    const snap = await pg.evaluate(() => { dispatchEvent(new Event('pagehide')); const g = window.__lumen.game; return { mined: g.stats.mined, up: JSON.stringify(g.upgrades), nexus: g.nexusLevels.radiance }; });
    await pg.reload(); await pg.waitForTimeout(400);
    check('continue offered after reload', await pg.isVisible('#continue'));
    await pg.click('#continue'); await pg.waitForTimeout(200);
    const re = await pg.evaluate(() => { const g = window.__lumen.game; return { mined: g.stats.mined, up: JSON.stringify(g.upgrades), mode: g.mode, nexus: g.nexusLevels.radiance }; });
    check('save restores progress (incl. Radiance)', re.mined === snap.mined && re.up === snap.up && re.mode === 'surge' && re.nexus === 1 && snap.nexus === 1, JSON.stringify(re));

    // Old saves must load: a save written before format tracking has no `v`.
    // A format-1 save has no `nexus` either.
    await plantSaveAndReload(pg, s => { delete s.v; delete s.nexus; return s; });
    await pg.click('#continue'); await pg.waitForTimeout(200);
    const old = await pg.evaluate(() => ({ mined: window.__lumen.game.stats.mined, radiance: window.__lumen.game.nexusLevels.radiance }));
    check('unversioned (format 1) save still loads, Radiance 0', old.mined === snap.mined && old.radiance === 0, JSON.stringify(old));

    // A save this build can't read (newer format) must not be wiped without asking (D-005, B-004).
    await plantSaveAndReload(pg, () => ({ v: 99, seed: 5, mode: 'drift', bank: { shard: 1, prism: 1 } }));
    let asked = false; pg.once('dialog', d => { asked = true; d.dismiss(); });
    await pg.click('#new-world'); await pg.waitForTimeout(200);
    const kept = await pg.evaluate(() => JSON.parse(localStorage.getItem('lumencore.save.v1'))?.v);
    check('New World asks before replacing an unreadable save', asked && kept === 99, `asked ${asked}, v ${kept}`);

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
    // Before any touch: a phone must already get touch hints and no keyboard badge (B-002, S-2).
    const pre = await ph.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; return document.getElementById('hint').textContent; });
    await ph.waitForTimeout(150);
    const kbd = await ph.evaluate(() => { const k = document.querySelector('#matrix-btn kbd'); return !!k && k.getClientRects().length > 0; });
    check('phone shows touch hint + no E badge before first touch (B-002)', /thumb/i.test(pre) && !kbd, `hint "${pre}", E badge ${kbd ? 'shown' : 'hidden'}`);
    const cdp = await ctx.newCDPSession(ph);
    const vp = ph.viewportSize();
    const pts = dy => [{ x: 80, y: vp.height - 150 + dy, id: 1 }, { x: vp.width - 80, y: vp.height - 150 + dy, id: 2 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(0) });
    for (let i = 0; i < 30; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(50) }); await ph.waitForTimeout(100); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const t = await ph.evaluate(() => { const g = window.__lumen.game; return { mined: g.stats.mined, moved: Math.round(Math.hypot(g.player.x - g.nexus.x, g.player.y - g.nexus.y - 40)), beam: g.beam.on }; });
    check('touch stick moves the core', t.moved > 60, JSON.stringify(t));
    check('touch aim stick fires the beam', t.mined > 0 || t.beam, JSON.stringify(t));
    // Leaving the page mid-drag (no touchend ever arrives) must drop both sticks, like held keys (audit 9).
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(0) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(50) }); await ph.waitForTimeout(100);
    const held = await ph.evaluate(() => {
      const i = window.__lumen.input, before = !!(i.sticks.move && i.sticks.aim);
      dispatchEvent(new Event('blur'));
      const m = i.read({ x: 0, y: 0 }).move;
      return { before, after: !!(i.sticks.move || i.sticks.aim), move: Math.hypot(m.x, m.y) };
    });
    check('blur releases held touch sticks', held.before && !held.after && held.move === 0, JSON.stringify(held));
    await ctx.close();

    // Narrowest phone: Matrix tabs and buy buttons fit at 320 px (S-1).
    const np = await browser.newPage({ viewport: { width: 320, height: 568 } });
    await np.goto(url); await np.waitForTimeout(200);
    // Nothing on the title, HUD or Matrix may overflow its box at 320 px (B-001, S-2). The hint's ellipsis is deliberate.
    const overflow = () => np.evaluate(() => [...document.querySelectorAll('#hud *, #title *, #matrix *')]
      .filter(e => e.id !== 'hint' && e.getClientRects().length && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline')
      .map(e => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''} ${e.scrollWidth}>${e.clientWidth}`));
    const ovTitle = await overflow();
    await np.click('#new-world'); await np.waitForTimeout(200);
    await np.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; g.demo = true; });
    await np.keyboard.press('e'); await np.waitForTimeout(100);
    await np.click('#matrix .tabs button[data-tab="nexus"]');
    const clip = await np.evaluate(() => { const sh = document.querySelector('#matrix .sheet').getBoundingClientRect();
      return [...document.querySelectorAll('#matrix .tabs button, #matrix .buy, #matrix-close')].filter(e => { const r = e.getBoundingClientRect(); return r.left < sh.left || r.right > sh.right || e.scrollWidth > e.clientWidth; }).map(e => e.textContent); });
    check('Matrix tabs + buy fit at 320 px', clip.length === 0, clip.join(', '));
    const ov = [...ovTitle, ...await overflow()];
    check('nothing overflows at 320 px: title, HUD, Matrix (B-001)', ov.length === 0, ov.join(', '));
    await np.close();
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
