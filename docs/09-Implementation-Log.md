# 09 — Implementation Log

Older entries: v0.1 to session 2 in `archive/2026-11-23-09-sessions-0-2.md`, session 3 in `archive/2026-11-23-09-session-3.md`, sessions 4–7 in `archive/2026-11-23-09-sessions-4-7.md`, session 8 in `archive/2026-11-23-09-session-8.md`, session 9 in `archive/2026-11-23-09-session-9.md`, sessions 10–11 in `archive/2026-11-23-09-sessions-10-11.md`, sessions 12–13 in `archive/2026-11-23-09-sessions-12-13.md`, sessions 14–15 in `archive/2026-11-23-09-sessions-14-15.md`, sessions 16–17 in `archive/2026-11-23-09-sessions-16-17.md`.

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

## 2026-11-23 — Session 19 (v0.1.21): Audit
- **How:** no subagent tool, so correctness, perf, mobile, code health and docs drift were done in-line; each finding reproduced first.
- **B-014 (new) → fixed (perf):** every floor pickup was drawn with `shadowBlur` wherever it lay, and the floor is saved (B-011), so
  loot left across the map taxed every frame. Headless 1280×800, DSF 1: 400 pickups 3000 px off screen took a frame from 17 ms to
  1093 ms (SwiftShader, software GL; same cost as on screen). Now culled to the view + 16 px: 19 ms. On-screen loot still glows (D-032).
- **B-013 (new) → fixed (dev only):** `dev.teleport` clamped the 3×3 room to x ≥ 2, so `teleport(90)` carved 3 cells of the inner
  bedrock ring (seed 77). Clamp is now 2 + room. Not fixed: a teleport whose room hits a vault cache removes it with no loot (Debt).
- **Tests:** 1 new smoke check (67 total): `teleport(90)` loses no bedrock and 400 off-screen pickups add no `fill` calls. With
  `src/` stashed it fails (`bedLost 3, offFills 403`). **Screenshot** (800×500, DSF 1): 30 burst pickups by the core still draw and glow.
- **Mobile / code health:** nothing new; 320 px overflow checks pass. Largest files `game.js` 500, `render.js` 480 lines (under 600).
- **D-check:** D-026…D-031 match the code (spot-read); `dev.js` cited D-026 for itself, now D-027. Glitch-in-vault stays a watch item.
- **Docs:** sessions 14–15 of this log archived word for word to `archive/2026-11-23-09-sessions-14-15.md`.

## 2026-11-23 — Session 20 (v0.1.22): Build
- **S-10 Lumen ore** (D-033): `T.LUMEN` re-types ROCK/DENSE at d ≥ 55 (noise salt `0x27d4eb2f`, cut 0.80). 40 seeds: mean 141.2
  cells (85–225), nearest d 55.01. Gold bead + halo glyph, gold minimap dot, round pickup, higher break/pickup tones, ● in HUD
  and Matrix bank after the first pickup. `SAVE_FORMAT` 5 (bank/cargo `lumen: 0`); pickups save a `KINDS` index. Dev `+20●`.
- **Tests:** 4 new smoke checks (71 total): d ≥ 55 on 40 seeds; one cell → 1● banked via pickup + deposit, ~70 hits of 0.05 (not
  ring-scaled); bank + floor ● survive reload; a format-4 save loads with 0●. The S-8 hash now checks layout + types with DENSE/LUMEN
  folded into ROCK (same value as before S-10) and pins the full type hash. With `src/` stashed they fail.
- **Screenshot** (960×600, DSF 1, a 19-cell blob at d ≈ 64): gold beads read clearly apart from ◆ / ▲ and from Deep rock.

## 2026-11-23 — Session 21 (v0.1.23): Build
- **S-11 Research v1** (D-034): `src/research.js` (buy, ping, fade), third Matrix tab with the Lumen hint at 0●, ◎ / F ping
  (12 cells, 20 s cooldown, 6 s show, ring 600 px/s, 1200→600 Hz sweep), glyphs above the dark + minimap blips. `SAVE_FORMAT` 6
  adds `research: {}`. Dev "Max all" unlocks research. Narrow Matrix header: three bank figures no longer wrap at 320 px.
- **Tests:** 10 new smoke checks in `tests/research.cjs` (81 total): unlock rules, ping = node-side ore count (62 cells, seed 77,
  d 30), cooldown, fade + re-ping, save/load, format-5 upgrade, reduced motion in Surge, UI tab + F + reload, 320 px Research tab.
  They fail on the old code (no `research.js`, format 5).
- **Screenshot** (1280×800, DSF 1, `?dev` teleport 60): the ring and gold ● / ◆ / ▲ glyphs read clearly through the dark, minimap
  blips visible. At 320×568 the Research tab and hint fit. Watch: ◎ reach on big phones (Debt).

## 2026-11-23 — Session 22 (v0.1.24): Design — Lumen → Scanner, Q-010, beam modes
- **Play-test** (1280×800, DSF 1, `?dev`, +12●): Research tab buys the Scanner cleanly (12● → 2●); teleported 10 cells from the
  nearest vault (d 52) and pinged: 26 ore marks read well, but the vault 10 cells off stayed a dim grey outline and the ping
  ignored its cache. That is Q-010's gap in one picture.
- **Measured** with new `tools/vaultfind.mjs` (bot breaks Lumen cells nearest-first, upgrades 2, 40 seeds): 10● in 70 s mean;
  vaults seen by then 20/240 (runs with any: 19/40); at 30● 46/240; at 60● (level 3) 83/240 (35 %). Caches opened by accident: 0–3.
- **Decided:** D-035 (ping shows caches, S-12; Q-010 closed), D-036 (Wide 25● and Pulse 40● as Research, each with a trade-off,
  S-13/S-14). New Q-011 (dominant mode check after S-14). S-15 throttled perf check specced in Tooling.
- **Docs:** 09 sessions 16–17 and changelog v0.1.1–v0.1.9 archived word for word; M1's done list in `04` folded into one line.

