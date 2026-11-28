// S-65 Nexus rings checks (D-179). smoke.cjs calls nodeChecks and browserChecks. Node: one ring per Nexus structure built
// (0 -> 3, in build order, half a cell apart), a Lens on cooldown is dim and bright again when ready, a Nexus purchase plays
// the upgrade ring at the Nexus (not the core) and reduced motion skips it. Browser: the new draw strokes 3 hexagons with
// no shadowBlur, and the 0-structure Nexus draws exactly as many strokes as before.
// Usage: node tests/nexusview.cjs [--browser | --browser-only]   (NEXUS_SHOT=path.png for a screenshot)
const { newWorld } = require('./pinworld.cjs');
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { nexusRings } = await import('../src/nexusview.js');
  const { updateRift, callRift } = await import('../src/rift.js');
  const C = await import('../src/config.js');
  const g = new Game({ seed: 4242, mode: 'drift', audio: quiet, size: 256 }); updateRift(g);
  for (const k of C.KINDS) g.bank[k] = 9999;
  const counts = [nexusRings(g).length], flash = [], core = [];
  for (const id of ['radiance', 'chart', 'lens']) {
    g.nexusFlash = 0; g.coreRing = 0;
    const ok = g.buyNexus(id); flash.push(ok && g.nexusFlash === 1); core.push(g.coreRing === 0);
    counts.push(nexusRings(g).length);
  }
  const rs = nexusRings(g);
  check('S-65 Nexus rings: one per structure built (0 → 3), Radiance / Chart / Lens in order, half a cell apart, own hues',
    counts.join() === '0,1,2,3' && rs.map(r => r.id).join() === 'radiance,chart,lens' && rs.every((r, i) => r.r === C.NEXUS_RING_BASE + i * C.CELL / 2) &&
    rs[2].rgb === C.RIFT_RGB && new Set(rs.map(r => r.rgb)).size === 3, JSON.stringify({ counts, rs }));
  g.buyNexus('radiance'); const again = nexusRings(g).length;
  check('S-65 Nexus rings: a second Radiance level adds no ring', again === 3, String(again));
  check('S-65 Nexus rings: a Nexus purchase plays the upgrade ring at the Nexus, never at the core', flash.every(Boolean) && core.every(Boolean), JSON.stringify({ flash, core }));
  // Lens cooldown: call a rift from outside the Nexus ring, then step game time past the cooldown.
  Object.assign(g.player, { x: (Math.floor(g.world.cx) + 14.5) * C.CELL, y: (Math.floor(g.world.cy) + 0.5) * C.CELL }); g.stats.time = 30;
  const before = nexusRings(g)[2].a, called = callRift(g) === '', dim = nexusRings(g)[2].a;
  g.stats.time += C.RIFT_CALL_CD; const after = nexusRings(g)[2].a;
  check('S-65 Nexus rings: the Lens ring dims while the call is on cooldown and is bright again when ready',
    called && before === C.NEXUS_RING_ALPHA && dim === C.NEXUS_RING_DIM && after === C.NEXUS_RING_ALPHA, JSON.stringify({ called, before, dim, after }));
  const h = new Game({ seed: 4242, mode: 'drift', audio: quiet, size: 256, settings: { reducedMotion: true } });
  h.bank.prism = 999; h.motionOn = () => false; h.buyNexus('lens');
  check('S-65 Nexus rings: reduced motion skips the Nexus upgrade ring (the ring itself still shows)', h.nexusFlash === 0 && nexusRings(h).length === 1, String(h.nexusFlash));
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('nexusview: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const { game: g, renderer: R } = window.__lumen, P = CanvasRenderingContext2D.prototype, ctx = R.ctx;
    g.demo = true;
    const n = g.nexus; R.cam.x = n.x; R.cam.y = n.y; g.shake = 0;
    const vw = R.w / R.zoom, vh = R.h / R.zoom, view = [n.x - vw / 2, n.y - vh / 2, vw, vh];
    const st = P.stroke; let strokes = 0, blurred = 0;
    P.stroke = function (...a) { if (this === ctx) { strokes++; if (this.shadowBlur > 0) blurred++; } return st.apply(this, a); };
    const run = () => { strokes = 0; blurred = 0; R.drawNexus(ctx, ...view); return { strokes, blurred }; };
    const none = run();
    g.nexusLevels.radiance = 1; g.nexusLevels.chart = 1; g.nexusLevels.lens = 1; g.nexusLevels.lure = 1;
    const all = run();
    P.stroke = st;
    return { none, all };
  });
  check('S-65 Nexus rings: the draw adds 4 hexagon strokes for 4 structures (S-77b2: Lure), none blurred',
    r.all.strokes - r.none.strokes === 4 && r.all.blurred === r.none.blurred, JSON.stringify(r));
  if (shot) {
    await pg.evaluate(() => { const { game: g } = window.__lumen; g.player.x = g.nexus.x + 120; g.player.y = g.nexus.y + 60; });
    await pg.waitForTimeout(400); await pg.screenshot({ path: shot });
  }
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks: process.argv.includes('--browser-only') ? null : nodeChecks, browserChecks,
  browser: process.argv.includes('--browser') || process.argv.includes('--browser-only') || !!process.env.NEXUS_SHOT, shot: process.env.NEXUS_SHOT });
