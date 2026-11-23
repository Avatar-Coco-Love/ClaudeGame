// Simulation: the core (player), beam, pickups, deposit, Glitches (Surge mode), particles.
// State flow mirrors the old movement lab lesson: intent -> target velocity -> collision-resolved realized velocity.
import { CELL, NEXUS_RADIUS, GLITCH_PROGRESS_PX, GLITCH_GIVE_UP_S, GLITCH_FADE_S, GLITCH_PRISM_CHANCE, HITSTOP_S, HITSTOP_GAP_S, CORE_RING_S, MATERIAL, RINGS, UPGRADES, NEXUS_UPGRADES, upgradeCost, T, VAULT_LOOT, KINDS, RESOURCE } from './config.js';
import { World, packBits, unpackBits, seededStream } from './world.js';
import { SAVE_FORMAT } from './save.js';
import { tryScan, updateScan, emptyScan } from './research.js';

const ACCEL = 9;          // how quickly velocity chases its target (1/s)
const PLAYER_R = 10;
const ENEMY_R = 11;
const PICKUP_CAP = 400;
const PARTICLE_CAP = 500;

export function collides(world, x, y, r) {
  const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
  const y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (world.solid(cx, cy)) return true;
  return false;
}

/** Move a body by (dx,dy) resolving each axis separately against the grid. Returns realized displacement. */
export function moveBody(world, b, dx, dy, assist = false) {
  const sx = b.x, sy = b.y;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (CELL * 0.4)));
  const ix = dx / steps, iy = dy / steps;
  for (let s = 0; s < steps; s++) {
    if (ix) {
      b.x += ix;
      if (collides(world, b.x, b.y, b.r)) {
        b.x = ix > 0 ? Math.floor((b.x + b.r) / CELL) * CELL - b.r - 0.01
                     : (Math.floor((b.x - b.r) / CELL) + 1) * CELL + b.r + 0.01;
        if (assist && Math.abs(ix) > Math.abs(iy)) cornerAssist(world, b, 'y', ix > 0 ? 1 : -1, 0, Math.abs(ix));
      }
    }
    if (iy) {
      b.y += iy;
      if (collides(world, b.x, b.y, b.r)) {
        b.y = iy > 0 ? Math.floor((b.y + b.r) / CELL) * CELL - b.r - 0.01
                     : (Math.floor((b.y - b.r) / CELL) + 1) * CELL + b.r + 0.01;
        if (assist && Math.abs(iy) >= Math.abs(ix)) cornerAssist(world, b, 'x', 0, iy > 0 ? 1 : -1, Math.abs(iy));
      }
    }
  }
  return { x: b.x - sx, y: b.y - sy };
}

/** Blocked head-on? Slide along `axis` toward the nearest offset (within ~half a cell) that opens the way. */
function cornerAssist(world, b, axis, dirX, dirY, amount) {
  const probe = 2;
  for (let off = 1; off <= CELL * 0.55; off += 1) {
    for (const sign of [1, -1]) {
      const o = off * sign;
      const x = axis === 'x' ? b.x + o : b.x, y = axis === 'y' ? b.y + o : b.y;
      if (!collides(world, x, y, b.r) && !collides(world, x + dirX * probe, y + dirY * probe, b.r)) {
        const step = Math.sign(o) * Math.min(Math.abs(o), amount);
        if (axis === 'x') b.x += step; else b.y += step;
        if (collides(world, b.x, b.y, b.r)) { if (axis === 'x') b.x -= step; else b.y -= step; }
        return;
      }
    }
  }
}

