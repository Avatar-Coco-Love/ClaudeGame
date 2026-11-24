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
