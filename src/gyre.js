// S-61a Gyre (D-168): the Shoal boss. Its lair, stamp, plates, loot and save are the Crucible's (boss.js); what differs lives
// here. A whirlpool: within GYRE_R cells of a live Gyre's core the Undertow (undertow.js) is a clockwise tangential current of
// GYRE_SPEED px/s instead of the chunk's draw, so riding it carries the core round the body. The key: one plate (seeded start
// from rng 'gyre') is the mint key and the only one that cuts; it steps to the next standing plate clockwise every
// GYRE_STEP_S (and at once when it breaks), and every plate keeps the damage it took. No flare, no embers. Until S-61b the
// Gyre has no Surge form (BOSS_WAKES): Surge plays the same take-apart.
import { CELL, T, GYRE_RING, GYRE_R, GYRE_SPEED, GYRE_STEP_S, GYRE_RGB } from './config.js';
import { PLATES } from './boss.js';

const live = game => (game.bosses ? game.bosses.list.filter(B => B.ring === GYRE_RING && !B.down) : []);

/** The whirlpool current [vx, vy] (px/s) at a point within GYRE_R cells of a live Gyre's core, else null. Clockwise on
 *  screen (y grows down): north of the core it runs east. */
export function gyreCurrent(game, px, py) {
  for (const B of live(game)) {
    const dx = px - (B.x + 0.5) * CELL, dy = py - (B.y + 0.5) * CELL, d = Math.hypot(dx, dy);
    if (d > GYRE_R * CELL) continue;
    return d < 1e-6 ? [0, 0] : [-dy / d * GYRE_SPEED, dx / d * GYRE_SPEED];
  }
  return null;
}

/** The first standing plate after k, clockwise (k itself if it is the last one standing). */
export function nextKey(world, B, k) {
  for (let n = (k + 1) % 8, s = 0; s < 8; n = (n + 1) % 8, s++) {
    const [i, j] = PLATES[n];
    if (world.get(B.x + i, B.y + j) === T.BOSS_PLATE) return n;
  }
  return k;
}

/** Once a frame (boss.js updateBosses): the key steps one standing plate clockwise every GYRE_STEP_S. */
export function stepGyre(game, B, dt) {
  if ((B.step -= dt) > 0) return;
  B.step = Math.max(B.step + GYRE_STEP_S, 1e-3);
  B.lit = nextKey(game.world, B, B.lit);
  game.bosses.steps++;
}

/** The key broke: it passes on at once, with a full step to the next plate. */
export function gyreKeyBroke(game, B, k) { B.lit = nextKey(game.world, B, k); B.step = GYRE_STEP_S; }

/** World transform, a seen live Gyre in view: whirlpool dashes on rings round the body (curved, moving clockwise at the
 *  current's speed; still in reduced motion), the core's mint ring with a turning inner hexagon, and the key plate. */
export function drawGyre(r, ctx, B, still) {
  const w = r.game.world, cx = (B.x + 0.5) * CELL, cy = (B.y + 0.5) * CELL, R = GYRE_R * CELL;
  ctx.save();
  ctx.strokeStyle = `rgba(${GYRE_RGB}, 0.4)`; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath();
  let n = 0;
  for (let ring = 0; ring < 4; ring++) {
    const rad = (2 + ring) * CELL + CELL * 0.5, spin = still ? 0 : r.time * GYRE_SPEED / rad, arc = 0.35;
    for (let s = 0; s < 6; s++) {
      const a = spin + s * Math.PI / 3 + ring * 0.7, mx = cx + Math.cos(a + arc / 2) * rad, my = cy + Math.sin(a + arc / 2) * rad;
      if (rad > R || w.solidAtPx(mx, my)) continue;
      ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); ctx.arc(cx, cy, rad, a, a + arc); n++;
    }
  }
  ctx.stroke();
  r.gyreDashes = n; // tests read the count
  const m = 2 * CELL + r.glowPad(12);
  ctx.beginPath(); ctx.rect(cx - m, cy - m, m * 2, m * 2); ctx.clip(); // a blur in 'lighter' is clipped to its reach (B-091)
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = ctx.shadowColor = ctx.fillStyle = `rgb(${GYRE_RGB})`; ctx.shadowBlur = 12; ctx.lineJoin = 'round';
  const pulse = still ? 1 : 0.7 + 0.3 * Math.sin(r.time * 1.6), turn = still ? 0 : r.time * 0.9;
  ctx.lineWidth = 2; ctx.globalAlpha = 0.6 * pulse;
  ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.4, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  for (let k = 0; k < 6; k++) { const a = turn + k * Math.PI / 3; ctx[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * CELL * 0.24, cy + Math.sin(a) * CELL * 0.24); }
  ctx.closePath(); ctx.stroke();
  const [i, j] = PLATES[B.lit], lp = still ? 1 : 0.6 + 0.4 * Math.sin(r.time * 5);
  if (w.get(B.x + i, B.y + j) === T.BOSS_PLATE) {
    const px = (B.x + i) * CELL, py = (B.y + j) * CELL;
    ctx.globalCompositeOperation = 'source-over'; // mint over the plate's rose, not added to it (that read white)
    ctx.globalAlpha = Math.min(1, 1.1 * lp); ctx.lineWidth = 3; ctx.strokeRect(px + 2.5, py + 2.5, CELL - 5, CELL - 5);
    ctx.globalAlpha = 0.6 * lp; ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
  }
  ctx.restore();
}
