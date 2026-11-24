// S-19 probe (session 46): Spire placement over many seeds. Per seed: Spires placed, valid candidates per sector (min),
// which candidate each sector took, distances, nearest vault / Spire centre, and how many cells the stamp changed.
// Also re-chooses with a fully explored map, to show the D-024 fallback (`keep`) path is reachable and bounded.
// Usage: node tools/spirefind.mjs [seeds = 40] [first seed = 1]
import { vaultSites, packBits } from '../src/world.js';
import { spireCandidates, chooseSpires } from '../src/spire.js';
import { WORLD_W, WORLD_H } from '../src/config.js';

const [SEEDS = 40, FIRST = 1] = process.argv.slice(2, 4).map(Number);
let short = 0, minCand = Infinity, minVault = Infinity, minGap = Infinity, dMin = Infinity, dMax = 0, notFirst = 0;
for (let seed = FIRST; seed < FIRST + SEEDS; seed++) {
  const cands = spireCandidates(seed), sp = chooseSpires(seed), vaults = vaultSites(seed);
  if (sp.length < 5) short++;
  minCand = Math.min(minCand, ...cands.map(l => l.length));
  sp.forEach((s, k) => {
    if (cands[k][0].x !== s.x || cands[k][0].y !== s.y) notFirst++;
    const d = Math.hypot(s.x + 0.5 - WORLD_W / 2, s.y + 0.5 - WORLD_H / 2); dMin = Math.min(dMin, d); dMax = Math.max(dMax, d);
    minVault = Math.min(minVault, ...vaults.map(v => Math.hypot(v.x - s.x, v.y - s.y)));
    for (const o of sp) if (o !== s) minGap = Math.min(minGap, Math.hypot(o.x - s.x, o.y - s.y));
  });
}
const all = packBits(new Uint8Array(WORLD_W * WORLD_H).fill(1)), fb = chooseSpires(FIRST, all, all);
console.log(JSON.stringify({ seeds: SEEDS, fewerThan5: short, minValidCandidatesPerSector: minCand, fresh_notFirstCandidate: notFirst,
  d: [dMin.toFixed(1), dMax.toFixed(1)], minVaultGap: minVault.toFixed(1), minSpireGap: minGap.toFixed(1),
  fullyExploredFallback: fb.map(s => s.keep ? s.keep.length : 0) }));
