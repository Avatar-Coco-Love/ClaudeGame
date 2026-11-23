// Beam modes (S-13, D-036). `game.beamMode` is the intent (which way to cast); `beam.rays[]` is what each ray realized this
// frame ({ ox, oy, ex, ey, target, enemy }). `beam.ex/ey/target/enemy` stay the centre ray's, so the darkness, crack overlay
// and older checks keep working. Every mode scales from the Core Matrix Beam Power and Range stats; none adds a stat.
import { T, BEAM_MODES } from './config.js';

const NOSE = 12; // px from the core's centre to its nose; rays are cast from the centre so the wall at the nose is hit first

/** Modes this game can use now, in Q / ⟂ cycle order. Focus is always there; the rest need their Research node. */
export function unlockedModes(game) { return Object.keys(BEAM_MODES).filter(m => !BEAM_MODES[m].research || game.research[BEAM_MODES[m].research]); }

/** Realize a switch request: the next unlocked mode. Returns the new mode, or null when there is nothing to switch to. */
export function cycleBeamMode(game) {
  const modes = unlockedModes(game);
  if (modes.length < 2) return null;
  game.beamMode = modes[(modes.indexOf(game.beamMode) + 1) % modes.length];
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
    for (const e of game.enemies) { // Glitches along the ray, if closer than the wall
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
    e.hp -= dps * dt * 1.6; e.flash = 0.08;
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
      const col = game.world.look(hit.x, hit.y, res ? res.type : T.ROCK).edge, r = rays[0];
      game.particle(r.ex, r.ey, (-dx + (Math.random() - 0.5) * 1.6) * 110, (-dy + (Math.random() - 0.5) * 1.6) * 110, 0.35, col, 2);
    }
    if (res && res.broken) game.onCellBroken(hit.x, hit.y, res.type);
  }
  const mid = b.rays[mode.offsets.indexOf(0)];
  b.ex = mid.ex; b.ey = mid.ey; b.target = mid.target;
  b.enemy = mid.enemy || (b.rays.find(r => r.enemy) || {}).enemy || null;
}
