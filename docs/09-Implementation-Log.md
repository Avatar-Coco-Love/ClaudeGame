# 09 — Implementation Log

Older entries: v0.1 to session 2 in `archive/2026-11-23-09-sessions-0-2.md`, session 3 in `archive/2026-11-23-09-session-3.md`, sessions 4–7 in `archive/2026-11-23-09-sessions-4-7.md`, session 8 in `archive/2026-11-23-09-session-8.md`, session 9 in `archive/2026-11-23-09-session-9.md`, sessions 10–11 in `archive/2026-11-23-09-sessions-10-11.md`, sessions 12–13 in `archive/2026-11-23-09-sessions-12-13.md`, sessions 14–15 in `archive/2026-11-23-09-sessions-14-15.md`, sessions 16–17 in `archive/2026-11-23-09-sessions-16-17.md`, session 18 in `archive/2026-11-23-09-session-18.md`.

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

## 2026-11-23 — Session 23 (v0.1.25): Inbox — owner play-test feedback
- **Inbox:** `2026-11-23-owner-playtest-feedback.md` (first owner play-test, after v0.1.24): enjoyed discovery and achievement;
  the beam sound was "very annoying"; offered a free sound pack later. Adopted: the hum as a bug (B-016), a measure-then-owner-picks
  plan for recorded audio (D-037, supersedes D-014), a CLAUDE.md rule (measure audio offline). Rejected: nothing. Archived.
- **B-016 (new) → fixed:** the hum was a 92 Hz sawtooth at gain 0.045 with 13 Hz ±14 Hz vibrato that never faded. Now a 700 Hz
  low-passed triangle at 2× pitch: 40 ms swell, settles to a quiet bed, slightly higher while cutting (D-038, `BEAM_HUM`).
- **Measured** (4 s held on rock, volume 70, OfflineAudioContext 44.1 kHz, `node tests/audio.cjs`), before → after:
  RMS −42.3 → −54.2 dBFS; peak −36.1 → −39.9 (onset only); sustained (last 1 s) −42.3 → −56.7 (−14.4 dB, ~5× less amplitude);
  centroid 324 → 191 Hz; energy > 2 kHz 2.47 % → 0 %; above −50 dBFS for 4 s (never fades) → 0.3 s.
- **Found while building:** `cancelScheduledValues(now)` on the first contact frame wiped the onset and jumped the gain to 1
  (peak −9.4 dBFS); contact changes now retarget only after the attack.
- **Tests:** 2 new checks in `tests/audio.cjs` (83 total): level/harshness ceiling, volume 100 > 70 and 0 = silence. With `src/`
  stashed the ceiling check fails (tail −42.3). No visual change, so no screenshot.

## 2026-11-23 — Session 24 (v0.1.26): Audit — every sound measured
- **Audio check (owner ask after B-016):** all 12 one-shots plus 4 streams rendered offline (volume 70, 44.1 kHz). One-shots peak
  −22 to −30 dBFS and last ≤ 0.35 s above −45 dBFS. Two problems:
- **B-017 (new) → fixed:** a deposit ticks one beep per item every 35 ms (throttled to ~14/s), so a full hold (140) was a 4.4 s beep
  chain. Ticks now fade 0.8× each within a run and stop under gain 0.015 (`DEPOSIT_TICK`, D-039): loud 4.4 → 0.35 s; arpeggio kept.
- **B-018 (new) → fixed:** hurt and Glitch-death were square waves, the only buzzy sounds: 1.1 % / 2.8 % energy > 4 kHz, centroid
  355 / 747 Hz. Now triangles (gain 0.16 / 0.11): 0 % / 0 %, centroid 151 / 372 Hz, peak −25.4 / −28.5 dBFS. Kept as is: the cache
  chord (loudest peak, −21.9, but rare and pure sines), pickup streams (0.6 s), the full-hold nag (≤ 1 per 1.2 s).
- **Tests:** 2 new checks in `tests/audio.cjs` (85 total): every one-shot under peak/4 kHz/length ceilings; a 140-item deposit loud
  ≤ 1 s. With `src/` stashed both fail (hurt 1.1 %, enemyDie 3 %; deposit 4.4 s). No visual change, so no screenshot.
- **Other dimensions (no subagents available, done briefly):** docs vs code — `SAVE_FORMAT` 6, `BEAM_HUM` (D-038), hitstop (D-021),
  Glitch give-up (D-017) and Research (D-034) match; D-021's per-unit tick is now refined by D-039. Perf / 320 px / touch: smoke
  checks pass, no new findings; the open Debt watches stand. Session 18 of this log archived word for word.

