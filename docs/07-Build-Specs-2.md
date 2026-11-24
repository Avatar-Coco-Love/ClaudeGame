# 07 — Build Specs, part 2

Continues `07-Build-Specs.md` (same rules; build order is in its header, D-063). Supply numbers are in that file's header.
Deep basis (session 32, 40 seeds, d ≥ 64): per world ~648 prism, 588 crystal, 110 Lumen cells, 5580 open of 11440.
(S-16 Beacons built in #46; as-built notes D-060.)

## S-25 — Beacon floor glow + B-034 short-landscape row (polish, no sink) (D-061) — ✅ built session 43 (#48, D-064: 700 px)
- **Floor glow (Q-014):** each beacon draws an additive cyan disc (`BEACON_GLOW` 0.08 alpha at the centre, 0.45× at 60 %,
  0 at `BEACON_LIGHT`) on the main canvas right after `drawGrid`, so walls and ore draw over it and the light layer dims it
  like the floor. One cached sprite per radius (D-051), culled to the view like pickups. Static: no pulse, so reduced motion
  needs nothing. Not under the core or the Nexus (both read already).
- **B-034:** in `(max-height: 480px) and (max-width: 600px) and (pointer: coarse)`, ◎ and ⟂ become 44 px glyph-only (the
  mode name already toasts on a switch) and the minimap 100 px. Measured basis (session 42, Surge, 4-digit ◆ ▲ ●, ◎ ⟂ ✦):
  bank panel 12–239 px at every size; row starts at ◎ 168 (568), 240 (640), 267 (667). Target: ◎ ≥ bank right + 8.
- **Smoke (fail first on the old code):** floor pixel 3 cells from a beacon in an open cave ≥ 2× the floor 3 cells outside
  the pool (session 42: 3.4 luma inside without glow, 10.1 with 0.10); walls unchanged within 1 luma; `tests/drawcost.cjs`
  counts stay within its ratios with 20 beacons; at 568×320, 640×360, 667×375, 844×390 (Surge, all three currencies at
  4 digits, ◎ ⟂ ✦ shown) no HUD rect overlaps another and every button is ≥ 44 px. Screenshot an open Hearth cave (view).

## S-26 — `src/light.js` split (code health, before Spires; no visible change)
- Move `drawLight` and its hole helper out of `render.js` (544 lines) into `src/light.js`, plus S-25's floor glow. The
  Renderer keeps a list of light sets, `R.lightSets = [game.beacons]` (each entry `{x, y, r}` + optional `glow` colour);
  S-22 adds `game.relays`, S-28 the lit Spires. No allocation per frame (iterate the sets, no concat).
- **Smoke:** byte-same screenshot before/after at 3 spots (home, a beacon cave, a Wide beam in the Deep), like S-18 did;
  `tools/perf.cjs` "holes" within 5 % of session 41's 133 ms mean. `render.js` under 480 lines.

## S-19 — Spires v1a: sites, cells, save (M5, first slice) (D-049)
No relight, no found toast yet: this slice puts the goal in the world and the save. Look + found = S-27.
- **Count and place:** `SPIRE_COUNT` 5, one per 72° sector (sector start angle from the seed), centre at d `SPIRE_D` [64, 74]
  cells, 9×9 footprint inside the bedrock border, ≥ 12 cells from every vault centre. Sites come from `seededStream(seed,'spire')`,
  `SPIRE_TRIES` 40 candidates per sector, seed-only like `vaultSites` (D-023). Session 32 measured 40 seeds: 5/5 sectors always fit.
- **D-024 for old saves:** take the first candidate whose footprint has no explored cell; if none, the least-explored one, and
  only unexplored cells are re-typed. The chosen centres are saved, never re-derived:
  `spires: [{x, y, seen: false, fed: 0, mask: null, lit: false}]` (the whole M5 record now, so S-27/S-20/S-28 need no format bump).
- **Shape:** a 1-cell ring of `T.SPIRE_SHELL` on the 9×9 edge (hp 6, no yield, like a vault shell) with a 1-cell gap on each
  axis, open floor inside, a 3×3 `T.SPIRE` core and 8 shell cells of `T.FACET` at (±2, ±4) and (±4, ±2): core and facets are
  unmineable (the beam sparks, no crack, like bedrock). Draw: shell like a vault shell, the core a dim violet-white hexagon
  outline, facets small dim hexagons. Static here; S-27 adds the breath.
- **Save:** `SAVE_FORMAT` 10 adds `spires`; the upgrade step runs the D-024 rule. Glitches ignore Spires.
- **Smoke:** 5 sites on 40/40 seeds, all d 64–74, ≥ 12 from vaults, inside the border; same seed → same sites; core and
  facets take no beam damage, shell does; a format-9 save with a tunnel through candidate 1 gets candidate ≥ 2 and keeps
  its tunnel; reload keeps the centres; `dev.teleport(70, a)` beside one, screenshot at DSF 1 (view).

## S-27 — Spires v1a: found (M5) (D-049)
- **Look:** the core hexagon breathes (6 s, alpha 0.35–0.6; static under reduced motion). Minimap: a hollow violet-white
  hexagon once any footprint cell is explored, always shown after that.
- **Found:** first sight in a save → toast "A dormant Spire (n/5)" + one soft low tone (measured like S-14's, add to
  `tests/audio.cjs` ceilings). The Matrix stats line adds "Spires 0/5 lit" once one is found. Same in Drift and Surge.
- **Save:** sets `spires[i].seen` (S-19's field; no format bump).
- **Smoke:** the toast fires once across a reload; minimap pixel at a seen Spire, none at an unseen one; tone within ceilings;
  stats line; screenshot (view) at DSF 1 and 320×568.
