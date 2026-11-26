// Tunable constants. Everything gameplay-numeric lives here so balance passes touch one file.

// Game version: <major>.<minor>.<PR count> (D-046: minor = milestones shipped; 1.0 = M5). Bump in every PR, together with a new top entry in docs/05-Changelog.md
// (tests/docs.cjs fails if the two disagree).
export const VERSION = '1.9.80';
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
// S-45 (D-120): a world's size (cells per side, square) is saved data. New worlds / New Cycles use WORLD_SIZE_NEW; a save
// written before size was saved (format ≤ 17) is WORLD_SIZE_OLD. Each size has a profile: what differs between sizes.
export const WORLD_SIZE_NEW = 256; // S-46b2 (D-124): new worlds and New Cycles are 256; a loaded save keeps its own size
export const WORLD_SIZE_OLD = 160;
export const MINIMAP_WINDOW_CELLS = 160; // S-46b: the minimap shows this many cells per side around the core (clamped to the world)
// rings: how many of RINGS the world uses; vaults: vaultSites count; anomalies: Anomaly sites per ring (ANOMALY_D).
// 160 = the pre-M10 numbers word for word (tests/worldsize.cjs pins the result). 256 (S-46a, D-122): 5 rings, 4 more vaults
// (outerVaults, VAULT_D_OUTER) and Anomalies in Shoal / Kiln, both drawn after the old lists with their own salts.
export const WORLD_PROFILES = {
  160: { rings: 3, vaults: 6, outerVaults: 0, anomalies: [3, 5, 8], overdrive: false },
  256: { rings: 5, vaults: 6, outerVaults: 4, anomalies: [3, 5, 8, 6, 6], overdrive: true }, // S-50: Overdrive needs ≈ / ⬟, 256 only
};
export const worldProfile = size => WORLD_PROFILES[size] || WORLD_PROFILES[WORLD_SIZE_OLD];
export const CHUNK = 16; // cells per render chunk edge
export const BORDER = 2; // bedrock cells around the world edge (world.js); footprints keep one cell clear of it (world, spire, anomaly)
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
// S-32 (D-087, D-096): a natural spawn at tier >= SPITTER_TIER is a Spitter 1 in 1/SPITTER_CHANCE (rng['glitch-spawn']).
// It eases to a stop at SPITTER_HOLD_PX from the core (over SPITTER_EASE_PX; backs off at up to SPITTER_BACK × speed inside it) and, with a clear line to it inside SPITTER_FIRE_PX, fires a bolt every
// SPITTER_SHOT_S (glowing for SPITTER_TELL_S first): BOLT_SPEED px/s, BOLT_DMG, BOLT_HP (beam-killable), gone after BOLT_LIFE_S.
export const SPITTER_TIER = 2, SPITTER_CHANCE = 0.25, SPITTER_HP = 0.8, SPITTER_HOLD_PX = 200, SPITTER_FIRE_PX = 320,
  SPITTER_EASE_PX = 90, SPITTER_BACK = 0.4;
export const SPITTER_SHOT_S = 2.2, SPITTER_TELL_S = 0.4, SPITTER_COLORS = ['#a35bff', '#ff9a3d'];
export const BOLT_SPEED = 150, BOLT_DMG = 8, BOLT_HP = 0.5, BOLT_R = 5, BOLT_LIFE_S = 4;
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
export const PICKUP_FRAMES = 16;    // audit 74: a pickup's spin is baked into this many sprites per turn (no per-pickup rotate)
export const DEPOSIT_TICK_S = 0.035; // one cargo item banked per tick inside the Nexus ring
export const HURT_INVULN_S = 0.5, HURT_KNOCKBACK = 320; // after a hit: grace seconds, push speed (px/s)
export const RESPAWN_INVULN_S = 2, RESPAWN_CLEAR_PX = 900; // after a death: grace seconds; Glitches within this of the Nexus vanish

export const T = { EMPTY: 0, ROCK: 1, DENSE: 2, CRYSTAL: 3, PRISM: 4, BEDROCK: 5, VAULT: 6, CACHE: 7, LUMEN: 8, SPIRE_SHELL: 9, SPIRE: 10, FACET: 11, TIDE: 12, CALX: 13, BOSS_CORE: 14, BOSS_PLATE: 15 };

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
  [T.TIDE]:    { hp: 3.0,  fill: '#10302a', edge: '#d8fff0', yield: { kind: 'tide', min: 1, max: 1 } }, // S-49, Shoal only; hp not ring-scaled
  [T.CALX]:    { hp: 4.2,  fill: '#24163a', edge: '#c8a0ff', yield: { kind: 'calx', min: 1, max: 1 } }, // S-49, Kiln only (Kiln rock for heat)
  [T.BOSS_CORE]: { hp: 40, fill: '#3a1a08', edge: '#ffa040', yield: null }, // S-60a boss core (BOSS_CORE_HP): × 0 while a plate stands (boss.js)
  [T.BOSS_PLATE]: { hp: 16, fill: '#3a1024', edge: '#ff8aa8', yield: null }, // S-60a boss plate (BOSS_PLATE_HP): no ring multiplier, no yield
};

