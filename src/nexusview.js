// S-65 (D-179): the Nexus grows on screen. Each Nexus Development structure built (Radiance any level, Chart any level,
// Lens, Lure) adds one thin hexagon outside the Nexus's three rings, in its own hue. Strokes only, never shadowBlur (D-160):
// the Nexus already pays for one blurred layer. Drawn from saved levels, so nothing new is saved.
import { NEXUS_RING_BASE, NEXUS_RING_STEP, NEXUS_RING_ALPHA, NEXUS_RING_DIM, NEXUS_RING_RGB, RIFT_RGB, DECOY_RGB } from './config.js';
import { callCooldown } from './rift.js';
import { FEATS, FEAT_DOT_R, FEAT_DOT_ALPHA } from './config.js';

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

// S-68 (M18): the outermost ring (or, with none built, a bare hexagon of radius NEXUS_RING_BASE, drawn only for its dots)
// lights one vertex per feat done, vertex = the feat's FEATS index, so a 160 world's 4 feats keep their slots and the
// 256-only pair stay dark (never drawn). The dots turn with their ring. A new feat flashes its vertex (`featFlash`).
const outer = (rings, t) => { const i = Math.max(0, rings.length - 1); return { r: NEXUS_RING_BASE + i * NEXUS_RING_STEP, rot: (i % 2 ? -1 : 1) * t * 0.06 }; };

/** The feat dots around (0, 0): [{ id, v, x, y }], one per feat done, in FEATS order. Reads `featsSeen` (the done set
 *  checkFeats keeps), not feats(game): Charted's explored share scans the whole map, too dear for every frame. Pure. */
export function featDots(game, t, pulse = 1, rings = nexusRings(game)) {
  const seen = game.featsSeen, out = [];
  if (!seen || !seen.size) return out;
  const { r, rot } = outer(rings, t), R = r * pulse;
  FEATS.forEach((f, v) => {
    if (!seen.has(f.id)) return;
    const a = rot + v / 6 * Math.PI * 2;
    out.push({ id: f.id, v, x: Math.cos(a) * R, y: Math.sin(a) * R });
  });
  return out;
}

/** Draws the rings and the purchase flash around (0, 0) (the caller has translated to the Nexus). */
export function drawNexusRings(ctx, game, t, pulse) {
  const rings = nexusRings(game), flash = game.nexusFlash || 0, dots = featDots(game, t, pulse, rings);
  if (!rings.length && flash <= 0 && !dots.length) return;
  ctx.save(); ctx.shadowBlur = 0;
  rings.forEach((g, i) => { ctx.globalAlpha = g.a; ctx.strokeStyle = `rgb(${g.rgb})`; ctx.lineWidth = 1.25; hex(ctx, g.r * pulse, (i % 2 ? -1 : 1) * t * 0.06); });
  if (flash > 0) { // S-4 feel at the Nexus: a white hexagon expands off the outermost ring
    const r0 = NEXUS_RING_BASE + Math.max(0, rings.length - 1) * NEXUS_RING_STEP;
    ctx.globalAlpha = flash; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; hex(ctx, r0 + (1 - flash) * 64, 0);
  }
  if (dots.length) { // S-68: white 3 px dots on the outer ring's corners, unblurred (D-160)
    ctx.globalAlpha = FEAT_DOT_ALPHA; ctx.fillStyle = '#ffffff'; ctx.beginPath();
    for (const d of dots) { ctx.moveTo(d.x + FEAT_DOT_R, d.y); ctx.arc(d.x, d.y, FEAT_DOT_R, 0, Math.PI * 2); }
    ctx.fill();
    const ff = game.featFlash, d = ff && ff.k > 0 && dots.find(o => o.id === ff.id);
    if (d) { ctx.globalAlpha = ff.k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(d.x, d.y, FEAT_DOT_R + (1 - ff.k) * 14, 0, Math.PI * 2); ctx.stroke(); }
  }
  ctx.restore();
}
