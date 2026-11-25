// S-53 Burrower (D-142, D-145): the Kiln creature. 256 worlds only (no Kiln elsewhere), one at a time while the core is in
// the Kiln ring. It lives in the rock: one cell per BURROW_STEP_S through ROCK / DENSE / ore (or open floor), never vault,
// Spire, bedrock or the Nexus disc, clearing each cell it leaves (a free tunnel; S-53c: tunnel ore's yield is lost). From
// BURROW_TELL_CELLS of the core it shows a BURROW_TELL_S tell (its cell glows Calx lilac with cracks, drawn over the dark),
// then surfaces for BURROW_UP_S: the only time the beam can hit it (`beamFoes` in spitter.js adds it). Both modes hunt the
// core (S-53c, D-147) and miss if it moved BURROW_DODGE cells during the tell: Surge lunges for BURROW_DMG, Drift bites
// BURROW_BITE cargo items, most valuable first, gone for good (never damage). Then it burrows BURROW_AWAY cells off and
// comes back. Killed or driven off it drops its belly (the cell it broke out of) plus the Glitch loot of its tier, equal in
// both modes (a bite is never refunded). Seeded (`rng.burrower`,
// `rng['burrower-loot']`); nothing is saved (its tunnels are ordinary broken cells). None in a Wake or the Ending.
import {
  CELL, T, MATERIAL, NEXUS_RADIUS, KILN_RING, GLITCH_HIT_CD_S, GLITCH_LOOT_SHARDS, GLITCH_PRISM_CHANCE,
  BURROW_FIRST_S, BURROW_EVERY_S, BURROW_SPAWN_R, BURROW_STEP_S, BURROW_TELL_CELLS, BURROW_TELL_S, BURROW_UP_S, BURROW_HP,
  BURROW_DMG, BURROW_DODGE, BURROW_BITE, BURROW_AWAY, BURROW_TRIP_S, BURROW_LEASH, BURROW_R, BURROW_RGB, MUSIC_RUMBLE,
} from './config.js';
import { glitchTier } from './glitch.js';

const DIG = new Set([T.EMPTY, T.ROCK, T.DENSE, T.CRYSTAL, T.PRISM, T.LUMEN, T.TIDE, T.CALX]);
const isOre = t => !!(MATERIAL[t] && MATERIAL[t].yield);
const centre = c => (c + 0.5) * CELL;

/** Spawner state (never saved). Counters are for tests: spawned, lunges (hits), dodged, kills, eaten (belly ore cells),
 *  lost (tunnel ore cells, yield gone), bites (Drift bites that took ≥ 1 item), bitten (items taken). */
export function makeBurrow() { return { b: null, timer: BURROW_FIRST_S, off: false, spawned: 0, lunges: 0, dodged: 0, kills: 0, eaten: 0, lost: 0, bites: 0, bitten: 0 }; }

/** S-53c: what a Drift bite takes first (≈ ⬟, then ▲ ●, then ◆). */
export const BITE_ORDER = ['tide', 'calx', 'prism', 'lumen', 'shard'];

const nextGap = game => BURROW_EVERY_S[0] + game.rng.burrower() * BURROW_EVERY_S[1];

/** Remove the Burrower without loot (mode switch, death, Wake, Ending, leash); the next one waits a full gap. */
export function clearBurrower(game) {
  const s = game.burrow;
  if (s && s.b) { s.b = null; s.timer = nextGap(game); }
}

function canStep(game, x, y) {
  if (!DIG.has(game.world.get(x, y))) return false; // out of bounds reads as bedrock
  return Math.hypot(centre(x) - game.nexus.x, centre(y) - game.nexus.y) > NEXUS_RADIUS + CELL;
}

function spawn(game, pcx, pcy) {
  const r = game.rng.burrower, w = game.world;
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = BURROW_SPAWN_R[0] + r() * (BURROW_SPAWN_R[1] - BURROW_SPAWN_R[0]);
    const x = pcx + Math.round(Math.cos(a) * d), y = pcy + Math.round(Math.sin(a) * d), t = w.get(x, y);
    if ((t !== T.ROCK && t !== T.DENSE) || !canStep(game, x, y)) continue;
    const tier = glitchTier(Math.hypot(centre(x) - game.nexus.x, centre(y) - game.nexus.y));
    game.burrow.spawned++;
    return { burrower: true, cx: x, cy: y, fx: x, fy: y, prog: 1, x: centre(x), y: centre(y), r: BURROW_R, tier, state: 'dig',
      t: 0, step: BURROW_STEP_S, trip: 0, hp: BURROW_HP, maxHp: BURROW_HP, flash: 0, hitCd: 0, ate: {}, heading: a + Math.PI };
  }
  return null;
}

/** Clear the cell the Burrower is in. S-53c: only the cell it breaks out of (`belly`) feeds its belly (dropped only if it
 *  is beaten); an ore cell it tunnels through loses its yield. */
