// S-49 biome ore checks (D-134): Tide ≈ in the Shoal, Calx ⬟ in the Kiln. smoke.cjs calls nodeChecks + browserChecks.
// Node: 4 seeds' counts sit in the measured spread, all Tide in ring 3 and all Calx in ring 4, none in a 160 world; the
// terrain hash with the two re-types masked (and the Anomaly + vent sites) match pins taken from the code before S-49;
// fixed hp; mine one of each -> bank +1 at a deposit; a saved floor pickup of each round-trips; format 18 -> 19 loads
// both at 0; the Scanner marks them. Browser: the chips stay hidden until held; both glyphs drawn (ORE_SHOT=path.png).
// Usage: node tests/ore.cjs [--browser]
const { newWorld } = require('./pinworld.cjs');
const quiet = new Proxy({}, { get: () => () => {} });
// FNV-1a of world.cells with every Tide / Calx cell set to 255, and of the Anomaly + vent site lists, from the pre-S-49 code.
const PINS = { 4242: [521686979, 4024875518], 7: [3395619034, 3487137189], 99: [2299736302, 340502908], 31337: [3672187676, 703367365] };

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { World } = await import('../src/world.js');
  const { anomalySites } = await import('../src/anomaly.js');
  const { ventSites } = await import('../src/vent.js');
  const { upgradeSave, SAVE_FORMAT, STEPS } = await import('../src/save.js');
  const { tryScan } = await import('../src/research.js');
  const { CELL, T, TIDE_RING, CALX_RING, KINDS, MATERIAL } = await import('../src/config.js');
  const hash = a => { let h = 2166136261; for (let i = 0; i < a.length; i++) h = Math.imul(h ^ a[i], 16777619); return h >>> 0; };
  const find = (w, t) => { const i = w.cells.indexOf(t); return { x: i % w.w, y: Math.floor(i / w.w) }; };
  {
    const bad = [], counts = [];
    for (const seed of Object.keys(PINS).map(Number)) {
      const w = new World(seed, [], 256), masked = Uint8Array.from(w.cells);
      let tide = 0, calx = 0;
      w.cells.forEach((v, i) => {
        if (v === T.TIDE) { tide++; masked[i] = 255; if (w.rings[i] !== TIDE_RING) bad.push(`${seed}: Tide off the Shoal`); }
        if (v === T.CALX) { calx++; masked[i] = 255; if (w.rings[i] !== CALX_RING) bad.push(`${seed}: Calx off the Kiln`); }
      });
      counts.push(`${tide}≈ ${calx}⬟`);
      if (tide < 174 || tide > 359 || calx < 211 || calx > 477) bad.push(`${seed}: ${tide}≈ ${calx}⬟ outside the 40-seed spread`);
      const an = anomalySites(w), sites = hash(new TextEncoder().encode(JSON.stringify(an) + JSON.stringify(ventSites(w, an))));
      if (hash(masked) !== PINS[seed][0]) bad.push(`${seed}: masked terrain hash ${hash(masked)}`);
      if (sites !== PINS[seed][1]) bad.push(`${seed}: Anomaly / vent sites moved (${sites})`);
    }
    const small = [...new World(4242, [], 160).cells].filter(v => v === T.TIDE || v === T.CALX).length;
    check('S-49 ores: 4 seeds in the measured spread, Tide only in the Shoal, Calx only in the Kiln, none in a 160 world',
      bad.filter(b => !/hash|moved/.test(b)).length === 0 && small === 0, bad.join('; ') + ` (${counts.join(', ')})`);
    check('S-49 ores: the terrain with the re-types masked, the Anomaly sites and the vents match the pre-S-49 pins',
      bad.filter(b => /hash|moved/.test(b)).length === 0, bad.join('; '));
  }
  {
    const g = new Game({ seed: 4242, mode: 'drift', audio: quiet }), w = g.world, got = {};
    const t = find(w, T.TIDE), c = find(w, T.CALX);
    const hp = [w.hpAt(t.x, t.y, T.TIDE), w.hpAt(c.x, c.y, T.CALX)];
    for (const [q, type] of [[t, T.TIDE], [c, T.CALX]]) { const r = w.hit(q.x, q.y, 1e9); if (r && r.broken) g.onCellBroken(q.x, q.y, type); }
    const p = g.player; p.x = g.nexus.x; p.y = g.nexus.y;
    const kinds = g.pickups.map(q => q.kind).sort().join();
    for (const q of g.pickups) { q.x = p.x; q.y = p.y; q.vx = q.vy = 0; q.age = 9; }
    g.updatePickups(0.016);
    got.cargo = [g.cargo.tide, g.cargo.calx];
    for (let k = 0; k < 20 && g.cargoTotal() > 0; k++) g.updateDeposit(0.5);
    check('S-49 ores: fixed hp (Tide 3.0, Calx 4.2, no ring scaling); mining one of each banks +1 ≈ and +1 ⬟ at the Nexus',
      hp[0] === 3 && hp[1] === 4.2 && kinds === 'calx,tide' && got.cargo.join() === '1,1' && g.bank.tide === 1 && g.bank.calx === 1 && g.stats.tide === 1 && g.stats.calx === 1,
      JSON.stringify({ hp, kinds, ...got, bank: g.bank }));
    g.spawnPickup(500, 500, 'tide', true); g.spawnPickup(520, 500, 'calx', true);
    const s = upgradeSave(JSON.parse(JSON.stringify(g.toSave()))), g2 = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: s });
    const floor = g2.pickups.filter(q => q.kind === 'tide' || q.kind === 'calx').map(q => q.kind + q.kept).join();
    check('S-49 ores: KINDS appends tide (3) and calx (4); a saved floor pickup of each round-trips; the bank keeps both',
      KINDS.indexOf('tide') === 3 && KINDS.indexOf('calx') === 4 && floor === 'tidetrue,calxtrue' && g2.bank.tide === 1 && g2.bank.calx === 1, floor);
    const old = JSON.parse(JSON.stringify(g.toSave()));
    old.v = 18; delete old.bank.tide; delete old.bank.calx; delete old.cargo.tide; delete old.cargo.calx;
    const up = upgradeSave(old);
    check('S-49 ores: a format-18 save loads with Tide and Calx at 0 (format 19)',
      STEPS.length === SAVE_FORMAT - 1 && up && up.v === SAVE_FORMAT && up.bank.tide === 0 && up.cargo.calx === 0 && up.bank.shard === g.bank.shard, JSON.stringify(up && up.bank));
    const g3 = new Game({ seed: 4242, mode: 'drift', audio: quiet }), seen = [];
    g3.research.scanner = true;
    for (const q of [find(g3.world, T.TIDE), find(g3.world, T.CALX)]) {
      g3.scan.cooldown = 0; g3.player.x = (q.x + 0.5) * CELL; g3.player.y = (q.y + 0.5) * CELL;
      tryScan(g3); seen.push(g3.scan.marks.some(m => m.x === q.x && m.y === q.y && m.type === g3.world.get(q.x, q.y)));
    }
    check('S-49 ores: the Scanner marks Tide and Calx (ORE_KIND)', seen.join() === 'true,true' && MATERIAL[T.TIDE].yield.kind === 'tide', seen.join());
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('ore: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(300);
  const hidden = () => pg.evaluate(() => ['tide', 'calx'].map(k => document.getElementById('bank-' + k).parentElement.classList.contains('hidden')).join());
  const before = await hidden();
  const { CELL, T } = await import('../src/config.js');
  const drawn = await pg.evaluate(({ C, T }) => {
    const L = window.__lumen, g = L.game, w = g.world, i = w.cells.indexOf(T.TIDE), x = i % w.w, y = Math.floor(i / w.w);
    // A small showcase: open a 5×3 pocket left of a Tide cell, put a Calx cell beside it and a floor pickup of each.
    for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 6; xx < x; xx++) if (w.get(xx, yy) !== T.BEDROCK) w.destroy(xx, yy);
    w.cells[(y + 1) * w.w + x] = T.CALX; w.markDirty(x, y + 1);
    g.player.x = (x - 4.5) * C; g.player.y = (y + 0.5) * C; g.player.vx = g.player.vy = 0; g.god = true; g.undertow.off = true;
    L.renderer.cam.x = g.player.x; L.renderer.cam.y = g.player.y; w.reveal(g.player.x, g.player.y, 10 * C);
    g.spawnPickup((x - 2.5) * C, (y - 0.3) * C, 'tide', true); g.spawnPickup((x - 2.5) * C, (y + 1.2) * C, 'calx', true);
    for (const q of g.pickups) { q.vx = q.vy = 0; q.age = 0.01; }
    g.bank.tide = 3; g.bank.calx = 2;
    return true;
  }, { C: CELL, T });
  await pg.waitForTimeout(150);
  if (shot) await pg.screenshot({ path: shot });
  const after = await hidden(), text = await pg.evaluate(() => document.querySelector('.bank').textContent.replace(/\s+/g, ' ').trim());
  check('S-49 ores: the ≈ / ⬟ bank chips stay hidden until one is held, then show the count; the showcase draws',
    drawn && before === 'true,true' && after === 'false,false' && /≈ 3/.test(text) && /⬟ 2/.test(text), JSON.stringify({ before, after, text }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.ORE_SHOT, shot: process.env.ORE_SHOT });
