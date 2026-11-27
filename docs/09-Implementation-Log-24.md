# 09 — Implementation Log, part 24

Continues part 23 (`09-Implementation-Log-23.md`). Newest at the bottom; read the tail only.

## Session 170 — Build: S-76 map legend (v1.12.111, D-211)
- The big map's legend lists the kinds drawn this open (`maplegend.js`, `kinds` Map from `drawMinimap`), glyph in its
  colour + one word, in spec order. `window.__lumen.mapView` added for tests.
- Observed: a fresh pinned world shows only "Nexus"; a Beacon placed adds "Beacon". All 12 kinds fit at 320 × 568
  (3 lines, 4 with Large text) and 568 × 320 (one column of 12 right of the map). Screenshots of both viewed. The first
  shot drew the two lair octagons overlapping: their glyphs now step 15 px apart.
- Test pitfall: a fake Beacon without `r` threw in the light pass (non-finite gradient); the test now builds one
  shaped like `makeBeacon`'s.
- `mapview.cjs` +2 checks (kinds drawn = kinds listed; 12 kinds × 2 viewports × Large text, on screen, clear, no scroll).
