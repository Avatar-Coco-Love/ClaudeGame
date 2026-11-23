// Save format versioning. Every change to the save shape gets:
//   1. SAVE_FORMAT += 1
//   2. one new function appended to STEPS that turns format N into N+1 (never edit a step once merged)
//   3. a smoke check that a save in the old format still loads.
// Saves written before formats were tracked have no `v`; they are format 1.
import { vaultSites, unpackBits } from './world.js';
import { WORLD_W, WORLD_H } from './config.js';

export const SAVE_FORMAT = 5;

// STEPS[i] upgrades a format (i + 1) save to format (i + 2).
const STEPS = [
  s => ({ ...s, nexus: { radiance: 0 } }), // 1 -> 2: Nexus Development (S-1)
  s => ({ ...s, pickups: [] }),            // 2 -> 3: floor pickups are saved (B-011)
  s => ({ ...s, vaultSkip: seenVaults(s) }), // 3 -> 4: vaults (S-9) never appear where this save has already looked (D-023)
  s => ({ ...s, bank: { ...s.bank, lumen: 0 }, cargo: { ...s.cargo, lumen: 0 } }), // 4 -> 5: Lumen (S-10)
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
  return save;
}
