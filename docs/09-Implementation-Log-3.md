# 09 — Implementation Log, part 3

Continues `09-Implementation-Log-2.md` (split at the 8 KB cap, session 41). Newest at the bottom; read the tail only.

## 2026-11-24 — Session 41 (v0.2.45): Build — S-16 Beacons v1
- New `src/craft.js` (craft, place rules, load, beacon glyph). Craft tab (4th Matrix tab), B key / ✦ button with the count,
  `SAVE_FORMAT` 9 (`craft`, `beacons` as cell indices), soft placement tone (660 → 880 Hz sine, in `tests/audio.cjs` ceilings).
  `Renderer.extraLights` *is* `game.beacons` (D-060), so `render.js` grew only 541 → 544; no `drawLight` split needed yet.
- **Perf (`tools/perf.cjs`, ×4, 20 s):** "holes" now places 20 real beacons (hole + glyph). loot 127.8 mean / 183.3 p95 →
  holes 133.2 / 183.4 (1.04×; S-15 predicted +10 %). Light is 67 % of the JS split with 20 holes on screen.
- **Viewed:** a rock tunnel 30 cells east with 5 beacons at 1280×800 DSF 1 (pools read in rock; in an open Hearth cave the
  black floor shows little → Q-014), the Craft tab at 320×568, ✦ at 320×568 portrait and 667×375 / 844×390 landscape.
- 13 new checks (`tests/craft.cjs`): craft cost + stock cap, the 4 refusals, reveal = 81 cells, save/load, format-8 upgrade,
  bad saved indices dropped, the 20 cap in Surge, browser B/light-canvas/minimap pixel + reload, phones ×3. The phone
  checks failed on the old CSS first (4 tabs scrolled the sheet sideways at 320; ✦ in the row pushed ◎ into the bank at 667).
  `audit29`'s B-022 check pinned `SAVE_FORMAT === 8`; now `>= 8` and the upgrade must reach the current format. Smoke 152/152.
- **B-034 (open, Debt):** at 568×320 landscape ◎ + ⟂ already overlap the bank panel; pre-dates S-16.

## 2026-11-24 — Session 42 (v0.2.46): Design — Beacons, Pulse, the Deep; Q-013, Q-014; M5 specs split
- **Beacons (seed 77, 1280×800, core 9 cells away):** biggest open Hearth cave (426 cells, d 20) and Deep cave (1457, d 61):
  floor inside the pool 3.4 luma = unlit floor; only the glyph shows. Rock/tunnel walls in the pool 33 luma (reads). An
  in-page prototype (additive disc under the walls) at 0.05 gave 6.9–8.8, at 0.10 ~10, viewed: 0.10 reads as soft haze → D-061, S-25.
- **Pulse (Deep, Beam 2, Surge + god):** the ready shot sits full in an open cave with a solid reach line; reads well, no change.
- **The Deep:** `deeprun` 10 seeds, first Lumen median 30 s at Beam 2 (p90 82), 20 s at Beam 4 + 3 others. Viewed d 70 maxed.
- **B-034 measured:** with 4-digit ◆ ▲ ● in Surge the bank panel is 12–239 px at every landscape size (content, not
  min-width: `min-width: 0` changes nothing); ◎ starts at 168 / 240 / 267 px at 568 / 640 / 667 wide. Fix target in S-25.
- **Decisions:** D-061 (Q-014 floor glow), D-062 (Q-013 New Cycle carries cycle, records, a Nexus hue; no power),
  D-063 (11 one-PR specs to 1.0: S-25, S-26, S-19, S-27, S-22, S-20, S-28, bot, S-23, S-24, S-29; new `07-Build-Specs-4.md`).
- No code beyond `VERSION`. Play-test script kept out of the repo (one-off; the S-25 smoke check replaces it).

## 2026-11-24 — Session 43 (v0.2.47): Build — S-25 beacon floor glow + B-034
- **Glow (D-061):** `drawBeaconGlow` in `craft.js` (render.js 544 → 546; S-26 moves it to `light.js`): cached radial
  sprite per radius (D-051), `#bff8ff`, `BEACON_GLOW` 0.08 → 0.036 at 60 % → 0, after the grid, under the chunks, for every
  `R.extraLights` entry in view. Drawn direct, drawcost's 20 overlapping holes went 1.3 → 2.2× (budget 2×), so the discs
  are summed in a quarter-res layer over their union box and blitted once: 1.70×. `R.beaconGlow` = alpha (tests use 0).
- **Measured (`tests/glow.cjs`, 1280×800, carved 25×25 floor, core 11 cells off):** floor 3 cells in 3.3 → 7.1 luma
  (outside the pool 3.2, so 2.2×); a rock cell in the pool 22.2 → 22.2. Viewed: a soft haze, floor still reads dark.
  The check failed on the old code (3.3 vs 3.2).
- **B-034 (fixed):** the new touch check (568×320, 640×360, 667×375, 844×390; Surge, 8888 ×3, ◎ ⟂ ✦) failed first at the
  three small sizes (◎ −111 / −39 / −12 px into the panel); the spec's 600 px query was too narrow → D-064. Viewed 568×320.
- **B-035 (open, Debt):** "INTEGRITY" (11 px caps) is wider than its 54 px label box and touches its bar at every size.
- Changelog v0.1.27–v0.1.33 archived word for word (8 KB cap).

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
