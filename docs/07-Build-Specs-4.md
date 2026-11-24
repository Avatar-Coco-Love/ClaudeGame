# 07 — Build Specs, part 4

Continues `07-Build-Specs-3.md` (same rules; build order in `07-Build-Specs.md`'s header, D-063). Written in Design 42; refreshed in Design 52 (D-081/D-082). S-30 built (#60, D-085), S-23 built (#61, D-086). Design 57 added S-31 (D-087) and the first M6 specs (S-32, S-33).
None of these adds a sink: the Wake and the ending spend nothing; New Cycle resets the world's supply with the world (D-062).

## S-31 — Wake fix + tune (M5, before S-24) (D-087; B-048)
- **B-048:** Wake Glitches skip the `GLITCH_DESPAWN_PX` drop (they end by the beam, at the core, or by giving up). Walking
  away from a Wake then loses it to charge, instead of the Glitches vanishing and the Wake holding itself.
- **Tune:** Wake Glitches spawn `SPIRE_WAKE_TIER_DROP` (1) tier below the depth tier (tier 1 at d 64–74). Wave 1.6 s,
  6 alive, −10 of 100 unchanged. **Clock:** the Wake's lit facets draw in `SPIRE_WAKE_RGB` (orange, like the ring): the
  puzzle's faint style didn't read as a timer. **Hint:** "Circle the core: beam the Glitches before they reach it".
- **Smoke:** a core that leaves 60 cells mid-Wake loses it (charge 0; it relit on the old code); `wakeprobe`'s `run`
  (exported) on 4 seeds at mid: `human` relights ≥ 3, `still` relights 0; a screenshot of the orange clock (view).

## S-24 — Ending: the sequence and the summary (M5) (D-045)
- All Spires relit (N/N, N = `game.spires.length`; any mix of modes and broken ones, D-069): an 8 s sequence (each Spire draws a line to the Nexus in turn, the darkness alpha eases
  0.93 → 0.5), skippable by any key/tap; reduced motion: a 1 s fade instead of lines. Then a summary card: time, cells
  mined, Spires relit in Drift / Surge (and "restored" for broken ones), Glitches cleared, with **Continue** (keep playing this world, lifted dark stays).
  **New Cycle** shows on the card but is disabled ("Next update") until S-29.
- **Save:** `ended: true` (per-Spire `mode` is already saved by S-28/S-23, D-081; the card counts `'broken'` on its
  own "restored" line). Move `light.js`'s inline darkness 0.93 to config (`DARK_ALPHA`); the lifted value is saved via `ended`. Next `SAVE_FORMAT`; old saves load with `ended: false`. A reload after the ending skips the sequence; the card is reachable from the Matrix stats line.
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

## S-32 — Spitter: the first Glitch variant (M6, after v1.0) (D-087)
- Surge only (M6 is Surge depth; Drift's M6 piece is S-33's aurora). Natural spawns at tier ≥ 2 (Deep): 1 in 4 is a
  Spitter (`rng['glitch-spawn']`, same stream). It stops at 200 px from the core and fires a bolt every 2.2 s: 150 px/s,
  8 damage, stops at the first solid cell, beam-killable (hp 0.5). Its own hp ×0.8; loot as its tier. Violet-orange
  diamond, no humanoid shape; a 0.4 s glow before each shot (readable, D-002 fairness). Wake Glitches stay plain.
- **Smoke:** spawn share 20–30 % over 400 Deep spawns; a bolt hits a core in the open, never through rock; the beam pops
  a bolt; `surgebot mine` Surge deaths/min at mid stay ≤ 0.2 (log the table).

## S-33 — Weather: static storm (Surge) and aurora (Drift) (M6) (D-087)
- One event at a time, every 5–7 min of play (seeded `rng['weather']`), 40 s long, toast on start/end, never during a
  Wake or the ending. **Storm** (Surge): Glitch spawn interval ×0.6 and cap +2 while it lasts; the darkness tints violet.
  **Aurora** (Drift): ore within the core's light shimmers and yields +1 per break (the same +supply in both: a storm's
  extra kills pay ~the aurora's extra ore; measure with `surgebot mine`, both ≤ +25 % haul/min).
- **Smoke:** both fire on schedule from the same seed; neither starts inside a Wake; haul ratio storm/aurora 0.8–1.25.
