// Simulation: the core (player), beam, pickups, deposit, particles. Glitches: glitch.js; grid movement: body.js.
// State flow mirrors the old movement lab lesson: intent -> target velocity -> collision-resolved realized velocity.
import { WORLD_SIZE_NEW, CELL, NEXUS_RADIUS, NEXUS_HEAL, GLITCH_FIRST_SPAWN_S, HITSTOP_S, HITSTOP_GAP_S, PICKUP_CAP, CORE_RING_S, NEXUS_FLASH_S, MATERIAL, RINGS, UPGRADES, NEXUS_UPGRADES, matrixCost, T, VAULT_LOOT, KINDS, emptyKinds, RESOURCE, BEAM_MODES, BEACON_STOCK, RELAY_STOCK, HEATSINK_STOCK, WARD_STOCK, DECOY_STOCK, RELAY_STREAK_PX,
  PLAYER_ACCEL, PLAYER_R, PARTICLE_CAP, CORE_REVEAL, SPAWN_OFFSET, ATTRACT_PULL, PICKUP_SETTLE_S, DEPOSIT_TICK_S, HURT_INVULN_S, HURT_KNOCKBACK,
  RESPAWN_INVULN_S, RESPAWN_CLEAR_PX, NEXUS_HUES } from './config.js';
import { World, packBits, unpackBits, seededStream } from './world.js';
import { SAVE_FORMAT } from './save.js';
import { tryScan, updateScan, emptyScan } from './research.js';
import { updateEcho, cycleEchoOrder, validOrder } from './echo.js';
import { validEchoLevels } from './echolevels.js';
import { castBeam, cycleBeamMode, validMode, updatePulse } from './beam.js';
import { collides, moveBody } from './body.js';
import { updateGlitches } from './glitch.js';
import { updateWake, failWake } from './wake.js';
import { checkEnding, recordCycle } from './ending.js';
import { makeWeather, updateWeather, auroraBonus } from './weather.js';
import { makeRift, updateRift, riftBonus, callRift } from './rift.js';
import { makeUndertow, updateUndertow, pickupDrift } from './undertow.js';
import { makeBurrow, updateBurrower, clearBurrower } from './burrower.js';
import { makeSwarm, updateSwarm, clearSwarm } from './mote.js';
import { makeHunt, updateHunters, clearHunters } from './hunter.js';
import { makeHeat, updateHeat, overheated } from './heat.js';
import { shatter } from './shatter.js';
import { makeVents, updateVents } from './vent.js';
import { makeLocks, updateLocks } from './lock.js';
import { makeBosses, stampBosses, updateBosses, healBosses } from './boss.js';
import { tryPlace, loadBeacons, loadRelays, relayAt, PLACE_KINDS } from './craft.js';
import { loadSinks, sinksOn } from './heatsink.js';
import { loadWards, updateWards } from './ward.js';
import { loadDecoys, updateDecoys } from './decoy.js';
import { chartOn } from './chart.js';
import { makeAnomalies, loadAnomalies, updateAnomalies, endBuffs, buffMul } from './anomaly.js';
import { spireHere, chooseSpires, loadSpires, stampSpires, markSpiresSeen, spiresSeen, updateSpireFeed, updateFacetAim, spireLight } from './spire.js';


/** S-29 records from a save or a carried cycle: an object with `best` only if a finite number ≥ 0, `cycles` only if an
 *  object (B-057: junk crashed the ending; a negative or text best showed on the title). */
export function cleanRecords(r) {
  const out = {};
  if (!r || typeof r !== 'object' || Array.isArray(r)) return out;
  if (Number.isFinite(r.best) && r.best >= 0) out.best = r.best;
  if (r.cycles && typeof r.cycles === 'object' && !Array.isArray(r.cycles)) out.cycles = { ...r.cycles };
  return out;
}

