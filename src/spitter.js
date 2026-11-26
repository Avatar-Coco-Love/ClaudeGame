// S-32 (D-087, D-096): the Spitter, the first Glitch variant. Surge only, natural spawns at tier >= SPITTER_TIER (Deep).
// It is a Glitch with `spitter: true`: glitch.js runs its life (spawn, give-up, loot, Nexus repel); this file decides how
// it moves and when it fires, and runs its bolts (`game.bolts`). A bolt flies straight, stops at the first solid cell,
// hurts the core once, and the beam can pop it (beam.js aims at `beamFoes`). Wake Glitches never become Spitters.
import {
  CELL, GLITCH_R, SPITTER_HP, SPITTER_HOLD_PX, SPITTER_EASE_PX, SPITTER_BACK, SPITTER_FIRE_PX, SPITTER_SHOT_S, SPITTER_TELL_S, SPITTER_COLORS,
  BOLT_SPEED, BOLT_DMG, BOLT_HP, BOLT_R, BOLT_LIFE_S,
} from './config.js';

/** Turn a fresh Glitch into a Spitter (hp × SPITTER_HP; loot stays its tier's). */
export function makeSpitter(e) {
  e.spitter = true; e.hp *= SPITTER_HP; e.maxHp = e.hp; e.shot = SPITTER_SHOT_S;
  return e;
}

/** Nothing solid between the Spitter and the core. */
function clearShot(game, e, d) {
  const p = game.player;
  return !game.world.raycast(e.x, e.y, (p.x - e.x) / d, (p.y - e.y) / d, d - p.r);
}

/** One frame of an alert Spitter `d` px from the core. Returns its chase speed factor: 1 = close in as a Glitch would;
 *  with a clear shot it eases to a stop at SPITTER_HOLD_PX (and backs off a little inside it). glitch.js counts a hold
 *  near that distance as progress, so a Spitter doing its job never gives up (D-017). */
export function spitterStep(game, e, d, dt) {
  e.spin = Math.atan2(game.player.y - e.y, game.player.x - e.x); // the diamond points at the core: it reads as aiming
  const open = d < SPITTER_FIRE_PX && clearShot(game, e, d);
  if (!open) { e.shot = Math.max(e.shot, SPITTER_TELL_S); return 1; } // no glow while it can't see the core
  e.shot -= dt;
  if (e.shot <= 0) { e.shot = SPITTER_SHOT_S; fireBolt(game, e, d); }
  return Math.max(-SPITTER_BACK, Math.min(1, (d - SPITTER_HOLD_PX) / SPITTER_EASE_PX));
}

function fireBolt(game, e, d) {
  const p = game.player, ux = (p.x - e.x) / d, uy = (p.y - e.y) / d;
  game.bolts.push({ bolt: true, x: e.x + ux * e.r, y: e.y + uy * e.r, vx: ux * BOLT_SPEED, vy: uy * BOLT_SPEED,
    r: BOLT_R, hp: BOLT_HP, flash: 0, life: BOLT_LIFE_S });
  game.audio.spit();
}

/** Bolts: fly, stop on rock, hit the core once, pop when the beam empties them. */
export function updateBolts(game, dt) {
  const list = game.bolts, p = game.player, w = game.world;
  for (let i = list.length - 1; i >= 0; i--) {
    const b = list[i];
    b.flash = Math.max(0, b.flash - dt);
    if (b.hp <= 0) { boltPop(game, b, 10); list.splice(i, 1); continue; }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (w.solid(Math.floor(b.x / CELL), Math.floor(b.y / CELL))) { boltPop(game, b, 5); list.splice(i, 1); continue; }
    const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1;
    if (d < p.r + b.r) {
      list.splice(i, 1); boltPop(game, b, 6);
      if (p.invuln <= 0) game.hurtPlayer(BOLT_DMG, dx / d, dy / d);
      if (game.bolts !== list) return; // destabilize() cleared the bolts mid-loop
      continue;
    }
    if (b.life <= 0) list.splice(i, 1);
  }
}

function boltPop(game, b, n) { game.burst(b.x, b.y, n, SPITTER_COLORS[1], 120); }

/** What the beam can hit: live Glitches, then bolts, then a surfaced S-53 Burrower, then S-54 motes (either mode). */
export function beamFoes(game) {
  const b = game.burrow && game.burrow.b, up = b && b.state === 'up' ? b : null, motes = game.swarm ? game.swarm.motes : [];
  if (!game.bolts.length && !up && !motes.length) return game.enemies;
  const out = game.enemies.concat(game.bolts);
  if (up) out.push(up);
  return motes.length ? out.concat(motes) : out;
}

// ---------- drawing (render.js calls these; sprites are cached glow canvases, D-051) ----------
/** A Spitter's body: a violet diamond with an orange core line, no limbs (D-002 / pillars). */
export function spitterSprite(R, white) {
  const r = GLITCH_R;
  return R.glowSprite(`sp-${white ? 1 : 0}`, r * 1.3 + 2 + 18 / (R.zoom * R.dpr), g => {
    g.shadowBlur = 14; g.lineWidth = 2;
    g.strokeStyle = g.fillStyle = g.shadowColor = white ? '#ffffff' : SPITTER_COLORS[0];
    g.beginPath(); g.moveTo(r * 1.3, 0); g.lineTo(0, r * 0.75); g.lineTo(-r * 1.3, 0); g.lineTo(0, -r * 0.75); g.closePath();
    g.stroke(); g.globalAlpha = 0.25; g.fill(); g.globalAlpha = 1;
    g.strokeStyle = g.shadowColor = white ? '#ffffff' : SPITTER_COLORS[1];
    g.beginPath(); g.moveTo(-r * 0.5, 0); g.lineTo(r * 0.5, 0); g.stroke();
  });
}

function orb(R, key, rad, col) {
  return R.glowSprite(key, rad + 14 / (R.zoom * R.dpr), g => {
    g.fillStyle = g.shadowColor = col; g.shadowBlur = 12;
    g.beginPath(); g.arc(0, 0, rad, 0, Math.PI * 2); g.fill();
  });
}

/** Over the darkness: the SPITTER_TELL_S glow before each shot, and the bolts in flight (readable in the dark, D-002). */
export function drawSpitterTells(R, ctx) {
  const tell = orb(R, 'sp-tell', 6, SPITTER_COLORS[1]), bolt = orb(R, 'sp-bolt', BOLT_R * 0.8, SPITTER_COLORS[1]), ember = orb(R, 'sp-ember', BOLT_R, '#ff6a28'); // S-60b ember: larger, redder
  for (const e of R.game.enemies) {
    if (!e.spitter || e.fade !== undefined || !e.alert || e.shot > SPITTER_TELL_S) continue;
    const k = 0.6 + (1 - e.shot / SPITTER_TELL_S) * 1.2;
    ctx.globalAlpha = 0.5 + 0.5 * (1 - e.shot / SPITTER_TELL_S);
    ctx.drawImage(tell.canvas, e.x - tell.half * k, e.y - tell.half * k, tell.half * 2 * k, tell.half * 2 * k);
  }
  ctx.globalAlpha = 1;
  for (const b of R.game.bolts) {
    const k = b.flash > 0 ? 1.4 : 1, o = b.ember ? ember : bolt;
    ctx.drawImage(o.canvas, b.x - o.half * k, b.y - o.half * k, o.half * 2 * k, o.half * 2 * k);
  }
}
