// D-002 parity probe (audit session 9): the SAME greedy mining bot plays Drift and Surge on the same seeds and reports
// banked income per minute. It tunnels in a straight line to the nearest Prism (or Crystal) cell, ore on the way counts too,
// hoovers up loose pickups within 260 px, heads home when cargo is full, and in Surge beams any Glitch in range first.
// Usage: node tools/parity.mjs [upgrade level 0-6 = 0] [seconds = 600] [seeds = 10] [ore to hunt: prism | crystal = prism]
import { Game } from '../src/game.js';
import { CELL, T } from '../src/config.js';

const BEAM_MODE = process.env.MODE || 'focus';
const audio = new Proxy({}, { get: () => () => {} });
const [LVL = 0, SECS = 600, SEEDS = 10] = process.argv.slice(2, 5).map(Number);
const ORE = process.argv[5] === 'crystal' ? T.CRYSTAL : T.PRISM;
const dt = 1 / 60, clamp = v => Math.max(-1, Math.min(1, v));

function run(seed, mode) {
  const g = new Game({ seed, mode, audio });
  for (const k in g.upgrades) g.upgrades[k] = LVL;
  if (BEAM_MODE !== 'focus') g.research[BEAM_MODE] = true; g.beamMode = BEAM_MODE; // Q-011 (design 27): MODE=wide env picks the beam mode
  g.player.integrity = g.stat('hull');
  const w = g.world, ores = [];
  for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) if (w.get(x, y) === ORE) ores.push({ x, y });
  let deaths = 0, target = null;
  const notify = g.notify.bind(g); g.notify = e => { if (e === 'destabilized') deaths++; notify(e); };
  for (let t = 0; t < SECS; t += dt) {
    const p = g.player;
    if (!target || w.get(target.x, target.y) !== ORE) {
      target = null; let bd = Infinity;
      for (const c of ores) if (w.get(c.x, c.y) === ORE) {
        const d = Math.hypot((c.x + 0.5) * CELL - p.x, (c.y + 0.5) * CELL - p.y);
        if (d < bd) { bd = d; target = c; }
      }
    }
    let goal;
    if (g.cargoRoom() <= 0) goal = g.nexus;
    else {
      let near = null, nd = 260;
      for (const it of g.pickups) { const d = Math.hypot(it.x - p.x, it.y - p.y); if (d < nd) { nd = d; near = it; } }
      goal = near || (target ? { x: (target.x + 0.5) * CELL, y: (target.y + 0.5) * CELL } : g.nexus);
    }
    let aim = { x: goal.x - p.x, y: goal.y - p.y };
    let foe = null, fd = g.stat('range') + 20;
    for (const e of g.enemies) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (e.fade === undefined && d < fd) { fd = d; foe = e; } }
    if (foe) aim = { x: foe.x - p.x, y: foe.y - p.y };
    const m = Math.hypot(goal.x - p.x, goal.y - p.y) || 1;
    g.update(dt, { move: { x: clamp((goal.x - p.x) / m * 2), y: clamp((goal.y - p.y) / m * 2) }, fire: true, aim });
  }
  return { prism: g.bank.prism + g.cargo.prism, shard: g.bank.shard + g.cargo.shard, kills: g.stats.glitches, deaths };
}

const sum = { drift: { prism: 0, shard: 0, kills: 0, deaths: 0 }, surge: { prism: 0, shard: 0, kills: 0, deaths: 0 } };
for (let s = 1; s <= SEEDS; s++) for (const mode of ['drift', 'surge']) {
  const r = run(s * 7919, mode);
  for (const k in sum[mode]) sum[mode][k] += r[k];
}
const min = SECS / 60 * SEEDS, f = v => (v / min).toFixed(2);
for (const mode of ['drift', 'surge'])
  console.log(`${BEAM_MODE} ${mode.padEnd(5)} hunt=${ORE === T.PRISM ? 'prism' : 'crystal'} lvl=${LVL} ${SEEDS} seeds x ${SECS}s: prisms/min ${f(sum[mode].prism)}, shards/min ${f(sum[mode].shard)}, ` +
    `kills/min ${f(sum[mode].kills)}, deaths/min ${f(sum[mode].deaths)}`);
console.log(`surge/drift prism ratio ${(sum.surge.prism / sum.drift.prism).toFixed(2)}, shard ratio ${(sum.surge.shard / sum.drift.shard).toFixed(2)}`);