function eatCell(game, x, y, b, belly) {
  const w = game.world, t = w.get(x, y);
  if (t === T.EMPTY || !DIG.has(t)) return;
  if (isOre(t) && !belly) game.burrow.lost++;
  else if (isOre(t)) {
    const y0 = MATERIAL[t].yield, kind = y0.kind;
    b.ate[kind] = (b.ate[kind] || 0) + y0.min + Math.floor(game.rng['burrower-loot']() * (y0.max - y0.min + 1));
    game.burrow.eaten++;
  }
  w.destroy(x, y);
}

/** One cell toward (gx, gy): the 4-neighbour closest to it; stuck (none closer) -> a seeded random open neighbour. */
function stepToward(game, b, gx, gy, avoid) {
  const opts = [];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = b.cx + dx, y = b.cy + dy;
    if ((avoid && x === avoid.x && y === avoid.y) || !canStep(game, x, y)) continue;
    opts.push({ x, y, d: (x - gx) ** 2 + (y - gy) ** 2 });
  }
  if (!opts.length) return;
  opts.sort((a, c) => a.d - c.d);
  const here = (b.cx - gx) ** 2 + (b.cy - gy) ** 2;
  const to = opts[0].d < here ? opts[0] : opts[Math.floor(game.rng.burrower() * opts.length)];
  eatCell(game, b.cx, b.cy, b, false); // the cell it leaves becomes tunnel
  b.fx = b.cx; b.fy = b.cy; b.cx = to.x; b.cy = to.y; b.prog = 0;
  b.heading = Math.atan2(b.cy - b.fy, b.cx - b.fx);
}

function beaten(game, b) {
  const s = game.burrow;
  game.burst(b.x, b.y, 22, `rgb(${BURROW_RGB})`, 220);
  game.audio.enemyDie();
  for (const [kind, n] of Object.entries(b.ate)) for (let i = 0; i < n; i++) game.spawnPickup(b.x, b.y, kind);
  if (game.rng['burrower-loot']() < GLITCH_PRISM_CHANCE) game.spawnPickup(b.x, b.y, 'prism');
  for (let j = 0; j < GLITCH_LOOT_SHARDS + b.tier; j++) game.spawnPickup(b.x, b.y, 'shard');
  game.addShake(4);
  s.kills++; s.b = null; s.timer = nextGap(game);
}

/** S-53c Drift: take BURROW_BITE cargo items, most valuable first; they are gone (not in the belly). */
function bite(game) {
  const s = game.burrow;
  let n = 0;
  for (const k of BITE_ORDER) while (n < BURROW_BITE && game.cargo[k] > 0) { game.cargo[k]--; n++; }
  if (!n) return;
  s.bites++; s.bitten += n;
  game.audio.crunch();
  game.notify('burrow-bite');
}

function lunge(game, b) {
  const p = game.player, dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1;
  b.hitCd = GLITCH_HIT_CD_S; game.burrow.lunges++;
  if (p.invuln <= 0) game.hurtPlayer(BURROW_DMG, dx / d, dy / d);
}

/** Once a frame, after the beam (a kill on the last surfaced frame still pays, as B-023 for Glitches). */
export function updateBurrower(game, dt) {
  const s = game.burrow, p = game.player, w = game.world;
  if (!s || s.off) return;
  if (game.endSeq || game.wake) { clearBurrower(game); return; }
  const pcx = Math.floor(p.x / CELL), pcy = Math.floor(p.y / CELL);
  const inKiln = w.profile.rings > KILN_RING && w.ring(pcx, pcy) === KILN_RING;
  if (!s.b) {
    if (!inKiln || (s.timer -= dt) > 0) return;
    s.b = spawn(game, pcx, pcy);
    if (!s.b) { s.timer = 2; return; }
  }
  const b = s.b;
  if (Math.hypot(b.cx - pcx, b.cy - pcy) > BURROW_LEASH) { clearBurrower(game); return; }
  b.flash = Math.max(0, b.flash - dt); b.hitCd = Math.max(0, b.hitCd - dt); b.trip += dt;
  b.prog = Math.min(1, b.prog + dt / BURROW_STEP_S);
  b.x = centre(b.fx + (b.cx - b.fx) * b.prog); b.y = centre(b.fy + (b.cy - b.fy) * b.prog);
  const surge = game.mode === 'surge';
  if (b.state === 'dig' || b.state === 'away') {
    if (b.state === 'dig' && b.trip > BURROW_TRIP_S) { clearBurrower(game); return; } // can't reach its prey: gives up
    if ((b.step -= dt) > 0) return;
    b.step += BURROW_STEP_S;
    if (b.state === 'away') {
      if (Math.max(Math.abs(b.cx - b.gx), Math.abs(b.cy - b.gy)) <= 1 || b.trip > BURROW_AWAY * BURROW_STEP_S * 2) { b.state = 'dig'; b.trip = 0; b.ate = {}; }
      else stepToward(game, b, b.gx, b.gy, null);
      return;
    }
    if (Math.max(Math.abs(b.cx - pcx), Math.abs(b.cy - pcy)) <= BURROW_TELL_CELLS) { b.state = 'tell'; b.t = BURROW_TELL_S; b.aimX = p.x; b.aimY = p.y; }
    else stepToward(game, b, pcx, pcy, null); // S-53c: both modes hunt the core
    return;
  }
  if (b.state === 'tell') {
    if ((b.t -= dt) > 0) return;
    eatCell(game, b.cx, b.cy, b, true); // it breaks out of its cell (its belly)
    b.state = 'up'; b.t = BURROW_UP_S; b.hp = b.maxHp;
    if (Math.hypot(p.x - b.aimX, p.y - b.aimY) >= BURROW_DODGE * CELL) s.dodged++; // surfaced into air
    else if (surge) lunge(game, b);
    else bite(game); // S-53c: Drift bites the hold, never the hull
    return;
  }
  // 'up': surfaced and hittable
  if (b.hp <= 0) { beaten(game, b); return; }
  if (surge && b.hitCd <= 0 && Math.hypot(p.x - b.x, p.y - b.y) < b.r + p.r) { lunge(game, b); if (s.b !== b) return; }
  if ((b.t -= dt) > 0) return;
  const ax = b.cx - pcx, ay = b.cy - pcy, ad = Math.hypot(ax, ay) || 1;
  b.gx = Math.round(b.cx + ax / ad * BURROW_AWAY); b.gy = Math.round(b.cy + ay / ad * BURROW_AWAY);
  b.state = 'away'; b.trip = 0; b.step = BURROW_STEP_S;
}

