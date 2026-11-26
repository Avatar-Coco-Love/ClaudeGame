# 09 — Implementation Log, part 18

Continues part 17 (sessions 124–125; 119–123 archived in audit 129). Newest at the bottom; read the tail only.

## Session 126 — Build: S-60a Crucible, the first boss slice (v1.8.67, D-163)
- `boss.js` (lair site, stamp, take-apart, flare, draw, minimap mark); `T.BOSS_CORE` / `T.BOSS_PLATE`; save format 23.
  Wired in `game.js` (make / stamp / update / save), `render.js`, `hud.js`, `main.js` (toast), `lock.js` `quenched`,
  `wake.js` (boss cells stop a lane).
- Lair: 30 / 30 seeds, found by draw 11 at the latest (matches Design 122); vents, Anomalies and terrain outside the
  footprint unchanged. Probe (mid build, beam 5 / range 3, bot circles the body on a 3.4-cell ring): 59.9, 59.9, 59.8,
  61.0 s on 4 seeds (≤ 90 s PASS); about 4 s a plate, overheats twice.
- Screenshot viewed (seed 4242): the rose 3 × 3 body with the ember octagon core and the lit plate's glowing edge read
  well; a lit plate's orange edge is close to Kiln rock's, but its pulse and glow set it apart.
- `tests/boss.cjs` (10 node + 1 browser checks); the old-save check failed first (the Beacon cell was solid in the save's
  map, so it never loaded): the test now breaks that cell in the old map, as a real save would.
- B-094 (caught by smoke): the 8-seed Shoal gate (`mote.cjs`) went 0.922 / 0.855, gap 0.067 FAIL: on 3 seeds the bot's
  Shoal pad is 8–16 cells from the lair, and its floor shifts paths and spawns (12 / 16 seeds still PASS). Fix as for
  rifts: `runBot` clears lairs unless `boss: 'on'`; the gates read their old numbers exactly (Shoal 0.017, Kiln 0.039).
- Smoke 601/601 (+11: `boss.cjs` 10 node + 1 browser).

## Session 127 — Design: Crucible play-test, B-095, boss gate scope (v1.8.68, D-164)
- Play-test in the page (seed 4242, mid build, the S-60a probe's path as `input.read`): after the first plate broke the
  glow stayed on the empty cell and nothing took damage for 120 s. **B-095:** `render.js` attach replaced
  `world.listeners`, dropping `boss.js`'s break listener (node probes have no renderer, so smoke never saw it). Fix: the
  renderer adds / removes only its own listener. New browser check in `boss.cjs` failed on the old code (was 1, now 1).
- After the fix: down in 60.5 s (7 → 4 plates by 24 s, core open at 47 s), loot burst + toast + filled minimap octagon.
  Screenshots viewed: the lit plate shows only as an orange edge in a still frame (close to Kiln rock) → S-60b tints
  its fill. The flare ring reads; the bot's 3.4-cell ring stays just out of `BOSS_FLARE_R`.
- Specs vs shipped (D-163): S-60b gate now runs `boss: 'on'` with creatures, spawns and vents live and logs Surge deaths
  by cause (blind spot from B-094: creature gates run without lairs); Wards ignore the body and embers. S-61a fits D-163
  as is (a new lair on a format-23 save is refunded by the existing no-record rule). S-62 adds an advisory lairs-on
  run of both creature gates (16 seeds).
- B-096 (caught by smoke, 601/602): `lock.cjs`'s browser check crashed on a world with no Flare Lock ("New world"
  ignores `?seed` and draws a random one; 1 in 25 measured has none). The test now retries a new world (≤ 8) until
  one has a lock; 5 / 5 standalone runs pass.

## Session 128 — Build: S-60b1 Crucible awake in Surge (v1.8.69, D-165)
- `boss.js`: `bossAwake` (Surge, live, core ≤ `BOSS_WAKE_R` 10 cells), any plate cuts, 4 s flare + 10 dmg, embers
  (`game.bolts`, `ember: true`), `healBosses` on death; `vent.js` `ventPhase` takes a period; Wards skip embers;
  weather / rifts check `game.bossAwake`; `audio.js` `bossThump` / `ember`; ember sprite redder and larger.
