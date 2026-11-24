# 09 — Implementation Log, part 3

Continues `09-Implementation-Log.md` (split at the 8 KB cap, session 41; part 2 was archived in audit 49). Newest at the bottom; read the tail only.

## 2026-11-24 — Session 44 (v0.2.48): Audit — Pulse at bedrock, malformed saves, INTEGRITY label, tuning check
- Sweeps (correctness, mobile/touch + perf, code health + docs drift) ran in parallel; each finding re-run here before acting.
- **B-036 (fixed):** a full Pulse held facing bedrock fired 6 bursts in 10 s with no effect: `pulseInReach` used the raycast,
  which counts bedrock (and off-map) as solid. Now bedrock never counts; 0 bursts, and rock in front still fires.
- **B-037 (fixed):** `beacons: {}` / `3`, `pickups: {}`, `pickups: [5, null]` and `vaultSkip: {}` each threw inside `new Game`
  ("not iterable", "includes is not a function"): a crash on Continue. Now each non-array loads as empty.
- **B-038 (fixed):** `craft.beacon` loaded unclamped ('x' → NaN on ✦, 1e9 → endless Beacons). Now an integer 0..`BEACON_STOCK`.
  `tests/audit44.cjs` (3 checks) failed on the stashed old code (6 bursts; 5 throws; 1e9 / NaN), passes now.
- **B-035 (fixed):** "INTEGRITY" is 64 px of ink in a 46 / 54 px box. Label 68 px, `flex: none` (bar 14–22 px shorter); kept the
  word (matches the Core Matrix upgrade name) over "Hull". New touch check: no visible `#hud` leaf text wider than its box at
  320×568 / 568×320, labels end ≥ 4 px before the bar; failed old (64 > 46, 64 > 54). Viewed both sizes.
- **H1 (fixed, D-066):** game.js tuning → config.js unchanged; `tests/tuning.cjs` found 9 / 10 / 500 / 230 / 0.25 / 900 /
  250 / 0.035 / 320 in the old file. **H3:** `craft.cjs` no longer pins `SAVE_FORMAT === 9`. D-041's ⟂ label → D-065.
- Docs: 01 Crafting built; 02 autosave lists beacons; `.gitignore` drops root `*.png` except `og.png` (tracked, checked).
- **B-039 (watch, Debt):** 320 portrait with 4-digit ◆ ▲ ● puts the bank under the minimap (pre-dates this PR).
- Not fixed (Debt): buy helper / `buyRow`, smoke split, unused exports, duplicate media block, perf timers, light-hole gradient
  cache (T3: skipped for room; needs a pixel-identity proof). `09` sessions 34–38 archived word for word. All D-xxx checked.

## Session 45 — Build: S-26 `light.js` split + light-hole cache (v0.2.49, #50)
- `src/light.js` (`drawLight`, `drawLightGlow` = S-25 glow moved from `craft.js`), `src/terrain.js` (`paintChunk`); `render.js`
  546 → 464 lines. `R.lightSets` with `extraLights` alias (D-067). Split alone: 8/8 scene hashes identical to v0.2.48.
- Hole sprite cache: max 2/255 difference, see D-067. `tools/perf.cjs` ONLY=holes ×4 (this machine runs slower than session
  41's 133 ms): old 185 / 191 ms mean, split 188 / 181, cache 172 / 181; draw JS 27.5 → 22.7 ms; FLUSH=1 162 vs 181 ms mean.
- New drawcost checks: two light sets light like one (failed old: 2 / 22 draws); a warm frame builds 0 gradients (old: 21).
- No bugs found. Scratch tool for the pixel proof was not committed (pattern: freeze rAF, seed `Math.random`, `R.time = 0`).
