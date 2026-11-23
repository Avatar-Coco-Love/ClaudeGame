# 09 — Implementation Log

Older entries: v0.1 to session 2 in `archive/2026-11-23-09-sessions-0-2.md`, session 3 in `archive/2026-11-23-09-session-3.md`, sessions 4–7 in `archive/2026-11-23-09-sessions-4-7.md`, session 8 in `archive/2026-11-23-09-session-8.md`, session 9 in `archive/2026-11-23-09-session-9.md`, sessions 10–11 in `archive/2026-11-23-09-sessions-10-11.md`.

## 2026-11-23 — Session 12 (v0.1.14): Design — S-4 play-test, M2 specs
- **Play-test (1280×800, DSF 1, in-page greedy crystal bot, 60 s real time, Drift):** 32 crystal breaks → 32 hitstops (~1.1 s frozen
  in total, never on the 21 rock breaks), 1 beam sweep (beam held), bank 46◆, no page errors. Reads as a light tick, not a stutter.
  The arpeggio never fired: the bot left the ring as soon as cargo had room. Logged as "Missed chime (watch)". B-010 found: the
  "Bring shards home" hint stays up with 46◆ banked (`main.js` hint checks bank + cargo, not cargo alone).
- **Screenshot:** a room carved 62 cells out looks exactly like the start (same blue rock): distance means nothing on screen yet.
- **Measured (40 seeds, scratch scripts, not committed):** cells per distance band (header of `07`); a new Lumen noise at cut 0.80 on
  ROCK/DENSE at d ≥ 55 gives ~141 cells/world (0.74 → 381, 0.78 → 203); 6 vaults (7×7, d 50–72, ≥ 20 apart) place on 40/40 seeds.
- **Decided:** D-022 (rings in the fixed world, settles Q-002), D-023 (generation changes keep a save's seen layout; `vaultSkip`),
  D-024 (Lumen ships next to Research v1). Specs S-8 rings, S-9 vaults, S-10 Lumen in `07`. New Q-008 (Deep toughness).

## 2026-11-23 — Session 13 (v0.1.15): Build — S-5 deterministic gameplay RNG
- **Built:** `seededStream(seed, salt)` in `world.js`; `game.rand` (seeded `seed ^ Date.now()`, one shared stream) replaced by
  `game.rng.{yield, pickup, glitch-spawn, glitch-wander, glitch-loot}` (D-025). Particles/shake still on `Math.random`.
- **Tests:** 2 node-side smoke checks (51 total): seed 4242, Surge, 40 s scripted mining twice → identical 13 spawns / 12 pickups;
  7 extra `yield` rolls leave the spawn list unchanged. Games are built ≥ 3 ms apart; both checks fail on the old code (stash run, 49/51).
  An exception in these checks now reports as a FAIL instead of killing the run silently.
- **Observed:** `tools/parity.mjs` still runs (1 seed × 30 s, both modes 40◆/min). No visual change, so no screenshot.

## 2026-11-23 — Session 14 (v0.1.16): Audit
- **How:** no subagent tool, so correctness, perf, mobile, code health and docs drift were done in-line; each finding reproduced first.
- **B-010 → fixed:** with ≥ 8◆ banked and no upgrade, the hint now reads "Upgrade ready — press E at the Nexus" (touch: "back to the
  Nexus"); "Bring shards home" only shows while the Shards are still in the hold. Screenshot (800×500, DSF 1): pill reads cleanly.
- **B-011 (new) → fixed:** floor pickups weren't in the save, so a reload after a Surge death lost the scattered cargo for good (and
  would have lost S-9 vault caches). Saved as `[kind, x, y]`; `SAVE_FORMAT` 3, step 2→3 adds `pickups: []` (D-026).
- **B-005 → fixed:** cargo scatter on a death now bypasses `PICKUP_CAP` (bounded by the hold), so nothing vanishes on a full floor.
- **Tests:** 4 new smoke checks (55 total). Three failed on the old code (stash run, 52/55); the format-2 load check is a guard.
- **Perf / mobile / code health:** nothing new; new hint strings are shorter than the old one (320 px overflow check passes).
  Largest files: `game.js` 478, `render.js` 463 lines. **D-check:** D-001…D-025 match the code (spot-read). `09` session 8 archived.

## 2026-11-23 — Session 15 (v0.1.17): Build — S-7 dev panel
- **Built:** `src/dev.js`. `window.__lumen.dev` = `addShards`, `addPrisms`, `teleport(cells, angle)`, `god`, `setMode`, `maxAll`,
  `showPanel`. The panel (8 buttons, bottom left) is only built with `?dev` or the backtick key and only calls those functions (D-027).
- **Teleport** carves a 3×3 room with no yield (cells count as broken, so the room survives reload) and clears floor pickups.
- **B-012 (new) → fixed:** "beam mines terrain" used a random world seed and fell to 3 cells on some seeds (2 fails in 7 runs here;
  `main` gave 5–8 in 3 runs; the dev code never runs on that page, so it's seed luck). Smoke now pins the seed (901943132: 8 cells, 3/3 runs).
- **Tests:** 3 new smoke checks (58 total): no panel without `?dev`; `teleport(60)` lands 1936 px out in an open room with the panel
  shown; panel +100◆ / God, no damage in Surge, max all, `god` never in the save. **Screenshot** (1280×800, DSF 1): panel reads cleanly
  bottom left, carved room visible; it would cover the hint pill on a phone, accepted for a dev tool.
- Not built: "save/load test spots" from the old `04` line (not in the spec). Add if a bot needs it.

## 2026-11-23 — Session 16 (v0.1.18): Build — S-8 depth rings
- **Built:** `RINGS` in `config.js` (Hearth < 24, Veil 24–48, Deep ≥ 48 cells; ×1 / ×1.4 / ×2 hp on ROCK + DENSE only).
  `world.rings` (Uint8Array, by cell-centre distance), `ring()`, `hpAt()`, `look()`; chunk render, minimap, beam sparks and
  break bursts use the ring palette. Toast "Entering the Veil/Deep" once per session; the beam hum drops 2 semitones per ring (D-028).
- **Layout unchanged:** seed 77's solid bitset and full cell-type hashes equal the pre-S-8 values (pinned in smoke).
- **Tests:** 4 new smoke checks (62 total): ring at d 10/30/60; Deep ROCK 111 vs Hearth 56 beam ticks (2×); layout/type hash;
  toasts `Veil,Deep` over a 30→10→30→60→30→60 walk with pitch calls `0,1,0,1,2,1,2`. With only `src/` stashed they fail (`ring` missing).
- **Screenshot** (1280×800, DSF 1, `teleport(46)`): the Veil–Deep border reads clearly (teal edges vs indigo/violet), toast centred,
  the minimap shows the two bands. Watch: Veil teal rock sits closer to crystal cyan; gems still stand out by glyph and glow.
- Not measured yet: Q-008 (Deep rock vs low Beam Power). Left for the Design session.