// S-10 Lumen (D-033): re-types ROCK/DENSE at d >= LUMEN_D cells where its own noise (seed ^ LUMEN_SALT, at x/5, y/5) > LUMEN_CUT.
// Never changes the layout (D-023). ~141 cells per world over 40 seeds; nothing spends it until Research v1 (S-11).
export const LUMEN_D = 55;
export const LUMEN_CUT = 0.8;
export const LUMEN_SALT = 0x27d4eb2f;
// S-49 biome ores (D-134): re-typed last in generate(), ROCK/DENSE only, each from its own noise at x/5, y/5, in one ring.
// Only a 256 world has the Shoal (ring 3) and Kiln (ring 4), so a 160 world has none. ~266 ≈ and ~328 ⬟ over 40 seeds.
export const TIDE_RING = 3, TIDE_CUT = 0.76, TIDE_SALT = 0x3c6ef372;
export const CALX_RING = 4, CALX_CUT = 0.79, CALX_SALT = 0xa54ff53a;

// S-9 vaults (D-023, D-031): sealed 7×7 rooms stamped after generation; the centre cache bursts this loot once.
export const VAULT_HALF = 3; // vault footprints are (2·3 + 1)² = 7×7 cells (world.js templates; anomaly.js clearance)
export const VAULT_D = [50, 72];     // centre distance from the Nexus, in cells
// S-46a: a 256 world's outerVaults (own salt 'vault-outer', after the first list). d0 = SPIRE_D[1] + SPIRE_VAULT_GAP,
// so no outer vault can move a Spire (the spec's 82 moved 1 seed in 40, D-122).
export const VAULT_D_OUTER = [86, 118];
export const VAULT_GAP = 20;         // min cells between vault centres
export const VAULT_TRIES = 200;
export const VAULT_LOOT = { shard: 20, prism: 6 };

// S-19 Spires (D-049, D-068): 5 dormant 9×9 sites, one per 72° sector from a seeded start angle; chosen once, then saved.
export const SPIRE_COUNT = 5;
export const PLACE_BURST = { n: 24, speed: 160 }; // S-16/S-22/S-34: the particle burst when a Beacon or Relay is placed or lifted
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
// S-23 (D-055, D-071): the Surge Wake. Retuned in S-31 (D-087) with `tools/surgebot.mjs --route=spire`; re-run it before changing these.
export const SPIRE_WAKE_S = 40;        // seconds held -> relit; one facet lights every SPIRE_WAKE_S / 8
export const SPIRE_WAVE_S = 1.6;       // seconds between lane spawns (lanes take turns)
export const SPIRE_WAKE_ALIVE = 6;     // most Wake Glitches alive at once
export const SPIRE_LANE = { len: 6, half: 1, min: 3 }; // cells cleared past each gap, half-width, shortest lane that spawns
export const SPIRE_CHARGE = 100, SPIRE_CHARGE_HIT = 10; // the Spire's charge; a Glitch reaching the core costs this and bursts
export const SPIRE_CORE_CONTACT_PX = 2; // how close (past touching) a Wake Glitch gets to the core before it counts as reaching it
export const SPIRE_WAKE_TIER_DROP = 1; // S-31 (D-087): Wake Glitches spawn this many tiers below the Spire's depth tier
// S-24 Ending (D-045, D-090): the sequence's length (reduced motion: a short fade) and the darkness before -> after.
export const ENDING_S = 8, ENDING_FADE_S = 1;
export const ENDING_LINE_SHARE = 0.8, ENDING_MARGIN_CELLS = 6; // lines draw in the first 80 %; the overview's margin past the farthest Spire
export const DARK_ALPHA = [0.93, 0.5];
// S-29 New Cycle (D-062, D-091): the Nexus's hue per cycle, NEXUS_HUES[cycle % 5] (cosmetic; cycle 0 = the original cyan).
export const NEXUS_HUES = ['46, 242, 255', '90, 255, 150', '255, 201, 79', '190, 130, 255', '255, 110, 170'];
export const WAKE_FRAME_PX = 6 * CELL; // the camera frames a waking Spire's core while the player core is within this (audit 59)
export const SPIRE_GUARD_CELLS = 3;    // a Wake Glitch chases the player core instead when it is this close
export const SPIRE_WAKE_RGB = '255, 122, 61'; // the charge ring + clock facets while a Wake runs (Glitch orange, D-088)

// S-8 depth rings (D-022). d = cells from the Nexus centre; a cell belongs to the last ring whose r0 ≤ d (the corners are Deep).
// Each ring recolours ROCK/DENSE and multiplies only their hp; ore, bedrock and the cell layout are the same everywhere.
export const RINGS = [
  { name: 'Hearth', r0: 0,  rockFill: '#17215a', rockEdge: '#3d6bff', denseFill: '#231658', denseEdge: '#8a5cff', hpMul: 1 },
  { name: 'Veil',   r0: 24, rockFill: '#0f2c40', rockEdge: '#2fc4b0', denseFill: '#26164e', denseEdge: '#a070ff', hpMul: 1.4 },
  { name: 'Deep',   r0: 48, rockFill: '#1c1048', rockEdge: '#6a4dff', denseFill: '#33103f', denseEdge: '#e04cc8', hpMul: 2 },
  // S-46a (D-122): only a 256 world (profile rings 5) reaches these. Edges held ΔE ≥ 25 from the ore, Anomaly amber and
  // the other new ring under 3 colour-blind sims (tests/colours.cjs). Shoal glassy mint + ice, Kiln ember + rose.
  { name: 'Shoal',  r0: 80, rockFill: '#0c2a26', rockEdge: '#3a9a80', denseFill: '#0e1c30', denseEdge: '#3f6890', hpMul: 2.2 },
  { name: 'Kiln',   r0: 104, rockFill: '#2a1206', rockEdge: '#a84e1a', denseFill: '#2c0c16', denseEdge: '#b02a40', hpMul: 2.6 },
];
export const RING_PITCH_STEP = 2; // semitones the beam hum drops per ring (S-8)

