// S-35 Anomalies checks (D-098, D-099). smoke.cjs calls nodeChecks. Node only: the same seed gives the same 16 sites;
// ring counts, spacing and exclusions over 20 seeds; a site in solid rock can't be taken; take -> beam ×1.5 (mining dps
// follows); Nexus and Relay deposits end it, a deposit of 0 items, a death and a mode switch don't; a second one of the
// same kind can't be taken; recharge at 300 s; a v14 save loads with none taken; a reload keeps the buff + taken sites.
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
  const { CELL, T, ANOMALY_COUNTS, ANOMALY_GAP, ANOMALY_RECHARGE_S, ANOMALY_BEAM_MUL, NEXUS_RADIUS, DEPOSIT_TICK_S } = C;
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
      if (counts.join() !== ANOMALY_COUNTS.join()) bad.push(`${seed} counts ${counts}`);
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
    const g = make(), s = g.anomaly.sites[0], b0 = g.stat('beam');
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
    const g = make(); open(g, 0); updateAnomalies(g, 0.01); open(g, 1); updateAnomalies(g, 0.01);
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
      Object.keys(old.anomaly.taken).length === 0 && old.buffs.length === 0 && back.buffs.join() === 'overclock' && back.anomaly.taken[3] === 20 + ANOMALY_RECHARGE_S &&
      !siteCharged(back, 3) && Object.keys(junk.anomaly.taken).length === 0 && junk.buffs.join() === 'overclock',
      `old ${JSON.stringify(old.anomaly.taken)}/${old.buffs}, back ${back.buffs}/${JSON.stringify(back.anomaly.taken)}, junk ${junk.buffs}`);
  }
}
module.exports = { nodeChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
