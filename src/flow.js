// S-72 (M17, D-190): the core's flow field. One 4-way BFS over open floor from the core's cell, FLOW_FIELD cells out
// (a (2 × FLOW_FIELD + 1)² box), rebuilt every FLOW_S s or when `world.breaks` changed (any break, the Echo's rule, D-108).
// Hunters walk it downhill to the core (`downhill`), or uphill to flee (`uphill`). Built only while a hunter lives
// (`coreField(game)` is called from hunter.js); the Echo keeps its own field until S-73 (D-186). Never saved.
import { CELL, FLOW_FIELD, FLOW_S } from './config.js';

const SIDE = FLOW_FIELD * 2 + 1;
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** A fresh field (unbuilt). `builds` counts BFS runs; `ms` / `msMax` time them (perf; `msMax` skips the cold first build). */
export function makeField() {
  return { d: new Int16Array(SIDE * SIDE).fill(-1), cx: 0, cy: 0, t: 0, ver: -1, builds: 0, ms: 0, msMax: 0 };
}

/** The game's field, rebuilt if stale (the core moved a cell, a cell broke, or FLOW_S passed). `dt` ticks its clock. */
export function coreField(game, dt = 0) {
  const f = game.flow || (game.flow = makeField()), p = game.player, w = game.world;
  const cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL);
  f.t -= dt;
  if (f.ver !== w.breaks || f.cx !== cx || f.cy !== cy || f.t <= 0) build(w, f, cx, cy);
  return f;
}

const Q = new Int32Array(SIDE * SIDE);
function build(w, f, cx, cy) {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const d = f.d, cells = w.cells, W = w.w, H = w.h, x0 = cx - FLOW_FIELD, y0 = cy - FLOW_FIELD;
  f.cx = cx; f.cy = cy; f.t = FLOW_S; f.ver = w.breaks; f.builds++;
  d.fill(-1);
  const open = (lx, ly) => { const x = x0 + lx, y = y0 + ly; return x >= 0 && y >= 0 && x < W && y < H && cells[y * W + x] === 0; };
  let head = 0, tail = 0;
  Q[tail++] = FLOW_FIELD * SIDE + FLOW_FIELD; d[Q[0]] = 0;
  while (head < tail) {
    const i = Q[head++], v = d[i] + 1, lx = i % SIDE, ly = (i - lx) / SIDE;
    if (lx + 1 < SIDE && d[i + 1] < 0 && open(lx + 1, ly)) { d[i + 1] = v; Q[tail++] = i + 1; }
    if (lx > 0 && d[i - 1] < 0 && open(lx - 1, ly)) { d[i - 1] = v; Q[tail++] = i - 1; }
    if (ly + 1 < SIDE && d[i + SIDE] < 0 && open(lx, ly + 1)) { d[i + SIDE] = v; Q[tail++] = i + SIDE; }
    if (ly > 0 && d[i - SIDE] < 0 && open(lx, ly - 1)) { d[i - SIDE] = v; Q[tail++] = i - SIDE; }
  }
  if (t0) { f.ms = performance.now() - t0; f.msMax = Math.max(f.msMax || 0, f.builds > 1 ? f.ms : 0); }
}

/** Steps from cell (x, y) to the core's cell; -1 = outside the box, solid or unreachable. */
export function fieldAt(f, x, y) {
  const lx = x - f.cx + FLOW_FIELD, ly = y - f.cy + FLOW_FIELD;
  return lx < 0 || ly < 0 || lx >= SIDE || ly >= SIDE ? -1 : f.d[ly * SIDE + lx];
}

/** The neighbour of (x, y) of 8 with the lowest (dir 1) or highest (dir -1) field value; a diagonal only when both of
 *  its sides are open (no corner cutting). null = none better than (x, y) itself. */
function step(f, x, y, dir) {
  const here = fieldAt(f, x, y);
  let best = null, bv = here < 0 ? (dir > 0 ? Infinity : -Infinity) : here;
  for (const [dx, dy] of N8) {
    const v = fieldAt(f, x + dx, y + dy);
    if (v < 0) continue;
    if (dx && dy && (fieldAt(f, x + dx, y) < 0 || fieldAt(f, x, y + dy) < 0)) continue;
    if (dir > 0 ? v < bv : v > bv) { bv = v; best = [x + dx, y + dy]; }
  }
  return best;
}
export const downhill = (f, x, y) => step(f, x, y, 1);
export const uphill = (f, x, y) => step(f, x, y, -1);

/** Every reachable field cell `lo`–`hi` steps out, in index order (row by row): [x, y, steps] triples. */
export function ringCells(f, lo, hi) {
  const out = [];
  for (let i = 0; i < f.d.length; i++) {
    const v = f.d[i];
    if (v >= lo && v <= hi) out.push(f.cx + (i % SIDE) - FLOW_FIELD, f.cy + Math.floor(i / SIDE) - FLOW_FIELD, v);
  }
  return out;
}
