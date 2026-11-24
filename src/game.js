// Simulation: the core (player), beam, pickups, deposit, particles. Glitches: glitch.js; grid movement: body.js.
// State flow mirrors the old movement lab lesson: intent -> target velocity -> collision-resolved realized velocity.
import { CELL, NEXUS_RADIUS, NEXUS_HEAL, GLITCH_FIRST_SPAWN_S, HITSTOP_S, HITSTOP_GAP_S, PICKUP_CAP, CORE_RING_S, MATERIAL, RINGS, UPGRADES, NEXUS_UPGRADES, upgradeCost, T, VAULT_LOOT, KINDS, RESOURCE, BEAM_MODES, BEACON_STOCK,
  PLAYER_ACCEL, PLAYER_R, PARTICLE_CAP, CORE_REVEAL, SPAWN_OFFSET, ATTRACT_PULL, PICKUP_SETTLE_S, DEPOSIT_TICK_S, HURT_INVULN_S, HURT_KNOCKBACK,
  RESPAWN_INVULN_S, RESPAWN_CLEAR_PX } from './config.js';
import { World, packBits, unpackBits, seededStream } from './world.js';
import { SAVE_FORMAT } from './save.js';
import { tryScan, updateScan, emptyScan } from './research.js';
import { castBeam, cycleBeamMode, validMode, updatePulse } from './beam.js';
import { collides, moveBody } from './body.js';
import { updateGlitches } from './glitch.js';
import { tryPlace, loadBeacons } from './craft.js';
import { chooseSpires, loadSpires, stampSpires } from './spire.js';


export class Game {
  constructor({ seed, mode, save, audio, settings = null }) {
    this.audio = audio;
    this.mode = mode;
    const skip = save && Array.isArray(save.vaultSkip) ? save.vaultSkip : []; // B-037: a save is never trusted to be well-formed
    this.world = new World(seed, skip);
    // S-19 (D-049): the saved Spires, or chosen now from the seed (+ what an old/malformed save has seen, D-024).
    this.spires = (save && loadSpires(save.spires)) || chooseSpires(seed, save && save.explored, save && save.broken);
    stampSpires(this.world, this.spires);
    const c = this.world.centerPx;
    this.nexus = { x: c.x, y: c.y };
    this.bank = { shard: 0, prism: 0, lumen: 0 };
    this.upgrades = Object.fromEntries(UPGRADES.map(u => [u.id, 0]));
    this.nexusLevels = Object.fromEntries(NEXUS_UPGRADES.map(u => [u.id, 0]));
    this.cargo = { shard: 0, prism: 0, lumen: 0 };
    this.stats = { mined: 0, glitches: 0, time: 0, upgrades: 0, lumen: 0 }; // lumen: ever picked up (S-10 shows ● after the first)
    this.research = {};      // S-11: one-time unlocks, e.g. { scanner: true }
    this.scan = emptyScan(); // S-11: the live ping (never saved)
    this.craft = { beacon: 0 }; // S-16: crafted, not yet placed
    this.beacons = [];          // S-16: placed, [{ i, x, y, r }] (craft.js); also the Renderer's lightSets[0] (light.js)
    this.placeResult = null;    // S-16: last placement outcome, read by the HUD toast
    this.player = {
      x: c.x, y: c.y + SPAWN_OFFSET, r: PLAYER_R,
      vx: 0, vy: 0,
      targetVx: 0, targetVy: 0,     // intent-derived (unconstrained)
      realizedVx: 0, realizedVy: 0, // what actually happened after collision
      angle: -Math.PI / 2, invuln: 0, hurtFlash: 0, // integrity: set from the hull stat below
    };
    this.beam = { on: false, ex: 0, ey: 0, target: null, enemy: null, rays: [], charge: 0, recover: 0, flash: 0, flashMax: 1, flashLine: null }; // S-14: Pulse state
    this.beamMode = 'focus'; // S-13: intent; castBeam realizes it as beam.rays
    this.pickups = [];
    this.enemies = [];
    this.particles = [];
    this.floaters = [];
    this.events = [];        // UI-facing notifications
    this.shake = 0;
    this.settings = settings; // live Settings object (S-3); null = all effects on (tools, demo)
    this.depositTimer = 0;
    this.spawnTimer = GLITCH_FIRST_SPAWN_S;
    this.depositCount = 0;
    this.depositKinds = new Set(); // kinds moved this Nexus visit -> arpeggio length (S-4)
    this.hitstop = 0;    // real seconds the main loop skips update() for (S-4); tools never read it
    this.lastHitstop = -Infinity;
    this.coreRing = 0;   // 1 -> 0 after a Core Matrix purchase (ring on the core, render.js)
    // S-5 / D-025: gameplay randomness is seeded per draw; visual-only effects (particles, shake) stay on Math.random.
    this.rng = Object.fromEntries(['yield', 'pickup', 'glitch-spawn', 'glitch-wander', 'glitch-loot'].map(k => [k, seededStream(seed, k)]));
    this.vaultSkip = skip; // S-9: fixed for this world's life (D-023)
    if (save) this.load(save);
    this.player.integrity = this.stat('hull');
    if (save && save.integrity != null) this.player.integrity = Math.min(save.integrity, this.stat('hull'));
    this.world.reveal(this.player.x, this.player.y, CORE_REVEAL);
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
    const k = Math.min(1, PLAYER_ACCEL * dt);
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
    if (intent.beamMode && cycleBeamMode(this)) this.notify('beam-mode');
    if (intent.place) tryPlace(this); // S-16
    this.updateBeam(dt, intent);
    this.updatePickups(dt);
    this.updateDeposit(dt);
    if (this.mode === 'surge') this.updateEnemies(dt); else if (this.enemies.length) this.enemies = [];
    this.updateParticles(dt);

    if (this.inNexus()) p.integrity = Math.min(this.stat('hull'), p.integrity + NEXUS_HEAL * dt);
    else if (this.mode === 'drift') p.integrity = this.stat('hull');

    this.shake = Math.max(0, this.shake - dt * 30);
    this.nexusPulse = Math.max(0, this.nexusPulse - dt * 1.4);
    this.coreRing = Math.max(0, this.coreRing - dt / CORE_RING_S);
    const newly = this.world.reveal(p.x, p.y, CORE_REVEAL);
    if (this.revealQueue.length) { newly.push(...this.revealQueue); this.revealQueue = []; }
    return newly;
  }