- Split (D-165): the `bossrun.mjs` gate is S-60b2. Probe (4 seeds, mid build, no creatures): Surge 57.1–57.3 s,
  Drift 59.8–61.0 s (ratio ≈ 0.95), 0 deaths, 28 embers a fight, all popped or blocked.
- `boss.cjs` +6 checks (16 node + 2 browser), `audio.cjs` +1; the 6 new boss checks failed on the old code (stash run). Thump peak
  -27.7 dBFS, ember -34.2, 0 % > 2 kHz.
- Screenshot viewed (seed 4242, Surge, 3.5 cells out): all 7 standing plates glow, the core octagon reads; awake vs
  Drift is clear (one lit plate vs all), but the awake glow is pink-dominant: S-60b2 may push it toward ember.
- Smoke 609/609 (+7).

## Session 129 — Audit: bot gates in parallel, per-file smoke timing, 09 archive (v1.8.70, D-166)
- No subagent tool: sweeps in-session, newest code first (`boss.js` S-60a / b1: awake / heal / flare / ember paths,
  death and mode switch, storm and rift guards; D-160…D-165 numbers match `config.js`). No new bug found.
- Debt carried three audits, done: timed every smoke file (`T()` in `smoke.cjs`, TIME lines). Before: 620 s total;
  node phase 188 s, of which the 4 bot gates (`eventrun` 72 s, `biomefoe` ×3 ~20 s each) ran back to back.
- `tests/gates.cjs`: smoke prestarts the gates as child processes on spare cores (4 here); the tests await them.
  After: 529 s total, node phase 105 s; gate output lines identical to the run before (seeded sims). New check
  (`gates.cjs` vs the tests' calls, no `execFileSync` of a tool) fails on the old `rift.cjs` (checked).
- Still slowest: `touch` 106 s, `quality` 46 s, the inline desktop / phone block 29 s, `ending` 26 s (`04` Debt).
- Workflow review: too much: smoke wall time (two full runs = 19 min of a session); too little: no per-file timing,
  so three audits deferred the fix for lack of a measurement. Now printed every run (D-166). Phone sweep: none (124).
- `09` sessions 119–123 archived word for word (`archive/2026-11-26-09-sessions-119-123.md`). Smoke 610/610 (+1).

## Session 130 — Build: S-60b2, the Crucible gate (v1.8.71, D-167)
- `surgebot.mjs` route `boss`; `tools/bossrun.mjs` (8 seeds, both modes, the world as played); `tests/boss.cjs` awaits it,
  `gates.cjs` SMOKE prestarts it (~1 s).
- Gate line: drift down 8/8, med 0.67 min, 0 deaths, overheats 15; surge down 8/8, med 0.69 min, 0 deaths (boss 0,
  Burrower 0, Glitch 0), burns 79, embers 0, kills 9. Ratio 1.059: PASS (16 seeds 1.033).
- Observed: no ember is ever lobbed (the bot stands adjacent, inside BOSS_EMBER_OUT); the burns (~10 / fight, 10 dmg
  each) never kill a top hull. Surge is no harder for a close fighter: Q-033 for Design 132. Smoke 611/611 (+1).

## Session 131 — Build: S-61a, the Gyre (v1.8.72, D-168)
- `src/gyre.js` (whirlpool current, key step, draw); `boss.js` per-ring branches; `undertow.js` `flowAt` + ease; config
  GYRE_*, BOSS_WAKES, BOSS_RGB. `tests/gyre.cjs` (8 checks, smoke); `boss.cjs` now expects two lairs.
- Measured: site on 30 / 30 seeds by draw 2; probe (mid build, beam 5 / range 3, riding 3.2 cells out): 56.0, 55.8,
  56.7, 56.1 s (spec ≤ 90). Screenshot viewed: mint core + turning hexagon, key plate, ring dashes in the lair.
- Observed: the key fill on the rose plate reads pale mint under the darkness (distinct, not loud); S-62 may revisit.
