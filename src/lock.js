// S-58 Flare Lock (D-159): an outer vault (vaultSites index ≥ the profile's inner count) whose centre is in the Kiln ring.
// Its shell (T.VAULT cells of its 7×7 footprint) is quenched: every world.hit on it (beam, Arc, Pulse, Echo) is × 0, except
// in the soft window, the last LOCK_SOFT_S of its own VENT_PERIOD_S cycle (phase from seededStream(seed, 'lock'), one draw
// per vault index), where it is × LOCK_SOFT_MUL. A VENT_TELL_S tell (the shell's edge warms orange) comes first; the window
// opens with a flare: a core within VENT_R cells of the footprint is shoved straight out at HURT_KNOCKBACK and gains
// VENT_HEAT (no damage), once per cycle. Opened (its cache gone, also in an old save) = a plain vault. Same in both modes.
// Seed-only, never saved; a 160 world has no outer vaults, so no locks.
// S-59 Tide Lock (D-162): an outer vault centred in the Shoal. undertow.js gives its chunk a current always (tideSites'
// heading when the draw was calm); its shell takes a hit only when the hit points against that flow (dot < LOCK_TIDE_DOT),
// so it is cut from downstream while the Undertow pushes the core away. Upstream shell cells carry mint chevrons.
import { CELL, CHUNK, T, VAULT_HALF, KILN_RING, TIDE_RING, HURT_KNOCKBACK, VENT_PERIOD_S, VENT_TELL_S, VENT_R, VENT_HEAT,
  LOCK_SOFT_S, LOCK_SOFT_MUL, LOCK_RGB, LOCK_TIDE_DOT, UNDERTOW_RGB } from './config.js';
import { seededStream, vaultSites } from './world.js';
import { overheat } from './heat.js';

/** The locks of a World: [{ x, y, i (vault index), phase, fired }]. Depends on the seed (and which vaults were stamped). */
export function lockSites(world) {
  const { w, h, seed } = world, inner = world.profile.vaults, rand = seededStream(seed, 'lock'), out = [];
  vaultSites(seed, w, h).forEach((v, i) => {
    const phase = rand() * VENT_PERIOD_S; // one draw per vault index, kept or not, so a skipped vault moves no phase
    if (i < inner || world.ring(v.x, v.y) !== KILN_RING || !world.vaults.some(q => q.x === v.x && q.y === v.y)) return;
    out.push({ x: v.x, y: v.y, i, phase, fired: -1 });
  });
  return out;
}

/** S-59: the Tide Locks of a World: [{ x, y, i, chunk, hx, hy }], (hx, hy) the seeded unit heading a calm chunk takes. */
export function tideSites(world) {
  const { w, h, seed } = world, inner = world.profile.vaults, rand = seededStream(seed, 'tidelock'), out = [];
  vaultSites(seed, w, h).forEach((v, i) => {
    const a = Math.floor(rand() * 8) * Math.PI / 4; // one draw per vault index, like the Flare phase
    if (i < inner || world.ring(v.x, v.y) !== TIDE_RING || !world.vaults.some(q => q.x === v.x && q.y === v.y)) return;
    out.push({ x: v.x, y: v.y, i, chunk: Math.floor(v.y / CHUNK) * world.chunksW + Math.floor(v.x / CHUNK), hx: Math.cos(a), hy: Math.sin(a) });
  });
  return out;
}

/** Builds `game.locks` and hooks the world's hit multiplier (`dir`: the hit's unit direction, else core -> cell). */
export function makeLocks(game) {
  const sites = lockSites(game.world), tides = tideSites(game.world);
  game.locks = { sites, tides, flares: 0 };
  game.world.hitMul = sites.length || tides.length ? (x, y, type, dir) => lockMul(game, x, y, type, dir) : null;
}

