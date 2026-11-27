// S-15 throttled perf probe (not in smoke: ~2 min). Headless Chromium 1280×800 DSF 1, CPU throttled 4× over CDP, seed 77,
// dev.teleport(30), then real mining in Wide (mouse held, S held) with 300 floor pickups kept on screen. Reports frame time
// mean / p95 / max from requestAnimationFrame deltas, plus where draw time goes (renderer steps timed in the page).
// Runs: home (idle at the Nexus), base (idle 30 cells out, beam off, no pickups), loot (the S-15 scenario), holes (loot + 20 placed beacons, S-16's cap),
// surge (base in Surge, god mode, kept at GLITCH_CAP Glitches 250–750 px out: some on screen, some off; audit 39),
// far (base at d 100 of the 256 world New World now builds, S-46b2), kiln (base at d 110 with a Burrower kept alive and
// vents on, audit 114), shoal (base at d 92 with a mote swarm kept out, S-54).
// Headless Chromium paints the canvas in software, so the absolute numbers are far above a real GPU-backed browser's
// (audit 34: ~121 ms/frame at 4× with no loot). Read the ratios between runs and the per-step split, not the 16.7 ms budget.
// The step split counts only the JS that records canvas commands; the software raster runs later and lands on whatever
// reads the canvas next (drawLight's drawImage), which is why audit 34 saw drawLight at ~67 %. FLUSH=1 forces the raster
// inside each step (a 1-pixel getImageData before and after) for an honest split, at the cost of slower frames; SKIP
// prices a step by the frame time it frees (that step becomes a no-op).
// S-41: QUALITY=0|1|2 fixes the graphics level (default 0; Auto is off so the run measures one level).
// Audit 124: scan (base with the Scanner ring kept sweeping: a fresh ring every 0.7 s, the time it is on screen);
// VP=phone runs at 390×844 DSF 3 (the renderer caps dpr at 2 on L0) instead of 1280×800 DSF 1.
// Session 136: gyre (Surge, god mode, the core held 4 cells from the Shoal Gyre's core so it stays awake: whirlpool dashes,
// rim tell on, 2 tagged swarms kept out by zeroing its swarm clock). drawGyre runs inside drawGrid.
// S-72: deep (Surge, d 60, a 1-cell tunnel cross, no hunters) and hunt (deep + an Echo + 2 Tracers kept out): median ≤ 1.1×.
// Usage: [QUALITY=0] [SECONDS=20] [RATE=4] [VP=phone] [ONLY=home|base|…|gyre|deep|hunt (comma list)] [SKIP=drawLight,drawPickups] [FLUSH=1] node tools/perf.cjs
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SECONDS = +(process.env.SECONDS || 20), RATE = +(process.env.RATE || 4), ONLY = process.env.ONLY;
const FLUSH = process.env.FLUSH === '1';
const SKIP = (process.env.SKIP || '').split(',').filter(Boolean); // e.g. SKIP=drawLight: price a step by the frame time it frees
const server = require('../tests/serve.cjs').createServer(ROOT);

