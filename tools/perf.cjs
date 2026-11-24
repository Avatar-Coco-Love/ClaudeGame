// S-15 throttled perf probe (not in smoke: ~2 min). Headless Chromium 1280×800 DSF 1, CPU throttled 4× over CDP, seed 77,
// dev.teleport(30), then real mining in Wide (mouse held, S held) with 300 floor pickups kept on screen. Reports frame time
// mean / p95 / max from requestAnimationFrame deltas, plus where draw time goes (renderer steps timed in the page).
// Runs: home (idle at the Nexus), base (idle 30 cells out, beam off, no pickups), loot (the S-15 scenario), holes (loot + 20 extra light holes = S-16's beacon budget).
// Headless Chromium paints the canvas in software, so the absolute numbers are far above a real GPU-backed browser's
// (audit 34: ~121 ms/frame at 4× with no loot). Read the ratios between runs and the per-step split, not the 16.7 ms budget.
// The step split counts only the JS that records canvas commands; the software raster runs later and lands on whatever
// reads the canvas next (drawLight's drawImage), which is why audit 34 saw drawLight at ~67 %. FLUSH=1 forces the raster
// inside each step (a 1-pixel getImageData before and after) for an honest split, at the cost of slower frames; SKIP
// prices a step by the frame time it frees (that step becomes a no-op).
// Usage: [SECONDS=20] [RATE=4] [ONLY=home|base|loot|holes] [SKIP=drawLight,drawPickups] [FLUSH=1] node tools/perf.cjs
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SECONDS = +(process.env.SECONDS || 20), RATE = +(process.env.RATE || 4), ONLY = process.env.ONLY;
const FLUSH = process.env.FLUSH === '1';
const SKIP = (process.env.SKIP || '').split(',').filter(Boolean); // e.g. SKIP=drawLight: price a step by the frame time it frees
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

const STEPS = ['drawGrid', 'drawNexus', 'drawCrack', 'drawPickups', 'drawEnemies', 'drawBeam', 'drawPlayer', 'drawParticles', 'drawLight', 'drawScan'];

async function run(browser, url, name, { loot, holes, home }) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.evaluate(() => { window.__rnd = Math.random; Math.random = () => 77.5 / 2 ** 31; }); // New World seed 77
  await pg.click('#new-world');
  await pg.evaluate(() => { Math.random = window.__rnd; });
  await pg.waitForTimeout(300);
  await pg.evaluate(({ loot, holes, home, STEPS, SKIP, FLUSH }) => {
    const { game: g, renderer: R, dev } = window.__lumen;
    g.demo = true; dev.god(true); if (!home) dev.teleport(30);
    if (loot) { g.research.wide = true; g.beamMode = 'wide'; }
    // Per-step timing: wrap each renderer draw step (and the whole draw) with performance.now().
    const t = window.__perf = { frames: [], draw: [], steps: Object.fromEntries(STEPS.map(k => [k, 0])) };
    for (const k of STEPS) if (!SKIP.includes(k)) { const f = R[k]; R[k] = function (...a) { if (FLUSH) R.ctx.getImageData(0, 0, 1, 1); const s = performance.now(); const r = f.apply(this, a); if (FLUSH) R.ctx.getImageData(0, 0, 1, 1); t.steps[k] += performance.now() - s; return r; }; }
    for (const k of SKIP) R[k] = () => {};
    const draw = R.draw; R.draw = function (...a) { const s = performance.now(); draw.apply(this, a); t.draw.push(performance.now() - s); };
    // Keep 300 loot pickups on screen: top up each frame around the core (the Attractor keeps pulling some in).
    const fill = () => {
      if (!loot) return;
      g.cargo.shard = g.cargo.prism = 0; // never cap out, so pickups keep flowing
      while (g.pickups.length < 300) { const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 260; g.spawnPickup(g.player.x + Math.cos(a) * d, g.player.y + Math.sin(a) * d * 0.6, 'shard', true); }
    };
    // Extra holes stand where S-16 beacons would: 20 spread over and around the screen, 140 px each (BEACON_LIGHT).
    R.extraLights = [];
    for (let i = 0; i < holes; i++) R.extraLights.push({ x: g.player.x - 560 + (i % 5) * 280, y: g.player.y - 300 + Math.floor(i / 5) * 200, r: 140 });
    let last = performance.now();
    const tick = now => { t.frames.push(now - last); last = now; fill(); requestAnimationFrame(tick); };
    fill(); requestAnimationFrame(tick);
  }, { loot, holes, home, STEPS, SKIP, FLUSH });
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
    return { n, mean: mean(f), p95: f[Math.floor(n * 0.95)], max: f[n - 1], draw: mean(t.draw), drawN: t.draw.length,
      steps: t.steps, mined: g.stats.mined, pickups: g.pickups.length, lights: window.__lumen.renderer.extraLights.length };
  });
  await pg.close();
  const total = r.draw * r.drawN, split = Object.entries(r.steps).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k.replace('draw', '')} ${(100 * v / total).toFixed(0)}%`).join(', ');
  console.log(`${name.padEnd(6)} frames ${r.n}  mean ${r.mean.toFixed(1)} ms  p95 ${r.p95.toFixed(1)}  max ${r.max.toFixed(1)}  ` +
    `draw ${r.draw.toFixed(1)} ms  | mined ${r.mined}, ${r.pickups} pickups, ${r.lights} extra lights${errors.length ? '  ERRORS ' + errors.join('; ') : ''}`);
  console.log(`       draw split: ${split}`);
  return r;
}

(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  console.log(`S-15 perf: 1280×800 DSF 1, CPU ×${RATE}, seed 77, ${SECONDS} s per run${SKIP.length ? ', skipping ' + SKIP : ''}. Budget p95 ≤ 16.7 ms (see header: software canvas).`);
  const runs = { home: { loot: false, holes: 0, home: true }, base: { loot: false, holes: 0 }, loot: { loot: true, holes: 0 }, holes: { loot: true, holes: 20 } };
  const out = {};
  for (const [k, v] of Object.entries(runs)) if (!ONLY || ONLY === k) out[k] = await run(browser, url, k, v);
  if (out.base && out.loot) console.log(`loot / base mean frame: ${(out.loot.mean / out.base.mean).toFixed(2)}×`);
  if (out.loot && out.holes) console.log(`holes / loot mean frame: ${(out.holes.mean / out.loot.mean).toFixed(2)}×`);
  await browser.close(); server.close();
})();
