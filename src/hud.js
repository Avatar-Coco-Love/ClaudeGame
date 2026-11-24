// Screen-space HUD drawing (S-18 split out of render.js; behaviour unchanged): the explored-only minimap, the Nexus pointer,
// and the touch sticks. Each takes the Renderer `r` (its canvases, camera, time and game).
import { CELL, T, RINGS, RESOURCE, ORE_KIND } from './config.js';
import { markAlpha } from './research.js';
import { BEACON_COLOR, RELAY_COLOR } from './craft.js';
import { drawSpireMarks } from './spire.js';

const MINI_COLORS = {
  [T.EMPTY]: [10, 16, 44],
  [T.CRYSTAL]: [46, 242, 255], [T.PRISM]: [255, 79, 216], [T.BEDROCK]: [16, 18, 30],
  [T.VAULT]: [235, 252, 255], [T.CACHE]: [255, 255, 255], // S-9: vault shells read white on the minimap
  [T.LUMEN]: [255, 201, 79],
  [T.SPIRE_SHELL]: [150, 140, 220], [T.SPIRE]: [120, 104, 200], [T.FACET]: [150, 140, 220], // S-19: dim violet; S-27's mark is spire.js drawSpireMarks
};
// S-8: the minimap tints ROCK/DENSE by ring, a dimmed mix of the ring's fill and edge so rings read at a glance.
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const MINI_RING = RINGS.map(r => ({
  [T.ROCK]: mix(rgb(r.rockFill), rgb(r.rockEdge), 0.22), [T.DENSE]: mix(rgb(r.denseFill), rgb(r.denseEdge), 0.3),
}));

/** Write one explored cell's colour into the minimap's pixel buffer (pushed to the canvas when `miniDirty`). */
export function paintMiniCell(r, i) {
  const w = r.game.world, t = w.cells[i];
  const c = (t === T.ROCK || t === T.DENSE) ? MINI_RING[w.rings[i]][t] : MINI_COLORS[t];
  const d = r.miniData.data, o = i * 4;
  d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
}

export function drawMinimap(r) {
  const m = r.mctx, g = r.game, w = g.world;
  if (r.miniDirty) { r.miniCtx.putImageData(r.miniData, 0, 0); r.miniDirty = false; }
  const size = r.minimap.width;
  m.clearRect(0, 0, size, size);
  m.fillStyle = 'rgba(3,4,12,0.85)'; m.fillRect(0, 0, size, size);
  m.imageSmoothingEnabled = false;
  m.drawImage(r.mini, 0, 0, size, size);
  const sc = size / (w.w * CELL);
  m.fillStyle = '#ffffff';
  m.beginPath(); m.arc(g.nexus.x * sc, g.nexus.y * sc, 3, 0, Math.PI * 2); m.fill();
  for (const q of g.scan.marks) { // S-11 ping blips, same lifetime as the glyphs
    const a = markAlpha(g, q);
    if (a <= 0) continue;
    const rr = q.type === T.CACHE ? 2.25 : 1.5; // S-12: a cache blip is white and 1.5x an ore blip
    m.globalAlpha = a; m.fillStyle = q.type === T.CACHE ? '#ffffff' : RESOURCE[ORE_KIND[q.type]].color;
    m.fillRect((q.x + 0.5) * CELL * sc - rr, (q.y + 0.5) * CELL * sc - rr, rr * 2, rr * 2);
  }
  m.globalAlpha = 1;
  m.fillStyle = BEACON_COLOR; // S-16: placed beacons, always shown
  for (const b of g.beacons) { m.beginPath(); m.arc(b.x * sc, b.y * sc, 2, 0, Math.PI * 2); m.fill(); }
  m.strokeStyle = RELAY_COLOR; m.lineWidth = 1.5; // S-22: placed Relays, a cyan ring, always shown
  for (const q of g.relays) { m.beginPath(); m.arc(q.x * sc, q.y * sc, 3.5, 0, Math.PI * 2); m.stroke(); }
  drawSpireMarks(m, g, sc); // S-27: a hollow hexagon at each found Spire, always shown after
  m.fillStyle = '#ffd23d';
  m.beginPath(); m.arc(g.player.x * sc, g.player.y * sc, 2.5, 0, Math.PI * 2); m.fill();
}

