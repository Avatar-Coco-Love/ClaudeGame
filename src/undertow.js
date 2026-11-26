// S-47 Undertow (D-124): seeded currents in the Shoal's 16-cell chunks. Pure seed data, nothing saved. The core's current
// eases from the one it had to its chunk's over UNDERTOW_EASE_S (no snap at borders) and adds to the realized velocity
// before collision (game.js); the intent and target velocity never see it (pillar 5). Pickups drift at UNDERTOW_PICKUP.
// Same in Drift and Surge; Glitches and the Echo ignore it. `off` is a tools/tests flag (tools/haulrun.mjs).
import { CELL, CHUNK, LOCK_TIDE_MIN, UNDERTOW_RING, UNDERTOW_CALM, UNDERTOW_SPEED, UNDERTOW_EASE_S, UNDERTOW_PICKUP, UNDERTOW_DASHES, UNDERTOW_RGB } from './config.js';
import { seededStream } from './world.js';
import { tideSites } from './lock.js';

/** Per-chunk flow (px/s) for a world: Float32Array pairs [vx, vy], zero outside the Shoal and in calm chunks. */
export function undertowField(world) {
  const n = world.chunksW * world.chunksH, flow = new Float32Array(n * 2), rng = seededStream(world.seed, 'undertow');
  for (let i = 0; i < n; i++) {
    const calm = rng() < UNDERTOW_CALM, dir = Math.floor(rng() * 8), sp = UNDERTOW_SPEED[0] + rng() * UNDERTOW_SPEED[1];
    const cx = (i % world.chunksW) * CHUNK + CHUNK / 2, cy = Math.floor(i / world.chunksW) * CHUNK + CHUNK / 2;
    if (calm || world.ring(cx, cy) !== UNDERTOW_RING || world.profile.rings <= UNDERTOW_RING) continue;
    const a = dir * Math.PI / 4;
    flow[i * 2] = Math.cos(a) * sp; flow[i * 2 + 1] = Math.sin(a) * sp;
  }
  for (const L of tideSites(world)) { // S-59 (D-162): a Tide Lock's chunk is never calm
    const k = L.chunk * 2;
    if (!flow[k] && !flow[k + 1]) { flow[k] = L.hx * LOCK_TIDE_MIN; flow[k + 1] = L.hy * LOCK_TIDE_MIN; }
  }
  return flow;
}

export function makeUndertow(world) {
  return { flow: undertowField(world), chunk: -1, from: [0, 0], to: [0, 0], t: UNDERTOW_EASE_S, vx: 0, vy: 0, off: false };
}

function chunkAt(world, px, py) {
  const cx = Math.floor(px / CELL / CHUNK), cy = Math.floor(py / CELL / CHUNK);
  return cx < 0 || cy < 0 || cx >= world.chunksW || cy >= world.chunksH ? -1 : cy * world.chunksW + cx;
}

/** Flow (px/s) of the chunk under a point, [0, 0] off the map, in calm water or with the flag off. */
export function flowAt(game, px, py) {
  const u = game.undertow, i = chunkAt(game.world, px, py);
  return !u || u.off || i < 0 ? [0, 0] : [u.flow[i * 2], u.flow[i * 2 + 1]];
}

/** Advances the core's eased current; returns it as { vx, vy } (px/s). */
export function updateUndertow(game, dt) {
  const u = game.undertow, p = game.player, i = u.off ? -1 : chunkAt(game.world, p.x, p.y);
  if (i !== u.chunk) { u.chunk = i; u.from = [u.vx, u.vy]; u.to = flowAt(game, p.x, p.y); u.t = 0; }
  u.t = Math.min(UNDERTOW_EASE_S, u.t + dt);
  const k = u.t / UNDERTOW_EASE_S;
  u.vx = u.from[0] + (u.to[0] - u.from[0]) * k; u.vy = u.from[1] + (u.to[1] - u.from[1]) * k;
  return u;
}

/** Pickup drift (px/s) at a point: half the chunk's flow. */
export function pickupDrift(game, px, py) {
  const f = flowAt(game, px, py);
  return [f[0] * UNDERTOW_PICKUP, f[1] * UNDERTOW_PICKUP];
}

/** A fixed 0–1 hash of a slot number (dash placement only; not gameplay). */
function hash(n) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Faint dashes moving with the flow in open cells on screen: 6 slots per flowing chunk in view, ≤ UNDERTOW_DASHES. */
export function drawUndertow(r, ctx, left, top, vw, vh) {
  const g = r.game, u = g.undertow, w = g.world;
  if (!u || u.off) return;
  const cap = UNDERTOW_DASHES[r.quality >= 2 ? 1 : 0], CP = CHUNK * CELL, still = g.settings && g.settings.reducedMotion;
  const x0 = Math.max(0, Math.floor(left / CP)), x1 = Math.min(w.chunksW - 1, Math.floor((left + vw) / CP));
  const y0 = Math.max(0, Math.floor(top / CP)), y1 = Math.min(w.chunksH - 1, Math.floor((top + vh) / CP));
  let n = 0;
  ctx.save();
  ctx.strokeStyle = `rgba(${UNDERTOW_RGB}, 0.45)`; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let cy = y0; cy <= y1 && n < cap; cy++) for (let cx = x0; cx <= x1 && n < cap; cx++) {
    const i = cy * w.chunksW + cx, fx = u.flow[i * 2], fy = u.flow[i * 2 + 1];
    if (!fx && !fy) continue;
    const sp = Math.hypot(fx, fy), ux = fx / sp, uy = fy / sp;
    for (let s = 0; s < 6 && n < cap; s++) {
      const h = hash(i * 16 + s), h2 = hash(i * 16 + s + 8);
      const run = still ? 0.5 : ((r.time * sp / CP + h) % 1); // each dash crosses the chunk along the flow, then wraps
      let px = cx * CP + h2 * CP + ux * (run - 0.5) * CP, py = cy * CP + h * CP + uy * (run - 0.5) * CP;
      px = cx * CP + (((px - cx * CP) % CP) + CP) % CP; py = cy * CP + (((py - cy * CP) % CP) + CP) % CP;
      if (w.solidAtPx(px, py)) continue;
      ctx.moveTo(px - ux * 9, py - uy * 9); ctx.lineTo(px + ux * 9, py + uy * 9); n++;
    }
  }
  ctx.stroke();
  ctx.restore();
  r.undertowDashes = n; // tests read the count
}
