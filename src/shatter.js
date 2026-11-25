// S-47b brittle glass (D-128): breaking a Shoal ROCK / DENSE cell cracks one solid Shoal ROCK / DENSE 4-neighbour for
// SHATTER_SHARE of that neighbour's hp. The pick is seeded on the broken cell's index (salt 'shatter' + index), so the
// same seed always cracks the same neighbour whatever the break order. A crack that breaks its cell yields and sounds as
// normal (game.onCellBroken) but cracks nothing (no chains). Ore, vaults, Spires and bedrock are never picked. Not saved.
import { CELL as C, T, SHATTER_RING, SHATTER_SHARE, SHATTER_FLASH_S, SHATTER_RGB } from './config.js';
import { seededStream } from './world.js';

const N4 = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const brittle = (w, x, y) => { const t = w.get(x, y); return (t === T.ROCK || t === T.DENSE) && w.ring(x, y) === SHATTER_RING; };

/** Which 4-neighbour a break at (x, y) cracks, or null. Pure: seed + cell index + the cells standing now. */
export function shatterPick(w, x, y) {
  if (!w.inBounds(x, y) || w.ring(x, y) !== SHATTER_RING) return null;
  const open = N4.map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => w.inBounds(nx, ny) && brittle(w, nx, ny));
  if (!open.length) return null;
  const r = seededStream(w.seed, 'shatter' + (y * w.w + x))();
  return open[Math.floor(r * open.length)];
}

/** Called from game.onCellBroken for a ROCK / DENSE break that was not itself a crack. */
export function shatter(game, x, y) {
  const w = game.world, pick = shatterPick(w, x, y);
  if (!pick) return null;
  const [nx, ny] = pick, type = w.get(nx, ny), res = w.hit(nx, ny, SHATTER_SHARE * w.hpAt(nx, ny, type));
  const s = game.shatter || (game.shatter = { lines: [], cracks: 0 });
  s.cracks++;
  s.lines = s.lines.filter(l => game.stats.time - l.t < SHATTER_FLASH_S);
  s.lines.push({ x0: x, y0: y, x1: nx, y1: ny, t: game.stats.time });
  if (res && res.broken) game.onCellBroken(nx, ny, res.type, true);
  return { x: nx, y: ny, broken: !!(res && res.broken) };
}

/** A faint line from the broken cell's centre into the cracked one, fading over SHATTER_FLASH_S (world space). */
export function drawShatter(r, ctx) {
  const g = r.game, s = g.shatter;
  if (!s || !s.lines.length) return;
  ctx.save(); ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  for (const l of s.lines) {
    const a = 1 - (g.stats.time - l.t) / SHATTER_FLASH_S;
    if (a <= 0) continue;
    ctx.strokeStyle = `rgba(${SHATTER_RGB}, ${(0.7 * a).toFixed(3)})`;
    const mx = (l.x0 + l.x1) / 2 + 0.5, my = (l.y0 + l.y1) / 2 + 0.5, jx = (l.y1 - l.y0) * 0.18, jy = (l.x0 - l.x1) * 0.18;
    ctx.beginPath();
    ctx.moveTo((l.x0 + 0.5) * C, (l.y0 + 0.5) * C); ctx.lineTo((mx + jx) * C, (my + jy) * C); ctx.lineTo((l.x1 + 0.5) * C, (l.y1 + 0.5) * C);
    ctx.stroke();
  }
  ctx.restore();
}
