// S-72 (M17, D-190, D-193): hunters — foes that path to the core through tunnels instead of beelining (a Glitch gives up
// at the first wall, D-017). They live in `game.hunters` (not `game.enemies`, which Drift empties), so they hunt in both
// modes; `beamFoes` (spitter.js) adds them, so the beam, Arc, Wards and the Echo see them with no other change. The
// Tracer walks the core's flow field (flow.js) downhill; with a clear line ≤ TRACER_LINE cells it steers straight.
// Faces (D-152): Surge contact damage, kill drops as a Glitch (D-018); Drift a touch takes cargo and it flees up the
// field, killed it drops what it took. The Nexus repels and burns it like a Glitch. A mode switch keeps them; core death,
// the ending and New Cycle (a new Game) clear them. Seeded (`rng.tracer`, `rng['glitch-loot']`); never saved.
// S-73a (D-194): the Pincer pair (`hunter: 'lead' | 'flank'`, Deep and out, `rng.pincer`) spawns and moves here too;
// pincer.js picks the flank's A* way and draws the pair.
import {
  CELL, GLITCH_R, GLITCH_TIER, GLITCH_GIVE_UP_S, GLITCH_FADE_S, GLITCH_HIT_CD_S, GLITCH_KNOCKBACK, GLITCH_PRISM_CHANCE,
  GLITCH_LOOT_SHARDS, GLITCH_NEXUS_MARGIN, GLITCH_NEXUS_REPEL, GLITCH_NEXUS_BURN, NEXUS_RADIUS, RESOURCE,
  TRACER_S, TRACER_RETRY_S, TRACER_SPAWN, TRACER_CAP, TRACER_CAP_DEEP, TRACER_SPEED, TRACER_STEER, TRACER_LINE, TRACER_DMG,
  TRACER_TAKE, TRACER_FLEE_S, TRACER_TRAIL, TRACER_RGB, PINCER_S, PINCER_SPLIT, PINCER_DMG, PINCER_PART_S, PINCER_RGB,
} from './config.js';
import { flankStep, drawPincers } from './pincer.js';
import { coreField, fieldAt, downhill, uphill, ringCells } from './flow.js';
import { glitchTier } from './glitch.js';
import { biteCargo } from './mote.js';
import { moveBody, collides } from './body.js';

/** Spawner state (never saved). Counters are for tests: spawned, reached (first contact), gaveUp, kills, taken. */
export function makeHunt(game) {
  return {
    timer: gap(game), pincer: pgap(game), off: false, spawned: 0, reached: 0, gaveUp: 0, kills: 0, taken: 0,
    pairs: 0, frame: 0, searchFrame: -1, searches: 0, capped: 0, nodesMax: 0, // S-73a: pincer pairs and flank searches
  };
}
const gap = game => TRACER_S[0] + game.rng.tracer() * TRACER_S[1];
const pgap = game => PINCER_S[0] + game.rng.pincer() * PINCER_S[1];

/** The off-screen half extents in px (the renderer sets `game.view`; tools / node use a 1280 × 800 desktop at zoom 1.11). */
const view = game => game.view || { hw: 576, hh: 360 };

/** S-72 spawn rule (S-73 reuses it): field cells TRACER_SPAWN steps out whose centre is off screen (camera rect + 1 cell),
 *  in index order; `rng.tracer` picks one. null = none. */
export function spawnCell(game, f, rng = game.rng.tracer) {
  const ok = spawnCells(game, f);
  if (!ok.length) return null;
  const k = Math.floor(rng() * ok.length / 2) * 2;
  return [ok[k], ok[k + 1]];
}

/** Every cell the spawn rule allows, flat [x, y, …] in index order. */
function spawnCells(game, f) {
  const p = game.player, v = view(game), m = CELL;
  const all = ringCells(f, TRACER_SPAWN[0], TRACER_SPAWN[1]), ok = [];
  for (let i = 0; i < all.length; i += 3) {
    const x = (all[i] + 0.5) * CELL, y = (all[i + 1] + 0.5) * CELL;
    if (Math.abs(x - p.x) <= v.hw + m && Math.abs(y - p.y) <= v.hh + m) continue;
    if (Math.hypot(x - game.nexus.x, y - game.nexus.y) < NEXUS_RADIUS + GLITCH_NEXUS_MARGIN) continue;
    if (collides(game.world, x, y, GLITCH_R)) continue;
    ok.push(all[i], all[i + 1]);
  }
  return ok;
}

