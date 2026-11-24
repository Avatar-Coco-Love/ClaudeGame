# 09 — Implementation Log, part 2

Continues `09-Implementation-Log.md` (split at the 8 KB cap, session 36). Newest at the bottom; read the tail only.

## 2026-11-24 — Session 36 (v0.2.40): Build — S-18 code split
- Pure refactor (D-053). `game.js` 492 → 367 lines, `render.js` 591 → 514; new `glitch.js` 87, `hud.js` 88, `body.js` 52.
  Glitch numbers → `GLITCH_*` + `NEXUS_HEAL` in `config.js`; `ORE_KIND` shared by research/render/hud; Scanner desc and
  Research hint built from `SCAN_RADIUS`/`LUMEN_D`. Dead: `integrity: 100` (always overwritten), ROCK/DENSE `fill`/`edge`
  in `MATERIAL` and their `MINI_COLORS` (rings override both). The spec's "unused `mat`" is used; it moved into its branch.
- **Same behaviour, measured:** a 60 s scripted Surge run (Beam 4, aim at the nearest Glitch, else sweep; seed 77 at the Nexus
  and 35 cells out, seeds 4242 and 9001 35 out) gives byte-identical per-second digests. Stats before = after:
  77/nexus mined 110 glitches 0; 77/far 48 / 5; 4242 34 / 7 (1 Lumen); 9001 55 / 2.
  A seeded scene (core, 5 Glitches, pickups, beam, Scanner ping, Nexus pointer, minimap, touch sticks) screenshots
  byte-identical (`cmp`) before and after; viewed it.
- New check in `tests/docs.cjs`: no `src/*.js` / `tests/*.cjs` over 600 lines; failed with `render.js` padded to 604, passes now.
  Smoke 123/123 (122 before + the new one; no existing check changed), audio checks unchanged.
