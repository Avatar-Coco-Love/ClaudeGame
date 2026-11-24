// Surge Glitches (S-18 split out of game.js; behaviour unchanged): spawn, chase or wander, give up (S-6, D-017),
// die and drop loot (D-018), hit the core. Tuning lives in config.js as GLITCH_*. Spawns, wander and loot draw from
// their own seeded streams (D-025).
import {
  NEXUS_RADIUS, GLITCH_PROGRESS_PX, GLITCH_GIVE_UP_S, GLITCH_FADE_S, GLITCH_PRISM_CHANCE, GLITCH_R, GLITCH_CAP, GLITCH_CAP_BASE,
  GLITCH_CAP_STEP_PX, GLITCH_SPAWN_S, GLITCH_SPAWN_RING, GLITCH_SPAWN_CLEAR, GLITCH_AGGRO_PX, GLITCH_DESPAWN_PX, GLITCH_TIER_PX,
  GLITCH_TIER_MAX, GLITCH_TIER, GLITCH_LOOT_SHARDS, GLITCH_HIT_CD_S, GLITCH_KNOCKBACK, GLITCH_NEXUS_MARGIN, GLITCH_NEXUS_REPEL,
  GLITCH_NEXUS_BURN, CELL, SPIRE_GUARD_CELLS,
} from './config.js';
import { wakeContact } from './wake.js';
import { collides, moveBody } from './body.js';

export function updateGlitches(game, dt) {
  const p = game.player;
  const distFromNexus = Math.hypot(p.x - game.nexus.x, p.y - game.nexus.y);
  const maxCount = distFromNexus < NEXUS_RADIUS * 2 ? 1 : Math.min(GLITCH_CAP, GLITCH_CAP_BASE + Math.floor(distFromNexus / GLITCH_CAP_STEP_PX));
  if (!game.wake) game.spawnTimer -= dt; // S-23: natural spawns pause while a Wake runs (wake.js spawns its own)
  if (game.spawnTimer <= 0) {
    game.spawnTimer = GLITCH_SPAWN_S[0] + game.rng['glitch-spawn']() * GLITCH_SPAWN_S[1];
    if (game.enemies.length < maxCount) trySpawnGlitch(game, distFromNexus);
  }
  const list = game.enemies;
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    e.spin += dt * (2 + e.tier);
    e.flash = Math.max(0, e.flash - dt);
    e.hitCd = Math.max(0, e.hitCd - dt);
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    // S-23: a Wake Glitch chases the Spire core unless the player core is close; reaching the core costs charge (wake.js).
    const goal = e.wake && game.wake && d > SPIRE_GUARD_CELLS * CELL ? game.wake.core : null;
    if (e.fade !== undefined) { // gave up (S-6): drift to a stop and vanish; harmless and lootless
      e.fade -= dt; e.vx *= 0.9; e.vy *= 0.9;
      moveBody(game.world, e, e.vx * dt, e.vy * dt);
      if (e.fade <= 0) list.splice(i, 1);
      continue;
    }
    if (e.hp <= 0) { // B-023: before the give-up and contact checks, so a Glitch the beam just killed neither hits nor fades lootless
      game.stats.glitches++;
      game.burst(e.x, e.y, 22, '#ff7a3d', 220);
      if (game.rng['glitch-loot']() < GLITCH_PRISM_CHANCE) game.spawnPickup(e.x, e.y, 'prism'); // D-018
      for (let j = 0; j < GLITCH_LOOT_SHARDS + e.tier; j++) game.spawnPickup(e.x, e.y, 'shard');
      game.audio.enemyDie();
      game.addShake(4);
      game.enemies.splice(i, 1);
      continue;
    }
    let tx = 0, ty = 0;
    if (goal) {
      const gx = goal.x - e.x, gy = goal.y - e.y, gd = Math.hypot(gx, gy) || 1;
      if (wakeContact(game, e, gd)) { list.splice(i, 1); continue; }
      tx = gx / gd; ty = gy / gd; e.alert = true;
    } else if (d < GLITCH_AGGRO_PX || e.wake) { tx = dx / d; ty = dy / d; e.alert = true; }
    else { e.wander += (game.rng['glitch-wander']() - 0.5) * dt * 3; tx = Math.cos(e.wander) * 0.4; ty = Math.sin(e.wander) * 0.4; }
    const nd = Math.hypot(e.x - game.nexus.x, e.y - game.nexus.y);
    if (nd < NEXUS_RADIUS + GLITCH_NEXUS_MARGIN) { // the nexus repels glitches
      tx = (e.x - game.nexus.x) / nd * GLITCH_NEXUS_REPEL; ty = (e.y - game.nexus.y) / nd * GLITCH_NEXUS_REPEL;
      e.hp -= dt * GLITCH_NEXUS_BURN;
    }
    e.vx += (tx * e.speed - e.vx) * Math.min(1, dt * 3);
    e.vy += (ty * e.speed - e.vy) * Math.min(1, dt * 3);
    moveBody(game.world, e, e.vx * dt, e.vy * dt);
    { // S-6 / D-017: no progress on its best distance to the core for GLITCH_GIVE_UP_S -> give up. Covers wanderers too:
      // they were the real slot-holders (spawned beyond the aggro range, drifting in rock, never alerted).
      const gd = goal ? Math.hypot(goal.x - e.x, goal.y - e.y) : d; // progress toward what it chases
      if (e.target !== !!goal) { e.target = !!goal; e.best = Infinity; } // switching chase target restarts the give-up clock
      if (!(gd > (e.best ?? Infinity) - GLITCH_PROGRESS_PX)) { e.best = gd; e.stall = 0; }
      else if ((e.stall = (e.stall || 0) + dt) >= GLITCH_GIVE_UP_S) { e.fade = GLITCH_FADE_S; continue; }
    }
    if (d < e.r + p.r && e.hitCd <= 0) {
      e.hitCd = GLITCH_HIT_CD_S;
      e.best = d; e.stall = 0; // reaching the core counts as progress, so knockback doesn't start a give-up
      e.vx = -dx / d * GLITCH_KNOCKBACK; e.vy = -dy / d * GLITCH_KNOCKBACK;
      if (p.invuln <= 0) game.hurtPlayer(e.dmg, dx / d, dy / d);
      if (game.enemies !== list) return; // destabilize() replaced the list mid-loop (B-007: indexing on froze the game)
    }
    if (d > GLITCH_DESPAWN_PX && !e.wake) game.enemies.splice(i, 1); // B-048: a Wake's Glitches stay when the core walks off
  }
}

