// Q-008 probe (design session 17): how long does a core at a given Beam Power take to reach the first would-be Lumen cell?
// Lumen cells follow the S-10 spec (ROCK/DENSE at d >= 55 where noise(seed ^ 0x27d4eb2f) at (x/5, y/5) > 0.80); nothing is
// re-typed, the probe only picks the nearest such cell. A straight-line bot leaves the Nexus in Drift, tunnels to it and reports
// the seconds until it breaks, plus the share spent past the Deep border. `hpMul` overrides the Deep ring's toughness.
// Usage: node tools/deeprun.mjs [beam level = 0] [seeds = 20] [deep hpMul = config] [other upgrades = 0]
import { Game } from '../src/game.js';
import { CELL, T, RINGS } from '../src/config.js';
import { mulberry32 } from '../src/world.js';

const BEAM_MODE = process.env.MODE || 'focus';
const audio = new Proxy({}, { get: () => () => {} });
const [BEAM = 0, SEEDS = 20, MUL = NaN, REST = 0] = process.argv.slice(2, 6).map(Number);
if (!Number.isNaN(MUL)) RINGS[RINGS.length - 1].hpMul = MUL;
const dt = 1 / 60, CAP = 900, clamp = v => Math.max(-1, Math.min(1, v));

function makeNoise(seed) { // copy of world.js makeNoise (not exported)
  const rand = mulberry32(seed), table = new Float32Array(65536);
  for (let i = 0; i < table.length; i++) table[i] = rand();
  const at = (x, y) => table[((y & 255) << 8) | (x & 255)], s = t => t * t * (3 - 2 * t);
  const v = (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = s(x - x0), fy = s(y - y0);
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
  };
  return (x, y) => v(x, y) * 0.65 + v(x * 2.1 + 17.3, y * 2.1 + 5.9) * 0.35;
}

function run(seed) {
  const g = new Game({ seed, mode: 'drift', audio });
  for (const k in g.upgrades) g.upgrades[k] = REST;
  g.upgrades.beam = BEAM;
  if (BEAM_MODE !== 'focus') g.research[BEAM_MODE] = true; g.beamMode = BEAM_MODE; // Q-011 (design 27): MODE=wide env picks the beam mode
  const w = g.world, n = makeNoise(seed ^ 0x27d4eb2f);
  let target = null, best = Infinity;
  for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) {
    const c = w.get(x, y), d = Math.hypot(x + 0.5 - w.cx, y + 0.5 - w.cy);
    if ((c === T.LUMEN || ((c === T.ROCK || c === T.DENSE) && n(x / 5, y / 5) > 0.8)) && d >= 55 && d < best) { best = d; target = { x, y }; }
  }
  const goal = { x: (target.x + 0.5) * CELL, y: (target.y + 0.5) * CELL };
  let t = 0, deep = 0;
  for (; t < CAP && w.solid(target.x, target.y); t += dt) {
    const p = g.player, m = Math.hypot(goal.x - p.x, goal.y - p.y) || 1;
    if (w.ring(Math.floor(p.x / CELL), Math.floor(p.y / CELL)) === RINGS.length - 1) deep += dt;
    g.update(dt, { move: { x: clamp((goal.x - p.x) / m * 2), y: clamp((goal.y - p.y) / m * 2) }, fire: true, aim: { x: goal.x - p.x, y: goal.y - p.y } });
  }
  return { t, deep, d: best };
}

const rows = [];
for (let s = 1; s <= SEEDS; s++) rows.push(run(s * 7919));
const ts = rows.map(r => r.t).sort((a, b) => a - b), q = f => ts[Math.min(ts.length - 1, Math.floor(f * ts.length))].toFixed(0);
const avg = k => (rows.reduce((a, r) => a + r[k], 0) / rows.length).toFixed(0);
console.log(`mode=${BEAM_MODE} beam=${BEAM} rest=${REST} deep hpMul=${RINGS[RINGS.length - 1].hpMul} ${SEEDS} seeds: first-Lumen s median ${q(0.5)}, p90 ${q(0.9)}, ` +
  `max ${q(1)}, mean ${avg('t')} (in Deep ${avg('deep')}), target d mean ${avg('d')}, capped ${rows.filter(r => r.t >= CAP).length}`);