export class Game {
  /** `size` (S-45): cells per side of a new world; a save brings its own (`upgradeSave` checked it). */
  constructor({ seed, mode, save, audio, settings = null, size = WORLD_SIZE_NEW }) {
    this.audio = audio;
    this.mode = mode;
    const skip = save && Array.isArray(save.vaultSkip) ? save.vaultSkip : []; // B-037: a save is never trusted to be well-formed
    this.world = new World(seed, skip, save && save.size ? save.size : size);
    const W = this.world.w;
    // S-19 (D-049): the saved Spires, or chosen now from the seed (+ what an old/malformed save has seen, D-024).
    this.spires = (save && loadSpires(save.spires, W, W)) || chooseSpires(seed, save && save.explored, save && save.broken, W, W);
    this.anomaly = makeAnomalies(this.world, this.spires); // S-35: sites from the generated terrain, before the stamp (seed-only)
    this.vents = makeVents(this.world, this.anomaly.sites); // S-48b: Kiln flare vents (seed-only, never saved)
    makeLocks(this); // S-58: Kiln outer vaults are Flare Locks (seed-only, never saved; hooks world.hitMul)
    makeBosses(this); // S-60a: seed-only boss lairs (drawn last); stamped below, after a save's broken cells
    this.buffs = [];       // S-35: active Anomaly buff ids (saved); they end at the next deposit that banks ≥ 1 item
    stampSpires(this.world, this.spires);
    this.spireLights = this.spires.filter(s => s.lit).map(spireLight); // S-28: the Renderer's lightSets[2]
    this.cycle = 0; this.records = {}; // S-29: carried into every New Cycle (records: { best, cycles: { n: { time, drift, surge } } })
    this.ended = false; this.endedAt = null; this.endSeq = null; // S-24: saved / saved (time of 5/5) / the running sequence
    this.wake = null; this.wakeBlock = null; // S-23: the running Wake (never saved) / the Spire a failed one waits to be left
    this.facetAim = null; // S-28: { s, k, t, done } while the aim ray rests on a primed facet (spire.js)
    const c = this.world.centerPx;
    this.nexus = { x: c.x, y: c.y };
    this.bank = emptyKinds();
    this.upgrades = Object.fromEntries(UPGRADES.map(u => [u.id, 0]));
    this.nexusLevels = Object.fromEntries(NEXUS_UPGRADES.map(u => [u.id, 0]));
    this.cargo = emptyKinds();
    this.stats = { mined: 0, glitches: 0, time: 0, upgrades: 0, lumen: 0, tide: 0, calx: 0 }; // lumen / tide / calx: ever picked up (the HUD shows a chip after the first)
    this.research = {};      // S-11: one-time unlocks, e.g. { scanner: true }
    this.scan = emptyScan(); // S-11: the live ping (never saved)
    this.craft = { beacon: 0, relay: 0, sink: 0, ward: 0, decoy: 0, last: 'beacon' }; // S-16, S-22: crafted, not yet placed; `last` = what B / ✦ places
    this.beacons = [];          // S-16: placed, [{ i, x, y, r }] (craft.js); also the Renderer's lightSets[0] (light.js)
    this.sinks = [];            // S-51: placed Heat Sinks, [{ i, x, y }] (heatsink.js)
    this.wards = [];            // S-56: placed Wards, [{ i, x, y, t, shot }] (ward.js)
    this.decoys = [];           // S-77a: placed Decoys, [{ i, x, y, hold }] (decoy.js)
    this.relays = [];           // S-22: placed, [{ i, x, y, r, glow }]; the Renderer's lightSets[1]
    this.placeResult = null;    // S-16: last placement outcome, read by the HUD toast
    this.player = {
      x: c.x, y: c.y + SPAWN_OFFSET, r: PLAYER_R,
      vx: 0, vy: 0,
      targetVx: 0, targetVy: 0,     // intent-derived (unconstrained)
      realizedVx: 0, realizedVy: 0, // what actually happened after collision
      angle: -Math.PI / 2, invuln: 0, hurtFlash: 0, // integrity: set from the hull stat below
    };
    this.beam = { on: false, ex: 0, ey: 0, target: null, enemy: null, rays: [], charge: 0, recover: 0, flash: 0, flashMax: 1, flashLine: null, facetLatch: null, midEnemy: false }; // S-14: Pulse state
    this.echo = null; // S-42: the live Echo (echo.js) once research.echo; never saved
    this.echoOrder = 'gather'; // S-43: 'gather' | 'guard' | 'auto' (S-69: Mine / Defend / Auto; saved; buying the Echo sets 'auto')
    this.echoLevels = validEchoLevels(); // S-70: Focus / Volley / Tether 0…2 (echolevels.js; saved)
    this.beamMode = 'focus'; // S-13: intent; castBeam realizes it as beam.rays
    this.pickups = [];
    this.enemies = [];
    this.bolts = []; // S-32: Spitter bolts in flight (spitter.js); never saved
    this.particles = [];
    this.floaters = [];
    this.events = [];        // UI-facing notifications
    this.shake = 0;
    this.settings = settings; // live Settings object (S-3); null = all effects on (tools, demo)
    this.depositTimer = 0;
    this.feedTimer = 0;      // S-20: time toward the next ▲ fed to a Spire (spire.js)
    this.spawnTimer = GLITCH_FIRST_SPAWN_S;
    this.depositCount = 0;
    this.depositKinds = new Set(); // kinds moved this Nexus visit -> arpeggio length (S-4)
    this.hitstop = 0;    // real seconds the main loop skips update() for (S-4); tools never read it
    this.lastHitstop = -Infinity;
    this.coreRing = 0;   // 1 -> 0 after a Core Matrix purchase (ring on the core, render.js)
    // S-5 / D-025: gameplay randomness is seeded per draw; visual-only effects (particles, shake) stay on Math.random.
    this.rng = Object.fromEntries(['yield', 'pickup', 'glitch-spawn', 'glitch-wander', 'glitch-loot', 'burrower', 'burrower-loot', 'swarm', 'swarm-loot', 'crucible', 'gyre', 'gyre-swarm', 'tracer', 'pincer'].map(k => [k, seededStream(seed, k)]));
    this.undertow = makeUndertow(this.world); // S-47: Shoal currents from the seed (never saved)
    this.burrow = makeBurrow(); // S-53: the Kiln Burrower (never saved)
    this.swarm = makeSwarm(); // S-54: the Shoal mote swarm (never saved)
    this.hunters = []; this.hunt = makeHunt(this); this.flow = null; // S-72: Tracers + the core's flow field (hunter.js, flow.js; never saved)
    this.heat = 0; this.heatState = makeHeat(); // S-48a: Kiln beam heat (heat.js); never saved
    this.weather = makeWeather(seed); // S-33: schedule from seed + stats.time (weather.js); only `cancel` is saved (B-081)
    this.rift = makeRift(seed); // S-57a: schedule from seed + stats.time (rift.js); never saved, a reload mid-rift skips it
    this.vaultSkip = skip; // S-9: fixed for this world's life (D-023)
    if (save) { this.load(save); markSpiresSeen(this); const h = spireHere(this); this.wakeBlock = h && !h.lit && h.mask !== null ? h : null; } // S-23: a reload mid-Wake is a failed one (B-049: only a primed Spire) // S-27: a footprint explored before v0.2.52 is seen, silently
    stampBosses(this, save && save.bosses, !!save); // S-60a: every plate restored; a lair new to an old save refunds what is in it
    this.player.integrity = this.stat('hull');
    if (save && save.integrity != null) this.player.integrity = Math.min(save.integrity, this.stat('hull'));
    this.world.reveal(this.player.x, this.player.y, CORE_REVEAL);
    // S-8: the depth ring the core is in. A session toasts each ring once on first entry; the start ring counts as seen.
    this.ringNow = this.coreRingIndex();
    this.ringsSeen = new Set([this.ringNow]);
    this.audio.setRing(this.ringNow);
    this.nexusPulse = 0; // 1 -> 0 after a Nexus Development purchase (ring burst in render.js)
    this.nexusFlash = 0; // S-65: 1 -> 0 after any Nexus purchase (the S-4 upgrade ring, at the Nexus; nexusview.js)
    this.revealQueue = this.world.reveal(this.nexus.x, this.nexus.y, this.nexusLight()); // minimap cells revealed outside update()
    if (save) checkEnding(this); // S-24: a save that lit every Spire before the ending existed gets it now
    if (this.ended && Number.isFinite(this.endedAt) && !(this.records.cycles && this.records.cycles[this.cycle])) recordCycle(this); // B-058: ended before records existed
  }

