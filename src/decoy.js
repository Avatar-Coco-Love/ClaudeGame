// S-77a (D-208, D-212) Decoy: a crafted placeable that lures hunters. Crafted at the Nexus (Craft tab, every world) into a
// carried stock, placed with B / ✦ (craft.js `tryPlace` asks here) on open floor outside the Nexus disc. A hunter (Tracer,
// Pincer lead or flank) that is not fleeing and sees a placed Decoy within DECOY_R cells (no rock between) leaves the field
// and steers straight at it (hunter.js asks `lureGoal` once a frame; the flank's A* waits; no second field, D-198). Within
// DECOY_NEAR cells it circles the Decoy; DECOY_HOLD_S after the first arrival the Decoy is spent (removed, a small burst,
// none with reduced motion) and every hunter it held goes back to the field. It buys seconds, never kills (D-208).
// A fleeing Drift thief ignores Decoys; Glitches, Spitters, the Echo and bosses never read them. Same in Drift and Surge.
// A placed Decoy is { i, x, y, hold }: `hold` (null until a hunter arrives, then seconds held) is never saved.
import { CELL, T, NEXUS_RADIUS, GLITCH_GIVE_UP_S, DECOY_COST, DECOY_STOCK, DECOY_MAX, DECOY_R, DECOY_HOLD_S, DECOY_NEAR,
  DECOY_ORBIT, DECOY_PICK_R, DECOY_RGB, PLACE_BURST } from './config.js';

export const DECOY_COLOR = `rgb(${DECOY_RGB})`;
const ORBIT_RATE = 4; // rad/s round the Decoy while it holds

export function makeDecoy(world, i) {
  const x = i % world.w, y = Math.floor(i / world.w);
  return { i, x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, hold: null };
}

/** Stock + placed never passes DECOY_MAX, so nothing is spent on a Decoy with nowhere to go. */
export function canCraftDecoy(game) {
  const n = game.craft.decoy, b = game.bank;
  return b.prism >= DECOY_COST.prism && b.shard >= DECOY_COST.shard && n < DECOY_STOCK && n + game.decoys.length < DECOY_MAX;
}
export function craftDecoy(game) {
  if (!canCraftDecoy(game)) return false;
  game.bank.prism -= DECOY_COST.prism; game.bank.shard -= DECOY_COST.shard;
  game.craft.decoy++; game.craft.last = 'decoy';
  game.audio.upgrade();
  return true;
}

/** Why a Decoy can't go on cell (cx, cy) now, or null. 'blocked' (not open / taken) is decided by craft.js's shared check. */
export function decoyRefusal(game, cx, cy) {
  if (game.decoys.length >= DECOY_MAX) return 'max';
  if (Math.hypot((cx + 0.5) * CELL - game.nexus.x, (cy + 0.5) * CELL - game.nexus.y) < NEXUS_RADIUS) return 'nexus';
  return null;
}

/** The Decoy the core sits on (within DECOY_PICK_R cells), or null: B / ✦ there picks it up. */
export function decoyAt(game) {
  const p = game.player;
  for (const s of game.decoys) if (Math.hypot(p.x - s.x, p.y - s.y) < DECOY_PICK_R * CELL) return s;
  return null;
}

/** Back into stock, free, unless DECOY_STOCK are carried already. Sets placeKind / placeResult like a placement. */
export function pickUpDecoy(game, s) {
  game.placeKind = 'decoy';
  if (game.craft.decoy >= DECOY_STOCK) { game.placeResult = 'carrying'; game.notify('beacon'); return false; }
  remove(game, s);
  game.craft.decoy++; game.craft.last = 'decoy';
  game.placeResult = 'picked';
  game.audio.beacon();
  if (game.motionOn()) game.burst(s.x, s.y, PLACE_BURST.n, DECOY_COLOR, PLACE_BURST.speed);
  game.notify('beacon');
  return true;
}

/** Off the map; every hunter it held goes back to the field (its progress clock starts again). */
function remove(game, s) {
  game.decoys.splice(game.decoys.indexOf(s), 1);
  for (const e of game.hunters) if (e.lure === s) release(e);
}
function release(e) { e.lure = null; e.best = Infinity; e.stall = 0; }

/** The placed Decoy nearest hunter `e` within DECOY_R cells with no rock between, or null. */
export function seenDecoy(game, e) {
  const w = game.world, R = DECOY_R * CELL;
  let best = null, bd = Infinity;
  for (const s of game.decoys) {
    if (s === e.lureNo) continue; // one it could not reach
    const dx = s.x - e.x, dy = s.y - e.y, d = Math.hypot(dx, dy);
    if (d > R || d >= bd) continue;
    if (d > 0.01 && w.raycast(e.x, e.y, dx / d, dy / d, d)) continue;
    best = s; bd = d;
  }
  return best;
}