  updateBeam(dt, intent) {
    const p = this.player, b = this.beam;
    const was = b.on;
    const held = !!(intent.fire && intent.aim);
    b.target = null; b.enemy = null; b.rays = [];
    b.flash = Math.max(0, b.flash - dt);
    if (BEAM_MODES[this.beamMode] && BEAM_MODES[this.beamMode].pulse) { // S-14: no continuous beam, no hum; charge -> burst
      b.on = false; this.audio.beam(false);
      updatePulse(this, dt, held, !!intent.cancel);
      return;
    }
    b.charge = 0; b.recover = 0;
    b.on = held;
    if (b.on && !was) this.audio.beamStart();
    this.audio.beam(b.on);
    if (!b.on) return;
    castBeam(this, dt);
    this.audio.beamContact(!!(b.target || b.enemy));
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
    this.burst(cx, cy, type === T.ROCK ? 8 : 16, this.world.look(x, y, type).edge, 150);
    this.addShake(type === T.ROCK ? 1.5 : 3);
    if (type === T.CACHE) {
      // S-9: a vault cache bursts its loot. Forced past the pickup cap (bounded, once per vault); the broken bit remembers it.
      for (const [kind, n] of Object.entries(VAULT_LOOT)) for (let i = 0; i < n; i++) this.spawnPickup(cx, cy, kind, true);
      this.burst(cx, cy, 40, '#ffffff', 260);
      this.audio.cache();
      if (this.motionOn()) { this.hitstop = HITSTOP_S * 2; this.lastHitstop = this.stats.time; }
      this.notify('cache');
    } else if (MATERIAL[type].yield) {
      const mat = MATERIAL[type];
      const n = mat.yield.min + Math.floor(this.rng.yield() * (mat.yield.max - mat.yield.min + 1));
      for (let i = 0; i < n; i++) this.spawnPickup(cx, cy, mat.yield.kind);
      this.audio.break(mat.yield.kind);
      if (this.motionOn() && this.stats.time - this.lastHitstop >= HITSTOP_GAP_S) { this.hitstop = HITSTOP_S; this.lastHitstop = this.stats.time; }
    } else {
      this.audio.break('rock');
    }
  }

