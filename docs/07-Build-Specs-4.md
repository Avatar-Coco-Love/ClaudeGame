# 07 — Build Specs, part 4

Continues `07-Build-Specs-3.md` (same rules; build order in `07-Build-Specs.md`'s header, D-063). Written in Design 42; refreshed in Design 52 (D-081/D-082). S-30 built (#60, D-085), S-23 built (#61, D-086).
None of these adds a sink: the Wake and the ending spend nothing; New Cycle resets the world's supply with the world (D-062).

## S-24 — Ending: the sequence and the summary (M5) (D-045)
- All Spires relit (N/N, N = `game.spires.length`; any mix of modes and broken ones, D-069): an 8 s sequence (each Spire draws a line to the Nexus in turn, the darkness alpha eases
  0.93 → 0.5), skippable by any key/tap; reduced motion: a 1 s fade instead of lines. Then a summary card: time, cells
  mined, Spires relit in Drift / Surge (and "restored" for broken ones), Glitches cleared, with **Continue** (keep playing this world, lifted dark stays).
  **New Cycle** shows on the card but is disabled ("Next update") until S-29.
- **Save:** `ended: true` (per-Spire `mode` is already saved by S-28/S-23, D-081; the card counts `'broken'` on its
  own "restored" line). Next `SAVE_FORMAT`; old saves load with `ended: false`. A reload after the ending skips the sequence; the card is reachable from the Matrix stats line.
- **Smoke:** `dev` relights all 5 → sequence runs, skip works, card fields match stats; reload keeps `ended` and the lifted
  dark; reduced motion has no lines; screenshots of the sequence mid-way and the card at 1280×800 and 320×568 (view).

## S-29 — New Cycle (M5, ships v1.0.0) (D-062)
- **New Cycle** on the summary card (and the title once `ended`): confirm, then a new random seed, `cycle` + 1, and a fresh
  world save. **Carries:** `cycle`, `records` (best time to 5/5, and per cycle: time, Drift/Surge relights), settings (already
  separate), and the Nexus hue `NEXUS_HUES[cycle % 5]` (cosmetic, 5 fixed neon hues; cycle 0 = today's cyan).
  **Resets:** bank, cargo, Matrix, Radiance, Research, Craft stock, beacons, relays, Spires, floor loot, stats. Mode = last used.
- Title shows "Cycle n" and the best time once `cycle` ≥ 1. VERSION 1.0.0 (D-046).
- **Save:** next `SAVE_FORMAT` adds `cycle` (0) and `records` ({}); old saves load as cycle 0.
- **Smoke:** New Cycle gives a different seed, cycle 1, empty bank + Matrix, records kept, hue = `NEXUS_HUES[1]` on the Nexus
  pixel; cancel keeps the world; reload; an old save is cycle 0; screenshot the title and a cycle-1 Nexus (view).