export const RESOURCE = {
  shard: { color: '#2ef2ff', glyph: '◆', name: 'Shards' },
  prism: { color: '#ff4fd8', glyph: '▲', name: 'Prisms' },
  lumen: { color: '#ffc94f', glyph: '●', name: 'Lumen' },
  tide: { color: '#d8fff0', glyph: '≈', name: 'Tide' },  // S-49: pale mint, two wave strokes (Shoal)
  calx: { color: '#c8a0ff', glyph: '⬟', name: 'Calx' },  // S-49: lilac pentagon (Kiln)
};
// Resource kinds in deposit / scatter / save order. A saved floor pickup stores its index here (0 shard, 1 prism, 2 lumen,
// S-49: 3 tide, 4 calx). Append only: an index never changes meaning.
export const KINDS = ['shard', 'prism', 'lumen', 'tide', 'calx'];
export const emptyKinds = () => Object.fromEntries(KINDS.map(k => [k, 0])); // a bank / cargo with every kind at 0
// Ore cell type -> the resource it yields: the one ore set the Scanner (research.js) and the glyph drawing (render.js) share.
export const ORE_KIND = { [T.CRYSTAL]: 'shard', [T.PRISM]: 'prism', [T.LUMEN]: 'lumen', [T.TIDE]: 'tide', [T.CALX]: 'calx' };

// Core Matrix upgrades. value(level) gives the live stat; cost(level) the price of the NEXT level.
export const UPGRADES = [
  { id: 'beam',   name: 'Beam Power',  desc: 'Mining + combat damage per second', max: 8, over: 2,
    value: l => 1 + 0.55 * l, fmt: v => v.toFixed(2) + ' dps' },
  { id: 'range',  name: 'Beam Range',  desc: 'How far the beam reaches', max: 6, over: 2,
    value: l => 96 + 24 * l, fmt: v => Math.round(v) + ' px' },
  { id: 'thrust', name: 'Thrusters',   desc: 'Top speed of the core', max: 6, over: 2,
    value: l => 190 + 26 * l, fmt: v => Math.round(v) + ' px/s' },
  { id: 'cargo',  name: 'Cargo Lattice', desc: 'Resources carried before returning', max: 8, over: 2,
    value: l => 20 + 15 * l, fmt: v => Math.round(v) + ' slots' },
  { id: 'magnet', name: 'Attractor',   desc: 'Pickup pull radius', max: 6, over: 2,
    value: l => 64 + 28 * l, fmt: v => Math.round(v) + ' px' },
  { id: 'hull',   name: 'Integrity',   desc: 'Hit points (matters in Surge)', max: 6, over: 2,
    value: l => 100 + 30 * l, fmt: v => Math.round(v) + ' hp' },
];

export function upgradeCost(level) {
  return {
    shard: Math.round(8 * Math.pow(1.68, level)),
    prism: level >= 2 ? (level - 1) * 3 : 0,
  };
}
// S-50 (D-140): Overdrive, `over` levels past each `max` (value() keeps its formula), 256 worlds only (profile.overdrive).
// Step k's price; all 12 steps = 1920◆ 84≈ 84⬟ (≈ 48 % / ⬟ 40 % of the poorest seed, 07-Build-Specs-11).
export const OVERDRIVE_COST = [{ shard: 120, tide: 5, calx: 5 }, { shard: 200, tide: 9, calx: 9 }];
/** The price of the NEXT level of upgrade `u` from `level`: the base curve up to max, then the overdrive step. */
export const matrixCost = (u, level) => level < u.max ? upgradeCost(level) : OVERDRIVE_COST[level - u.max];

// Nexus Development (S-1, D-009): upgrades to the base itself, paid in Prisms only. cost(level) is the NEXT level's price.
// Radiance only widens the Nexus light + explored disc; deposit and Glitch-repel radii stay fixed (D-002: no Surge-only safety buff).
export const NEXUS_UPGRADES = [
  { id: 'radiance', name: 'Radiance', desc: 'How far the Nexus lights the caves', max: 5,
    value: l => 320 + 96 * l, fmt: v => Math.round(v) + ' px',
    cost: l => ({ shard: 0, prism: [6, 12, 20, 30, 45][l] }) },
  // S-52 (D-143, supersedes D-009's "Prisms only" for this row): minimap knowledge only; a world with a Kiln only (chart.js).
  { id: 'chart', name: 'Chart', desc: 'The minimap marks Shoal currents, then Kiln vents', max: 2, kiln: true,
    value: l => l, fmt: v => ['Uncharted', 'Currents', 'Currents + vents'][v],
    cost: l => [{ tide: 24, prism: 10 }, { calx: 24, prism: 10 }][l] },
  // S-63 (D-175): the only way to call a rift (rift.js callRift), every world size; each call costs RIFT_CALL_COST ▲ more.
  { id: 'lens', name: 'Lens', desc: 'Call a rift where you stand', max: 1,
    value: l => l, fmt: v => ['Not built', 'Built'][v],
    cost: () => ({ shard: 0, prism: 40 }) },
];
export const CHART_RECHECK_S = 0.5; // s of game time between re-checks of unexplored flowing chunks in the minimap window

