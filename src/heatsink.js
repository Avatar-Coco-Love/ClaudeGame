// S-51 (D-141) Heat Sink: a crafted Kiln placeable. Crafted at the Nexus (Craft tab, 5-ring worlds only) into a carried stock,
// placed with B / ✦ (craft.js `tryPlace` asks here) on open Kiln floor. While the core is within HEATSINK_R cells of one, its
// beam heat gain × HEATSINK_MUL (heat.js asks `sinkMul`); cooling and flare vents are unchanged; Glitches and the Echo ignore it.
// A placed Sink is { i, x, y }. B / ✦ on one picks it up again into stock (a full refund, like a Relay, S-34).
import { CELL, T, KILN_RING, HEATSINK_COST, HEATSINK_STOCK, HEATSINK_MAX, HEATSINK_GAP, HEATSINK_R, HEATSINK_MUL, HEATSINK_PICK_R,
  HEATSINK_RGB, PLACE_BURST } from './config.js';

export const SINK_COLOR = `rgb(${HEATSINK_RGB})`;

/** Only a world with a Kiln ring has Heat Sinks (a 160 world never shows the row). */
export function sinksOn(game) { return game.world.profile.rings > KILN_RING; }

export function makeSink(world, i) {
  const x = i % world.w, y = Math.floor(i / world.w);
  return { i, x: (x + 0.5) * CELL, y: (y + 0.5) * CELL };
}

/** Stock + placed never passes HEATSINK_MAX, so no Calx is spent on a Sink with nowhere to go. */
export function canCraftSink(game) {
  const n = game.craft.sink, b = game.bank;
  return sinksOn(game) && b.calx >= HEATSINK_COST.calx && b.shard >= HEATSINK_COST.shard && n < HEATSINK_STOCK && n + game.sinks.length < HEATSINK_MAX;
}
export function craftSink(game) {
  if (!canCraftSink(game)) return false;
  game.bank.calx -= HEATSINK_COST.calx; game.bank.shard -= HEATSINK_COST.shard;
  game.craft.sink++; game.craft.last = 'sink';
  game.audio.upgrade();
  return true;
}

/** Why a Sink can't go on cell (cx, cy) now, or null. 'blocked' (not open / taken) is decided by craft.js's shared check. */
export function sinkRefusal(game, cx, cy) {
  if (game.sinks.length >= HEATSINK_MAX) return 'max';
  if (!game.world.inBounds(cx, cy) || game.world.ring(cx, cy) !== KILN_RING) return 'kiln';
  const w = game.world.w;
  if (game.sinks.some(s => Math.hypot(s.i % w - cx, Math.floor(s.i / w) - cy) < HEATSINK_GAP)) return 'near';
  return null;
}

/** The Sink the core sits on (within HEATSINK_PICK_R cells), or null: B / ✦ there picks it up. */
export function sinkAt(game) {
  const p = game.player;
  for (const s of game.sinks) if (Math.hypot(p.x - s.x, p.y - s.y) < HEATSINK_PICK_R * CELL) return s;
  return null;
}

/** The core's heat-gain factor this frame: HEATSINK_MUL within HEATSINK_R cells of any placed Sink, else 1. */
export function sinkMul(game) {
  const p = game.player, r = HEATSINK_R * CELL;
  for (const s of game.sinks) if (Math.hypot(p.x - s.x, p.y - s.y) <= r) return HEATSINK_MUL;
  return 1;
}

/** Back into stock, free, unless HEATSINK_STOCK are carried already. Sets placeKind / placeResult like a placement. */
export function pickUpSink(game, s) {
  game.placeKind = 'sink';
  if (game.craft.sink >= HEATSINK_STOCK) { game.placeResult = 'carrying'; game.notify('beacon'); return false; }
  game.sinks.splice(game.sinks.indexOf(s), 1);
  game.craft.sink++; game.craft.last = 'sink';
  game.placeResult = 'picked';
  game.audio.beacon();
  if (game.motionOn()) game.burst(s.x, s.y, PLACE_BURST.n, SINK_COLOR, PLACE_BURST.speed);
  game.notify('beacon');
  return true;
}

/** Saved Sinks: open Kiln cells only, no repeats, at most HEATSINK_MAX (B-037: a save is never trusted). */
export function loadSinks(game, list) {
  const w = game.world, seen = new Set();
  if (!sinksOn(game)) return;
  for (const i of Array.isArray(list) ? list : []) {
    if (!Number.isInteger(i) || i < 0 || i >= w.cells.length || w.cells[i] !== T.EMPTY || seen.has(i)) continue;
    if (w.ring(i % w.w, Math.floor(i / w.w)) !== KILN_RING) continue;
    seen.add(i);
    if (game.sinks.length < HEATSINK_MAX) game.sinks.push(makeSink(w, i));
  }
}

function pentagon(ctx, x, y, r) {
  ctx.beginPath();
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 5; ctx[k ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a)); }
  ctx.closePath();
}

/** World pass: an upright pentagon outline with a slow inner pulse; a faint HEATSINK_R floor ring while the core is inside. */
export function drawSinks(r, ctx, left, top, vw, vh) {
  const ss = r.game.sinks;
  if (!ss.length) return;
  const g = r.game, p = g.player, R = HEATSINK_R * CELL, pulse = g.motionOn() ? 0.5 + 0.5 * Math.sin(r.time * 1.6) : 0.5;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = SINK_COLOR; ctx.fillStyle = SINK_COLOR;
  for (const s of ss) {
    if (s.x + R < left || s.x - R > left + vw || s.y + R < top || s.y - R > top + vh) continue;
    if (Math.hypot(p.x - s.x, p.y - s.y) <= R) {
      ctx.globalAlpha = 0.16; ctx.lineWidth = 1; ctx.setLineDash([3, 7]);
      ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 0.95; ctx.lineWidth = 2;
    pentagon(ctx, s.x, s.y, 12); ctx.stroke();
    ctx.globalAlpha = 0.2 + 0.35 * pulse;
    pentagon(ctx, s.x, s.y, 5 + 2 * pulse); ctx.fill();
  }
  ctx.restore();
}

/** Minimap: a small filled lilac pentagon at each placed Sink, always shown. */
export function drawSinkMarks(m, g, sc) {
  if (!g.sinks.length) return;
  m.fillStyle = SINK_COLOR;
  for (const s of g.sinks) { pentagon(m, s.x * sc, s.y * sc, 3); m.fill(); }
}
