// S-15 draw-cost checks, run by smoke.cjs. Headless Chromium paints the canvas in software, so absolute frame times mean
// little there (tools/perf.cjs prices the real loop under a 4× CPU throttle). These checks are either exact (draw calls
// counted) or relative: one scene's draw time against another's in the same page, medians of interleaved samples, with
// a ~2× margin. Each frame is flushed (a 1-pixel getImageData) so the software raster is inside the timing.
async function browserChecks(browser, url, check, errors) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('drawcost: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);

  const r = await pg.evaluate(() => {
    const { game: g, renderer: R, input, dev } = window.__lumen, P = CanvasRenderingContext2D.prototype;
    g.demo = true; // never saved
    window.requestAnimationFrame = () => 0; // stop the loop: every frame below is drawn by hand
    const n = g.nexus, home = { x: n.x, y: n.y };
    dev.teleport(30); const away = { x: g.player.x, y: g.player.y };
    const ctx = R.ctx, flush = () => ctx.getImageData(0, 0, 1, 1);
    const at = c => { R.cam.x = c.x; R.cam.y = c.y; g.shake = 0; };

    // Exact: draw calls per canvas while one step runs.
    const ops = ['fill', 'stroke', 'fillText', 'fillRect', 'strokeRect', 'drawImage'], orig = {}, cnt = new Map();
    for (const k of ops) { orig[k] = P[k]; P[k] = function (...a) { cnt.set(this, (cnt.get(this) || 0) + 1); return orig[k].apply(this, a); }; }
    const count = (c, fn) => { cnt.clear(); fn(); return cnt.get(c) || 0; };
    const vw = R.w / R.zoom, vh = R.h / R.zoom, view = c => [c.x - vw / 2, c.y - vh / 2, vw, vh];
    at(away); const nexusOff = count(ctx, () => R.drawNexus(ctx, ...view(away)));
    at(home); const nexusOn = count(ctx, () => R.drawNexus(ctx, ...view(home)));
    at(away);
    const ring = (k, d) => Array.from({ length: k }, (_, i) => ({ x: away.x + Math.cos(i) * d, y: away.y + Math.sin(i) * d, r: 140 }));
    R.extraLights = ring(20, 3000); const holesOff = count(R.lctx, () => R.drawLight(ctx));
    R.extraLights = ring(20, 200); const holesOn = count(R.lctx, () => R.drawLight(ctx));
    // S-26: a second light set lights like the first (relays, lit Spires), and a warm frame builds no hole gradients
    // (cached hole sprites per radius, audit 44 T3).
    R.extraLights = []; R.lightSets = [ring(10, 200), ring(10, 200).map(e => ({ ...e, x: e.x + 1 }))]; const holesTwoSets = count(R.lctx, () => R.drawLight(ctx));
    const mkGrad = P.createRadialGradient; let grads = 0;
    P.createRadialGradient = function (...a) { if (this === R.lctx) grads++; return mkGrad.apply(this, a); };
    R.drawLight(ctx); grads = 0; R.drawLight(ctx); P.createRadialGradient = mkGrad;
    R.lightSets = [g.beacons]; R.extraLights = [];
    // B-084 (audit 94): the floor-glow layer is blitted unsmoothed (its smoothed 4× upscale was ~45 % of a 20-pool frame).
    R.extraLights = ring(20, 200); const glowBlit = { n: 0, smooth: 0 }, di = P.drawImage;
    P.drawImage = function (src, ...a) { if (this === ctx && src === R.glowLayer) { glowBlit.n++; if (this.imageSmoothingEnabled) glowBlit.smooth++; } return di.call(this, src, ...a); };
    at(away); R.draw(0, input); P.drawImage = di; R.extraLights = [];
    // Audit 39 (T3): 9 Glitches (GLITCH_CAP) off screen cost no draws; on screen none draws with shadowBlur (sprites, D-051).
    const foes = d => Array.from({ length: 9 }, (_, i) => ({ x: away.x + Math.cos(i) * d, y: away.y + Math.sin(i) * d, r: 11, tier: i % 4,
      hp: 1, maxHp: 1, spin: i, flash: i === 0 ? 0.1 : 0, wander: i, fade: i === 1 ? 0.3 : undefined }));
    const glitchDraws = d => { g.enemies = foes(d); const n = count(ctx, () => { R.drawEnemies(ctx, false); R.drawEnemies(ctx, true); }); return n; };
    let blurred = 0;
    const blurOps = ['fill', 'stroke', 'drawImage'].map(k => [k, P[k]]);
    const enemiesOff = glitchDraws(4000), enemiesOn = glitchDraws(300);
    for (const [k, f] of blurOps) P[k] = function (...a) { if (this === ctx && this.shadowBlur > 0) blurred++; return f.apply(this, a); };
    g.enemies = foes(300); R.drawEnemies(ctx, false); R.drawEnemies(ctx, true);
    for (const [k, f] of blurOps) P[k] = f;
    g.enemies = [];
    for (const k of ops) P[k] = orig[k];
    // Audit 74: 300 on-screen pickups → 300 drawImage and no per-pickup save / rotate (spin baked into sprite frames).
    g.pickups.length = 0;
    for (let i = 0; i < 300; i++) g.pickups.push({ x: away.x - 450 + (i % 30) * 30, y: away.y - 150 + Math.floor(i / 30) * 30, vx: 0, vy: 0, kind: ['shard', 'prism', 'lumen'][i % 3], age: 1, r: 4, kept: true });
    const pk = { save: 0, rotate: 0, drawImage: 0 }, pkOrig = Object.fromEntries(Object.keys(pk).map(k => [k, P[k]]));
    for (const k in pk) P[k] = function (...a) { if (this === ctx) pk[k]++; return pkOrig[k].apply(this, a); };
    R.time = 1.234; R.drawPickups(ctx, ...view(away));
    for (const k in pk) P[k] = pkOrig[k];
    g.pickups.length = 0;

    // Relative: median flushed draw time per scene, scenes interleaved so drift hits all alike.
    const time = fn => { const s = performance.now(); fn(); flush(); return performance.now() - s; };
    const median = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
    const frame = () => R.draw(0, input);
    const loot = (on, holes) => {
      g.pickups.length = 0; R.extraLights = holes ? ring(20, 220) : [];
      if (on) for (let i = 0; i < 300; i++) g.pickups.push({ x: away.x - 450 + (i % 30) * 30, y: away.y - 150 + Math.floor(i / 30) * 30, vx: 0, vy: 0, kind: ['shard', 'prism', 'lumen'][i % 3], age: 1, r: 4, kept: true });
    };
    const scenes = {
      away: () => { at(away); loot(false); frame(); },
      loot: () => { at(away); loot(true); frame(); },
      holes: () => { at(away); loot(false, true); frame(); },
      home: () => { at(home); loot(false); frame(); },
      nexus: () => { at(home); ctx.save(); ctx.translate(R.w / 2, R.h / 2); ctx.scale(R.zoom, R.zoom); ctx.translate(-home.x, -home.y); R.drawNexus(ctx, ...view(home)); ctx.restore(); },
    };
    const t = Object.fromEntries(Object.keys(scenes).map(k => [k, []]));
    for (const k in scenes) scenes[k](); flush(); // warm up (chunk cache, sprites)
    for (let i = 0; i < 9; i++) for (const k in scenes) t[k].push(time(scenes[k]));
    loot(false);
    const m = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, +median(v).toFixed(2)]));
    return { glowBlit, nexusOff, nexusOn, holesOff, holesOn, holesTwoSets, grads, enemiesOff, enemiesOn, blurred, pk, m };
  });
  check('an off-screen Nexus issues no draws; on screen it draws (S-15)', r.nexusOff === 0 && r.nexusOn > 3, `${r.nexusOff} / ${r.nexusOn}`);
  check('9 off-screen Glitches issue no draws; on screen they draw (audit 39)', r.enemiesOff === 0 && r.enemiesOn >= 9, `${r.enemiesOff} / ${r.enemiesOn}`);
  check('300 on-screen pickups: 300 drawImage, ≤ 1 save, no rotate (spin baked into sprite frames, audit 74)',
    r.pk.drawImage === 300 && r.pk.save <= 1 && r.pk.rotate === 0, JSON.stringify(r.pk));
  check('on-screen Glitch bodies and eyes draw with no shadowBlur (glow sprites, audit 39, D-051)', r.blurred === 0, `${r.blurred} blurred draws`);
  check('off-screen light holes issue no fills (S-15)', r.holesOn - r.holesOff >= 15, `light-canvas draws: 20 off ${r.holesOff}, 20 on ${r.holesOn}`);
  check('two light sets of 10 cut as many holes as one set of 20 (R.lightSets, S-26)', r.holesTwoSets === r.holesOn, `${r.holesTwoSets} / ${r.holesOn}`);
  check('the floor-glow layer is blitted once per frame, unsmoothed (B-084, audit 94)', r.glowBlit.n === 1 && r.glowBlit.smooth === 0, JSON.stringify(r.glowBlit));
  check('a warm frame with 20 light holes builds no gradients (cached hole sprites, S-26)', r.grads === 0, `${r.grads} gradients`);
  // Measured session 38 (09): 300 pickups ≈ 2.1× an empty frame (pre-B-027 shadowBlur pickups: 112×), 20 holes ≈ 1.3×,
  // the Nexus glow ≈ 16 % of a frame at home (unclipped, as in v0.2.41: 57 %).
  const lootX = r.m.loot / r.m.away, holesX = r.m.holes / r.m.away, nexusShare = r.m.nexus / r.m.home;
  check('300 on-screen pickups draw ≤ 4× an empty frame (S-15, relative)', lootX <= 4, `${lootX.toFixed(2)}× (${JSON.stringify(r.m)} ms)`);
  check('20 on-screen light holes draw ≤ 2× an empty frame (S-15, relative)', holesX <= 2, `${holesX.toFixed(2)}×`);
  check('the Nexus glow is ≤ 35 % of a frame drawn at home (S-15, relative)', nexusShare <= 0.35, `${(100 * nexusShare).toFixed(0)} %`);
  await pg.close();
}

module.exports = { browserChecks };
