// S-60a Crucible (D-158): the Kiln boss. A seed-only 9×9 lair (lairSite, drawn last from its own salt, so vents, Anomalies,
// vaults and the terrain hash of a plain World never move) is stamped into the Game's world after a save is applied: floor,
// a BOSS_CORE centre ringed by 8 BOSS_PLATEs. Take-apart (both modes until S-60b): one plate is lit (seeded start from
// rng 'crucible'); only it takes beam damage (world.hitMul × 0 on the rest, which spark grey); when it breaks the glow moves to
// (i + 5) mod 8, the plate opposite plus one step clockwise, so all 8 are visited once and you cross the body each time. The
// core takes damage once every plate is gone; its break bursts BOSS_LOOT and sets `down` (the only saved state: a reload
// mid-fight restores every plate). The core flares like a vent within BOSS_FLARE_R cells (shove + heat, no damage). A lair
// first stamped into an older save refunds what was placed in it and moves a core standing in it to the Nexus.
import { CELL, T, VAULT_HALF, VENT_PERIOD_S, VENT_HEAT, HURT_KNOCKBACK, VENT_HEAR_R, LAIR_HALF, LAIR_TRIES, LAIR_D, LAIR_CLEAR,
  BOSS_FLARE_R, BOSS_LOOT, BOSS_KEY_RGB, BOSS_NAMES, BOSS_ORE, PLAYER_R, SPAWN_OFFSET, BEACON_COST, RELAY_COST, HEATSINK_COST,
  WARD_COST } from './config.js';
import { seededStream, vaultSites, insideBorder } from './world.js';
import { chooseSpires, SPIRE_HALF } from './spire.js';
import { ventPhase } from './vent.js';
import { collides } from './body.js';
import { overheat } from './heat.js';

/** Plate offsets, clockwise on screen from north (y grows down): plate i is the cell at the core + PLATES[i]. */
export const PLATES = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
export const nextPlate = i => (i + 5) % 8;

/** Empty cells between the lair's footprint and a (2r + 1)² footprint centred on q (Chebyshev). */
const gapTo = (x, y, q, r) => Math.max(Math.abs(q.x - x), Math.abs(q.y - y)) - LAIR_HALF - r - 1;

/** The lair of `ring` in a World: { x, y, ring, t (draw) } or null. Seed-only: the rings, vaultSites, the save-less Spire
 *  choice and the given (seed-only) Anomaly and vent sites. Its own salt, so drawing it moves nothing else. */
export function lairSite(world, ring, anomalies = [], vents = []) {
  const { w, h, seed } = world, D = LAIR_D[ring], H = LAIR_HALF;
  if (!D || world.profile.rings <= ring) return null;
  const rand = seededStream(seed, 'lair-' + ring), vaults = vaultSites(seed, w, h), spires = chooseSpires(seed, null, null, w, h);
  for (let t = 0; t < LAIR_TRIES; t++) {
    const a = rand() * Math.PI * 2, d = D[0] + rand() * (D[1] - D[0]);
    const x = Math.floor(w / 2 + Math.cos(a) * d), y = Math.floor(h / 2 + Math.sin(a) * d);
    if (!insideBorder(x, y, H, w, h)) continue;
    let inRing = true;
    for (let j = -H; j <= H && inRing; j++) for (let i = -H; i <= H; i++) if (world.rings[(y + j) * w + x + i] !== ring) { inRing = false; break; }
    if (!inRing || vaults.some(v => gapTo(x, y, v, VAULT_HALF) < LAIR_CLEAR.vault)) continue;
    if ([...anomalies, ...vents].some(s => gapTo(x, y, s, 0) < LAIR_CLEAR.site)) continue;
    if (spires.some(s => gapTo(x, y, s, SPIRE_HALF) < LAIR_CLEAR.spire)) continue;
    return { x, y, ring, t };
  }
  return null;
}

/** Builds `game.bosses` (before a save is applied) and hooks the world's hit multiplier for boss cells. */
export function makeBosses(game) {
  const list = [];
  for (const ring of Object.keys(LAIR_D).map(Number)) {
    const s = lairSite(game.world, ring, game.anomaly.sites, game.vents.sites);
    if (s) list.push({ ...s, name: BOSS_NAMES[ring], down: false, lit: 0, phase: seededStream(game.world.seed, 'lair-flare-' + ring)() * VENT_PERIOD_S, fired: -1, told: -1 });
  }
  game.bosses = { list, flares: 0, refunds: 0 };
  if (!list.length) return;
  const w = game.world, prev = w.hitMul;
  w.hitMul = (x, y, type, dir) => type === T.BOSS_PLATE || type === T.BOSS_CORE ? bossMul(game, x, y, type) : prev ? prev(x, y, type, dir) : 1;
  w.listeners.push((x, y) => onBroken(game, x, y));
}

