// Crafting (S-16, D-043): Beacons. Crafted at the Nexus (Craft tab) into a carried stock, placed with B / ✦ on the core's cell.
// Placement is intent -> realized like the Scanner: `intent.place` asks, `tryPlace` realizes it or names why not.
// A placed beacon is { i, x, y, r }: its cell index plus a world-space light hole the Renderer draws via `extraLights`
// (the same array: `attach` points `renderer.extraLights` at `game.beacons`). World drawing of the beacon glyph is here too.
import { CELL, T, NEXUS_RADIUS, BEACON_COST, BEACON_STOCK, BEACON_MAX, BEACON_GAP, BEACON_LIGHT, BEACON_REVEAL } from './config.js';

export const BEACON_COLOR = '#bff8ff'; // white-cyan, on the map and in the world

export function makeBeacon(world, i) {
  const x = i % world.w, y = Math.floor(i / world.w);
  return { i, x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, r: BEACON_LIGHT };
}

/** Stock can't grow past what may still be placed, so no Prism is ever spent on a beacon that has nowhere to go. */
export function canCraft(game) {
  const n = game.craft.beacon;
  return game.bank.prism >= BEACON_COST && n < BEACON_STOCK && n + game.beacons.length < BEACON_MAX;
}
export function craftBeacon(game) {
  if (!canCraft(game)) return false;
  game.bank.prism -= BEACON_COST;
  game.craft.beacon++;
  game.audio.upgrade();
  return true;
}

/** Why a beacon can't go on the core's cell now, or null if it can. Pure: tests reuse it. */
export function placeRefusal(game) {
  const w = game.world, p = game.player;
  const cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL), i = cy * w.w + cx;
  if (game.craft.beacon < 1) return 'none';
  if (game.beacons.length >= BEACON_MAX) return 'max';
  if (!w.inBounds(cx, cy) || w.cells[i] !== T.EMPTY) return 'blocked';
  if (Math.hypot((cx + 0.5) * CELL - game.nexus.x, (cy + 0.5) * CELL - game.nexus.y) < NEXUS_RADIUS) return 'nexus';
  if (game.beacons.some(b => Math.hypot(b.i % w.w - cx, Math.floor(b.i / w.w) - cy) < BEACON_GAP)) return 'near';
  return null;
}

/** Realize a placement. Sets `game.placeResult` ('placed' or a refusal) and notifies the HUD either way. */
export function tryPlace(game) {
  const why = placeRefusal(game);
  game.placeResult = why || 'placed';
  game.notify('beacon');
  if (why) return false;
  const p = game.player, w = game.world;
  const b = makeBeacon(w, Math.floor(p.y / CELL) * w.w + Math.floor(p.x / CELL));
  game.beacons.push(b);
  game.craft.beacon--;
  game.revealQueue.push(...w.reveal(b.x, b.y, BEACON_REVEAL * CELL));
  game.audio.beacon();
  if (game.motionOn()) game.burst(b.x, b.y, 24, BEACON_COLOR, 160);
  return true;
}

/** Saved beacons come back only on open cells (a save is never trusted to be well-formed). */
export function loadBeacons(game, list) {
  const w = game.world, seen = new Set();
  for (const i of list || []) {
    if (!Number.isInteger(i) || i < 0 || i >= w.cells.length || w.cells[i] !== T.EMPTY || seen.has(i)) continue;
    seen.add(i);
    if (game.beacons.length < BEACON_MAX) game.beacons.push(makeBeacon(w, i));
  }
}

/** World pass (under the darkness; each beacon sits in its own light hole): a slow-turning diamond in a ring. */
export function drawBeacons(r, ctx, left, top, vw, vh) {
  const bs = r.game.beacons;
  if (!bs.length) return;
  const rot = r.game.motionOn() ? r.time * 0.6 : 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = BEACON_COLOR; ctx.fillStyle = 'rgba(191, 248, 255, 0.35)';
  for (const b of bs) {
    if (b.x + 20 < left || b.x - 20 > left + vw || b.y + 20 < top || b.y - 20 > top + vh) continue;
    ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(b.x, b.y, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.95; ctx.lineWidth = 2;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** S-25 (D-061): a faint additive cyan disc on the floor of every light pool in `r.extraLights` (the beacons), drawn right
 *  after the grid so walls and ore cover it and the darkness dims it like the floor. One cached sprite per radius (D-051),
 *  culled to the view. The gradient is smooth, so all visible discs are summed into one quarter-res layer over their union
 *  box and blitted once (20 overlapping full-res discs cost 2.2x an empty frame in drawcost.cjs; this keeps the 2x budget).
 *  Static, so reduced motion needs nothing. `r.beaconGlow` is the centre alpha (0 = off, for tests). */
const GLOW_DOWN = 4; // layer pixels per screen pixel, per axis
export function drawBeaconGlow(r, ctx, left, top, vw, vh) {
  const a = r.beaconGlow, ls = r.extraLights;
  if (!(a > 0) || !ls.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of ls) {
    if (e.x + e.r < left || e.x - e.r > left + vw || e.y + e.r < top || e.y - e.r > top + vh) continue;
    x0 = Math.min(x0, e.x - e.r); y0 = Math.min(y0, e.y - e.r); x1 = Math.max(x1, e.x + e.r); y1 = Math.max(y1, e.y + e.r);
  }
  if (x0 === Infinity) return;
  x0 = Math.max(x0, left); y0 = Math.max(y0, top); x1 = Math.min(x1, left + vw); y1 = Math.min(y1, top + vh);
  const k = r.zoom * r.dpr / GLOW_DOWN, lw = Math.ceil((x1 - x0) * k) + 1, lh = Math.ceil((y1 - y0) * k) + 1;
  const L = r.glowLayer || (r.glowLayer = document.createElement('canvas'));
  if (L.width < lw || L.height < lh) { L.width = Math.max(L.width, lw); L.height = Math.max(L.height, lh); }
  const g = L.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, lw, lh);
  g.globalCompositeOperation = 'lighter'; g.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
  for (const e of ls) {
    const R = e.r;
    if (e.x + R < x0 || e.x - R > x1 || e.y + R < y0 || e.y - R > y1) continue;
    const sp = r.glowSprite(`bg-${R}-${a}`, R, p => {
      const grd = p.createRadialGradient(0, 0, 0, 0, 0, R);
      grd.addColorStop(0, `rgba(191, 248, 255, ${a})`);
      grd.addColorStop(0.6, `rgba(191, 248, 255, ${a * 0.45})`);
      grd.addColorStop(1, 'rgba(191, 248, 255, 0)');
      p.fillStyle = grd; p.beginPath(); p.arc(0, 0, R, 0, Math.PI * 2); p.fill();
    });
    g.drawImage(sp.canvas, e.x - R, e.y - R, R * 2, R * 2);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(L, 0, 0, lw, lh, x0, y0, lw / k, lh / k);
  ctx.restore();
}
