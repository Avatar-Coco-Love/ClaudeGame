// S-56 (D-153) Ward: a crafted placeable that guards. Crafted at the Nexus (Craft tab, every world) into a carried stock,
// placed with B / ✦ (craft.js `tryPlace` asks here) on open floor outside the Nexus disc, WARD_GAP cells from another Ward.
// Every WARD_S a Ward bolts the creature nearest it within WARD_R cells that it can see (no rock between) for WARD_DMG hp:
// Glitches, Spitters and their bolts (Surge), a surfaced Burrower and motes (both modes). It only takes hp: glitch.js /
// spitter.js / burrower.js / mote.js kill it on their next pass; a Ward's killing bolt (`warded`) pays no kill loot, only
// what the creature carried (D-154: a Ward halves a creature's cost, never turns it into income). Same in Drift and Surge.
// A placed Ward is { i, x, y, t, shot }: `t` (time to the next bolt) and `shot` are never saved. B / ✦ on one picks it up.
import { CELL, T, NEXUS_RADIUS, WARD_COST, WARD_STOCK, WARD_MAX, WARD_GAP, WARD_R, WARD_S, WARD_DMG, WARD_PICK_R, WARD_SHOT_S,
  WARD_RGB, PLACE_BURST } from './config.js';
import { beamFoes } from './spitter.js';

export const WARD_COLOR = `rgb(${WARD_RGB})`;

export function makeWard(world, i) {
  const x = i % world.w, y = Math.floor(i / world.w);
  return { i, x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, t: 0, shot: null };
}

/** Stock + placed never passes WARD_MAX, so nothing is spent on a Ward with nowhere to go. */
export function canCraftWard(game) {
  const n = game.craft.ward, b = game.bank;
  return b.prism >= WARD_COST.prism && b.shard >= WARD_COST.shard && n < WARD_STOCK && n + game.wards.length < WARD_MAX;
}
export function craftWard(game) {
  if (!canCraftWard(game)) return false;
  game.bank.prism -= WARD_COST.prism; game.bank.shard -= WARD_COST.shard;
  game.craft.ward++; game.craft.last = 'ward';
  game.audio.upgrade();
  return true;
}

/** Why a Ward can't go on cell (cx, cy) now, or null. 'blocked' (not open / taken) is decided by craft.js's shared check. */
export function wardRefusal(game, cx, cy) {
  if (game.wards.length >= WARD_MAX) return 'max';
  if (Math.hypot((cx + 0.5) * CELL - game.nexus.x, (cy + 0.5) * CELL - game.nexus.y) < NEXUS_RADIUS) return 'nexus';
  const w = game.world.w;
  if (game.wards.some(s => Math.hypot(s.i % w - cx, Math.floor(s.i / w) - cy) < WARD_GAP)) return 'near';
  return null;
}

/** The Ward the core sits on (within WARD_PICK_R cells), or null: B / ✦ there picks it up. */
export function wardAt(game) {
  const p = game.player;
  for (const s of game.wards) if (Math.hypot(p.x - s.x, p.y - s.y) < WARD_PICK_R * CELL) return s;
  return null;
}

/** Back into stock, free, unless WARD_STOCK are carried already. Sets placeKind / placeResult like a placement. */
export function pickUpWard(game, s) {
  game.placeKind = 'ward';
  if (game.craft.ward >= WARD_STOCK) { game.placeResult = 'carrying'; game.notify('beacon'); return false; }
  game.wards.splice(game.wards.indexOf(s), 1);
  game.craft.ward++; game.craft.last = 'ward';
  game.placeResult = 'picked';
  game.audio.beacon();
  if (game.motionOn()) game.burst(s.x, s.y, PLACE_BURST.n, WARD_COLOR, PLACE_BURST.speed);
  game.notify('beacon');
  return true;
}

/** The live foe nearest Ward `s` within WARD_R cells with no rock between, or null. */
export function wardTarget(game, s) {
  const w = game.world, R = WARD_R * CELL;
  let best = null, bd = Infinity;
  for (const f of beamFoes(game)) {
    if (f.fade !== undefined || f.hp <= 0 || f.ember) continue; // S-60b: a boss's embers are not creatures // gave up (S-6) or already dead this frame
    const d = Math.hypot(f.x - s.x, f.y - s.y);
    if (d > R || d >= bd) continue;
    if (d > 0.01 && w.raycast(s.x, s.y, (f.x - s.x) / d, (f.y - s.y) / d, Math.max(0, d - (f.r || 0)))) continue;
    best = f; bd = d;
  }
  return best;
}

