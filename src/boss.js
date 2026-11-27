// S-60a Crucible (D-158): the Kiln boss. A seed-only 9×9 lair (lairSite, drawn last from its own salt, so vents, Anomalies,
// vaults and the terrain hash of a plain World never move) is stamped into the Game's world after a save is applied: floor,
// a BOSS_CORE centre ringed by 8 BOSS_PLATEs. Take-apart (both modes until S-60b): one plate is lit (seeded start from
// rng 'crucible'); only it takes beam damage (world.hitMul × 0 on the rest, which spark grey); when it breaks the glow moves to
// (i + 5) mod 8, the plate opposite plus one step clockwise, so all 8 are visited once and you cross the body each time. The
// core takes damage once every plate is gone; its break bursts BOSS_LOOT and sets `down` (the only saved state: a reload
// mid-fight restores every plate). The core flares like a vent within BOSS_FLARE_R cells (shove + heat, no damage). A lair
// first stamped into an older save refunds what was placed in it and moves a core standing in it to the Nexus.
// S-60b Surge form (D-165): in Surge, with the core within BOSS_WAKE_R cells, the boss is awake: any plate cuts, the flare
// cycles BOSS_SURGE_FLARE_S and hurts, embers (Spitter bolts, `ember`) fly at a core in sight. A death heals its core only.
// S-61a: the Shoal's Gyre shares all of this but the take-apart order, the flare and the look (gyre.js; list: Crucible first);
// its Surge form (S-61b) is swarms, the rim and an inward pull instead of the flare and embers.
import { CELL, T, VAULT_HALF, VENT_PERIOD_S, VENT_HEAT, HURT_KNOCKBACK, VENT_HEAR_R, LAIR_HALF, LAIR_TRIES, LAIR_D, LAIR_CLEAR,
  BOSS_FLARE_R, BOSS_LOOT, BOSS_KEY_RGB, BOSS_NAMES, BOSS_ORE, PLAYER_R, SPAWN_OFFSET, BEACON_COST, RELAY_COST, HEATSINK_COST,
  WARD_COST, DECOY_COST, BOSS_WAKE_R, BOSS_SURGE_FLARE_S, BOSS_FLARE_DMG, BOSS_EMBER_S, BOSS_EMBER_R, BOSS_EMBER_OUT, BOLT_SPEED, BOLT_R, BOLT_HP,
  BOLT_LIFE_S, GYRE_RING, GYRE_STEP_S, GYRE_SWARM_S, BOSS_WAKES, BOSS_RGB, BOSS_CHART_ALPHA } from './config.js';
import { stepGyre, surgeGyre, gyreKeyBroke, drawGyre } from './gyre.js';
import { World, seededStream, vaultSites, insideBorder } from './world.js';
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
  for (const ring of Object.keys(LAIR_D).map(Number).sort((a, b) => b - a)) { // the Crucible (S-60) stays boss 0
    const s = lairSite(game.world, ring, game.anomaly.sites, game.vents.sites);
    if (s) list.push({ ...s, name: BOSS_NAMES[ring], down: false, lit: 0, phase: seededStream(game.world.seed, 'lair-flare-' + ring)() * VENT_PERIOD_S, fired: -1, told: -1, ember: BOSS_EMBER_S, awake: false, step: GYRE_STEP_S, swarmT: 0, touch: 0 });
  }
  game.bosses = { list, flares: 0, refunds: 0, burns: 0, embers: 0, steps: 0, rims: 0 };
  if (!list.length) return;
  const w = game.world, prev = w.hitMul;
  w.hitMul = (x, y, type, dir) => type === T.BOSS_PLATE || type === T.BOSS_CORE ? bossMul(game, x, y, type) : prev ? prev(x, y, type, dir) : 1;
  w.listeners.push((x, y) => onBroken(game, x, y));
}

const inLair = (B, x, y) => Math.abs(x - B.x) <= LAIR_HALF && Math.abs(y - B.y) <= LAIR_HALF;
export const bossAt = (game, x, y) => (game.bosses ? game.bosses.list.find(B => inLair(B, x, y)) : null) || null;
export const plateIndex = (B, x, y) => PLATES.findIndex(([i, j]) => B.x + i === x && B.y + j === y);
export const platesLeft = (game, B) => PLATES.filter(([i, j]) => game.world.get(B.x + i, B.y + j) === T.BOSS_PLATE).length;