/** hunter.js, once a frame per hunter that is not fleeing: the point it steers at while a Decoy holds it, or null (the
 *  field). A lured hunter that gets no nearer for GLITCH_GIVE_UP_S lets that Decoy go (a corner it cannot slide past). */
export function lureGoal(game, e, dt) {
  let s = e.lure;
  if (s && !game.decoys.includes(s)) { release(e); s = null; }
  if (!s) {
    if (!game.decoys.length || !(s = seenDecoy(game, e))) return null;
    e.lure = s; e.lureBest = Infinity; e.lureStall = 0; e.orb = Math.atan2(e.y - s.y, e.x - s.x);
  }
  const d = Math.hypot(e.x - s.x, e.y - s.y);
  if (d <= DECOY_NEAR * CELL && s.hold === null) s.hold = 0; // the first arrival starts the Decoy's clock
  if (s.hold === null) {
    if (d < e.lureBest - 1) { e.lureBest = d; e.lureStall = 0; } else if ((e.lureStall += dt) >= GLITCH_GIVE_UP_S) { e.lureNo = s; release(e); return null; }
    return [s.x, s.y];
  }
  if (d > DECOY_R * CELL) { release(e); return null; } // knocked far off while it held
  e.orb += dt * ORBIT_RATE;
  return [s.x + Math.cos(e.orb) * DECOY_ORBIT * CELL, s.y + Math.sin(e.orb) * DECOY_ORBIT * CELL];
}

/** Once a frame, before the hunters move: a held Decoy's clock runs; at DECOY_HOLD_S it is spent. */
export function updateDecoys(game, dt) {
  for (let k = game.decoys.length - 1; k >= 0; k--) {
    const s = game.decoys[k];
    if (s.hold === null || (s.hold += dt) < DECOY_HOLD_S) continue;
    remove(game, s);
    game.decoysSpent = (game.decoysSpent || 0) + 1; // tests only; never saved
    if (game.motionOn()) game.burst(s.x, s.y, 14, DECOY_COLOR, 160);
  }
}

/** Saved Decoys: open cells outside the Nexus disc only, no repeats, at most DECOY_MAX (B-037: a save is never trusted). */
export function loadDecoys(game, list) {
  const w = game.world, seen = new Set();
  for (const i of Array.isArray(list) ? list : []) {
    if (!Number.isInteger(i) || i < 0 || i >= w.cells.length || w.cells[i] !== T.EMPTY || seen.has(i)) continue;
    const s = makeDecoy(w, i);
    if (Math.hypot(s.x - game.nexus.x, s.y - game.nexus.y) < NEXUS_RADIUS) continue;
    seen.add(i);
    if (game.decoys.length < DECOY_MAX) game.decoys.push(s);
  }
}

/** A diamond inside a diamond (◈). */
function diamond(ctx, x, y, r) { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); }

/** World pass: the ◈, a slow pulse ring (still with reduced motion), and a draining arc while it holds a hunter. */
export function drawDecoys(r, ctx, left, top, vw, vh) {
  const ds = r.game.decoys;
  if (!ds.length) return;
  const g = r.game, pulse = g.motionOn() ? (r.time * 0.8) % 1 : 0.5;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = DECOY_COLOR; ctx.fillStyle = DECOY_COLOR; ctx.lineJoin = 'round';
  for (const s of ds) {
    if (s.x + CELL * 2 < left || s.x - CELL * 2 > left + vw || s.y + CELL * 2 < top || s.y - CELL * 2 > top + vh) continue;
    ctx.globalAlpha = 0.95; ctx.lineWidth = 2;
    ctx.beginPath(); diamond(ctx, s.x, s.y, 10); ctx.stroke();
    ctx.globalAlpha = 0.6; ctx.beginPath(); diamond(ctx, s.x, s.y, 4.5); ctx.fill();
    ctx.globalAlpha = 0.4 * (1 - pulse); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(s.x, s.y, 12 + pulse * 22, 0, Math.PI * 2); ctx.stroke();
    if (s.hold !== null) {
      const k = Math.max(0, 1 - s.hold / DECOY_HOLD_S);
      ctx.globalAlpha = 0.9; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, 15, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();
}

/** Minimap: a small peach diamond at each placed Decoy, always shown. */
export function drawDecoyMarks(m, g, sc) {
  if (!g.decoys.length) return;
  m.strokeStyle = DECOY_COLOR; m.lineWidth = 1.25;
  for (const s of g.decoys) { m.beginPath(); diamond(m, s.x * sc, s.y * sc, 3); m.stroke(); }
}
