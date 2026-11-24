// Beam modes (S-13, D-036). `game.beamMode` is the intent (which way to cast); `beam.rays[]` is what each ray realized this
// frame ({ ox, oy, ex, ey, target, enemy }). `beam.ex/ey/target/enemy` stay the centre ray's, so the darkness, crack overlay
// and older checks keep working. Every mode scales from the Core Matrix Beam Power and Range stats; none adds a stat.
import { T, BEAM_MODES, PULSE_CHARGE_S, PULSE_RANGE, PULSE_MIN, PULSE_MUL, PULSE_PIERCE, PULSE_GLITCH, PULSE_RECOVER_S,
  PULSE_FLASH_S, BEAM_GLITCH_MUL } from './config.js';
import { UNBREAKABLE } from './world.js';
import { facetAt, toggleFacet } from './spire.js';
import { beamFoes } from './spitter.js';

const NOSE = 12; // px from the core's centre to its nose; rays are cast from the centre so the wall at the nose is hit first

/** Modes this game can use now, in Q / ⟂ cycle order. Focus is always there; the rest need their Research node. */
export function unlockedModes(game) { return Object.keys(BEAM_MODES).filter(m => !BEAM_MODES[m].research || game.research[BEAM_MODES[m].research]); }

/** Realize a switch request: the next unlocked mode. Returns the new mode, or null when there is nothing to switch to. */
export function cycleBeamMode(game) {
  const modes = unlockedModes(game);
  if (modes.length < 2) return null;
  game.beamMode = modes[(modes.indexOf(game.beamMode) + 1) % modes.length];
  game.beam.charge = 0; // S-14: switching away drops a Pulse charge unfired
  game.audio.modeSwitch();
  return game.beamMode;
}

/** A saved mode that is not unlocked (or unknown) loads as Focus. */
export function validMode(game, m) { return unlockedModes(game).includes(m) ? m : 'focus'; }

