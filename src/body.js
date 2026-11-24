// Grid bodies (S-18 split out of game.js): circle-vs-cell collision and axis-separated movement with corner assist.
import { CELL } from './config.js';

export function collides(world, x, y, r) {
  const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
  const y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (world.solid(cx, cy)) return true;
  return false;
}

/** Move a body by (dx,dy) resolving each axis separately against the grid. Returns realized displacement. */
export function moveBody(world, b, dx, dy, assist = false) {
  const sx = b.x, sy = b.y;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (CELL * 0.4)));
  const ix = dx / steps, iy = dy / steps;
  for (let s = 0; s < steps; s++) {
    if (ix) {
      b.x += ix;
      if (collides(world, b.x, b.y, b.r)) {
        b.x = ix > 0 ? Math.floor((b.x + b.r) / CELL) * CELL - b.r - 0.01
                     : (Math.floor((b.x - b.r) / CELL) + 1) * CELL + b.r + 0.01;
        if (assist && Math.abs(ix) > Math.abs(iy)) cornerAssist(world, b, 'y', ix > 0 ? 1 : -1, 0, Math.abs(ix));
      }
    }
    if (iy) {
      b.y += iy;
      if (collides(world, b.x, b.y, b.r)) {
        b.y = iy > 0 ? Math.floor((b.y + b.r) / CELL) * CELL - b.r - 0.01
                     : (Math.floor((b.y - b.r) / CELL) + 1) * CELL + b.r + 0.01;
        if (assist && Math.abs(iy) >= Math.abs(ix)) cornerAssist(world, b, 'x', 0, iy > 0 ? 1 : -1, Math.abs(iy));
      }
    }
  }
  return { x: b.x - sx, y: b.y - sy };
}

/** Blocked head-on? Slide along `axis` toward the nearest offset (within ~half a cell) that opens the way. */
function cornerAssist(world, b, axis, dirX, dirY, amount) {
  const probe = 2;
  for (let off = 1; off <= CELL * 0.55; off += 1) {
    for (const sign of [1, -1]) {
      const o = off * sign;
      const x = axis === 'x' ? b.x + o : b.x, y = axis === 'y' ? b.y + o : b.y;
      if (!collides(world, x, y, b.r) && !collides(world, x + dirX * probe, y + dirY * probe, b.r)) {
        const step = Math.sign(o) * Math.min(Math.abs(o), amount);
        if (axis === 'x') b.x += step; else b.y += step;
        if (collides(world, b.x, b.y, b.r)) { if (axis === 'x') b.x -= step; else b.y -= step; }
        return;
      }
    }
  }
}
