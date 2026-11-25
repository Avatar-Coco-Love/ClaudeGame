// World + save checks moved out of smoke.cjs at audit 49 (it neared the 600-line cap). Node-side only; smoke.cjs calls nodeChecks.
// S-5 RNG determinism, S-8 rings, S-9 vaults, S-10 Lumen, audit 14 loot (B-005, B-011).
let check = () => {};

// S-5: the same seed + the same scripted input -> the same pickups and Glitch spawns (node-side, no browser needed).
// Each game is built ≥ 3 ms apart so a clock-salted RNG (the old `seed ^ Date.now()`) can't pass by luck.
// Audit 14: cargo scattered on a death survives a full floor (B-005); floor pickups survive save + load (B-011).
async function lootChecks() {
  const { Game } = await import('../src/game.js');
  const { upgradeSave } = await import('../src/save.js');
  const { PICKUP_CAP } = await import('../src/config.js');
  const audio = new Proxy({}, { get: () => () => {} });
  const g = new Game({ seed: 77, mode: 'surge', audio, size: 160 });
  for (let i = 0; i < PICKUP_CAP; i++) g.spawnPickup(g.nexus.x + 200, g.nexus.y, 'shard');
  const floor = g.pickups.length;
  g.cargo = { ...g.cargo, shard: 7, prism: 3 };
  g.player.integrity = 1; g.hurtPlayer(5, 1, 0);
  const kept = g.pickups.slice(floor);
  check('death on a full floor keeps every cargo item (B-005)', floor === PICKUP_CAP && kept.length === 10 && kept.filter(q => q.kind === 'prism').length === 3,
    `floor ${floor}, scattered ${kept.length}`);
  const s = JSON.parse(JSON.stringify(g.toSave()));
  const h = new Game({ seed: 77, mode: 'surge', audio, save: upgradeSave(s) });
  const count = (list, k) => list.filter(q => q.kind === k).length;
  check('floor pickups survive save + load (B-011)', h.pickups.length === 410 && count(h.pickups, 'prism') === 3
    && Math.round(h.pickups[405].x) === Math.round(g.pickups[405].x), `${h.pickups.length} restored, ${count(h.pickups, 'prism')} prisms`);
}

// S-8 depth rings: ring by distance, Deep rock takes 2× the beam time, layout and cell types unchanged, one toast per ring.
async function ringChecks() {
  const { World } = await import('../src/world.js');
  const { Game } = await import('../src/game.js');
  const w = new World(77, [], 160), cx = w.w / 2, cy = w.h / 2;
  const rs = [10, 30, 60].map(d => w.ring(cx + d, cy));
  check('ring() at d 10/30/60 = Hearth/Veil/Deep (S-8)', rs.join() === '0,1,2', rs.join());
  const beamTime = (x, y) => { let n = 0; while (!(w.hit(x, y, 0.01) || {}).broken && n < 1e4) n++; return n + 1; };
  const rockAt = (dMin, dMax) => { for (let y = 2; y < w.h - 2; y++) for (let x = 2; x < w.w - 2; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d >= dMin && d < dMax && w.get(x, y) === 1) return [x, y]; } };
  const [hx, hy] = rockAt(10, 20), [dx, dy] = rockAt(55, 70);
  const th = beamTime(hx, hy), td = beamTime(dx, dy);
  check('Deep ROCK takes 2× the beam time of Hearth ROCK (S-8)', Math.abs(td / th - 2) < 0.03, `${th} vs ${td} ticks`);
  // Base generator with every vault skipped (S-9 stamps on top; vaultChecks covers that). Hashes of seed 77 (D-023):
  // `lay` = empty/solid bitset as generated before S-8; `ore` = cell types with DENSE and LUMEN folded into ROCK, as generated
  // before S-10 (so Lumen only re-typed plain rock); `typ` = full cell types, pinned at S-10 (3824047980 before it).
  const g0 = new World(77, [0, 1, 2, 3, 4, 5], 160); let lay = 0x811c9dc5, typ = 0x811c9dc5, ore = 0x811c9dc5;
  for (let i = 0; i < g0.cells.length; i++) { const c = g0.cells[i];
    lay = Math.imul(lay ^ (c ? 1 : 0), 0x01000193) >>> 0; typ = Math.imul(typ ^ c, 0x01000193) >>> 0;
    ore = Math.imul(ore ^ (c === 2 || c === 8 ? 1 : c), 0x01000193) >>> 0; }
  check('seed 77 layout + ore unchanged by rings and Lumen; types pinned (S-8, S-10, D-023)', lay === 2394919557 && ore === 3976025408 && typ === 307018507,
    `${lay} / ${ore} / ${typ}`);
  const pitches = [];
  const audio = new Proxy({}, { get: (_, k) => k === 'setRing' ? r => pitches.push(r) : () => {} });
  const g = new Game({ seed: 77, mode: 'drift', audio, size: 160 });
  const toasts = [], go = d => { g.player.x = g.nexus.x + d * 32; g.player.y = g.nexus.y; g.player.vx = g.player.vy = 0;
    g.update(1 / 60, { move: { x: 0, y: 0 } }); toasts.push(...g.events.filter(e => e === 'ring').map(() => g.ringName())); g.events.length = 0; };
  for (const d of [30, 10, 30, 60, 30, 60]) go(d);
  check('each ring toasts once per session, hum pitch follows the ring (S-8)', toasts.join() === 'Veil,Deep' && pitches.join() === '0,1,0,1,2,1,2',
    `toasts ${toasts.join()} · pitch ${pitches.join()}`);
}

