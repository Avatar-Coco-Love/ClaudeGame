// Map view (owner feedback, session 153, D-191): a tap or click on the minimap (or the Map key, N) opens the same map
// drawn 3-4x larger in the middle of the screen, so its marks stop overlapping. The minimap catches its own taps, so a
// tap there no longer aims the beam. While the map is open the world holds still (like the ending card): reading it in
// Surge should never cost Integrity. A tap anywhere, the key again or Escape closes it.
import { drawMinimap } from './hud.js';
import { MAP_MAX_PX } from './config.js';
import { fillLegend } from './maplegend.js';

const LEGEND_RESERVE = 100; // S-76: portrait keeps this much height under the map for the legend (≤ 4 lines)

export class MapView {
  constructor(renderer, root, canvas) {
    this.renderer = renderer; this.root = root; this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.open = false; this.legendKey = null; this.kinds = null;
    // S-76: the legend, under the map in portrait (in the flow) or in a column each side of it in landscape
    this.legend = [0, 1].map(i => { const d = document.createElement('div'); d.className = 'maplegend'; d.id = 'maplegend' + (i || ''); return d; });
    canvas.after(this.legend[0]); root.append(this.legend[1]);
    root.addEventListener('click', () => this.close());
  }
  /** The side that fits: 92 % of the width, the height less 40 px for the close line (portrait: and the legend), at most MAP_MAX_PX. */
  side() { return Math.max(140, Math.min(MAP_MAX_PX, Math.floor(innerWidth * 0.92), innerHeight - 40 - (innerWidth > innerHeight ? 0 : LEGEND_RESERVE))); }
  show() { this.open = true; this.legendKey = null; this.root.classList.remove('hidden'); this.draw(); }
  /** Audit 154: re-fit on every draw, so a phone turned while the map is open never pushes it off screen. */
  fit() {
    const s = this.side();
    if (this.canvas.width === s) return;
    this.canvas.width = this.canvas.height = s;
    this.canvas.style.width = this.canvas.style.height = s + 'px';
  }
  close() { if (!this.open) return; this.open = false; this.root.classList.add('hidden'); }
  toggle() { this.open ? this.close() : this.show(); }
  draw() {
    if (!this.open || !this.renderer.game) return;
    this.fit();
    const key = innerWidth + 'x' + innerHeight + (document.documentElement.classList.contains('text-large') ? 'L' : '');
    if (key === this.legendKey) { drawMinimap(this.renderer, this.canvas, this.ctx); return; }
    this.kinds = new Map(); // S-76: built on open and on a resize, from what this draw puts on the map
    drawMinimap(this.renderer, this.canvas, this.ctx, this.kinds);
    this.buildLegend(this.kinds); this.legendKey = key;
  }
  /** S-76: one entry per kind drawn. Landscape: a column right of the map, overflow to a column left of it. Portrait: under it. */
  buildLegend(kinds) {
    const [a, b] = this.legend, land = innerWidth > innerHeight;
    for (const d of this.legend) { d.textContent = ''; d.removeAttribute('style'); d.classList.toggle('col', land); }
    if (!land) { a.style.maxWidth = this.canvas.width + 'px'; fillLegend(a, kinds); return; } // wraps under the map
    const m = this.canvas.getBoundingClientRect(), colW = Math.max(60, (innerWidth - m.width) / 2 - 16); // measured while empty
    a.style.cssText = `position:absolute;left:${m.right + 12}px;top:${m.top}px;width:${colW}px`;
    b.style.cssText = `position:absolute;right:${innerWidth - m.left + 12}px;top:${m.top}px;width:${colW}px`;
    fillLegend(a, kinds);
    while (a.children.length > 1 && a.getBoundingClientRect().height > m.height) b.prepend(a.lastElementChild);
  }
}
