// S-74a (M17, D-200): the Hunters gate. Per seed, ring and mode, the surgebot mine route runs `--minutes` at the top build
// from a cleared pad mid-ring with a Relay on it (biomefoe's setup: a top-build player banks out there), mining only that
// ring's ore, once with hunters (Tracers + Pincer pairs) and once without (`hunt.off`). The ring's own creature, weather,
// Anomalies and lairs are off, so the gap is the hunters'. Haul = ◆-equivalent banked + carried (biomefoe's WEIGHT).
// Time cost = haul without / with − 1: how much longer the same haul takes with hunters (Drift: theft; Surge: damage +
// recovery). Gate 1: Drift cost / Surge cost in 0.8–1.25 per ring, pooled over GATE_SEEDS seeds (D-158's two-faces rule).
// Gate 2 (reach): at each Tracer spawn a ghost Glitch is flown from the same spot at the frozen core (D-017's beeline and
// give-up, the tier's Glitch speed); Tracers make first contact on ≥ 80 % of spawns, the ghost on < 30 %.
// Usage: node tools/huntrun.mjs [--rings=deep,shoal,kiln] [--seeds=8] [--minutes=10] [--mode=drift,surge] [--build=mid|max|start] [--v]
import { runBot } from './surgebot.mjs';
import { CELL, T, KILN_RING, UNDERTOW_RING, ORE_KIND, GLITCH_R, GLITCH_PROGRESS_PX, GLITCH_GIVE_UP_S, TRACER_SPEED } from '../src/config.js';
import { tryPlace } from '../src/craft.js';
import { moveBody } from '../src/body.js';
import { fieldAt } from '../src/flow.js';
const GATE_SEEDS = 8; // B-092 / D-155: the seed count gate verdicts are defined on (biomefoe.mjs runs on import)

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const RINGS = { deep: { ring: 2, ore: ['shard', 'prism', 'lumen'] }, shoal: { ring: UNDERTOW_RING, ore: ['shard', 'prism', 'tide'] }, kiln: { ring: KILN_RING, ore: ['shard', 'prism', 'calx'] } };
const rings = arg('rings', 'deep,shoal,kiln').split(','), seeds = Number(arg('seeds', GATE_SEEDS)), minutes = Number(arg('minutes', 10));
const modes = arg('mode', 'drift,surge').split(','), BUILD = arg('build', 'mid'), V = process.argv.includes('--v');
const WEIGHT = { shard: 1, prism: 4, lumen: 4, tide: 12, calx: 12 };
const worth = o => Object.entries(o).reduce((a, [k, n]) => a + (WEIGHT[k] || 0) * n, 0);

/** A Glitch from (x, y) at the tier's speed, flown at a core frozen where it is: does it touch before giving up? */
export function ghostReaches(world, x, y, speed, core) {
  const e = { x, y, r: GLITCH_R, vx: 0, vy: 0 }, dt = 1 / 60;
  let best = Infinity, stall = 0;
  for (let t = 0; t < 60; t += dt) {
    const dx = core.x - e.x, dy = core.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (d < e.r + core.r) return true;
    e.vx += (dx / d * speed - e.vx) * Math.min(1, dt * 3); e.vy += (dy / d * speed - e.vy) * Math.min(1, dt * 3);
    moveBody(world, e, e.vx * dt, e.vy * dt);
    const gd = Math.hypot(core.x - e.x, core.y - e.y);
    if (!(gd > best - GLITCH_PROGRESS_PX)) { best = gd; stall = 0; } else if ((stall += dt) >= GLITCH_GIVE_UP_S) return false;
  }
  return false;
}

function run(seed, mode, ringKey, hunters) {
  const R = RINGS[ringKey], ore = new Set(R.ore); let game = null;
  const seen = new Set(), spawns = [];
  const setup = g => {
    game = g; const w = g.world;
    g.burrow.off = true; g.swarm.off = true; // the ring's own creature has its gate (biomefoe); this one is the hunters'
    if (!hunters) g.hunt.off = true;
    const cells = []; for (let i = 0; i < w.w * w.h; i++) if (w.rings[i] === R.ring) cells.push(Math.hypot(i % w.w - w.cx, ((i / w.w) | 0) - w.cy));
    cells.sort((a, b) => a - b); const d = cells[cells.length >> 1];
    let best = null, bd = -1;
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8, x = Math.round(w.cx + Math.cos(a) * d), y = Math.round(w.cy + Math.sin(a) * d);
      const far = Math.min(...[...w.vaults, ...g.spires].map(v => Math.hypot(v.x - x, v.y - y)));
      if (w.ring(x, y) === R.ring && far > bd) { bd = far; best = { x, y }; }
    }
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) w.destroy(best.x + dx, best.y + dy);
    Object.assign(g.player, { x: (best.x + 0.5) * CELL, y: (best.y + 0.5) * CELL, vx: 0, vy: 0 });
    g.craft.relay = 1; g.craft.last = 'relay'; tryPlace(g);
    g.bank0 = { ...g.bank };
  };
  const onTick = g => {
    for (const e of g.hunters) if (!seen.has(e)) { // a new hunter: fly its ghost Glitch now
      seen.add(e); const p = g.player;
      spawns.push({ e, ghost: e.hunter === 'tracer' ? ghostReaches(g.world, e.x, e.y, e.speed / TRACER_SPEED, { x: p.x, y: p.y, r: p.r }) : null });
    }
    for (const s of spawns) if (!s.end) { // how each one ended before contact: beamed down, gave up (stall), off the field
      const e = s.e;
      if (e.met) s.end = 'met';
      else if (e.fade !== undefined) s.end = e.part ? 'parted' : g.flow && fieldAt(g.flow, Math.floor(e.x / CELL), Math.floor(e.y / CELL)) >= 0 ? 'stall' : 'off';
      else if (!g.hunters.includes(e)) s.end = 'killed';
    }
  };
  const r = runBot({ seed, route: 'mine', build: BUILD, mode, minutes, weather: 'off', anomaly: 'off', setup, onTick,
    ore: i => game.world.rings[i] === R.ring && ore.has(ORE_KIND[game.world.cells[i]]) });
  const banked = {}; for (const k in game.bank) banked[k] = game.bank[k] - (game.bank0[k] || 0);
  // Reach is judged on Tracers that met the core or gave up; one beamed down on its way says nothing about its path.
  const tr = spawns.filter(s => s.ghost !== null && (s.end === 'met' || s.end === 'stall' || s.end === 'off')), ends = {};
  for (const s of spawns) { const k = `${s.ghost === null ? 'pincer' : 'tracer'} ${s.end || 'alive'}`; ends[k] = (ends[k] || 0) + 1; }
  return { ...r, haul: worth(banked) + worth(game.cargo), hunt: { ...game.hunt }, tracers: tr.length, met: tr.filter(s => s.end === 'met').length,
    ghost: tr.filter(s => s.ghost).length, blind: tr.filter(s => !s.ghost).length, blindMet: tr.filter(s => !s.ghost && s.end === 'met').length, ends };
}