const VP = process.env.VP === 'phone' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 } : { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
const QUALITY = Math.max(0, Math.min(2, Number(process.env.QUALITY) || 0));
const STEPS = ['drawGrid', 'drawNexus', 'drawCrack', 'drawPickups', 'drawEnemies', 'drawBeam', 'drawPlayer', 'drawParticles', 'drawLight', 'drawScan'];

async function run(browser, url, name, { loot, holes, home, surge, far, kiln, shoal, scan, gyre, deep, hunt }) {
  const pg = await browser.newPage(VP);
  const errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.evaluate(() => { window.__rnd = Math.random; Math.random = () => 77.5 / 2 ** 31; }); // New World seed 77
  await pg.click('#new-world');
  await pg.evaluate(() => { Math.random = window.__rnd; });
  await pg.waitForTimeout(300);
  await pg.evaluate(({ loot, holes, home, surge, far, kiln, shoal, scan, gyre, deep, hunt, STEPS, SKIP, FLUSH, QUALITY }) => {
    const { game: g, renderer: R, dev, quality } = window.__lumen;
    quality.mode = 'fixed'; R.setQuality(QUALITY); // S-41: no Auto steps mid-run
    g.demo = true; dev.god(true); if (!home) dev.teleport(kiln ? 110 : shoal ? 92 : far ? 100 : deep || hunt ? 60 : 30); // S-72: deep / hunt = d 60 (Surge). S-46b2: far = d 100 (deep Shoal of a 256 world); kiln = d 110
    if (loot) { g.research.wide = true; g.beamMode = 'wide'; }
    if (surge || gyre || deep || hunt) g.mode = 'surge';
    if (deep || hunt) g.hunt.timer = 1e9; // S-72: no natural Tracers in either run; hunt keeps 2 out by hand (+ an Echo)
    if (deep || hunt) { const cx = Math.floor(g.player.x / 32), cy = Math.floor(g.player.y / 32); // a 1-cell cross of tunnels 26 cells each way (both runs): room for Tracers to spawn and walk
      for (let i = -26; i <= 26; i++) for (const [x, y] of [[cx + i, cy], [cx, cy + i]]) { const W = g.world; if (W.solid(x, y) && x > 2 && y > 2 && x < W.w - 3 && y < W.h - 3 && W.get(x, y) <= 3) W.destroy(x, y); } }
    if (hunt) dev.echo();
    const B = gyre && g.bosses.list.find(b => b.ring === 3), w = g.world;
    if (B) { for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) { const x = B.x + i, y = B.y + j; if (x > 2 && y > 2 && x < w.w - 3 && y < w.h - 3) w.explored[y * w.w + x] = 1; }
      window.__gyreB = B; }
    const hold = () => { if (B) Object.assign(g.player, { x: (B.x + 0.5) * 32, y: (B.y - 3.5) * 32, vx: 0, vy: 0 }); }; // 4 cells north: in the lair's open ring
    hold();
    // Per-step timing: wrap each renderer draw step (and the whole draw) with performance.now().
    const t = window.__perf = { frames: [], draw: [], steps: Object.fromEntries(STEPS.map(k => [k, 0])) };
    for (const k of STEPS) if (!SKIP.includes(k)) { const f = R[k]; R[k] = function (...a) { if (FLUSH) R.ctx.getImageData(0, 0, 1, 1); const s = performance.now(); const r = f.apply(this, a); if (FLUSH) R.ctx.getImageData(0, 0, 1, 1); t.steps[k] += performance.now() - s; return r; }; }
    for (const k of SKIP) R[k] = () => {};
    const draw = R.draw; R.draw = function (...a) { const s = performance.now(); draw.apply(this, a); t.draw.push(performance.now() - s); };
    // Keep 300 loot pickups on screen: top up each frame around the core (the Attractor keeps pulling some in).
    let k = 0;
    const fill = () => {
      while (surge && g.enemies.length < 9) { const a = k++ * 2.4, d = 250 + (k % 5) * 125; // GLITCH_CAP, tier 1, spread on and off screen
        g.enemies.push({ x: g.player.x + Math.cos(a) * d, y: g.player.y + Math.sin(a) * d, r: 11, vx: 0, vy: 0, tier: 1, hp: 3, maxHp: 3, speed: 90, dmg: 0, spin: 0, flash: 0, hitCd: 0.5, wander: a, alert: false }); }
      if (kiln && !g.burrow.b) g.burrow.timer = 0; // audit 114: a Burrower always digging, telling or up nearby
      if (scan && (!g.scan.ring || g.scan.age > 0.7)) g.scan = { cooldown: 99, age: 0, x: g.player.x, y: g.player.y, ring: true, marks: [], end: 999 }; // audit 124
      if (shoal && !g.swarm.motes.length) g.swarm.timer = 0; // S-54: a mote swarm always out (god mode: they keep coming back)
      if (hunt) { while (g.hunters.length < 2 && dev.tracer()); if (g.flow) window.__flowMs = g.flow.msMax; window.__huntMax = Math.max(window.__huntMax || 0, g.hunters.length); }
      if (B) { hold(); if (B.swarmT > 0.1) B.swarmT = 0.1; window.__gyreMax = Math.max(window.__gyreMax || 0, new Set(g.swarm.motes.filter(m => m.boss).map(m => m.grp)).size); }
      if (!loot) return;
      g.cargo.shard = g.cargo.prism = 0; // never cap out, so pickups keep flowing
      while (g.pickups.length < 300) { const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 260; g.spawnPickup(g.player.x + Math.cos(a) * d, g.player.y + Math.sin(a) * d * 0.6, 'shard', true); }
    };
    // S-16: 20 real beacons (BEACON_MAX) spread over and around the screen, 140 px each; R.extraLights is g.beacons, so each
    // costs its light hole and its glyph. Pushed straight in (no placement rules): the point is the draw cost.
    g.beacons.length = 0;
    for (let i = 0; i < holes; i++) { const x = g.player.x - 560 + (i % 5) * 280, y = g.player.y - 300 + Math.floor(i / 5) * 200;
      g.beacons.push({ i: Math.floor(y / 32) * g.world.w + Math.floor(x / 32), x, y, r: 140 }); }
    let last = performance.now();
    const tick = now => { t.frames.push(now - last); last = now; fill(); requestAnimationFrame(tick); };
    fill(); requestAnimationFrame(tick);
  }, { loot, holes, home, surge, far, kiln, shoal, scan, gyre, deep, hunt, STEPS, SKIP, FLUSH, QUALITY });
  const cdp = await pg.context().newCDPSession(pg);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  if (loot) { await pg.mouse.move(640, 790); await pg.mouse.down(); await pg.keyboard.down('s'); }
  await pg.evaluate(() => { const t = window.__perf; t.frames.length = 0; t.draw.length = 0; for (const k in t.steps) t.steps[k] = 0; });
  await pg.waitForTimeout(SECONDS * 1000);
  if (loot) { await pg.keyboard.up('s'); await pg.mouse.up(); }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const r = await pg.evaluate(() => {
    const t = window.__perf, g = window.__lumen.game, f = t.frames.slice(1).sort((a, b) => a - b), n = f.length;
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    return { n, mean: mean(f), med: f[Math.floor(n / 2)], hunt: window.__huntMax ? `hunters ≤ ${window.__huntMax}, field build ≤ ${window.__flowMs.toFixed(2)} ms, builds ${g.flow.builds}` : '', p95: f[Math.floor(n * 0.95)], max: f[n - 1], draw: mean(t.draw), drawN: t.draw.length,
      steps: t.steps, mined: g.stats.mined, pickups: g.pickups.length, lights: window.__lumen.renderer.extraLights.length,
      gyre: window.__gyreB ? `awake ${window.__gyreB.awake}, dashes ${window.__lumen.renderer.gyreDashes}, rim ${window.__lumen.renderer.gyreRim}, swarms ≤ ${window.__gyreMax}, motes ${g.swarm.motes.length}` : '' };
  });
  await pg.close();
  const total = r.draw * r.drawN, split = Object.entries(r.steps).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k.replace('draw', '')} ${(100 * v / total).toFixed(0)}%`).join(', ');
  console.log(`${name.padEnd(6)} frames ${r.n}  mean ${r.mean.toFixed(1)} ms  p95 ${r.p95.toFixed(1)}  max ${r.max.toFixed(1)}  ` +
    `draw ${r.draw.toFixed(1)} ms  | mined ${r.mined}, ${r.pickups} pickups, ${r.lights} extra lights${r.gyre ? ', gyre ' + r.gyre : ''}${r.hunt ? ', ' + r.hunt : ''}${errors.length ? '  ERRORS ' + errors.join('; ') : ''}`);
  console.log(`       draw split: ${split}`);
  return r;
}

(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  console.log(`S-15 perf: ${VP.viewport.width}×${VP.viewport.height} DSF ${VP.deviceScaleFactor}, L${QUALITY}, CPU ×${RATE}, seed 77, ${SECONDS} s per run${SKIP.length ? ', skipping ' + SKIP : ''}. Budget p95 ≤ 16.7 ms (see header: software canvas).`);
  const runs = { home: { loot: false, holes: 0, home: true }, base: { loot: false, holes: 0 }, loot: { loot: true, holes: 0 }, holes: { loot: true, holes: 20 }, surge: { loot: false, holes: 0, surge: true }, far: { loot: false, holes: 0, far: true }, kiln: { loot: false, holes: 0, kiln: true }, shoal: { loot: false, holes: 0, shoal: true } , scan: { loot: false, holes: 0, scan: true }, gyre: { loot: false, holes: 0, gyre: true }, deep: { loot: false, holes: 0, deep: true }, hunt: { loot: false, holes: 0, hunt: true } };
  const out = {};
  for (const [k, v] of Object.entries(runs)) if (!ONLY || ONLY.split(',').includes(k)) out[k] = await run(browser, url, k, v);
  if (out.base && out.loot) console.log(`loot / base mean frame: ${(out.loot.mean / out.base.mean).toFixed(2)}×`);
  if (out.base && out.scan) console.log(`scan / base mean frame: ${(out.scan.mean / out.base.mean).toFixed(2)}×`);
  if (out.base && out.surge) console.log(`surge / base mean frame: ${(out.surge.mean / out.base.mean).toFixed(2)}×`);
  if (out.base && out.far) console.log(`far / base mean frame: ${(out.far.mean / out.base.mean).toFixed(2)}×`);
  if (out.base && out.kiln) console.log(`kiln / base mean frame: ${(out.kiln.mean / out.base.mean).toFixed(2)}×`);
  if (out.base && out.shoal) console.log(`shoal / base mean frame: ${(out.shoal.mean / out.base.mean).toFixed(2)}×`);
  if (out.base && out.gyre) console.log(`gyre / base mean frame: ${(out.gyre.mean / out.base.mean).toFixed(2)}×`);
  if (out.shoal && out.gyre) console.log(`gyre / shoal mean frame: ${(out.gyre.mean / out.shoal.mean).toFixed(2)}×`);
  if (out.deep && out.hunt) console.log(`hunt / deep median frame: ${(out.hunt.med / out.deep.med).toFixed(2)}× (S-72 budget ≤ 1.1×)`);
  if (out.loot && out.holes) console.log(`holes / loot mean frame: ${(out.holes.mean / out.loot.mean).toFixed(2)}×`);
  await browser.close(); server.close();
})();