/** A Tracer at cell (cx, cy), of the core's Glitch tier. */
export function makeTracer(game, cx, cy, kind = 'tracer') {
  const tier = glitchTier(Math.hypot(game.player.x - game.nexus.x, game.player.y - game.nexus.y)), T = GLITCH_TIER;
  const x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL, hp = T.hp[0] + tier * T.hp[1];
  return {
    hunter: kind, x, y, r: GLITCH_R, vx: 0, vy: 0, tier, hp, maxHp: hp, speed: TRACER_SPEED * (T.speed[0] + tier * T.speed[1]),
    dmg: (kind === 'tracer' ? TRACER_DMG : PINCER_DMG) + tier * T.dmg[1], flash: 0, hitCd: 0.5, spin: 0, best: Infinity, stall: 0, flee: 0, carry: [], trail: [cx, cy], met: false,
  };
}

/** Put a Tracer out now (dev.tracer, tests); returns it or null. Ignores the ring, cap and timer. */
export function spawnTracer(game) {
  const f = coreField(game), c = spawnCell(game, f);
  if (!c) return null;
  const t = makeTracer(game, c[0], c[1]);
  game.hunters.push(t); game.hunt.spawned++;
  return t;
}

/** S-73a: a Pincer pair out now on the spawn rule, the flank ≥ PINCER_SPLIT cells from the lead (`rng.pincer` picks
 *  both); returns [lead, flank] or null. dev.pincer and tests; ignores the ring and timer. */
export function spawnPincer(game) {
  const f = coreField(game), ok = spawnCells(game, f), rng = game.rng.pincer;
  if (!ok.length) return null;
  const k = Math.floor(rng() * ok.length / 2) * 2, lx = ok[k], ly = ok[k + 1], far = [];
  for (let i = 0; i < ok.length; i += 2) if (Math.hypot(ok[i] - lx, ok[i + 1] - ly) >= PINCER_SPLIT) far.push(ok[i], ok[i + 1]);
  if (!far.length) return null;
  const j = Math.floor(rng() * far.length / 2) * 2;
  const lead = makeTracer(game, lx, ly, 'lead'), flank = makeTracer(game, far[j], far[j + 1], 'flank');
  lead.mate = flank; flank.mate = lead; flank.searchT = 0; flank.path = null; flank.pi = 0;
  game.hunters.push(lead, flank); game.hunt.spawned += 2; game.hunt.pairs++;
  return [lead, flank];
}
const isPincer = e => e.hunter === 'lead' || e.hunter === 'flank';

/** Every hunter gone, lootless (core death, the ending). What a Drift Tracer took is lost with it. */
export function clearHunters(game) { game.hunters.length = 0; }

