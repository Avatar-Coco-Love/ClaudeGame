# 09 — Implementation Log, part 19

Continues part 18 (sessions 126–131). Newest at the bottom; read the tail only.

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
