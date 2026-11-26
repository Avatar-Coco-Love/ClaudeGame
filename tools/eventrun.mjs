// S-57a (D-152, D-156): the Rift gate. Per seed and mode, the biomefoe mining bot (top build, a Relay on a cleared pad
// mid-ring, only that ring's ore) runs `--minutes` with rifts on and off (`game.rift.force`). While a rift is open and one
// of its standing cells is within 12 cells of the core, the bot mines only rift cells (the detour). Creatures and weather
// off, so the ratio measures the rift alone. Haul = ◆-equivalent banked + carried (biomefoe's WEIGHT).
// Gate: on / off in 1.04–1.12 for each mode, Drift within 0.05 of Surge, on GATE_SEEDS (16) seeds in each ring (Deep, Kiln).
// S-64 (D-175) `--call`: the Lens gate. Natural rifts off (`force` 'calls'), the Lens built; policy **mine** never calls,
// **call** calls on cooldown (callRift when callBlock is '') and takes the pocket by the same detour. Rings Deep / Shoal / Kiln.
// Gate: call / mine gross ore value ≤ 1.25 (VALUE weights), call − mine ▲ (spent included) < 0, Drift / Surge ratio 0.8–1.25.
// Usage: node tools/eventrun.mjs [--call] [--ring=deep,kiln] [--seeds=16] [--minutes=10] [--mode=drift,surge] [--v]
import { runBot } from './surgebot.mjs';
import { callBlock, callRift } from '../src/rift.js';
import { CELL, T, RIFT_CALL_COST, KILN_RING, TIDE_RING, ORE_KIND } from '../src/config.js';
import { tryPlace } from '../src/craft.js';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
// D-156: a rift moves the haul 5–12 %, under one Surge run's swing (±10 %), so this gate is defined on 2 × biomefoe's
// GATE_SEEDS (8, D-155): 8 seeds put Deep Surge at 1.034 one run, 16 / 24 converge (≈ 1.09). Fewer = no verdict.
const GATE_SEEDS = 16;
const RINGS = { deep: { ring: 2, ore: new Set(['shard', 'prism', 'lumen']) }, shoal: { ring: TIDE_RING, ore: new Set(['shard', 'prism', 'tide']) }, kiln: { ring: KILN_RING, ore: new Set(['shard', 'prism', 'calx']) } };
const CALL = process.argv.includes('--call'), VALUE = { shard: 1, prism: 3, lumen: 4, tide: 12, calx: 12 }; // S-64's weights (D-156's)
const WEIGHT = { shard: 1, prism: 4, lumen: 4, tide: 12, calx: 12 };
const DETOUR = 12; // cells
const worth = o => Object.entries(o).reduce((a, [k, n]) => a + (WEIGHT[k] || 0) * n, 0);
const seeds = Number(arg('seeds', GATE_SEEDS)), minutes = Number(arg('minutes', 10)), modes = arg('mode', 'drift,surge').split(','), V = process.argv.includes('--v');

function run(seed, mode, rings, on, lens = null) { // lens: null (S-57a) | 'mine' | 'call' (S-64)
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
    if (lens) { g.rift.force = 'calls'; g.nexusLevels.lens = 1; }
    g.bank0 = { ...g.bank };
  };
  let spent = 0;
  const onTick = lens === 'call' ? g => { if (!callBlock(g) && !callRift(g)) spent += RIFT_CALL_COST; } : null;
  const riftCell = i => { const o = game.rift.open; return !!o && o.cells.some(c => c.y * game.world.w + c.x === i && game.world.cells[i] !== T.EMPTY); };
  const detour = () => { const o = game.rift.open, p = game.player; if (!o) return false;
    return o.cells.some(c => game.world.get(c.x, c.y) !== T.EMPTY && Math.hypot((c.x + 0.5) * CELL - p.x, (c.y + 0.5) * CELL - p.y) <= DETOUR * CELL); };
  const ore = i => detour() ? riftCell(i) : game.world.rings[i] === rings.ring && rings.ore.has(ORE_KIND[game.world.cells[i]]);
  const r = runBot({ seed, route: 'mine', build: 'max', mode, minutes, weather: 'off', anomaly: 'off', rift: on || lens ? 'on' : 'off', setup, ore, onTick });
  const banked = {}; for (const k in game.bank) banked[k] = game.bank[k] - (game.bank0[k] || 0);
  const got = {}; for (const k in banked) got[k] = banked[k] + (game.cargo[k] || 0);
  got.prism = (got.prism || 0) + spent; // gross: what was mined, before the Lens spent any
  const val = Object.entries(got).reduce((a, [k, n]) => a + (VALUE[k] || 0) * n, 0);
  return { ...r, got, val, spent, prismNet: got.prism - spent, calls: spent / RIFT_CALL_COST, haul: worth(banked) + worth(game.cargo), rifts: game.rift.opened, mined: game.rift.mined + (game.rift.open ? game.rift.open.cells.filter(c => game.world.get(c.x, c.y) === T.EMPTY).length : 0) };
}

let all = true, verdict = seeds >= GATE_SEEDS;
if (CALL) {
  for (const name of arg('ring', 'deep,shoal,kiln').split(',')) {
    const rings = RINGS[name], ratios = {}; let ok = true;
    for (const mode of modes) {
      const sum = { mine: { val: 0, net: 0, got: {} }, call: { val: 0, net: 0, got: {}, spent: 0, calls: 0 } };
      for (let k = 1; k <= seeds; k++) for (const pol of ['mine', 'call']) {
        const x = run(k * 7919, mode, rings, false, pol), s = sum[pol];
        if (V) console.log(JSON.stringify({ ring: name, seed: k * 7919, mode, pol, val: x.val, prismNet: x.prismNet, calls: x.calls }));
        s.val += x.val; s.net += x.prismNet; for (const o in x.got) s.got[o] = (s.got[o] || 0) + x.got[o];
        if (pol === 'call') { s.spent += x.spent; s.calls += x.calls; }
      }
      ratios[mode] = sum.call.val / Math.max(1e-9, sum.mine.val);
      const dPrism = (sum.call.net - sum.mine.net) / seeds, per = o => Object.entries(o).map(([k, n]) => `${k} ${(n / seeds / minutes).toFixed(1)}`).join(' ');
      ok = ok && ratios[mode] <= 1.25 && dPrism < 0;
      console.log(`${name} ${mode}: call/mine value ${ratios[mode].toFixed(3)}, ▲ call−mine ${dPrism.toFixed(1)}/run, ▲ spent ${(sum.call.spent / seeds).toFixed(0)}/run (${(sum.call.calls / seeds).toFixed(1)} calls); /min mine [${per(sum.mine.got)}] call [${per(sum.call.got)}]`);
    }
    if (ratios.drift !== undefined && ratios.surge !== undefined) {
      const q = ratios.drift / ratios.surge; ok = ok && q >= 0.8 && q <= 1.25; all = all && ok;
      console.log(`${name} drift/surge ${q.toFixed(3)}: ${ok ? 'pass' : 'fail'}`);
    } else verdict = false;
  }
  console.log(verdict ? `lens gate (call/mine ≤ 1.25, ▲ call−mine < 0, drift/surge 0.8–1.25; Deep + Shoal + Kiln): ${all ? 'PASS' : 'FAIL'}` : `lens gate: no verdict (needs ${GATE_SEEDS} seeds, both modes)`);
  process.exit(0);
}
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
