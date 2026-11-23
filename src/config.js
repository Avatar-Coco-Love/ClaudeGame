// Tunable constants. Everything gameplay-numeric lives here so balance passes touch one file.

// Game version: 0.<milestone>.<PR count>. Bump in every PR, together with a new top entry in docs/05-Changelog.md
// (tests/docs.cjs fails if the two disagree).
export const VERSION = '0.1.9';
export const CELL = 32;
export const WORLD_W = 160;
export const WORLD_H = 160;
export const CHUNK = 16; // cells per render chunk edge
export const NEXUS_RADIUS = 5.5 * CELL; // px; deposit + safe zone
export const LIGHT_RADIUS = 260; // px around the core

export const T = { EMPTY: 0, ROCK: 1, DENSE: 2, CRYSTAL: 3, PRISM: 4, BEDROCK: 5 };

export const MATERIAL = {
  [T.ROCK]:    { hp: 0.55, fill: '#17215a', edge: '#3d6bff', yield: null },
  [T.DENSE]:   { hp: 2.6,  fill: '#231658', edge: '#8a5cff', yield: null },
  [T.CRYSTAL]: { hp: 0.9,  fill: '#0c3446', edge: '#2ef2ff', yield: { kind: 'shard', min: 1, max: 3 } },
  [T.PRISM]:   { hp: 2.4,  fill: '#3a1046', edge: '#ff4fd8', yield: { kind: 'prism', min: 1, max: 2 } },
  [T.BEDROCK]: { hp: Infinity, fill: '#05060f', edge: '#1b2140', yield: null },
};

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
