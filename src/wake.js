// S-23 Spire Wake (D-055, D-071, D-086): Surge's way to relight a primed Spire. Stepping into its interior starts a Wake:
// 4 lanes are cleared past the gaps, Glitches come down them in turn and go for the Spire core (or the player core when it
// is close), and the Spire's charge drops when one reaches the core. Hold SPIRE_WAKE_S (one facet lights every 1/8) ->
// relit, mode 'surge'. Charge 0, a core death or leaving Surge fails it (fed kept); stepping out and back in retries.
// A Wake is never saved: a reload mid-Wake is a failed Wake. Drift keeps the facet puzzle (spire.js).
import { CELL, T, SPIRE_WAKE_S, SPIRE_WAVE_S, SPIRE_WAKE_ALIVE, SPIRE_LANE, SPIRE_CHARGE, SPIRE_CHARGE_HIT, SPIRE_MARK_COLOR,
  SPIRE_WAKE_RGB, SPIRE_WAKE_TIER_DROP, SPIRE_CORE_CONTACT_PX } from './config.js';
import { spireHere, relightSpire, spireTypeAt, SPIRE_HALF, SPIRE_CORE, FACET_RING } from './spire.js';
import { makeGlitch, glitchTier, glitchPop } from './glitch.js';

const GAPS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W; spawns take turns in this order
/** Cells a lane can't clear (D-071): bedrock, vaults, any Spire cell. */
const STOPS = new Set([T.BEDROCK, T.VAULT, T.CACHE, T.SPIRE_SHELL, T.SPIRE, T.FACET]);
export const WAKE_RING_CELLS = 2.2; // the charge ring's radius round the core (cosmetic; tests/wake.cjs samples it)
// Cyclic with spire.js and glitch.js: use their imports only inside functions, never at module top level.

/** Clear the four lanes past Spire s's gaps: SPIRE_LANE.len rows, 2·half + 1 wide, each row cleared whole or the lane
 *  stops there. Ore drops its yield as floor loot. Returns [{ len, x, y }] per gap, (x, y) = the lane end's centre in px. */
function clearLanes(game, s) {
  const w = game.world, { len: L, half } = SPIRE_LANE;
  // B-050: an old save can keep generated rock in a Spire's gaps or floor (`keep`); the Wake opens them first, or its
  // Glitches would stall on the rock, fade, and the Wake would hold itself.
  for (let j = -SPIRE_HALF; j <= SPIRE_HALF; j++) for (let i = -SPIRE_HALF; i <= SPIRE_HALF; i++) {
    const x = s.x + i, y = s.y + j, t = w.get(x, y);
    if (spireTypeAt(i, j) === T.EMPTY && t !== T.EMPTY && !STOPS.has(t)) { w.destroy(x, y); game.dropYield(x, y, t); }
  }
  return GAPS.map(([dx, dy]) => {
    let len = 0;
    for (let k = 1; k <= L; k++) {
      const row = [];
      for (let o = -half; o <= half; o++) row.push([s.x + dx * (SPIRE_HALF + k) + (dx ? 0 : o), s.y + dy * (SPIRE_HALF + k) + (dy ? 0 : o)]);
      if (row.some(([x, y]) => STOPS.has(w.get(x, y)))) break;
      for (const [x, y] of row) { const t = w.get(x, y); if (t !== T.EMPTY) { w.destroy(x, y); game.dropYield(x, y, t); } }
      len = k;
    }
    return { len, x: (s.x + dx * (SPIRE_HALF + len) + 0.5) * CELL, y: (s.y + dy * (SPIRE_HALF + len) + 0.5) * CELL };
  });
}

function startWake(game, s) {
  const core = { x: (s.x + 0.5) * CELL, y: (s.y + 0.5) * CELL };
  game.wake = { s, t: 0, lit: 0, charge: SPIRE_CHARGE, lanes: clearLanes(game, s), turn: 0, spawnT: SPIRE_WAVE_S / 2, core,
    tier: Math.max(0, glitchTier(Math.hypot(core.x - game.nexus.x, core.y - game.nexus.y)) - SPIRE_WAKE_TIER_DROP) }; // S-31
  game.audio.facet(true);
  game.notify('wake-start');
}

