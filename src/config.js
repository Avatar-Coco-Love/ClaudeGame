// Tunable constants. Everything gameplay-numeric lives here so balance passes touch one file.

// Game version: <major>.<minor>.<PR count> (D-046: minor = milestones shipped; 1.0 = M5). Bump in every PR, together with a new top entry in docs/05-Changelog.md
// (tests/docs.cjs fails if the two disagree).
export const VERSION = '0.2.34';
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
// S-6 (D-017): an alert Glitch that hasn't closed GLITCH_PROGRESS_PX on its best distance for GLITCH_GIVE_UP_S gives up
// and fades out over GLITCH_FADE_S (harmless, no loot, not beam-targetable), freeing its spawn slot.
export const GLITCH_PROGRESS_PX = 24;
export const GLITCH_GIVE_UP_S = 6;
export const GLITCH_FADE_S = 0.6;
// D-018 (Q-007 fallback): once Glitches stop sticking, a kill drops a Prism only this often (Shards unchanged).
export const GLITCH_PRISM_CHANCE = 0.5;

// S-4 Feel pass (D-021). Reduced motion turns off hitstop and the upgrade ring (shake already off); sounds stay.
export const HITSTOP_S = 0.035;     // sim freeze on a crystal/prism break
export const HITSTOP_GAP_S = 0.15;  // at most one hitstop per this much game time
export const CORE_RING_S = 0.4;     // expanding ring on the core after a Core Matrix purchase

export const T = { EMPTY: 0, ROCK: 1, DENSE: 2, CRYSTAL: 3, PRISM: 4, BEDROCK: 5, VAULT: 6, CACHE: 7, LUMEN: 8 };

export const MATERIAL = {
  [T.ROCK]:    { hp: 0.55, fill: '#17215a', edge: '#3d6bff', yield: null },
  [T.DENSE]:   { hp: 2.6,  fill: '#231658', edge: '#8a5cff', yield: null },
  [T.CRYSTAL]: { hp: 0.9,  fill: '#0c3446', edge: '#2ef2ff', yield: { kind: 'shard', min: 1, max: 3 } },
  [T.PRISM]:   { hp: 2.4,  fill: '#3a1046', edge: '#ff4fd8', yield: { kind: 'prism', min: 1, max: 2 } },
  [T.BEDROCK]: { hp: Infinity, fill: '#05060f', edge: '#1b2140', yield: null },
  [T.VAULT]:   { hp: 6,    fill: '#142a3a', edge: '#d8fbff', yield: null }, // S-9 vault shell: tough, no yield
  [T.CACHE]:   { hp: 3,    fill: '#1d1440', edge: '#ffffff', yield: null }, // S-9 vault centre: bursts VAULT_LOOT
  [T.LUMEN]:   { hp: 3.5,  fill: '#3a2a0a', edge: '#ffc94f', yield: { kind: 'lumen', min: 1, max: 1 } }, // S-10, Deep only
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
export const RESEARCH = [
  { id: 'scanner', name: 'Scanner', desc: 'Ping: shows ore and vault caches within 12 cells for a few seconds', cost: 10 },
  { id: 'wide', name: 'Wide Beam', desc: 'A 3-cell swath: slower per cell, carves wide halls', cost: 25 },
];
export const RESEARCH_HINT = 'Gold Lumen ● hides past 55 cells, in the Deep';
export const SCAN_RADIUS = 12;     // cells
export const SCAN_COOLDOWN_S = 20;
export const SCAN_SHOW_S = 6;
export const SCAN_SPEED = 600;     // px/s, the ring's growth

// Beam modes (S-13, D-036), in Q / ⟂ cycle order. Rays are parallel, `offsets` px sideways; range and damage are multipliers
// on the Core Matrix stats (per ray, per cell: a cell or Glitch under two rays takes damage once). Wide: ~1.35× cells/s, 2.2× slower each.
export const WIDE_OFFSET = 32, WIDE_RANGE = 0.75, WIDE_DMG = 0.45;
export const BEAM_MODES = {
  focus: { name: 'Focus', research: null, offsets: [0], range: 1, dmg: 1 },
  wide: { name: 'Wide', research: 'wide', offsets: [-WIDE_OFFSET, 0, WIDE_OFFSET], range: WIDE_RANGE, dmg: WIDE_DMG },
};

export const MODES = {
  drift: { name: 'Drift', blurb: 'Calm. No hostiles. Mine, explore, build at your own pace.' },
  surge: { name: 'Surge', blurb: 'Glitches hunt in the dark. Same rewards, more heartbeat.' },
};
