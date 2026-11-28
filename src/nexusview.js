// S-65 (D-179): the Nexus grows on screen. Each Nexus Development structure built (Radiance any level, Chart any level,
// Lens, Lure) adds one thin hexagon outside the Nexus's three rings, in its own hue. Strokes only, never shadowBlur (D-160):
// the Nexus already pays for one blurred layer. Drawn from saved levels, so nothing new is saved.
import { NEXUS_RING_BASE, NEXUS_RING_STEP, NEXUS_RING_ALPHA, NEXUS_RING_DIM, NEXUS_RING_RGB, RIFT_RGB, DECOY_RGB } from './config.js';
import { callCooldown } from './rift.js';

/** The rings to draw, innermost first: [{ id, r, rgb, a }]. A Lens on cooldown is dim, bright when it can call. */
export function nexusRings(game) {
  const L = game.nexusLevels, out = [];
  if (L.radiance > 0) out.push({ id: 'radiance', rgb: NEXUS_RING_RGB.radiance, a: NEXUS_RING_ALPHA });
  if (L.chart > 0) out.push({ id: 'chart', rgb: NEXUS_RING_RGB.chart, a: NEXUS_RING_ALPHA });
  if (L.lens > 0) out.push({ id: 'lens', rgb: RIFT_RGB, a: game.rift && callCooldown(game) > 0 ? NEXUS_RING_DIM : NEXUS_RING_ALPHA });
  if (L.lure > 0) out.push({ id: 'lure', rgb: DECOY_RGB, a: NEXUS_RING_ALPHA }); // S-77b2: the Decoy's peach
  out.forEach((g, i) => { g.r = NEXUS_RING_BASE + i * NEXUS_RING_STEP; });
  return out;
}

const hex = (ctx, r, rot) => {
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) { const a = rot + i / 6 * Math.PI * 2; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.stroke();
};

/** Draws the rings and the purchase flash around (0, 0) (the caller has translated to the Nexus). */
export function drawNexusRings(ctx, game, t, pulse) {
  const rings = nexusRings(game), flash = game.nexusFlash || 0;
  if (!rings.length && flash <= 0) return;
  ctx.save(); ctx.shadowBlur = 0;
  rings.forEach((g, i) => { ctx.globalAlpha = g.a; ctx.strokeStyle = `rgb(${g.rgb})`; ctx.lineWidth = 1.25; hex(ctx, g.r * pulse, (i % 2 ? -1 : 1) * t * 0.06); });
  if (flash > 0) { // S-4 feel at the Nexus: a white hexagon expands off the outermost ring
    const r0 = NEXUS_RING_BASE + Math.max(0, rings.length - 1) * NEXUS_RING_STEP;
    ctx.globalAlpha = flash; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; hex(ctx, r0 + (1 - flash) * 64, 0);
  }
  ctx.restore();
}
