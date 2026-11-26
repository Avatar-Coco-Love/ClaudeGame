// S-53b (D-142, D-146): the biome creature weight gate. Per seed and mode, the surgebot mine route runs `--minutes` in a
// biome ring at the top build (base max), once with the creature and once without (`game.burrow.off` / `game.swarm.off`). The core starts
// on a cleared 3×3 pad mid-ring with a Relay placed there (a top-build player banks in the biome), mines only that ring's
// ore, and beams a surfaced Burrower like any foe. Haul = ◆-equivalent banked + still carried (◆ 1, ▲ ● 4, ≈ ⬟ 12;
// D-146). Gate: with / without in 0.85–0.95 for each mode, and Drift within 0.05 of Surge.
// S-56 (D-153) `--wards=2`: both runs keep that many Wards at the dig site (every 5 s, if the core is > 3 cells from all of
// them, they hop to open cells 2–4 cells round it, ≥ WARD_GAP apart, like a player re-placing them). Ward gate: ≤ 1.00 each.
// B-092 (D-155): the gates are defined on GATE_SEEDS (8) seeds; 4 seeds swing ±0.06 (Kiln 0.800 / 0.916, Shoal FAIL too), so a
// run with fewer seeds prints its ratios but no verdict. 8 / 12 / 16 seeds all PASS and converge (Kiln 16: 0.883 / 0.885).
// Usage: node tools/biomefoe.mjs [--biome=kiln|shoal] [--seeds=8] [--minutes=10] [--mode=drift,surge] [--wards=0] [--boss=off|on] [--v]
// S-62 (D-164): --boss=on keeps the lairs in the world (advice: do they skew the creature gate? logged in 09)
import { runBot } from './surgebot.mjs';
import { CELL, T, KILN_RING, UNDERTOW_RING, ORE_KIND, WARD_GAP } from '../src/config.js';
import { tryPlace } from '../src/craft.js';
import { makeWard } from '../src/ward.js';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
export const GATE_SEEDS = 8; // B-092: the seed count every gate verdict is defined on
const BIOMES = { // S-54: shoal = the mote swarm
  kiln: { ring: KILN_RING, ore: new Set(['shard', 'prism', 'calx']), off: g => { g.burrow.off = true; },
    stats: g => { const s = g.burrow; return { spawned: s.spawned, lunges: s.lunges, kills: s.kills, eaten: s.eaten, bitten: s.bitten, lost: s.lost }; } },
  shoal: { ring: UNDERTOW_RING, ore: new Set(['shard', 'prism', 'tide']), off: g => { g.swarm.off = true; },
    stats: g => { const s = g.swarm; return { spawned: s.spawned, touches: s.touches, hits: s.hits, kills: s.kills, taken: s.taken, carried: s.carried, cleared: s.cleared }; } },
};
const biome = BIOMES[arg('biome', 'kiln')], seeds = Number(arg('seeds', GATE_SEEDS)), minutes = Number(arg('minutes', 10));
const modes = arg('mode', 'drift,surge').split(','), V = process.argv.includes('--v'), WARDS = Number(arg('wards', 0)), BOSS = arg('boss', 'off');
/** S-56: keep WARDS Wards within 3 cells of the core: re-placed round it when it has moved on. */
function keepWards(g) {
  const w = g.world, p = g.player, cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL);
  if (g.wards.some(s => Math.hypot(s.x - p.x, s.y - p.y) <= 3 * CELL)) return;
  const open = [];
  for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d >= 2 && d <= 4 && w.get(x, y) === T.EMPTY) open.push({ x, y });
  }
  const pick = [];
  for (const c of open) if (pick.length < WARDS && pick.every(q => Math.hypot(q.x - c.x, q.y - c.y) >= WARD_GAP)) pick.push(c);
  if (pick.length) g.wards.splice(0, g.wards.length, ...pick.map(c => makeWard(w, c.y * w.w + c.x)));
}

export const WEIGHT = { shard: 1, prism: 4, lumen: 4, tide: 12, calx: 12 };
const worth = o => Object.entries(o).reduce((a, [k, n]) => a + (WEIGHT[k] || 0) * n, 0);