/** S-60b: awake = Surge, live, and the core within BOSS_WAKE_R cells of the boss core (follows a mode switch at once). */
export function bossAwake(game, B) {
  if (game.mode !== 'surge' || B.down || game.endSeq || !BOSS_WAKES.includes(B.ring)) return false;
  const p = game.player;
  return Math.hypot(p.x - (B.x + 0.5) * CELL, p.y - (B.y + 0.5) * CELL) <= BOSS_WAKE_R * CELL;
}
const bossPhase = (game, B) => ventPhase(B, game.stats.time, bossAwake(game, B) ? BOSS_SURGE_FLARE_S : VENT_PERIOD_S);

/** The beam multiplier on a boss cell: the lit plate × 1, other plates × 0 (× 1 while awake); the core × 0 while a plate stands. */
export function bossMul(game, x, y, type) {
  const B = bossAt(game, x, y);
  if (!B || B.down) return 1;
  if (type === T.BOSS_CORE) return platesLeft(game, B) ? 0 : 1;
  return bossAwake(game, B) || plateIndex(B, x, y) === B.lit ? 1 : 0;
}

/** S-60b: a core death (any mode) heals each live boss's core to full; broken plates stay broken (no grind, no free kill). */
export function healBosses(game) {
  const bs = game.bosses, w = game.world;
  if (!bs) return;
  for (const B of bs.list) if (!B.down) { w.damage[B.y * w.w + B.x] = 0; w.markDirty(B.x, B.y); B.ember = BOSS_EMBER_S; B.swarmT = GYRE_SWARM_S; }
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
    B.lit = Math.floor(game.rng[B.ring === GYRE_RING ? 'gyre' : 'crucible']() * 8); B.step = GYRE_STEP_S;
    const p = game.player;
    if (fromSave && !rec) {
      refund(game, B);
      if (inLair(B, Math.floor(p.x / CELL), Math.floor(p.y / CELL))) toNexus(game);
    }
  }
  if (game.bosses.list.length && collides(w, game.player.x, game.player.y, PLAYER_R)) toNexus(game);
}

/** Tools only (surgebot `boss: 'off'`, like rifts and weather): the lairs go back to generated terrain and the bosses are
 *  gone, so a bot gate measured before S-60a keeps its numbers. */
export function clearBosses(game) {
  const w = game.world, gen = new World(w.seed, game.vaultSkip, w.w), H = LAIR_HALF;
  for (const B of game.bosses.list) for (let j = -H; j <= H; j++) for (let i = -H; i <= H; i++) {
    const c = (B.y + j) * w.w + B.x + i;
    w.cells[c] = gen.cells[c]; w.damage[c] = 0; w.broken[c] = 0; w.markDirty(B.x + i, B.y + j);
  }
  game.bosses.list.length = 0;
}

function toNexus(game) { const p = game.player; p.x = game.nexus.x; p.y = game.nexus.y + SPAWN_OFFSET; p.vx = p.vy = 0; }

/** Placed things in a lair new to this save go back to the bank as their craft cost. */
function refund(game, B) {
  const w = game.world, rows = [[game.beacons, { prism: BEACON_COST }], [game.relays, RELAY_COST], [game.sinks, HEATSINK_COST], [game.wards, WARD_COST], [game.decoys, DECOY_COST]]; // B-113: Decoys too (S-77a)
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
  if (k >= 0 && !bossAwake(game, B) && platesLeft(game, B) === 7) game.audio.bossSting(); // S-62: the first plate (asleep)
  if (k < 0 || k !== B.lit) return; // S-60b: an awake boss's other plates break without moving the glow
  if (B.ring === GYRE_RING) { gyreKeyBroke(game, B, k); return; } // S-61a: the key passes on clockwise
  for (let n = nextPlate(k), s = 0; s < 8; n = nextPlate(n), s++) {
    const [i, j] = PLATES[n];
    if (w.get(B.x + i, B.y + j) === T.BOSS_PLATE) { B.lit = n; return; }
  }
}

