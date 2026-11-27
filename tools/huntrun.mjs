// S-74a (M17, D-200): the Hunters gate. Per seed, ring and mode, the surgebot mine route runs `--minutes` at the top build
// from a cleared pad mid-ring with a Relay on it (biomefoe's setup: a top-build player banks out there), mining only that
// ring's ore, once with hunters (Tracers + Pincer pairs) and once without (`hunt.off`). The ring's own creature, weather,
// Anomalies and lairs are off, so the gap is the hunters'. Haul = ◆-equivalent banked + carried (biomefoe's WEIGHT).
// Time cost = haul without / with − 1: how much longer the same haul takes with hunters (Drift: theft; Surge: damage +
// recovery). Gate 1: Drift cost / Surge cost in 0.8–1.25 over GATE_SEEDS seeds (D-158's two-faces rule; pooled, D-202).
// Gate 2 (reach): at each Tracer spawn a ghost Glitch is flown from the same spot at the frozen core (D-017's beeline and
// give-up, the tier's Glitch speed); Tracers make first contact on ≥ 80 % of spawns, the ghost on < 30 %.
// S-74b (D-201): natural Glitches off in all runs (--glitches=on restores them); one Auto Echo row per ring and mode (--no-echo).
// S-74b2 (D-202): Surge hauls pay hull debt (below); gate 1 is pooled over the rings run, with a per-ring floor.
// Usage: node tools/huntrun.mjs [--rings=deep,shoal,kiln] [--seeds=8] [--minutes=10] [--mode=drift,surge] [--build=mid|max|start] [--glitches=on] [--no-echo] [--v]
import { runBot, RETREAT } from './surgebot.mjs';
import { CELL, T, KILN_RING, UNDERTOW_RING, ORE_KIND, GLITCH_R, GLITCH_PROGRESS_PX, GLITCH_GIVE_UP_S, TRACER_SPEED } from '../src/config.js';
import { tryPlace } from '../src/craft.js';
import { moveBody } from '../src/body.js';
import { fieldAt } from '../src/flow.js';
import { echoDoing } from '../src/echo.js';
const GATE_SEEDS = 8; // B-092 / D-155: the seed count gate verdicts are defined on (biomefoe.mjs runs on import)

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const RINGS = { deep: { ring: 2, ore: ['shard', 'prism', 'lumen'] }, shoal: { ring: UNDERTOW_RING, ore: ['shard', 'prism', 'tide'] }, kiln: { ring: KILN_RING, ore: ['shard', 'prism', 'calx'] } };
const rings = arg('rings', 'deep,shoal,kiln').split(','), seeds = Number(arg('seeds', GATE_SEEDS)), minutes = Number(arg('minutes', 10));
const modes = arg('mode', 'drift,surge').split(','), BUILD = arg('build', 'mid'), V = process.argv.includes('--v');
const ECHO = !process.argv.includes('--no-echo'); // S-74b: the Auto Echo row (report); --no-echo skips it
const GLITCHES = arg('glitches', 'off') === 'on'; // S-74b (D-201): Surge's Glitches off by default, so the gap is the hunters'
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

