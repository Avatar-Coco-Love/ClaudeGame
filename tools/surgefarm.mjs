// Q-007 probe (design session 7): a Surge bot parked in a cleared room, beaming the nearest Glitch. Headless, Node only.
// Usage: node tools/surgefarm.mjs <distance px from Nexus> <upgrade level 0-6> <seconds> [room radius cells = 6]
// Reports kills/min (each kill drops 2-5◆, plus 1▲ half the time: D-018), deaths/min, and how many Glitches alive at the end are stuck on rock.
import { Game } from '../src/game.js';
import { CELL, T } from '../src/config.js';

const audio = new Proxy({}, { get: () => () => {} });
const [D = 1000, LVL = 0, SECS = 300, RAD = 6] = process.argv.slice(2).map(Number);
const SEEDS = 10, dt = 1 / 60;
let kills = 0, deaths = 0, alive = 0, stuck = 0;
for (let s = 1; s <= SEEDS; s++) {
  const g = new Game({ seed: s * 7919, mode: 'surge', audio });
  for (const k in g.upgrades) g.upgrades[k] = LVL;
  g.player.integrity = g.stat('hull');
  const cx = Math.floor((g.nexus.x + D) / CELL), cy = Math.floor(g.nexus.y / CELL);
  for (let y = cy - RAD; y <= cy + RAD; y++) for (let x = cx - RAD; x <= cx + RAD; x++)
    if (Math.hypot(x - cx, y - cy) <= RAD && g.world.get(x, y) !== T.BEDROCK) g.world.cells[g.world.idx(x, y)] = T.EMPTY;
  const home = { x: (cx + 0.5) * CELL, y: (cy + 0.5) * CELL };
  g.player.x = home.x; g.player.y = home.y;
  const notify = g.notify.bind(g); g.notify = e => { if (e === 'destabilized') deaths++; notify(e); };
  let last = new Map();
  for (let t = 0; t < SECS; t += dt) {
    const p = g.player;
    if (Math.hypot(p.x - g.nexus.x, p.y - g.nexus.y) < 300) { p.x = home.x; p.y = home.y; } // free walk back after a death
    let best = null;
    for (const e of g.enemies) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (!best || d < best.d) best = { e, d }; }
    const clamp = v => Math.max(-1, Math.min(1, v));
    g.update(dt, { move: { x: clamp((home.x - p.x) / 60), y: clamp((home.y - p.y) / 60) },
      fire: !!best && best.d < g.stat('range') + 20, aim: best ? { x: best.e.x - p.x, y: best.e.y - p.y } : null });
    g.cargo = { shard: 0, prism: 0 }; // count drops, not carrying
    if (SECS - t < 4 + dt && SECS - t >= 4) last = new Map(g.enemies.map(e => [e, Math.hypot(e.x - p.x, e.y - p.y)]));
  }
  kills += g.stats.glitches;
  for (const e of g.enemies) if (last.has(e)) { alive++; if (last.get(e) - Math.hypot(e.x - g.player.x, e.y - g.player.y) < 32) stuck++; }
}
const min = SECS / 60 * SEEDS;
console.log(`D=${D}px lvl=${LVL} room=${RAD} cells, ${SEEDS} seeds x ${SECS}s: kills/min ${(kills / min).toFixed(2)}, deaths/min ${(deaths / min).toFixed(2)}, ` +
  `Glitches alive at end ${alive}, of which stuck (closed < 32 px in the last 4 s) ${stuck}`);