  /** S-29: the Nexus's hue this cycle ('r, g, b'). */
  nexusHue() { return NEXUS_HUES[this.cycle % NEXUS_HUES.length]; }

  coreRingIndex() { return this.world.ring(Math.floor(this.player.x / CELL), Math.floor(this.player.y / CELL)); }
  ringName() { return RINGS[this.ringNow].name; }

  nexusLight() { return NEXUS_UPGRADES[0].value(this.nexusLevels.radiance); }
  canAffordNexus(id) {
    const u = NEXUS_UPGRADES.find(u => u.id === id), lvl = this.nexusLevels[id];
    if (lvl >= u.max) return false;
    if (u.kiln && !chartOn(this)) return false; // S-52: the Chart row exists only in a world with a Kiln
    const c = u.cost(lvl);
    return KINDS.every(k => this.bank[k] >= (c[k] || 0));
  }
  buyNexus(id) {
    if (!this.canAffordNexus(id)) return false;
    const u = NEXUS_UPGRADES.find(u => u.id === id), c = u.cost(this.nexusLevels[id]);
    for (const k of KINDS) this.bank[k] -= c[k] || 0;
    this.nexusLevels[id]++;
    this.stats.upgrades++;
    this.audio.upgrade();
    this.burst(this.nexus.x, this.nexus.y, 70, '#ffffff', 420);
    if (this.motionOn()) this.nexusFlash = 1; // S-65: the upgrade ring plays at the Nexus, not the core
    if (id !== 'radiance') return true; // S-52 Chart: no light, no sweep
    this.revealQueue.push(...this.world.reveal(this.nexus.x, this.nexus.y, this.nexusLight()));
    this.nexusPulse = 1;
    return true;
  }