/** S-59: the unit flow of a Tide Lock's chunk (the field undertow.js built; never calm), or its heading before it exists. */
export function tideFlow(game, L) {
  const f = game.undertow && game.undertow.flow, fx = f ? f[L.chunk * 2] : 0, fy = f ? f[L.chunk * 2 + 1] : 0, s = Math.hypot(fx, fy);
  return s > 0 ? [fx / s, fy / s] : [L.hx, L.hy];
}

/** S-59: × 1 when the hit on (x, y) points against the lock's flow, else × 0. */
function tideMul(game, L, x, y, dir) {
  const [dx, dy] = dir || [(x + 0.5) * CELL - game.player.x, (y + 0.5) * CELL - game.player.y];
  const d = Math.hypot(dx, dy) || 1, [fx, fy] = tideFlow(game, L);
  return (dx * fx + dy * fy) / d < LOCK_TIDE_DOT ? 1 : 0;
}

/** Where a lock is in its cycle at time `t`: { n, u, tell 0..1, soft (true in the window) }. */
export function lockPhase(L, t) {
  const v = t + L.phase, n = Math.floor(v / VENT_PERIOD_S), u = v - n * VENT_PERIOD_S, s0 = VENT_PERIOD_S - LOCK_SOFT_S;
  return { n, u, tell: u >= s0 - VENT_TELL_S && u < s0 ? (u - s0 + VENT_TELL_S) / VENT_TELL_S : 0, soft: u >= s0 };
}

export const lockOpen = (world, L) => world.get(L.x, L.y) !== T.CACHE;

/** The live (unopened) lock whose footprint holds cell (x, y), or null (`tide`: look among the Tide Locks). */
export function lockAt(game, x, y, tide = false) {
  const ls = game.locks;
  if (!ls) return null;
  for (const L of tide ? ls.tides || [] : ls.sites) if (Math.abs(x - L.x) <= VAULT_HALF && Math.abs(y - L.y) <= VAULT_HALF && !lockOpen(game.world, L)) return L;
  return null;
}

/** The beam multiplier on cell (x, y) of `type`: 1 off a lock's shell, else 0 / LOCK_SOFT_MUL by the cycle (Flare) or
 *  0 / 1 by the hit's direction against the flow (Tide). */
export function lockMul(game, x, y, type, dir) {
  if (type !== T.VAULT) return 1;
  const L = lockAt(game, x, y);
  if (L) return lockPhase(L, game.stats.time).soft ? LOCK_SOFT_MUL : 0;
  const D = lockAt(game, x, y, true);
  return D ? tideMul(game, D, x, y, dir) : 1;
}

/** True when a beam on (x, y) is wasted on a quenched shell (the beam's spark turns dull grey). */
export const quenched = (game, x, y) => !!game.world.hitMul && game.world.get(x, y) === T.VAULT && lockMul(game, x, y, T.VAULT) === 0;

/** Once a frame, with the vents: a lock's window opening flares at a core within VENT_R cells of its footprint. */
export function updateLocks(game) {
  const ls = game.locks, p = game.player;
  if (!ls || !ls.sites.length || game.endSeq) return;
  const cx = p.x / CELL, cy = p.y / CELL, edge = VAULT_HALF + 0.5;
  for (const L of ls.sites) {
    const mx = L.x + 0.5, my = L.y + 0.5, ox = Math.max(0, Math.abs(cx - mx) - edge), oy = Math.max(0, Math.abs(cy - my) - edge);
    if (Math.hypot(ox, oy) > VENT_R || lockOpen(game.world, L)) continue;
    const ph = lockPhase(L, game.stats.time);
    if (!ph.soft || L.fired === ph.n || ph.u > VENT_PERIOD_S - LOCK_SOFT_S + 0.25) continue; // only as the window opens
    L.fired = ph.n; ls.flares++;
    const dx = p.x - mx * CELL, dy = p.y - my * CELL, d = Math.hypot(dx, dy);
    const ux = d > 1e-6 ? dx / d : Math.cos(p.angle), uy = d > 1e-6 ? dy / d : Math.sin(p.angle);
    p.vx += ux * HURT_KNOCKBACK; p.vy += uy * HURT_KNOCKBACK;
    game.heat = Math.min(1, game.heat + VENT_HEAT);
    if (game.heat >= 1 - 1e-9) overheat(game);
    game.addShake(4);
  }
}

