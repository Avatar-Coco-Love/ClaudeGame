// S-33 Weather (D-087, D-097): a storm in Surge, an aurora in Drift. The schedule is a pure function of the world seed and
// play time (`stats.time`, saved): event k starts at the sum of k + 1 gaps drawn from rng['weather'] and lasts WEATHER_S.
// Only `cancel` (the index of the event a Wake ended) is saved (B-081): a reload mid-event resumes it unless it was cancelled. The face follows the mode (storm in Surge, aurora in Drift); a Wake
// or the ending cancels the event in progress (and one due inside them is skipped). `force` ('on' | 'off') is for tools
// and tests only. Effects: glitch.js reads `stormOn` (spawn interval, cap); game.js asks `auroraBonus` on an ore break.
import { WEATHER_EVERY_S, WEATHER_S, WEATHER_EASE_S, WEATHER_TINT, AURORA_BONUS, AURORA_CHANCE, LIGHT_RADIUS, CELL, T, MATERIAL } from './config.js';
import { seededStream } from './world.js';

export const weatherGap = rng => WEATHER_EVERY_S[0] + rng() * WEATHER_EVERY_S[1];
const gap = weatherGap;

export function makeWeather(seed) {
  const rng = seededStream(seed, 'weather');
  return { rng, bonus: seededStream(seed, 'aurora'), k: 0, start: gap(rng), kind: null, was: null, cancel: -1, glow: 0, force: null };
}

/** Start times of the first `n` events for a seed (tests and tools; the same draws updateWeather makes). */
export function weatherStarts(seed, n) {
  const rng = seededStream(seed, 'weather'), out = [];
  for (let t = 0, i = 0; i < n; i++) out.push(t += gap(rng));
  return out;
}

export function updateWeather(game, dt) {
  const w = game.weather, t = game.stats.time;
  if (!Number.isFinite(t)) return;
  while (t >= w.start + WEATHER_S) { w.start += gap(w.rng); w.k++; }
  let on = w.force === 'on' || (w.force !== 'off' && t >= w.start && w.cancel !== w.k);
  if (on && (game.wake || game.endSeq)) { on = false; if (w.force !== 'on') w.cancel = w.k; }
  const kind = on ? (game.mode === 'surge' ? 'storm' : 'aurora') : null;
  if (kind !== w.kind) {
    if (kind) game.notify('weather-start'); else { w.was = w.kind; if (!game.wake && !game.endSeq) game.notify('weather-end'); } // a Wake's own toast says enough
    w.kind = kind;
  }
  if (kind) w.face = kind;
  w.glow = Math.max(0, Math.min(1, w.glow + (kind ? 1 : -1) * dt / WEATHER_EASE_S));
}

/** Seconds left in the event in progress (0 when none, or forced). */
export function weatherLeft(game) {
  const w = game.weather;
  return w.kind && w.force !== 'on' ? Math.max(0, Math.ceil(w.start + WEATHER_S - game.stats.time)) : 0;
}

export const stormOn = game => !!game.weather && game.weather.kind === 'storm';

/** Extra pickups for an ore cell broken at (cx, cy) px: AURORA_BONUS inside the core's light during an aurora, with chance
 *  AURORA_CHANCE (its own stream, drawn only for a qualifying break). */
export function auroraBonus(game, cx, cy, type) {
  const w = game.weather;
  if (!w || w.kind !== 'aurora' || (type !== T.CRYSTAL && type !== T.PRISM)) return 0;
  if (Math.hypot(cx - game.player.x, cy - game.player.y) > LIGHT_RADIUS) return 0;
  return w.bonus() < AURORA_CHANCE ? AURORA_BONUS : 0;
}

/** The darkness colour: the base near-black eased toward the event's tint. */
export function darkRGB(game) {
  const w = game.weather, base = [2, 3, 10];
  if (!w || w.glow <= 0 || !w.face) return base.join(', ');
  const c = WEATHER_TINT[w.face];
  return base.map((b, i) => Math.round(b + (c[i] - b) * w.glow)).join(', ');
}

/** Aurora shimmer: every Shard / Prism cell within the core's light gets a breathing outline in its own colour (world
 *  transform; about 270 cell reads a frame). Reduced motion: a steady outline. */
export function drawAurora(r, ctx) {
  const g = r.game, w = g.weather;
  if (!w || w.glow <= 0 || w.face !== 'aurora') return;
  const p = g.player, R = LIGHT_RADIUS / CELL, px = p.x / CELL, py = p.y / CELL, still = g.settings && g.settings.reducedMotion;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 2;
  for (let y = Math.floor(py - R); y <= py + R; y++) for (let x = Math.floor(px - R); x <= px + R; x++) {
    const type = g.world.get(x, y);
    if (type !== T.CRYSTAL && type !== T.PRISM) continue;
    const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
    if (d > R) continue;
    const wave = still ? 0.6 : 0.5 + 0.5 * Math.sin(r.time * 3 + x * 0.9 + y * 1.3);
    ctx.globalAlpha = w.glow * (1 - d / R * 0.5) * (0.25 + 0.5 * wave);
    ctx.strokeStyle = MATERIAL[type].edge;
    ctx.strokeRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
  }
  ctx.restore();
}
