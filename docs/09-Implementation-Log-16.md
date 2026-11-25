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

## Session 113 — Build: S-53c Burrower retune (v1.6.54, D-148)
- `burrower.js`: both modes hunt the core (2-cell tell, 1.5-cell dodge); Drift undodged = `bite()` takes 4 cargo items in
  `BITE_ORDER` (≈ ⬟ ▲ ● ◆), gone; no re-bite while up; empty hold = nothing, no event. Tunnel ore: yield lost (`lost`
  counter); the belly = only the cell it breaks out of. `BURROW_EVERY_S` [20, 10]; `BURROW_ORE_R` / `findOre` removed.
- Feel: `audio.crunch()` (lowpassed seeded noise, 0.14 s: peak -30.7 dBFS, 0 % > 2 kHz, loud 0.05 s); `#cargo-fill.bit`
  lilac flash 0.6 s; first bite of a session toasts "A Burrower bit your hold". Screenshot viewed: bar lilac, toast set.
- Gate `node tools/biomefoe.mjs --seeds=8` (10 min, 24 s wall): Drift 0.866, Surge 0.906, gap 0.040: **PASS**. Drift:
  124 Burrowers, 108 kills, 503 items bitten, tunnel ore lost 263; Surge 95 lunges, 0 deaths either way.
- `burrower.cjs` +5 checks (gap 20–30; Drift tell → bite 4 most valuable first, once, no damage; dodged / empty hold = 0;
  tunnel ore pays nothing in both modes); old "Drift eats ore near the core" check removed (behaviour superseded).
  `audio.cjs` +1 row (crunch). No new bugs.

## Session 114 — Audit: glow clips (B-091), Kiln perf run, biome ores in 08, 09 archive (v1.6.55, D-149)
- No subagent tool again: sweeps in-session, newest code first (Burrower S-53a…c, then the debt two audits carried: perf).
- Perf re-measured (debt since audit 104): `tools/perf.cjs` gains `kiln` (d 110, a Burrower kept alive, vents on).
  At CPU ×4: kiln 39–41 ms mean, p95 83 vs base 32–34, p95 50 (1.32×); Burrower off still 37–39.
- **B-091** (fixed): a shadowBlur draw in 'lighter' blurs a layer as big as the clip: 3.9 ms per draw unclipped vs
  0.09 clipped (bare canvas). Unclipped: flaring vents (S-48b), Anomaly sites + take ring (S-36), Scanner ring, the
  Burrower tell (6.4 ms a frame → 0.01). Each is now clipped to its box + `R.glowPad(blur)` (reach in world px at any
  zoom × DPR). After: kiln 33–34 ms, p95 50 (≈ 1.05× base). Pixels: clip vs no clip diff 0 for the tell (zoom 1 and
  0.62); full frames ≤ 5 / 255 at the site, matching frame-to-frame noise elsewhere. Tell screenshot viewed.
- Checks: `drawcost.cjs` instruments real frames (vents, anomaly, scan, tell) and fails any blurred non-source-over draw
  outside a clip; `burrower.cjs` pixel-compares the clipped tell. Both fail on the old code (proved: stash).
- D-145…D-148 checked against the code: match (belly = break-out cell, rumble 52 Hz / 240 lowpass, seeded crunch,
  `BITE_ORDER`). Burrower logic swept (leash, mode switch, death, Wake, kill on the last up frame): no bug found.
- Docs: biome ore lines in `08` (audit 109 debt); `09` sessions 104–108 archived word for word (part 14 removed).
- Workflow review (D-138): too little: perf scenes for new biomes (the vents' glow shipped unmeasured in
  S-48b); a rule broken three times (S-15, B-027, B-091) is now a check (D-149). Too much: full smoke > 10 min still.
- Smoke 533/533 (+2: drawcost glow clips, burrower tell clip pixels).
