// S-41 (D-109): adaptive graphics quality. Fed each played frame's real gap since the last frame in ms (main.js; it counts
// the browser's deferred canvas raster, which JS work time misses: measured ~1 ms of JS on a 33 ms frame); decides a level
// 0..QUALITY_MAX that only the renderer reads. Never touches dt, RNG or collision, so a run plays the same at every level.
import { QUALITY_WINDOW_S, QUALITY_SLOW_MS, QUALITY_FAST_MS, QUALITY_UP_S, QUALITY_UP_MAX_S, QUALITY_MAX } from './config.js';

export const GRAPHICS = ['auto', 'high', 'low']; // Settings → Graphics; 'high' = L0 fixed, 'low' = L2 fixed

export class Quality {
  constructor(mode = 'auto') { this.level = 0; this.upS = QUALITY_UP_S; this.lastStep = 0; this.setMode(mode); }

  setMode(mode) {
    this.mode = GRAPHICS.includes(mode) ? mode : 'auto';
    if (this.mode === 'high') this.level = 0;
    else if (this.mode === 'low') this.level = QUALITY_MAX;
    this.reset();
  }

  /** Forget the window (page hidden, paused, level changed): old frames never decide the next step. */
  reset() { this.win = []; this.span = 0; this.fast = 0; }

  /** One played frame of `ms` real milliseconds. Returns true when the level changed. */
  sample(ms) {
    if (this.mode !== 'auto' || !(ms > 0)) return false;
    if (ms > 1000) { this.reset(); return false; } // a stall (tab switch, debugger) is not a frame rate
    this.win.push(ms); this.span += ms;
    while (this.span - this.win[0] >= QUALITY_WINDOW_S * 1000) this.span -= this.win.shift();
    if (this.span < QUALITY_WINDOW_S * 1000 * 0.98) return false; // the window isn't full yet
    const p90 = [...this.win].sort((a, b) => a - b)[Math.floor(this.win.length * 0.9)];
    if (p90 > QUALITY_SLOW_MS && this.level < QUALITY_MAX) {
      if (this.lastStep < 0) this.upS = Math.min(QUALITY_UP_MAX_S, this.upS * 2); // it bounced: wait longer next time
      this.level++; this.lastStep = 1; this.reset(); return true;
    }
    if (p90 < QUALITY_FAST_MS) {
      this.fast += ms;
      if (this.fast >= this.upS * 1000 && this.level > 0) { this.level--; this.lastStep = -1; this.reset(); return true; }
    } else this.fast = 0;
    return false;
  }
}
