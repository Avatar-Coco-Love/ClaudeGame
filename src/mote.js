// S-54 Mote swarm (D-142, D-150): the Shoal creature. 256 worlds only (no Shoal elsewhere), one swarm of SWARM_N at a time
// while the core is in the Shoal ring. Motes fly over open floor (walls stop them), steer toward their prey at MOTE_SPEED with
// a boids-lite pull to the swarm centre, and are carried by the Undertow: their chunk's full flow is added to their velocity
// (a calm chunk adds none), so currents bend their paths. Surge: they dart at the core (MOTE_DMG on contact, knockback,
// re-hit GLITCH_HIT_CD_S). Drift: they dart at a loose floor pickup within MOTE_PREY_R cells of the core that the Attractor
// is not already pulling (one each; it carries it off with the current and drops it when beamed); with none in reach, the
// hold. A touch of the hold (either mode) takes MOTE_TAKE items for good, never damage in Drift. After a touch a mote
// scatters MOTE_SCATTER cells and returns. Beamed (`beamFoes` adds live motes): MOTE_LOOT ◆ each, and the swarm's last
// mote pays the Glitch loot of its tier once, equal in both modes. Seeded (`rng.swarm`, `rng['swarm-loot']`); never saved.
import {
  CELL, RESOURCE, UNDERTOW_RING, GLITCH_HIT_CD_S, GLITCH_LOOT_SHARDS, GLITCH_PRISM_CHANCE, SWARM_N, SWARM_FIRST_S,
  SWARM_EVERY_S, SWARM_SPAWN_R, SWARM_LEASH, MOTE_R, MOTE_HP, MOTE_SPEED, MOTE_STEER, MOTE_COHESION, MOTE_DMG, MOTE_PREY_R,
  MOTE_TAKE, MOTE_FIELD, MOTE_SCATTER, MOTE_SCATTER_S, MOTE_LOOT, MOTE_TRAIL, MOTE_RGB, NEXUS_RADIUS, PICKUP_SETTLE_S, T,
} from './config.js';
import { glitchTier } from './glitch.js';
import { flowAt } from './undertow.js';
import { BITE_ORDER } from './burrower.js';

/** Spawner state (never saved). Counters are for tests: swarms, spawned (motes), touches (hold contacts), hits (Surge
 *  damage dealt), taken (items taken for good), carried (pickups lifted), dropped, kills (motes beamed), cleared (swarms
 *  beamed to the last mote). */
export function makeSwarm() {
  return { motes: [], field: new Int16Array(SIDE * SIDE), fx: 0, fy: 0, fieldT: 0, fieldVer: -1, timer: SWARM_FIRST_S, off: false, beamed: 0, tier: 1, swarms: 0, spawned: 0, touches: 0, hits: 0, taken: 0, carried: 0, dropped: 0, kills: 0, cleared: 0 };
}

// The swarm's way in: a BFS distance field over open floor from the core's cell, MOTE_FIELD cells out (as the Echo's, S-42).
const SIDE = MOTE_FIELD * 2 + 1, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function fieldAt(s, x, y) {
  const lx = x - s.fx + MOTE_FIELD, ly = y - s.fy + MOTE_FIELD;
  return lx < 0 || ly < 0 || lx >= SIDE || ly >= SIDE ? -1 : s.field[ly * SIDE + lx];
}
function buildField(game, s) {
  const w = game.world, p = game.player, f = s.field;
  s.fx = Math.floor(p.x / CELL); s.fy = Math.floor(p.y / CELL); s.fieldT = 0.5; s.fieldVer = w.breaks;
  f.fill(-1);
  const q = [MOTE_FIELD * SIDE + MOTE_FIELD];
  f[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], d = f[i], lx = i % SIDE, ly = (i - lx) / SIDE;
    for (const [dx, dy] of N4) {
      const nx = lx + dx, ny = ly + dy;
      if (nx < 0 || ny < 0 || nx >= SIDE || ny >= SIDE) continue;
      const j = ny * SIDE + nx;
      if (f[j] >= 0 || w.solid(s.fx + nx - MOTE_FIELD, s.fy + ny - MOTE_FIELD)) continue;
      f[j] = d + 1; q.push(j);
    }
  }
}
/** A mote can fly straight from (ax, ay) to (bx, by): sampled every 8 px. */
function clearLine(w, ax, ay, bx, by) {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 8);
  for (let i = 1; i < n; i++) if (w.solidAtPx(ax + (bx - ax) * i / n, ay + (by - ay) * i / n)) return false;
  return true;
}
/** Where to fly for the core: straight at it with a clear line, else down the field (the 4-neighbour one step closer). */
function wayIn(game, m) {
  const s = game.swarm, p = game.player;
  if (clearLine(game.world, m.x, m.y, p.x, p.y)) return [p.x, p.y];
  const cx = Math.floor(m.x / CELL), cy = Math.floor(m.y / CELL);
  let best = fieldAt(s, cx, cy), gx = p.x, gy = p.y;
  if (best < 0) return [gx, gy];
  for (const [dx, dy] of N4) {
    const v = fieldAt(s, cx + dx, cy + dy);
    if (v >= 0 && v < best) { best = v; gx = (cx + dx + 0.5) * CELL; gy = (cy + dy + 0.5) * CELL; }
  }
  return [gx, gy];
}

