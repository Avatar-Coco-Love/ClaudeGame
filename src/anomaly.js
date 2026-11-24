// S-35 Anomalies (D-098, D-099): seed-only sites that grant a temporary buff (M7). A site is an entity, not a cell: the
// world layout never changes (D-024); it sits embedded in its rock until that cell is mined open. Taking one scales a Core
// Matrix stat (`game.stat()` asks `buffMul`) until the next deposit that banks ≥ 1 item (Nexus or Relay); not a death, not
// a mode switch, not a timer. A taken site recharges ANOMALY_RECHARGE_S of `stats.time` later.
// Saved: `anomalies` (site index -> recharge time, taken ones only) and `buffs` (active kind ids).
import { CELL, T, ANOMALY_COUNTS, ANOMALY_D, ANOMALY_GAP, ANOMALY_CLEAR, ANOMALY_TRIES, ANOMALY_TAKE, ANOMALY_RECHARGE_S,
  ANOMALY_KINDS, LIGHT_RADIUS } from './config.js';
import { seededStream, vaultSites } from './world.js';
import { chooseSpires, SPIRE_HALF } from './spire.js';

const VAULT_HALF = 3; // vault footprints are 7×7
const KIND_IDS = Object.keys(ANOMALY_KINDS); // overclock, lodestone, ballast

/** Sites for a freshly generated World (call before Spires are stamped or a save is applied): [{ x, y, ring, kind }] in
 *  draw order (Hearth, Veil, Deep). Depends on the seed alone: the generated terrain, vaultSites and the save-less Spire choice. */
export function anomalySites(world) {
  const { w, h, seed } = world, rand = seededStream(seed, 'anomaly'), kindRand = seededStream(seed, 'anomaly-kind'), cx = w / 2, cy = h / 2;
  const blocks = [...vaultSites(seed, w, h).map(v => ({ x: v.x, y: v.y, r: VAULT_HALF + ANOMALY_CLEAR })),
    ...chooseSpires(seed, null, null, w, h).map(s => ({ x: s.x, y: s.y, r: SPIRE_HALF + ANOMALY_CLEAR }))];
  const out = [];
  ANOMALY_COUNTS.forEach((count, ring) => {
    const [d0, d1] = ANOMALY_D[ring];
    for (let t = 0, n = 0; t < ANOMALY_TRIES && n < count; t++) {
      const a = rand() * Math.PI * 2, d = d0 + rand() * (d1 - d0);
      const x = Math.floor(cx + Math.cos(a) * d), y = Math.floor(cy + Math.sin(a) * d);
      if (x < 3 || y < 3 || x > w - 4 || y > h - 4) continue;
      const dc = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (dc < d0 || dc > d1 || world.ring(x, y) !== ring) continue;
      const c = world.cells[y * w + x];
      if (c !== T.ROCK && c !== T.DENSE) continue;
      if (blocks.some(b => Math.max(Math.abs(b.x - x), Math.abs(b.y - y)) <= b.r)) continue;
      if (out.some(s => Math.hypot(s.x - x, s.y - y) < ANOMALY_GAP)) continue;
      out.push({ x, y, ring, kind: KIND_IDS[Math.floor(kindRand() * KIND_IDS.length)] }); n++; // S-36: own salt, 1/3 each
    }
  });
  return out;
}

/** The live state: sites (a site inside this save's own Spire footprint is `void`, never shown or taken: only an old save
 *  whose Spires moved, D-024), taken (index -> recharge time) and the active buffs. */
export function makeAnomalies(world, spires) {
  const sites = anomalySites(world);
  for (const s of sites) s.void = spires.some(q => Math.max(Math.abs(q.x - s.x), Math.abs(q.y - s.y)) <= SPIRE_HALF);
  return { sites, taken: {}, flash: 0, near: false, taught: false };
}

/** A save's `anomalies` / `buffs`, cleaned (B-037: never trust a save). */
export function loadAnomalies(game, taken, buffs) {
  const a = game.anomaly;
  if (taken && typeof taken === 'object' && !Array.isArray(taken))
    for (const [k, t] of Object.entries(taken)) if (a.sites[k] && Number.isFinite(t)) a.taken[k] = t;
  game.buffs = Array.isArray(buffs) ? [...new Set(buffs.filter(id => ANOMALY_KINDS[id]))] : [];
}

/** Multiplier on Matrix stat `id` (or 'pull', the Attractor's pull) from the active buffs; different kinds stack. */
export function buffMul(game, id) {
  let m = 1;
  for (const b of game.buffs || []) m *= ANOMALY_KINDS[b].fx[id] || 1;
  return m;
}

export const siteCharged = (game, i) => !(i in game.anomaly.taken) && !game.anomaly.sites[i].void;
export const siteOpen = (game, s) => game.world.cells[s.y * game.world.w + s.x] === T.EMPTY;

