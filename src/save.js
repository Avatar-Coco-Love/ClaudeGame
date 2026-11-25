// Save format versioning. Every change to the save shape gets:
//   1. SAVE_FORMAT += 1
//   2. one new function appended to STEPS that turns format N into N+1 (never edit a step once merged)
//   3. a smoke check that a save in the old format still loads, comparing with SAVE_FORMAT, never a number (D-075:
//      `tests/saveformat.cjs` fails on a pinned format and on a missing step).
// Saves written before formats were tracked have no `v`; they are format 1.
import { vaultSites, unpackBits } from './world.js';
import { chooseSpires } from './spire.js';
import { WORLD_W, WORLD_H } from './config.js';

export const SAVE_FORMAT = 17;

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
  s => ({ ...s, spires: chooseSpires(s.seed, s.explored, s.broken) }), // 9 -> 10: Spires (S-19) only where this save hasn't looked (D-024)
  s => ({ ...s, craft: { ...s.craft, relay: 0, last: 'beacon' }, relays: [] }), // 10 -> 11: Relays (S-22): none crafted, none placed
  s => ({ ...s, spires: Array.isArray(s.spires) ? s.spires.map(q => q && q.lit && !q.mode ? { ...q, mode: 'broken' } : q) : s.spires }), // 11 -> 12: S-28 `mode` (D-081): only broken Spires could relight before
  s => ({ ...s, ended: false, endedAt: null }), // 12 -> 13: S-24 ending; a save with every Spire already lit gets its ending on load (game.js)
  s => ({ ...s, cycle: 0, records: {} }), // 13 -> 14: S-29 New Cycle: every world so far is cycle 0
  s => ({ ...s, anomalies: {}, buffs: [] }), // 14 -> 15: S-35 Anomalies: none taken, no buff active
  s => ({ ...s, echoOrder: 'gather' }), // 15 -> 16: S-43 Echo orders; Gather was the only one
  s => ({ ...s, weatherCancel: -1 }), // 16 -> 17: B-081 a Wake-cancelled weather event stays cancelled; none recorded before
];

// Vaults whose footprint touches a cell the save has explored or broken; computed once here, then stored.
function seenVaults(s) {
  const sites = vaultSites(s.seed), n = WORLD_W * WORLD_H;
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
 *  no Continue rather than throwing); bank and cargo become whole non-negative counts of the known resources. */
function saneSave(s) {
  if (!Number.isInteger(s.seed)) return null;
  for (const k of ['explored', 'broken']) if (typeof s[k] !== 'string' || !B64_RE.test(s[k])) return null;
  for (const k of ['bank', 'cargo']) {
    const o = s[k] && typeof s[k] === 'object' ? s[k] : {};
    s[k] = { shard: count(o.shard), prism: count(o.prism), lumen: count(o.lumen) };
  }
  return s;
}
