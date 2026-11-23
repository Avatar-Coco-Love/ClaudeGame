# 09 — Implementation Log

Older entries: v0.1 to session 2 in `archive/2026-11-23-09-sessions-0-2.md`, session 3 in `archive/2026-11-23-09-session-3.md`, sessions 4–7 in `archive/2026-11-23-09-sessions-4-7.md`, session 8 in `archive/2026-11-23-09-session-8.md`, session 9 in `archive/2026-11-23-09-session-9.md`, sessions 10–11 in `archive/2026-11-23-09-sessions-10-11.md`, sessions 12–13 in `archive/2026-11-23-09-sessions-12-13.md`.

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

## 2026-11-23 — Session 17 (v0.1.19): Design — rings play-test, Q-008, S-11
- **Play-test (1280×800, DSF 1, `?dev`, Beam 2, `teleport(50)`, 20 s held S + beam):** mined 7 cells and drifted 28 cells out
  through Deep caves to the world border; a Prism field in Deep palette reads well. At the border the core sits on a near-black
  bedrock band and the beam shows no hit (logged in `04` Debt as a watch item, not a bug). No page errors.
- **Q-008 → D-029:** new `tools/deeprun.mjs` (straight-line bot from the Nexus to the nearest would-be Lumen cell, 20 seeds).
  First Lumen median/p90: Beam 0 53/94 s, Beam 2 29/74 s, Beam 4 22/48 s; ~9 s of Beam 2's trip is in the Deep.
  Deep `hpMul` 2 → 1.4 saves 1–2 s at every Beam level, so ×2 stays.
- **Lumen layout (40 seeds, S-10 rule):** 143● per world in ~36 blobs (median 2 cells, p90 9, largest ~18); ~46 Crystal/Prism
  cells within 12 cells of a Lumen cell. Basis for S-11's Scanner (10●) and the ~70● Research budget (D-030). Q-009 opened.

## 2026-11-23 — Session 18 (v0.1.20): Build — S-9 vaults
- **Built:** `T.VAULT` (hp 6) + `T.CACHE` (hp 3), three 7×7 templates and `vaultSites(seed)` in `world.js` (seed-only, stream
  `'vault'`); 6/6 placed on all 40 seeds, template mix 86/85/69. Cache bursts 20◆ + 6▲ (forced past the cap), chord, double hitstop,
  toast. `SAVE_FORMAT` 4: the 3→4 step stores `vaultSkip` from the explored/broken bits (D-031). Minimap: shells white.
- **Tests:** 4 new smoke checks (6 vaults on 40 seeds and nothing changed outside footprints; cache loot + reload; a format-3 save
  with one explored cell on vault 2 and a tunnel through vault 4 → skip `2,4`, tunnels kept; new world `vaultSkip: []`). With
  `src/` stashed they fail. The S-8 layout hash now hashes the base generator (all vaults skipped), unchanged values.
- **Screenshot** (1280×800, DSF 1, `?dev`, teleport beside vault 0): white-edged diamond reads clearly against Veil rock, the cache
  glyph is distinct from ore; opening it bursts pickups and toasts. Watch: Glitches may spawn in a hollow (Debt). Q-010 opened.
- **Docs:** sessions 12–13 of this log archived word for word to `archive/2026-11-23-09-sessions-12-13.md` (cap).