const nextGap = game => SWARM_EVERY_S[0] + game.rng.swarm() * SWARM_EVERY_S[1];
const inShoal = (game, px, py) => { const w = game.world; return w.profile.rings > UNDERTOW_RING && w.ring(Math.floor(px / CELL), Math.floor(py / CELL)) === UNDERTOW_RING; };

/** End the swarm without loot (mode switch, death, Wake, Ending, leash): carried pickups fall where they are. */
export function clearSwarm(game) {
  const s = game.swarm;
  if (!s || !s.motes.length) return;
  for (const m of s.motes) if (m.carry) game.spawnPickup(m.x, m.y, m.carry);
  s.motes = []; s.timer = nextGap(game);
}

function spawn(game) {
  const r = game.rng.swarm, w = game.world, p = game.player, pcx = Math.floor(p.x / CELL), pcy = Math.floor(p.y / CELL);
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = SWARM_SPAWN_R[0] + r() * (SWARM_SPAWN_R[1] - SWARM_SPAWN_R[0]);
    const x = pcx + Math.round(Math.cos(a) * d), y = pcy + Math.round(Math.sin(a) * d);
    if (w.get(x, y) !== T.EMPTY || fieldAt(game.swarm, x, y) < 0) continue; // open floor the swarm can fly in from
    const cx = (x + 0.5) * CELL, cy = (y + 0.5) * CELL;
    if (Math.hypot(cx - game.nexus.x, cy - game.nexus.y) < NEXUS_RADIUS + CELL) continue;
    const s = game.swarm;
    s.tier = glitchTier(Math.hypot(cx - game.nexus.x, cy - game.nexus.y)); s.beamed = 0; s.swarms++; s.spawned += SWARM_N;
    for (let k = 0; k < SWARM_N; k++) {
      const o = k / SWARM_N * Math.PI * 2;
      s.motes.push({ mote: true, x: cx + Math.cos(o) * 6, y: cy + Math.sin(o) * 6, vx: 0, vy: 0, r: MOTE_R, hp: MOTE_HP, maxHp: MOTE_HP,
        flash: 0, hitCd: 0, scatter: 0, sx: 0, sy: 0, prey: null, carry: null, trail: [] });
    }
    return true;
  }
  return false;
}

/** A touch of the hold: MOTE_TAKE items, most valuable first (the Burrower's order), gone for good. */
function take(game) {
  let n = 0;
  for (const k of BITE_ORDER) while (n < MOTE_TAKE && game.cargo[k] > 0) { game.cargo[k]--; n++; }
  game.swarm.taken += n;
  if (n) game.notify('mote-take');
}

function scatterFrom(game, m, x, y) {
  const a = Math.atan2(m.y - y, m.x - x) + (game.rng.swarm() - 0.5) * 1.2;
  m.sx = x + Math.cos(a) * MOTE_SCATTER * CELL; m.sy = y + Math.sin(a) * MOTE_SCATTER * CELL; m.scatter = MOTE_SCATTER_S;
}

