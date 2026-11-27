// S-60a Crucible checks (D-158, boss.js). smoke.cjs calls nodeChecks + browserChecks. Node: the lair site rules on 30 seeds
// (all in the Kiln, clear of vaults / vents / Anomalies / Spires) and nothing else moves; only the lit plate takes damage,
// the glow moves (i + 5) mod 8; the core is immune until the 8th plate; the loot bursts once; Drift = Surge; the flare
// shoves + heats within 3 cells only; a mode switch keeps the fight; an old 256 save gets the lair (refund, core moved),
// a 160 save none; a reload mid-fight restores the plates, a downed boss stays down. Probe: a mid build (beam 5, range 3)
// takes it apart in ≤ 90 s. Browser: the core and lit plate are drawn; the lit plate's break passes the glow (B-095). Usage: node tests/boss.cjs [--browser] (BOSS_SHOT=path.png)
const { newWorld } = require('./pinworld.cjs');
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { World, vaultSites } = await import('../src/world.js');
  const { chooseSpires, stampSpires, SPIRE_HALF } = await import('../src/spire.js');
  const { anomalySites } = await import('../src/anomaly.js');
  const { ventSites } = await import('../src/vent.js');
  const { lairSite, PLATES, nextPlate, platesLeft, clearBosses } = await import('../src/boss.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const C = await import('../src/config.js');
  const { CELL, T, KILN_RING, VAULT_HALF, LAIR_HALF, LAIR_CLEAR, VENT_PERIOD_S, VENT_FLARE_S, VENT_HEAT, HURT_KNOCKBACK, MATERIAL, BOSS_LOOT, BEACON_COST } = C;
  const make = (mode = 'drift', seed = 4242, save) => { const g = new Game({ seed, mode, audio: quiet, save }); g.undertow.off = true; g.vents.off = true; g.enemies.length = 0; g.spawnTimer = 1e9; g.burrow.off = true; return g; };
  const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  {
    const bad = []; let maxT = 0;
    for (let k = 1; k <= 30; k++) {
      const seed = k * 7919, g = make('drift', seed), w = g.world, B = g.bosses.list[0], H = LAIR_HALF;
      if (!B) { bad.push(`${seed}: no lair`); continue; }
      maxT = Math.max(maxT, B.t);
      const plain = new World(seed, [], 256), an = anomalySites(plain), vs = ventSites(plain, an);
      if (JSON.stringify(an) !== JSON.stringify(g.anomaly.sites.map(({ void: _, ...s }) => s)) || JSON.stringify(vs.map(s => [s.x, s.y, s.phase])) !== JSON.stringify(g.vents.sites.map(s => [s.x, s.y, s.phase]))) bad.push(`${seed}: sites moved`);
      for (let j = -H; j <= H; j++) for (let i = -H; i <= H; i++) if (w.ring(B.x + i, B.y + j) !== KILN_RING || w.get(B.x + i, B.y + j) === T.BEDROCK) bad.push(`${seed}: footprint off the Kiln`);
      if (vaultSites(seed, 256).some(v => cheb(v, B) - H - VAULT_HALF - 1 < LAIR_CLEAR.vault)) bad.push(`${seed}: vault`);
      if ([...an, ...vs].some(s => cheb(s, B) - H - 1 < LAIR_CLEAR.site)) bad.push(`${seed}: vent / Anomaly`);
      if (chooseSpires(seed, null, null, 256).some(s => cheb(s, B) - H - SPIRE_HALF - 1 < LAIR_CLEAR.spire)) bad.push(`${seed}: Spire`);
      stampSpires(plain, g.spires);
      let diff = 0;
      for (let c = 0; c < w.cells.length; c++) if (w.cells[c] !== plain.cells[c] && !g.bosses.list.some(L => Math.abs(c % 256 - L.x) <= H && Math.abs(Math.floor(c / 256) - L.y) <= H)) diff++; // S-61a: the Gyre's lair too
      if (diff) bad.push(`${seed}: ${diff} cells changed outside the lair`);
      if (JSON.stringify(lairSite(plain, KILN_RING, an, vs)) !== JSON.stringify({ x: B.x, y: B.y, ring: B.ring, t: B.t })) bad.push(`${seed}: not seed-only`);
    }
    { // B-094: bots run without lairs unless asked (surgebot boss: 'off'), so older gates keep their numbers
      const g = make('drift', 4242), plain = new World(4242, [], 256); stampSpires(plain, g.spires); clearBosses(g);
      if (g.bosses.list.length || g.world.cells.some((c, i) => c !== plain.cells[i])) bad.push('clearBosses left the lair');
    }
    const small = make('drift', 4242, null), g160 = new Game({ seed: 4242, mode: 'drift', audio: quiet, size: 160 });
    check('S-60a lair: a seed-only 9 × 9 site in the Kiln on 30 / 30 seeds, clear of vaults (2) / vents + Anomalies (3) / Spires (6); nothing else moves; none in a 160 world',
      bad.length === 0 && small.bosses.list.length === 2 && small.bosses.list[0].name === 'Crucible' && g160.bosses.list.length === 0, bad.slice(0, 4).join('; ') + ` (last draw ${maxT})`);
  }
  check('S-60a: plate hp 16 and core hp 40 (MATERIAL = config), no yield; BOSS_LOOT 80 ◆ / 20 ▲ / 24 biome',
    MATERIAL[T.BOSS_PLATE].hp === C.BOSS_PLATE_HP && MATERIAL[T.BOSS_CORE].hp === C.BOSS_CORE_HP && C.BOSS_PLATE_HP === 16 && C.BOSS_CORE_HP === 40
      && !MATERIAL[T.BOSS_PLATE].yield && JSON.stringify(BOSS_LOOT) === '{"shard":80,"prism":20,"biome":24}');
  /** Takes boss 0 apart by direct hits: 1 dmg on every plate (record which took it), then a kill on the lit one. */
  const takeApart = g => {
    const w = g.world, B = g.bosses.list[0], order = [], leaks = [], coreDmg = [];
    for (let s = 0; s < 8; s++) {
      for (let k = 0; k < 8; k++) { const [i, j] = PLATES[k], c = (B.y + j) * w.w + B.x + i; if (w.cells[c] !== T.BOSS_PLATE) continue; const d0 = w.damage[c]; w.hit(B.x + i, B.y + j, 1); if (w.damage[c] > d0 && k !== B.lit) leaks.push(k); }
      w.hit(B.x, B.y, 100); coreDmg.push(w.damage[B.y * w.w + B.x]);
      order.push(B.lit); const [i, j] = PLATES[B.lit], r = w.hit(B.x + i, B.y + j, 100);
      if (!r || !r.broken) leaks.push('no-break');
    }
    const before = g.pickups.length, r = w.hit(B.x, B.y, 100), loot = {};
    for (const q of g.pickups.slice(before)) loot[q.kind] = (loot[q.kind] || 0) + 1;
    const n = g.pickups.length; w.hit(B.x, B.y, 100);
    return { order, leaks, coreDmg: Math.max(...coreDmg), broke: !!(r && r.broken), loot, again: g.pickups.length - n, down: B.down, ev: g.events.includes('boss'), left: platesLeft(g, B) };
  };
  {
    const r = { drift: takeApart(make('drift')), surge: takeApart(make('surge')) }, d = r.drift, want = [d.order[0]];
    for (let k = 1; k < 8; k++) want.push(nextPlate(want[k - 1]));
    check('S-60a take-apart: only the lit plate takes damage; the glow moves (i + 5) mod 8 over all 8; the core is immune until the 8th plate; Surge out of BOSS_WAKE_R = Drift',
      JSON.stringify(d.order) === JSON.stringify(want) && new Set(d.order).size === 8 && d.leaks.length === 0 && d.coreDmg === 0 && JSON.stringify(r.drift) === JSON.stringify(r.surge), JSON.stringify(r));
    check('S-60a down: the core breaks once and bursts BOSS_LOOT once (80 ◆, 20 ▲, 24 ⬟), toast event, down = true',
      d.broke && d.loot.shard === 80 && d.loot.prism === 20 && d.loot.calx === 24 && d.again === 0 && d.down && d.ev && d.left === 0, JSON.stringify(d.loot));
    const starts = new Set([4242, 7, 99, 31337, 5, 11, 2024, 8080].map(s => make('drift', s).bosses.list[0].lit));
    check('S-60a: the first lit plate is seeded (varies by seed, same in both modes)', starts.size > 1 && make('surge').bosses.list[0].lit === make('drift').bosses.list[0].lit, [...starts].join(','));
  }
  { // a mode switch keeps plate damage and the lit plate
    const g = make('drift'), w = g.world, B = g.bosses.list[0], [i, j] = PLATES[B.lit], c = (B.y + j) * w.w + B.x + i;
    w.hit(B.x + i, B.y + j, 5); const lit = B.lit; g.setMode('surge');
    check('S-60a: a mode switch keeps plate damage and the lit plate', w.damage[c] === 5 && B.lit === lit && w.cells[c] === T.BOSS_PLATE, JSON.stringify({ d: w.damage[c], lit, now: B.lit }));
  }
  /** Core `off` cells west of the boss core, just before a flare. */
  const atFlare = (mode, off, P = VENT_PERIOD_S) => {
    const g = make(mode), B = g.bosses.list[0], p = g.player;
    p.x = (B.x + 0.5 - off) * CELL; p.y = (B.y + 0.5) * CELL; p.vx = p.vy = 0; g.heat = 0; g.cargo.shard = 3;
    g.stats.time = 20 * P - B.phase - VENT_FLARE_S - 1 / 120;
    return g;
  };
  const step = (g, k) => { const out = []; for (let i = 0; i < k; i++) { g.enemies.length = 0; g.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null }); g.events.length = 0; out.push({ vx: +g.player.vx.toFixed(3), heat: +g.heat.toFixed(3) }); } return out; };
  {
    const r = {};
    for (const [mode, P] of [['drift', VENT_PERIOD_S], ['surge', C.BOSS_SURGE_FLARE_S]]) {
      const g = atFlare(mode, 2.5, P), hull = g.player.integrity, log = step(g, 30);
      r[mode] = { vx: log[0].vx, heat: log[0].heat, hull: g.player.integrity === hull, lost: hull - g.player.integrity, cargo: g.cargo.shard === 3, flares: g.bosses.flares, burns: g.bosses.burns };
    }
    const far = atFlare('drift', 3.6), farLog = step(far, 40), sfar = atFlare('surge', 3.6, C.BOSS_SURGE_FLARE_S), sh = sfar.player.integrity, sLog = step(sfar, 40);
    check('S-60b flare: awake (Surge, 2.5 cells) the flare cycles every 4 s and deals 10 on top of the same shove + heat, once; 3.6 cells out (awake) untouched',
      Math.abs(r.surge.vx + HURT_KNOCKBACK) < 1 && Math.abs(r.surge.heat - VENT_HEAT) < 1e-9 && r.surge.lost === C.BOSS_FLARE_DMG && r.surge.flares === 1 && r.surge.burns === 1
        && sLog.every(e => e.vx === 0 && e.heat === 0) && sfar.player.integrity === sh && sfar.bosses.flares === 0, JSON.stringify({ surge: r.surge, far: sLog[0] }));
    check('S-60a flare: the core flares like a vent: a core 2.5 cells out is shoved out (+0.4 heat), once, no damage or cargo loss (Drift); 3.6 cells out untouched',
      r.drift.burns === 0 && Math.abs(r.drift.vx + HURT_KNOCKBACK) < 1 && Math.abs(r.drift.heat - VENT_HEAT) < 1e-9 && r.drift.hull && r.drift.cargo && r.drift.flares === 1
        && farLog.every(e => e.vx === 0 && e.heat === 0) && far.bosses.flares === 0, JSON.stringify({ ...r, far: farLog[0] }));
  }
  { // S-60b awake: any plate cuts only in Surge within BOSS_WAKE_R; a mode switch follows at once
    const at = (mode, off) => { const g = make(mode), B = g.bosses.list[0]; g.player.x = (B.x + 0.5 - off) * CELL; g.player.y = (B.y + 0.5) * CELL; return { g, B }; };
    const other = (g, B) => { const k = (B.lit + 1) % 8, [i, j] = PLATES[k], c = (B.y + j) * g.world.w + B.x + i; g.world.hit(B.x + i, B.y + j, 3); return g.world.damage[c]; };
    const near = at('surge', 3), dr = at('drift', 3), far = at('surge', 12), sw = at('surge', 3); sw.g.setMode('drift');
    const res = { surge: other(near.g, near.B), drift: other(dr.g, dr.B), far: other(far.g, far.B), switched: other(sw.g, sw.B) };
    const any = at('surge', 3); for (const k of [3, 6, 1]) { const [i, j] = PLATES[(any.B.lit + k) % 8]; any.g.world.hit(any.B.x + i, any.B.y + j, 100); }
    res.anyOrder = 8 - platesLeft(any.g, any.B); res.core = (any.g.world.hit(any.B.x, any.B.y, 5), any.g.world.damage[any.B.y * 256 + any.B.x]);
    check('S-60b: awake (Surge ≤ 10 cells) any plate cuts, in any order (core still waits); Drift, Surge 12 cells out and a switch to Drift keep the lit-plate rule',
      res.surge === 3 && res.drift === 0 && res.far === 0 && res.switched === 0 && res.anyOrder === 3 && res.core === 0, JSON.stringify(res));
  }
  { // S-60b embers: one every 2 s at a core in sight ≤ 10 cells (8 dmg); rock in the line stops it (none lobbed); rock after launch pops it
    const run = (block, late) => {
      const g = make('surge'), w = g.world, B = g.bosses.list[0], p = g.player;
      p.x = (B.x + 0.5 - 4) * CELL; p.y = (B.y + 0.5) * CELL; p.vx = p.vy = 0; p.invuln = 0; const hull = p.integrity;
      if (block) w.cells[B.y * w.w + B.x - 3] = T.ROCK;
      let blocked = false;
      for (let k = 0; k < 150; k++) {
        if (late && g.bolts.length && !blocked) { blocked = true; w.cells[B.y * w.w + B.x - 3] = T.ROCK; }
        g.enemies.length = 0; p.vx = p.vy = 0; p.x = (B.x + 0.5 - 4) * CELL; p.y = (B.y + 0.5) * CELL;
        g.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null }); g.events.length = 0;
      }
      return { embers: g.bosses.embers, lost: hull - p.integrity, ember: g.bolts.every(b => b.ember) };
    };
    const open = run(false, false), wall = run(true, false), late = run(false, true);
    check('S-60b ember: one per 2 s at a core in sight 4 cells out hits for 8; rock in the line = none lobbed; rock after launch stops it (no hit)',
      open.embers === 1 && open.lost === C.BOLT_DMG && wall.embers === 0 && wall.lost === 0 && late.embers === 1 && late.lost === 0, JSON.stringify({ open, wall, late }));
    const { wardTarget } = await import('../src/ward.js');
    const g = make('surge'); g.bolts.push({ bolt: true, ember: true, x: g.player.x + 40, y: g.player.y, vx: 0, vy: 0, r: 5, hp: 0.5, flash: 0, life: 4 });
    check('S-60b: a Ward ignores an ember (it bolts creatures only)', wardTarget(g, { x: g.player.x, y: g.player.y }) === null);
  }
  { // S-60b: a Surge death heals the live core and keeps broken plates; weather and rifts never start while awake
    const g = make('surge'), w = g.world, B = g.bosses.list[0];
    g.player.x = (B.x - 3) * CELL; g.player.y = (B.y + 0.5) * CELL;
    for (const [i, j] of PLATES) w.destroy(B.x + i, B.y + j);
    w.hit(B.x, B.y, 20); const was = w.damage[B.y * 256 + B.x]; g.destabilize();
    check('S-60b: a Surge death heals the core to full; broken plates stay broken', was === 20 && w.damage[B.y * 256 + B.x] === 0 && platesLeft(g, B) === 0 && !B.down && w.get(B.x, B.y) === T.BOSS_CORE, `core ${was} -> ${w.damage[B.y * 256 + B.x]}`);
    const ev = (near) => {
      const h = make('surge'), HB = h.bosses.list[0], p = h.player;
      const hold = () => { if (near) { p.x = (HB.x - 3) * CELL; p.y = (HB.y + 0.5) * CELL; } p.vx = p.vy = 0; p.invuln = 9; h.enemies.length = 0; h.bolts.length = 0; };
      hold(); h.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null });
      h.weather.start = h.stats.time + 0.05; h.rift.start = h.stats.time + 0.05;
      for (let k = 0; k < 20; k++) { hold(); h.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null }); h.events.length = 0; }
      return { weather: h.weather.kind, rift: !!h.rift.open };
    };
    const awake = ev(true), away = ev(false);
    check('S-60b: a storm or rift due while the boss is awake never starts (both do away from it)', awake.weather === null && !awake.rift && away.weather === 'storm' && away.rift, JSON.stringify({ awake, away }));
  }
  { // saves: reload mid-fight restores the plates; a downed boss stays down; an old 256 save gets the lair; a 160 save none
    const g = make(), w = g.world, B = g.bosses.list[0];
    for (let s = 0; s < 3; s++) { const [i, j] = PLATES[B.lit]; w.hit(B.x + i, B.y + j, 100); }
    const back = make('drift', 4242, upgradeSave(JSON.parse(JSON.stringify(g.toSave())))), BB = back.bosses.list[0];
    const restored = platesLeft(back, BB) === 8 && !BB.down && back.world.get(BB.x, BB.y) === T.BOSS_CORE && PLATES.every(([i, j]) => back.world.damage[(BB.y + j) * 256 + BB.x + i] === 0);
    takeApart(g);
    const save2 = JSON.parse(JSON.stringify(g.toSave())), down = make('drift', 4242, upgradeSave(save2)), DB = down.bosses.list[0];
    const stays = DB.down && down.world.get(DB.x, DB.y) === T.EMPTY && platesLeft(down, DB) === 0 && JSON.stringify(save2.bosses) === '[{"ring":4,"down":true},{"ring":3,"down":false}]';
    check('S-60a save: a reload mid-fight restores every plate (no damage); a downed boss stays down (lair floor); only { ring, down } is saved', restored && stays, JSON.stringify({ restored, stays, saved: save2.bosses }));
    // an old (format 22) save: a Beacon placed on lair floor, the core standing in the lair, plates broken in its map
    const o = make(), ow = o.world, OB = o.bosses.list[0], bi = (OB.y + 3) * 256 + OB.x + 3;
    const s = JSON.parse(JSON.stringify(o.toSave()));
    const br = new Uint8Array(ow.broken); br[bi] = 1; for (const [i, j] of PLATES) br[(OB.y + j) * 256 + OB.x + i] = 1;
    const { packBits } = await import('../src/world.js');
    s.broken = packBits(br); s.beacons = [bi]; s.bank.prism = 0; delete s.bosses; s.v = 22; s.player = { x: (OB.x - 2.5) * CELL, y: (OB.y + 0.5) * CELL };
    const up = upgradeSave(s), ob = make('drift', 4242, up), UB = ob.bosses.list[0];
    const nx = ob.nexus.x, ny = ob.nexus.y + C.SPAWN_OFFSET;
    const old = { v: up.v === SAVE_FORMAT, plates: platesLeft(ob, UB), beacons: ob.beacons.length, prism: ob.bank.prism, refunds: ob.bosses.refunds, core: ob.player.x === nx && ob.player.y === ny };
    const s160 = new Game({ seed: 4242, mode: 'drift', audio: quiet, size: 160 }).toSave();
    check('S-60a old save: a format-22 256 save gets the lair (plates stamped over its map, a Beacon in it refunded, the core moved to the Nexus); a 160 save gets none',
      old.v && old.plates === 8 && old.beacons === 0 && old.prism === BEACON_COST && old.refunds === 1 && old.core && JSON.stringify(s160.bosses) === '[]', JSON.stringify(old));
    // audit 174 (B-113): a current save whose lair record is unreadable (B-037: loads empty) refunds a Decoy on lair floor too
    const d = JSON.parse(JSON.stringify(o.toSave()));
    const dbr = new Uint8Array(ow.broken); dbr[bi] = 1;
    d.broken = packBits(dbr); d.decoys = [bi]; d.bank.prism = 0; d.bank.shard = 0; d.bosses = 'junk';
    const dg = make('drift', 4242, upgradeSave(d));
    const dec = { decoys: dg.decoys.length, prism: dg.bank.prism, shard: dg.bank.shard, refunds: dg.bosses.refunds };
    check('B-113 lair refund: a Decoy placed in a lair new to its save goes back to the bank as its craft cost, like a Ward',
      dec.decoys === 0 && dec.prism === C.DECOY_COST.prism && dec.shard === C.DECOY_COST.shard && dec.refunds === 1, JSON.stringify(dec));
  }
  { // probe: a mid build (beam 5, range 3) walks to a standpoint 3.4 cells out from the lit plate and beams it, then the core
    const res = [];
    for (const seed of [4242, 7, 99, 31337]) {
      const g = make('drift', seed), w = g.world, B = g.bosses.list[0], p = g.player; g.god = true;
      g.upgrades.beam = 5; g.upgrades.range = 3;
      p.x = (B.x - 3.5) * CELL; p.y = (B.y - 3.5) * CELL;
      let t = 0;
      for (; t < 180 && !B.down; t += 1 / 60) {
        const tgt = platesLeft(g, B) ? PLATES[B.lit] : [0, 0], tx = (B.x + tgt[0] + 0.5) * CELL, ty = (B.y + tgt[1] + 0.5) * CELL;
        const ox = (B.x + 0.5) * CELL, oy = (B.y + 0.5) * CELL, goal = tgt[0] || tgt[1] ? Math.atan2(tgt[1], tgt[0]) : -3 * Math.PI / 4;
        const at = Math.atan2(p.y - oy, p.x - ox), da = Math.atan2(Math.sin(goal - at), Math.cos(goal - at));
        const via = Math.abs(da) > 0.5 ? at + Math.sign(da) * 0.5 : goal; // round the body on the 3.4-cell ring, never through it
        const sx = ox + Math.cos(via) * 3.4 * CELL, sy = oy + Math.sin(via) * 3.4 * CELL;
        const mx = sx - p.x, my = sy - p.y, md = Math.hypot(mx, my), ax = tx - p.x, ay = ty - p.y, ad = Math.hypot(ax, ay);
        g.enemies.length = 0;
        g.update(1 / 60, { move: md > 6 ? { x: mx / md, y: my / md } : { x: 0, y: 0 }, fire: md < 24 && via === goal, aim: { x: ax / ad, y: ay / ad } });
        g.events.length = 0;
      }
      res.push(+t.toFixed(1));
    }
    check('S-60a probe: a mid build (beam 5, range 3) takes the Crucible apart in ≤ 90 s (logged in 09)', res.every(t => t <= 90), `seconds: ${res.join(', ')}`);
  }
  { // S-60b2 gate (D-165): tools/bossrun.mjs, the world as played, GATE_SEEDS (8) seeds; the boss route plays to down in each mode
    const out = await require('./gates.cjs').run('bossrun.mjs');
    const line = out.split('\n').find(l => l.startsWith('gate')) || '';
    check('S-60b2: the bossrun.mjs gate passes on 8 seeds (Surge / Drift time to down 0.8–1.25, Surge deaths median ≤ 1, every run down)',
      /PASS/.test(line), out.trim().split('\n').map(l => l.slice(0, 70)).join(' | '));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('boss: ' + e.message));
  await pg.goto(url + (url.includes('?') ? '&' : '?') + 'seed=4242'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(200);
  const { CELL } = await import('../src/config.js');
  const has = await pg.evaluate(C => {
    const L = window.__lumen, g = L.game, B = g.bosses && g.bosses.list[0];
    if (!B) return false;
    g.player.x = (B.x - 3) * C; g.player.y = (B.y + 0.5) * C; g.player.vx = g.player.vy = 0;
    g.world.reveal(g.player.x, g.player.y, 10 * C); g.god = true; g.undertow.off = true; g.vents.off = true; g.spawnTimer = 1e9; g.enemies.length = 0;
    return true;
  }, CELL);
  await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => ({ drawn: window.__lumen.renderer.bossDrawn }));
  if (shot) await pg.screenshot({ path: shot });
  check('S-60a: a seen Crucible draws its core and lit plate', has && r.drawn === 1, JSON.stringify({ has, ...r }));
  const pass = await pg.evaluate(() => { // B-095: the renderer once replaced the world's break listeners, so in the page the lit plate's break never passed the glow on
    const g = window.__lumen.game, B = g.bosses.list[0], [[i, j]] = [[[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]][B.lit]], was = B.lit;
    g.world.destroy(B.x + i, B.y + j); return { was, now: B.lit };
  });
  check('B-095: in the page, breaking the lit plate passes the glow to (i + 5) mod 8', pass.now === (pass.was + 5) % 8, JSON.stringify(pass));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.BOSS_SHOT, shot: process.env.BOSS_SHOT });
