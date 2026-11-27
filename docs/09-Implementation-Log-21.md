# 09 — Implementation Log, part 21

Sessions 144–149 archived word for word in audit 154 (`archive/2026-11-27-09-sessions-144-149.md`), 150–153 in audit 159 (`archive/2026-11-27-09-sessions-150-153.md`); part 20 removed. Newest at the bottom; read the tail only.

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

## Session 157 — Design: owner asks triaged, HUD reach measured (v1.11.98, D-195…D-197)
- Phone sweep (`?dev`, Max all + Echo, touch): action centres 610–713 px from the bottom-right corner at 390 × 844,
  335–418 at 320 × 568, 387–545 at 844 × 390, 326–413 at 568 × 320 (natural reach ≈ 275). No page errors.
  Screenshot (390 × 844): all actions in the top quarter, the bottom-right empty. → S-75 thumb arc, S-76 map legend
  (`07-Build-Specs-21.md`), slotted after S-74 (D-195).
- Deep Surge play-test (cross tunnel at d 60, `dev.pincer()`): the pair closed 15 → 0 cells in ~4.5 s. Screenshot:
  the hollow flank beside magenta dense rock nearly vanished. ΔE (worst of 4 visions) rose vs Deep dense edge 8; a
  bright-colour sweep finds nothing ≥ 25 from every edge / ore / creature → white pip, folded into S-73b (D-197).
- Owner's enemy tiers and attack / defend list triaged (D-196): next tier picked after M18; Decoy kept as Q-042.
