# 09 — Implementation Log

Older entries: v0.1 to session 2 in `archive/2026-11-23-09-sessions-0-2.md`, session 3 in `archive/2026-11-23-09-session-3.md`, sessions 4–7 in `archive/2026-11-23-09-sessions-4-7.md`, session 8 in `archive/2026-11-23-09-session-8.md`, session 9 in `archive/2026-11-23-09-session-9.md`, sessions 10–11 in `archive/2026-11-23-09-sessions-10-11.md`, sessions 12–13 in `archive/2026-11-23-09-sessions-12-13.md`, sessions 14–15 in `archive/2026-11-23-09-sessions-14-15.md`, sessions 16–17 in `archive/2026-11-23-09-sessions-16-17.md`, session 18 in `archive/2026-11-23-09-session-18.md`, sessions 19–20 in `archive/2026-11-23-09-sessions-19-20.md`, session 21 in `archive/2026-11-23-09-session-21.md`, sessions 22–23 in `archive/2026-11-23-09-sessions-22-23.md`.

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

## 2026-11-23 — Session 25 (v0.1.27): Build — S-12 ping shows vault caches
- **Built:** `scanWithin` (old name `oreWithin` kept as an alias) also returns `T.CACHE`; same ring timing, 6 s fade, hidden once
  opened. Drawn as the cache glyph in white at 1.3× (24 px) above the dark, white minimap blip 1.5× (4.5 px). Research desc now
  says "ore and vault caches". Nothing saved or explored; no cost change.
- **Sound** (D-040): `scanCache()` 784 Hz sine 0.16 s, played by game time when the ring reaches an unopened cache. Measured
  offline (vol 70): peak −32.4 dBFS, energy 0.16 vs the ping's 1.10 and the cache chord's 2.21, 0.02 % above 2 kHz.
- **Tests:** 1 new node check (ping 10 cells from seed 77's first vault: 1 cache mark, visible, 1 tone; 14 cells: none; opened:
  none) + `scanCache()` joins the one-shot ceilings (86 total). With `src/` stashed the new check fails (near 0).
- **Screenshot** (1280×800, DSF 1, 7 cells from a vault, 0.9 s after F): the white square-in-square reads clearly over the vault.
- **Docs:** 09 sessions 19–20 archived word for word (09 was at 8150 B of the 8192 cap).


## 2026-11-23 — Session 26 (v0.1.28): Build — S-13 Wide beam
- **Built** (D-041): `src/beam.js` (`castBeam`, `unlockedModes`, `cycleBeamMode`, `validMode`) replaces `Game.updateBeamHit`;
  `BEAM_MODES` + `WIDE_*` in config; Research node `wide` 25●; Q / ⟂ button (hidden until a 2nd mode), toast "Focus"/"Wide",
  `modeSwitch()` click 520 Hz 0.06 s (offline, vol 70: peak −33.7 dBFS, 0 % > 4 kHz; quieter than scanCache −32.4). Render: 3 rays
  at 0.6× width + an emitter bar, a crack per cell, a 48 px darkness hole per ray end. `SAVE_FORMAT` 7 (`beamMode`).
- **Tests:** `tests/beam.cjs`, 6 checks (92 total): flat DENSE wall 1 s → Focus [0,0,1,0,0], Wide [0,.45,.45,.45,0]; two rays
  on one cell at 45° → 0.45 not 0.9 (with the dedupe removed it reads 0.9: fails); Glitch 0.45×1.6; unlock at 25● + Q cycle;
  reload / format-6 / un-unlocked mode → Focus; browser Q, ⟂, dropped under the Matrix. With `src/` stashed the module fails to load.
- **Screenshot** (1280×800, DSF 1, Wide down from the Nexus): a clean 3-cell hall, three beams read as one tool, ⟂ under ◎.
- Deploy note: PR #27's Pages deploy failed twice on GitHub's side ("Fetching artifact metadata failed"); a fresh manual run on
  `main` succeeded, so v0.1.27 went live. On such a failure trigger a new run of `pages.yml` on `main`, not a re-run.

## 2026-11-23 — Session 27 (v0.1.29): Design — Wide play-tested, Q-011 first look, S-14 retuned, S-16 Beacons
- **Probes per beam mode:** `MODE=wide` env added to `deeprun`, `vaultfind`, `surgefarm`, `parity` (Wide research set, mode forced).
  **B-019 (new) → fixed:** `deeprun` crashed since S-10 (its target search wanted ROCK/DENSE, but Lumen cells are now `T.LUMEN`).
- **Q-011, Focus vs Wide** (20 seeds unless noted): first Lumen at Beam 2 median 30 s vs 56 s (Beam 0: 55 vs 113); 10● run
  69 vs 133 s (vaults seen 11 vs 12 of 120); parked Surge farm (Lvl 2, 10 seeds × 180 s) 3.90 vs 3.77 kills/min, deaths 0 vs 0.33;
  greedy miner 10 × 300 s: crystal hunt Lvl 0 42.9 vs **48.3◆/min** (+12 %), Prism hunt Lvl 2 15.2 vs 9.7▲/min (◆ 15.0 vs 25.1).
  Read: Wide is a harvesting tool for ore-rich ground, Focus the travel and Glitch tool. Neither wins everywhere: no retune (D-042).
- **S-14 retuned** (D-042): with `PULSE_MUL` 1.3 and no recovery, Pulse would tunnel at 1.3× Focus with 1.5× reach and pierce,
  beating Focus at everything. Now ×1.0 plus 0.3 s recovery: 0.8× Focus sustained; it trades throughput for reach and a burst.
- **Play-test** (1280×800, DSF 1, seed 77, Beam 2, Veil): Wide's three beams read as one tool and carve a clean hall; in Surge (god)
  the side rays help aim at a Glitch but each Glitch takes one ray (D-041), so kills are slower; switching to Focus is the answer.
- **Specs:** S-14 refined, S-15 gets the pickup spawn call, new **S-16 Beacons v1** (first Crafting item, 5▲ each). No gameplay code.