function down(game, B) {
  B.down = true;
  const cx = (B.x + 0.5) * CELL, cy = (B.y + 0.5) * CELL;
  for (const [k, n] of Object.entries(BOSS_LOOT)) for (let i = 0; i < n; i++) game.spawnPickup(cx, cy, k === 'biome' ? BOSS_ORE[B.ring] : k, true);
  game.burst(cx, cy, 60, `rgb(${BOSS_RGB[B.ring]})`, 300);
  game.audio.cache();
  game.addShake(6);
  game.bossDown = B.name;
  game.notify('boss');
}

/** Once a frame, after the beam: the core's flare shoves + heats a core within BOSS_FLARE_R cells, once per cycle; awake
 *  (S-60b) it also hurts, and embers fly. `game.bossAwake` (any boss awake) keeps weather and rifts from starting. */
export function updateBosses(game, dt = 0) {
  const bs = game.bosses, p = game.player;
  game.bossAwake = false;
  if (!bs || !bs.list.length || game.endSeq) return;
  for (const B of bs.list) {
    if (B.down) continue;
    const woke = bossAwake(game, B); // S-62: a low sting each time a boss wakes (unsaved, so a load beside one stings too)
    if (woke && !B.woke) game.audio.bossSting();
    B.woke = woke;
    if (B.ring === GYRE_RING) { stepGyre(game, B, dt); surgeGyre(game, B, dt); continue; } // S-61a: no flare; the key steps (S-61b: Surge form)
    const awake = bossAwake(game, B), ph = bossPhase(game, B), key = (awake ? 's' : 'd') + ph.n;
    const dx = p.x - (B.x + 0.5) * CELL, dy = p.y - (B.y + 0.5) * CELL, d = Math.hypot(dx, dy);
    if (awake !== B.awake) { B.awake = awake; B.ember = BOSS_EMBER_S; }
    if (awake) { game.bossAwake = true; emberStep(game, B, dx, dy, d, dt); }
    if (ph.tell > 0 && B.told !== key && d <= VENT_HEAR_R * CELL) { B.told = key; game.audio.ventTell(); }
    if (ph.flare <= 0 || B.fired === key || d > BOSS_FLARE_R * CELL) continue;
    B.fired = key; bs.flares++;
    const ux = d > 1e-6 ? dx / d : Math.cos(p.angle), uy = d > 1e-6 ? dy / d : Math.sin(p.angle);
    p.vx += ux * HURT_KNOCKBACK; p.vy += uy * HURT_KNOCKBACK;
    game.heat = Math.min(1, game.heat + VENT_HEAT);
    if (game.heat >= 1 - 1e-9) overheat(game);
    game.addShake(4);
    if (awake) { game.audio.bossThump(); if (p.invuln <= 0) { bs.burns++; game.hurtPlayer(BOSS_FLARE_DMG, 0, 0); } } // the shove above is the knockback
  }
}

/** S-60b: an awake boss's ember clock runs while the core is in sight within BOSS_EMBER_R cells; each BOSS_EMBER_S it lobs a
 *  Spitter bolt from BOSS_EMBER_OUT cells out (past its own plates, so its body never stops it). Rock stops it, the beam pops it. */