  stat(id) { const u = UPGRADES.find(u => u.id === id), v = u.value(this.upgrades[id]) * buffMul(this, id); return id === 'cargo' ? Math.floor(v) : v; } // S-35: × active buffs; S-36: Ballast's cargo rounds down
  cargoTotal() { let n = 0; for (const k of KINDS) n += this.cargo[k]; return n; }
  cargoRoom() { return this.stat('cargo') - this.cargoTotal(); }
  inNexus() { return Math.hypot(this.player.x - this.nexus.x, this.player.y - this.nexus.y) < NEXUS_RADIUS; }
  /** Where cargo banks: the Nexus ring or a Relay's (S-22). Healing, the Matrix and Glitch repel stay the Nexus's alone. */
  atDeposit() { return this.inNexus() || !!relayAt(this); }

  /** S-50: the highest level of a Core Matrix upgrade here: max, + its Overdrive levels in a 256 world. */
  topLevel(u) { return u.max + (this.world.profile.overdrive ? u.over : 0); }
  canAfford(id) {
    const lvl = this.upgrades[id];
    const u = UPGRADES.find(u => u.id === id);
    if (lvl >= this.topLevel(u)) return false;
    const c = matrixCost(u, lvl);
    return KINDS.every(k => this.bank[k] >= (c[k] || 0));
  }
  buy(id) {
    if (!this.canAfford(id)) return false;
    const c = matrixCost(UPGRADES.find(u => u.id === id), this.upgrades[id]);
    for (const k of KINDS) this.bank[k] -= c[k] || 0;
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
    if (mode === 'drift') { this.enemies = []; this.bolts = []; }
    clearBurrower(this); // S-53: it hunts by mode, so a switch sends it away
    clearSwarm(this); // S-54: likewise
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
    const u = updateUndertow(this, dt); // S-47: the Shoal current joins the realized move only (intent untouched)
    const moved = moveBody(this.world, p, (p.vx + u.vx) * dt, (p.vy + u.vy) * dt, true);
    p.realizedVx = moved.x / dt; p.realizedVy = moved.y / dt;
    // Kill velocity into walls so we don't "charge up" against them (the core's own part; never flipped by a current).
    const ownX = p.realizedVx - u.vx, ownY = p.realizedVy - u.vy;
    if (Math.abs(p.realizedVx) < Math.abs(p.vx + u.vx) * 0.5) p.vx = u.vx && p.vx * ownX <= 0 ? 0 : ownX;
    if (Math.abs(p.realizedVy) < Math.abs(p.vy + u.vy) * 0.5) p.vy = u.vy && p.vy * ownY <= 0 ? 0 : ownY;
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
    if (intent.echoOrder && cycleEchoOrder(this)) this.notify('echo-order'); // S-43
    if (intent.call && this.nexusLevels.lens) { this.callResult = callRift(this); if (this.callResult) this.notify('rift-call'); } // S-63: a refusal says why
    this.updateBeam(dt, intent);
    updateWards(this, dt); // S-56: after the beam, before the creatures' passes, so a Ward kill pays this frame
    updateVents(this); // S-48b: after the beam, so a flare's +heat never meets this frame's cooling
    updateLocks(this); // S-58: the same, for a Flare Lock's window flare
    updateBosses(this, dt); // S-60a: the boss core's flare (S-60b: awake in Surge, embers)
    updateBurrower(this, dt); // S-53: after the beam, so a kill on its last surfaced frame pays
    updateSwarm(this, dt); // S-54: after the beam, so a mote beamed this frame pays before it touches anything
    updateDecoys(this, dt); // S-77a: a held Decoy's clock, before the hunters steer
    updateHunters(this, dt); // S-72: both modes, after the beam (a kill this frame pays first)
    updateEcho(this, dt); // S-42: after the beam, so it knows whether the core is mining
    this.updatePickups(dt);
    this.updateDeposit(dt);
    updateAnomalies(this, dt); // S-35: after the deposit, so a buff taken this frame is never ended by it
    updateSpireFeed(this, dt); // S-20: ▲ into a dormant Spire's interior, cargo then bank (D-070)
    updateWake(this, dt); // S-23: Surge's Spire Wake (starts, clock, waves, end)
    updateWeather(this, dt); // S-33: after the Wake, so a Wake starting this frame cancels the event at once
    updateRift(this); // S-57a: likewise after the Wake
    if (this.mode === 'surge') this.updateEnemies(dt); else if (this.enemies.length || this.bolts.length) { this.enemies = []; this.bolts = []; }
    this.updateParticles(dt);

    if (this.inNexus()) p.integrity = Math.min(this.stat('hull'), p.integrity + NEXUS_HEAL * dt);
    else if (this.mode === 'drift') p.integrity = this.stat('hull');

    this.shake = Math.max(0, this.shake - dt * 30);
    this.nexusPulse = Math.max(0, this.nexusPulse - dt * 1.4);
    this.coreRing = Math.max(0, this.coreRing - dt / CORE_RING_S);
    this.nexusFlash = Math.max(0, this.nexusFlash - dt / NEXUS_FLASH_S);
    const newly = this.world.reveal(p.x, p.y, CORE_REVEAL);
    if (this.revealQueue.length) { newly.push(...this.revealQueue); this.revealQueue = []; }
    if (newly.length && markSpiresSeen(this, newly)) this.spireFound(); // S-27: first sight of a Spire (either mode)
    return newly;
  }