  // `force` tags a pickup `kept`: the player's own cargo and cache loot never vanish (B-005) and never count toward the cap.
  // At PICKUP_CAP loose pickups the oldest loose one makes room, so a fresh break always yields (B-022).
  spawnPickup(x, y, kind, force = false) {
    if (!force) {
      let loose = 0;
      for (const q of this.pickups) if (!q.kept) loose++;
      if (loose >= PICKUP_CAP) this.pickups.splice(this.pickups.findIndex(q => !q.kept), 1);
    }
    const r = this.rng.pickup, a = r() * Math.PI * 2, s = 40 + r() * 90;
    this.pickups.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, kind, age: 0, r: 4, kept: force });
  }

  updatePickups(dt) {
    const p = this.player, mag = this.stat('magnet');
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const it = this.pickups[i];
      it.age += dt;
      const dx = p.x - it.x, dy = p.y - it.y, d = Math.hypot(dx, dy);
      const room = this.cargoRoom() > 0;
      if (room && d < mag && it.age > PICKUP_SETTLE_S) {
        const pull = ATTRACT_PULL[0] * (1 - d / mag) + ATTRACT_PULL[1];
        it.vx += (dx / d) * pull * dt; it.vy += (dy / d) * pull * dt;
        it.vx *= 0.9; it.vy *= 0.9;
      } else {
        it.vx *= Math.pow(0.04, dt); it.vy *= Math.pow(0.04, dt);
      }
      // Pickups respect walls but are allowed to drift on top of the core.
      const nx = it.x + it.vx * dt, ny = it.y + it.vy * dt;
      if (!this.world.solidAtPx(nx, it.y)) it.x = nx; else it.vx *= -0.4;
      if (!this.world.solidAtPx(it.x, ny)) it.y = ny; else it.vy *= -0.4;
      if (d < p.r + 6 && it.age > PICKUP_SETTLE_S) {
        if (room) {
          this.cargo[it.kind]++;
          if (it.kind === 'lumen') this.stats.lumen++;
          this.audio.pickup(it.kind);
          this.pickups.splice(i, 1);
        } else if (!this.inNexus()) { // B-033: in the Nexus the deposit makes room this frame; no "return to the Nexus"
          this.audio.full();
          this.notify('cargo-full');
        }
      }
    }
  }

  updateDeposit(dt) {
    if (!this.inNexus() || this.cargoTotal() === 0) { this.depositTimer = 0; this.depositKinds.clear(); return; }
    this.depositTimer += dt;
    while (this.depositTimer > DEPOSIT_TICK_S && this.cargoTotal() > 0) {
      this.depositTimer -= DEPOSIT_TICK_S;
      const kind = KINDS.find(k => this.cargo[k] > 0);
      this.cargo[kind]--; this.bank[kind]++;
      this.audio.deposit(this.depositCount++);
      this.depositKinds.add(kind);
      this.particles.push({ type: 'streak', x: this.player.x, y: this.player.y, tx: this.nexus.x, ty: this.nexus.y, life: 0.4, max: 0.4, color: RESOURCE[kind].color, size: 3 });
      if (this.cargoTotal() === 0) { this.audio.depositDone(this.depositKinds.size); this.depositKinds.clear(); this.notify('deposited'); }
    }
  }

  // ---------- Surge: Glitches (src/glitch.js) ----------
  updateEnemies(dt) { updateGlitches(this, dt); }

  hurtPlayer(amount, dx, dy) {
    if (this.god) return; // dev god mode (S-7); never saved
    const p = this.player;
    p.integrity -= amount;
    p.invuln = HURT_INVULN_S; p.hurtFlash = 0.3;
    p.vx += dx * HURT_KNOCKBACK; p.vy += dy * HURT_KNOCKBACK;
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
    p.x = this.nexus.x; p.y = this.nexus.y + SPAWN_OFFSET; p.vx = p.vy = 0;
    p.integrity = this.stat('hull'); p.invuln = RESPAWN_INVULN_S; this.beam.charge = 0;
    this.enemies = this.enemies.filter(e => Math.hypot(e.x - this.nexus.x, e.y - this.nexus.y) > RESPAWN_CLEAR_PX);
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
      bank: { ...this.bank }, cargo: { ...this.cargo }, upgrades: { ...this.upgrades }, nexus: { ...this.nexusLevels }, research: { ...this.research }, beamMode: this.beamMode, craft: { ...this.craft }, beacons: this.beacons.map(b => b.i), stats: { ...this.stats },
      player: { x: Math.round(this.player.x), y: Math.round(this.player.y) }, integrity: Math.round(this.player.integrity),
      broken: packBits(this.world.broken), explored: packBits(this.world.explored), vaultSkip: [...this.vaultSkip],
      spires: this.spires.map(q => ({ ...q, ...(q.keep ? { keep: [...q.keep] } : {}) })), // S-19: the whole M5 record (D-063)
      pickups: this.pickups.map(q => [KINDS.indexOf(q.kind), Math.round(q.x), Math.round(q.y), q.kept ? 1 : 0]), // B-011, B-022
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
    this.craft.beacon = Math.min(BEACON_STOCK, Math.max(0, Math.floor(Number(s.craft && s.craft.beacon)) || 0)); // S-16; B-038 clamp
    loadBeacons(this, s.beacons);
    this.beamMode = validMode(this, s.beamMode); // S-13: a mode that isn't unlocked loads as Focus
    if (s.player && !collides(w, s.player.x, s.player.y, PLAYER_R)) { this.player.x = s.player.x; this.player.y = s.player.y; }
    for (const [k, x, y, kp] of (Array.isArray(s.pickups) ? s.pickups : []).filter(Array.isArray)) this.pickups.push({ x, y, vx: 0, vy: 0, kind: KINDS[k] || 'shard', age: 1, r: 4, kept: kp === 1 });
  }
}
