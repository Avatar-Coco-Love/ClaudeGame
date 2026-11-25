// S-52 Nexus Chart (D-143): a Nexus Development row that adds knowledge to the minimap, nothing else. Level 1 draws each
// explored Shoal chunk's current as a short arrow (direction of the flow, length ∝ speed; calm chunks none). Level 2 draws
// each seen flare vent (its cell explored, drawVents' rule) as a dot that brightens during its tell. No stat, no light,
// no other layer shows currents or vents (the Scanner marks ore). Only in a world with a Kiln (a 160 world: no row).
// The chunk cache `game.chart` only grows (explored never shrinks); unknown flowing chunks in the minimap window are
// re-checked at most every CHART_RECHECK_S of game time, so a frame costs at most 3 draw calls (one path each).
import { CELL, CHUNK, KILN_RING, UNDERTOW_SPEED, UNDERTOW_RGB, VENT_RGB, CHART_RECHECK_S } from './config.js';
import { ventPhase } from './vent.js';

export const chartOn = game => game.world.profile.rings > KILN_RING;

/** Has the core explored any cell of chunk i? Cached once true. */
function chunkKnown(game, c, i) {
  if (c.known[i]) return true;
  const w = game.world, x0 = (i % w.chunksW) * CHUNK, y0 = Math.floor(i / w.chunksW) * CHUNK;
  for (let y = y0; y < Math.min(w.h, y0 + CHUNK); y++) for (let x = x0; x < Math.min(w.w, x0 + CHUNK); x++)
    if (w.explored[y * w.w + x]) { c.known[i] = 1; return true; }
  return false;
}

/** Explored, flowing chunk indices in the cell box [x0, x1) × [y0, y1); `fresh` re-checks the unknown ones. */
export function chartedChunks(game, x0, y0, x1, y1, fresh = true) {
  const w = game.world, u = game.undertow, out = [];
  if (!u || u.off) return out; // audit 109: the dev Undertow toggle hides the arrows too (vents already honour `off`)
  const c = game.chart || (game.chart = { known: new Uint8Array(w.chunksW * w.chunksH), at: -Infinity });
  const cx0 = Math.max(0, Math.floor(x0 / CHUNK)), cy0 = Math.max(0, Math.floor(y0 / CHUNK));
  const cx1 = Math.min(w.chunksW - 1, Math.floor((x1 - 1) / CHUNK)), cy1 = Math.min(w.chunksH - 1, Math.floor((y1 - 1) / CHUNK));
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const i = cy * w.chunksW + cx;
    if (!u.flow[i * 2] && !u.flow[i * 2 + 1]) continue;
    if (c.known[i] || (fresh && chunkKnown(game, c, i))) out.push(i);
  }
  return out;
}

/** Seen vent sites in the cell box. */
export function chartedVents(game, x0, y0, x1, y1) {
  const v = game.vents, w = game.world;
  if (!v || v.off) return [];
  return v.sites.filter(s => s.x >= x0 && s.x < x1 && s.y >= y0 && s.y < y1 && w.explored[s.y * w.w + s.x]);
}

/** Minimap marks, in the minimap's world transform (x * sc). `win` = miniWindow() (world px). */
export function drawChartMarks(m, g, sc, win) {
  const lvl = g.nexusLevels.chart || 0;
  if (!lvl || !chartOn(g) || g.endSeq) return;
  const x0 = win.ox / CELL, y0 = win.oy / CELL, x1 = x0 + win.win / CELL, y1 = y0 + win.win / CELL;
  const c = g.chart, fresh = !c || g.stats.time - c.at >= CHART_RECHECK_S;
  const list = chartedChunks(g, x0, y0, x1, y1, fresh);
  if (fresh) g.chart.at = g.stats.time;
  const CP = CHUNK * CELL * sc, top = UNDERTOW_SPEED[0] + UNDERTOW_SPEED[1];
  m.save();
  m.lineCap = 'round'; m.lineJoin = 'round';
  if (list.length) {
    m.strokeStyle = `rgb(${UNDERTOW_RGB})`; m.lineWidth = 1.5;
    m.beginPath();
    for (const i of list) {
      const fx = g.undertow.flow[i * 2], fy = g.undertow.flow[i * 2 + 1], sp = Math.hypot(fx, fy), ux = fx / sp, uy = fy / sp;
      const half = CP * 0.36 * sp / top, cx = ((i % g.world.chunksW) + 0.5) * CP, cy = (Math.floor(i / g.world.chunksW) + 0.5) * CP;
      const hx = cx + ux * half, hy = cy + uy * half, hd = Math.min(3, half * 0.6);
      m.moveTo(cx - ux * half, cy - uy * half); m.lineTo(hx, hy);
      m.moveTo(hx - ux * hd - uy * hd * 0.7, hy - uy * hd + ux * hd * 0.7); m.lineTo(hx, hy);
      m.lineTo(hx - ux * hd + uy * hd * 0.7, hy - uy * hd - ux * hd * 0.7);
    }
    m.stroke();
  }
  g.chartArrows = list.length; // tests read the counts
  g.chartVents = 0;
  if (lvl >= 2) {
    const vents = chartedVents(g, x0, y0, x1, y1), t = g.stats.time, hot = [];
    m.fillStyle = `rgb(${VENT_RGB})`;
    m.globalAlpha = 0.4; m.beginPath();
    for (const s of vents) {
      const ph = ventPhase(s, t);
      if (ph.tell > 0 || ph.flare > 0) hot.push(s); else m.rect((s.x + 0.5) * CELL * sc - 1, (s.y + 0.5) * CELL * sc - 1, 2, 2);
    }
    m.fill();
    if (hot.length) { // a vent in its tell (or flaring) brightens and grows
      m.globalAlpha = 1; m.beginPath();
      for (const s of hot) m.rect((s.x + 0.5) * CELL * sc - 1.75, (s.y + 0.5) * CELL * sc - 1.75, 3.5, 3.5);
      m.fill();
    }
    g.chartVents = vents.length; g.chartHot = hot.length;
  }
  m.restore();
}
