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

## S-19 — ✅ built session 46 (#51); as-built notes D-068 (candidates, Spire gap 12, `keep`).

## S-27 — Spires v1a: found (M5) (D-049; re-checked Design 47 against D-068/D-069)
- **Look:** the core hexagon breathes (6 s, alpha 0.35–0.6; static under reduced motion). Minimap: a hollow violet-white
  hexagon at the record's centre once any footprint cell is explored, always shown after that (a broken Spire too, D-069).
- **Found:** first sight in a save → toast "A dormant Spire (n/N)" (N = `game.spires.length`, 5 on every seed so far) + one
  soft low tone (measured like S-14's, add to `tests/audio.cjs` ceilings). The Matrix stats line adds "Spires 0/N lit" once
  one is found. Same in Drift and Surge. A save that already explored a footprint (v0.2.50) is marked `seen` on load,
  silently (no burst of toasts).
- **Save:** sets `spires[i].seen` (S-19's field; no format bump).
- **Rider B-039 (Design 47):** in the `max-width: 380px` block, `.bank { gap: 10px }` (merge the two 380 px blocks, audit 44
  debt). Measured at 320×568 (DSF 2, Surge, 2750◆ 1470▲ 141●): bank panel right 215 vs minimap left 212 (3 px over).
- **Smoke:** the toast fires once across a reload; a pre-seen save gets no toast; minimap pixel at a seen Spire, none at
  an unseen one; tone within ceilings; stats line; at 320×568 with 2750◆ 1470▲ 141● the panel ends ≥ 6 px left of the
  minimap (fails on the old CSS); screenshot (view) at DSF 1 and 320×568.