const inLair = (B, x, y) => Math.abs(x - B.x) <= LAIR_HALF && Math.abs(y - B.y) <= LAIR_HALF;
export const bossAt = (game, x, y) => (game.bosses ? game.bosses.list.find(B => inLair(B, x, y)) : null) || null;
export const plateIndex = (B, x, y) => PLATES.findIndex(([i, j]) => B.x + i === x && B.y + j === y);
export const platesLeft = (game, B) => PLATES.filter(([i, j]) => game.world.get(B.x + i, B.y + j) === T.BOSS_PLATE).length;

/** The beam multiplier on a boss cell: the lit plate × 1, other plates × 0; the core × 0 while a plate stands. */
export function bossMul(game, x, y, type) {
  const B = bossAt(game, x, y);
  if (!B || B.down) return 1;
  if (type === T.BOSS_CORE) return platesLeft(game, B) ? 0 : 1;
  return plateIndex(B, x, y) === B.lit ? 1 : 0;
}

/** After a save is applied (or for a new world): stamp each lair (`raw`: the save's `bosses`, [{ ring, down }]). A lair
 *  with no record in a save is new to it (an older format): what was placed in its footprint is refunded, and a core
 *  standing in it goes to the Nexus. Any core left inside a plate after the stamp goes to the Nexus too. */
export function stampBosses(game, raw, fromSave) {
  const recs = Array.isArray(raw) ? raw.filter(r => r && typeof r === 'object') : [], w = game.world, H = LAIR_HALF;
  for (const B of game.bosses.list) {
    const rec = recs.find(r => r.ring === B.ring);
    B.down = !!rec && rec.down === true;
    for (let j = -H; j <= H; j++) for (let i = -H; i <= H; i++) {
      const c = (B.y + j) * w.w + B.x + i, ring = Math.max(Math.abs(i), Math.abs(j));
      w.cells[c] = B.down || ring > 1 ? T.EMPTY : ring ? T.BOSS_PLATE : T.BOSS_CORE;
      w.damage[c] = 0;
      if (!B.down && ring <= 1) w.broken[c] = 0;
      w.markDirty(B.x + i, B.y + j);
    }
    B.lit = Math.floor(game.rng.crucible() * 8);
    const p = game.player;
    if (fromSave && !rec) {
      refund(game, B);
      if (inLair(B, Math.floor(p.x / CELL), Math.floor(p.y / CELL))) toNexus(game);
    }
  }
  if (game.bosses.list.length && collides(w, game.player.x, game.player.y, PLAYER_R)) toNexus(game);
}

function toNexus(game) { const p = game.player; p.x = game.nexus.x; p.y = game.nexus.y + SPAWN_OFFSET; p.vx = p.vy = 0; }

/** Placed things in a lair new to this save go back to the bank as their craft cost. */
function refund(game, B) {
  const w = game.world, rows = [[game.beacons, { prism: BEACON_COST }], [game.relays, RELAY_COST], [game.sinks, HEATSINK_COST], [game.wards, WARD_COST]];
  for (const [list, cost] of rows) for (let k = list.length - 1; k >= 0; k--) {
    const c = list[k].i;
    if (!inLair(B, c % w.w, Math.floor(c / w.w))) continue;
    list.splice(k, 1); game.bosses.refunds++;
    for (const [kind, n] of Object.entries(cost)) game.bank[kind] += n;
  }
}

/** World listener: a boss cell broke. The lit plate passes its glow on; the core's break downs the boss. */
function onBroken(game, x, y) {
  const B = bossAt(game, x, y), w = game.world;
  if (!B || B.down || w.get(x, y) !== T.EMPTY) return;
  if (x === B.x && y === B.y) { down(game, B); return; }
  const k = plateIndex(B, x, y);
  if (k < 0 || k !== B.lit) return;
  for (let n = nextPlate(k), s = 0; s < 8; n = nextPlate(n), s++) {
    const [i, j] = PLATES[n];
    if (w.get(B.x + i, B.y + j) === T.BOSS_PLATE) { B.lit = n; return; }
  }
}

function down(game, B) {
  B.down = true;
  const cx = (B.x + 0.5) * CELL, cy = (B.y + 0.5) * CELL;
  for (const [k, n] of Object.entries(BOSS_LOOT)) for (let i = 0; i < n; i++) game.spawnPickup(cx, cy, k === 'biome' ? BOSS_ORE[B.ring] : k, true);
  game.burst(cx, cy, 60, `rgb(${BOSS_KEY_RGB})`, 300);
  game.audio.cache();
  game.addShake(6);
  game.bossDown = B.name;
  game.notify('boss');
}

