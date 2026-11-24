// Crafting (S-16, D-043): Beacons and (S-22, D-056) Relays. Crafted at the Nexus (Craft tab) into a carried stock, placed with
// B / ✦ on the core's cell: the item crafted most recently that is still carried (`craft.last`, `placeKind`).
// Placement is intent -> realized like the Scanner: `intent.place` asks, `tryPlace` realizes it or names why not.
// A placed beacon is { i, x, y, r }: its cell index plus a world-space light the Renderer draws in light.js (S-26):
// `attach` puts `game.beacons` itself in `renderer.lightSets`. World drawing of the beacon glyph is here too.
import { CELL, T, NEXUS_RADIUS, BEACON_COST, BEACON_STOCK, BEACON_MAX, BEACON_GAP, BEACON_LIGHT, BEACON_REVEAL, BEACON_RGB,
  RELAY_COST, RELAY_STOCK, RELAY_MAX, RELAY_MIN_D, RELAY_GAP, RELAY_R, RELAY_LIGHT, RELAY_RGB, PLACE_BURST } from './config.js';

export const BEACON_COLOR = `rgb(${BEACON_RGB})`; // white-cyan, on the map and in the world
export const RELAY_COLOR = `rgb(${RELAY_RGB})`;   // S-22: cyan-white
export const PLACE_GLYPH = { beacon: '✦', relay: '⊕' };

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
  game.craft.last = 'beacon';
  game.audio.upgrade();
  return true;
}

/** S-22: 12▲ + 40◆ from the bank; stock + placed never passes RELAY_MAX (D-060's rule). */
export function canCraftRelay(game) {
  const n = game.craft.relay;
  return game.bank.prism >= RELAY_COST.prism && game.bank.shard >= RELAY_COST.shard && n < RELAY_STOCK && n + game.relays.length < RELAY_MAX;
}
export function craftRelay(game) {
  if (!canCraftRelay(game)) return false;
  game.bank.prism -= RELAY_COST.prism; game.bank.shard -= RELAY_COST.shard;
  game.craft.relay++;
  game.craft.last = 'relay';
  game.audio.upgrade();
  return true;
}

export function makeRelay(world, i) {
  const x = i % world.w, y = Math.floor(i / world.w);
  return { i, x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, r: RELAY_LIGHT, glow: RELAY_RGB };
}

/** What B / ✦ places: the item crafted most recently, if still carried, else the other one carried (S-22). */
export function placeKind(game) {
  const c = game.craft, last = c.last === 'relay' ? 'relay' : 'beacon', other = last === 'relay' ? 'beacon' : 'relay';
  return c[last] > 0 || !(c[other] > 0) ? last : other;
}

/** Why an item can't go on the core's cell now, or null if it can. Pure: tests reuse it. */
export function placeRefusal(game, kind = placeKind(game)) {
  const w = game.world, p = game.player;
  const cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL), i = cy * w.w + cx;
  const relay = kind === 'relay', list = relay ? game.relays : game.beacons;
  if (game.craft[kind] < 1) return 'none';
  if (list.length >= (relay ? RELAY_MAX : BEACON_MAX)) return 'max';
  if (!w.inBounds(cx, cy) || w.cells[i] !== T.EMPTY || game.beacons.some(b => b.i === i) || game.relays.some(b => b.i === i)) return 'blocked';
  const dn = Math.hypot((cx + 0.5) * CELL - game.nexus.x, (cy + 0.5) * CELL - game.nexus.y);
  if (dn < (relay ? RELAY_MIN_D * CELL : NEXUS_RADIUS)) return 'nexus';
  const cellsTo = b => Math.hypot(b.i % w.w - cx, Math.floor(b.i / w.w) - cy);
  if (!relay) return game.beacons.some(b => cellsTo(b) < BEACON_GAP) ? 'near' : null;
  if (game.relays.some(b => cellsTo(b) < RELAY_GAP)) return 'near';
  if (w.vaults.some(v => Math.hypot(v.x - cx, v.y - cy) < RELAY_GAP)) return 'vault';
  // A Spire's 9×9 footprint: distance from the cell to its nearest footprint cell.
  if (game.spires.some(q => Math.hypot(Math.max(0, Math.abs(q.x - cx) - 4), Math.max(0, Math.abs(q.y - cy) - 4)) < RELAY_GAP)) return 'spire';
  return null;
}