function emberStep(game, B, dx, dy, d, dt) {
  const out = BOSS_EMBER_OUT * CELL, p = game.player;
  if (d > BOSS_EMBER_R * CELL || d <= out + p.r) { B.ember = Math.max(B.ember, 0.4); return; }
  const ux = dx / d, uy = dy / d, sx = (B.x + 0.5) * CELL + ux * out, sy = (B.y + 0.5) * CELL + uy * out;
  if (game.world.raycast(sx, sy, ux, uy, d - out - p.r)) { B.ember = Math.max(B.ember, 0.4); return; }
  if ((B.ember -= dt) > 0) return;
  B.ember = BOSS_EMBER_S; game.bosses.embers++;
  game.bolts.push({ bolt: true, ember: true, x: sx, y: sy, vx: ux * BOLT_SPEED, vy: uy * BOLT_SPEED, r: BOLT_R, hp: BOLT_HP, flash: 0, life: BOLT_LIFE_S });
  game.audio.ember();
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
    const x0 = (B.x - LAIR_HALF - 2) * CELL, y0 = (B.y - LAIR_HALF - 2) * CELL, S = (2 * LAIR_HALF + 5) * CELL; // + the whirlpool
    if (B.down || x0 > left + vw || y0 > top + vh || x0 + S < left || y0 + S < top || !w.explored[B.y * w.w + B.x]) continue;
    if (B.ring === GYRE_RING) { drawGyre(r, ctx, B, still); r.bossDrawn++; continue; }
    const cx = (B.x + 0.5) * CELL, cy = (B.y + 0.5) * CELL, ph = bossPhase(g, B), m = BOSS_FLARE_R * CELL + r.glowPad(12);
    const pulse = still ? 1 : 0.7 + 0.3 * Math.sin(r.time * 1.6);
    ctx.save();
    ctx.beginPath(); ctx.rect(cx - m, cy - m, m * 2, m * 2); ctx.clip(); // a blur in 'lighter' is clipped to its reach (B-091)
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = ctx.shadowColor = ctx.fillStyle = `rgb(${BOSS_KEY_RGB})`; ctx.shadowBlur = 12; ctx.lineJoin = 'round';
    ctx.lineWidth = 2; ctx.globalAlpha = Math.min(1, 0.55 * pulse + 0.4 * ph.tell + (ph.flare > 0 ? 0.4 : 0));
    ctx.beginPath(); octagon(ctx, cx, cy, CELL * 0.4); ctx.stroke();
    const lp = still ? 1 : 0.6 + 0.4 * Math.sin(r.time * 5);
    PLATES.forEach(([i, j], k) => { // the lit plate; awake (S-60b) every standing plate cuts, so all glow, softer
      if ((!B.awake && k !== B.lit) || w.get(B.x + i, B.y + j) !== T.BOSS_PLATE) return;
      const px = (B.x + i) * CELL, py = (B.y + j) * CELL, a = B.awake ? 0.6 : 1;
      ctx.globalAlpha = 0.9 * lp * a; ctx.lineWidth = 2.5;
      ctx.strokeRect(px + 3, py + 3, CELL - 6, CELL - 6);
      ctx.globalAlpha = 0.35 * lp * a; ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6); // D-164: the fill tints too, so a still frame reads
    });
    if (ph.flare > 0) {
      const k = ph.flare, rad = BOSS_FLARE_R * CELL * (still ? 1 : 0.6 + 0.4 * (1 - k));
      ctx.globalAlpha = 0.16 * k; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.6 * k; ctx.stroke();
    }
    ctx.restore();
    r.bossDrawn++;
  }
}

/** Minimap: a hollow octagon in the boss's colour at a seen lair, filled once the boss is down. S-62: the Chart's level 2
 *  also draws each unseen lair, faint (`g.chartLairs` counts them for tests). */
export function drawBossMarks(m, g, sc, note) {
  const bs = g.bosses, w = g.world;
  g.chartLairs = 0;
  if (!bs || !bs.list.length) return;
  const charted = (g.nexusLevels.chart || 0) >= 2 && !g.endSeq;
  m.save(); m.lineWidth = 1.25;
  for (const B of bs.list) {
    const seen = w.explored[B.y * w.w + B.x];
    if (!seen && !charted) continue;
    m.strokeStyle = m.fillStyle = `rgb(${BOSS_RGB[B.ring]})`;
    m.globalAlpha = seen ? 1 : BOSS_CHART_ALPHA;
    if (!seen) g.chartLairs++;
    if (note) note('lair', (B.x + 0.5) * CELL, (B.y + 0.5) * CELL, m.strokeStyle); // S-76 legend
    m.beginPath(); octagon(m, (B.x + 0.5) * CELL * sc, (B.y + 0.5) * CELL * sc, 4);
    if (B.down && seen) m.fill(); else m.stroke();
  }
  m.restore();
}