function run(seed, mode, ringKey, hunters, echo = false) {
  const R = RINGS[ringKey], ore = new Set(R.ore); let game = null;
  const seen = new Set(), spawns = []; let ticks = 0, defend = 0;
  const setup = g => {
    game = g; const w = g.world;
    g.burrow.off = true; g.swarm.off = true; // the ring's own creature has its gate (biomefoe); this one is the hunters'
    if (!hunters) g.hunt.off = true;
    if (echo) g.echoOrder = 'auto'; // S-74b: the Echo row (reported, not gated): Auto's Defend share with hunters on
    if (!GLITCHES) g.spawnTimer = Infinity; // no natural Glitches: their deaths swamp the hunters' cost (seed noise ±10 %)
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
    if (g.echo) { ticks++; if (echoDoing(g, g.echo) === 'defend') defend++; }
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
  const r = runBot({ seed, route: 'mine', build: BUILD, mode, minutes, weather: 'off', anomaly: 'off', echo, setup, onTick,
    ore: i => game.world.rings[i] === R.ring && ore.has(ORE_KIND[game.world.cells[i]]) });
  const banked = {}; for (const k in game.bank) banked[k] = game.bank[k] - (game.bank0[k] || 0);
  // Reach is judged on Tracers that met the core or gave up; one beamed down on its way says nothing about its path.
  const tr = spawns.filter(s => s.ghost !== null && (s.end === 'met' || s.end === 'stall' || s.end === 'off')), ends = {};
  for (const s of spawns) { const k = `${s.ghost === null ? 'pincer' : 'tracer'} ${s.end || 'alive'}`; ends[k] = (ends[k] || 0) + 1; }
  return { ...r, haul: worth(banked) + worth(game.cargo), hunt: { ...game.hunt }, ticks, defend, tracers: tr.length, met: tr.filter(s => s.end === 'met').length,
    ghost: tr.filter(s => s.ghost).length, blind: tr.filter(s => !s.ghost).length, blindMet: tr.filter(s => !s.ghost && s.end === 'met').length, ends };
}

const sum = (rows, f) => rows.reduce((x, y) => x + f(y), 0);
const ends = rows => { const o = {}; for (const r of rows) for (const k in r.ends) o[k] = (o[k] || 0) + r.ends[k]; return Object.keys(o).sort().map(k => `${k} ${o[k]}`).join(' / '); };
const pct = c => `${(100 * c).toFixed(1)} %`;
const tot = { tracers: 0, met: 0, ghost: 0, blind: 0, blindMet: 0 }, cost = {}, pool = {};
// S-74b2 (D-202) hull debt: a Surge run that ends below full hull has not paid its retreat yet. It owes the hull deficit
// / (1 − RETREAT) heal trips, each priced at the ring's mean trip (s, over its Surge runs with and without hunters; a ring
// with no trip takes the mean over all rings run), and its haul is scaled by run time / (run time + owed).
const debt = (rows, trip) => { for (const r of rows) { r.owed = (1 - Math.min(1, r.hull)) / (1 - RETREAT) * trip; r.haul = r.raw * minutes * 60 / (minutes * 60 + r.owed); } };
const runs = {};
for (const ringKey of rings) for (const mode of modes) {
  const on = [], off = [];
  for (let k = 1; k <= seeds; k++) { on.push(run(k * 7919, mode, ringKey, true)); off.push(run(k * 7919, mode, ringKey, false)); }
  for (const r of [...on, ...off]) r.raw = r.haul;
  runs[`${ringKey} ${mode}`] = { on, off };
}
const surge = rings.flatMap(k => runs[`${k} surge`] ? [...runs[`${k} surge`].on, ...runs[`${k} surge`].off] : []);
const tripAll = sum(surge, r => r.healS) / Math.max(1, sum(surge, r => r.trips));
for (const ringKey of rings) {
  cost[ringKey] = {};
  for (const mode of modes) {
    const { on, off } = runs[`${ringKey} ${mode}`];
    let note = '';
    if (mode === 'surge') {
      const both = [...on, ...off], n = sum(both, r => r.trips), trip = n ? sum(both, r => r.healS) / n : tripAll;
      debt(both, trip);
      note = `, hull debt: end hull with ${(sum(on, r => r.hull) / seeds).toFixed(2)} / without ${(sum(off, r => r.hull) / seeds).toFixed(2)}, trip ${trip.toFixed(0)} s (${n ? `${n} trips` : 'all rings'}), ` +
        `owed with ${(sum(on, r => r.owed) / seeds).toFixed(0)} s / without ${(sum(off, r => r.owed) / seeds).toFixed(0)} s, cost before debt ${pct(sum(off, r => r.raw) / Math.max(1e-9, sum(on, r => r.raw)) - 1)}`;
    }
    for (const [i, a] of on.entries()) if (V) console.log(JSON.stringify({ seed: (i + 1) * 7919, ring: ringKey, mode, on: { haul: a.haul, hull: a.hull, trips: a.trips, deaths: a.deaths, hunt: a.hunt }, off: { haul: off[i].haul, hull: off[i].hull, deaths: off[i].deaths } }));
    cost[ringKey][mode] = sum(off, r => r.haul) / Math.max(1e-9, sum(on, r => r.haul)) - 1;
    pool[mode] = pool[mode] || { on: 0, off: 0 }; pool[mode].on += sum(on, r => r.haul); pool[mode].off += sum(off, r => r.haul);
    for (const k in tot) tot[k] += sum(on, r => r[k]);
    console.log(`${ringKey} ${mode}: time cost ${pct(cost[ringKey][mode])} (◆-eq/min with ${(sum(on, r => r.haul) / seeds / minutes).toFixed(1)}, without ${(sum(off, r => r.haul) / seeds / minutes).toFixed(1)}), ` +
      `hunters ${sum(on, r => r.hunt.spawned)} (pairs ${sum(on, r => r.hunt.pairs)}), reached ${sum(on, r => r.hunt.reached)}, gave up ${sum(on, r => r.hunt.gaveUp)}, kills ${sum(on, r => r.hunt.kills)}, taken ${sum(on, r => r.hunt.taken)}, ` +
      `Tracers met ${sum(on, r => r.met)}/${sum(on, r => r.tracers)} (ghost Glitch ${sum(on, r => r.ghost)}), ends ${ends(on)}, deaths with ${sum(on, r => r.deaths)} / without ${sum(off, r => r.deaths)}, stuck ${sum(on, r => r.stuck) + sum(off, r => r.stuck)}${note}`);
    if (ECHO) { // S-74b: the same seeds with hunters on and an Auto Echo along (reported, not gated; no hull debt)
      const ec = []; for (let k = 1; k <= seeds; k++) ec.push(run(k * 7919, mode, ringKey, true, true));
      console.log(`${ringKey} ${mode} + Auto Echo: time cost ${pct(sum(off, r => r.raw) / Math.max(1e-9, sum(ec, r => r.haul)) - 1)}, ` +
        `Defend share ${(100 * sum(ec, r => r.defend) / Math.max(1, sum(ec, r => r.ticks))).toFixed(1)} % (report)`);
    }
  }
  const c = cost[ringKey];
  if (c.drift !== undefined && c.surge !== undefined) console.log(`${ringKey}: Drift / Surge time cost ${c.surge > 0 && c.drift > 0 ? (c.drift / c.surge).toFixed(3) : 'n/a (a cost ≤ 0)'} (report; the gate is pooled, D-202)`);
}
// D-202: the cost gate is pooled over the rings run (sum of hauls), Drift / Surge in 0.8–1.25; floor: each face costs > 0
// in every ring (a free face fails, D-200). A cost ≤ 0 has no ratio. D-206: ceiling, no ring's Drift cost past DRIFT_CEIL.
const DRIFT_CEIL = 0.18;
let costPass = null;
if (pool.drift && pool.surge) {
  const pd = pool.drift.off / Math.max(1e-9, pool.drift.on) - 1, ps = pool.surge.off / Math.max(1e-9, pool.surge.on) - 1;
  const q = pd > 0 && ps > 0 ? pd / ps : NaN, band = q >= 0.8 && q <= 1.25;
  const free = rings.flatMap(k => modes.filter(m => !(cost[k][m] > 0)).map(m => `${k} ${m}`));
  const hot = rings.filter(k => cost[k].drift > DRIFT_CEIL);
  costPass = band && !free.length && !hot.length;
  console.log(`pooled (${rings.join(' + ')}): Drift ${pct(pd)}, Surge ${pct(ps)}, Drift / Surge ${Number.isNaN(q) ? 'n/a (a cost ≤ 0)' : q.toFixed(3)} (0.8–1.25) ${band ? 'ok' : 'FAIL'}; ` +
    `floor (every face > 0 in every ring) ${free.length ? `FAIL: ${free.join(', ')}` : 'ok'}; ` +
    `ceiling (Drift ≤ ${pct(DRIFT_CEIL)} in every ring) ${hot.length ? `FAIL: ${hot.join(', ')}` : 'ok'}`);
}
const pc = (a, b) => (100 * a / Math.max(1, b)).toFixed(0), blind = tot.blindMet / Math.max(1, tot.blind), rok = blind >= 0.8;
console.log(`reach: Tracers ${pc(tot.met, tot.tracers)} % of ${tot.tracers} that met or gave up, a ghost Glitch from the same spots ${pc(tot.ghost, tot.tracers)} % (report); ` +
  `where the ghost gives up, Tracers ${pc(tot.blindMet, tot.blind)} % of ${tot.blind} (≥ 80) ${rok ? 'ok' : 'FAIL'}`);
if (seeds < GATE_SEEDS) console.log(`gate: no verdict (${seeds} seeds < ${GATE_SEEDS}, B-092)`);
else console.log(`gate: reach ${rok ? 'PASS' : 'FAIL'}; cost ${costPass === null ? 'n/a (one mode)' : costPass ? 'PASS' : 'FAIL'}${rings.length < 3 ? ` (pooled over ${rings.join(' + ')} only)` : ''} (S-74b2 tunes it, D-202)`);