// Research (S-11, D-030, D-034): one-time unlocks paid only in Lumen. The Scanner ping shows CRYSTAL/PRISM/LUMEN cells within
// SCAN_RADIUS cells for SCAN_SHOW_S as a ring sweeps out at SCAN_SPEED; nothing is marked explored or saved.
export const SCAN_RADIUS = 12;     // cells
export const SCAN_COOLDOWN_S = 20;
export const SCAN_SHOW_S = 6;
export const SCAN_SPEED = 600;     // px/s, the ring's growth
export const SCAN_RING_GLOW = [[12, 0.15], [7, 0.3], [3, 1]]; // [lineWidth px, alpha ×] strokes of the ring, widest first (audit 124, D-160: no shadowBlur)
export const RESEARCH = [
  { id: 'scanner', name: 'Scanner', desc: `Ping: shows ore and vault caches within ${SCAN_RADIUS} cells for a few seconds`, cost: 10 },
  { id: 'wide', name: 'Wide Beam', desc: 'A 3-cell swath: slower per cell, carves wide halls', cost: 25 },
  { id: 'pulse', name: 'Pulse Beam', desc: 'Hold to charge, release to fire: 1.5× reach, pierces 3 cells', cost: 40 },
  { id: 'arc', name: 'Arc Beam', desc: 'Hits jump to 2 more of the same kind nearby: ore veins, creature packs', cost: 35 }, // S-55 (D-151)
  { id: 'echo', name: 'Echo', desc: 'A lesser core that follows you and mines exposed ore', cost: 30 }, // S-42 (D-108)
];
// S-42 Echo (D-108, echo.js): follows down a BFS field from the core's cell, blinks back when stranded, Gathers exposed ore.
export const ECHO_R = 6;                 // px collision radius
export const ECHO_FIELD = 24;            // cells: the field's bound (box and path length)
export const ECHO_FIELD_S = 0.5;         // s between field rebuilds (and on any cell break within the bound)
export const ECHO_HOLD = [1.5, 3];       // cells from the core: the spot it settles in
export const ECHO_SPEED_MUL = 1.15;      // × the core's Thrusters speed
export const ECHO_BLINK_CELLS = 10;      // path distance past which it blinks
export const ECHO_STUCK_S = 1.5, ECHO_STUCK_PX = 4; // < 4 px progress toward the core in 1.5 s -> blink
export const ECHO_FADE_S = 0.25;         // each way
export const ECHO_REACH = 5;             // cells from the core an ore cell may be to Gather it
export const ECHO_DMG = 0.5;             // × the core's Beam Power dps
export const ECHO_PICK_S = 0.25;         // s between target searches while it has none
// S-43 orders (D-113): Gather (S-42) or Guard. Guard bolts the Glitch / Spitter bolt nearest the core within ECHO_GUARD_PX,
// with a clear line from the Echo, every ECHO_GUARD_S; ECHO_GUARD_DMG hp a hit (a tier-1 Glitch, 2.3 hp, in 3; a bolt in 1).
export const ECHO_ORDERS = ['gather', 'guard'];
export const ECHO_GUARD_S = 0.8, ECHO_GUARD_PX = 140, ECHO_GUARD_DMG = 0.8, ECHO_SHOT_S = 0.12; // shot: drawn this long
export const RESEARCH_HINT = `Gold Lumen ● hides past ${LUMEN_D} cells, in the Deep`;