/** Once a frame, after the beam and before the creatures' own passes (so a Ward kill pays this frame). */
export function updateWards(game, dt) {
  for (const s of game.wards) {
    if (s.shot) { s.shot.t -= dt; if (s.shot.t <= 0) s.shot = null; }
    s.t = Math.max(0, s.t - dt);
    if (s.t > 0) continue;
    const f = wardTarget(game, s);
    if (!f) continue;
    f.hp -= WARD_DMG; f.flash = 0.08;
    if (f.hp <= 0) f.warded = true; // D-154: a Ward's kill drops what the creature carried, never the kill loot
    s.t = WARD_S; s.shot = { x: f.x, y: f.y, t: WARD_SHOT_S };
    game.wardShots = (game.wardShots || 0) + 1; // tests only; never saved
  }
}

/** Saved Wards: open cells outside the Nexus disc only, no repeats, at most WARD_MAX (B-037: a save is never trusted). */
export function loadWards(game, list) {
  const w = game.world, seen = new Set();
  for (const i of Array.isArray(list) ? list : []) {
    if (!Number.isInteger(i) || i < 0 || i >= w.cells.length || w.cells[i] !== T.EMPTY || seen.has(i)) continue;
    const s = makeWard(w, i);
    if (Math.hypot(s.x - game.nexus.x, s.y - game.nexus.y) < NEXUS_RADIUS) continue;
    seen.add(i);
    if (game.wards.length < WARD_MAX) game.wards.push(s);
  }
}

/** A ring with four short inward ticks (a sight), turned slowly. */
function sight(ctx, x, y, r, rot) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  for (let k = 0; k < 4; k++) {
    const a = rot + k * Math.PI / 2, c = Math.cos(a), sn = Math.sin(a);
    ctx.moveTo(x + c * (r + 4), y + sn * (r + 4)); ctx.lineTo(x + c * (r - 4), y + sn * (r - 4));
  }
  ctx.stroke();
}

/** World pass: the sight, a dot that brightens as the next bolt nears, the shot line, and a faint WARD_R ring near the core. */
export function drawWards(r, ctx, left, top, vw, vh) {
  const ws = r.game.wards;
  if (!ws.length) return;
  const g = r.game, p = g.player, R = WARD_R * CELL, rot = g.motionOn() ? r.time * 0.5 : 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = WARD_COLOR; ctx.fillStyle = WARD_COLOR; ctx.lineCap = 'round';
  for (const s of ws) {
    if (s.x + R < left || s.x - R > left + vw || s.y + R < top || s.y - R > top + vh) continue;
    if (Math.hypot(p.x - s.x, p.y - s.y) <= R + 2 * CELL) {
      ctx.globalAlpha = 0.14; ctx.lineWidth = 1; ctx.setLineDash([2, 8]);
      ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 0.95; ctx.lineWidth = 2;
    sight(ctx, s.x, s.y, 10, rot);
    ctx.globalAlpha = 0.35 + 0.55 * (1 - s.t / WARD_S);
    ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI * 2); ctx.fill();
    if (s.shot) {
      const k = s.shot.t / WARD_SHOT_S;
      ctx.globalAlpha = 0.9 * k; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.shot.x, s.shot.y); ctx.stroke();
    }
  }
  ctx.restore();
}

/** Minimap: a small lime ring with a dot at each placed Ward, always shown. */
export function drawWardMarks(m, g, sc) {
  if (!g.wards.length) return;
  m.strokeStyle = WARD_COLOR; m.fillStyle = WARD_COLOR; m.lineWidth = 1;
  for (const s of g.wards) {
    m.beginPath(); m.arc(s.x * sc, s.y * sc, 3, 0, Math.PI * 2); m.stroke();
    m.fillRect(s.x * sc - 0.75, s.y * sc - 0.75, 1.5, 1.5);
  }
}