  updateBeam(dt, intent) {
    this.castOnce(dt, intent);
    updateHeat(this, dt); // S-48a: after the beam ran, so this frame's Kiln damage counts
  }

  castOnce(dt, intent) {
    const p = this.player, b = this.beam;
    const was = b.on;
    const held = !!(intent.fire && intent.aim);
    b.target = null; b.enemy = null; b.rays = [];
    b.flash = Math.max(0, b.flash - dt);
    if (overheated(this)) { // S-48a: the intent stays on; the realized beam (and a Pulse charge) is off until it cools
      b.on = false; b.charge = 0; this.audio.beam(false); this.facetAim = null;
      return;
    }
    if (BEAM_MODES[this.beamMode] && BEAM_MODES[this.beamMode].pulse) { // S-14: no continuous beam, no hum; charge -> burst
      b.on = false; this.audio.beam(false); this.facetAim = null;
      updatePulse(this, dt, held, !!intent.cancel);
      return;
    }
    b.charge = 0; b.recover = 0;
    b.on = held;
    if (b.on && !was) this.audio.beamStart();
    this.audio.beam(b.on);
    if (!b.on) { this.facetAim = null; return; }
    castBeam(this, dt);
    updateFacetAim(this, dt, b.target, !!b.midEnemy); // S-28 (D-080): the centre ray's cell only; B-044: a Glitch on it keeps the latch
    this.audio.beamContact(!!(b.target || b.enemy));
  }