// Beam modes (S-13, D-036), in Q / ⟂ cycle order. Rays are parallel, `offsets` px sideways; range and damage are multipliers
// on the Core Matrix stats (per ray, per cell: a cell or Glitch under two rays takes damage once). Wide: ~1.35× cells/s, 2.2× slower each.
export const WIDE_OFFSET = 32, WIDE_RANGE = 0.75, WIDE_DMG = 0.45;
export const BEAM_MODES = {
  focus: { name: 'Focus', research: null, offsets: [0], range: 1, dmg: 1 },
  wide: { name: 'Wide', research: 'wide', offsets: [-WIDE_OFFSET, 0, WIDE_OFFSET], range: WIDE_RANGE, dmg: WIDE_DMG },
  pulse: { name: 'Pulse', research: 'pulse', offsets: [0], range: 1, dmg: 1, pulse: true }, // S-14: charge/release, `updatePulse`
  arc: { name: 'Arc', research: 'arc', offsets: [0], range: 1, dmg: 0.8, arc: true, glyph: '↯' }, // S-55: `arcTargets` (arc.js)
};
// Arc (S-55, D-151): the ray deals × 0.8 (`dmg`); what it hits arcs to up to ARC_N more of the same kind within ARC_CELLS
// cells, ARC_MUL × the ray's dps each: a creature -> the nearest other creatures (never a bolt), an ore cell -> cells of
// its type, most cracked first. Rock arcs to nothing (0.8× Focus); a 3–9 cell cluster 1.34–1.46× Focus (spec's 0.35: 1.06–1.25).
export const ARC_N = 2, ARC_CELLS = 2, ARC_MUL = 0.5;
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
// S-33 Weather (D-087, D-097, weather.js): one event at a time, every WEATHER_EVERY_S[0] + rand × [1] s of play (start to
// start, rng['weather'], from stats.time so a reload keeps the schedule), WEATHER_S long; never in a Wake or the ending.
// Storm (Surge): spawn interval × STORM_SPAWN_MUL, alive cap + STORM_CAP_ADD. Aurora (Drift): a Shard or Prism cell broken
// within LIGHT_RADIUS of the core drops AURORA_BONUS more with chance AURORA_CHANCE (rng['aurora']). Tints ease in/out over WEATHER_EASE_S (darkness colour, light.js).
export const WEATHER_EVERY_S = [300, 120], WEATHER_S = 40, WEATHER_EASE_S = 2;
export const STORM_SPAWN_MUL = 0.75, STORM_CAP_ADD = 2, AURORA_BONUS = 1, AURORA_CHANCE = 0.4;
export const WEATHER_TINT = { storm: [14, 4, 26], aurora: [3, 13, 13] }; // darkness RGB at full strength (base 2, 3, 10)
// S-57a Rift (D-152, D-156, rift.js): event k opens at the sum of k + 1 gaps RIFT_EVERY_S[0] + rand × [1] s of play
// (rng['rift']; a start inside a weather event waits for its end), RIFT_S open: a 3 × 3 rock pocket RIFT_R cells from the
// core in its own ring turns to ore (RIFT_ORE[ring]: RIFT_MAJOR[ring] of the first ore, the rest the second) and reverts unmined at the close. Never saved.
export const RIFT_EVERY_S = [240, 120], RIFT_S = 45, RIFT_R = [8, 12], RIFT_TRIES = 40;
export const RIFT_ORE = [[T.LUMEN, T.CRYSTAL], [T.CRYSTAL, T.LUMEN], [T.PRISM, T.LUMEN], [T.TIDE, T.PRISM], [T.CALX, T.PRISM]]; // [major, minor] by ring
export const RIFT_MAJOR = [6, 6, 6, 3, 3], RIFT_BONUS = 1; // RIFT_MAJOR[ring]: cells of the first ore (≈ / ⬟ are worth 12, so 3 of 9); RIFT_BONUS: extra yield rolls per rift cell (D-156: the gate's tuning)
// S-63 Lens (D-175): a called rift costs RIFT_CALL_COST ▲ from the bank, RIFT_CALL_CD s of play apart (unsaved), and lasts RIFT_S.
export const RIFT_CALL_COST = 30, RIFT_CALL_CD = 90;
export const RIFT_RGB = '226, 208, 255'; // violet-white: the pocket's shimmer and its minimap dot
// S-35 Anomalies (D-098, D-099, anomaly.js): WORLD_PROFILES[size].anomalies sites per depth ring (Hearth / Veil / Deep; + Shoal / Kiln at 256), seed-only
// (rng['anomaly'], drawn from the generated terrain before any save is applied), each on a rock or dense cell at centre
// distance ANOMALY_D[ring] cells, ≥ ANOMALY_GAP cells apart, clear of vault footprints and Spire footprints by ANOMALY_CLEAR
// cells (Chebyshev, from the footprint edge). Taken when the core's centre is within ANOMALY_TAKE cells of an open site's
// centre; a taken site recharges ANOMALY_RECHARGE_S of play time later. A buff lasts until a deposit banks ≥ 1 item.
export const ANOMALY_D = [[9, 23], [25, 47], [49, 76], [82, 102], [106, 124]], ANOMALY_GAP = 12, ANOMALY_CLEAR = 1;
export const ANOMALY_TRIES = 600, ANOMALY_TAKE = 0.6, ANOMALY_RECHARGE_S = 300;
export const ANOMALY_BEAM_MUL = 1.5;
// S-36 (D-101): Lodestone scales Attractor reach and pull, Ballast the cargo limit (rounded down). Bot-tuned (`surgebot --anomaly`).
export const ANOMALY_MAGNET_MUL = 2, ANOMALY_PULL_MUL = 1.5, ANOMALY_CARGO_MUL = 1.5;
// One entry per buff kind (drawn 1/3 each per site from rng['anomaly-kind'], seed-only): the Matrix stats it scales (`fx`;
// 'pull' is the Attractor's pull, not a Matrix stat), the toast text, and how it shows (chip glyph, hexagram colour 'r, g, b').
export const ANOMALY_KINDS = {
  overclock: { name: 'Overclock', glyph: '✶', fx: { beam: ANOMALY_BEAM_MUL }, text: `beam ×${ANOMALY_BEAM_MUL}`, rgb: '255, 190, 120' },
  lodestone: { name: 'Lodestone', glyph: '✧', fx: { magnet: ANOMALY_MAGNET_MUL, pull: ANOMALY_PULL_MUL }, text: `pull reach ×${ANOMALY_MAGNET_MUL}`, rgb: '196, 140, 255' },
  ballast: { name: 'Ballast', glyph: '⬡', fx: { cargo: ANOMALY_CARGO_MUL }, text: `cargo +${Math.round((ANOMALY_CARGO_MUL - 1) * 100)} %`, rgb: '90, 230, 210' },
};

// S-41 (D-109): adaptive graphics. A rolling p90 of the real gap between frames over QUALITY_WINDOW_S of play: above
// QUALITY_SLOW_MS steps one level down, below QUALITY_FAST_MS for QUALITY_UP_S steps one up (18, not the spec's 14: vsync
// holds a 60 Hz gap at 16.7 ms). A step down right after a step up doubles the wait to step up again (≤ QUALITY_UP_MAX_S).
// L0 DPR ≤ 2; L1 DPR 1; L2 DPR 1 + half the particles drawn + pickups without glow. Drawing only: the sim never changes.
export const QUALITY_WINDOW_S = 3, QUALITY_SLOW_MS = 24, QUALITY_FAST_MS = 18, QUALITY_UP_S = 10, QUALITY_UP_MAX_S = 160, QUALITY_MAX = 2;
// Audit 79 (B-073, D-110): a step down must buy a p90 below QUALITY_GAIN × the p90 that caused it, or it is undone and Auto
// stops stepping down (a 30 Hz rAF cap — iOS Low Power, battery saver — is not slow drawing; dropping quality can't help it).
export const QUALITY_GAIN = 0.85;

