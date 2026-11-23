// Tunable constants. Everything gameplay-numeric lives here so balance passes touch one file.

// Game version: 0.<milestone>.<PR count>. Bump in every PR, together with a new top entry in docs/05-Changelog.md
// (tests/docs.cjs fails if the two disagree).
export const VERSION = '0.1.19';
// S-3 Settings: volume 0-100 maps linearly to master gain 0..MASTER_GAIN_MAX (default 70 -> 0.35, the pre-S-3 level).
export const DEFAULT_VOLUME = 70;
export const MASTER_GAIN_MAX = 0.5;
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

export const T = { EMPTY: 0, ROCK: 1, DENSE: 2, CRYSTAL: 3, PRISM: 4, BEDROCK: 5 };

export const MATERIAL = {
  [T.ROCK]:    { hp: 0.55, fill: '#17215a', edge: '#3d6bff', yield: null },
  [T.DENSE]:   { hp: 2.6,  fill: '#231658', edge: '#8a5cff', yield: null },
  [T.CRYSTAL]: { hp: 0.9,  fill: '#0c3446', edge: '#2ef2ff', yield: { kind: 'shard', min: 1, max: 3 } },
  [T.PRISM]:   { hp: 2.4,  fill: '#3a1046', edge: '#ff4fd8', yield: { kind: 'prism', min: 1, max: 2 } },
  [T.BEDROCK]: { hp: Infinity, fill: '#05060f', edge: '#1b2140', yield: null },
};

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
};

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

export const MODES = {
  drift: { name: 'Drift', blurb: 'Calm. No hostiles. Mine, explore, build at your own pace.' },
  surge: { name: 'Surge', blurb: 'Glitches hunt in the dark. Same rewards, more heartbeat.' },
};