  // Reduced motion (S-3) also turns off hitstop and the upgrade ring (S-4); null settings = all effects on.
  motionOn() { return !this.settings || !this.settings.reducedMotion; }

  // Every shake goes through here so the Settings switches (S-3) can turn it off.
  addShake(n) {
    if (this.settings && (!this.settings.shake || this.settings.reducedMotion)) return;
    this.shake = Math.max(this.shake, n);
  }

  // `crack`: broken by S-47b brittle glass, so it yields and sounds as normal but cracks nothing (no chains, D-128).
  onCellBroken(x, y, type, crack = false) {
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
      for (let i = 1 + riftBonus(this, x, y); i > 0; i--) this.dropYield(x, y, type); // S-57a: a rift cell rolls its yield twice
      for (let i = auroraBonus(this, cx, cy, type); i > 0; i--) this.spawnPickup(cx, cy, MATERIAL[type].yield.kind); // S-33
      this.audio.break(MATERIAL[type].yield.kind);
      if (this.motionOn() && this.stats.time - this.lastHitstop >= HITSTOP_GAP_S) { this.hitstop = HITSTOP_S; this.lastHitstop = this.stats.time; }
    } else {
      this.audio.break('rock');
      if (!crack && (type === T.ROCK || type === T.DENSE)) shatter(this, x, y); // S-47b: Shoal glass cracks a neighbour
    }
  }

  /** An ore cell's yield as floor loot at its centre (a beam break, or an S-23 Wake lane clearing it). Non-ore: nothing. */
  dropYield(x, y, type) {
    const mat = MATERIAL[type];
    if (!mat || !mat.yield) return;
    const n = mat.yield.min + Math.floor(this.rng.yield() * (mat.yield.max - mat.yield.min + 1));
    for (let i = 0; i < n; i++) this.spawnPickup((x + 0.5) * CELL, (y + 0.5) * CELL, mat.yield.kind);
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
        const pull = (ATTRACT_PULL[0] * (1 - d / mag) + ATTRACT_PULL[1]) * buffMul(this, 'pull'); // S-36: Lodestone
        it.vx += (dx / d) * pull * dt; it.vy += (dy / d) * pull * dt;
        it.vx *= 0.9; it.vy *= 0.9;
      } else {
        it.vx *= Math.pow(0.04, dt); it.vy *= Math.pow(0.04, dt);
      }
      // Pickups respect walls but are allowed to drift on top of the core.
      const [ux, uy] = pickupDrift(this, it.x, it.y); // S-47: Shoal pickups drift at half the current
      const nx = it.x + (it.vx + ux) * dt, ny = it.y + (it.vy + uy) * dt;
      if (!this.world.solidAtPx(nx, it.y)) it.x = nx; else it.vx *= -0.4;
      if (!this.world.solidAtPx(it.x, ny)) it.y = ny; else it.vy *= -0.4;
      if (d < p.r + 6 && it.age > PICKUP_SETTLE_S) {
        if (room) {
          this.cargo[it.kind]++;
          if (it.kind in this.stats) this.stats[it.kind]++; // lumen / tide / calx: ever held (shard / prism aren't stats keys)
          this.audio.pickup(it.kind);
          this.pickups.splice(i, 1);
        } else if (!this.atDeposit()) { // B-033: at a deposit (Nexus ring or Relay, `atDeposit`) the deposit makes room this frame; no "return to the Nexus"
          this.audio.full();
          this.notify('cargo-full');
        }
      }
    }
  }

  updateDeposit(dt) {
    if (!this.atDeposit() || this.cargoTotal() === 0) { this.depositTimer = 0; this.depositKinds.clear(); return; }
    this.depositTimer += dt;
    // Streaks fly to the Nexus; at a Relay they fly off toward it (RELAY_STREAK_PX along the way, S-22).
    const p = this.player, far = this.inNexus() ? 0 : Math.hypot(this.nexus.x - p.x, this.nexus.y - p.y);
    const tx = far ? p.x + (this.nexus.x - p.x) / far * RELAY_STREAK_PX : this.nexus.x, ty = far ? p.y + (this.nexus.y - p.y) / far * RELAY_STREAK_PX : this.nexus.y;
    while (this.depositTimer > DEPOSIT_TICK_S && this.cargoTotal() > 0) {
      this.depositTimer -= DEPOSIT_TICK_S;
      const kind = KINDS.find(k => this.cargo[k] > 0);
      this.cargo[kind]--; this.bank[kind]++;
      this.audio.deposit(this.depositCount++);
      this.depositKinds.add(kind);
      this.particles.push({ type: 'streak', x: this.player.x, y: this.player.y, tx, ty, life: 0.4, max: 0.4, color: RESOURCE[kind].color, size: 3 });
      if (this.cargoTotal() === 0) { this.audio.depositDone(this.depositKinds.size); this.depositKinds.clear(); this.notify('deposited'); endBuffs(this); } // S-35: a deposit that banked ≥ 1 item ends every buff
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
    this.cargo = emptyKinds();
    this.burst(p.x, p.y, 50, '#ffffff', 300);
    p.x = this.nexus.x; p.y = this.nexus.y + SPAWN_OFFSET; p.vx = p.vy = 0;
    p.integrity = this.stat('hull'); p.invuln = RESPAWN_INVULN_S; this.beam.charge = 0;
    this.heat = 0; this.heatState.over = 0; this.heatState.flash = 0; // B-087 (audit 99): a respawn at the Nexus never starts overheated
    this.enemies = this.enemies.filter(e => Math.hypot(e.x - this.nexus.x, e.y - this.nexus.y) > RESPAWN_CLEAR_PX);
    this.bolts = [];
    clearBurrower(this); // S-53
    clearSwarm(this); // S-54
    clearHunters(this); // S-72
    healBosses(this); // S-60b: a live boss's core heals; broken plates stay broken
    this.notify('destabilized');
    if (this.wake) failWake(this); // S-23: a core death fails the Wake
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

  /** S-27: toast "A dormant Spire (n/N)" (main.js reads `spireCount`) + one soft low tone. */
  spireFound() {
    this.spireCount = spiresSeen(this);
    this.audio.spire();
    this.notify('spire');
  }

  notify(kind) {
    if (!this.events.includes(kind)) this.events.push(kind);
  }

  // ---------- persistence ----------
  toSave() {
    return {
      v: SAVE_FORMAT, seed: this.world.seed, size: this.world.w, mode: this.mode,
      bank: { ...this.bank }, cargo: { ...this.cargo }, upgrades: { ...this.upgrades }, nexus: { ...this.nexusLevels }, research: { ...this.research }, beamMode: this.beamMode, craft: { ...this.craft }, beacons: this.beacons.map(b => b.i), relays: this.relays.map(b => b.i), sinks: this.sinks.map(b => b.i), wards: this.wards.map(b => b.i), decoys: this.decoys.map(b => b.i), stats: { ...this.stats },
      player: { x: Math.round(this.player.x), y: Math.round(this.player.y) }, integrity: Math.round(this.player.integrity),
      broken: packBits(this.world.broken), explored: packBits(this.world.explored), vaultSkip: [...this.vaultSkip],
      spires: this.spires.map(q => ({ ...q, ...(q.keep ? { keep: [...q.keep] } : {}) })), // S-19: the whole M5 record (D-063)
      ended: this.ended, endedAt: this.endedAt, // S-24
      cycle: this.cycle, records: this.records, // S-29
      anomalies: { ...this.anomaly.taken }, buffs: [...this.buffs], // S-35
      bosses: this.bosses.list.map(b => ({ ring: b.ring, down: b.down })), // S-60a: only the down flags (fight state is never saved)
      echoOrder: this.echoOrder, echoLevels: { ...this.echoLevels }, // S-43, S-70
      weatherCancel: this.weather.cancel, // B-081: the event a Wake / the ending cancelled stays cancelled after a reload
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
    for (const u of UPGRADES) { const v = s.upgrades && s.upgrades[u.id]; if (Number.isInteger(v) && v >= 0) this.upgrades[u.id] = Math.min(v, this.topLevel(u)); } // S-50: clamped to the top level (B-037)
    for (const k of Object.keys(this.nexusLevels)) if (s.nexus && s.nexus[k] != null) this.nexusLevels[k] = s.nexus[k];
    { const c = Math.floor(Number(this.nexusLevels.chart)); this.nexusLevels.chart = chartOn(this) && c > 0 ? Math.min(2, c) : 0; } // S-52: 0–2, 0 without a Kiln
    this.nexusLevels.lens = this.nexusLevels.lens === 1 ? 1 : 0; // S-63 (B-037)
    Object.assign(this.stats, s.stats || {});
    this.cycle = Number.isInteger(s.cycle) && s.cycle >= 0 ? s.cycle : 0; // S-29
    this.records = cleanRecords(s.records); // B-057: a save is never trusted
    this.ended = s.ended === true; this.endedAt = Number.isFinite(s.endedAt) ? s.endedAt : null; // S-24 (B-037: never trust a save)
    Object.assign(this.research, s.research || {});
    this.craft.beacon = Math.min(BEACON_STOCK, Math.max(0, Math.floor(Number(s.craft && s.craft.beacon)) || 0)); // S-16; B-038 clamp
    loadBeacons(this, s.beacons);
    this.craft.relay = Math.min(RELAY_STOCK, Math.max(0, Math.floor(Number(s.craft && s.craft.relay)) || 0)); // S-22
    this.craft.last = s.craft && PLACE_KINDS.includes(s.craft.last) ? s.craft.last : 'beacon';
    loadRelays(this, s.relays);
    this.craft.sink = sinksOn(this) ? Math.min(HEATSINK_STOCK, Math.max(0, Math.floor(Number(s.craft && s.craft.sink)) || 0)) : 0; // S-51
    loadSinks(this, s.sinks);
    this.craft.ward = Math.min(WARD_STOCK, Math.max(0, Math.floor(Number(s.craft && s.craft.ward)) || 0)); // S-56
    loadWards(this, s.wards);
    this.craft.decoy = Math.min(DECOY_STOCK, Math.max(0, Math.floor(Number(s.craft && s.craft.decoy)) || 0)); // S-77a
    loadDecoys(this, s.decoys);
    loadAnomalies(this, s.anomalies, s.buffs); // S-35
    this.echoOrder = validOrder(s.echoOrder); // S-43: anything else loads as Gather (B-037)
    this.echoLevels = validEchoLevels(s.echoLevels); // S-70: clamped 0…2, malformed -> 0 (B-037)
    this.weather.cancel = Number.isInteger(s.weatherCancel) && s.weatherCancel >= 0 ? s.weatherCancel : -1; // B-081
    this.beamMode = validMode(this, s.beamMode); // S-13: a mode that isn't unlocked loads as Focus
    if (s.player && !collides(w, s.player.x, s.player.y, PLAYER_R)) { this.player.x = s.player.x; this.player.y = s.player.y; }
    for (const [k, x, y, kp] of (Array.isArray(s.pickups) ? s.pickups : []).filter(Array.isArray)) this.pickups.push({ x, y, vx: 0, vy: 0, kind: KINDS[k] || 'shard', age: 1, r: 4, kept: kp === 1 });
  }
}
