// S-61a Gyre (D-168): the Shoal boss. Its lair, stamp, plates, loot and save are the Crucible's (boss.js); what differs lives
// here. A whirlpool: within GYRE_R cells of a live Gyre's core the Undertow (undertow.js) is a clockwise tangential current of
// GYRE_SPEED px/s instead of the chunk's draw, so riding it carries the core round the body. The key: one plate (seeded start
// from rng 'gyre') is the mint key and the only one that cuts; it steps to the next standing plate clockwise every
// GYRE_STEP_S (and at once when it breaks), and every plate keeps the damage it took. No flare, no embers.
// S-61b Surge form (D-170): awake (boss.js bossAwake) any plate cuts and the key is hidden. Far threat: every GYRE_SWARM_S a
// mote swarm (S-54 rules, mote.js) leaves the lair edge, at most GYRE_SWARMS alive. Close threat, the rim: a core within
// GYRE_RIM_PX of a standing body cell takes BOSS_TOUCH_DMG and a knockback outward, once per GYRE_TOUCH_CD_S; the body's
// outline sparks mint for the GYRE_RIM_TELL_S before it can hit again. The whirlpool also pulls inward (GYRE_PULL).
import { CELL, T, LAIR_HALF, GYRE_RING, GYRE_R, GYRE_SPEED, GYRE_STEP_S, GYRE_RGB, GYRE_SWARM_S, GYRE_SWARMS, GYRE_RIM_PX,
  BOSS_TOUCH_DMG, GYRE_TOUCH_CD_S, GYRE_RIM_TELL_S, GYRE_PULL } from './config.js';
import { PLATES, bossAwake } from './boss.js';
import { spawnSwarm } from './mote.js';

const live = game => (game.bosses ? game.bosses.list.filter(B => B.ring === GYRE_RING && !B.down) : []);

/** The whirlpool current [vx, vy] (px/s) at a point within GYRE_R cells of a live Gyre's core, else null. Clockwise on
 *  screen (y grows down): north of the core it runs east. */
export function gyreCurrent(game, px, py) {
  for (const B of live(game)) {
    const dx = px - (B.x + 0.5) * CELL, dy = py - (B.y + 0.5) * CELL, d = Math.hypot(dx, dy);
    if (d > GYRE_R * CELL) continue;
    if (d < 1e-6) return [0, 0];
    const pull = bossAwake(game, B) ? GYRE_PULL : 0; // S-61b: awake, it also draws inward
    return [(-dy * GYRE_SPEED - dx * pull) / d, (dx * GYRE_SPEED - dy * pull) / d];
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

/** Gap (px) from the core's edge to the nearest standing body cell (plates and the boss core), Infinity with none. */
export function rimGap(game, B) {
  const w = game.world, p = game.player;
  let best = Infinity;
  for (const [i, j] of [[0, 0], ...PLATES]) {
    const x = B.x + i, y = B.y + j, t = w.get(x, y);
    if (t !== T.BOSS_PLATE && t !== T.BOSS_CORE) continue;
    const dx = Math.max(x * CELL - p.x, 0, p.x - (x + 1) * CELL), dy = Math.max(y * CELL - p.y, 0, p.y - (y + 1) * CELL);
    best = Math.min(best, Math.hypot(dx, dy) - p.r);
  }
  return best;
}

/** S-61b, once a frame after stepGyre: the Surge form. Waking resets the swarm clock (a full gap) and arms the rim. */
export function surgeGyre(game, B, dt) {
  const awake = bossAwake(game, B), bs = game.bosses, p = game.player, s = game.swarm;
  if (awake !== B.awake) { B.awake = awake; B.swarmT = GYRE_SWARM_S; B.touch = 0; }
  B.touch = Math.max(0, (B.touch || 0) - dt);
  if (!awake) return;
  game.bossAwake = true;
  if ((B.swarmT -= dt) <= 0) {
    B.swarmT = GYRE_SWARM_S;
    const alive = new Set(s && !s.off ? s.motes.filter(m => m.boss).map(m => m.grp) : []).size;
    if (s && !s.off && alive < GYRE_SWARMS) releaseSwarm(game, B);
  }
  if (B.touch > 0 || p.invuln > 0 || rimGap(game, B) > GYRE_RIM_PX) return;
  const dx = p.x - (B.x + 0.5) * CELL, dy = p.y - (B.y + 0.5) * CELL, d = Math.hypot(dx, dy) || 1;
  B.touch = GYRE_TOUCH_CD_S; bs.rims++;
  game.audio.bossThump();
  game.hurtPlayer(BOSS_TOUCH_DMG, dx / d, dy / d); // the knockback goes out, into the current
}

/** A swarm on an open cell of the lair's edge (seeded, rng 'gyre-swarm'), nearest the core of a few drawn. */
function releaseSwarm(game, B) {
  const w = game.world, H = LAIR_HALF, edge = [];
  for (let j = -H; j <= H; j++) for (let i = -H; i <= H; i++) if (Math.max(Math.abs(i), Math.abs(j)) === H && w.get(B.x + i, B.y + j) === T.EMPTY) edge.push([B.x + i, B.y + j]);
  if (!edge.length) return;
  const [x, y] = edge[Math.floor(game.rng['gyre-swarm']() * edge.length)];
  spawnSwarm(game, (x + 0.5) * CELL, (y + 0.5) * CELL, true);
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
  r.gyreRim = false;
  if (B.awake && B.touch <= GYRE_RIM_TELL_S) { // S-61b tell: the body's outline sparks before the rim can hit again
    r.gyreRim = true;
    ctx.globalAlpha = still ? 0.8 : 0.55 + 0.45 * Math.sin(r.time * 24) ** 2; ctx.lineWidth = 2;
    ctx.strokeRect((B.x - 1) * CELL - 3, (B.y - 1) * CELL - 3, 3 * CELL + 6, 3 * CELL + 6);
  }
  const [i, j] = PLATES[B.lit], lp = still ? 1 : 0.6 + 0.4 * Math.sin(r.time * 5);
  if (!B.awake && w.get(B.x + i, B.y + j) === T.BOSS_PLATE) { // awake (S-61b) every plate cuts: no key mark
    const px = (B.x + i) * CELL, py = (B.y + j) * CELL;
    ctx.globalCompositeOperation = 'source-over'; // mint over the plate's rose, not added to it (that read white)
    ctx.globalAlpha = Math.min(1, 1.1 * lp); ctx.lineWidth = 3; ctx.strokeRect(px + 2.5, py + 2.5, CELL - 5, CELL - 5);
    ctx.globalAlpha = 0.6 * lp; ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
  }
  ctx.restore();
}