function beamed(game, m) {
  const s = game.swarm;
  game.burst(m.x, m.y, 8, `rgb(${MOTE_RGB})`, 140);
  if (m.carry) { game.spawnPickup(m.x, m.y, m.carry); s.dropped++; }
  for (let j = 0; j < MOTE_LOOT; j++) game.spawnPickup(m.x, m.y, 'shard');
  s.kills++; s.beamed++;
  if (s.beamed === SWARM_N) { // the whole swarm: the Glitch loot once
    game.audio.enemyDie();
    if (game.rng['swarm-loot']() < GLITCH_PRISM_CHANCE) game.spawnPickup(m.x, m.y, 'prism');
    for (let j = 0; j < GLITCH_LOOT_SHARDS + s.tier; j++) game.spawnPickup(m.x, m.y, 'shard');
    s.cleared++;
  }
}

/** Drift prey: the nearest settled loose pickup within MOTE_PREY_R cells of the core and outside the Attractor's reach, not
 *  already chased by another mote. */
function pickPrey(game, m, taken) {
  const p = game.player, reach = MOTE_PREY_R * CELL, mag = game.cargoRoom() > 0 ? game.stat('magnet') : 0;
  let best = null, bd = Infinity;
  for (const it of game.pickups) {
    if (it.kept || it.age < PICKUP_SETTLE_S || taken.has(it)) continue;
    const dc = Math.hypot(it.x - p.x, it.y - p.y);
    if (dc > reach || dc < mag) continue;
    const d = Math.hypot(it.x - m.x, it.y - m.y);
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}

function moveMote(game, m, gx, gy, speed, cx, cy, dt) {
  const dx = gx - m.x, dy = gy - m.y, d = Math.hypot(dx, dy) || 1;
  const tx = dx / d * speed + (cx - m.x) * MOTE_COHESION, ty = dy / d * speed + (cy - m.y) * MOTE_COHESION;
  const k = Math.min(1, MOTE_STEER * dt);
  m.vx += (tx - m.vx) * k; m.vy += (ty - m.vy) * k;
  const [ux, uy] = flowAt(game, m.x, m.y); // S-47: the full current carries them
  const nx = m.x + (m.vx + ux) * dt, ny = m.y + (m.vy + uy) * dt, w = game.world;
  if (!w.solidAtPx(nx, m.y)) m.x = nx; else m.vx *= -0.5;
  if (!w.solidAtPx(m.x, ny)) m.y = ny; else m.vy *= -0.5;
  m.trail.push(m.x, m.y);
  if (m.trail.length > MOTE_TRAIL * 2) m.trail.splice(0, 2);
}

/** Once a frame, after the beam (a mote beamed this frame pays before it can touch anything). */
export function updateSwarm(game, dt) {
  const s = game.swarm, p = game.player;
  if (!s || s.off) return;
  if (game.endSeq || game.wake) { clearSwarm(game); return; }
  const here = inShoal(game, p.x, p.y);
  if (here || s.motes.length) {
    if (game.world.breaks !== s.fieldVer || Math.floor(p.x / CELL) !== s.fx || Math.floor(p.y / CELL) !== s.fy || (s.fieldT -= dt) <= 0) buildField(game, s);
  }
  if (s.motes.some(m => m.hp <= 0)) {
    for (let i = s.motes.length - 1; i >= 0; i--) if (s.motes[i].hp <= 0) { beamed(game, s.motes[i]); s.motes.splice(i, 1); }
    if (!s.motes.length) s.timer = nextGap(game); // the last mote just went: a full gap
  }
  if (!s.motes.length) {
    if (!here || (s.timer -= dt) > 0) return;
    if (!spawn(game)) { s.timer = 2; return; }
  }
  let cx = 0, cy = 0;
  for (const m of s.motes) { cx += m.x; cy += m.y; }
  cx /= s.motes.length; cy /= s.motes.length;
  if (Math.hypot(cx - p.x, cy - p.y) > SWARM_LEASH * CELL) { clearSwarm(game); return; }
  const surge = game.mode === 'surge', chased = new Set();
  for (const m of s.motes) if (m.prey && !m.carry && game.pickups.includes(m.prey)) chased.add(m.prey); else m.prey = null;
  for (const m of s.motes) {
    m.flash = Math.max(0, m.flash - dt); m.hitCd = Math.max(0, m.hitCd - dt);
    if (m.scatter > 0) { m.scatter -= dt; moveMote(game, m, m.sx, m.sy, MOTE_SPEED, cx, cy, dt); continue; }
    if (m.carry) { // drifts off with the current, away from the core
      const ax = m.x - p.x, ay = m.y - p.y, ad = Math.hypot(ax, ay) || 1;
      moveMote(game, m, m.x + ax / ad * CELL, m.y + ay / ad * CELL, MOTE_SPEED * 0.3, m.x, m.y, dt);
      continue;
    }
    if (!surge) {
      if (m.prey) { // the Attractor wins a race: a pickup it starts to pull is dropped as prey
        const mag = game.cargoRoom() > 0 ? game.stat('magnet') : 0;
        if (Math.hypot(m.prey.x - p.x, m.prey.y - p.y) < mag) { chased.delete(m.prey); m.prey = null; }
      }
      if (!m.prey) { m.prey = pickPrey(game, m, chased); if (m.prey) chased.add(m.prey); }
      if (m.prey) {
        const it = m.prey, [gx, gy] = clearLine(game.world, m.x, m.y, it.x, it.y) ? [it.x, it.y] : wayIn(game, m);
        moveMote(game, m, gx, gy, MOTE_SPEED, cx, cy, dt);
        if (Math.hypot(it.x - m.x, it.y - m.y) < m.r + it.r + 2) {
          const i = game.pickups.indexOf(it);
          if (i >= 0) { game.pickups.splice(i, 1); m.carry = it.kind; s.carried++; }
          m.prey = null;
        }
        continue;
      }
    }
    const [gx, gy] = wayIn(game, m);
    moveMote(game, m, gx, gy, MOTE_SPEED, cx, cy, dt);
    if (m.hitCd <= 0 && Math.hypot(p.x - m.x, p.y - m.y) < m.r + p.r) {
      m.hitCd = GLITCH_HIT_CD_S; s.touches++;
      if (surge && p.invuln <= 0) {
        const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
        game.hurtPlayer(MOTE_DMG, dx / d, dy / d); s.hits++;
      }
      take(game);
      scatterFrom(game, m, p.x, p.y);
    }
  }
}

// ---------- drawing (render.js) ----------
/** Over the darkness (they glow): tiny mint diamonds with a short fading trail; a carried pickup rides as a dot. No blur. */
export function drawMotes(R, ctx) {
  const s = R.game.swarm;
  if (!s || !s.motes.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (const m of s.motes) {
    const tr = m.trail, col = m.flash > 0 ? '255, 255, 255' : MOTE_RGB;
    for (let i = 2; i < tr.length; i += 2) {
      ctx.strokeStyle = `rgba(${col}, ${(0.5 * i / tr.length).toFixed(2)})`; ctx.lineWidth = 1 + 1.5 * i / tr.length;
      ctx.beginPath(); ctx.moveTo(tr[i - 2], tr[i - 1]); ctx.lineTo(tr[i], tr[i + 1]); ctx.stroke();
    }
    const a = Math.atan2(m.vy, m.vx), r = m.r;
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(a);
    ctx.fillStyle = `rgba(${col}, 0.18)`; // a soft halo instead of a blur (D-149)
    ctx.beginPath(); ctx.moveTo(r * 2.4, 0); ctx.lineTo(0, r * 1.6); ctx.lineTo(-r * 2.4, 0); ctx.lineTo(0, -r * 1.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgb(${col})`;
    ctx.beginPath(); ctx.moveTo(r * 1.4, 0); ctx.lineTo(0, r * 0.8); ctx.lineTo(-r * 1.4, 0); ctx.lineTo(0, -r * 0.8); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (m.carry) { ctx.fillStyle = RESOURCE[m.carry].color; ctx.beginPath(); ctx.arc(m.x, m.y + r * 1.6, 2, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
