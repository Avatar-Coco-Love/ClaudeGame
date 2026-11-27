// Map view (owner feedback, session 153, D-191): a tap or click on the minimap (or the Map key, N) opens the same map
// drawn 3-4x larger in the middle of the screen, so its marks stop overlapping. The minimap catches its own taps, so a
// tap there no longer aims the beam. While the map is open the world holds still (like the ending card): reading it in
// Surge should never cost Integrity. A tap anywhere, the key again or Escape closes it.
import { drawMinimap } from './hud.js';
import { MAP_MAX_PX } from './config.js';

export class MapView {
  constructor(renderer, root, canvas) {
    this.renderer = renderer; this.root = root; this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.open = false;
    root.addEventListener('click', () => this.close());
  }
  /** The side that fits: 92 % of the width, the height less 40 px for the close line, at most MAP_MAX_PX. */
  side() { return Math.max(140, Math.min(MAP_MAX_PX, Math.floor(innerWidth * 0.92), innerHeight - 40)); }
  show() { this.open = true; this.root.classList.remove('hidden'); this.draw(); }
  /** Audit 154: re-fit on every draw, so a phone turned while the map is open never pushes it off screen. */
  fit() {
    const s = this.side();
    if (this.canvas.width === s) return;
    this.canvas.width = this.canvas.height = s;
    this.canvas.style.width = this.canvas.style.height = s + 'px';
  }
  close() { if (!this.open) return; this.open = false; this.root.classList.add('hidden'); }
  toggle() { this.open ? this.close() : this.show(); }
  draw() { if (!this.open || !this.renderer.game) return; this.fit(); drawMinimap(this.renderer, this.canvas, this.ctx); }
}
