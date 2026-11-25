// S-35 Anomalies checks (D-098, D-099). smoke.cjs calls nodeChecks. Node only: the same seed gives the same 16 sites;
// ring counts, spacing and exclusions over 20 seeds; a site in solid rock can't be taken; take -> beam ×1.5 (mining dps
// follows); Nexus and Relay deposits end it, a deposit of 0 items, a death and a mode switch don't; a second one of the
// same kind can't be taken; recharge at 300 s; a v14 save loads with none taken; a reload keeps the buff + taken sites.
// S-36: kinds seed-only and ~1/3 each; Lodestone reach + pull, Ballast cargo (rounded down); stacking; Ballast's over-limit deposit.
// Usage: node tests/anomaly.cjs
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { anomalySites, updateAnomalies, siteCharged } = await import('../src/anomaly.js');
  const { World, vaultSites } = await import('../src/world.js');
  const { chooseSpires, SPIRE_HALF } = await import('../src/spire.js');
  const { makeRelay } = await import('../src/craft.js');
  const { upgradeSave } = await import('../src/save.js');
  const C = await import('../src/config.js');
  const { CELL, T, WORLD_PROFILES, ANOMALY_GAP, ANOMALY_RECHARGE_S, ANOMALY_BEAM_MUL, NEXUS_RADIUS, DEPOSIT_TICK_S } = C;
  const make = (seed = 4242, mode = 'drift', save) => new Game({ seed, mode, audio: quiet, save });
  const key = s => s.map(q => `${q.x},${q.y},${q.ring}`).join(' ');
  const step = (g, n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) g.update(dt, { move: { x: 0, y: 0 }, aim: null, fire: false }); g.events.length = 0; };
  /** Open site i's cell and put the core on its centre. */
  const open = (g, i) => { const s = g.anomaly.sites[i]; g.world.cells[s.y * g.world.w + s.x] = T.EMPTY;
    g.player.x = (s.x + 0.5) * CELL; g.player.y = (s.y + 0.5) * CELL; g.player.vx = g.player.vy = 0; return s; };

  // Same seed -> same 16 sites (fresh worlds, and a Game whose save already explored/broke ground).
  {
    const a = anomalySites(new World(4242)), b = anomalySites(new World(4242)), g = make(4242);
    check('S-35 anomalies: the same seed gives the same 16 sites (seed-only, like vaultSites)',
      a.length === 16 && key(a) === key(b) && key(g.anomaly.sites) === key(a), `${a.length} sites; ${key(a).slice(0, 60)}…`);
  }
  // 20 seeds: 3 / 5 / 8 per ring, ≥ 12 cells apart, on rock or dense, outside the Nexus ring, vault and Spire footprints.
  {
    const bad = [];
    for (let k = 1; k <= 20; k++) {
      const seed = k * 104729, w = new World(seed), s = anomalySites(w), vs = vaultSites(seed), sp = chooseSpires(seed);
      const counts = [0, 1, 2].map(r => s.filter(q => q.ring === r).length);
      if (counts.join() !== WORLD_PROFILES[160].anomalies.join()) bad.push(`${seed} counts ${counts}`);
      s.forEach((q, i) => {
        const c = w.cells[q.y * w.w + q.x];
        if (c !== T.ROCK && c !== T.DENSE) bad.push(`${seed}#${i} cell ${c}`);
        if (w.ring(q.x, q.y) !== q.ring) bad.push(`${seed}#${i} ring`);
        if (Math.hypot((q.x + 0.5) * CELL - w.centerPx.x, (q.y + 0.5) * CELL - w.centerPx.y) < NEXUS_RADIUS + CELL) bad.push(`${seed}#${i} nexus`);
        if (s.some((o, j) => j !== i && Math.hypot(o.x - q.x, o.y - q.y) < ANOMALY_GAP)) bad.push(`${seed}#${i} gap`);
        if (vs.some(v => Math.max(Math.abs(v.x - q.x), Math.abs(v.y - q.y)) <= 3)) bad.push(`${seed}#${i} vault`);
        if (sp.some(v => Math.max(Math.abs(v.x - q.x), Math.abs(v.y - q.y)) <= SPIRE_HALF)) bad.push(`${seed}#${i} spire`);
      });
    }
    check('S-35 anomalies over 20 seeds: Hearth 3 / Veil 5 / Deep 8, ≥ 12 cells apart, on rock or dense, clear of the Nexus, vaults and Spires',
      bad.length === 0, bad.slice(0, 5).join('; ') || '320 sites');
  }
  // Solid cell: no take. Open: take -> buff, toast event, taken + recharge time; beam stat and mining dps × 1.5.
  {
    const g = make(), s = g.anomaly.sites[0], b0 = g.stat('beam'); s.kind = 'overclock';
    g.player.x = (s.x + 0.5) * CELL; g.player.y = (s.y + 0.5) * CELL; updateAnomalies(g, 0.01);
    const solidTook = g.buffs.length > 0;
    open(g, 0); g.stats.time = 50; updateAnomalies(g, 0.01);
    const took = g.buffs.join() === 'overclock' && g.events.includes('anomaly') && g.anomaly.taken[0] === 50 + ANOMALY_RECHARGE_S && !siteCharged(g, 0);
    // Mining: damage dealt to a rock cell in 0.25 s of beam, before vs during the buff.
    const dmg = buffed => { const h = make(); if (buffed) h.buffs = ['overclock'];
      const p = h.player, cy = Math.floor(p.y / CELL), x = Math.floor(p.x / CELL) + 2; h.world.cells[cy * h.world.w + x] = T.ROCK;
      p.angle = 0; for (let i = 0; i < 15; i++) h.updateBeam(1 / 60, { fire: true, aim: { x: 1, y: 0 } }); return h.world.damage[cy * h.world.w + x]; };
    const d0 = dmg(false), d1 = dmg(true);
    check('S-35 take: not while its cell is solid; once open, Overclock → beam ×1.5 (stat and mining damage), site taken until +300 s',
      !solidTook && took && Math.abs(g.stat('beam') / b0 - ANOMALY_BEAM_MUL) < 1e-9 && Math.abs(d1 / d0 - ANOMALY_BEAM_MUL) < 0.02,
      `solid took ${solidTook}, took ${took}, stat ×${(g.stat('beam') / b0).toFixed(3)}, damage ${d0.toFixed(3)} → ${d1.toFixed(3)}`);
  }
  // A second site of the same kind can't be taken while one is active (it stays charged).
  {
    const g = make(); g.anomaly.sites[0].kind = g.anomaly.sites[1].kind = 'overclock';
    open(g, 0); updateAnomalies(g, 0.01); open(g, 1); updateAnomalies(g, 0.01);
    check('S-35: a second Overclock can\'t be taken while one is active; that site stays charged',
      g.buffs.length === 1 && siteCharged(g, 1), `buffs ${g.buffs}, site 1 charged ${siteCharged(g, 1)}`);
  }
  // Ends: a Nexus deposit that banks ≥ 1 item, a Relay deposit; not a 0-item visit, a death or a mode switch.
  {
    const buffed = (mode = 'drift') => { const g = make(4242, mode); g.buffs = ['overclock']; return g; };
    const home = g => { g.player.x = g.nexus.x; g.player.y = g.nexus.y + CELL; };
    const nx = buffed(); nx.cargo.shard = 3; home(nx); step(nx, Math.ceil(4 * DEPOSIT_TICK_S * 60) + 5);
    const zero = buffed(); home(zero); step(zero, 30);
    const dead = buffed('surge'); dead.cargo.shard = 4; dead.player.integrity = 1; dead.player.invuln = 0; dead.hurtPlayer(5, 0, 1); step(dead, 2);
    const sw = buffed(); sw.setMode('surge'); sw.setMode('drift');
    const rl = buffed(), s = open(rl, 2), i = s.y * rl.world.w + s.x + 3; rl.world.cells[i] = T.EMPTY; rl.relays.push(makeRelay(rl.world, i));
    rl.buffs = ['overclock']; rl.anomaly.taken[2] = 1e9; rl.player.x = (s.x + 3.5) * CELL; rl.cargo.prism = 2; step(rl, Math.ceil(3 * DEPOSIT_TICK_S * 60) + 5);
    const ok = nx.buffs.length === 0 && nx.bank.shard >= 3 && zero.buffs.length === 1 && dead.buffs.length === 1 && sw.buffs.length === 1 && rl.buffs.length === 0 && rl.bank.prism === 2;
    check('S-35 ends: a Nexus or Relay deposit that banks ≥ 1 item; not a 0-item visit, a death or a mode switch', ok,
      `nexus ${nx.buffs.length} (bank ${nx.bank.shard}), zero ${zero.buffs.length}, death ${dead.buffs.length}, switch ${sw.buffs.length}, relay ${rl.buffs.length} (bank ${rl.bank.prism})`);
  }
  // Audit 74: a site beside a Relay isn't taken while the deposit runs (it would end ticks later); once banked, it is, and it lasts.
  {
    const g = make(), s = open(g, 2), i = s.y * g.world.w + s.x + 1; g.anomaly.sites[2].kind = 'overclock';
    g.world.cells[i] = T.EMPTY; g.relays.push(makeRelay(g.world, i)); g.cargo.prism = 3;
    step(g, 2); const during = g.buffs.length;
    step(g, Math.ceil(4 * DEPOSIT_TICK_S * 60) + 5);
    check('Audit 74: no Anomaly take during a Relay deposit beside the site; taken once the cargo is banked, and it stays',
      during === 0 && g.bank.prism === 3 && g.buffs.join() === 'overclock', `during ${during}, bank ${g.bank.prism}, after ${g.buffs}`);
  }
  // Recharge at 300 s of play time.
  {
    const g = make(); open(g, 0); g.stats.time = 10; updateAnomalies(g, 0.01); g.buffs = [];
    g.player.x = g.nexus.x; g.player.y = g.nexus.y;
    g.stats.time = 10 + ANOMALY_RECHARGE_S - 1; updateAnomalies(g, 0.01); const before = siteCharged(g, 0);
    g.stats.time = 10 + ANOMALY_RECHARGE_S; updateAnomalies(g, 0.01);
    check('S-35 recharge: a taken site comes back 300 s of play time later', !before && siteCharged(g, 0), `before ${before}, after ${siteCharged(g, 0)}`);
  }
  // Saves: a v14 save upgrades with none taken / no buff; a reload keeps the buff and the taken sites; junk loads empty.
  {
    const g = make(); open(g, 3); g.stats.time = 20; updateAnomalies(g, 0.01);
    const s14 = { ...JSON.parse(JSON.stringify(g.toSave())), v: 14 }; delete s14.anomalies; delete s14.buffs;
    const up = upgradeSave(s14), old = make(4242, 'drift', up);
    const back = make(4242, 'drift', JSON.parse(JSON.stringify(g.toSave())));
    const junk = make(4242, 'drift', { ...g.toSave(), anomalies: [1, 2], buffs: ['nope', 'overclock', 'overclock'] });
    check('S-35 saves: v14 loads with none taken and no buff; a reload keeps the buff and taken sites; junk is cleaned',
      Object.keys(old.anomaly.taken).length === 0 && old.buffs.length === 0 && back.buffs.join() === g.anomaly.sites[3].kind && back.anomaly.taken[3] === 20 + ANOMALY_RECHARGE_S &&
      !siteCharged(back, 3) && Object.keys(junk.anomaly.taken).length === 0 && junk.buffs.join() === 'overclock',
      `old ${JSON.stringify(old.anomaly.taken)}/${old.buffs}, back ${back.buffs}/${JSON.stringify(back.anomaly.taken)}, junk ${junk.buffs}`);
  }
  // ---- S-36: Lodestone and Ballast ----
  const { ANOMALY_KINDS, ANOMALY_MAGNET_MUL, ANOMALY_PULL_MUL, ANOMALY_CARGO_MUL } = C;
  // Kinds: seed-only (same seed, same kinds; own salt, so placement is unchanged), about 1/3 each over 20 seeds.
  {
    const n = { overclock: 0, lodestone: 0, ballast: 0 }; let same = true;
    for (let k = 1; k <= 20; k++) { const a = anomalySites(new World(k * 104729)), b = anomalySites(new World(k * 104729));
      a.forEach((q, i) => { n[q.kind]++; if (b[i].kind !== q.kind) same = false; }); }
    check('S-36 kinds: the same seed gives the same kinds; over 20 seeds (320 sites) each kind is 1/3 ± 6 %',
      same && Object.keys(n).length === 3 && Object.values(n).every(c => Math.abs(c / 320 - 1 / 3) < 0.06), JSON.stringify(n));
  }
  // Effects: Lodestone → magnet reach ×2 and a faster pull; Ballast → cargo ×1.5 rounded down. Different kinds stack.
  {
    const g = make(); g.upgrades.cargo = 1; const m0 = g.stat('magnet'), c0 = g.stat('cargo'), b0 = g.stat('beam');
    g.buffs = ['lodestone']; const m1 = g.stat('magnet');
    g.buffs = ['ballast']; const c1 = g.stat('cargo');
    g.buffs = ['overclock', 'lodestone', 'ballast'];
    const all = Math.abs(g.stat('beam') / b0 - ANOMALY_BEAM_MUL) < 1e-9 && g.stat('magnet') === m1 && g.stat('cargo') === c1;
    // Pull: a pickup at 1.5× the base reach is pulled only with Lodestone, and with it moves faster than the base pull.
    const pulled = (buffs, dist) => { const h = make(); h.buffs = buffs; const p = h.player;
      h.pickups = [{ x: p.x + dist, y: p.y, vx: 0, vy: 0, kind: 'shard', age: 5, r: 4 }];
      for (let k = 0; k < 6; k++) h.updatePickups(1 / 60); return h.pickups[0] ? p.x + dist - h.pickups[0].x : dist; };
    const far0 = pulled([], m0 * 1.5), far1 = pulled(['lodestone'], m0 * 1.5);
    check('S-36 effects: Lodestone reach ×2 + pull (far pickup moves only with it), Ballast cargo ×1.5 rounded down; all three stack',
      m1 === m0 * ANOMALY_MAGNET_MUL && c1 === Math.floor(c0 * ANOMALY_CARGO_MUL) && c1 !== c0 * ANOMALY_CARGO_MUL && all &&
      far0 === 0 && far1 > 0,
      `magnet ${m0} → ${m1}, cargo ${c0} → ${c1}, stack ${all}, pickup moved ${far0.toFixed(2)} / ${far1.toFixed(2)} px`);
  }
  // Pull ×1.5: at the same fraction of reach, one frame of pull adds 1.5× the speed.
  {
    const v = buffs => { const h = make(); h.buffs = buffs; const p = h.player, d = h.stat('magnet') * 0.5;
      h.pickups = [{ x: p.x + d, y: p.y, vx: 0, vy: 0, kind: 'shard', age: 5, r: 4 }]; h.updatePickups(1 / 60); return -h.pickups[0].vx; };
    const v0 = v([]), v1 = v(['lodestone']);
    check('S-36 Lodestone pull: ×1.5 at the same fraction of its reach', Math.abs(v1 / v0 - ANOMALY_PULL_MUL) < 1e-9, `${v0.toFixed(2)} → ${v1.toFixed(2)}`);
  }
  // Stacking by touch: an open Lodestone site is taken while Overclock runs; a second Lodestone isn't.
  {
    const g = make(); g.anomaly.sites[0].kind = 'overclock'; g.anomaly.sites[1].kind = g.anomaly.sites[2].kind = 'lodestone';
    open(g, 0); updateAnomalies(g, 0.01); open(g, 1); updateAnomalies(g, 0.01); open(g, 2); updateAnomalies(g, 0.01);
    check('S-36 stacking: different kinds stack; the same kind can\'t be taken twice', g.buffs.join() === 'overclock,lodestone' && siteCharged(g, 2), `buffs ${g.buffs}`);
  }
  // Ballast: a Nexus deposit banks all the over-limit cargo, then the limit drops; a Surge death scatters it and keeps the buff.
  {
    const g = make(); g.buffs = ['ballast']; const base = Math.floor(g.stat('cargo') / ANOMALY_CARGO_MUL); g.cargo.shard = base + 6;
    g.player.x = g.nexus.x; g.player.y = g.nexus.y + CELL; step(g, Math.ceil((base + 8) * DEPOSIT_TICK_S * 60) + 10);
    const dead = make(4242, 'surge'); dead.buffs = ['ballast']; dead.cargo.shard = base + 4; dead.player.integrity = 1; dead.player.invuln = 0;
    dead.hurtPlayer(5, 0, 1); step(dead, 2);
    check('S-36 Ballast: a deposit banks all the over-limit cargo, then ends it; a death scatters cargo and keeps the raised limit',
      g.bank.shard === base + 6 && g.cargoTotal() === 0 && g.buffs.length === 0 && g.stat('cargo') === base &&
      dead.buffs.join() === 'ballast' && dead.cargoTotal() === 0 && dead.pickups.length >= base + 4,
      `bank ${g.bank.shard}/${base + 6}, buffs ${g.buffs}, limit ${g.stat('cargo')}; death buffs ${dead.buffs}, floor ${dead.pickups.length}`);
  }
}
module.exports = { nodeChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
