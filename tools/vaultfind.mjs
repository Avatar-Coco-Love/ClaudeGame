// Q-010 probe (design session 22): how often does a player find a vault by chance on the way to the Scanner?
// A bot leaves the Nexus in Drift and tunnels to Lumen cells one after another (nearest unbroken one each time, so it fans out
// the way a greedy player would), until it has broken LUMEN_GOAL of them (the Scanner costs 10●). It reports, per seed:
//   seen   = vaults with any cell explored (the core's 230 px reveal disc touched it: what the player could have noticed),
//   ping   = vaults with any shell cell within SCAN_RADIUS of a break spot (a ping there would reach it, if it showed vaults),
//   opened = caches broken by accident.
// Usage: node tools/vaultfind.mjs [seeds = 20] [lumen goal = 10] [upgrade level for every stat = 2]
import { Game } from '../src/game.js';
import { CELL, T, SCAN_RADIUS } from '../src/config.js';

const BEAM_MODE = process.env.MODE || 'focus';
const audio = new Proxy({}, { get: () => () => {} });
const [SEEDS = 20, GOAL = 10, LVL = 2] = process.argv.slice(2, 5).map(Number);
const dt = 1 / 60, CAP = 1800, clamp = v => Math.max(-1, Math.min(1, v));

function run(seed) {
  const g = new Game({ seed, mode: 'drift', audio });
  for (const k in g.upgrades) g.upgrades[k] = LVL;
  if (BEAM_MODE !== 'focus') g.research[BEAM_MODE] = true; g.beamMode = BEAM_MODE; // Q-011 (design 27): MODE=wide env picks the beam mode
  const w = g.world, spots = [];
  let t = 0, got = 0;
  while (got < GOAL && t < CAP) {
    const p = g.player, gx = p.x / CELL, gy = p.y / CELL;
    let target = null, best = Infinity;
    for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) {
      if (w.get(x, y) !== T.LUMEN) continue;
      const d = Math.hypot(x + 0.5 - gx, y + 0.5 - gy);
      if (d < best) { best = d; target = { x, y }; }
    }
    if (!target) break;
    const goal = { x: (target.x + 0.5) * CELL, y: (target.y + 0.5) * CELL };
    for (; t < CAP && w.get(target.x, target.y) === T.LUMEN; t += dt) {
      const m = Math.hypot(goal.x - p.x, goal.y - p.y) || 1;
      g.update(dt, { move: { x: clamp((goal.x - p.x) / m * 2), y: clamp((goal.y - p.y) / m * 2) }, fire: true, aim: { x: goal.x - p.x, y: goal.y - p.y } });
    }
    if (w.get(target.x, target.y) !== T.LUMEN) { got++; spots.push(target); }
  }
  let seen = 0, ping = 0, opened = 0;
  for (const v of w.vaults) {
    if (v.cells.some(i => w.explored[i])) seen++;
    if (v.cells.some(i => spots.some(s => Math.hypot((i % w.w) - s.x, Math.floor(i / w.w) - s.y) <= SCAN_RADIUS))) ping++;
    if (w.get(v.x, v.y) !== T.CACHE) opened++;
  }
  return { seed, t, got, vaults: w.vaults.length, seen, ping, opened };
}

const rows = [];
for (let s = 1; s <= SEEDS; s++) rows.push(run(s * 7919));
const sum = k => rows.reduce((a, r) => a + r[k], 0);
const share = k => rows.filter(r => r[k] > 0).length;
console.log(`mode=${BEAM_MODE} lvl=${LVL} goal=${GOAL}● ${SEEDS} seeds: mean ${(sum('t') / SEEDS).toFixed(0)} s, reached goal ${rows.filter(r => r.got >= GOAL).length}/${SEEDS}`);
console.log(`vaults seen ${sum('seen')}/${sum('vaults')} (runs with >=1: ${share('seen')}/${SEEDS}), ` +
  `within a ping of a break ${sum('ping')}/${sum('vaults')} (runs with >=1: ${share('ping')}/${SEEDS}), caches opened ${sum('opened')}`);
