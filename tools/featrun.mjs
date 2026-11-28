// S-67 (D-219): the Charted probe. Per seed and size, the core (max build, Radiance max) travels to every vault, Spire and
// lair once, nearest first by straight line from where it stands, along surgebot's dig-cost path search (`search`: walls
// are never dug, everything else is mined through). Each cell on the path reveals CORE_REVEAL round its centre, the same
// world.reveal the game runs every frame (no line of sight, so the path decides the share). The bare route visits the
// Spires only (what the ending needs). Explored share is mode-free (no Glitch reveals cells), so one mode.
// Gate (PASS, D-222): the bare route reaches the size's `chart` share (WORLD_PROFILES) on no seed, in both sizes; in a
// 256 world the full route reaches it on every seed. A 160 world can't split them (bare max 38.6 % > full min 33.2 %,
// the Radiance disc covers much of it), so there the full route is reported, not gated: Charted asks for digging past
// the landmarks. Tune (S-67): 256 bare median 13.5 % × 1.3 = 17.6 → 20 %, under the full route's lowest 20.5 %.
// Usage: node tools/featrun.mjs [--seeds=8] [--size=160,256] [--v]   (RAD=n sets the Radiance level, default max)
import { Game } from '../src/game.js';
import { search } from './surgebot.mjs';
import { exploredShare } from '../src/feats.js';
import { CELL, UPGRADES, CORE_REVEAL, NEXUS_UPGRADES, WORLD_PROFILES } from '../src/config.js';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const GATE_SEEDS = 8; // B-092 (D-155): the seed count every gate verdict is defined on (biomefoe's)
const seeds = Number(arg('seeds', GATE_SEEDS)), sizes = arg('size', '160,256').split(',').map(Number), V = process.argv.includes('--v');
const audio = new Proxy({}, { get: () => () => {} });
const REACH = { vault: 4, spire: 3, lair: 7 }; // cells from the target's centre that count as there (its walls are never dug)

function route(seed, size, bare) {
  const g = new Game({ seed, mode: 'drift', audio, size }), w = g.world, W = w.w;
  for (const u of UPGRADES) g.upgrades[u.id] = u.max;
  g.nexusLevels.radiance = process.env.RAD ? Number(process.env.RAD) : NEXUS_UPGRADES.find(u => u.id === 'radiance').max; w.reveal(g.nexus.x, g.nexus.y, g.nexusLight());
  const cross = CELL / g.stat('thrust');
  const goals = [...g.spires.map(s => ({ ...s, r: REACH.spire }))];
  if (!bare) goals.push(...w.vaults.map(v => ({ x: v.x, y: v.y, r: REACH.vault })), ...(g.bosses?.list || []).map(B => ({ x: B.x, y: B.y, r: REACH.lair })));
  let here = Math.floor(g.player.y / CELL) * W + Math.floor(g.player.x / CELL), missed = 0, legs = 0;
  while (goals.length) {
    const hx = here % W, hy = (here / W) | 0;
    goals.sort((a, b) => Math.hypot(a.x - hx, a.y - hy) - Math.hypot(b.x - hx, b.y - hy));
    const q = goals.shift(), d = i => Math.hypot(i % W - q.x, ((i / W) | 0) - q.y);
    const p = search(g, here, i => d(i) <= q.r, i => Math.max(0, d(i) - q.r) * cross);
    if (!p) { missed++; continue; }
    for (const i of p.path) w.reveal((i % W + 0.5) * CELL, (((i / W) | 0) + 0.5) * CELL, CORE_REVEAL);
    here = p.end; legs++;
  }
  return { share: exploredShare(g), legs, missed };
}

const med = a => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const pc = v => `${(v * 100).toFixed(1)} %`;
let ok = true;
for (const size of sizes) {
  const full = [], bare = []; let missed = 0;
  for (let k = 1; k <= seeds; k++) {
    const f = route(k * 7919, size, false), b = route(k * 7919, size, true);
    full.push(f.share); bare.push(b.share); missed += f.missed + b.missed;
    if (V) console.log(JSON.stringify({ size, seed: k * 7919, full: +f.share.toFixed(4), bare: +b.share.toFixed(4), legs: f.legs, missed: f.missed + b.missed }));
  }
  const need = WORLD_PROFILES[size].chart, reach = full.filter(s => s >= need).length;
  const pass = bare.every(s => s < need) && (size === 160 || reach === full.length) && !missed;
  ok = ok && pass;
  console.log(`${size}: full route min ${pc(Math.min(...full))} median ${pc(med(full))}; bare (Spires) median ${pc(med(bare))} max ${pc(Math.max(...bare))}` +
    ` → bare × 1.3 ${pc(med(bare) * 1.3)}; chart ${pc(need)}: full reaches it on ${reach}/${full.length}; unreachable goals ${missed}: ${pass ? 'pass' : 'fail'}`);
}
console.log(seeds >= GATE_SEEDS ? `chart gate (bare route never reaches chart; 256 full route on every seed): ${ok ? 'PASS' : 'FAIL'}`
  : `chart gate: no verdict (needs ${GATE_SEEDS} seeds)`);