/** Realize a placement. Sets `game.placeKind` + `game.placeResult` ('placed' or a refusal) and notifies the HUD either way. */
export function tryPlace(game) {
  const at = relayAt(game);
  if (at) return pickUpRelay(game, at); // S-34 (D-092): B / ✦ inside a Relay's ring picks it up instead
  const kind = placeKind(game), why = placeRefusal(game, kind);
  game.placeKind = kind;
  game.placeResult = why || 'placed';
  game.notify('beacon');
  if (why) return false;
  const p = game.player, w = game.world, i = Math.floor(p.y / CELL) * w.w + Math.floor(p.x / CELL);
  game.craft[kind]--;
  game.audio.beacon();
  if (kind === 'relay') {
    const r = makeRelay(w, i);
    game.relays.push(r);
    if (game.motionOn()) game.burst(r.x, r.y, PLACE_BURST.n, RELAY_COLOR, PLACE_BURST.speed);
    return true;
  }
  const b = makeBeacon(w, i);
  game.beacons.push(b);
  game.revealQueue.push(...w.reveal(b.x, b.y, BEACON_REVEAL * CELL));
  if (game.motionOn()) game.burst(b.x, b.y, PLACE_BURST.n, BEACON_COLOR, PLACE_BURST.speed);
  return true;
}

/** S-34 (D-092): a placed Relay back into stock, free (it never left the world's supply), unless one is carried already.
 *  `game.relays` is spliced in place: it is the Renderer's light set, so the light and the minimap ring go this frame. */
export function pickUpRelay(game, r) {
  game.placeKind = 'relay';
  if (game.craft.relay >= RELAY_STOCK) { game.placeResult = 'carrying'; game.notify('beacon'); return false; }
  game.relays.splice(game.relays.indexOf(r), 1);
  game.craft.relay++; game.craft.last = 'relay';
  game.placeResult = 'picked';
  game.audio.beacon();
  if (game.motionOn()) game.burst(r.x, r.y, PLACE_BURST.n, RELAY_COLOR, PLACE_BURST.speed);
  game.notify('beacon');
  return true;
}

/** S-22: the Relay whose bank zone holds the core, or null. */
export function relayAt(game) {
  const p = game.player;
  for (const r of game.relays) if (Math.hypot(p.x - r.x, p.y - r.y) < RELAY_R) return r;
  return null;
}

/** Saved beacons come back only on open cells (a save is never trusted to be well-formed). */
export function loadBeacons(game, list) {
  const w = game.world, seen = new Set();
  for (const i of Array.isArray(list) ? list : []) { // B-037: a non-array (`{}`, `3`) is no beacons, not a crash
    if (!Number.isInteger(i) || i < 0 || i >= w.cells.length || w.cells[i] !== T.EMPTY || seen.has(i)) continue;
    seen.add(i);
    if (game.beacons.length < BEACON_MAX) game.beacons.push(makeBeacon(w, i));
  }
}

/** S-22: saved Relays, same rule as beacons (open cells, no repeats, at most RELAY_MAX). */
export function loadRelays(game, list) {
  const w = game.world, seen = new Set();
  for (const i of Array.isArray(list) ? list : []) {
    if (!Number.isInteger(i) || i < 0 || i >= w.cells.length || w.cells[i] !== T.EMPTY || seen.has(i)) continue;
    seen.add(i);
    if (game.relays.length < RELAY_MAX) game.relays.push(makeRelay(w, i));
  }
}

/** S-22 world pass: ⊕ (a ring with a slow-turning cross) and a faint dashed ring at the bank radius. */
export function drawRelays(r, ctx, left, top, vw, vh) {
  const rs = r.game.relays;
  if (!rs.length) return;
  const rot = r.game.motionOn() ? r.time * 0.4 : 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = RELAY_COLOR;
  for (const q of rs) {
    if (q.x + RELAY_R < left || q.x - RELAY_R > left + vw || q.y + RELAY_R < top || q.y - RELAY_R > top + vh) continue;
    ctx.globalAlpha = 0.22; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.arc(q.x, q.y, RELAY_R, rot * 0.25, rot * 0.25 + Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.95; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(q.x, q.y, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.moveTo(0, -14); ctx.lineTo(0, 14); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** World pass (under the darkness; each beacon sits in its own light hole): a slow-turning diamond in a ring. */
export function drawBeacons(r, ctx, left, top, vw, vh) {
  const bs = r.game.beacons;
  if (!bs.length) return;
  const rot = r.game.motionOn() ? r.time * 0.6 : 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = BEACON_COLOR; ctx.fillStyle = `rgba(${BEACON_RGB}, 0.35)`;
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