/** Once a frame in both modes, after the beam (a hunter beamed this frame pays before it can touch anything). */
export function updateHunters(game, dt) {
  const h = game.hunt;
  if (!h || h.off) return;
  if (game.endSeq) { clearHunters(game); return; }
  const ring = game.ringNow, cap = ring >= 2 ? TRACER_CAP_DEEP : TRACER_CAP;
  const live = game.hunters.filter(e => e.hunter === 'tracer').length;
  if (ring >= 1 && !game.wake && live < cap && (h.timer -= dt) <= 0) h.timer = spawnTracer(game) ? gap(game) : TRACER_RETRY_S;
  if (ring >= 2 && !game.wake && !game.hunters.some(isPincer) && (h.pincer -= dt) <= 0) h.pincer = spawnPincer(game) ? pgap(game) : TRACER_RETRY_S;
  h.frame++;
  if (!game.hunters.length) return;
  const f = coreField(game, dt), p = game.player, list = game.hunters;
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    e.flash = Math.max(0, e.flash - dt); e.hitCd = Math.max(0, e.hitCd - dt);
    if (e.fade !== undefined) { // gave up (S-6): drift to a stop and vanish; harmless and lootless
      e.fade -= dt; e.vx *= 0.9; e.vy *= 0.9; moveBody(game.world, e, e.vx * dt, e.vy * dt);
      if (e.fade <= 0) list.splice(i, 1);
      continue;
    }
    if (e.hp <= 0) { die(game, e); list.splice(i, 1); continue; }
    const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL), fd = fieldAt(f, cx, cy);
    const tc = e.trail.length;
    if (e.hunter === 'tracer' && (e.trail[tc - 2] !== cx || e.trail[tc - 1] !== cy)) { e.trail.push(cx, cy); if (e.trail.length > TRACER_TRAIL * 2) e.trail.splice(0, 2); }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    let gx, gy;
    if (e.flee > 0) { // Drift, after a touch: up the field, away from the core
      e.flee -= dt;
      const up = uphill(f, cx, cy);
      if (fd < 0 || e.flee <= 0) { e.fade = GLITCH_FADE_S; h.gaveUp++; continue; }
      [gx, gy] = up ? [(up[0] + 0.5) * CELL, (up[1] + 0.5) * CELL] : [e.x - dx, e.y - dy];
    } else {
      if (fd < 0) { e.fade = GLITCH_FADE_S; h.gaveUp++; continue; } // off the field: gives up (D-017's fade)
      const seen = d <= TRACER_LINE * CELL && !game.world.raycast(e.x, e.y, dx / d, dy / d, d);
      const way = e.hunter === 'flank' ? flankStep(game, e, f, cx, cy, dt) : null; // S-73a: the flank's A* way, else the field
      const togo = way ? e.togo : fd; // progress: steps left (a flank on its detour counts its path, not the field)
      if (togo < e.best) { e.best = togo; e.stall = 0; } else if ((e.stall += dt) >= GLITCH_GIVE_UP_S) { e.fade = GLITCH_FADE_S; h.gaveUp++; continue; }
      const down = seen ? null : way || downhill(f, cx, cy);
      [gx, gy] = down ? [(down[0] + 0.5) * CELL, (down[1] + 0.5) * CELL] : [p.x, p.y];
    }
    let tx = gx - e.x, ty = gy - e.y; const td = Math.hypot(tx, ty) || 1; tx /= td; ty /= td;
    const nd = Math.hypot(e.x - game.nexus.x, e.y - game.nexus.y);
    if (nd < NEXUS_RADIUS + GLITCH_NEXUS_MARGIN) { // the Nexus repels it like a Glitch
      tx = (e.x - game.nexus.x) / nd * GLITCH_NEXUS_REPEL; ty = (e.y - game.nexus.y) / nd * GLITCH_NEXUS_REPEL;
      e.hp -= dt * GLITCH_NEXUS_BURN;
    }
    const k = Math.min(1, dt * TRACER_STEER);
    e.vx += (tx * e.speed - e.vx) * k; e.vy += (ty * e.speed - e.vy) * k;
    moveBody(game.world, e, e.vx * dt, e.vy * dt, true);
    e.spin = Math.atan2(e.vy, e.vx);
    if (e.flee <= 0 && d < e.r + p.r && e.hitCd <= 0) touch(game, e, dx / d, dy / d);
  }
}

function touch(game, e, ux, uy) {
  const h = game.hunt, p = game.player;
  e.hitCd = GLITCH_HIT_CD_S; e.best = Infinity; e.stall = 0; // reaching the core counts as progress
  if (!e.met) { e.met = true; h.reached++; }
  if (game.mode === 'surge') {
    e.vx = -ux * GLITCH_KNOCKBACK; e.vy = -uy * GLITCH_KNOCKBACK;
    if (p.invuln <= 0) game.hurtPlayer(e.dmg, ux, uy);
    return;
  }
  const took = biteCargo(game, TRACER_TAKE); // Drift: no damage; it snatches and runs
  e.carry.push(...took); h.taken += took.length;
  if (took.length) game.notify('tracer-take');
  e.flee = TRACER_FLEE_S; e.vx = -ux * e.speed; e.vy = -uy * e.speed;
}

