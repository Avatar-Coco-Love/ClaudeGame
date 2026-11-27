# 09 — Implementation Log, part 21

Sessions 144–149 archived word for word in audit 154 (`archive/2026-11-27-09-sessions-144-149.md`); part 20 removed. Newest at the bottom; read the tail only.

## Session 150 — Audit: every test's New World pinned + a check (v1.10.91, D-188), 09 archive
- No subagent tool: sweeps in-session, newest code first. `light.js` B-104 fix: the whole-layer clear is bounded by the
  quarter-res layer (grows only), fine. D-184…D-187 vs `config.js` (`ECHO_ORDERS`, `ECHO_AUTO_HOLD` 2): match.
- **Queued check (B-101, B-103):** `tests/pinworld.cjs` — `newWorld(page, tap, r)` pins Math.random for the click;
  `run()` in smoke flags raw `#new-world` clicks with no nearby pin / `any-seed:` note. Old tree: 55 hits (FAIL);
  42 files converted mechanically, `spire.cjs` `pinnedNewWorld` now wraps it (same 0.42 seed).
- B-100 closed (unseen since the Spire pin, two audits). `09` sessions 139–143 archived word for word
  (`archive/2026-11-26-09-sessions-139-143.md`), part 19 removed. Workflow review in D-188. No game bug found.

## Session 151 — Build: S-71b, Q-040 settled, the Echo gate in smoke (v1.11.92, D-189; M16 done)
- Probe of Q-040's lean (Defend mines while its shot reloads, idle once ready; 48 seeds, hold 2 s): Defend gain
  36.4 / 36.8 → 37.1 / 37.1, damage 13.3 / 8.9; added gain Drift / Surge L0 1.329, L2 1.229. Not ≤ 1.25: reverted.
- D-189: band on Auto gain Drift / Surge (0.890 / 0.915); added-gain ratio keeps a 1.5 ceiling. Gate on the shipped
  code, 48 seeds × 5 min: PASS (Auto 0.98 × Mine, 0.83 / 0.67 × Defend damage, share 21 / 29 %), ~4.3 min.
- `echoorder.cjs` awaits `gates.cjs` run('echobot.mjs', ['--orders']) (in SMOKE, prestarted beside the smoke). No bug.

## Session 152 — Design: Echo play-test, S-72 build-ready (v1.11.93, D-190)
- Play-test (Playwright, `?dev`, seed 0.42): Drift Deep d 60, Echo Auto mined a Lumen vein beside the core, stayed
  54–90 px off, no blinks. Surge d 60, 30 s digging: 7 Glitches gave up (D-017) in the rock, 0 contacts, Auto 0 switches.
  Screenshots viewed: Echo diamond + beam read clearly against the Deep palette.
- Specs checked against code: `perf.cjs` has no `deep` run (S-72 adds it), `enemies` is emptied in Drift (hunters get
  their own list), `world.breaks` is a counter (any break rebuilds), rng streams are a fixed list in `game.js`.
  S-72 rewritten build-ready; S-73 names `game.hunters` / `dev.pincer()`; S-74 reports Auto's Defend share. Q-041 opened. No bug.

## Session 153 — Owner feedback: the map view (v1.11.94, D-191)
- Owner (chat): minimap too small / congested; a tap on it aims the beam; buttons could sit better; how smart can
  enemies get; new ways to attack and defend. Took the concrete bug first (this PR); the rest went to `04-…-5`
  ("Owner feedback, session 153") for Design 157. S-72 (smarter hunters, already planned) follows Audit 154.
- B-105 (fixed): `#hud { pointer-events: none }` let a tap on the minimap reach the canvas and start the aim stick.
- `mapview.cjs`: desktop click / N / Escape, phone tap (844×390): map 560 / 358 px vs minimap 140 / 112, world time
  held, no aim stick. Screenshots viewed (desktop, phone after teleports 20 / 40 / 60): four lit pockets read apart.

## Session 154 — Audit: B-106 key clash, map view re-fits, phone sweep, old debt closed (v1.11.95, D-192)
- No subagent tool: sweeps in-session, newest code first (D-191 map view). Edge cases: death / hitstop / Escape /
  Matrix / page hidden while open: fine (world held, pause path drops the beam sound).
- **B-106 (fixed):** an older saved key set with N bound (call → N) reset both call and map to defaults (`cleanKeys`
  clash rule). Now Map takes a free key; new `keys.cjs` check FAILs on the old code, passes now.
- Map view sized only on open: resized 1280×800 → 900×420 while open it stayed 560 px, close line off screen (bottom
  501 of 420). Now it re-fits per draw; `mapview.cjs` check FAILs on the old code. `MAP_MAX_PX` moved to config.
- Phone sweep (scratch script, `?dev`, Max all + Echo + full bank): 320×568, 390×844, 844×390, 568×320: no HUD overlap,
  no button < 44 px, no page scroll, no page errors; screenshots viewed (320 portrait, 844 / 568 landscape + map).
- D-191 vs code: match (`MAP_MAX_PX` 560, N, world held). `09` 144–149 archived; part 20 removed. Debt closed (D-192).

## Session 155 — Build: S-72 flow field + the Tracer (v1.11.96, D-193)
- New `src/flow.js` (core BFS field, `downhill` / `uphill`, `ringCells`) and `src/hunter.js` (Tracer: spawn rule,
  field walk, faces, draw); `game.hunters` + `game.hunt`, streams `tracer` / `pincer`; `beamFoes` adds hunters;
  `biteCargo` exported from `mote.js`; `dev.tracer()`; toast on the first Drift snatch. `tests/tracer.cjs` (9 checks).
- Maze stub (1-cell tunnel, 48-step path): the Glitch gave up with no hit; the Tracer arrived in 13.5 s vs a 17.6 s
  bound. Spawn rule on 50 seeds (core 30–40 cells out on natural floor): 46 spawned, all 16–24 steps, open, off screen.
- Perf (`ONLY=deep,hunt`, 4× CPU, 12 s): `hunt / deep` median 1.00×; field build max 3.2 ms with the first BFS
  (`for…of` + destructuring), 0.60 ms after unrolling over `world.cells` (D-193). Screenshot viewed: a Tracer at a
  tunnel corner, 5 trail dots fading down the shaft; violet reads apart from the cyan core.
- First full smoke: 685/687: the rift `eventrun` and Kiln `biomefoe` gates FAILed (Tracers now spawn in their runs).
  Both tools set `hunt.off` like their other creatures (D-193); the hunters' cost is S-74's gate.
- Not done here (S-74's job): tuning `TRACER_S` / speed against the haul gate.

## Session 156 — Build: S-73a the Pincer pair (v1.11.97, D-194)
- New `src/pincer.js` (flank target, `flankStep`, draw); `flow.js` `aStar` (heap, stamps, avoid cost, node cap);
  `hunter.js` spawns pairs (`spawnPincer`, `hunt.pincer` timer, Deep+), kind-aware dmg / burst / draw, mate flees on a
  kill; `dev.pincer()`; `tests/pincer.cjs` (8 checks) in smoke.
- First cross run: 5 / 10 flanks never arrived: the 6 s stall rule faded them on the detour (field distance rose).
  Fixed by counting path steps left (D-194); then 10 / 10 came in by the N arm while the lead took E.
- 8 natural Deep seeds, 30 s Surge each: 6 pairs, 10 / 12 reached the core; A* max 736 nodes, never capped.
- Screenshot viewed: lead (filled) in the E arm, flank (hollow) in the N arm, dotted line between; rose reads on the
  Deep's magenta but not strongly (watch in Design 157).