// S-9 vaults: 6 per fresh world, only the vault footprint differs from the base generator, a cache bursts 20◆ + 6▲,
// an opened cache stays open after reload, and an old (format 3) save that has looked at a vault never gets it stamped.
async function vaultChecks() {
  const { World, vaultSites, packBits } = await import('../src/world.js');
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { T } = await import('../src/config.js');
  const audio = new Proxy({}, { get: () => () => {} });
  const seeds = Array.from({ length: 40 }, (_, i) => (i + 1) * 7919);
  const counts = seeds.map(s => new World(s, [], 160).vaults.length);
  const w = new World(77, [], 160), base = new World(77, [0, 1, 2, 3, 4, 5], 160), foot = new Set(w.vaults.flatMap(v => v.cells));
  let outside = 0; for (let i = 0; i < w.cells.length; i++) if (!foot.has(i) && w.cells[i] !== base.cells[i]) outside++;
  check('6 vaults on every one of 40 seeds; only their footprints differ from the base world (S-9)', counts.every(n => n === 6) && outside === 0
    && w.vaults.every(v => w.cells[v.y * w.w + v.x] === T.CACHE), `min ${Math.min(...counts)}, ${outside} cells changed outside`);
  const g = new Game({ seed: 77, mode: 'drift', audio, size: 160 }), v = g.world.vaults[0];
  const before = g.pickups.length;
  while (!(g.world.hit(v.x, v.y, 0.5) || {}).broken);
  g.onCellBroken(v.x, v.y, T.CACHE);
  const got = g.pickups.slice(before), n = k => got.filter(q => q.kind === k).length;
  const h = new Game({ seed: 77, mode: 'drift', audio, save: upgradeSave(JSON.parse(JSON.stringify(g.toSave()))) });
  check('breaking a cache bursts 20◆ + 6▲; it stays open after reload (S-9)', n('shard') === 20 && n('prism') === 6
    && h.world.get(v.x, v.y) === T.EMPTY && h.world.vaults.length === 6, `${n('shard')}◆ ${n('prism')}▲, after reload ${h.world.get(v.x, v.y)}`);
  // A format-3 save (no vaultSkip) that explored one cell of vault 2 and tunnelled through the base world where vault 4 sits.
  const old = new Game({ seed: 77, mode: 'drift', audio, size: 160 }).toSave(), sites = vaultSites(77, 160), N = w.w * w.h;
  const ex = new Uint8Array(N), br = new Uint8Array(N);
  ex[sites[2].cells[0]] = 1;
  const tunnel = sites[4].cells.filter(c => base.cells[c] !== T.EMPTY).slice(0, 3); for (const c of tunnel) br[c] = ex[c] = 1;
  Object.assign(old, { v: 3, explored: packBits(ex), broken: packBits(br) }); delete old.vaultSkip;
  const up = upgradeSave(old), o = new Game({ seed: 77, mode: 'drift', audio, save: up });
  const vs = sites[4];
  check('a format-3 save skips the vaults it has seen and keeps its tunnels (S-9, D-023)', up.v === SAVE_FORMAT && up.vaultSkip.join() === '2,4'
    && o.world.vaults.length === 4 && tunnel.every(c => o.world.cells[c] === T.EMPTY) && o.world.get(vs.x, vs.y) !== T.CACHE
    && JSON.stringify(o.toSave().vaultSkip) === '[2,4]', `skip ${up.vaultSkip}, ${o.world.vaults.length} vaults`);
  check('a new world saves vaultSkip: [] (S-9)', JSON.stringify(new Game({ seed: 5, mode: 'drift', audio, size: 160 }).toSave().vaultSkip) === '[]');
}