function run(seed, mode, creature) {
  let game = null;
  const setup = g => {
    game = g; const w = g.world;
    if (!creature) biome.off(g);
    // The ring's mid-distance cell on the axis farthest from vaults / Spires; a 3×3 pad there and the Relay on it.
    const cells = []; for (let i = 0; i < w.w * w.h; i++) if (w.rings[i] === biome.ring) cells.push(Math.hypot(i % w.w - w.cx, ((i / w.w) | 0) - w.cy));
    cells.sort((a, b) => a - b); const d = cells[cells.length >> 1];
    let best = null, bd = -1;
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8, x = Math.round(w.cx + Math.cos(a) * d), y = Math.round(w.cy + Math.sin(a) * d);
      const far = Math.min(...[...w.vaults, ...g.spires].map(v => Math.hypot(v.x - x, v.y - y)));
      if (w.ring(x, y) === biome.ring && far > bd) { bd = far; best = { x, y }; }
    }
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) w.destroy(best.x + dx, best.y + dy);
    Object.assign(g.player, { x: (best.x + 0.5) * CELL, y: (best.y + 0.5) * CELL, vx: 0, vy: 0 });
    g.craft.relay = 1; g.craft.last = 'relay'; tryPlace(g);
    g.bank0 = { ...g.bank };
  };
  const ore = i => game.world.rings[i] === biome.ring && biome.ore.has(ORE_KIND[game.world.cells[i]]);
  let wt = 0; const onTick = WARDS ? (g, dt) => { if ((wt -= dt) <= 0) { wt = 5; keepWards(g); } } : null;
  const r = runBot({ seed, route: 'mine', build: 'max', mode, minutes, weather: 'off', anomaly: 'off', boss: BOSS, setup, ore, onTick });
  const banked = {}; for (const k in game.bank) banked[k] = game.bank[k] - (game.bank0[k] || 0);
  return { ...r, haul: worth(banked) + worth(game.cargo), relay: game.relays.length, foe: biome.stats(game), shots: game.wardShots || 0 };
}

const med = v => { const s = [...v].sort((a, b) => a - b); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const ratios = {};
for (const mode of modes) {
  const on = [], off = [];
  for (let k = 1; k <= seeds; k++) {
    const a = run(k * 7919, mode, true), b = run(k * 7919, mode, false);
    if (V) console.log(JSON.stringify({ seed: k * 7919, mode, with: a, without: b }));
    on.push(a); off.push(b);
  }
  const sum = (rows, f) => rows.reduce((x, y) => x + f(y), 0);
  ratios[mode] = sum(on, r => r.haul) / Math.max(1e-9, sum(off, r => r.haul));
  console.log(`${mode}: haul with/without ${ratios[mode].toFixed(3)} (◆-eq/min with ${(sum(on, r => r.haul) / seeds / minutes).toFixed(1)}, without ${(sum(off, r => r.haul) / seeds / minutes).toFixed(1)}), ` +
    `${Object.keys(on[0].foe).map(k => `${k} ${sum(on, r => r.foe[k])}`).join(', ')}, ` +
    `deaths with ${sum(on, r => r.deaths)} / without ${sum(off, r => r.deaths)}, relay ${sum(on, r => r.relay)}/${seeds}, stuck ${sum(on, r => r.stuck) + sum(off, r => r.stuck)}, ward shots ${sum(on, r => r.shots)}, med haul ${med(on.map(r => r.haul)).toFixed(0)}/${med(off.map(r => r.haul)).toFixed(0)}`);
}
if (ratios.drift !== undefined && ratios.surge !== undefined) {
  const ok = WARDS ? Object.values(ratios).every(r => r <= 1) : Object.values(ratios).every(r => r >= 0.85 && r <= 0.95) && Math.abs(ratios.drift - ratios.surge) <= 0.05;
  if (seeds < GATE_SEEDS) console.log(`gate: no verdict (${seeds} seeds < ${GATE_SEEDS}: too few to gate on, B-092)`);
  else console.log(`gate (${WARDS ? `${WARDS} Wards: ≤ 1.00 each` : '0.85–0.95 each, modes within 0.05'}): ${ok ? 'PASS' : 'FAIL'} (gap ${Math.abs(ratios.drift - ratios.surge).toFixed(3)})`);
}
