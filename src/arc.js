// S-55 Arc beam mode (D-151). castBeam (beam.js) calls `arcTargets` with what the ray hit; it returns up to ARC_N more
// targets of the same kind within ARC_CELLS cells, and castBeam damages each by ARC_MUL × the ray's dps. Same in Drift and
// Surge. `beam.arcs` holds the realized jumps this frame ({ x1, y1, x2, y2 }) for `drawArcs`; nothing is saved.
import { CELL, ORE_KIND, ARC_N, ARC_CELLS } from './config.js';
import { beamFoes } from './spitter.js';

/** The creatures (never a bolt, never a fading Glitch) nearest foe `e` within ARC_CELLS cells, up to ARC_N. */
export function arcFoes(game, e) {
  const R = ARC_CELLS * CELL, out = [];
  for (const o of beamFoes(game)) {
    if (o === e || o.bolt || o.fade !== undefined) continue;
    const d = Math.hypot(o.x - e.x, o.y - e.y);
    if (d <= R) out.push({ o, d });
  }
  return out.sort((a, b) => a.d - b.d).slice(0, ARC_N).map(q => q.o);
}

/** Ore cells of the hit cell's type within ARC_CELLS cells of it (Chebyshev: its vein, gaps and all), up to ARC_N: the
 *  most cracked first (so jumps finish what they started as the ray moves on), then the nearest. Rock and every non-ore
 *  cell arc to nothing; another ore type is never a target. */
export function arcCells(world, hx, hy) {
  const type = world.get(hx, hy), out = [];
  if (!ORE_KIND[type]) return out;
  for (let y = hy - ARC_CELLS; y <= hy + ARC_CELLS; y++) for (let x = hx - ARC_CELLS; x <= hx + ARC_CELLS; x++) {
    if ((x === hx && y === hy) || world.get(x, y) !== type) continue;
    out.push({ x, y, d: Math.hypot(x - hx, y - hy), dmg: world.damage[y * world.w + x] });
  }
  return out.sort((a, b) => b.dmg - a.dmg || a.d - b.d || a.y - b.y || a.x - b.x).slice(0, ARC_N);
}

/** World pass, over the beam: a thin jagged line in the beam's colour from the hit to each arc target, flicking each frame
 *  (a fixed shape under reduced motion). */
export function drawArcs(ctx, game) {
  const arcs = game.beam.arcs;
  if (!game.beam.on || !arcs || !arcs.length) return;
  const still = !game.motionOn();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const a of arcs) {
    const dx = a.x2 - a.x1, dy = a.y2 - a.y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, n = 5;
    const pts = [[a.x1, a.y1]];
    for (let i = 1; i < n; i++) {
      const j = (still ? (i % 2 ? 1 : -1) * 0.6 : Math.random() * 2 - 1) * 5;
      pts.push([a.x1 + dx * i / n + nx * j, a.y1 + dy * i / n + ny * j]);
    }
    pts.push([a.x2, a.y2]);
    const col = a.foe ? '255,122,61' : '46,242,255';
    for (const [style, lw] of [[`rgba(${col},0.45)`, 3.5], ['rgba(255,255,255,0.85)', 1]]) {
      ctx.strokeStyle = style; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
  }
  ctx.restore();
}
