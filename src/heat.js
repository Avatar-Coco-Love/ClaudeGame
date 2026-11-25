// S-48a Kiln beam heat (D-129). Intent vs realized: holding fire is the intent; while overheated the realized beam is off.
// `game.heat` 0..1 rises with the share of the core's beam damage that lands on Kiln-ring cells (by the hit cell's own ring),
// capped at 1 a frame, so Wide's extra cells and an Overclock Anomaly heat no faster than Focus. Never saved (like `damage`).
// The Echo's beam and Shoal cracks call world.hit directly, so they add none.
import { sinkMul } from './heatsink.js';
import { KILN_RING, KILN_HEAT_S, KILN_OVERHEAT_S, KILN_HEAT_RESTART, KILN_COOL_MUL, KILN_ARC_FROM, HEAT_RGB } from './config.js';

export function makeHeat() { return { kiln: 0, over: 0, flash: 0, taught: false, off: false, overheats: 0 }; }

/** The core's beam landed `amount` damage on cell (x, y) this frame: count it when the cell is Kiln. */
export function heatHit(game, x, y, amount) {
  if (game.world.inBounds(x, y) && game.world.ring(x, y) === KILN_RING) game.heatState.kiln += amount;
}

/** True while the realized beam is held off by an overheat. */
export function overheated(game) { return game.heatState.over > 0; }

/** Once a frame, after the beam ran (or didn't): heat or cool, and trigger / end an overheat. */
export function updateHeat(game, dt) {
  const h = game.heatState, kiln = h.kiln;
  h.kiln = 0;
  h.flash = Math.max(0, h.flash - dt);
  if (h.off) { game.heat = 0; h.over = 0; return; }
  if (h.over > 0) {
    h.over -= dt;
    if (h.over <= 1e-9) { h.over = 0; game.heat = KILN_HEAT_RESTART; h.taught = true; }
    return;
  }
  const share = dt > 0 ? Math.min(1, kiln / (game.stat('beam') * dt)) : 0;
  if (share > 0) game.heat = Math.min(1, game.heat + share * sinkMul(game) * dt / KILN_HEAT_S); // S-51: a Heat Sink nearby × 0.4
  else game.heat = Math.max(0, game.heat - KILN_COOL_MUL * dt / KILN_HEAT_S);
  if (game.heat >= 1 - 1e-9) overheat(game);
}

/** Heat reached 1 (the beam, or a flare vent: vent.js): the realized beam goes off KILN_OVERHEAT_S. */
export function overheat(game) {
  const h = game.heatState;
  if (h.off || h.over > 0) return;
  game.heat = 1; h.over = KILN_OVERHEAT_S; h.overheats++;
  if (game.motionOn()) h.flash = 0.4;
  game.audio.overheat();
}

/** Past KILN_ARC_FROM a thin warm-white arc round the core (ctx at the core's centre), its length ∝ heat; an overheat flashes a ring. */
export function drawHeat(ctx, g) {
  const h = g.heatState;
  if (g.heat > KILN_ARC_FROM) {
    const len = Math.PI * 2 * g.heat, a0 = Math.PI / 2 - len / 2, hot = h.over > 0;
    ctx.strokeStyle = `rgba(${HEAT_RGB}, ${hot ? 0.95 : 0.5 + 0.4 * g.heat})`; ctx.lineWidth = hot ? 2.5 : 1.6;
    ctx.shadowColor = `rgb(${HEAT_RGB})`; ctx.shadowBlur = hot ? 12 : 6;
    ctx.beginPath(); ctx.arc(0, 0, 22, a0, a0 + len); ctx.stroke(); ctx.shadowBlur = 0;
  }
  if (h.flash > 0) { // set only when motion is on (reduced motion: no flash)
    const k = h.flash / 0.4;
    ctx.globalAlpha = k; ctx.strokeStyle = `rgb(${HEAT_RGB})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 22 + (1 - k) * 26, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
}
