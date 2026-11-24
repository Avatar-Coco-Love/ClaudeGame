# 09 — Implementation Log, part 4

Continues `09-Implementation-Log-3.md` (split at the 8 KB cap, session 46). Newest at the bottom; read the tail only. Continued in `09-Implementation-Log-5.md` (session 49 on).

## Session 46 — Build: S-19 Spires v1a, sites + cells + save (v0.2.50, #51)
- `src/spire.js`; `T.SPIRE_SHELL` / `T.SPIRE` / `T.FACET` (config), drawn in `terrain.js` (core hexagon spans 3×3 and is
  drawn from neighbour chunks too, so it never breaks at a chunk edge), dim violet minimap colours (S-27 adds the mark).
  `SAVE_FORMAT` 10: `spires: [{x, y, seen, fed, mask, lit}]` (+ `keep` only in the fallback). D-068.
- Probe `tools/spirefind.mjs`: 40 seeds and 400 seeds → 5/5 always, d 64.1–74.0, vault gap ≥ 12.0, Spire gap ≥ 12.0,
  ≥ 5 valid candidates per sector (min), 25/2000 sectors skip candidate 1 for the Spire gap. Fully explored → keep 81 each.
- `tests/spire.cjs` (6 checks): placement 40/40, same seed, shape 9/8/20/44 + nothing outside footprints, core/facet no
  damage, format-9 tunnel → candidate 2 + tunnel kept, saved centres kept + malformed re-chosen, hexagon pixel (DSF 1).
- **B-040 (fixed in-PR):** the first screenshot probe teleported 6 cells out along the diagonal, which lands inside the
  9×9 square; `dev.teleport`'s room carved the shell. The check now stands 7 cells out on an axis, and the teleport room
  skips unbreakable cells. Viewed: shell ring with 4 gaps, 8 facet hexagons, core hexagon read at DSF 1 in the Deep.
- First hexagon alpha (0.45) measured 26 vs 18 fill luma at 7 cells; raised to 0.6 / 0.3 (inner). The pixel check
  (brightest in 9×9 at the vertex vs between the hexagons, camera settled) ran on random seeds: 49/22 … 310/61; bar ≥ 1.8×.

## Session 47 — Design: Spire trip, supply, Q-015, M5 specs re-checked (v0.2.51, #52)
- Probe `tools/spirerun.mjs` (straight-line bot, Nexus → nearest Spire gap → interior; `GAME=surge`), 40/20 seeds:
  start build out median 57 s (p90 109), mid (beam 4 range 3 thrust 3 cargo 4) 21 s (p90 38), max 15 s; back down the
  open tunnel 14 / 11 / 7 s. Surge (bot ignores Glitches, god off): mid 19 s, 6 deaths in 20 runs; start 62 s, 31 deaths.
- ▲ near a Spire (prism cells × 1.5, 40 seeds, 200 Spires): within 14 cells mean 40, < 80 for 179, none for 8; within
  20, < 80 for 122; within 30, < 80 for 23. D-055's "dig the 80▲ near the Spire" does not hold → D-070 (cargo, then bank).
- Lanes (400 seeds): 467/8000 Wake lanes blocked within 6 cells (bedrock 404, vault 43, Spire 20); 455 Spires have a
  short lane, the worst 1 full lane → D-071. Q-015 → D-069 (broken Spire relights when primed). Q-016 opened.
- Play-test (Playwright, DSF 1, mid build, 3 Beacons dropped every 16 cells on the way, both modes + 320×568): in-page
  trips 37.5 s (Drift), 11.9 s (Surge, another seed), 20.0 s (320). Viewed: the Spire reads in the dark as a pale shell
  ring + hexagon core even outside the core light; facets read as small hexagons; interior is black; the minimap shows
  the tunnel but no Spire (S-27). At 320 px the 9×9 Spire spans 288 px, nearly the whole width: facets are all on screen.
- B-039 measured (320×568, DSF 2, Surge): 2750◆ 1470▲ 141● → panel right 215 vs minimap 212 (3 px over); 4-digit ● 225;
  999/999/141 touches (212). Scheduled as an S-27 rider (`.bank` gap 10 px at ≤ 380 px).
- Changelog v0.2.34–v0.2.38 archived word for word (`archive/changelog-v0.2.34-v0.2.38.md`) for the 8 KB cap.

## Session 48 — Build: S-27 Spires found + B-039 (v0.2.52, #53)
- `spire.js`: `markSpiresSeen` (newly revealed cells; full scan on load, silent), breath + minimap mark drawers; the outer
  core hexagon moved from `terrain.js` to a per-frame stroke. Toast "A dormant Spire (n/N)" persists the save at once.
- Measured: breath at the near vertex in the core's light 347 (peak) → 265–271 (trough), fill 68; in the dark 7 cells out
  only 39 → 35 (the 0.93 darkness). Minimap mark pixel 697–703 vs shell 510, unseen box 20. Tone peak −35.3 dBFS, 0.1 s loud.
- B-039 (fixed): old CSS at 320×568 DSF 2 gave panel right 219 (spec said 215), 10 px gap 207 (5 px clear, fails ≥ 6),
  so 8 px → 203 (D-072). Check proven failing on the old CSS first. Pixel 7 DSF gives the same widths.
- Viewed (DSF 1): 1280×800 the toast over the Spire, breathing core, minimap ring; 320×568 Surge the toast wraps to 2
  lines and fits; the minimap ring at 96 px is small but reads as hollow.
- Test fix: `spire.cjs` waited 5 s for the camera to reach the core exactly, but it eases to a 36 px look-ahead (always
  timed out); now snaps to the look-ahead target.

