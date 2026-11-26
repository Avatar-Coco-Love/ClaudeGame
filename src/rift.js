// S-57a Rift (D-152, D-156): an M13 world event, the same in Drift and Surge. Event k opens at the sum of k + 1 gaps from
// rng['rift'] (play time, `stats.time`); a start that falls inside a weather event waits for that event's end, so the
// schedule stays a pure function of seed and time. While open (RIFT_S), a 3 × 3 rock pocket 8–12 cells from the core, in
// the core's own ring, is ore (RIFT_ORE by ring); at the close every pocket cell still standing reverts whole to its old
// type (ore lost). Nothing is saved: the cells regenerate from the seed on a reload, and a reload mid-rift skips that rift.
// A Wake or the ending closes the open one and skips any due inside them. `force` 'off' is for tools and tests only.
import { RIFT_EVERY_S, RIFT_S, RIFT_R, RIFT_TRIES, RIFT_ORE, RIFT_MAJOR, RIFT_BONUS, RIFT_RGB, WEATHER_S, NEXUS_RADIUS, CELL, T } from './config.js';
import { seededStream, insideBorder } from './world.js';
import { weatherGap } from './weather.js';

const gap = rng => RIFT_EVERY_S[0] + rng() * RIFT_EVERY_S[1];

/** A schedule cursor: raw starts from rng['rift'], each pushed past any weather event it falls in (rng['weather']). */
function schedule(seed) {
  const rng = seededStream(seed, 'rift'), wr = seededStream(seed, 'weather');
  let raw = 0, w = weatherGap(wr);
  return () => {
    let s = raw += gap(rng);
    while (w + WEATHER_S <= s) w += weatherGap(wr);
    if (w <= s) s = w + WEATHER_S;
    return s;
  };
}

export function makeRift(seed) {
  const next = schedule(seed);
  return { next, site: seededStream(seed, 'rift-site'), k: 0, start: next(), open: null, tried: -1, skip: -1, fresh: true, opened: 0, mined: 0, force: null };
}

/** Start times of the first `n` rifts for a seed (tests and tools; the same draws updateRift makes). */
export function riftStarts(seed, n) {
  const next = schedule(seed), out = [];
  for (let i = 0; i < n; i++) out.push(next());
  return out;
}

const ROCKY = new Set([T.ROCK, T.DENSE]);
/** May (x, y) centre a pocket? All 9 cells rock or dense (so no vault, Spire, bedrock, ore or open floor), one cell clear of
 *  the border, out of the Nexus disc, and no Anomaly site or Kiln vent inside the 3 × 3. */
export function pocketClear(game, x, y) {
  const w = game.world;
  if (!insideBorder(x, y, 2, w.w, w.h)) return false;
  if (Math.hypot(x + 0.5 - w.cx, y + 0.5 - w.cy) < NEXUS_RADIUS / CELL + 2) return false;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!ROCKY.has(w.get(x + dx, y + dy))) return false;
  const near = s => Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) <= 1;
  return !game.anomaly.sites.some(near) && !(game.vents ? game.vents.sites : []).some(near);
}

/** A pocket centre for the core's position, or null (up to RIFT_TRIES draws from rng['rift-site']). */
export function riftSite(game) {
  const w = game.world, p = game.player, px = p.x / CELL, py = p.y / CELL, ring = w.ring(Math.floor(px), Math.floor(py));
  for (let t = 0; t < RIFT_TRIES; t++) {
    const a = game.rift.site() * Math.PI * 2, d = RIFT_R[0] + game.rift.site() * (RIFT_R[1] - RIFT_R[0]);
    const x = Math.floor(px + Math.cos(a) * d), y = Math.floor(py + Math.sin(a) * d), dc = Math.hypot(x + 0.5 - px, y + 0.5 - py);
    if (dc < RIFT_R[0] || dc > RIFT_R[1] || w.ring(x, y) !== ring || !pocketClear(game, x, y)) continue;
    return { x, y, ring };
  }
  return null;
}