const sum = (rows, f) => rows.reduce((x, y) => x + f(y), 0);
const ends = rows => { const o = {}; for (const r of rows) for (const k in r.ends) o[k] = (o[k] || 0) + r.ends[k]; return Object.keys(o).sort().map(k => `${k} ${o[k]}`).join(' / '); };
let costPass = true; const tot = { tracers: 0, met: 0, ghost: 0, blind: 0, blindMet: 0 };
for (const ringKey of rings) {
  const cost = {};
  for (const mode of modes) {
    const on = [], off = [];
    for (let k = 1; k <= seeds; k++) {
      const a = run(k * 7919, mode, ringKey, true), b = run(k * 7919, mode, ringKey, false);
      if (V) console.log(JSON.stringify({ seed: k * 7919, ring: ringKey, mode, on: { haul: a.haul, deaths: a.deaths, hunt: a.hunt }, off: { haul: b.haul, deaths: b.deaths } }));
      on.push(a); off.push(b);
    }
    cost[mode] = sum(off, r => r.haul) / Math.max(1e-9, sum(on, r => r.haul)) - 1;
    for (const k in tot) tot[k] += sum(on, r => r[k]);
    console.log(`${ringKey} ${mode}: time cost ${(100 * cost[mode]).toFixed(1)} % (◆-eq/min with ${(sum(on, r => r.haul) / seeds / minutes).toFixed(1)}, without ${(sum(off, r => r.haul) / seeds / minutes).toFixed(1)}), ` +
      `hunters ${sum(on, r => r.hunt.spawned)} (pairs ${sum(on, r => r.hunt.pairs)}), reached ${sum(on, r => r.hunt.reached)}, gave up ${sum(on, r => r.hunt.gaveUp)}, kills ${sum(on, r => r.hunt.kills)}, taken ${sum(on, r => r.hunt.taken)}, ` +
      `Tracers met ${sum(on, r => r.met)}/${sum(on, r => r.tracers)} (ghost Glitch ${sum(on, r => r.ghost)}), ends ${ends(on)}, deaths with ${sum(on, r => r.deaths)} / without ${sum(off, r => r.deaths)}, stuck ${sum(on, r => r.stuck) + sum(off, r => r.stuck)}`);
  }
  if (cost.drift !== undefined && cost.surge !== undefined) {
    // A cost ≤ 0 (hunters pay more in loot than they take) has no ratio: the face does nothing, so it fails.
    const q = cost.surge > 0 && cost.drift > 0 ? cost.drift / cost.surge : NaN, ok = q >= 0.8 && q <= 1.25; costPass = costPass && ok;
    console.log(`${ringKey}: Drift / Surge time cost ${Number.isNaN(q) ? 'n/a (a cost ≤ 0)' : q.toFixed(3)} (0.8–1.25) ${ok ? 'ok' : 'FAIL'}`);
  }
}
const pc = (a, b) => (100 * a / Math.max(1, b)).toFixed(0), blind = tot.blindMet / Math.max(1, tot.blind), rok = blind >= 0.8;
console.log(`reach: Tracers ${pc(tot.met, tot.tracers)} % of ${tot.tracers} that met or gave up, a ghost Glitch from the same spots ${pc(tot.ghost, tot.tracers)} % (report); ` +
  `where the ghost gives up, Tracers ${pc(tot.blindMet, tot.blind)} % of ${tot.blind} (≥ 80) ${rok ? 'ok' : 'FAIL'}`);
if (seeds < GATE_SEEDS) console.log(`gate: no verdict (${seeds} seeds < ${GATE_SEEDS}, B-092)`);
else console.log(`gate: reach ${rok ? 'PASS' : 'FAIL'}; cost ${costPass ? 'PASS' : 'FAIL'} (S-74b tunes it, D-200)`);
