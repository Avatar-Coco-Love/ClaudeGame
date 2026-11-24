// Tunable constants. Everything gameplay-numeric lives here so balance passes touch one file.

// Game version: <major>.<minor>.<PR count> (D-046: minor = milestones shipped; 1.0 = M5). Bump in every PR, together with a new top entry in docs/05-Changelog.md
// (tests/docs.cjs fails if the two disagree).
export const VERSION = '0.4.63';
// S-3 Settings: volume 0-100 maps linearly to master gain 0..MASTER_GAIN_MAX (default 70 -> 0.35, the pre-S-3 level).
export const DEFAULT_VOLUME = 70;
export const MASTER_GAIN_MAX = 0.5;
// B-016 beam hum (before master gain): soft onset to onsetGain in attackS, settles (time constant settleS) to bedGain,
// or to contactGain while the beam touches a cell/Glitch. Triangle at 2x the ring pitch through a low-pass (no vibrato).
// The old hum was a sawtooth at gain 0.045 that never faded. tests/audio.cjs measures it (ceiling -55 dBFS sustained).
export const BEAM_HUM = { onsetGain: 0.03, attackS: 0.04, settleS: 0.25, bedGain: 0.004, contactGain: 0.007, lowpassHz: 700 };
// B-017 deposit ticks: at most one per `throttle` s; within one run (ticks < resetS apart) each is `decay`x the last,
// and ticks below minVol are skipped, so a full hold sounds for ~0.7 s instead of ~5 s. tests/audio.cjs measures it.
export const DEPOSIT_TICK = { vol: 0.12, decay: 0.8, minVol: 0.015, throttle: 0.07, resetS: 0.3 };
export const CELL = 32;
export const WORLD_W = 160;
export const WORLD_H = 160;
export const CHUNK = 16; // cells per render chunk edge
export const NEXUS_RADIUS = 5.5 * CELL; // px; deposit + safe zone
export const LIGHT_RADIUS = 260; // px around the core
// S-6 (D-017): any Glitch, alert or wandering, that hasn't closed GLITCH_PROGRESS_PX on its best distance for GLITCH_GIVE_UP_S gives up
// and fades out over GLITCH_FADE_S (harmless, no loot, not beam-targetable), freeing its spawn slot.
export const GLITCH_PROGRESS_PX = 24;
export const GLITCH_GIVE_UP_S = 6;
export const GLITCH_FADE_S = 0.6;
// D-018 (Q-007 fallback): once Glitches stop sticking, a kill drops a Prism only this often (Shards unchanged).
export const GLITCH_PRISM_CHANCE = 0.5;
// Glitch tuning (moved out of game.js unchanged by S-18; `src/glitch.js` uses them). Alive cap: 1 within 2 Nexus radii of it,
// else min(GLITCH_CAP, GLITCH_CAP_BASE + floor(core distance / GLITCH_CAP_STEP_PX)). Spawns every GLITCH_SPAWN_S[0] + rand × [1] s,
// GLITCH_SPAWN_RING[0] + rand × [1] px from the core, never within GLITCH_SPAWN_CLEAR Nexus radii of the Nexus.
export const GLITCH_R = 11;
export const GLITCH_COLORS = ['#ff7a3d', '#ff4a4a', '#ff2e7a', '#ffd23d']; // body colour by tier (render.js glitchSprite)
export const GLITCH_CAP = 9, GLITCH_CAP_BASE = 2, GLITCH_CAP_STEP_PX = 520;
export const GLITCH_FIRST_SPAWN_S = 3, GLITCH_SPAWN_S = [2.2, 1.8], GLITCH_SPAWN_RING = [480, 260], GLITCH_SPAWN_CLEAR = 2.2;
export const GLITCH_AGGRO_PX = 560, GLITCH_DESPAWN_PX = 1500; // chase inside aggro, wander outside; dropped past despawn
// Tier = min(GLITCH_TIER_MAX, floor(core distance from the Nexus / GLITCH_TIER_PX)); each stat is base + tier × step.
export const GLITCH_TIER_PX = 900, GLITCH_TIER_MAX = 3;
export const GLITCH_TIER = { hp: [1.2, 1.1], speed: [120, 22], dmg: [14, 6] };
export const GLITCH_LOOT_SHARDS = 2; // + tier Shards per kill (Prism: GLITCH_PRISM_CHANCE)
export const GLITCH_HIT_CD_S = 0.9, GLITCH_KNOCKBACK = 260; // contact: re-hit delay, the Glitch's bounce-off speed
// The Nexus pushes Glitches out from NEXUS_RADIUS + GLITCH_NEXUS_MARGIN (× REPEL speed) and burns BURN hp/s; it heals the core.
export const GLITCH_NEXUS_MARGIN = 40, GLITCH_NEXUS_REPEL = 1.5, GLITCH_NEXUS_BURN = 0.8;
export const NEXUS_HEAL = 45; // integrity per second inside the Nexus ring (Surge)

