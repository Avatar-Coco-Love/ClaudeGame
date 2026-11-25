// S-48b Kiln flare vents (D-129). Seed-only sites on Kiln-ring cells; the terrain is never changed (a flare only matters
// where the core can be). Each vent cycles VENT_PERIOD_S from a seeded phase, timed by `stats.time`: idle, a VENT_TELL_S
// tell (the hexagon brightens and pulses), then a VENT_FLARE_S flare of VENT_R cells. A core inside a flare is shoved
// straight out at HURT_KNOCKBACK and gains VENT_HEAT heat (it can overheat), once per flare. No damage, no cargo loss, no
// invulnerability, either mode; Glitches, the Echo and pickups ignore flares. Nothing saved. Sites are bucketed by chunk:
// only those round the core are stepped, only those in view (+ 3 cells) and explored are drawn; none during the Ending.
import { CELL, CHUNK, VAULT_HALF, KILN_RING, HURT_KNOCKBACK, VENT_PER_CELLS, VENT_GAP, VENT_TRIES, VENT_PERIOD_S, VENT_TELL_S,
  VENT_FLARE_S, VENT_R, VENT_HEAT, VENT_RGB, VENT_HEAR_R } from './config.js';
import { seededStream, vaultSites, insideBorder } from './world.js';
import { chooseSpires, SPIRE_HALF } from './spire.js';
import { overheat } from './heat.js';

/** Sites for a World: [{ x, y, phase }]. Depends on the seed alone (rings, vaultSites, the save-less Spire choice, the
 *  Anomaly sites passed in). None in a world without a Kiln. */
export function ventSites(world, anomalies = []) {
  const { w, h, seed } = world;
  if (world.profile.rings <= KILN_RING) return [];
  let kiln = 0;
  for (let i = 0; i < w * h; i++) if (world.rings[i] === KILN_RING) kiln++;
  const count = Math.round(kiln / VENT_PER_CELLS), rand = seededStream(seed, 'vent'), out = [];
  const blocks = [...vaultSites(seed, w, h).map(v => ({ x: v.x, y: v.y, r: VAULT_HALF })),
    ...chooseSpires(seed, null, null, w, h).map(s => ({ x: s.x, y: s.y, r: SPIRE_HALF })), ...anomalies.map(a => ({ x: a.x, y: a.y, r: 0 }))];
  for (let t = 0; t < count * VENT_TRIES && out.length < count; t++) {
    const x = Math.floor(rand() * w), y = Math.floor(rand() * h);
    if (!insideBorder(x, y, 0, w, h) || world.rings[y * w + x] !== KILN_RING) continue;
    if (blocks.some(b => Math.max(Math.abs(b.x - x), Math.abs(b.y - y)) <= b.r)) continue;
    if (out.some(s => Math.hypot(s.x - x, s.y - y) < VENT_GAP)) continue;
    out.push({ x, y, phase: rand() * VENT_PERIOD_S }); // the phase from the same stream (S-48b)
  }
  return out;
}

export function makeVents(world, anomalies) {
  const sites = ventSites(world, anomalies), buckets = new Map();
  sites.forEach((s, i) => {
    s.fired = -1; // the last flare (cycle number) that shoved the core: once per flare
    const k = Math.floor(s.y / CHUNK) * world.chunksW + Math.floor(s.x / CHUNK);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(i);
  });
  return { sites, buckets, stepped: 0, tells: 0, off: false };
}

/** Where a vent is in its cycle at time `t`: { n (cycle number), u (seconds into it), tell 0..1, flare 0..1 (1 = just fired) }. */
export function ventPhase(s, t) {
  const v = t + s.phase, n = Math.floor(v / VENT_PERIOD_S), u = v - n * VENT_PERIOD_S, f0 = VENT_PERIOD_S - VENT_FLARE_S;
  return { n, u, tell: u >= f0 - VENT_TELL_S && u < f0 ? (u - f0 + VENT_TELL_S) / VENT_TELL_S : 0, flare: u >= f0 ? 1 - (u - f0) / VENT_FLARE_S : 0 };
}

/** Indices of the sites in the chunks overlapping cell box [x0, x1] × [y0, y1]. */
function sitesIn(game, x0, y0, x1, y1) {
  const v = game.vents, w = game.world, out = [];
  const cx0 = Math.max(0, Math.floor(x0 / CHUNK)), cy0 = Math.max(0, Math.floor(y0 / CHUNK));
  const cx1 = Math.min(w.chunksW - 1, Math.floor(x1 / CHUNK)), cy1 = Math.min(w.chunksH - 1, Math.floor(y1 / CHUNK));
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) { const b = v.buckets.get(cy * w.chunksW + cx); if (b) out.push(...b); }
  return out;
}

