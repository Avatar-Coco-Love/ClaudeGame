// S-48b Kiln flare vent checks (D-129, vent.js). smoke.cjs calls nodeChecks + browserChecks. Node: same seed -> same sites,
// gaps ≥ 6, all in Kiln, none on a vault / Spire / Anomaly footprint or the border, ~1 per 250 Kiln cells, none in a 160
// world; the terrain is unchanged; a flare shoves equally in Drift and Surge, never changes integrity or cargo, adds
// +0.4 heat (and can overheat), once per flare; a core outside 2.5 cells is untouched; only sites round the core are
// stepped; nothing saved. Browser: a tell and a flare are drawn. Usage: node tests/vent.cjs [--browser]   (VENT_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { World } = await import('../src/world.js');
  const { ventSites, ventPhase } = await import('../src/vent.js');
  const { chooseSpires, SPIRE_HALF } = await import('../src/spire.js');
  const { vaultSites } = await import('../src/world.js');
  const { CELL, T, KILN_RING, VAULT_HALF, HURT_KNOCKBACK, VENT_GAP, VENT_PER_CELLS, VENT_PERIOD_S, VENT_FLARE_S, VENT_HEAT, VENT_R, VENT_TELL_S } = await import('../src/config.js');
  const make = (mode = 'drift', seed = 4242) => { const g = new Game({ seed, mode, audio: quiet }); g.undertow.off = true; return g; };
  const hash = a => { let h = 2166136261; for (let i = 0; i < a.length; i++) h = Math.imul(h ^ a[i], 16777619); return h >>> 0; };

  {
    const bad = [];
    for (const seed of [4242, 7, 99, 31337]) {
      const g = make('drift', seed), w = g.world, s = g.vents.sites, s2 = make('drift', seed).vents.sites;
      let kiln = 0; for (let i = 0; i < w.w * w.h; i++) if (w.rings[i] === KILN_RING) kiln++;
      if (JSON.stringify(s.map(q => [q.x, q.y, q.phase])) !== JSON.stringify(s2.map(q => [q.x, q.y, q.phase]))) bad.push(`${seed}: not deterministic`);
      if (Math.abs(s.length - kiln / VENT_PER_CELLS) > 1) bad.push(`${seed}: ${s.length} sites for ${kiln} Kiln cells`);
      const blocks = [...vaultSites(seed, w.w, w.h).map(v => ({ ...v, r: VAULT_HALF })), ...chooseSpires(seed, null, null, w.w, w.h).map(q => ({ ...q, r: SPIRE_HALF })),
        ...g.spires.map(q => ({ ...q, r: SPIRE_HALF })), ...g.anomaly.sites.map(a => ({ ...a, r: 0 }))];
      s.forEach((q, i) => {
        if (w.ring(q.x, q.y) !== KILN_RING) bad.push(`${seed}: #${i} not Kiln`);
        if (q.x < 1 || q.y < 1 || q.x > w.w - 2 || q.y > w.h - 2) bad.push(`${seed}: #${i} on the border`);
        if (blocks.some(b => Math.max(Math.abs(b.x - q.x), Math.abs(b.y - q.y)) <= b.r)) bad.push(`${seed}: #${i} on a footprint`);
        for (let j = 0; j < i; j++) if (Math.hypot(s[j].x - q.x, s[j].y - q.y) < VENT_GAP) bad.push(`${seed}: #${j}-#${i} gap`);
        if (!(q.phase >= 0 && q.phase < VENT_PERIOD_S)) bad.push(`${seed}: #${i} phase`);
      });
    }
    const small = new World(4242, [], 160);
    check('S-48b vents: same seed -> same sites, ~1 per 250 Kiln cells, gaps ≥ 6, all Kiln, off every footprint and the border; none in a 160 world',
      bad.length === 0 && ventSites(small).length === 0, bad.slice(0, 4).join('; ') + ` (${make().vents.sites.length} sites, seed 4242)`);
  }
  {
    const w = new World(4242, [], 256), h0 = hash(w.cells); ventSites(w, []);
    const g = make(), h1 = hash(g.world.cells), o = make(); o.vents.sites.length = 0; o.vents.buckets.clear();
    const still = { move: { x: 0, y: 0 }, fire: false, aim: null };
    const q = g.vents.sites[0]; g.player.x = (q.x + 0.5) * CELL; g.player.y = (q.y + 0.5) * CELL;
    for (let k = 0; k < 600; k++) { g.update(1 / 60, still); g.events.length = 0; }
    check('S-48b vents: the terrain hash of a 256 world is unchanged by the feature (sites, the Game build, 10 s of flares)',
      hash(w.cells) === h0 && h1 === hash(o.world.cells) && hash(g.world.cells) === h1, `${h0} ${h1}`);
  }
  /** Opens a 9×9 room round site 0, puts the core `off` cells east of it with the flare 1/120 s away; returns the game. */
  const atFlare = (mode, off, heat = 0) => {
    const g = make(mode), w = g.world, s = g.vents.sites[0];
    for (let y = s.y - 4; y <= s.y + 4; y++) for (let x = s.x - 4; x <= s.x + 4; x++) w.cells[y * w.w + x] = T.EMPTY;
    const p = g.player; p.x = (s.x + 0.5 + off) * CELL; p.y = (s.y + 0.5) * CELL; p.vx = p.vy = 0;
    g.cargo.shard = 3; g.heat = heat; g.enemies.length = 0; g.spawnTimer = 99;
    const n = Math.ceil((g.stats.time + s.phase) / VENT_PERIOD_S) + 1;
    g.stats.time = n * VENT_PERIOD_S - VENT_FLARE_S - s.phase - 1 / 120;
    return { g, s };
  };
  const step = (g, k = 1) => { const out = []; for (let i = 0; i < k; i++) { g.enemies.length = 0; g.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null }); g.events.length = 0; out.push({ vx: g.player.vx, heat: g.heat }); } return out; };
  {
    const r = {};
    for (const mode of ['drift', 'surge']) {
      const { g } = atFlare(mode, 1.5), hull = g.player.integrity, log = step(g, 30);
      r[mode] = { vx: log[0].vx, heat: log[0].heat, integrity: g.player.integrity === hull, cargo: g.cargo.shard === 3, kicks: log.filter((e, i) => i && e.vx > log[i - 1].vx + 1).length };
    }
    check('S-48b vents: a flare shoves the core straight out at HURT_KNOCKBACK, equal in Drift and Surge, once per flare; integrity and cargo unchanged; +0.4 heat',
      JSON.stringify(r.drift) === JSON.stringify(r.surge) && Math.abs(r.drift.vx - HURT_KNOCKBACK) < 1 && Math.abs(r.drift.heat - VENT_HEAT) < 1e-9 && r.drift.integrity && r.drift.cargo && r.drift.kicks === 0,
      JSON.stringify(r));
  }
  {
    const { g } = atFlare('drift', 0.2, 0.7); step(g);
    const o = atFlare('drift', VENT_R + 0.1).g, log = step(o, 40);
    check('S-48b vents: +0.4 heat can trigger an overheat; a core outside 2.5 cells is untouched',
      g.heatState.over > 0 && log.every(e => e.vx === 0 && e.heat === 0), JSON.stringify({ over: g.heatState.over, outside: log[0] }));
  }
  { // audit 109: a vent within VENT_HEAR_R cells sounds its tell once per cycle; farther: silent; modes equal
    const tells = (mode, off, k = 9 * 60) => {
      const { g, s } = atFlare(mode, off);
      g.stats.time -= VENT_TELL_S + 0.1;
      for (let i = 0; i < k; i++) { g.player.x = (s.x + 0.5 + off) * CELL; g.player.y = (s.y + 0.5) * CELL; g.player.vx = g.player.vy = 0; step(g); }
      return g.vents.tells;
    };
    const r = { drift: tells('drift', 4), surge: tells('surge', 4), one: tells('drift', 4, 90), far: tells('drift', 5.6) };
    check('audit 109 vents: a vent ≤ 5 cells away sounds its tell once per cycle (equal in Drift and Surge); 5.6 cells away: silent',
      r.drift === 2 && r.surge === 2 && r.one === 1 && r.far === 0, JSON.stringify(r));
  }
  {
    const { g } = atFlare('drift', 1.5); step(g);
    const v = g.vents, fired = v.sites.filter(s => s.fired >= 0).length, ph = ventPhase(v.sites[0], g.stats.time);
    check('S-48b vents: only sites round the core are stepped (bucketed by chunk)', v.stepped >= 1 && v.stepped <= 12 && fired === 1 && ph.flare > 0,
      JSON.stringify({ stepped: v.stepped, of: v.sites.length, fired }));
    const keys = x => JSON.stringify(Object.keys(x.toSave()));
    check('S-48b vents: nothing saved (toSave keys unchanged, no vent field)', keys(g) === keys(make()) && !/vent/i.test(JSON.stringify(g.toSave())));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('vent: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  const { CELL } = await import('../src/config.js');
  await pg.evaluate(C => {
    const L = window.__lumen, g = L.game, w = g.world, s = g.vents.sites[0];
    for (let y = s.y - 5; y <= s.y + 5; y++) for (let x = s.x - 5; x <= s.x + 5; x++) if (w.solid(x, y) && w.get(x, y) !== 0) w.destroy(x, y);
    g.player.x = (s.x + 4.5) * C; g.player.y = (s.y + 0.5) * C; g.player.vx = g.player.vy = 0;
    L.renderer.cam.x = g.player.x; L.renderer.cam.y = g.player.y;
    w.reveal(g.player.x, g.player.y, 10 * C); g.pickups.length = 0; g.god = true; g.undertow.off = true;
    let arcs = 0; const ctx = L.renderer.ctx, arc = ctx.arc.bind(ctx);
    ctx.arc = (x, y, rad, ...rest) => { if (x === (s.x + 0.5) * C && y === (s.y + 0.5) * C) arcs++; return arc(x, y, rad, ...rest); };
    window.__ventArcs = () => arcs;
  }, CELL);
  const at = u => pg.evaluate(u => { const g = window.__lumen.game, s = g.vents.sites[0]; g.stats.time = 80 - s.phase + u; }, u);
  await at(6.9); await pg.waitForTimeout(60);
  const tellShot = shot ? shot.replace(/\.png$/, '-tell.png') : null;
  if (tellShot) await pg.screenshot({ path: tellShot });
  const a0 = await pg.evaluate(() => window.__ventArcs());
  await at(7.45); await pg.waitForTimeout(60);
  if (shot) await pg.screenshot({ path: shot });
  const a1 = await pg.evaluate(() => window.__ventArcs());
  check('S-48b vents: a vent is drawn in view, its flare disc only during the flare', a0 === 0 && a1 > 0, JSON.stringify({ tell: a0, flare: a1 }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.VENT_SHOT, shot: process.env.VENT_SHOT });