// S-4 Feel pass (D-021). Reduced motion turns off hitstop and the upgrade ring (shake already off); sounds stay.
export const PICKUP_CAP = 400;      // loose floor pickups; kept ones (death scatter, caches) never count (B-022)
export const HITSTOP_S = 0.035;     // sim freeze on a yield-cell break (crystal, prism, Lumen); a vault cache gets 2×
export const HITSTOP_GAP_S = 0.15;  // at most one hitstop per this much game time
export const CORE_RING_S = 0.4;     // expanding ring on the core after a Core Matrix purchase
// Core + loot tuning (moved out of game.js unchanged, audit 44; tests/tuning.cjs flags new bare numbers in game.js).
export const PLAYER_ACCEL = 9;      // 1/s: how quickly velocity chases its target
export const PLAYER_R = 10;         // px: core collision radius
export const PARTICLE_CAP = 500;
export const CORE_REVEAL = 230;     // px: cells within this of the core become explored
export const SPAWN_OFFSET = 40;     // px south of the Nexus centre: start + respawn point
export const ATTRACT_PULL = [900, 250]; // px/s²: Attractor pull = [0] × (1 − d / reach) + [1]
export const PICKUP_SETTLE_S = 0.25; // a fresh pickup can't be pulled or collected this young
export const DEPOSIT_TICK_S = 0.035; // one cargo item banked per tick inside the Nexus ring
export const HURT_INVULN_S = 0.5, HURT_KNOCKBACK = 320; // after a hit: grace seconds, push speed (px/s)
export const RESPAWN_INVULN_S = 2, RESPAWN_CLEAR_PX = 900; // after a death: grace seconds; Glitches within this of the Nexus vanish

export const T = { EMPTY: 0, ROCK: 1, DENSE: 2, CRYSTAL: 3, PRISM: 4, BEDROCK: 5, VAULT: 6, CACHE: 7, LUMEN: 8, SPIRE_SHELL: 9, SPIRE: 10, FACET: 11 };

export const MATERIAL = {
  [T.ROCK]:    { hp: 0.55, yield: null }, // ROCK/DENSE colours come from their depth ring (RINGS, world.look)
  [T.DENSE]:   { hp: 2.6,  yield: null },
  [T.CRYSTAL]: { hp: 0.9,  fill: '#0c3446', edge: '#2ef2ff', yield: { kind: 'shard', min: 1, max: 3 } },
  [T.PRISM]:   { hp: 2.4,  fill: '#3a1046', edge: '#ff4fd8', yield: { kind: 'prism', min: 1, max: 2 } },
  [T.BEDROCK]: { hp: Infinity, fill: '#05060f', edge: '#1b2140', yield: null },
  [T.VAULT]:   { hp: 6,    fill: '#142a3a', edge: '#d8fbff', yield: null }, // S-9 vault shell: tough, no yield
  [T.CACHE]:   { hp: 3,    fill: '#1d1440', edge: '#ffffff', yield: null }, // S-9 vault centre: bursts VAULT_LOOT
  [T.LUMEN]:   { hp: 3.5,  fill: '#3a2a0a', edge: '#ffc94f', yield: { kind: 'lumen', min: 1, max: 1 } }, // S-10, Deep only
  [T.SPIRE_SHELL]: { hp: 6, fill: '#1a1a3e', edge: '#c9c2ff', yield: null }, // S-19 Spire shell: tough like a vault shell, no yield
  [T.SPIRE]:   { hp: Infinity, fill: '#120c2a', edge: '#8f80d8', yield: null }, // S-19 Spire core: unmineable (D-049)
  [T.FACET]:   { hp: Infinity, fill: '#18123a', edge: '#a89cf0', yield: null }, // S-19 facet in the shell: unmineable (S-28 toggles it)
};

