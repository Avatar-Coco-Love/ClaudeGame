// S-57a (D-152, D-156): the Rift gate. Per seed and mode, the biomefoe mining bot (top build, a Relay on a cleared pad
// mid-ring, only that ring's ore) runs `--minutes` with rifts on and off (`game.rift.force`). While a rift is open and one
// of its standing cells is within 12 cells of the core, the bot mines only rift cells (the detour). Creatures and weather
// off, so the ratio measures the rift alone. Haul = ◆-equivalent banked + carried (biomefoe's WEIGHT).
// Gate: on / off in 1.04–1.12 for each mode, Drift within 0.05 of Surge, on GATE_SEEDS (16) seeds in each ring (Deep, Kiln).
// Usage: node tools/eventrun.mjs [--ring=deep,kiln] [--seeds=16] [--minutes=10] [--mode=drift,surge] [--v]
import { runBot } from './surgebot.mjs';
import { CELL, T, KILN_RING, ORE_KIND } from '../src/config.js';
import { tryPlace } from '../src/craft.js';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
// D-156: a rift moves the haul 5–12 %, under one Surge run's swing (±10 %), so this gate is defined on 2 × biomefoe's
// GATE_SEEDS (8, D-155): 8 seeds put Deep Surge at 1.034 one run, 16 / 24 converge (≈ 1.09). Fewer = no verdict.
const GATE_SEEDS = 16;
const RINGS = { deep: { ring: 2, ore: new Set(['shard', 'prism', 'lumen']) }, kiln: { ring: KILN_RING, ore: new Set(['shard', 'prism', 'calx']) } };
const WEIGHT = { shard: 1, prism: 4, lumen: 4, tide: 12, calx: 12 };
const DETOUR = 12; // cells
const worth = o => Object.entries(o).reduce((a, [k, n]) => a + (WEIGHT[k] || 0) * n, 0);
const seeds = Number(arg('seeds', GATE_SEEDS)), minutes = Number(arg('minutes', 10)), modes = arg('mode', 'drift,surge').split(','), V = process.argv.includes('--v');

function run(seed, mode, rings, on) {
  let game = null;
  const setup = g => { // biomefoe's pad: the ring's mid-distance cell on the axis farthest from vaults / Spires
    game = g; const w = g.world;
    g.burrow.off = true; g.swarm.off = true;
    const cells = []; for (let i = 0; i < w.w * w.h; i++) if (w.rings[i] === rings.ring) cells.push(Math.hypot(i % w.w - w.cx, ((i / w.w) | 0) - w.cy));
    cells.sort((a, b) => a - b); const d = cells[cells.length >> 1];
    let best = null, bd = -1;
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8, x = Math.round(w.cx + Math.cos(a) * d), y = Math.round(w.cy + Math.sin(a) * d);
      const far = Math.min(...[...w.vaults, ...g.spires].map(v => Math.hypot(v.x - x, v.y - y)));
      if (w.ring(x, y) === rings.ring && far > bd) { bd = far; best = { x, y }; }
    }
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) w.destroy(best.x + dx, best.y + dy);
    Object.assign(g.player, { x: (best.x + 0.5) * CELL, y: (best.y + 0.5) * CELL, vx: 0, vy: 0 });
    g.craft.relay = 1; g.craft.last = 'relay'; tryPlace(g);
    g.bank0 = { ...g.bank };
  };
  const riftCell = i => { const o = game.rift.open; return !!o && o.cells.some(c => c.y * game.world.w + c.x === i && game.world.cells[i] !== T.EMPTY); };
  const detour = () => { const o = game.rift.open, p = game.player; if (!o) return false;
    return o.cells.some(c => game.world.get(c.x, c.y) !== T.EMPTY && Math.hypot((c.x + 0.5) * CELL - p.x, (c.y + 0.5) * CELL - p.y) <= DETOUR * CELL); };
  const ore = i => detour() ? riftCell(i) : game.world.rings[i] === rings.ring && rings.ore.has(ORE_KIND[game.world.cells[i]]);
  const r = runBot({ seed, route: 'mine', build: 'max', mode, minutes, weather: 'off', anomaly: 'off', rift: on ? 'on' : 'off', setup, ore });
  const banked = {}; for (const k in game.bank) banked[k] = game.bank[k] - (game.bank0[k] || 0);
  return { ...r, haul: worth(banked) + worth(game.cargo), rifts: game.rift.opened, mined: game.rift.mined + (game.rift.open ? game.rift.open.cells.filter(c => game.world.get(c.x, c.y) === T.EMPTY).length : 0) };
}

let all = true, verdict = seeds >= GATE_SEEDS;
for (const name of arg('ring', 'deep,kiln').split(',')) {
  const rings = RINGS[name], ratios = {};
  for (const mode of modes) {
    let a = 0, b = 0, n = 0, m = 0;
    for (let k = 1; k <= seeds; k++) {
      const x = run(k * 7919, mode, rings, true), y = run(k * 7919, mode, rings, false);
      if (V) console.log(JSON.stringify({ ring: name, seed: k * 7919, mode, on: x.haul, off: y.haul, rifts: x.rifts, mined: x.mined }));
      a += x.haul; b += y.haul; n += x.rifts; m += x.mined;
    }
    ratios[mode] = a / Math.max(1e-9, b);
    console.log(`${name} ${mode}: haul on/off ${ratios[mode].toFixed(3)} (◆-eq/min on ${(a / seeds / minutes).toFixed(1)}, off ${(b / seeds / minutes).toFixed(1)}), rifts ${n}, cells mined ${m}/${n * 9}`);
  }
  if (ratios.drift !== undefined && ratios.surge !== undefined) {
    const gap = Math.abs(ratios.drift - ratios.surge), ok = Object.values(ratios).every(r => r >= 1.04 && r <= 1.12) && gap <= 0.05;
    all = all && ok;
    console.log(`${name} gap ${gap.toFixed(3)}: ${ok ? 'pass' : 'fail'}`);
  } else verdict = false;
}
console.log(verdict ? `gate (1.04–1.12 each, modes within 0.05; Deep + Kiln): ${all ? 'PASS' : 'FAIL'}` : `gate: no verdict (needs ${GATE_SEEDS} seeds, both modes)`);