export function castBeam(game, dt) {
  const p = game.player, b = game.beam, mode = BEAM_MODES[game.beamMode] || BEAM_MODES.focus;
  const range = game.stat('range') * mode.range, dps = game.stat('beam') * mode.dmg;
  const dx = Math.cos(p.angle), dy = Math.sin(p.angle), nx = -dy, ny = dx;
  const cells = new Map(), foes = new Set();
  b.rays = mode.offsets.map(o => {
    const cx = p.x + nx * o, cy = p.y + ny * o, ox = cx + dx * NOSE, oy = cy + dy * NOSE;
    const hit0 = game.world.raycast(cx, cy, dx, dy, range + NOSE);
    const hit = hit0 && { ...hit0, dist: Math.max(0, hit0.dist - NOSE) };
    let dist = hit ? hit.dist : range, best = null;
    for (const e of beamFoes(game)) { // Glitches (and S-32 bolts) along the ray, if closer than the wall
      if (e.fade !== undefined) continue; // a Glitch that gave up can't be targeted (S-6)
      const ex = e.x - ox, ey = e.y - oy, t = ex * dx + ey * dy;
      if (t < 0 || t > dist) continue;
      if (Math.abs(ex * dy - ey * dx) < e.r + 4 && (!best || t < best.t)) best = { e, t };
    }
    const ray = { ox, oy, ex: 0, ey: 0, target: null, enemy: null };
    if (best) { dist = best.t; ray.enemy = best.e; foes.add(best.e); }
    else if (hit) { const k = hit.y * game.world.w + hit.x; if (!cells.has(k)) cells.set(k, { hit, rays: [] }); cells.get(k).rays.push(ray); }
    ray.ex = ox + dx * dist; ray.ey = oy + dy * dist;
    return ray;
  });
  // Damage is applied once per Glitch and once per cell per frame, however many rays touch it.
  for (const e of foes) {
    e.hp -= dps * dt * BEAM_GLITCH_MUL; e.flash = 0.08;
    if (Math.random() < dt * 40) {
      const r = b.rays.find(q => q.enemy === e);
      game.particle(r.ex, r.ey, (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160, 0.3, '#ff7a3d', 2);
    }
  }
  for (const { hit, rays } of cells.values()) {
    const res = game.world.hit(hit.x, hit.y, dps * dt);
    const target = { x: hit.x, y: hit.y, frac: res && !res.broken ? res.frac : 0 };
    for (const r of rays) r.target = target;
    if (Math.random() < dt * 45) {
      const ty = res ? res.type : game.world.get(hit.x, hit.y); // C2: an unbreakable cell (Spire core, facet) sparks its own colour
      const col = game.world.look(hit.x, hit.y, ty === T.EMPTY ? T.ROCK : ty).edge, r = rays[0];
      game.particle(r.ex, r.ey, (-dx + (Math.random() - 0.5) * 1.6) * 110, (-dy + (Math.random() - 0.5) * 1.6) * 110, 0.35, col, 2);
    }
    if (res && res.broken) game.onCellBroken(hit.x, hit.y, res.type);
  }
  const mid = b.rays[mode.offsets.indexOf(0)];
  b.ex = mid.ex; b.ey = mid.ey; b.target = mid.target; b.midEnemy = !!mid.enemy; // B-044: the facet latch reads it
  b.enemy = mid.enemy || (b.rays.find(r => r.enemy) || {}).enemy || null;
}

// ---------- Pulse (S-14, D-042) ----------
// Intent: `held` fire. Realized: `beam.charge` (0..1) while charging, then one burst on release (or, held at full charge, as
// soon as a Glitch or wall is in reach: S-21's ready shot),
// then `beam.recover` seconds before charging can start again. `cancel` (pause / open sheet / death) drops the charge unfired.
export function updatePulse(game, dt, held, cancel = false) {
  const b = game.beam;
  b.recover = Math.max(0, b.recover - dt);
  if (cancel) { b.charge = 0; b.facetLatch = null; return; }
  if (held) {
    // B-043 (D-083): a burst that toggled a facet latches it; the latch holds while the held aim still rests on that facet.
    if (b.facetLatch && !aimsAtFacet(game, b.facetLatch)) b.facetLatch = null;
    if (b.recover > 1e-9) return; // held fire waits out the recovery, then charges again
    b.charge = Math.min(1, b.charge + dt / PULSE_CHARGE_S);
    // S-21 ready shot (D-054): a full charge held fires only once something is in its reach; until then it waits at 1.
    if (b.charge >= 1 - 1e-9 && pulseInReach(game)) releasePulse(game);
  } else {
    // Letting go ends the aim, so the next press may toggle again; a charge let go on the facet it already toggled (nothing
    // else in reach) is dropped unfired, else it would flip that facet back (B-043).
    if (b.charge > 0) {
      if (b.facetLatch && aimsAtFacet(game, b.facetLatch) && !pulseInReach(game)) b.charge = 0; else releasePulse(game);
    }
    b.facetLatch = null;
  }
}

/** The aim ray's first cell (within Pulse reach) is facet `f` = { s, k }. */
function aimsAtFacet(game, f) {
  const p = game.player, dx = Math.cos(p.angle), dy = Math.sin(p.angle);
  const h = game.world.raycast(p.x, p.y, dx, dy, game.stat('range') * PULSE_RANGE + NOSE), g = h && facetAt(game, h.x, h.y);
  return !!g && g.s === f.s && g.k === f.k;
}

/** The nearest live Glitch on the aim ray within `range` of the nose: { e, t } or null. */
function pulseFoe(game, ox, oy, dx, dy, range) {
  let foe = null;
  for (const e of beamFoes(game)) {
    if (e.fade !== undefined) continue;
    const ex = e.x - ox, ey = e.y - oy, t = ex * dx + ey * dy;
    if (t < 0 || t > range || Math.abs(ex * dy - ey * dx) >= e.r + 4) continue;
    if (!foe || t < foe.t) foe = { e, t };
  }
  return foe;
}

/** S-21: would a burst now hit something, a live Glitch on the ray or a breakable cell, within the Pulse reach?
 *  Bedrock, a Spire core or facet (and the map's edge) never counts: a burst there does nothing, so a full charge keeps waiting
 *  (B-036). A primed Spire's facet does count: a burst toggles it (S-28), once per aim (B-043: not the latched facet). */
export function pulseInReach(game) {
  const p = game.player, w = game.world, dx = Math.cos(p.angle), dy = Math.sin(p.angle), range = game.stat('range') * PULSE_RANGE;
  if (pulseFoe(game, p.x + dx * NOSE, p.y + dy * NOSE, dx, dy, range)) return true;
  const h = w.raycast(p.x, p.y, dx, dy, range + NOSE);
  if (!h) return false;
  if (!UNBREAKABLE.has(w.get(h.x, h.y))) return true;
  const f = facetAt(game, h.x, h.y), L = game.beam.facetLatch;
  return !!f && !(L && L.s === f.s && L.k === f.k);
}

/** Fire (or fizzle) the current charge. Returns what it did: { cells broken, damage dealt, enemy } or null for a fizzle. */
export function releasePulse(game) {
  const b = game.beam, charge = b.charge;
  b.charge = 0; b.recover = PULSE_RECOVER_S;
  if (charge < PULSE_MIN) { game.audio.pulseFizzle(); return null; }
  const p = game.player, w = game.world, dx = Math.cos(p.angle), dy = Math.sin(p.angle);
  const ox = p.x + dx * NOSE, oy = p.y + dy * NOSE, range = game.stat('range') * PULSE_RANGE;
  let amount = game.stat('beam') * PULSE_CHARGE_S * charge * PULSE_MUL, foe = pulseFoe(game, ox, oy, dx, dy, range);
  let end = foe ? foe.t : range, cells = 0, broken = 0, hitFoe = null;
  while (amount > 1e-9 && cells < PULSE_PIERCE) {
    const h = w.raycast(p.x, p.y, dx, dy, end + NOSE);
    if (!h) break;
    const dist = Math.max(0, h.dist - NOSE), type = w.get(h.x, h.y), i = h.y * w.w + h.x;
    const left = w.hpAt(h.x, h.y, type) - w.damage[i];
    const res = w.hit(h.x, h.y, amount);
    cells++;
    if (!res || !res.broken) { // unbreakable, or cracked but standing: the burst ends on its face
      end = dist; foe = null; amount = 0;
      const f = !res && facetAt(game, h.x, h.y); // S-28 (D-080): a burst that stops on a primed facet toggles it once
      if (f) { toggleFacet(game, f.s, f.k); b.facetLatch = f; } // B-043: one toggle per aim
      if (res) for (let k = 0; k < 8; k++) game.particle(ox + dx * dist, oy + dy * dist, (-dx + (Math.random() - 0.5) * 1.6) * 130, (-dy + (Math.random() - 0.5) * 1.6) * 130, 0.35, w.look(h.x, h.y, type).edge, 2);
      break;
    }
    amount -= left; broken++;
    game.onCellBroken(h.x, h.y, res.type);
    if (cells >= PULSE_PIERCE) { end = dist + 16; foe = null; } // the cap: the burst stops in the last cell it broke
  }
  if (foe && amount > 1e-9) { foe.e.hp -= amount * PULSE_GLITCH; foe.e.flash = 0.15; hitFoe = foe.e; }
  b.flash = b.flashMax = game.motionOn() ? PULSE_FLASH_S : PULSE_FLASH_S / 2;
  b.flashLine = { ox, oy, ex: ox + dx * end, ey: oy + dy * end, enemy: !!hitFoe };
  game.audio.pulse(charge);
  return { cells, broken, enemy: hitFoe };
}