/** End the Wake without relighting. Its Glitches stay as ordinary ones; the Spire won't wake again until the core leaves. */
export function failWake(game) {
  const k = game.wake;
  if (!k) return;
  for (const e of game.enemies) e.wake = false;
  game.wake = null; game.wakeBlock = k.s;
  game.audio.facet(false);
  game.notify('wake-failed');
}

/** Per frame, after the beam: start, run, and end a Wake. */
export function updateWake(game, dt) {
  const here = spireHere(game);
  if (game.wakeBlock && here !== game.wakeBlock) game.wakeBlock = null;
  const k = game.wake;
  if (!k) {
    if (game.mode === 'surge' && here && !here.lit && here.mask !== null && game.wakeBlock !== here) startWake(game, here);
    return;
  }
  if (game.mode !== 'surge' || k.charge <= 0) { failWake(game); return; }
  k.t += dt;
  const lit = Math.min(FACET_RING.length, Math.floor(k.t / (SPIRE_WAKE_S / FACET_RING.length) + 1e-9));
  if (lit > k.lit) {
    k.lit = lit;
    const [i, j] = FACET_RING[lit - 1];
    game.burst((k.s.x + i + 0.5) * CELL, (k.s.y + j + 0.5) * CELL, 10, SPIRE_MARK_COLOR, 120);
    game.audio.facet(true);
  }
  if (k.t >= SPIRE_WAKE_S) {
    for (const e of game.enemies) e.wake = false;
    game.wake = null;
    relightSpire(game, k.s, 'surge');
    return;
  }
  k.spawnT -= dt;
  const lanes = k.lanes.filter(l => l.len >= SPIRE_LANE.min);
  if (k.spawnT <= 0) {
    k.spawnT += SPIRE_WAVE_S;
    const alive = game.enemies.filter(e => e.wake && e.fade === undefined).length;
    if (lanes.length && alive < SPIRE_WAKE_ALIVE) {
      const l = lanes[k.turn++ % lanes.length], e = makeGlitch(l.x, l.y, k.tier, Math.atan2(k.core.y - l.y, k.core.x - l.x));
      e.wake = true;
      game.enemies.push(e);
    }
  }
}

/** A Wake Glitch at distance `gd` from the core: touching it costs SPIRE_CHARGE_HIT and bursts the Glitch, lootless. */
export function wakeContact(game, e, gd) {
  if (gd > (SPIRE_CORE + 0.5) * CELL + e.r + SPIRE_CORE_CONTACT_PX) return false; // the core's half-width (3×3 block, spire.js)
  game.wake.charge = Math.max(0, game.wake.charge - SPIRE_CHARGE_HIT);
  glitchPop(game, e);
  game.addShake(3);
  return true;
}

/** The facet mask to draw for Spire s: the Wake's clock while one runs there, else the saved puzzle mask. */
export const wakeMask = (game, s) => (game.wake && game.wake.s === s ? (1 << game.wake.lit) - 1 : s.mask);

/** The charge ring round the core of the Spire that is waking (world transform). */
export function drawWake(ctx, game) {
  const k = game.wake;
  if (!k) return;
  const f = k.charge / SPIRE_CHARGE, a0 = -Math.PI / 2, col = `rgb(${SPIRE_WAKE_RGB})`;
  ctx.save();
  ctx.strokeStyle = col; ctx.shadowColor = col; ctx.lineWidth = 4;
  ctx.shadowBlur = 0; ctx.globalAlpha = 0.25; ctx.beginPath(); // audit 59: no blur left over from the last facet
  ctx.arc(k.core.x, k.core.y, WAKE_RING_CELLS * CELL, 0, Math.PI * 2); ctx.stroke(); // B-053: this line had been swallowed by the comment above
  ctx.globalAlpha = 0.95; ctx.shadowBlur = 12;
  if (f > 0) { ctx.beginPath(); ctx.arc(k.core.x, k.core.y, WAKE_RING_CELLS * CELL, a0, a0 + Math.PI * 2 * f); ctx.stroke(); }
  ctx.restore();
}
