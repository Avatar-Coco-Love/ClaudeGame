// Design 52 probe for S-28 (the facet puzzle), against D-078's shipped `FACET_RING` / `toggleMask` / `startMask`.
// 1. Over SEEDS seeds × every Spire: the start pattern's minimum taps (brute force over all 256 tap sets) = SPIRE_TAPS[i],
//    within 3–5, never already solved; plus how many distinct patterns appear per Spire index.
// 2. The rule is invertible: all 256 tap sets give 256 different masks.
// 3. Geometry (one real Spire in a seed-1 world): every FACET_RING offset is a T.FACET cell; from the 7×7 interior, a
//    Focus ray (start-build range) reaches each facet; Wide (3 rays) never has two facets as first hits at once.
// 4. S-28 (session 53): every distinct start pattern seen in step 1 is solved in-game: the world of the first seed that
//    drew it, the Spire primed, the core standing in the interior and the real beam (aim ray, SPIRE_TAP_S dwell) held
//    on each facet of the minimal tap set (tests/facet.cjs `solveInGame`). It must end lit with exactly SPIRE_TAPS[i] taps.
// Usage: node tools/facetprobe.mjs [seeds = 2000]
import { Game } from '../src/game.js';
import { CELL, T, SPIRE_TAPS, WIDE_OFFSET, WIDE_RANGE } from '../src/config.js';
import { FACET_RING, toggleMask, startMask, spireTypeAt, SPIRE_INTERIOR } from '../src/spire.js';
import { createRequire } from 'module';
const { solveInGame } = createRequire(import.meta.url)('../tests/facet.cjs');

const SEEDS = Number(process.argv[2] || 2000), audio = new Proxy({}, { get: () => () => {} });
const solve = new Map(); // mask -> fewest taps
for (let set = 0; set < 256; set++) {
  let m = 255, n = 0;
  for (let k = 0; k < 8; k++) if ((set >> k) & 1) { m = toggleMask(m, k); n++; }
  if (!solve.has(m) || solve.get(m) > n) solve.set(m, n);
}
const fail = [];
if (solve.size !== 256) fail.push(`rule not invertible: ${solve.size} masks reachable`);
const patterns = SPIRE_TAPS.map(() => new Set()), hist = {}, firstSeed = new Map(); // `${i}:${mask}` -> first seed
for (let k = 1; k <= SEEDS; k++) {
  const seed = (k * 2654435761) >>> 0;
  for (let i = 0; i < SPIRE_TAPS.length; i++) {
    const m = startMask(seed, i), n = solve.get(m);
    patterns[i].add(m); hist[n] = (hist[n] || 0) + 1;
    if (!firstSeed.has(`${i}:${m}`)) firstSeed.set(`${i}:${m}`, seed);
    if (n !== SPIRE_TAPS[i] || n < 3 || n > 5 || m === 255) fail.push(`seed ${seed} Spire ${i}: mask ${m} needs ${n}`);
  }
}
console.log(`taps: ${SEEDS} seeds × ${SPIRE_TAPS.length} Spires, histogram ${JSON.stringify(hist)}, distinct patterns per Spire ${patterns.map(p => p.size).join('/')}`);

// Geometry on a real Spire.
const g = new Game({ seed: 1, mode: 'drift', audio }), w = g.world, s = g.spires[0];
for (const [i, j] of FACET_RING) if (spireTypeAt(i, j) !== T.FACET || w.get(s.x + i, s.y + j) !== T.FACET) fail.push(`ring (${i}, ${j}) is not a facet`);
const range = g.stat('range'), facetAt = new Map(FACET_RING.map(([i, j], k) => [`${s.x + i},${s.y + j}`, k]));
const reached = new Set(); let doubles = 0, samples = 0;
for (let sy = -SPIRE_INTERIOR; sy <= SPIRE_INTERIOR; sy += 0.25) for (let sx = -SPIRE_INTERIOR; sx <= SPIRE_INTERIOR; sx += 0.25) {
  const cx = s.x + sx + 0.5, cy = s.y + sy + 0.5;
  if (Math.max(Math.abs(Math.round(sx)), Math.abs(Math.round(sy))) <= 1) continue; // the core block
  const px = cx * CELL, py = cy * CELL;
  for (let a = 0; a < 720; a++) {
    const t = a * Math.PI / 360, dx = Math.cos(t), dy = Math.sin(t), nx = -dy, ny = dx;
    const f = w.raycast(px, py, dx, dy, range); const k = f && facetAt.get(`${f.x},${f.y}`);
    if (k !== undefined && k !== null) reached.add(k);
    const hits = new Set();
    for (const o of [-WIDE_OFFSET, 0, WIDE_OFFSET]) {
      const h = w.raycast(px + nx * o, py + ny * o, dx, dy, range * WIDE_RANGE), q = h && facetAt.get(`${h.x},${h.y}`);
      if (q !== undefined && q !== null) hits.add(q);
    }
    samples++; if (hits.size > 1) doubles++;
  }
}
if (reached.size !== 8) fail.push(`Focus reaches only ${reached.size} of 8 facets from the interior (range ${range} px)`);
console.log(`geometry: Focus (range ${range} px) reaches ${reached.size}/8 facets; Wide hits two facets at once in ${doubles} of ${samples} aims`);
// 4. In-game solve of every distinct pattern.
let solved = 0;
for (const [key, seed] of firstSeed) {
  const i = Number(key.split(':')[0]), r = await solveInGame(seed, i, 'drift');
  if (r.lit && r.mode === 'drift' && r.taps.length === SPIRE_TAPS[i]) solved++; else fail.push(`in-game seed ${seed} Spire ${i}: not relit`);
}
console.log(`in-game: ${solved}/${firstSeed.size} distinct start patterns relit by beaming their tap sets`);
console.log(fail.length ? `FAIL ${fail.length}: ${fail.slice(0, 5).join('; ')}` : 'OK');
process.exitCode = fail.length ? 1 : 0;