// S-10 Lumen (D-033): re-types ROCK/DENSE at d >= LUMEN_D cells where its own noise (seed ^ LUMEN_SALT, at x/5, y/5) > LUMEN_CUT.
// Never changes the layout (D-023). ~141 cells per world over 40 seeds; nothing spends it until Research v1 (S-11).
export const LUMEN_D = 55;
export const LUMEN_CUT = 0.8;
export const LUMEN_SALT = 0x27d4eb2f;

// S-9 vaults (D-023, D-031): sealed 7×7 rooms stamped after generation; the centre cache bursts this loot once.
export const VAULT_COUNT = 6;
export const VAULT_D = [50, 72];     // centre distance from the Nexus, in cells
export const VAULT_GAP = 20;         // min cells between vault centres
export const VAULT_TRIES = 200;
export const VAULT_LOOT = { shard: 20, prism: 6 };

// S-19 Spires (D-049, D-068): 5 dormant 9×9 sites, one per 72° sector from a seeded start angle; chosen once, then saved.
export const SPIRE_COUNT = 5;
export const SPIRE_D = [64, 74];     // centre distance from the Nexus, in cells
export const SPIRE_TRIES = 40;       // candidates per sector (seed-only, like vaultSites)
export const SPIRE_VAULT_GAP = 12;   // min cells from a Spire centre to every vault centre
export const SPIRE_GAP = 12;         // min cells between Spire centres (two sectors meet at a line)
export const SPIRE_BREATH_S = 6;              // S-27: the core hexagon's breath period (static under reduced motion)
export const SPIRE_BREATH_ALPHA = [0.35, 0.6]; // S-27: its alpha range (0.6 = the S-19 look, held under reduced motion)
export const SPIRE_MARK_COLOR = '#e4dcff';    // S-27: the minimap hexagon at a found Spire (violet-white)
export const SPIRE_PRISMS = 80;               // S-20 (D-055, D-070): ▲ fed to prime a Spire (400 for all 5)
export const SPIRE_FEED_RATE = 8;             // S-20: ▲ per second moved in while the core is in the 7×7 interior (cargo first, then bank)
export const SPIRE_TAPS = [3, 3, 4, 4, 5];    // S-20/S-28: facets toggled from all-lit to make Spire i's start pattern (= its minimum taps)
export const SPIRE_TAP_S = 0.35;              // S-28 (D-080): seconds of aim-ray contact before a primed facet toggles (then it latches)
export const SPIRE_LIGHT = 260;               // S-28 (D-055): a relit Spire's light hole, px
export const SPIRE_LIT_RGB = '214, 200, 255'; // S-28: its floor glow (violet-white, S-25's layer)
// S-23 (D-055, D-071): the Surge Wake. Starting values; tuned with `tools/surgebot.mjs --route=spire`.
export const SPIRE_WAKE_S = 40;        // seconds held -> relit; one facet lights every SPIRE_WAKE_S / 8
export const SPIRE_WAVE_S = 1.6;       // seconds between lane spawns (lanes take turns)
export const SPIRE_WAKE_ALIVE = 6;     // most Wake Glitches alive at once
export const SPIRE_LANE = { len: 6, half: 1, min: 3 }; // cells cleared past each gap, half-width, shortest lane that spawns
export const SPIRE_CHARGE = 100, SPIRE_CHARGE_HIT = 10; // the Spire's charge; a Glitch reaching the core costs this and bursts
export const SPIRE_CORE_CONTACT_PX = 2; // how close (past touching) a Wake Glitch gets to the core before it counts as reaching it
export const SPIRE_WAKE_TIER_DROP = 1; // S-31 (D-087): Wake Glitches spawn this many tiers below the Spire's depth tier
export const WAKE_FRAME_PX = 6 * 32; // the camera frames a waking Spire's core while the player core is within this (audit 59)
export const SPIRE_GUARD_CELLS = 3;    // a Wake Glitch chases the player core instead when it is this close
export const SPIRE_WAKE_RGB = '255, 122, 61'; // the charge ring + clock facets while a Wake runs (Glitch orange, D-088)

