// Light (S-26, split out of render.js): the darkness layer with its light holes, and the S-25 floor glow under light pools.
// The Renderer keeps `r.lightSets`, a list of arrays of world-space lights `{x, y, r}` (+ optional `glow`, an "R, G, B"
// string for the floor glow; default beacon cyan). It holds `game.beacons` (S-16), `game.relays` (S-22) and the lit
// Spires (`game.spireLights`, S-28). Both passes iterate the sets in place: no per-frame concat or allocation.
import { LIGHT_RADIUS, BEACON_RGB } from './config.js';
import { darkAlpha } from './ending.js';
import { darkRGB } from './weather.js';

const GLOW_RGB = BEACON_RGB;
const GLOW_DOWN = 4; // floor-glow layer pixels per screen pixel, per axis

/** One cached soft-hole sprite per radius in light-canvas pixels (audit 44 T3, D-067): a full-strength gradient disc, drawn
 *  with `globalAlpha` = strength. Radii come from a few fixed sizes x zoom, so the cache is cleared when the zoom changes. */
function holeSprite(r, rr) {
  if (r.holeZoom !== r.zoom) { r.holeSprites = new Map(); r.holeZoom = r.zoom; }
  const m = r.holeSprites;
  let c = m.get(rr);
  if (c) return c;
  c = document.createElement('canvas');
  const px = Math.ceil(rr) * 2 + 2, h = px / 2; c.width = c.height = px;
  const p = c.getContext('2d'), grd = p.createRadialGradient(h, h, 0, h, h, rr);
  grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(0.55, 'rgba(0,0,0,0.85)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  p.fillStyle = grd; p.beginPath(); p.arc(h, h, rr, 0, Math.PI * 2); p.fill();
  m.set(rr, c);
  return c;
}

/** The darkness: a half-res layer filled near-black, with soft holes cut (destination-out) around the core, every light in
 *  `r.lightSets`, the Nexus and the beam ends, then stretched over the frame (smoothed 2x upscale). */
export function drawLight(r, ctx) {
  const l = r.lctx, g = r.game, s = r.zoom / 2, cw = r.light.width, ch = r.light.height; // light canvas is half-res
  l.globalCompositeOperation = 'source-over';
  l.clearRect(0, 0, cw, ch);
  l.fillStyle = `rgba(${darkRGB(g)}, ${darkAlpha(g)})`; // S-24: DARK_ALPHA, lifted by the ending; S-33: weather tint
  l.fillRect(0, 0, cw, ch);
  l.globalCompositeOperation = 'destination-out';
  const hole = (wx, wy, rad, strength = 1) => {
    const x = ((wx - r.cam.x) * r.zoom + r.w / 2) / 2, y = ((wy - r.cam.y) * r.zoom + r.h / 2) / 2, rr = rad * s;
    if (x + rr < 0 || y + rr < 0 || x - rr > cw || y - rr > ch) return; // S-15: off the canvas
    const sp = holeSprite(r, rr), h = sp.width / 2;
    l.globalAlpha = strength; l.drawImage(sp, x - h, y - h); l.globalAlpha = 1;
  };
  hole(g.player.x, g.player.y, LIGHT_RADIUS);
  for (const set of r.lightSets) for (const e of set) hole(e.x, e.y, e.r); // S-15: tools/perf.cjs prices the beacon holes
  hole(g.nexus.x, g.nexus.y, g.nexusLight());
  if (g.beam.on) {
    const rs = g.beam.rays.length > 1 ? g.beam.rays : [g.beam]; // S-13: each Wide ray end lights its own, smaller hole
    for (const b of rs) hole(b.ex, b.ey, rs.length > 1 ? 48 : 80, 0.7);
  }
  if (g.beam.flash > 0 && g.beam.flashLine) hole(g.beam.flashLine.ex, g.beam.flashLine.ey, 80, 0.7 * g.beam.flash / g.beam.flashMax); // S-14
  ctx.drawImage(r.light, 0, 0, r.w, r.h);
}

/** S-25 (D-061): a faint additive disc on the floor of every light pool in `r.lightSets`, drawn right after the grid so
 *  walls and ore cover it and the darkness dims it like the floor. One cached sprite per radius and colour (D-051), culled
 *  to the view. The gradient is smooth, so all visible discs are summed into one quarter-res layer over their union box and
 *  blitted once (20 overlapping full-res discs cost 2.2x an empty frame in drawcost.cjs; this keeps the 2x budget).
 *  Static, so reduced motion needs nothing. `r.beaconGlow` is the centre alpha (0 = off, for tests). */
export function drawLightGlow(r, ctx, left, top, vw, vh) {
  const a = r.beaconGlow;
  if (!(a > 0)) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const set of r.lightSets) for (const e of set) {
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
  for (const set of r.lightSets) for (const e of set) {
    const R = e.r, rgb = e.glow || GLOW_RGB;
    if (e.x + R < x0 || e.x - R > x1 || e.y + R < y0 || e.y - R > y1) continue;
    const sp = r.glowSprite(`bg-${R}-${a}-${rgb}`, R, p => {
      const grd = p.createRadialGradient(0, 0, 0, 0, 0, R);
      grd.addColorStop(0, `rgba(${rgb}, ${a})`);
      grd.addColorStop(0.6, `rgba(${rgb}, ${a * 0.45})`);
      grd.addColorStop(1, `rgba(${rgb}, 0)`);
      p.fillStyle = grd; p.beginPath(); p.arc(0, 0, R, 0, Math.PI * 2); p.fill();
    });
    g.drawImage(sp.canvas, e.x - R, e.y - R, R * 2, R * 2);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(L, 0, 0, lw, lh, x0, y0, lw / k, lh / k);
  ctx.restore();
}