function die(game, e) {
  const h = game.hunt;
  h.kills++;
  const m = e.mate; // S-73a: one of a pair down: the other flees, then fades
  if (m && m.fade === undefined && m.hp > 0 && game.hunters.includes(m)) { m.flee = PINCER_PART_S; m.part = true; }
  game.burst(e.x, e.y, 22, `rgb(${isPincer(e) ? PINCER_RGB : TRACER_RGB})`, 220); game.audio.enemyDie(); game.addShake(4);
  for (const k of e.carry) game.spawnPickup(e.x, e.y, k); // what it took, back (a Ward's kill too: D-154 keeps carried items)
  if (game.mode !== 'surge') return; // Drift: only what it took (D-152)
  const prism = game.rng['glitch-loot']() < GLITCH_PRISM_CHANCE; // drawn either way (D-025)
  if (e.warded) return; // D-154: a Ward's kill pays no loot
  if (prism) game.spawnPickup(e.x, e.y, 'prism');
  for (let j = 0; j < GLITCH_LOOT_SHARDS + e.tier; j++) game.spawnPickup(e.x, e.y, 'shard');
}

// ---------- drawing (render.js) ----------
/** A Tracer: a cyan-violet chevron (Glitch size, cached glow sprite, D-051), no limbs (D-002). */
function tracerSprite(R, white) {
  const r = GLITCH_R;
  return R.glowSprite(`tr-${white ? 1 : 0}`, r * 1.4 + 2 + 18 / (R.zoom * R.dpr), g => {
    g.shadowBlur = 14; g.lineWidth = 2.5; g.lineJoin = 'round';
    g.strokeStyle = g.fillStyle = g.shadowColor = white ? '#ffffff' : `rgb(${TRACER_RGB})`;
    g.beginPath(); g.moveTo(r * 1.3, 0); g.lineTo(-r * 0.9, r * 0.95); g.lineTo(-r * 0.3, 0); g.lineTo(-r * 0.9, -r * 0.95); g.closePath();
    g.stroke(); g.globalAlpha = 0.3; g.fill();
  });
}

/** Over the darkness (it hunts you in the dark; read it there): the 6-dot trail of the cells it crossed (fading,
 *  unblurred, D-160), then the chevron pointing where it goes; a carried item rides as a dot. Also records the view. */
export function drawHunters(R, ctx) {
  R.game.view = { hw: R.w / R.zoom / 2, hh: R.h / R.zoom / 2 };
  const list = R.game.hunters;
  if (!list || !list.length) return;
  if (list.some(isPincer)) drawPincers(R, ctx, list);
  for (const e of list) {
    if (e.hunter !== 'tracer') continue;
    const fade = e.fade !== undefined ? Math.max(0, e.fade / GLITCH_FADE_S) : 1, tr = e.trail, n = tr.length / 2;
    for (let i = 0; i < n - 1; i++) { // the newest trail cell is the one it is in: skip it
      ctx.fillStyle = `rgba(${TRACER_RGB}, ${(fade * 0.55 * (i + 1) / n).toFixed(2)})`;
      ctx.beginPath(); ctx.arc((tr[i * 2] + 0.5) * CELL, (tr[i * 2 + 1] + 0.5) * CELL, 2 + 2 * (i + 1) / n, 0, Math.PI * 2); ctx.fill();
    }
    const sp = tracerSprite(R, e.flash > 0), k = fade < 1 ? 0.4 + 0.6 * fade : 1;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.spin); ctx.scale(k, k); ctx.globalAlpha = fade;
    ctx.drawImage(sp.canvas, -sp.half, -sp.half, sp.half * 2, sp.half * 2);
    ctx.restore();
    if (e.carry.length) { ctx.fillStyle = RESOURCE[e.carry[0]].color; ctx.beginPath(); ctx.arc(e.x, e.y + e.r * 1.5, 2.5, 0, Math.PI * 2); ctx.fill(); }
    if (e.hp < e.maxHp && fade === 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(e.x - 12, e.y - 20, 24, 3);
      ctx.fillStyle = `rgb(${TRACER_RGB})`; ctx.fillRect(e.x - 12, e.y - 20, 24 * Math.max(0, e.hp / e.maxHp), 3);
    }
  }
}