// S-8 depth rings (D-022). d = cells from the Nexus centre; a cell belongs to the last ring whose r0 ≤ d (the corners are Deep).
// Each ring recolours ROCK/DENSE and multiplies only their hp; ore, bedrock and the cell layout are the same everywhere.
export const RINGS = [
  { name: 'Hearth', r0: 0,  rockFill: '#17215a', rockEdge: '#3d6bff', denseFill: '#231658', denseEdge: '#8a5cff', hpMul: 1 },
  { name: 'Veil',   r0: 24, rockFill: '#0f2c40', rockEdge: '#2fc4b0', denseFill: '#26164e', denseEdge: '#a070ff', hpMul: 1.4 },
  { name: 'Deep',   r0: 48, rockFill: '#1c1048', rockEdge: '#6a4dff', denseFill: '#33103f', denseEdge: '#e04cc8', hpMul: 2 },
];
export const RING_PITCH_STEP = 2; // semitones the beam hum drops per ring (S-8)

export const RESOURCE = {
  shard: { color: '#2ef2ff', glyph: '◆', name: 'Shards' },
  prism: { color: '#ff4fd8', glyph: '▲', name: 'Prisms' },
  lumen: { color: '#ffc94f', glyph: '●', name: 'Lumen' },
};
// Resource kinds in deposit / scatter / save order. A saved floor pickup stores its index here (0 shard, 1 prism, 2 lumen).
export const KINDS = ['shard', 'prism', 'lumen'];
// Ore cell type -> the resource it yields: the one ore set the Scanner (research.js) and the glyph drawing (render.js) share.
export const ORE_KIND = { [T.CRYSTAL]: 'shard', [T.PRISM]: 'prism', [T.LUMEN]: 'lumen' };

// Core Matrix upgrades. value(level) gives the live stat; cost(level) the price of the NEXT level.
export const UPGRADES = [
  { id: 'beam',   name: 'Beam Power',  desc: 'Mining + combat damage per second', max: 8,
    value: l => 1 + 0.55 * l, fmt: v => v.toFixed(2) + ' dps' },
  { id: 'range',  name: 'Beam Range',  desc: 'How far the beam reaches', max: 6,
    value: l => 96 + 24 * l, fmt: v => Math.round(v) + ' px' },
  { id: 'thrust', name: 'Thrusters',   desc: 'Top speed of the core', max: 6,
    value: l => 190 + 26 * l, fmt: v => Math.round(v) + ' px/s' },
  { id: 'cargo',  name: 'Cargo Lattice', desc: 'Resources carried before returning', max: 8,
    value: l => 20 + 15 * l, fmt: v => Math.round(v) + ' slots' },
  { id: 'magnet', name: 'Attractor',   desc: 'Pickup pull radius', max: 6,
    value: l => 64 + 28 * l, fmt: v => Math.round(v) + ' px' },
  { id: 'hull',   name: 'Integrity',   desc: 'Hit points (matters in Surge)', max: 6,
    value: l => 100 + 30 * l, fmt: v => Math.round(v) + ' hp' },
];

export function upgradeCost(level) {
  return {
    shard: Math.round(8 * Math.pow(1.68, level)),
    prism: level >= 2 ? (level - 1) * 3 : 0,
  };
}

// Nexus Development (S-1, D-009): upgrades to the base itself, paid in Prisms only. cost(level) is the NEXT level's price.
// Radiance only widens the Nexus light + explored disc; deposit and Glitch-repel radii stay fixed (D-002: no Surge-only safety buff).
export const NEXUS_UPGRADES = [
  { id: 'radiance', name: 'Radiance', desc: 'How far the Nexus lights the caves', max: 5,
    value: l => 320 + 96 * l, fmt: v => Math.round(v) + ' px',
    cost: l => ({ shard: 0, prism: [6, 12, 20, 30, 45][l] }) },
];

// Research (S-11, D-030, D-034): one-time unlocks paid only in Lumen. The Scanner ping shows CRYSTAL/PRISM/LUMEN cells within
// SCAN_RADIUS cells for SCAN_SHOW_S as a ring sweeps out at SCAN_SPEED; nothing is marked explored or saved.
export const SCAN_RADIUS = 12;     // cells
export const SCAN_COOLDOWN_S = 20;
export const SCAN_SHOW_S = 6;
export const SCAN_SPEED = 600;     // px/s, the ring's growth
export const RESEARCH = [
  { id: 'scanner', name: 'Scanner', desc: `Ping: shows ore and vault caches within ${SCAN_RADIUS} cells for a few seconds`, cost: 10 },
  { id: 'wide', name: 'Wide Beam', desc: 'A 3-cell swath: slower per cell, carves wide halls', cost: 25 },
  { id: 'pulse', name: 'Pulse Beam', desc: 'Hold to charge, release to fire: 1.5× reach, pierces 3 cells', cost: 40 },
];
export const RESEARCH_HINT = `Gold Lumen ● hides past ${LUMEN_D} cells, in the Deep`;