// S-10 Lumen: Deep only (d >= 55) on 40 seeds; one Lumen cell banks exactly 1● through pickup + deposit; a floor ● and the
// bank survive save + load; a format-4 save (no lumen anywhere) loads with bank.lumen = 0 and its prism pickups intact.
async function lumenChecks() {
  const { World } = await import('../src/world.js');
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { T, LUMEN_D } = await import('../src/config.js');
  const audio = new Proxy({}, { get: () => () => {} });
  let total = 0, minD = Infinity, empty = 0;
  for (let k = 1; k <= 40; k++) {
    const w = new World(k * 7919, [], 160); let n = 0;
    for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) if (w.cells[y * w.w + x] === T.LUMEN) { n++; minD = Math.min(minD, Math.hypot(x + 0.5 - w.cx, y + 0.5 - w.cy)); }
    total += n; if (!n) empty++;
  }
  check('Lumen only at d ≥ 55, ~141 cells per world on 40 seeds (S-10)', minD >= LUMEN_D && empty === 0 && total / 40 > 120 && total / 40 < 160,
    `mean ${(total / 40).toFixed(1)}, nearest d ${minD.toFixed(2)}, ${empty} worlds without`);
  const g = new Game({ seed: 77, mode: 'drift', audio, size: 160 }), w = g.world;
  let cell = null; for (let i = 0; i < w.cells.length && !cell; i++) if (w.cells[i] === T.LUMEN) cell = [i % w.w, Math.floor(i / w.w)];
  let ticks = 0; while (!(w.hit(cell[0], cell[1], 0.05) || {}).broken) ticks++;
  g.onCellBroken(cell[0], cell[1], T.LUMEN);
  const drops = g.pickups.filter(q => q.kind === 'lumen');
  for (const q of g.pickups) { q.x = g.player.x; q.y = g.player.y; q.vx = q.vy = 0; }
  for (let i = 0; i < 90; i++) g.update(1 / 60, { move: { x: 0, y: 0 } });
  check('mining one Lumen cell banks exactly 1●; hp 3.5, not ring-scaled (S-10)', drops.length === 1 && g.bank.lumen === 1 && g.cargo.lumen === 0 && g.stats.lumen === 1
    && ticks >= 68 && ticks <= 71, `${drops.length} dropped, bank ${g.bank.lumen}, ${ticks + 1} hits of 0.05`);
  g.spawnPickup(g.nexus.x + 400, g.nexus.y, 'lumen', true);
  const h = new Game({ seed: 77, mode: 'drift', audio, save: upgradeSave(JSON.parse(JSON.stringify(g.toSave()))) });
  check('banked ● and a floor ● survive save + load (S-10)', h.bank.lumen === 1 && h.stats.lumen === 1 && h.pickups.filter(q => q.kind === 'lumen').length === 1,
    `bank ${h.bank.lumen}, floor ${h.pickups.map(q => q.kind).join()}`);
  const old = new Game({ seed: 77, mode: 'drift', audio, size: 160 }).toSave();
  Object.assign(old, { v: 4, bank: { shard: 5, prism: 2 }, cargo: { shard: 1, prism: 0 }, pickups: [[1, 3000, 3000], [0, 3010, 3000]] });
  delete old.stats.lumen;
  const up = upgradeSave(old), o = new Game({ seed: 77, mode: 'drift', audio, save: up });
  check('a format-4 save loads with bank.lumen = 0 and its pickups intact (S-10)', up.v === SAVE_FORMAT && o.bank.lumen === 0 && o.cargo.lumen === 0
    && o.bank.shard === 5 && o.stats.lumen === 0 && o.pickups.map(q => q.kind).join() === 'prism,shard', JSON.stringify(o.bank));
}

async function rngChecks() {
  const { Game } = await import('../src/game.js');
  const audio = new Proxy({}, { get: () => () => {} });
  const play = async (extraYieldDraws = 0) => {
    await new Promise(r => setTimeout(r, 3));
    const g = new Game({ seed: 4242, mode: 'surge', audio, size: 160 });
    for (let i = 0; i < extraYieldDraws; i++) g.rng.yield();
    g.player.integrity = 1e9;
    const spawns = [], pickups = [], push = g.enemies.push;
    const inp = { move: { x: 0.15, y: 1 }, fire: true, aim: { x: 0, y: 1 } };
    for (let f = 0; f < 60 * 40; f++) {
      const n = g.enemies.length, k = g.pickups.length;
      g.player.invuln = 9;
      g.update(1 / 60, inp);
      for (const e of g.enemies.slice(n)) spawns.push(`${Math.round(e.x)},${Math.round(e.y)}`);
      for (const q of g.pickups.slice(k)) pickups.push(`${q.kind}${Math.round(q.vx)}`);
    }
    return { spawns: spawns.join(' '), pickups: pickups.join(' '), n: spawns.length, m: pickups.length, mined: g.stats.mined };
  };
  const a = await play(), b = await play(), c = await play(7);
  check('same seed + same input -> same pickups and Glitch spawns (S-5)', a.n > 0 && a.m > 0 && a.spawns === b.spawns && a.pickups === b.pickups,
    `${a.n} spawns, ${a.m} pickups, ${a.mined} cells mined`);
  check('extra yield rolls leave Glitch spawns unchanged (S-5 per-draw salts)', c.spawns === a.spawns && c.n > 0, `${c.n} spawns`);
}

async function nodeChecks(c) {
  check = c;
  await rngChecks().catch(e => check('S-5 RNG checks ran', false, e.message));
  await ringChecks().catch(e => check('S-8 ring checks ran', false, e.message));
  await vaultChecks().catch(e => check('S-9 vault checks ran', false, e.message));
  await lumenChecks().catch(e => check('S-10 Lumen checks ran', false, e.message));
  await lootChecks().catch(e => check('audit 14 loot checks ran', false, e.message));
}

module.exports = { nodeChecks };
