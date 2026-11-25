# 09 — Implementation Log, part 16

Continues `09-Implementation-Log-15.md` (part 15 neared the 8 KB cap at session 111). Newest at the bottom; read the tail only.

## Session 112 — Design: Q-030 Burrower retune, S-53c (v1.6.53, D-147)
- Play-test: `tools/biomefoe.mjs` (Kiln, top build) with temporary env switches in `burrower.js` / `config.js`, reverted
  before the PR (no gameplay code shipped). Ratios with / without, 8 seeds × 10 min (gate 0.85–0.95, gap ≤ 0.05):
  | variant (gap 20–30 unless noted) | Drift | Surge |
  |---|---|---|
  | as specced, gap 35–50 | 1.010 | 1.003 |
  | gap only | 1.034 | 0.936 |
  | tunnel ore not in the belly (T) | 1.037 | 0.906 |
  | T + no Glitch loot | 1.003 | 0.945 |
  | T, no loot, Drift bites 3 near its ore target (≤ 3 cells) + 1 / 0.5 s | 0.989 | — |
  | T, no loot, Drift heads for the core, bite 3 / 6 refunded on drive-off | 1.031 / 0.947 | — |
  | **T, Drift heads for the core, bite N lost, loot kept**: N 2 / 4 / 6 | 0.998 / **0.885** / 0.826 | 0.906 |
  | same, N 4, 16 seeds | 0.928 | 0.889 |
- Observed: a refunded loss never counts (the top-build bot kills 85–90 % of Drift Burrowers within its 2 s up);
  Drift kill counts rise from 43 to ~110 once it comes to the core, so Glitch loot still flows (D-142's trickle).
  Surge row noise between runs ~±0.03 (T vs T + no loot), hence the 16-seed confirm.
- Tell screenshot re-viewed (`burrower.cjs` BURROW_SHOT): lilac cracked cell reads in the dark beside the core; the
  Drift bite needs its own cue (cargo bar flash + crunch, specced).
- Docs: S-53c in new `07-Build-Specs-13.md` (part 12 would pass 8 KB); `05` v1.4.30–37 archived word for word;
  Q-030 closed; `02` trimmed (8062 B at start). Smoke run once before the PR.