function trySpawnGlitch(game, distFromNexus) {
  const p = game.player;
  for (let tries = 0; tries < 12; tries++) {
    const rs = game.rng['glitch-spawn'], a = rs() * Math.PI * 2, r = GLITCH_SPAWN_RING[0] + rs() * GLITCH_SPAWN_RING[1];
    const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
    if (Math.hypot(x - game.nexus.x, y - game.nexus.y) < NEXUS_RADIUS * GLITCH_SPAWN_CLEAR) continue;
    if (collides(game.world, x, y, GLITCH_R)) continue;
    game.enemies.push(makeGlitch(x, y, glitchTier(distFromNexus), a));
    return;
  }
}

/** Tier by distance from the Nexus in px (deeper = tougher). */
export const glitchTier = distPx => Math.min(GLITCH_TIER_MAX, Math.floor(distPx / GLITCH_TIER_PX));

/** A fresh Glitch at (x, y); `a` seeds its wander heading. Shared by natural spawns and the S-23 Wake. */
export function makeGlitch(x, y, tier, a) {
  const T = GLITCH_TIER;
  return {
    x, y, r: GLITCH_R, vx: 0, vy: 0, tier,
    hp: T.hp[0] + tier * T.hp[1], maxHp: T.hp[0] + tier * T.hp[1],
    speed: T.speed[0] + tier * T.speed[1], dmg: T.dmg[0] + tier * T.dmg[1],
    spin: 0, flash: 0, hitCd: 0.5, wander: a, alert: false,
  };
}
