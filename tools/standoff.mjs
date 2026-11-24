// Q-011 standoff probe (Design 37, D-054): the route the mining probes never test, reach against Glitches.
// Open 45×45 arena 36 cells out, Surge, no natural spawns. Glitches of one tier come straight in from 420 px at seeded angles
// (single, a wave of 3 every 0.6 s, a wave of 5 every 0.5 s). The bot aims at the nearest live Glitch and holds fire while
// one is within its mode's reach (Pulse: holds fire whenever one is alive, as a player charging ahead would); KITE=1 also backs
// away once the nearest is inside 0.8× reach. Beam Power and Range are both at the level given. 20 angle seeds per cell.
// Reports mean hull lost (hp, 100 max) and deaths per 20. Usage: node tools/standoff.mjs [KITE=1]
import { Game } from '../src/game.js';
import { T, CELL, GLITCH_TIER, GLITCH_R, BEAM_MODES, PULSE_RANGE } from '../src/config.js';

const audio = new Proxy({}, { get: () => () => {} });
const mulberry = a => () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const KITE = process.env.KITE === '1';

function run(mode, lvl, tier, n, gap, seed) {
  const g = new Game({ seed: 77, mode: 'surge', audio }), w = g.world, cx = w.cx + 36, cy = w.cy;
  for (let y = cy - 22; y <= cy + 22; y++) for (let x = cx - 22; x <= cx + 22; x++) w.cells[w.idx(x, y)] = T.EMPTY;
  Object.assign(g.player, { x: (cx + 0.5) * CELL, y: (cy + 0.5) * CELL, vx: 0, vy: 0 });
  g.upgrades.beam = lvl; g.upgrades.range = lvl; g.player.integrity = g.stat('hull');
  if (mode !== 'focus') { g.research[mode] = true; g.beamMode = mode; }
  const M = BEAM_MODES[mode], reach0 = g.stat('range') * (M.pulse ? PULSE_RANGE : M.range), rnd = mulberry(seed);
  const hp = GLITCH_TIER.hp[0] + tier * GLITCH_TIER.hp[1], angles = Array.from({ length: n }, () => rnd() * Math.PI * 2);
  let t = 0, spawned = 0, lost = 0, deaths = 0, prev = g.player.integrity;
  while (t < 30 && !(spawned === n && g.enemies.length === 0)) {
    g.spawnTimer = 1e9;
    while (spawned < n && spawned * gap <= t) {
      const a = angles[spawned++], p = g.player;
      g.enemies.push({ x: p.x + Math.cos(a) * 420, y: p.y + Math.sin(a) * 420, r: GLITCH_R, vx: 0, vy: 0, tier, hp, maxHp: hp,
        speed: GLITCH_TIER.speed[0] + tier * GLITCH_TIER.speed[1], dmg: GLITCH_TIER.dmg[0] + tier * GLITCH_TIER.dmg[1],
        spin: 0, flash: 0, hitCd: 0.5, wander: 0, alert: false });
    }
    const p = g.player; let near = null, nd = Infinity;
    for (const e of g.enemies) { if (e.fade !== undefined) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < nd) { nd = d; near = e; } }
    let fire = false, aim = null, move = { x: 0, y: 0 };
    if (near) {
      aim = { x: near.x - p.x, y: near.y - p.y };
      const reach = reach0 + near.r;
      fire = M.pulse ? true : nd <= reach;
      if (KITE && nd < reach * 0.8) { const k = Math.hypot(aim.x, aim.y); move = { x: -aim.x / k, y: -aim.y / k }; }
    }
    g.update(1 / 60, { move, aim, fire });
    if (g.player.integrity < prev) lost += prev - g.player.integrity;
    if (g.player.integrity > prev + 50) deaths++; // destabilize() refills the hull
    prev = g.player.integrity; t += 1 / 60;
  }
  return { lost: Math.min(lost, 100), deaths };
}

const rows = [];
for (const [name, n, gap] of [['single', 1, 0], ['wave3', 3, 0.6], ['wave5', 5, 0.5]])
  for (const lvl of [0, 2, 4]) for (const tier of [0, 1, 2, 3]) {
    const row = { route: name + (KITE ? '+kite' : ''), lvl, tier };
    for (const mode of Object.keys(BEAM_MODES)) {
      let L = 0, D = 0;
      for (let s = 1; s <= 20; s++) { const r = run(mode, lvl, tier, n, gap, s * 7919); L += r.lost; D += r.deaths; }
      row[mode] = `${Math.round(L / 20)}hp${D ? ' d' + D : ''}`;
    }
    rows.push(row);
  }
console.table(rows);