/** Once a frame, after the beam: the core's flare shoves + heats a core within BOSS_FLARE_R cells, once per cycle. */
export function updateBosses(game) {
  const bs = game.bosses, p = game.player;
  if (!bs || !bs.list.length || game.endSeq) return;
  for (const B of bs.list) {
    if (B.down) continue;
    const ph = ventPhase(B, game.stats.time), dx = p.x - (B.x + 0.5) * CELL, dy = p.y - (B.y + 0.5) * CELL, d = Math.hypot(dx, dy);
    if (ph.tell > 0 && B.told !== ph.n && d <= VENT_HEAR_R * CELL) { B.told = ph.n; game.audio.ventTell(); }
    if (ph.flare <= 0 || B.fired === ph.n || d > BOSS_FLARE_R * CELL) continue;
    B.fired = ph.n; bs.flares++;
    const ux = d > 1e-6 ? dx / d : Math.cos(p.angle), uy = d > 1e-6 ? dy / d : Math.sin(p.angle);
    p.vx += ux * HURT_KNOCKBACK; p.vy += uy * HURT_KNOCKBACK;
    game.heat = Math.min(1, game.heat + VENT_HEAT);
    if (game.heat >= 1 - 1e-9) overheat(game);
    game.addShake(4);
  }
}

const octagon = (ctx, x, y, R) => { for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; ctx[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * R, y + Math.sin(a) * R); } ctx.closePath(); };

/** World transform: a seen, live boss in view: the core's ember octagon (slow pulse; still in reduced motion; brighter in the
 *  flare tell), the lit plate's pulsing edge, and the flare disc. */
export function drawBosses(r, ctx, left, top, vw, vh) {
  const g = r.game, bs = g.bosses, w = g.world;
  if (!bs || !bs.list.length || g.endSeq) return;
  const still = g.settings && g.settings.reducedMotion;
  r.bossDrawn = 0;
  for (const B of bs.list) {
    const x0 = (B.x - LAIR_HALF) * CELL, y0 = (B.y - LAIR_HALF) * CELL, S = (2 * LAIR_HALF + 1) * CELL;
    if (B.down || x0 > left + vw || y0 > top + vh || x0 + S < left || y0 + S < top || !w.explored[B.y * w.w + B.x]) continue;
    const cx = (B.x + 0.5) * CELL, cy = (B.y + 0.5) * CELL, ph = ventPhase(B, g.stats.time), m = BOSS_FLARE_R * CELL + r.glowPad(12);
    const pulse = still ? 1 : 0.7 + 0.3 * Math.sin(r.time * 1.6);
    ctx.save();
    ctx.beginPath(); ctx.rect(cx - m, cy - m, m * 2, m * 2); ctx.clip(); // a blur in 'lighter' is clipped to its reach (B-091)
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = ctx.shadowColor = ctx.fillStyle = `rgb(${BOSS_KEY_RGB})`; ctx.shadowBlur = 12; ctx.lineJoin = 'round';
    ctx.lineWidth = 2; ctx.globalAlpha = Math.min(1, 0.55 * pulse + 0.4 * ph.tell + (ph.flare > 0 ? 0.4 : 0));
    ctx.beginPath(); octagon(ctx, cx, cy, CELL * 0.4); ctx.stroke();
    if (w.get(B.x + PLATES[B.lit][0], B.y + PLATES[B.lit][1]) === T.BOSS_PLATE) {
      const lp = still ? 1 : 0.6 + 0.4 * Math.sin(r.time * 5), px = (B.x + PLATES[B.lit][0]) * CELL, py = (B.y + PLATES[B.lit][1]) * CELL;
      ctx.globalAlpha = 0.9 * lp; ctx.lineWidth = 2.5;
      ctx.strokeRect(px + 3, py + 3, CELL - 6, CELL - 6);
      ctx.globalAlpha = 0.18 * lp; ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
    }
    if (ph.flare > 0) {
      const k = ph.flare, rad = BOSS_FLARE_R * CELL * (still ? 1 : 0.6 + 0.4 * (1 - k));
      ctx.globalAlpha = 0.16 * k; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.6 * k; ctx.stroke();
    }
    ctx.restore();
    r.bossDrawn++;
  }
}

/** Minimap: a hollow ember octagon at a seen lair, filled once the boss is down. */
export function drawBossMarks(m, g, sc) {
  const bs = g.bosses, w = g.world;
  if (!bs || !bs.list.length) return;
  m.save(); m.lineWidth = 1.25; m.strokeStyle = m.fillStyle = `rgb(${BOSS_KEY_RGB})`;
  for (const B of bs.list) {
    if (!w.explored[B.y * w.w + B.x]) continue;
    m.beginPath(); octagon(m, (B.x + 0.5) * CELL * sc, (B.y + 0.5) * CELL * sc, 4);
    if (B.down) m.fill(); else m.stroke();
  }
  m.restore();
}
