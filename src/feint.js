// S-78a (M19, D-224, D-225): the Feint, a Tracer that reads your beam. From the Deep out it takes the second Tracer slot
// (hunter.js spawns and walks it as `hunter: 'feint'`; touch, flee, lure, give-up and death are the Tracer's). Each frame
// it walks the field, not fleeing, not lured, off cooldown, it looks at the beam (intent: `beam.rays`, or a charging
// Pulse's aim line); one passing within FEINT_READ cells of its centre starts a white chevron tell on the open side
// perpendicular to that ray, then it dashes that way (realized: body collision as ever). A 1-wide tunnel has no open side:
// it keeps coming, and the beam kills it. It reads the core, not the mode: Drift and Surge get the same Feint (D-002).
// `rng.feint` picks the side only when both are open. Never saved.
import { CELL, GLITCH_R, GLITCH_FADE_S, FEINT_READ, FEINT_TELL_S, FEINT_DASH_S, FEINT_CD_S, FEINT_RGB, PULSE_RANGE, RESOURCE } from './config.js';

const NOSE = 12; // beam.js: rays start this far out from the core's centre

/** The Feint's beam-read state, made on first use. */
const state = e => e.feint || (e.feint = { tell: 0, dash: 0, cd: 0, nx: 0, ny: 0 });

/** A lured (or fleeing) Feint drops a tell or dash in progress; the cooldown stays. */
export function feintCalm(e) { if (e.feint) { e.feint.tell = 0; e.feint.dash = 0; } }

/** The rays the Feint can read this frame: the realized beam's, or a charging Pulse's aim line (clipped at the wall). */
function lines(game) {
  const b = game.beam, out = b.rays && b.rays.length ? b.rays.map(r => [r.ox, r.oy, r.ex, r.ey]) : [];
  if (!out.length && game.beamMode === 'pulse' && b.charge > 0) {
    const p = game.player, dx = Math.cos(p.angle), dy = Math.sin(p.angle), range = game.stat('range') * PULSE_RANGE;
    const hit = game.world.raycast(p.x, p.y, dx, dy, range + NOSE), len = hit ? Math.max(0, hit.dist - NOSE) : range;
    out.push([p.x + dx * NOSE, p.y + dy * NOSE, p.x + dx * (NOSE + len), p.y + dy * (NOSE + len)]);
  }
  return out;
}

/** The first line passing within FEINT_READ cells of the Feint, ≤ its length + 1 cell from its origin: [ux, uy] or null. */
export function readBeam(game, e) {
  for (const [ox, oy, ex, ey] of lines(game)) {
    const lx = ex - ox, ly = ey - oy, len = Math.hypot(lx, ly);
    if (len < 1e-6) continue;
    const ux = lx / len, uy = ly / len, rx = e.x - ox, ry = e.y - oy, t = rx * ux + ry * uy;
    if (t < 0 || t > len + CELL) continue;
    if (Math.abs(rx * uy - ry * ux) <= FEINT_READ * CELL) return [ux, uy];
  }
  return null;
}

/** The open side perpendicular to the ray: [nx, ny] (unit) or null when neither neighbour cell is open. */
function side(game, e, ux, uy) {
  const nx = -uy, ny = ux, cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
  const sx = Math.round(nx), sy = Math.round(ny), w = game.world;
  const a = !w.solid(cx + sx, cy + sy), b = !w.solid(cx - sx, cy - sy);
  if (!a && !b) return null;
  const k = a && b ? (game.rng.feint() < 0.5 ? 1 : -1) : a ? 1 : -1;
  return [nx * k, ny * k];
}

/** Once a frame while it walks the field (hunter.js). Returns the dash direction [x, y] (unit) while dashing, else null. */
export function feintStep(game, e, dt) {
  const s = state(e), h = game.hunt;
  if (s.dash > 0) {
    if ((s.dash -= dt) > 0) return [s.nx, s.ny];
    s.dash = 0; s.cd = FEINT_CD_S; return null;
  }
  if (s.tell > 0) {
    if ((s.tell -= dt) > 0) return null;
    s.tell = 0; s.dash = FEINT_DASH_S; h.dashes++; return [s.nx, s.ny];
  }
  if (s.cd > 0) { s.cd = Math.max(0, s.cd - dt); return null; }
  const u = readBeam(game, e);
  if (!u) return null;
  const n = side(game, e, u[0], u[1]);
  if (!n) { h.pinned++; return null; } // a tunnel: nowhere to go, it keeps coming
  s.nx = n[0]; s.ny = n[1]; s.tell = FEINT_TELL_S; h.reads++;
  return null;
}

// ---------- drawing (hunter.js drawHunters) ----------
/** A Feint: an electric-violet diamond outline (Glitch size, cached glow sprite, D-051), not the Tracer's arrow. */
function feintSprite(R, white) {
  const r = GLITCH_R;
  return R.glowSprite(`fe-${white ? 1 : 0}`, r * 1.4 + 2 + 18 / (R.zoom * R.dpr), g => {
    g.shadowBlur = 14; g.lineWidth = 2.5; g.lineJoin = 'round';
    g.strokeStyle = g.fillStyle = g.shadowColor = white ? '#ffffff' : `rgb(${FEINT_RGB})`;
    g.beginPath(); g.moveTo(r * 1.3, 0); g.lineTo(0, r * 0.8); g.lineTo(-r * 1.1, 0); g.lineTo(0, -r * 0.8); g.closePath();
    g.stroke(); g.globalAlpha = 0.15; g.fill();
  });
}

/** Every Feint, over the darkness; the white tell chevron on its dash side (off with reduced motion: the dash still happens). */
export function drawFeints(R, ctx, list) {
  const motion = R.game.motionOn();
  for (const e of list) {
    if (e.hunter !== 'feint') continue;
    const fade = e.fade !== undefined ? Math.max(0, e.fade / GLITCH_FADE_S) : 1, sp = feintSprite(R, e.flash > 0), k = fade < 1 ? 0.4 + 0.6 * fade : 1;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.spin); ctx.scale(k, k); ctx.globalAlpha = fade;
    ctx.drawImage(sp.canvas, -sp.half, -sp.half, sp.half * 2, sp.half * 2);
    ctx.restore();
    const s = e.feint;
    if (motion && s && s.tell > 0 && fade === 1) { // the tell: a white chevron pointing the way it will go
      const a = Math.atan2(s.ny, s.nx), r = e.r;
      ctx.save(); ctx.translate(e.x + s.nx * r * 2, e.y + s.ny * r * 2); ctx.rotate(a);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.6); ctx.lineTo(r * 0.3, 0); ctx.lineTo(-r * 0.4, r * 0.6); ctx.stroke();
      ctx.restore();
    }
    if (e.carry.length) { ctx.fillStyle = RESOURCE[e.carry[0]].color; ctx.beginPath(); ctx.arc(e.x, e.y + e.r * 1.5, 2.5, 0, Math.PI * 2); ctx.fill(); }
    if (e.hp < e.maxHp && fade === 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(e.x - 12, e.y - 20, 24, 3);
      ctx.fillStyle = `rgb(${FEINT_RGB})`; ctx.fillRect(e.x - 12, e.y - 20, 24 * Math.max(0, e.hp / e.maxHp), 3);
    }
  }
}