/** Open rift k now, if a site exists (else it is skipped quietly). The 3 minor-ore cells are drawn from the site stream. */
export function openRift(game) {
  const r = game.rift, s = riftSite(game);
  if (!s) return false;
  const [major, minor] = RIFT_ORE[s.ring], order = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = 8; i > 0; i--) { const j = Math.floor(r.site() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const cells = [];
  order.forEach((n, rank) => {
    const x = s.x + (n % 3) - 1, y = s.y + Math.floor(n / 3) - 1, type = rank < RIFT_MAJOR[s.ring] ? major : minor;
    cells.push({ x, y, prev: game.world.get(x, y), type });
    game.world.retype(x, y, type);
  });
  r.open = { k: r.k, x: s.x, y: s.y, ring: s.ring, cells, t0: game.stats.time };
  r.opened++;
  game.audio.riftOpen(); // S-57b
  game.notify('rift-open');
  return true;
}

/** Close the open rift: every pocket cell still standing goes back to its old type, cracked or not. */
export function closeRift(game) {
  const r = game.rift;
  if (!r.open) return;
  for (const c of r.open.cells) if (game.world.get(c.x, c.y) !== T.EMPTY) game.world.retype(c.x, c.y, c.prev); else r.mined++; // tools: cells taken
  r.open = null;
  game.audio.riftClose(); // S-57b
  game.notify('rift-close');
}

export function updateRift(game) {
  const r = game.rift, t = game.stats.time;
  if (!Number.isFinite(t)) return;
  if (r.force === 'off') { closeRift(game); return; }
  while (t >= r.start + RIFT_S) { r.start = r.next(); r.k++; }
  if (r.fresh) { r.fresh = false; if (t >= r.start) r.skip = r.k; } // a reload mid-rift skips it (nothing saved)
  const busy = game.wake || game.endSeq;
  if (busy && t >= r.start) r.skip = r.k; // cancelled, as weather is; one due inside them never opens
  const due = t >= r.start && r.skip !== r.k;
  if (r.open && (r.open.k !== r.k || !due)) closeRift(game);
  if (!r.open && due && r.tried !== r.k) { r.tried = r.k; if (!game.bossAwake) openRift(game); } // S-60b: none opens while a boss is awake
}

/** Extra yield rolls for an ore cell broken at (x, y): RIFT_BONUS inside the open pocket, else 0 (D-156). */
export function riftBonus(game, x, y) {
  const o = game.rift && game.rift.open;
  return o && o.cells.some(c => c.x === x && c.y === y) ? RIFT_BONUS : 0;
}

/** The pocket's standing cells shimmer violet-white (an alpha pulse on their edge, no blur). Reduced motion: steady. */
export function drawRift(rd, ctx) {
  const g = rd.game, o = g.rift && g.rift.open;
  if (!o) return;
  const still = g.settings && g.settings.reducedMotion;
  ctx.save();
  ctx.strokeStyle = `rgb(${RIFT_RGB})`; ctx.lineWidth = 2;
  for (const c of o.cells) {
    if (g.world.get(c.x, c.y) === T.EMPTY) continue;
    ctx.globalAlpha = still ? 0.6 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(rd.time * 4 + c.x * 1.1 + c.y * 0.7));
    ctx.strokeRect(c.x * CELL + 2, c.y * CELL + 2, CELL - 4, CELL - 4);
  }
  ctx.restore();
}

/** Minimap: a violet-white dot at the pocket while it is open (shown whether or not it was explored). */
export function drawRiftMark(m, g, sc) {
  const o = g.rift && g.rift.open;
  if (!o) return;
  m.fillStyle = `rgb(${RIFT_RGB})`;
  m.beginPath(); m.arc((o.x + 0.5) * CELL * sc, (o.y + 0.5) * CELL * sc, 3, 0, Math.PI * 2); m.fill();
}