export class Game {
  constructor({ seed, mode, save, audio, settings = null }) {
    this.audio = audio;
    this.mode = mode;
    this.world = new World(seed, (save && save.vaultSkip) || []);
    const c = this.world.centerPx;
    this.nexus = { x: c.x, y: c.y };
    this.bank = { shard: 0, prism: 0, lumen: 0 };
    this.upgrades = Object.fromEntries(UPGRADES.map(u => [u.id, 0]));
    this.nexusLevels = Object.fromEntries(NEXUS_UPGRADES.map(u => [u.id, 0]));
    this.cargo = { shard: 0, prism: 0, lumen: 0 };
    this.stats = { mined: 0, glitches: 0, time: 0, upgrades: 0, lumen: 0 }; // lumen: ever picked up (S-10 shows ● after the first)
    this.research = {};      // S-11: one-time unlocks, e.g. { scanner: true }
    this.scan = emptyScan(); // S-11: the live ping (never saved)
    this.player = {
      x: c.x, y: c.y + 40, r: PLAYER_R,
      vx: 0, vy: 0,
      targetVx: 0, targetVy: 0,     // intent-derived (unconstrained)
      realizedVx: 0, realizedVy: 0, // what actually happened after collision
      angle: -Math.PI / 2, integrity: 100, invuln: 0, hurtFlash: 0,
    };
    this.beam = { on: false, ex: 0, ey: 0, target: null, enemy: null };
    this.pickups = [];
    this.enemies = [];
    this.particles = [];
    this.floaters = [];
    this.events = [];        // UI-facing notifications
    this.shake = 0;
    this.settings = settings; // live Settings object (S-3); null = all effects on (tools, demo)
    this.depositTimer = 0;
    this.spawnTimer = 3;
    this.depositCount = 0;
    this.depositKinds = new Set(); // kinds moved this Nexus visit -> arpeggio length (S-4)
    this.hitstop = 0;    // real seconds the main loop skips update() for (S-4); tools never read it
    this.lastHitstop = -Infinity;
    this.coreRing = 0;   // 1 -> 0 after a Core Matrix purchase (ring on the core, render.js)
    // S-5 / D-025: gameplay randomness is seeded per draw; visual-only effects (particles, shake) stay on Math.random.
    this.rng = Object.fromEntries(['yield', 'pickup', 'glitch-spawn', 'glitch-wander', 'glitch-loot'].map(k => [k, seededStream(seed, k)]));
    this.vaultSkip = (save && save.vaultSkip) || []; // S-9: fixed for this world's life (D-023)
    if (save) this.load(save);
    this.player.integrity = this.stat('hull');
    if (save && save.integrity != null) this.player.integrity = Math.min(save.integrity, this.stat('hull'));
    this.world.reveal(this.player.x, this.player.y, 230);
    // S-8: the depth ring the core is in. A session toasts each ring once on first entry; the start ring counts as seen.
    this.ringNow = this.coreRingIndex();
    this.ringsSeen = new Set([this.ringNow]);
    this.audio.setRing(this.ringNow);
    this.nexusPulse = 0; // 1 -> 0 after a Nexus Development purchase (ring burst in render.js)
    this.revealQueue = this.world.reveal(this.nexus.x, this.nexus.y, this.nexusLight()); // minimap cells revealed outside update()
  }

  coreRingIndex() { return this.world.ring(Math.floor(this.player.x / CELL), Math.floor(this.player.y / CELL)); }
  ringName() { return RINGS[this.ringNow].name; }

  nexusLight() { return NEXUS_UPGRADES[0].value(this.nexusLevels.radiance); }
  canAffordNexus(id) {
    const u = NEXUS_UPGRADES.find(u => u.id === id), lvl = this.nexusLevels[id];
    if (lvl >= u.max) return false;
    const c = u.cost(lvl);
    return this.bank.shard >= c.shard && this.bank.prism >= c.prism;
  }
  buyNexus(id) {
    if (!this.canAffordNexus(id)) return false;
    const u = NEXUS_UPGRADES.find(u => u.id === id), c = u.cost(this.nexusLevels[id]);
    this.bank.shard -= c.shard; this.bank.prism -= c.prism;
    this.nexusLevels[id]++;
    this.stats.upgrades++;
    this.revealQueue.push(...this.world.reveal(this.nexus.x, this.nexus.y, this.nexusLight()));
    this.audio.upgrade();
    this.burst(this.nexus.x, this.nexus.y, 70, '#ffffff', 420);
    this.nexusPulse = 1;
    return true;
  }

