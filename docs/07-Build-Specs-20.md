# 07 — Build Specs, part 20: M17 Hunters (D-182)

Plan in D-182 (owner inbox, session 143). One slice per PR (D-063), each usable end to end (D-139). VERSION: M17 → 1.12.
**Why:** the owner wants more enemy kinds, some with real pathfinding. Glitches beeline and fade when rock blocks
them (D-017); Spitters hold and shoot; Burrowers bore. Nothing follows you *through* the tunnels you mined.

## S-72 — Flow field + the Tracer (M17; build-ready, Design 152, D-190)
**Save:** none (hunters are unsaved, like Burrowers). New files `src/flow.js`, `src/hunter.js`; `game.js` (524 lines)
gets only the calls (one `updateHunters(this, dt)` line after `updateBurrower`, in both modes).
- `src/flow.js`: `coreField(game)` one 4-way BFS from the core's cell, bound `FLOW_FIELD` 32 cells (65 × 65 box),
  rebuilt every `FLOW_S` 0.5 s or when `world.breaks` changed (a global counter, so any break: the Echo's rule, D-108);
  `fieldAt(x, y)` (-1 = out / unreachable), `downhill(x, y)` (lowest of 8 neighbours, diagonals only when both sides
  are open). Built only while a hunter exists. Cost (Design 147, node): 0.08 ms a build at bound 32. The Echo keeps
  its own 24-cell field until S-73 (D-186).
- **Where hunters live:** `game.hunters = []` (not `game.enemies`, which Drift empties every frame). `beamFoes`
  (`spitter.js`) adds them, so the beam, Arc, Echo Defend and Auto's threat check see them with no other change.
  Core death or New Cycle clears the list; a mode switch keeps them (their face changes at once).
- **Tracer:** a cyan-violet chevron (Glitch size, sprite cached, D-051) with a 6-dot trail of the last cells it crossed
  (fading, unblurred, D-160). Ring Veil and out (core ≥ 24 cells from the Nexus); one at a time (2 when the core is in
  the Deep or past). Every `TRACER_S` 40–60 s (`rng.tracer`: add `'tracer'` and `'pincer'` to the stream list in
  `game.js`, D-025). Spawn: field cells 16–24 steps away whose centre is off screen (camera rect + 1 cell), scanned in
  index order, one picked by `rng.tracer`; none → retry in 5 s. Moves with `moveBody` at 0.8 × the tier's Glitch speed
  (96–149 px/s; the core's is 190+, so it catches you while you dig, not while you fly) down `downhill`; with a clear
  line ≤ 3 cells it steers straight. Gives up (D-017's fade) only if its field distance hasn't dropped for 6 s or it
  leaves the field. hp = a Glitch's of the tier.
- Faces (D-152): **Surge** contact 8 dmg (+ the Glitch tier step), kill drops as a Glitch (D-018, `rng['glitch-loot']`).
  **Drift** a touch takes 1 cargo item (export the Mote bite from `mote.js`, BITE_ORDER) and it flees up the field;
  killed, it drops that item. The Nexus repels it like a Glitch.
- Perf: `tools/perf.cjs` gains run `deep` (Surge, `teleport(60)`, no hunters) and `hunt` (`deep` + Echo + 2 Tracers via
  `dev.tracer()`); `hunt` median frame ≤ 1.1 × `deep`; field build ≤ 1 ms at 4× CPU. (No `deep` run existed; Design 152.)
- Smoke (`tracer.cjs`): a stub maze where a beelining Glitch gives up, a Tracer reaches the core within 1.3 × path /
  speed; spawn cells reachable and off screen on 50 seeds; Drift theft + drop on kill; Surge damage; field rebuilt on a
  break; it survives a mode switch; the Echo in Auto turns to Defend at a Drift Tracer. One screenshot (a Tracer rounding
  a corner, trail visible).

## S-73 — The Pincer pair (M17)
**Save:** none.
- Two hunters (rose-violet dots joined by a dotted line while both live), Deep and out (Shoal / Kiln included), every
  `PINCER_S` 70–100 s (`rng.pincer`), never while one is alive. **Lead** follows the flow field. **Flank** every 0.5 s
  runs A* (8-way, octile, ≤ 800 nodes, `src/flow.js` `aStar`) to the open cell nearest the core + its realized velocity
  × 1.5 s that is ≥ 4 cells from the lead's next 8 field cells; none found or over budget → it follows the field too.
  Searches are staggered (never two in one frame).
- Faces as the Tracer (Surge 6 dmg each, Drift 1 item each); one killed → the other flees and fades in 3 s.
- Both in `game.hunters` (`kind: 'lead' | 'flank'`), spawned on S-72's spawn rule (two cells ≥ 6 steps apart); `dev.pincer()`.
- The Echo moves onto `coreField` (its path cap 24 stays; one BFS per tick; `echo.cjs` / `echoorder.cjs` unchanged; D-186).
- Smoke (`pincer.cjs`): on a stub cross of tunnels the flank arrives from a different tunnel than the lead on ≥ 8 of 10
  seeds; A* stops at 800 nodes; no frame runs two searches; the Echo and hunters share one field build; mode faces; the flee. One screenshot (both closing in).

**Split (Build 156, D-194):** S-73a = the pair (built: A* also pays +8 within 2 cells of the lead's cells, spawn split
10 cells, the flank's give-up clock counts path steps left). **S-73b** = the Echo onto `coreField` + the shared-build check.
**S-73b also (Design 157, D-197):** each Pincer dot gets a white pip (lead: a filled 3 px centre; flank: a 1.5 px
white ring inside its hollow): rose vs the Deep's dense edge is ΔE 8 (needs 25), so it reads by light, not hue.
`colours.cjs` adds the pair pip white vs Deep / Shoal / Kiln edges and Prism ore. Screenshot against dense rock.

## S-74 — Hunters gate (M17)
**Save:** none.
- `tools/huntrun.mjs`: the mine bot, 8 seeds (`GATE_SEEDS`), Deep / Shoal / Kiln, Drift and Surge, 10 min, hunters on
  vs off (plus one row with an Auto Echo, reported, not gated). **Gate (PASS):** time cost of hunters (theft vs damage + recovery, D-158's measure) Drift / Surge in 0.8–1.25;
  Tracers reach the core on ≥ 80 % of spawns where a Glitch from the same spot would give up (< 30 %); `perf` `hunt`
  within budget. Tune `TRACER_S`, `PINCER_S`, speeds (log each try in `09`). In `gates.cjs`. **M17 done.**
  Also report Auto's Defend share with hunters on (Design 152 play-test: 30 s of Deep Surge, 7 Glitches gave up, Auto
  never Defended; hunters should give it work). Then the play-test asks Q-038 (should Glitches use the field too?).

**Split (Build 160, D-200):** S-74a = `huntrun.mjs` (build `mid`; reach gated where a ghost Glitch gives up; built).
**S-74b** = tune until the cost half passes (first run: Drift ≈ 0 %, Surge −5…+11 %), plus the Echo row; then M17 done.

## Cut (D-182)
Per-enemy A* every frame, flow fields for Glitches (Q-038), Surge-only hunters, a hunter that bores rock, a third hunter
kind, saved hunters.