// Beam modes (S-13, D-036), in Q / ⟂ cycle order. Rays are parallel, `offsets` px sideways; range and damage are multipliers
// on the Core Matrix stats (per ray, per cell: a cell or Glitch under two rays takes damage once). Wide: ~1.35× cells/s, 2.2× slower each.
export const WIDE_OFFSET = 32, WIDE_RANGE = 0.75, WIDE_DMG = 0.45;
export const BEAM_MODES = {
  focus: { name: 'Focus', research: null, offsets: [0], range: 1, dmg: 1 },
  wide: { name: 'Wide', research: 'wide', offsets: [-WIDE_OFFSET, 0, WIDE_OFFSET], range: WIDE_RANGE, dmg: WIDE_DMG },
  pulse: { name: 'Pulse', research: 'pulse', offsets: [0], range: 1, dmg: 1, pulse: true }, // S-14: charge/release, `updatePulse`
};
// Pulse (S-14, D-042): held fire charges 0 -> 1 over PULSE_CHARGE_S (held at 1, it fires once a Glitch or
// wall is in reach: S-21 ready shot, D-054); a release at >= PULSE_MIN bursts
// beam dps × PULSE_CHARGE_S × charge × PULSE_MUL along range × PULSE_RANGE, carrying what a broken cell doesn't use on to
// the next, up to PULSE_PIERCE cells. A Glitch on the ray takes the rest × PULSE_GLITCH and stops it. Then PULSE_RECOVER_S
// before charging again: ~0.8× Focus sustained. PULSE_FLASH_S = the release line (half under reduced motion).
export const BEAM_GLITCH_MUL = 1.6; // Focus/Wide beam damage to a Glitch × this (beam.js castBeam)
export const PULSE_CHARGE_S = 1.2, PULSE_RANGE = 1.5, PULSE_MIN = 0.2, PULSE_MUL = 1.0, PULSE_PIERCE = 3, PULSE_GLITCH = 1.8;
export const PULSE_RECOVER_S = 0.3, PULSE_FLASH_S = 0.12;

// Crafting (S-16, D-043): a Beacon is light you carry out and place. BEACON_COST Prisms each, at most BEACON_STOCK carried,
// BEACON_MAX placed, ≥ BEACON_GAP cells apart, outside the Nexus ring. Each lights BEACON_LIGHT px for good and, on placement,
// marks cells within BEACON_REVEAL cells explored. Same in Drift and Surge (Glitches ignore it, D-002).
export const BEACON_COST = 5, BEACON_STOCK = 3, BEACON_MAX = 20, BEACON_GAP = 4, BEACON_LIGHT = 140, BEACON_REVEAL = 5;
// S-25 (D-061): an additive cyan floor disc under the walls, so open floor in a pool reads lit. Centre alpha; 0.45× at 60 %, 0 at the edge.
export const BEACON_GLOW = 0.08;
export const BEACON_RGB = '191, 248, 255'; // white-cyan #bff8ff: the beacon's map dot, body, ring and light (H4: one place)
// S-22 (D-056): a Relay is a crafted remote deposit. RELAY_COST each, RELAY_STOCK carried, RELAY_MAX placed, on open floor
// d ≥ RELAY_MIN_D cells from the Nexus centre and ≥ RELAY_GAP cells from another Relay, every vault centre and every Spire footprint.
// Cargo within RELAY_R px banks like the Nexus ring; no heal, no Glitch repel. Lights RELAY_LIGHT px. Same in Drift and Surge.
export const RELAY_COST = { shard: 40, prism: 12 }, RELAY_STOCK = 1, RELAY_MAX = 3, RELAY_MIN_D = 24, RELAY_GAP = 16, RELAY_R = 64, RELAY_LIGHT = 100;
export const RELAY_STREAK_PX = 200; // at a Relay, deposit streaks fly this far toward the Nexus
export const RELAY_RGB = '120, 232, 255'; // cyan-white #78e8ff: the Relay's body, map ring, floor glow (bluer than a Beacon)

export const MODES = {
  drift: { name: 'Drift', blurb: 'Calm. No hostiles. Mine, explore, build at your own pace.' },
  surge: { name: 'Surge', blurb: 'Glitches hunt in the dark. Same rewards, more heartbeat.' },
};