/** Once a frame, after the beam (so a flare's overheat holds from the next frame): shove the core out of a live flare.
 *  Audit 109: a vent within VENT_HEAR_R cells (inside the core's reveal, so always seen) sounds its tell once per cycle (`audio.ventTell`, both modes alike). */
export function updateVents(game) {
  const v = game.vents, p = game.player;
  v.stepped = 0;
  if (v.off || game.endSeq || !v.sites.length) return;
  const cx = p.x / CELL, cy = p.y / CELL, reach = Math.max(VENT_R + 1, VENT_HEAR_R);
  for (const i of sitesIn(game, cx - reach, cy - reach, cx + reach, cy + reach)) {
    const s = v.sites[i], ph = ventPhase(s, game.stats.time);
    v.stepped++;
    if (ph.tell > 0 && s.told !== ph.n && Math.hypot(cx - s.x - 0.5, cy - s.y - 0.5) <= VENT_HEAR_R) { s.told = ph.n; v.tells++; game.audio.ventTell(); }
    if (ph.flare <= 0 || s.fired === ph.n) continue;
    const dx = p.x - (s.x + 0.5) * CELL, dy = p.y - (s.y + 0.5) * CELL, d = Math.hypot(dx, dy);
    if (d > VENT_R * CELL) continue;
    s.fired = ph.n;
    const ux = d > 1e-6 ? dx / d : Math.cos(p.angle), uy = d > 1e-6 ? dy / d : Math.sin(p.angle);
    p.vx += ux * HURT_KNOCKBACK; p.vy += uy * HURT_KNOCKBACK;
    game.heat = Math.min(1, game.heat + VENT_HEAT);
    if (game.heat >= 1 - 1e-9) overheat(game);
    game.addShake(4);
  }
}

/** Hexagon outlines (world transform) on explored vent cells in view + 3 cells: faint idle, brightening and pulsing in
 *  the tell (no pulse in reduced motion), then the flare disc. */
export function drawVents(r, ctx, left, top, vw, vh) {
  const g = r.game, v = g.vents, w = g.world;
  if (!v || v.off || g.endSeq || !v.sites.length) return;
  const m = 3, list = sitesIn(g, left / CELL - m, top / CELL - m, (left + vw) / CELL + m, (top + vh) / CELL + m);
  if (!list.length) return;
  const still = g.settings && g.settings.reducedMotion, t = g.stats.time;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round'; ctx.lineWidth = 1.6;
  ctx.strokeStyle = ctx.shadowColor = ctx.fillStyle = `rgb(${VENT_RGB})`;
  const hex = (x, y) => { const R = CELL * 0.38; for (let j = 0; j < 6; j++) { const a = Math.PI / 6 + j * Math.PI / 3; ctx[j ? 'lineTo' : 'moveTo'](x + Math.cos(a) * R, y + Math.sin(a) * R); } ctx.closePath(); };
  const live = [];
  ctx.globalAlpha = 0.3; ctx.beginPath(); // idle vents: one unblurred path (draw cost, bigworld.cjs)
  for (const i of list) {
    const s = v.sites[i];
    if (!w.explored[s.y * w.w + s.x]) continue;
    const ph = ventPhase(s, t);
    if (ph.tell > 0 || ph.flare > 0) live.push([s, ph]); else hex((s.x + 0.5) * CELL, (s.y + 0.5) * CELL);
  }
  ctx.stroke();
  ctx.shadowBlur = 12;
  for (const [s, ph] of live) {
    const x = (s.x + 0.5) * CELL, y = (s.y + 0.5) * CELL;
    const pulse = ph.tell > 0 && !still ? 0.5 + 0.5 * Math.sin(ph.u * Math.PI * 8) : 1;
    ctx.globalAlpha = ph.flare > 0 ? 0.95 : 0.45 + 0.5 * ph.tell * pulse; ctx.lineWidth = 1.6;
    ctx.beginPath(); hex(x, y); ctx.stroke();
    if (ph.flare > 0) {
      const k = ph.flare, rad = VENT_R * CELL * (still ? 1 : 0.6 + 0.4 * (1 - k));
      ctx.globalAlpha = 0.18 * k;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.7 * k; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  ctx.restore();
}