/** S-53b: the rumble level for music.js: 0 with no Burrower within MUSIC_RUMBLE.cells of the core, else 0.5…1 by closeness. */
export function burrowerRumble(game) {
  const b = game && game.burrow && game.burrow.b;
  if (!b) return 0;
  const d = Math.hypot(b.x - game.player.x, b.y - game.player.y) / CELL;
  return d > MUSIC_RUMBLE.cells ? 0 : 0.5 + 0.5 * (1 - d / MUSIC_RUMBLE.cells);
}

// ---------- drawing (render.js) ----------
/** World layer: the body (a short segmented chevron, Calx lilac edge) when surfaced or crossing open floor; rock hides it. */
export function drawBurrower(R, ctx) {
  const g = R.game, b = g.burrow && g.burrow.b;
  if (!b || (b.state !== 'up' && g.world.get(b.cx, b.cy) !== T.EMPTY)) return;
  const a = b.state === 'up' ? Math.atan2(g.player.y - b.y, g.player.x - b.x) : b.heading, r = b.r;
  ctx.save();
  ctx.translate(b.x, b.y); ctx.rotate(a);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.shadowBlur = 10;
  ctx.strokeStyle = ctx.shadowColor = b.flash > 0 ? '#ffffff' : `rgb(${BURROW_RGB})`;
  ctx.fillStyle = `rgba(${BURROW_RGB}, 0.22)`;
  for (let k = 0; k < 3; k++) { // three chevrons, the head first, each smaller and fainter
    const o = -k * r * 0.85, s = 1 - k * 0.2;
    ctx.globalAlpha = 1 - k * 0.25; ctx.lineWidth = 2.2 - k * 0.5;
    ctx.beginPath(); ctx.moveTo(o + r * s, 0); ctx.lineTo(o - r * 0.5 * s, r * 0.8 * s); ctx.lineTo(o - r * 0.15 * s, 0); ctx.lineTo(o - r * 0.5 * s, -r * 0.8 * s); ctx.closePath();
    if (!k) ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  if (b.state === 'up' && b.hp < b.maxHp) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(b.x - 12, b.y - 20, 24, 3);
    ctx.fillStyle = `rgb(${BURROW_RGB})`; ctx.fillRect(b.x - 12, b.y - 20, 24 * Math.max(0, b.hp / b.maxHp), 3);
  }
}

/** Over the darkness: the tell (its rock cell glows lilac, cracks spreading as the surfacing nears; no pulse in reduced motion). */
export function drawBurrowerTell(R, ctx) {
  const g = R.game, b = g.burrow && g.burrow.b;
  if (!b || b.state !== 'tell') return;
  const k = 1 - Math.max(0, b.t) / BURROW_TELL_S, still = g.settings && g.settings.reducedMotion;
  const x = b.cx * CELL, y = b.cy * CELL, cx = x + CELL / 2, cy = y + CELL / 2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = ctx.strokeStyle = ctx.shadowColor = `rgb(${BURROW_RGB})`; ctx.shadowBlur = 14;
  ctx.globalAlpha = (0.25 + 0.45 * k) * (still ? 1 : 0.8 + 0.2 * Math.sin(k * Math.PI * 10));
  ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
  ctx.globalAlpha = 0.6 + 0.4 * k; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let j = 0; j < 5; j++) { // cracks from the centre, growing with the tell
    const a = j * 1.257 + 0.4, l = CELL * (0.2 + 0.32 * k);
    ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * l * 0.55, cy + Math.sin(a) * l * 0.55);
    ctx.lineTo(cx + Math.cos(a + 0.35) * l, cy + Math.sin(a + 0.35) * l);
  }
  ctx.stroke();
  ctx.restore();
}
