// S-47 probe (D-124): what the Shoal Undertow costs a haul. A straight-line bot (Drift) tunnels from the Nexus out to
// d 90 (10 cells into the Shoal) on a seeded bearing, fills its cargo there, and flies home through its own tunnel until
// it is inside the Nexus ring. The same seed runs with the Undertow on and off (`game.undertow.off`, the dev flag);
// a pair where either run hits the cap (a Spire core in the way) is dropped. The spec's bar: median ratio ≤ 1.15.
// Usage: node tools/haulrun.mjs [seeds = 20] [upgrade level = 3]   ·   import { haulRun } for tests
import { Game } from '../src/game.js';
import { CELL } from '../src/config.js';
import { mulberry32 } from '../src/world.js';

const audio = new Proxy({}, { get: () => () => {} });
const dt = 1 / 60, CAP = 900, D = 90, clamp = v => Math.max(-1, Math.min(1, v));

/** Seconds for one round trip (Infinity at the cap). */
export function haulRun(seed, { undertow = true, level = 3 } = {}) {
  const g = new Game({ seed, mode: 'drift', audio });
  for (const k in g.upgrades) g.upgrades[k] = level;
  g.undertow.off = !undertow;
  const a = mulberry32(seed ^ 0x5bd1e995)() * Math.PI * 2, n = g.nexus;
  const goal = { x: n.x + Math.cos(a) * D * CELL, y: n.y + Math.sin(a) * D * CELL };
  let t = 0, home = false;
  for (; t < CAP; t += dt) {
    const p = g.player, to = home ? n : goal, dx = to.x - p.x, dy = to.y - p.y, m = Math.hypot(dx, dy) || 1;
    if (!home && m < CELL / 2) { home = true; for (const k in g.cargo) g.cargo[k] = 0; g.cargo.shard = g.cargoRoom(); continue; }
    if (home && g.inNexus()) return t;
    g.update(dt, { move: { x: clamp(dx / m * 2), y: clamp(dy / m * 2) }, fire: true, aim: { x: dx, y: dy } });
    g.events && (g.events.length = 0);
  }
  return Infinity;
}

/** Median of on/off ratios over `seeds` seeds, plus the rows. */
export function haulProbe(seeds = 20, level = 3) {
  const rows = [];
  for (let s = 1; s <= seeds; s++) {
    const seed = s * 7919, on = haulRun(seed, { undertow: true, level }), off = haulRun(seed, { undertow: false, level });
    rows.push({ seed, on, off, r: on / off });
  }
  const ok = rows.filter(r => Number.isFinite(r.on) && Number.isFinite(r.off)), rs = ok.map(r => r.r).sort((x, y) => x - y);
  return { rows, kept: ok.length, median: rs.length ? rs[Math.floor(rs.length / 2)] : NaN, max: rs[rs.length - 1],
    mean: rs.reduce((a, b) => a + b, 0) / rs.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [SEEDS = 20, LEVEL = 3] = process.argv.slice(2, 4).map(Number);
  const r = haulProbe(SEEDS, LEVEL);
  for (const x of r.rows) console.log(`seed ${x.seed}: on ${x.on.toFixed(1)} s, off ${x.off.toFixed(1)} s, ×${x.r.toFixed(3)}`);
  console.log(`level ${LEVEL}, ${r.kept}/${SEEDS} pairs: median round trip ×${r.median.toFixed(3)} (mean ×${r.mean.toFixed(3)}, max ×${r.max.toFixed(3)}) with the Undertow`);
}