// T1 (audit 49): the HUD boxes the pointer must stay clear of, read from the DOM at most twice a second (a layout read
// every frame would force a reflow after each HUD text update).
const HUD_BOXES = '#hud .panel, #hud .top-right > *, #hud > button, #hint';
export function hudRects() {
  return [...document.querySelectorAll(HUD_BOXES)].map(e => e.getBoundingClientRect()).filter(b => b.width > 0 && b.height > 0);
}
const ARROW_R = 12, LABEL = { back: 22, hw: 22, hh: 8 }; // arrow radius; "NEXUS" sits 22 px inward, ~44×16 px

/** Where the pointer goes for a Nexus at screen point (nx, ny) on a w×h screen: on the 40 px inset edge along the heading,
 *  slid inward along the same ray until neither the arrow nor its "NEXUS" label touches a HUD box. Null when on screen. */
export function nexusPointerSpot(w, h, nx, ny, rects) {
  const m = 40;
  if (nx > m && nx < w - m && ny > m && ny < h - m) return null;
  const cx = w / 2, cy = h / 2, a = Math.atan2(ny - cy, nx - cx), c = Math.cos(a), s = Math.sin(a);
  const t0 = Math.min((w / 2 - m) / Math.abs(c || 1e-6), (h / 2 - m) / Math.abs(s || 1e-6));
  const hits = (x, y, hw, hh) => rects.some(b => x + hw > b.left && x - hw < b.right && y + hh > b.top && y - hh < b.bottom);
  for (let t = t0; t > 40; t -= 4) {
    const x = cx + c * t, y = cy + s * t, lx = x - c * LABEL.back, ly = y - s * LABEL.back;
    if (!hits(x, y, ARROW_R, ARROW_R) && !hits(lx, ly, LABEL.hw, LABEL.hh)) return { x, y, a, lx, ly };
  }
  const x = cx + c * t0, y = cy + s * t0;
  return { x, y, a, lx: x - c * LABEL.back, ly: y - s * LABEL.back };
}

/** An arrow on the screen edge toward an off-screen Nexus; "NEXUS" beside it when cargo is full. */
export function drawNexusPointer(r, ctx) {
  const g = r.game, n = r.worldToScreen(g.nexus.x, g.nexus.y);
  if (!r.hudRects || r.time - r.hudRectsAt > 0.5 || r.time < r.hudRectsAt) { r.hudRects = hudRects(); r.hudRectsAt = r.time; }
  const p = r.pointer = nexusPointerSpot(r.w, r.h, n.x, n.y, r.hudRects);
  if (!p) return;
  ctx.save();
  ctx.translate(p.x, p.y); ctx.rotate(p.a);
  ctx.strokeStyle = '#2ef2ff'; ctx.shadowColor = '#2ef2ff'; ctx.shadowBlur = 10; ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6 + Math.sin(r.time * 4) * 0.25;
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.stroke();
  ctx.restore();
  const full = g.cargoRoom() <= 0;
  if (full) {
    ctx.save();
    ctx.fillStyle = '#ffd23d'; ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('NEXUS', p.lx, p.ly + 4);
    ctx.restore();
  }
}

export function drawSticks(ctx, input) {
  if (!input.usingTouch) return;
  const R = 56;
  ctx.save();
  for (const [name, s] of Object.entries(input.sticks)) {
    if (!s) continue;
    const col = name === 'move' ? '46,242,255' : '255,79,216';
    ctx.strokeStyle = `rgba(${col},0.35)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(s.ox, s.oy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(${col},0.35)`;
    ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
