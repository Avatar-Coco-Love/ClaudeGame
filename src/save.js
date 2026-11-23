// Save format versioning. Every change to the save shape gets:
//   1. SAVE_FORMAT += 1
//   2. one new function appended to STEPS that turns format N into N+1 (never edit a step once merged)
//   3. a smoke check that a save in the old format still loads.
// Saves written before formats were tracked have no `v`; they are format 1.
export const SAVE_FORMAT = 1;

// STEPS[i] upgrades a format (i + 1) save to format (i + 2). Empty until the save shape first changes.
const STEPS = [];

export function upgradeSave(save) {
  if (!save || typeof save !== 'object') return null;
  let v = save.v ?? 1;
  if (v > SAVE_FORMAT) return null; // written by a newer build; leave it untouched in storage, don't guess
  while (v < SAVE_FORMAT) { save = STEPS[v - 1](save); v += 1; save.v = v; }
  return save;
}