/** World transform: the shell cells of a seen, unopened lock in view get an edge that warms orange in the tell and
 *  burns bright in the soft window (no pulse in reduced motion). One unblurred path per lock. */
export function drawLocks(r, ctx, left, top, vw, vh) {
  const g = r.game, ls = g.locks, w = g.world;
  if (!ls || !ls.sites.length || g.endSeq) return;
  const t = g.stats.time, still = g.settings && g.settings.reducedMotion, H = VAULT_HALF;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgb(${LOCK_RGB})`; ctx.lineWidth = 2;
  for (const L of ls.sites) {
    const x0 = (L.x - H) * CELL, y0 = (L.y - H) * CELL, S = (2 * H + 1) * CELL;
    if (x0 > left + vw || y0 > top + vh || x0 + S < left || y0 + S < top || !w.explored[L.y * w.w + L.x] || lockOpen(w, L)) continue;
    const ph = lockPhase(L, t), pulse = still ? 1 : 0.75 + 0.25 * Math.sin(ph.u * Math.PI * 6);
    ctx.globalAlpha = ph.soft ? 0.9 * pulse : ph.tell > 0 ? 0.25 + 0.55 * ph.tell : 0.12;
    ctx.beginPath();
    for (let y = L.y - H; y <= L.y + H; y++) for (let x = L.x - H; x <= L.x + H; x++)
      if (w.get(x, y) === T.VAULT) ctx.rect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
    ctx.stroke();
  }
  ctx.restore();
}

/** S-59, world transform: a seen, unopened Tide Lock in view gets faint mint chevrons on its upstream shell cells, pointing
 *  along the flow (they drift a little with it; still in reduced motion). One unblurred path per lock. */
export function drawTides(r, ctx, left, top, vw, vh) {
  const g = r.game, ls = g.locks, w = g.world;
  if (!ls || !ls.tides || !ls.tides.length || g.endSeq) return;
  const H = VAULT_HALF, still = g.settings && g.settings.reducedMotion, run = still ? 0 : (r.time * 0.8) % 1;
  ctx.save();
  ctx.strokeStyle = `rgb(${UNDERTOW_RGB})`; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.globalAlpha = 0.4;
  let n = 0;
  for (const L of ls.tides) {
    const x0 = (L.x - H) * CELL, y0 = (L.y - H) * CELL, S = (2 * H + 1) * CELL;
    if (x0 > left + vw || y0 > top + vh || x0 + S < left || y0 + S < top || !w.explored[L.y * w.w + L.x] || lockOpen(w, L)) continue;
    const [fx, fy] = tideFlow(g, L), px = -fy, py = fx, a = CELL * 0.22, o = (run - 0.5) * CELL * 0.3;
    ctx.beginPath();
    for (let y = L.y - H; y <= L.y + H; y++) for (let x = L.x - H; x <= L.x + H; x++) {
      if (w.get(x, y) !== T.VAULT || (x - L.x) * fx + (y - L.y) * fy > -1.5) continue; // the upstream side only
      const cx = (x + 0.5) * CELL + fx * o, cy = (y + 0.5) * CELL + fy * o; // a '>' pointing downstream
      ctx.moveTo(cx - fx * a + px * a, cy - fy * a + py * a); ctx.lineTo(cx + fx * a, cy + fy * a); ctx.lineTo(cx - fx * a - px * a, cy - fy * a - py * a);
      n++;
    }
    ctx.stroke();
  }
  ctx.restore();
  r.tideChevrons = n; // tests read the count
}
