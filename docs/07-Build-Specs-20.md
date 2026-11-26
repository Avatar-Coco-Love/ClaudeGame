# 07 — Build Specs, part 20: M17 Hunters (D-182)

Plan in D-182 (owner inbox, session 143). One slice per PR (D-063), each usable end to end (D-139). VERSION: M17 → 1.12.
**Why:** the owner wants more enemy kinds, some with real pathfinding. Glitches beeline and fade when rock blocks
them (D-017); Spitters hold and shoot; Burrowers bore. Nothing follows you *through* the tunnels you mined.

## S-72 — Flow field + the Tracer (M17)
**Save:** none (hunters are unsaved, like Burrowers).
- `src/flow.js`: `coreField(game)` one 4-way BFS from the core's cell, bound `FLOW_FIELD` 32 cells (65 × 65 box), rebuilt
  every `FLOW_S` 0.5 s or on a cell break inside it (`world.breaks`); `fieldAt(x, y)`, `downhill(x, y)` (lowest of 8
  neighbours, diagonals only when both sides are open). Built only while a hunter exists. Cost (Design 147, node):
  0.08 ms a build at bound 32, 0.1 ms all open, so ≤ 1 ms at 4× CPU holds. The Echo keeps its own field here (D-186).
- **Tracer:** a cyan-violet chevron (Glitch size) with a 6-dot trail of the last cells it crossed (fading, unblurred).
  Both modes, Veil and out (core ≥ 24 cells from the Nexus), one at a time (2 from the Deep), every `TRACER_S` 40–60 s
  (`rng.tracer`), spawned out of view on an open cell 16–24 field steps away (never an unreachable cell).
  Moves at 0.8 × the ring's Glitch speed down `downhill`; with a clear line ≤ 3 cells it steers straight. Gives up
  (D-017's fade) only if its field distance hasn't dropped for 6 s or it leaves the field. hp = a Glitch's of the tier.
- Faces (D-152): **Surge** contact 8 dmg (tier-scaled like Glitches), kill drops as a Glitch (D-018). **Drift** a touch
  takes 1 cargo item (the Mote rule) and it flees uphill; killed, it drops the item. The beam, Arc and Echo Defend
  hit it (`beamFoes`), so Auto (S-69) defends against it in both modes. The Nexus repels it like a Glitch.
- Perf: `perf.cjs` run `hunt` (Deep, 2 Tracers + Echo) median frame ≤ 1.1 × `deep`; field build ≤ 1 ms at 4× CPU.
- Smoke (`tracer.cjs`): a stub maze where a beelining Glitch gives up, a Tracer reaches the core within 1.3 × path /
  speed; spawn cells reachable on 50 seeds; Drift theft + drop on kill; Surge damage; field rebuilt on a break; the
  Echo in Auto turns to Defend at a Drift Tracer. One screenshot (a Tracer rounding a corner, trail visible).

## S-73 — The Pincer pair (M17)
**Save:** none.
- Two hunters (rose-violet dots joined by a dotted line while both live), Deep and out (Shoal / Kiln included), every
  `PINCER_S` 70–100 s (`rng.pincer`), never while one is alive. **Lead** follows the flow field. **Flank** every 0.5 s
  runs A* (8-way, octile, ≤ 800 nodes, `src/flow.js` `aStar`) to the open cell nearest the core + its realized velocity
  × 1.5 s that is ≥ 4 cells from the lead's next 8 field cells; none found or over budget → it follows the field too.
  Searches are staggered (never two in one frame).
- Faces as the Tracer (Surge 6 dmg each, Drift 1 item each); one killed → the other flees and fades in 3 s.
- The Echo moves onto `coreField` (its path cap 24 stays; one BFS per tick; `echo.cjs` / `echoorder.cjs` unchanged; D-186).
- Smoke (`pincer.cjs`): on a stub cross of tunnels the flank arrives from a different tunnel than the lead on ≥ 8 of 10
  seeds; A* stops at 800 nodes; no frame runs two searches; the Echo and hunters share one field build; mode faces; the flee. One screenshot (both closing in).

## S-74 — Hunters gate (M17)
**Save:** none.
- `tools/huntrun.mjs`: the mine bot, 8 seeds (`GATE_SEEDS`), Deep / Shoal / Kiln, Drift and Surge, 10 min, hunters on
  vs off (plus one row with an Auto Echo, reported, not gated). **Gate (PASS):** time cost of hunters (theft vs damage + recovery, D-158's measure) Drift / Surge in 0.8–1.25;
  Tracers reach the core on ≥ 80 % of spawns where a Glitch from the same spot would give up (< 30 %); `perf` `hunt`
  within budget. Tune `TRACER_S`, `PINCER_S`, speeds (log each try in `09`). In `gates.cjs`. **M17 done.**
- Then the play-test asks Q-038 (should Glitches use the field too?).

## Cut (D-182)
Per-enemy A* every frame, flow fields for Glitches (Q-038), Surge-only hunters, a hunter that bores rock, a third hunter
kind, saved hunters.
