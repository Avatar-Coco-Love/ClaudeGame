# 09 — Implementation Log, part 4

Continues `09-Implementation-Log-3.md` (split at the 8 KB cap, session 46). Newest at the bottom; read the tail only.

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