// S-44 (D-114): ambient music, synthesized (music.js). Bus gain = MUSIC_GAIN × settings.music / 100, under master.
export const DEFAULT_MUSIC = 50;
export const MUSIC_GAIN = 0.5;
export const MUSIC_ROOT_HZ = 146.83; // D3 in Hearth; drops RING_PITCH_STEP semitones per ring, like the beam hum
export const MUSIC_SCALES = [[0, 2, 4, 7, 9], [0, 2, 3, 5, 7, 9, 10], [0, 2, 3, 5, 7, 8, 10], [0, 2, 4, 6, 7, 9, 11], [0, 1, 3, 5, 7, 8, 10]]; // Hearth pentatonic / Veil dorian / Deep aeolian / Shoal lydian (S-47b) / Kiln phrygian (S-48a)
export const MUSIC_PROGRESSIONS = [[0, 3, 1, 2], [0, 3, 0, 6], [0, 5, 3, 6], [0, 1, 4, 1], [0, 1, 0, 6]]; // chord roots (scale degrees) per ring; Shoal leans on lydian's major II, Kiln on phrygian's flat II
export const MUSIC_RING_MAX = 4; // the music's ring clamp (S-48a: Kiln has its own phrygian pad)
export const MUSIC_CHORD_S = [10, 14], MUSIC_ATTACK_S = 3, MUSIC_RELEASE_S = 4; // a chord every 10-14 s, fades in 3 s, out 4 s
export const MUSIC_PAD = { gain: 0.05, triMix: 0.5, lowpassHz: 900 };
export const MUSIC_BELL = { gain: 0.12, gapS: [3, 7], decayS: 0.8, attackS: 0.03, octave: 2 };
export const MUSIC_PULSE = { gain: 0.09, bpm: 70, noteS: 0.2, attackS: 0.02, octave: 0, wakeRate: 1.5 };
// S-53b: the Burrower rumble, a held low drone on the music bus while a Burrower is within `cells` of the core (both modes):
// sine `hz` + triangle at 1.5×, lowpassed, wobbling at `wobbleHz`; level 0.5…1 by closeness, ramped over `rampS`.
export const MUSIC_RUMBLE = { gain: 0.09, hz: 52, triMix: 0.35, lowpassHz: 240, wobbleHz: 6, wobble: 0.35, cells: 4, rampS: 0.5 };
export const MUSIC_XFADE_S = 4, MUSIC_END_FADE_S = 3, MUSIC_LOOKAHEAD_S = 0.1, MUSIC_MAX_VOICES = 6;
// S-47 Undertow (D-124, undertow.js): each CHUNK whose centre cell is in the Shoal (ring UNDERTOW_RING) draws, from
// seededStream(seed, 'undertow') in chunk order, calm (UNDERTOW_CALM share) or a current of UNDERTOW_SPEED[0] + r × [1] px/s
// in one of 8 directions. The core's current eases to its chunk's over UNDERTOW_EASE_S and adds to the realized velocity;
// pickups drift at UNDERTOW_PICKUP of their chunk's. Dashes on screen ≤ UNDERTOW_DASHES[0] (graphics Low: [1]). Not saved.
export const UNDERTOW_RING = 3, UNDERTOW_CALM = 0.5, UNDERTOW_SPEED = [30, 25], UNDERTOW_EASE_S = 0.5, UNDERTOW_PICKUP = 0.5;
export const UNDERTOW_DASHES = [30, 15], UNDERTOW_RGB = '150, 240, 220';
// S-47b brittle glass (D-128, shatter.js): a Shoal (ring SHATTER_RING) ROCK / DENSE break cracks one seeded ROCK / DENSE
// 4-neighbour for SHATTER_SHARE of its hp; a crack that breaks it cracks nothing. A faint line flashes SHATTER_FLASH_S. Not saved.
export const SHATTER_RING = 3, SHATTER_SHARE = 0.6, SHATTER_FLASH_S = 0.35, SHATTER_RGB = '190, 255, 235';
// S-48a Kiln beam heat (D-129, heat.js): heat += (share of the core's beam damage on Kiln-ring cells, ≤ 1) × dt / KILN_HEAT_S;
// with none that frame it cools at KILN_COOL_MUL / KILN_HEAT_S per s. At 1 the realized beam is off KILN_OVERHEAT_S, then heat = RESTART.
export const KILN_RING = 4, KILN_HEAT_S = 8, KILN_COOL_MUL = 2, KILN_OVERHEAT_S = 1.2, KILN_HEAT_RESTART = 0.25, KILN_ARC_FROM = 0.3;
export const HEAT_RGB = '255, 244, 228'; // warm white: the heat arc round the core (an arc, so its shape tells it from Glitch orange)
// S-51 (D-141) Heat Sink (heatsink.js): crafted for HEATSINK_COST, HEATSINK_STOCK carried, HEATSINK_MAX placed, on open Kiln floor
// ≥ HEATSINK_GAP cells from another Sink. Within HEATSINK_R cells of one, the core's beam heat gain × HEATSINK_MUL (cooling and
// vents unchanged). B / ✦ within HEATSINK_PICK_R cells picks it up (full refund: it goes back to stock). Calx lilac.
export const HEATSINK_COST = { calx: 6, shard: 20 }, HEATSINK_STOCK = 2, HEATSINK_MAX = 6, HEATSINK_GAP = 6, HEATSINK_R = 5, HEATSINK_MUL = 0.4, HEATSINK_PICK_R = 1.5;
export const HEATSINK_RGB = '200, 160, 255';
// S-56 (D-153) Ward (ward.js): crafted for WARD_COST, WARD_STOCK carried, WARD_MAX placed, on open floor outside the Nexus disc
// ≥ WARD_GAP cells from another Ward. Every WARD_S it bolts the creature nearest it within WARD_R cells with a clear line for
// WARD_DMG hp (a Spitter bolt in one): Glitches / Spitters (Surge), Burrowers / motes (both). Same in Drift and Surge; no light.
export const WARD_COST = { prism: 8, shard: 30 }, WARD_STOCK = 2, WARD_MAX = 4, WARD_GAP = 6, WARD_R = 4, WARD_S = 0.8, WARD_DMG = 1.2, WARD_PICK_R = 1.5, WARD_SHOT_S = 0.14;
export const WARD_RGB = '190, 255, 120'; // lime: the Ward's ring, ticks, shot and map mark
// S-48b Kiln flare vents (D-129, vent.js): seed-only sites on Kiln cells, one per VENT_PER_CELLS Kiln cells, ≥ VENT_GAP apart.
// Each cycles VENT_PERIOD_S from a seeded phase: a VENT_TELL_S tell, then a VENT_FLARE_S flare of VENT_R cells that shoves the
// core out at HURT_KNOCKBACK and adds VENT_HEAT heat, once per flare. No damage, no cargo loss. Never saved.
export const VENT_PER_CELLS = 250, VENT_GAP = 6, VENT_TRIES = 60, VENT_PERIOD_S = 8, VENT_TELL_S = 1, VENT_FLARE_S = 0.6, VENT_R = 2.5, VENT_HEAT = 0.4;
export const VENT_HEAR_R = 5; // audit 109: a seen vent this close (cells) sounds its tell once per cycle
export const VENT_RGB = '255, 232, 205'; // warm white: the vent hexagon and its flare
// S-58 Flare Lock (D-159, lock.js): an outer vault centred in the Kiln. Its shell takes beam damage × 0, except in a
// LOCK_SOFT_S soft window at the end of its own VENT_PERIOD_S cycle (× LOCK_SOFT_MUL), after a VENT_TELL_S tell (S-58 said 2 s × 1.5;
// 3 s × 2 meets the ≤ 2× time-to-open probe, D-159). The window opens with a flare: a core within VENT_R cells of the 7×7
// footprint is shoved out and gains VENT_HEAT. Seed-only, unsaved.
export const LOCK_SOFT_S = 3, LOCK_SOFT_MUL = 2, LOCK_RGB = '255, 150, 60', LOCK_SPARK = '#8a8f96'; // orange tell / dull grey spark
// S-59 Tide Lock (D-162, lock.js): an outer vault centred in the Shoal. Its chunk always flows (a calm draw becomes LOCK_TIDE_MIN
// px/s along a seeded heading); its shell takes beam damage only when the hit points against that flow (dot < LOCK_TIDE_DOT).
export const LOCK_TIDE_MIN = 40, LOCK_TIDE_DOT = -0.5;
// S-60a Crucible (D-158, boss.js): a seed-only LAIR_HALF·2+1 lair per outer ring (salt 'lair-<ring>', up to LAIR_TRIES draws at
// centre distance LAIR_D[ring]), all in the ring, clear of vaults (LAIR_CLEAR.vault cells), vents / Anomalies (.site) and Spires
// (.spire). Floor, a BOSS_CORE centre ringed by 8 BOSS_PLATEs (hp in MATERIAL). Take-apart: only the lit plate takes damage;
// the glow then moves to (i + 5) mod 8; the core cuts once all 8 are gone and bursts BOSS_LOOT (biome: the ring's ore). The core
// flares like a vent (VENT_PERIOD_S, VENT_TELL_S tell) within BOSS_FLARE_R cells: shove + VENT_HEAT, no damage. Saved: down flags.
export const LAIR_HALF = 4, LAIR_TRIES = 60, LAIR_D = { 3: [88, 100], 4: [108, 118] }, LAIR_CLEAR = { vault: 2, site: 3, spire: 6 };
export const BOSS_CORE_HP = 40, BOSS_PLATE_HP = 16, BOSS_FLARE_R = 3, BOSS_LOOT = { shard: 80, prism: 20, biome: 24 };
export const BOSS_KEY_RGB = '255, 120, 40', BOSS_NAMES = { 3: 'Gyre', 4: 'Crucible' }, BOSS_ORE = { 3: 'tide', 4: 'calx' };
// S-60b Surge form (D-165): a live boss wakes in Surge while the core is within BOSS_WAKE_R cells: every plate cuts, in any order
// (the core still waits for all 8); the flare cycles BOSS_SURGE_FLARE_S and also hurts BOSS_FLARE_DMG within BOSS_FLARE_R; every
// BOSS_EMBER_S it lobs an ember (a Spitter bolt from BOSS_EMBER_OUT cells out) at a core in line of sight within BOSS_EMBER_R cells.
export const BOSS_WAKE_R = 10, BOSS_SURGE_FLARE_S = 4, BOSS_FLARE_DMG = 10, BOSS_EMBER_S = 2, BOSS_EMBER_R = 10, BOSS_EMBER_OUT = 2.2;
// S-61a Gyre (D-168, gyre.js): the Shoal boss (ring 3; same lair rules and stamp). Within GYRE_R cells of its core the Undertow
// is replaced by a clockwise tangential current of GYRE_SPEED px/s. One plate is the mint key (GYRE_RGB); only it cuts. The
// key steps one standing plate clockwise every GYRE_STEP_S (plates keep their damage). No flare. BOSS_WAKES: the rings whose
// boss has a Surge form. S-61b (D-170): awake, every GYRE_SWARM_S it releases a mote swarm at the lair edge (≤ GYRE_SWARMS
// alive); a core within GYRE_RIM_PX of a standing body cell takes BOSS_TOUCH_DMG + knockback, once per GYRE_TOUCH_CD_S (the rim
// sparks for the last GYRE_RIM_TELL_S); the whirlpool also pulls inward at GYRE_PULL px/s.
export const GYRE_RING = 3, GYRE_R = 6, GYRE_SPEED = 45, GYRE_STEP_S = 1.2, GYRE_RGB = '120, 255, 200', BOSS_WAKES = [3, 4];
export const GYRE_SWARM_S = 15, GYRE_SWARMS = 2, GYRE_RIM_PX = 8, BOSS_TOUCH_DMG = 12, GYRE_TOUCH_CD_S = 4, GYRE_RIM_TELL_S = 0.5, GYRE_PULL = 30;
// Session 136 (D-174): the rim tell's glow as stacked strokes [lineWidth px, alpha ×] (was shadowBlur 12 over a 4-cell box).
export const GYRE_RIM_GLOW = [[10, 0.15], [6, 0.3], [2, 1]];
export const BOSS_RGB = { 3: GYRE_RGB, 4: BOSS_KEY_RGB };
export const BOSS_CHART_ALPHA = 0.35; // S-62: an unseen lair's minimap octagon at Chart level 2 (faint)
// S-53 Burrower (D-142, D-145, burrower.js): the Kiln creature, 256 worlds only, one at a time while the core is in the Kiln.
// First BURROW_FIRST_S in the Kiln, then BURROW_EVERY_S [min, + span] after the last one ended. Starts in rock 10–14 cells
// out, moves one cell per BURROW_STEP_S through ROCK / DENSE / ore (or open floor), clearing each cell it leaves (no
// pickups). From BURROW_TELL_CELLS of its goal a BURROW_TELL_S tell, then it surfaces for BURROW_UP_S (hp BURROW_HP, the
// only time the beam can hit it). Surge: a BURROW_DMG lunge unless the core moved ≥ BURROW_DODGE cells in the tell; contact
// re-hit GLITCH_HIT_CD_S. Drift (S-53c, D-147): the same hunt, an undodged surfacing bites BURROW_BITE cargo items (gone).
// Tunnel ore pays nothing. Then it burrows BURROW_AWAY cells off and returns. Kill / drive-off: the cell it broke out of +
// the Glitch loot of its tier. Never saved.
export const BURROW_FIRST_S = 20, BURROW_EVERY_S = [20, 10], BURROW_SPAWN_R = [10, 14], BURROW_STEP_S = 0.5, BURROW_TELL_CELLS = 2;
export const BURROW_TELL_S = 0.8, BURROW_UP_S = 2, BURROW_HP = 6, BURROW_DMG = 22, BURROW_DODGE = 1.5, BURROW_BITE = 4;
export const BURROW_AWAY = 12, BURROW_TRIP_S = 25, BURROW_LEASH = 24, BURROW_R = 11, BURROW_RGB = '200, 160, 255'; // Calx lilac
// S-54 Mote swarm (D-142, D-150, mote.js): the Shoal creature, 256 worlds only, one swarm of SWARM_N at a time while the core
// is in the Shoal. First SWARM_FIRST_S in the Shoal, then SWARM_EVERY_S [min, + span] after the last one ended, SWARM_SPAWN_R
// cells out on open floor the core can be reached from. Motes: r MOTE_R, hp MOTE_HP (S-54 said 0.5; 2 meets the gate, D-150),
// MOTE_SPEED px/s toward their prey (straight with a clear line, else down a BFS field of MOTE_FIELD cells), steered at
// MOTE_STEER /s, pulled to the swarm centre (MOTE_COHESION /s per px), plus their chunk's full Undertow flow. Surge: contact MOTE_DMG (knockback, re-hit
// GLITCH_HIT_CD_S); Drift: a loose pickup within MOTE_PREY_R cells of the core, outside the Attractor's reach, is carried
// (one each, dropped when beamed); with none, the hold. A touch of the hold (both modes) takes MOTE_TAKE items for good. After
// a touch it scatters MOTE_SCATTER cells and returns. Each mote beamed: MOTE_LOOT ◆; the whole swarm: the Glitch loot once.
// Leash SWARM_LEASH cells from the core. Never saved.
export const SWARM_N = 6, SWARM_FIRST_S = 20, SWARM_EVERY_S = [40, 20], SWARM_SPAWN_R = [10, 12], SWARM_LEASH = 24;
export const MOTE_R = 4, MOTE_HP = 2, MOTE_SPEED = 150, MOTE_STEER = 4, MOTE_COHESION = 0.6, MOTE_DMG = 4, MOTE_PREY_R = 6;
export const MOTE_FIELD = 20; // cells: the BFS field the swarm flies in by (and spawns on)
export const MOTE_TAKE = 1, MOTE_SCATTER = 3, MOTE_SCATTER_S = 1.2, MOTE_LOOT = 1, MOTE_TRAIL = 5, MOTE_RGB = '150, 255, 200'; // mint