/** Recharge, then take: the core's centre within ANOMALY_TAKE cells of an open, charged site whose kind isn't active. */
export function updateAnomalies(game, dt) {
  const a = game.anomaly, p = game.player, now = game.stats.time;
  a.flash = Math.max(0, a.flash - dt);
  for (const k of Object.keys(a.taken)) if (now >= a.taken[k]) delete a.taken[k];
  a.sites.forEach((s, i) => {
    if (!siteCharged(game, i) || game.buffs.includes(s.kind)) return;
    if (Math.hypot(p.x - (s.x + 0.5) * CELL, p.y - (s.y + 0.5) * CELL) > ANOMALY_TAKE * CELL || !siteOpen(game, s)) return;
    a.taken[i] = now + ANOMALY_RECHARGE_S;
    game.buffs.push(s.kind);
    game.lastBuff = s.kind;
    a.taught = true; // S-37: no more hint this session
    game.audio.anomaly();
    game.burst((s.x + 0.5) * CELL, (s.y + 0.5) * CELL, 36, `rgb(${ANOMALY_KINDS[s.kind].rgb})`, 240);
    game.anomalyRing = { x: (s.x + 0.5) * CELL, y: (s.y + 0.5) * CELL, t: 1, rgb: ANOMALY_KINDS[s.kind].rgb };
    game.notify('anomaly');
  });
  // S-37: the hint line teaches it while a charged site shows (inside the core's light), until the first take this session.
  a.near = !a.taught && a.sites.some((s, i) => siteCharged(game, i) && Math.hypot(p.x - (s.x + 0.5) * CELL, p.y - (s.y + 0.5) * CELL) <= LIGHT_RADIUS);
  if (game.anomalyRing) { game.anomalyRing.t -= dt * 1.6; if (game.anomalyRing.t <= 0) game.anomalyRing = null; }
}

/** Called once a deposit has banked everything (≥ 1 item): every buff ends. */
export function endBuffs(game) {
  if (!game.buffs.length) return;
  game.endedBuffs = game.buffs;
  game.buffs = [];
  game.audio.anomalyEnd(); // S-37
  game.notify('buffs-end');
}

/** S-37 minimap state of site i: null until its cell was ever lit (explored) or for a void site; 'charged' or 'recharging'. */
export function siteMapState(game, i) {
  const s = game.anomaly.sites[i], w = game.world;
  if (s.void || !w.explored[s.y * w.w + s.x]) return null;
  return siteCharged(game, i) ? 'charged' : 'recharging';
}

/** S-37: a seen site is a small dot in its kind's colour on the minimap; a recharging one is hollow. */
export function drawAnomalyMarks(m, g, sc) {
  m.save(); m.lineWidth = 1.25;
  g.anomaly.sites.forEach((s, i) => {
    const st = siteMapState(g, i);
    if (!st) return;
    const col = `rgb(${ANOMALY_KINDS[s.kind].rgb})`;
    m.beginPath(); m.arc((s.x + 0.5) * CELL * sc, (s.y + 0.5) * CELL * sc, 2.25, 0, Math.PI * 2);
    if (st === 'charged') { m.fillStyle = col; m.fill(); } else { m.strokeStyle = col; m.stroke(); }
  });
  m.restore();
}

/** S-37: Scanner marks for the charged sites within `radius` cells of (px, py), like vault caches (it reveals, unlocks nothing). */
export function anomalyScanMarks(game, px, py, radius) {
  const R = radius * CELL, out = [];
  game.anomaly.sites.forEach((s, i) => {
    if (!siteCharged(game, i)) return;
    const d = Math.hypot((s.x + 0.5) * CELL - px, (s.y + 0.5) * CELL - py);
    if (d <= R) out.push({ x: s.x, y: s.y, type: 'anomaly', kind: s.kind, site: i, d });
  });
  return out;
}

/** Hollow hexagrams (world transform): faint through rock inside the core's light, full once its cell is open. A taken
 *  (recharging) site isn't drawn. Reduced motion: no turning. Plus the take ring burst. */
export function drawAnomalies(r, ctx, left, top, vw, vh) {
  const g = r.game, p = g.player, still = g.settings && g.settings.reducedMotion;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round';
  g.anomaly.sites.forEach((s, i) => {
    if (!siteCharged(g, i)) return;
    const x = (s.x + 0.5) * CELL, y = (s.y + 0.5) * CELL;
    if (x < left - CELL || y < top - CELL || x > left + vw + CELL || y > top + vh + CELL) return;
    const open = siteOpen(g, s);
    if (!open && Math.hypot(x - p.x, y - p.y) > LIGHT_RADIUS) return;
    const k = ANOMALY_KINDS[s.kind], R = CELL * 0.42, rot = still ? 0 : r.time * 0.6;
    ctx.globalAlpha = open ? 0.95 : 0.28;
    ctx.strokeStyle = `rgb(${k.rgb})`; ctx.shadowColor = `rgb(${k.rgb})`; ctx.shadowBlur = open ? 14 : 4; ctx.lineWidth = 2;
    for (const off of [0, Math.PI]) {
      ctx.beginPath();
      for (let j = 0; j < 3; j++) { const a = rot + off - Math.PI / 2 + j * Math.PI * 2 / 3; ctx[j ? 'lineTo' : 'moveTo'](x + Math.cos(a) * R, y + Math.sin(a) * R); }
      ctx.closePath(); ctx.stroke();
    }
  });
  const ring = g.anomalyRing;
  if (ring) {
    ctx.globalAlpha = ring.t; ctx.strokeStyle = `rgb(${ring.rgb})`; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 16; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ring.x, ring.y, CELL * (0.5 + 2.5 * (1 - ring.t)), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