  stat(id) { const u = UPGRADES.find(u => u.id === id); return u.value(this.upgrades[id]); }
  cargoTotal() { return this.cargo.shard + this.cargo.prism + this.cargo.lumen; }
  cargoRoom() { return this.stat('cargo') - this.cargoTotal(); }
  inNexus() { return Math.hypot(this.player.x - this.nexus.x, this.player.y - this.nexus.y) < NEXUS_RADIUS; }

  canAfford(id) {
    const lvl = this.upgrades[id];
    const u = UPGRADES.find(u => u.id === id);
    if (lvl >= u.max) return false;
    const c = upgradeCost(lvl);
    return this.bank.shard >= c.shard && this.bank.prism >= c.prism;
  }
  buy(id) {
    if (!this.canAfford(id)) return false;
    const c = upgradeCost(this.upgrades[id]);
    this.bank.shard -= c.shard; this.bank.prism -= c.prism;
    this.upgrades[id]++;
    this.stats.upgrades++;
    if (id === 'hull') this.player.integrity = this.stat('hull');
    this.audio.upgrade();
    if (this.motionOn()) this.coreRing = 1;
    this.burst(this.nexus.x, this.nexus.y, 40, '#ffffff', 260);
    return true;
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'drift') this.enemies = [];
    this.player.integrity = this.stat('hull');
  }

  // ---------- update ----------
  update(dt, intent) {
    this.stats.time += dt;
    const p = this.player;

    // -- Movement: intent -> target -> realized --
    const speed = this.stat('thrust');
    p.targetVx = intent.move.x * speed;
    p.targetVy = intent.move.y * speed;
    const k = Math.min(1, ACCEL * dt);
    p.vx += (p.targetVx - p.vx) * k;
    p.vy += (p.targetVy - p.vy) * k;
    const moved = moveBody(this.world, p, p.vx * dt, p.vy * dt, true);
    p.realizedVx = moved.x / dt; p.realizedVy = moved.y / dt;
    // Kill velocity into walls so we don't "charge up" against them.
    if (Math.abs(p.realizedVx) < Math.abs(p.vx) * 0.5) p.vx = p.realizedVx;
    if (Math.abs(p.realizedVy) < Math.abs(p.vy) * 0.5) p.vy = p.realizedVy;
    if (Math.hypot(p.realizedVx, p.realizedVy) > 40 && Math.random() < dt * 30) {
      const a = Math.atan2(-p.realizedVy, -p.realizedVx) + (Math.random() - 0.5) * 0.6;
      this.particle(p.x, p.y, Math.cos(a) * 60, Math.sin(a) * 60, 0.35, '#5ad8ff', 2);
    }
    if (intent.aim) {
      const target = Math.atan2(intent.aim.y, intent.aim.x);
      let d = target - p.angle;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      p.angle += d * Math.min(1, dt * 18);
    } else if (Math.hypot(p.vx, p.vy) > 20) {
      const target = Math.atan2(p.vy, p.vx);
      let d = Math.atan2(Math.sin(target - p.angle), Math.cos(target - p.angle));
      p.angle += d * Math.min(1, dt * 8);
    }
    const ring = this.coreRingIndex();
    if (ring !== this.ringNow) {
      this.ringNow = ring;
      this.audio.setRing(ring);
      if (!this.ringsSeen.has(ring)) { this.ringsSeen.add(ring); this.notify('ring'); }
    }
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt);

    updateScan(this, dt);
    if (intent.scan) tryScan(this);
    this.updateBeam(dt, intent);
    this.updatePickups(dt);
    this.updateDeposit(dt);
    if (this.mode === 'surge') this.updateEnemies(dt); else if (this.enemies.length) this.enemies = [];
    this.updateParticles(dt);

    if (this.inNexus()) p.integrity = Math.min(this.stat('hull'), p.integrity + 45 * dt);
    else if (this.mode === 'drift') p.integrity = this.stat('hull');

    this.shake = Math.max(0, this.shake - dt * 30);
    this.nexusPulse = Math.max(0, this.nexusPulse - dt * 1.4);
    this.coreRing = Math.max(0, this.coreRing - dt / CORE_RING_S);
    const newly = this.world.reveal(p.x, p.y, 230);
    if (this.revealQueue.length) { newly.push(...this.revealQueue); this.revealQueue = []; }
    return newly;
  }

  updateBeam(dt, intent) {
    const p = this.player, b = this.beam;
    const was = b.on;
    b.on = !!(intent.fire && intent.aim);
    b.target = null; b.enemy = null;
    if (b.on && !was) this.audio.beamStart();
    this.audio.beam(b.on);
    if (!b.on) return;
    const range = this.stat('range');
    const dx = Math.cos(p.angle), dy = Math.sin(p.angle);
    // Cast from the core's centre so the wall touching the nose is always the first thing hit.
    const hit0 = this.world.raycast(p.x, p.y, dx, dy, range + 12);
    const hit = hit0 && { ...hit0, dist: Math.max(0, hit0.dist - 12) };
    const ox = p.x + dx * 12, oy = p.y + dy * 12;
    let dist = hit ? hit.dist : range;
    // Enemies along the ray, if closer than the wall.
    let best = null;
    for (const e of this.enemies) {
      if (e.fade !== undefined) continue; // a Glitch that gave up can't be targeted (S-6)
      const ex = e.x - ox, ey = e.y - oy;
      const t = ex * dx + ey * dy;
      if (t < 0 || t > dist) continue;
      const perp = Math.abs(ex * dy - ey * dx);
      if (perp < e.r + 4 && (!best || t < best.t)) best = { e, t };
    }
    const dps = this.stat('beam');
    if (best) {
      dist = best.t;
      b.enemy = best.e;
      best.e.hp -= dps * dt * 1.6;
      best.e.flash = 0.08;
      if (Math.random() < dt * 40) this.particle(ox + dx * dist, oy + dy * dist, (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160, 0.3, '#ff7a3d', 2);
    } else if (hit) {
      const res = this.world.hit(hit.x, hit.y, dps * dt);
      b.target = { x: hit.x, y: hit.y, frac: res && !res.broken ? res.frac : 0 };
      if (Math.random() < dt * 45) {
        const col = this.world.look(hit.x, hit.y, res ? res.type : T.ROCK).edge;
        this.particle(ox + dx * dist, oy + dy * dist, (-dx + (Math.random() - 0.5) * 1.6) * 110, (-dy + (Math.random() - 0.5) * 1.6) * 110, 0.35, col, 2);
      }
      if (res && res.broken) this.onCellBroken(hit.x, hit.y, res.type);
    }
    b.ex = ox + dx * dist; b.ey = oy + dy * dist;
  }

  // Reduced motion (S-3) also turns off hitstop and the upgrade ring (S-4); null settings = all effects on.
  motionOn() { return !this.settings || !this.settings.reducedMotion; }

  // Every shake goes through here so the Settings switches (S-3) can turn it off.
  addShake(n) {
    if (this.settings && (!this.settings.shake || this.settings.reducedMotion)) return;
    this.shake = Math.max(this.shake, n);
  }

  onCellBroken(x, y, type) {
    this.stats.mined++;
    const cx = (x + 0.5) * CELL, cy = (y + 0.5) * CELL;
    const mat = MATERIAL[type];
    this.burst(cx, cy, type === T.ROCK ? 8 : 16, this.world.look(x, y, type).edge, 150);
    this.addShake(type === T.ROCK ? 1.5 : 3);
    if (type === T.CACHE) {
      // S-9: a vault cache bursts its loot. Forced past the pickup cap (bounded, once per vault); the broken bit remembers it.
      for (const [kind, n] of Object.entries(VAULT_LOOT)) for (let i = 0; i < n; i++) this.spawnPickup(cx, cy, kind, true);
      this.burst(cx, cy, 40, '#ffffff', 260);
      this.audio.cache();
      if (this.motionOn()) { this.hitstop = HITSTOP_S * 2; this.lastHitstop = this.stats.time; }
      this.notify('cache');
    } else if (mat.yield) {
      const n = mat.yield.min + Math.floor(this.rng.yield() * (mat.yield.max - mat.yield.min + 1));
      for (let i = 0; i < n; i++) this.spawnPickup(cx, cy, mat.yield.kind);
      this.audio.break(mat.yield.kind);
      if (this.motionOn() && this.stats.time - this.lastHitstop >= HITSTOP_GAP_S) { this.hitstop = HITSTOP_S; this.lastHitstop = this.stats.time; }
    } else {
      this.audio.break('rock');
    }
  }

  // `force` skips the cap: the player's own cargo must never vanish on a littered floor (B-005); it is bounded by the hold.
  spawnPickup(x, y, kind, force = false) {
    if (this.pickups.length >= PICKUP_CAP && !force) return;
    const r = this.rng.pickup, a = r() * Math.PI * 2, s = 40 + r() * 90;
    this.pickups.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, kind, age: 0, r: 4 });
  }

  updatePickups(dt) {
    const p = this.player, mag = this.stat('magnet');
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const it = this.pickups[i];
      it.age += dt;
      const dx = p.x - it.x, dy = p.y - it.y, d = Math.hypot(dx, dy);
      const room = this.cargoRoom() > 0;
      if (room && d < mag && it.age > 0.25) {
        const pull = 900 * (1 - d / mag) + 250;
        it.vx += (dx / d) * pull * dt; it.vy += (dy / d) * pull * dt;
        it.vx *= 0.9; it.vy *= 0.9;
      } else {
        it.vx *= Math.pow(0.04, dt); it.vy *= Math.pow(0.04, dt);
      }
      // Pickups respect walls but are allowed to drift on top of the core.
      const nx = it.x + it.vx * dt, ny = it.y + it.vy * dt;
      if (!this.world.solidAtPx(nx, it.y)) it.x = nx; else it.vx *= -0.4;
      if (!this.world.solidAtPx(it.x, ny)) it.y = ny; else it.vy *= -0.4;
      if (d < p.r + 6 && it.age > 0.25) {
        if (room) {
          this.cargo[it.kind]++;
          if (it.kind === 'lumen') this.stats.lumen++;
          this.audio.pickup(it.kind);
          this.pickups.splice(i, 1);
        } else if (d < p.r + 6) {
          this.audio.full();
          this.notify('cargo-full');
        }
      }
    }
  }

  updateDeposit(dt) {
    if (!this.inNexus() || this.cargoTotal() === 0) { this.depositTimer = 0; this.depositKinds.clear(); return; }
    this.depositTimer += dt;
    while (this.depositTimer > 0.035 && this.cargoTotal() > 0) {
      this.depositTimer -= 0.035;
      const kind = KINDS.find(k => this.cargo[k] > 0);
      this.cargo[kind]--; this.bank[kind]++;
      this.audio.deposit(this.depositCount++);
      this.depositKinds.add(kind);
      this.particles.push({ type: 'streak', x: this.player.x, y: this.player.y, tx: this.nexus.x, ty: this.nexus.y, life: 0.4, max: 0.4, color: RESOURCE[kind].color, size: 3 });
      if (this.cargoTotal() === 0) { this.audio.depositDone(this.depositKinds.size); this.depositKinds.clear(); this.notify('deposited'); }
    }
  }

  // ---------- Surge: Glitches ----------
  updateEnemies(dt) {
    const p = this.player;
    const distFromNexus = Math.hypot(p.x - this.nexus.x, p.y - this.nexus.y);
    const maxCount = distFromNexus < NEXUS_RADIUS * 2 ? 1 : Math.min(9, 2 + Math.floor(distFromNexus / 520));
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 2.2 + this.rng['glitch-spawn']() * 1.8;
      if (this.enemies.length < maxCount) this.trySpawnEnemy(distFromNexus);
    }
    const list = this.enemies;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      e.spin += dt * (2 + e.tier);
      e.flash = Math.max(0, e.flash - dt);
      e.hitCd = Math.max(0, e.hitCd - dt);
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (e.fade !== undefined) { // gave up (S-6): drift to a stop and vanish; harmless and lootless
        e.fade -= dt; e.vx *= 0.9; e.vy *= 0.9;
        moveBody(this.world, e, e.vx * dt, e.vy * dt);
        if (e.fade <= 0) list.splice(i, 1);
        continue;
      }
      let tx = 0, ty = 0;
      if (d < 560) { tx = dx / d; ty = dy / d; e.alert = true; }
      else { e.wander += (this.rng['glitch-wander']() - 0.5) * dt * 3; tx = Math.cos(e.wander) * 0.4; ty = Math.sin(e.wander) * 0.4; }
      const nd = Math.hypot(e.x - this.nexus.x, e.y - this.nexus.y);
      if (nd < NEXUS_RADIUS + 40) { // the nexus repels glitches
        tx = (e.x - this.nexus.x) / nd * 1.5; ty = (e.y - this.nexus.y) / nd * 1.5;
        e.hp -= dt * 0.8;
      }
      e.vx += (tx * e.speed - e.vx) * Math.min(1, dt * 3);
      e.vy += (ty * e.speed - e.vy) * Math.min(1, dt * 3);
      moveBody(this.world, e, e.vx * dt, e.vy * dt);
      { // S-6 / D-017: no progress on its best distance to the core for GLITCH_GIVE_UP_S -> give up. Covers wanderers too:
        // they were the real slot-holders (spawned beyond the 560 px alert range, drifting in rock, never alerted).
        if (!(d > (e.best ?? Infinity) - GLITCH_PROGRESS_PX)) { e.best = d; e.stall = 0; }
        else if ((e.stall = (e.stall || 0) + dt) >= GLITCH_GIVE_UP_S) { e.fade = GLITCH_FADE_S; continue; }
      }
      if (d < e.r + p.r && e.hitCd <= 0) {
        e.hitCd = 0.9;
        e.best = d; e.stall = 0; // reaching the core counts as progress, so knockback doesn't start a give-up
        e.vx = -dx / d * 260; e.vy = -dy / d * 260;
        if (p.invuln <= 0) this.hurtPlayer(e.dmg, dx / d, dy / d);
        if (this.enemies !== list) return; // destabilize() replaced the list mid-loop (B-007: indexing on froze the game)
      }
      if (e.hp <= 0) {
        this.stats.glitches++;
        this.burst(e.x, e.y, 22, '#ff7a3d', 220);
        if (this.rng['glitch-loot']() < GLITCH_PRISM_CHANCE) this.spawnPickup(e.x, e.y, 'prism'); // D-018
        for (let j = 0; j < 2 + e.tier; j++) this.spawnPickup(e.x, e.y, 'shard');
        this.audio.enemyDie();
        this.addShake(4);
        this.enemies.splice(i, 1);
        continue;
      }
      if (d > 1500) this.enemies.splice(i, 1);
    }
  }

  trySpawnEnemy(distFromNexus) {
    const p = this.player;
    for (let tries = 0; tries < 12; tries++) {
      const rs = this.rng['glitch-spawn'], a = rs() * Math.PI * 2, r = 480 + rs() * 260;
      const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
      if (Math.hypot(x - this.nexus.x, y - this.nexus.y) < NEXUS_RADIUS * 2.2) continue;
      const probe = { x, y, r: ENEMY_R };
      if (collides(this.world, x, y, ENEMY_R)) continue;
      const tier = Math.min(3, Math.floor(distFromNexus / 900));
      this.enemies.push({
        ...probe, vx: 0, vy: 0, tier,
        hp: 1.2 + tier * 1.1, maxHp: 1.2 + tier * 1.1,
        speed: 120 + tier * 22, dmg: 14 + tier * 6,
        spin: 0, flash: 0, hitCd: 0.5, wander: a, alert: false,
      });
      return;
    }
  }

  hurtPlayer(amount, dx, dy) {
    if (this.god) return; // dev god mode (S-7); never saved
    const p = this.player;
    p.integrity -= amount;
    p.invuln = 0.5; p.hurtFlash = 0.3;
    p.vx += dx * 320; p.vy += dy * 320;
    this.addShake(8);
    this.audio.hurt();
    if (p.integrity <= 0) this.destabilize();
  }

  destabilize() {
    const p = this.player;
    // Cargo isn't destroyed — it scatters where you fell, so a retrieval run is possible.
    for (const kind of KINDS) for (let i = 0; i < this.cargo[kind]; i++) this.spawnPickup(p.x, p.y, kind, true);
    this.cargo = { shard: 0, prism: 0, lumen: 0 };
    this.burst(p.x, p.y, 50, '#ffffff', 300);
    p.x = this.nexus.x; p.y = this.nexus.y + 40; p.vx = p.vy = 0;
    p.integrity = this.stat('hull'); p.invuln = 2;
    this.enemies = this.enemies.filter(e => Math.hypot(e.x - this.nexus.x, e.y - this.nexus.y) > 900);
    this.notify('destabilized');
  }

  // ---------- particles ----------
  particle(x, y, vx, vy, life, color, size) {
    if (this.particles.length >= PARTICLE_CAP) return;
    this.particles.push({ type: 'dot', x, y, vx, vy, life, max: life, color, size });
  }
  burst(x, y, n, color, speed) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
      this.particle(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.3 + Math.random() * 0.5, color, 1.5 + Math.random() * 2);
    }
  }
  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const q = this.particles[i];
      q.life -= dt;
      if (q.life <= 0) { this.particles.splice(i, 1); continue; }
      if (q.type === 'dot') { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.92; q.vy *= 0.92; }
    }
  }

  notify(kind) {
    if (!this.events.includes(kind)) this.events.push(kind);
  }

  // ---------- persistence ----------
  toSave() {
    return {
      v: SAVE_FORMAT, seed: this.world.seed, mode: this.mode,
      bank: { ...this.bank }, cargo: { ...this.cargo }, upgrades: { ...this.upgrades }, nexus: { ...this.nexusLevels }, research: { ...this.research }, stats: { ...this.stats },
      player: { x: Math.round(this.player.x), y: Math.round(this.player.y) }, integrity: Math.round(this.player.integrity),
      broken: packBits(this.world.broken), explored: packBits(this.world.explored), vaultSkip: [...this.vaultSkip],
      pickups: this.pickups.map(q => [KINDS.indexOf(q.kind), Math.round(q.x), Math.round(q.y)]), // B-011: loot on the floor survives reload
    };
  }
  load(s) {
    const w = this.world, n = w.w * w.h;
    w.broken = unpackBits(s.broken, n);
    w.explored = unpackBits(s.explored, n);
    for (let i = 0; i < n; i++) if (w.broken[i]) w.cells[i] = T.EMPTY;
    Object.assign(this.bank, s.bank);
    Object.assign(this.cargo, s.cargo);
    for (const k of Object.keys(this.upgrades)) if (s.upgrades && s.upgrades[k] != null) this.upgrades[k] = s.upgrades[k];
    for (const k of Object.keys(this.nexusLevels)) if (s.nexus && s.nexus[k] != null) this.nexusLevels[k] = s.nexus[k];
    Object.assign(this.stats, s.stats || {});
    Object.assign(this.research, s.research || {});
    if (s.player && !collides(w, s.player.x, s.player.y, PLAYER_R)) { this.player.x = s.player.x; this.player.y = s.player.y; }
    for (const [k, x, y] of s.pickups || []) this.pickups.push({ x, y, vx: 0, vy: 0, kind: KINDS[k] || 'shard', age: 1, r: 4 });
  }
}
