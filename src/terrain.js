// Terrain chunk painting (S-26, split out of render.js): one CHUNK×CHUNK-cell canvas of fills, ore glyphs and neon edges.
// The Renderer's chunk cache (render.js `getChunk`) calls this when a chunk is first seen or was mined (dirty).
import { CELL, CHUNK, T, MATERIAL, ORE_KIND } from './config.js';

const CHUNK_PX = CHUNK * CELL;

function hexPath(g, x, y, r) {
  g.beginPath();
  for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); }
  g.closePath();
}

/** S-19: a Spire's glyphs, drawn over pass 1. The core's hexagon spans its 3×3 cells, so cores centred up to one cell
 *  outside this chunk are drawn too (the canvas clips them) and the hexagon never breaks at a chunk edge. */
function paintSpires(g, w, x0, y0) {
  const S = MATERIAL[T.SPIRE], F = MATERIAL[T.FACET];
  g.shadowBlur = 8;
  for (let y = -1; y <= CHUNK; y++) for (let x = -1; x <= CHUNK; x++) {
    const gx = x0 + x, gy = y0 + y, t = w.get(gx, gy), px = x * CELL + CELL / 2, py = y * CELL + CELL / 2;
    if (t === T.FACET && x >= 0 && y >= 0 && x < CHUNK && y < CHUNK) { // a small dim hexagon in its shell cell
      g.shadowColor = F.edge; g.strokeStyle = F.edge; g.lineWidth = 1.5; g.globalAlpha = 0.55;
      hexPath(g, px, py, 7); g.stroke(); g.globalAlpha = 1;
    } else if (t === T.SPIRE && w.get(gx - 1, gy) === T.SPIRE && w.get(gx + 1, gy) === T.SPIRE
      && w.get(gx, gy - 1) === T.SPIRE && w.get(gx, gy + 1) === T.SPIRE) { // the core's centre cell
      g.shadowColor = S.edge; g.strokeStyle = S.edge; g.lineWidth = 2; g.globalAlpha = 0.6;
      hexPath(g, px, py, CELL * 1.35); g.stroke();
      g.globalAlpha = 0.3; hexPath(g, px, py, CELL * 0.7); g.stroke(); g.globalAlpha = 1;
    }
  }
  g.shadowBlur = 0;
}

export function paintChunk(w, c, cx, cy) {
  const g = c.getContext('2d');
  g.clearRect(0, 0, CHUNK_PX, CHUNK_PX);
  const x0 = cx * CHUNK, y0 = cy * CHUNK;
  // Pass 1: fills + subtle bevel.
  for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
    const t = w.get(x0 + x, y0 + y);
    if (t === T.EMPTY) continue;
    const m = w.look(x0 + x, y0 + y, t);
    g.fillStyle = m.fill;
    g.fillRect(x * CELL, y * CELL, CELL, CELL);
    if (t !== T.BEDROCK) {
      g.strokeStyle = m.edge; g.globalAlpha = 0.09; g.lineWidth = 1;
      g.strokeRect(x * CELL + 4.5, y * CELL + 4.5, CELL - 9, CELL - 9);
      g.globalAlpha = 1;
    }
  }
  paintSpires(g, w, x0, y0);
  // Pass 2: ore gems (glowing).
  g.shadowBlur = 10;
  for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
    const t = w.get(x0 + x, y0 + y);
    if (!(t in ORE_KIND) && t !== T.CACHE) continue;
    const m = MATERIAL[t], px = x * CELL + CELL / 2, py = y * CELL + CELL / 2;
    if (t === T.CACHE) { // S-9: a square-in-square glyph, upright, so it never reads as ore
      g.shadowColor = m.edge; g.strokeStyle = m.edge; g.lineWidth = 2;
      g.strokeRect(px - 9, py - 9, 18, 18); g.fillStyle = m.edge; g.fillRect(px - 4, py - 4, 8, 8);
      continue;
    }
    if (t === T.LUMEN) { // S-10: a round gold bead with a halo ring; the only round ore, so it never reads as ◆ or ▲
      g.shadowColor = m.edge; g.fillStyle = m.edge; g.strokeStyle = m.edge; g.lineWidth = 1.5;
      g.globalAlpha = 0.9; g.beginPath(); g.arc(px, py, 5, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.6; g.beginPath(); g.arc(px, py, 9, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
      continue;
    }
    const h = (((x0 + x) * 73856093) ^ ((y0 + y) * 19349663)) >>> 0;
    const rot = (h % 628) / 100, sz = 5 + (h % 4);
    g.shadowColor = m.edge; g.fillStyle = m.edge; g.strokeStyle = m.edge;
    g.save(); g.translate(px, py); g.rotate(rot);
    g.beginPath();
    if (t === T.CRYSTAL) { g.moveTo(0, -sz); g.lineTo(sz * 0.6, 0); g.lineTo(0, sz); g.lineTo(-sz * 0.6, 0); }
    else { g.moveTo(0, -sz); g.lineTo(sz * 0.87, sz * 0.5); g.lineTo(-sz * 0.87, sz * 0.5); }
    g.closePath();
    g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
    g.restore();
  }
  // Pass 3: neon edges wherever solid meets open space.
  g.lineWidth = 2; g.lineCap = 'round'; g.shadowBlur = 8;
  for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
    const gx = x0 + x, gy = y0 + y, t = w.get(gx, gy);
    if (t === T.EMPTY) continue;
    const m = w.look(gx, gy, t);
    g.strokeStyle = m.edge; g.shadowColor = m.edge;
    const px = x * CELL, py = y * CELL;
    g.beginPath();
    if (!w.solid(gx, gy - 1)) { g.moveTo(px + 1, py + 1); g.lineTo(px + CELL - 1, py + 1); }
    if (!w.solid(gx, gy + 1)) { g.moveTo(px + 1, py + CELL - 1); g.lineTo(px + CELL - 1, py + CELL - 1); }
    if (!w.solid(gx - 1, gy)) { g.moveTo(px + 1, py + 1); g.lineTo(px + 1, py + CELL - 1); }
    if (!w.solid(gx + 1, gy)) { g.moveTo(px + CELL - 1, py + 1); g.lineTo(px + CELL - 1, py + CELL - 1); }
    g.stroke();
  }
  g.shadowBlur = 0;
}
