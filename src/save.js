// Save format versioning. Every change to the save shape gets:
//   1. SAVE_FORMAT += 1
//   2. one new function appended to STEPS that turns format N into N+1 (never edit a step once merged)
//   3. a smoke check that a save in the old format still loads, comparing with SAVE_FORMAT, never a number (D-075:
//      `tests/saveformat.cjs` fails on a pinned format and on a missing step).
// Saves written before formats were tracked have no `v`; they are format 1.
import { vaultSites, unpackBits } from './world.js';
import { chooseSpires } from './spire.js';
import { WORLD_SIZE_OLD, WORLD_PROFILES, KINDS } from './config.js';

export const SAVE_FORMAT = 28;

// STEPS[i] upgrades a format (i + 1) save to format (i + 2).
export const STEPS = [
  s => ({ ...s, nexus: { radiance: 0 } }), // 1 -> 2: Nexus Development (S-1)
  s => ({ ...s, pickups: [] }),            // 2 -> 3: floor pickups are saved (B-011)
  s => ({ ...s, vaultSkip: seenVaults(s) }), // 3 -> 4: vaults (S-9) never appear where this save has already looked (D-023)
  s => ({ ...s, bank: { ...s.bank, lumen: 0 }, cargo: { ...s.cargo, lumen: 0 } }), // 4 -> 5: Lumen (S-10)
  s => ({ ...s, research: {} }),           // 5 -> 6: Research (S-11)
  s => ({ ...s, beamMode: 'focus' }),      // 6 -> 7: beam modes (S-13)
  s => ({ ...s, pickups: (s.pickups || []).map(q => [q[0], q[1], q[2], 1]) }), // 7 -> 8: `kept` tags (B-022); an old floor may hold scattered cargo, so all of it is kept
  s => ({ ...s, craft: { beacon: 0 }, beacons: [] }), // 8 -> 9: Beacons (S-16): none crafted, none placed
  s => ({ ...s, spires: chooseSpires(s.seed, s.explored, s.broken, WORLD_SIZE_OLD) }), // 9 -> 10: Spires (S-19) only where this save hasn't looked (D-024)
  s => ({ ...s, craft: { ...s.craft, relay: 0, last: 'beacon' }, relays: [] }), // 10 -> 11: Relays (S-22): none crafted, none placed
  s => ({ ...s, spires: Array.isArray(s.spires) ? s.spires.map(q => q && q.lit && !q.mode ? { ...q, mode: 'broken' } : q) : s.spires }), // 11 -> 12: S-28 `mode` (D-081): only broken Spires could relight before
  s => ({ ...s, ended: false, endedAt: null }), // 12 -> 13: S-24 ending; a save with every Spire already lit gets its ending on load (game.js)
  s => ({ ...s, cycle: 0, records: {} }), // 13 -> 14: S-29 New Cycle: every world so far is cycle 0
  s => ({ ...s, anomalies: {}, buffs: [] }), // 14 -> 15: S-35 Anomalies: none taken, no buff active
  s => ({ ...s, echoOrder: 'gather' }), // 15 -> 16: S-43 Echo orders; Gather was the only one
  s => ({ ...s, weatherCancel: -1 }), // 16 -> 17: B-081 a Wake-cancelled weather event stays cancelled; none recorded before
  s => ({ ...s, size: WORLD_SIZE_OLD }), // 17 -> 18: S-45 (D-120) world size is saved; every world so far was 160×160
  s => ({ ...s, bank: { ...s.bank, tide: 0, calx: 0 }, cargo: { ...s.cargo, tide: 0, calx: 0 } }), // 18 -> 19: S-49 biome ores Tide / Calx
  s => ({ ...s, craft: { ...s.craft, sink: 0 }, sinks: [] }), // 19 -> 20: S-51 Heat Sinks: none crafted, none placed
  s => ({ ...s, nexus: { ...s.nexus, chart: 0 } }), // 20 -> 21: S-52 Nexus Chart: not bought
  s => ({ ...s, craft: { ...s.craft, ward: 0 }, wards: [] }), // 21 -> 22: S-56 Wards: none crafted, none placed
  s => ({ ...s, bosses: [] }), // 22 -> 23: S-60a boss lairs: none recorded, so each is stamped fresh (refunds what was placed in it)
  s => ({ ...s, nexus: { ...s.nexus, lens: 0 } }), // 23 -> 24: S-63 Nexus Lens: not built
  s => ({ ...s, echoLevels: { focus: 0, volley: 0, tether: 0 } }), // 24 -> 25: S-70 Echo upgrades: none bought
  s => ({ ...s, craft: { ...s.craft, decoy: 0 }, decoys: [] }), // 25 -> 26: S-77a Decoys: none crafted, none placed
  s => ({ ...s, stats: { ...s.stats, kinds: 0, rifts: 0 } }), // 26 -> 27: S-66a feats' counters: no kind taken, no pocket emptied
  s => ({ ...s, nexus: { ...s.nexus, lure: (s.craft && s.craft.decoy > 0) || (Array.isArray(s.decoys) && s.decoys.length) ? 1 : 0 } }), // 27 -> 28: S-77b2 Lure: built if the save holds a Decoy (D-218)
];

// Vaults whose footprint touches a cell the save has explored or broken; computed once here, then stored.
function seenVaults(s) {
  const sites = vaultSites(s.seed, WORLD_SIZE_OLD), n = WORLD_SIZE_OLD * WORLD_SIZE_OLD; // format 3 predates size
  const ex = unpackBits(s.explored, n), br = unpackBits(s.broken, n);
  return sites.map((v, i) => v.cells.some(c => ex[c] || br[c]) ? i : -1).filter(i => i >= 0);
}

export function upgradeSave(save) {
  if (!save || typeof save !== 'object') return null;
  let v = save.v ?? 1;
  if (v > SAVE_FORMAT) return null; // written by a newer build; leave it untouched in storage, don't guess
  while (v < SAVE_FORMAT) { save = STEPS[v - 1](save); v += 1; save.v = v; }
  return saneSave(save);
}

const B64_RE = /^[A-Za-z0-9+/]*={0,2}$/;
const count = x => (Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
/** Audit 79 (B-066, B-067; B-037: never trust a save): a save without a seed or a readable map is no save (title shows
 *  no Continue rather than throwing); bank and cargo become whole non-negative counts of the known resources.
 *  S-45: `size` must be a known world size and each bitset must hold exactly size² bits (packBits' byte count). */
function saneSave(s) {
  if (!Number.isInteger(s.seed)) return null;
  if (!Number.isInteger(s.size) || !Object.hasOwn(WORLD_PROFILES, s.size)) return null;
  const bytes = Math.ceil(s.size * s.size / 8);
  for (const k of ['explored', 'broken']) {
    if (typeof s[k] !== 'string' || !B64_RE.test(s[k])) return null;
    try { if (atob(s[k]).length !== bytes) return null; } catch { return null; }
  }
  for (const k of ['bank', 'cargo']) {
    const o = s[k] && typeof s[k] === 'object' ? s[k] : {};
    s[k] = Object.fromEntries(KINDS.map(r => [r, count(o[r])]));
  }
  return s;
}
