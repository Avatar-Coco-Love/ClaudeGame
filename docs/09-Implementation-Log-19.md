# 09 — Implementation Log, part 19

Continues part 18 (sessions 129–131; 124–128 archived in audit 134). Newest at the bottom; read the tail only.

## Session 132 — Design: boss play-test, Q-033, S-61b / S-62 re-check (v1.8.73, D-169, D-170)
- Gate as is (`bossrun.mjs`, 8 seeds, top build): Drift 8/8 med 0.67 min, Surge 8/8 med 0.69, 0 deaths, burns 77,
  embers 0, ratio 1.055 PASS (1.6 s wall).
- Same route, other builds (scratch copy, not kept): mid: Drift med 1.12 / Surge 1.56 min, Surge deaths 8 (flare 7,
  Glitch 1), burns 137, ratio 1.40; start: Drift med 3.51 min, Surge 0/8 down (147 deaths, flare 80). Embers fired only
  at the start build (18), where the bot is knocked off its spot.
- Playwright, seed 4242, Surge, god: core set 5 cells off the Crucible: awake, all plates cut-ready, 1 ember in 3.5 s.
  Gyre at 3 cells: whirlpool dashes read well; still asleep in Surge (interim, `BOSS_WAKES` [4]). Screenshots viewed:
  the Gyre's core hexagon reads olive under the darkness, dimmer than the mint key (S-62 may brighten it; not a bug).
- Q-033 closed (D-169): no ember change. S-61b refined (D-170): the rim (8 px, 12 dmg, once / 4 s) replaces plain
  contact, which a held core never meets (6 px gap); gate `--boss=gyre`, no Heat Sink. S-62 gains the mid-build line;
  new Q-034. `02` trimmed (Weather / Anomalies / Echo detail → new `08-Systems-Reference-2.md`). No new bug.

## Session 133 — Build: S-61b Gyre awake in Surge (v1.8.74, D-171)
- `gyre.js` `surgeGyre` + `rimGap`, swarms via `mote.js` `spawnSwarm(.., true)` (groups: own centre / leash / loot);
  `BOSS_WAKES` [3, 4]; inward pull in `gyreCurrent`; rim tell outline. Bot route `lair` option; `bossrun --boss=gyre`.
- Gate gyre: Drift 8/8 med 0.69 min, Surge 8/8 med 0.66, deaths 0, swarms 16, rims 78, ratio 0.954 PASS (2 s wall).
  Crucible gate unchanged (1.055). Shoal mote gate unchanged (0.907 / 0.890).
- New checks fail on the old code (stash of `src/`: 3 FAIL + rimGap missing). Screenshot (seed 4242, Surge, 3 cells
  off): key hidden, mint rim outline over the body, whirlpool dashes; reads clearly.
- B-096 (flake, open): smoke run 1 failed `S-46b2 budget` new Game 154 ms under load (alone: 98 ms); run 2 626/626.
  For audit 134: the throttled timing check shares CPU with the prestarted gates.

## Session 134 — Audit: touch test 38 s faster (B-097), wait probe, 09 archive (v1.8.75, D-172)
- No subagent tool: sweeps in-session, newest code first (`gyre.js` / `mote.js` S-61b: wake / sleep resets, rim
  cooldown in both modes, tagged swarm leash and loot, `game.bossAwake` reset in `updateBosses`; D-166…D-171 match
  `config.js` and the gate list). No new game bug found.
- Debt two audits carried (`touch.cjs` 106 s), measured per check first: 8 × 7.3 s in the toast loop. **B-097**
  (fixed): its camera wait (< 2 px from the core) could never pass (look-ahead 36 px), so every size burned the 5 s
  timeout. Now waits on the look-ahead spot and the check needs `settled` (false on the old code at every size).
  `touch` 108 → 70 s; full smoke 502 s (was ~530).
- `tools/waitprobe.cjs`: the other 12 swallowed waits never time out (7 files run under it).
- Workflow review (D-172): too little: no signal for a silent wait timeout. Phone sweep / perf: none (Debt).
- `09` sessions 124–128 archived word for word (`archive/2026-11-26-09-sessions-124-128.md`, part 17 removed).
  Smoke 626/626.

## Session 135 — Build: S-62 boss marks, sting, ending line; M14 done (v1.9.76, D-173)
- `drawBossMarks`: Chart L2 adds unseen lairs at alpha 0.35 (`g.chartLairs`); `audio.bossSting` on wake (`B.woke`,
  unsaved) and the first Drift plate; `endingSummary` `bosses` / `bossN` (null without lairs). New `bossmarks.cjs`.
- Tools: `biomefoe.mjs --boss=on`, `bossrun.mjs --build=mid` (advice only; smoke gates unchanged).
- Lairs on, 16 seeds: Kiln 0.878 / 0.897 PASS (gap 0.019); Shoal 0.913 / 0.881 PASS (gap 0.032). No Debt.
- Mid build: Crucible Drift sum 9.00 min / Surge 12.59, ratio 1.399, deaths med 1 (boss 7, glitch 1), burns 137;
  Gyre 9.29 / 11.94, ratio 1.285, deaths med 1 (boss 7, glitch 1), swarms 33, rims 143. All 32 runs down. Q-034: no.
- New checks fail on the old code (stash `src/`: 3 FAIL). Screenshots: the faint Crucible octagon reads at the
  minimap's edge without competing with seen marks; the ending card at 568 × 320 fits with the Bosses row. Sting
  -31.4 dBFS, 0 % > 2 kHz.
- **B-098** (fixed, test only): smoke run 1 failed `S-59 tide locks … chevrons` (630/631): the page ignores `?seed`,
  new worlds are random and 16 / 400 seeds have no tide lock. `tidelock.cjs` now rerolls the world (≤ 5, accepts the
  confirm). Reroll path checked (seed changes); 3 + 1 standalone runs PASS.

## Session 136 — Build (Debt): awake Gyre perf run, its glow made cheap (v1.9.77, D-174)
- `tools/perf.cjs`: new `gyre` run (Surge, god, core held 4 cells north of the Gyre core, swarm clock zeroed: awake,
  rim tell on, ≤ 2 swarms / 12 motes, ~22 dashes); `ONLY` takes a comma list. Before, CPU × 4: desktop gyre / shoal
  1.29–1.36×, phone 1.18×. Probe splits (scratch copy): Drift asleep 43.2 ms vs the same spot with the boss down
  36.6; update 0.5 → 0.8 ms awake; shadowBlur off 39.3; dashes off 43.5 (no gain). So: the 4-cell blur box.
- Fix: blur clipped to the core ring (0.4 cell + pad), rim tell as `GYRE_RIM_GLOW` strokes, key plate unblurred.
  After: desktop 1.04 / 1.20× (two runs; headless noise ±3 ms), phone 1.13×. Screenshot of the awake Gyre: the rim
  still reads as a mint outline. New `gyre.cjs` check fails on the old code (2 blurred strokeRects, no box).
