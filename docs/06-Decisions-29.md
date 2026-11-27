# 06 — Decisions log, part 29

Continues `06-Decisions-28.md` (part 28 neared the 8 KB cap at D-192; same rules: supersede, never edit; list rejected
alternatives). D-193 on.

### D-193 — S-72 as built: the Tracer's open details (session 155)
S-72 (D-190) left these open; settled while building `src/flow.js` / `src/hunter.js`:
- **The field also rebuilds when the core changes cell** (besides every `FLOW_S` 0.5 s and any break). At 190+ px/s a
  0.5 s-old field points 3 cells behind the core; a build costs ≤ 0.6 ms at 4× CPU (`perf` `hunt`, warm), ~0.06 ms in
  node. The BFS is unrolled over `world.cells` with one shared queue (the first, `for…of` version measured 3.2 ms at 4×).
- **Off screen** uses `game.view` (half the visible world rect), which `drawHunters` sets each frame; node / tools fall
  back to a 1280 × 800 desktop at zoom 1.11 (576 × 360 px). Spawn cells also skip the Nexus ring and any cell a body of
  Glitch size would not fit.
- **Drift touch:** any touch sends it fleeing up the field (empty hold too: it does not hover on the core); it fades
  after `TRACER_FLEE_S` 6 s or off the field, taking the item for good. A kill gives back what it took in any mode (a
  Ward's kill too, as a mote's carried item, D-154); only Surge adds the Glitch loot (D-018, `rng['glitch-loot']`
  drawn either way, D-025). Its first contact counts in `hunt.reached` (the S-74 gate's measure).
- **First Tracer** after one `TRACER_S` draw (40–60 s) in the Veil or past; the timer runs only there, below the cap,
  outside a Wake. Tracer kills do not count as Glitches in `stats` (the ending's Glitch count stays Glitches).
- **Perf runs:** `deep` / `hunt` carve the same 1-cell tunnel cross (26 cells each way) at d 60, so Tracers can spawn and
  walk; measured `hunt / deep` median 1.00×.
- **Older gates isolate their feature:** `eventrun.mjs` and `biomefoe.mjs` set `hunt.off` (as they already turn off
  the other creatures): with Tracers on, both FAILed (rift Deep Surge on/off 1.009; Kiln Drift 0.837). The hunters' own
  cost is S-74's gate.
- Rejected: a field rebuilt on the 0.5 s clock only (hunters lag the core by cells; the clear-line rule only covers 3);
  a fixed screen size for off screen (a phone's view is far smaller than a desktop's); letting a Drift Tracer re-hunt
  after a touch (a thief that never leaves reads as Surge damage in Drift, against D-152).

## D-194 — The Pincer pair as built (S-73a, session 156)
- **Split S-73:** the pair ships alone; the Echo's move onto `coreField` is S-73b (a refactor with its own checks).
- **The flank's A* goes round the lead:** cells within 2 of the lead's next 8 field cells cost +8. Measured on a
  ring-joined cross: with the target rule alone, the flank's shortest way to a cell 4 clear of the lead ran down the
  lead's own arm; with the cost it came in by another arm on 10 / 10 seeds (a field-walking flank: the lead's arm 10 / 10).
- **Spawn split 10 cells (euclidean), not 6 steps:** 6 lets both land in one tunnel; 10 still spawns 43 / 50 Deep seeds.
- **The flank's give-up clock counts its path steps left** (+ the target's field value), not field distance: a detour
  round the lead raises field distance and the 6 s stall rule killed it mid-flank.
- One search a frame across all flanks (`hunt.frame`); the hunter field is `hunter: 'lead' | 'flank'` (the S-72 key), not `kind`.
- Rejected: blocking the lead's cells outright (no other way in a dead-end tunnel → no flank at all); searching every
  frame (D-182 cut); the flank's own BFS field (a second build a frame).

### D-195 — HUD reach: a thumb arc on touch, a map legend (Design 157, owner ask of session 153)
- **Measured:** on a 390 × 844 phone the actions sit 610–713 px from the bottom-right grip (natural reach ≈ 275 px);
  every viewport tested puts them at stretch or past (`07-…-21` table). The owner's worry holds.
- **S-75:** on touch the actions move to arcs round the bottom-right corner (R 180–230, then + 56), most used
  innermost; ♪ ≡ and the minimap stay top-right. **S-76:** the big map gets a legend of the marks it drew.
- **Slot:** both after S-74 and before S-66, as v1.12 patches, no milestone (D-181's order stands: M17 closes first;
  Feats keep M18 → 1.13).
- Rejected: a bottom-edge row (the resting aim thumb hits it), a radial menu (two taps for the beam mode), a new
  milestone for UI (shifts M18's version for two small slices), leaving it (a measured reach fault on every phone).

### D-196 — Enemy tiers and new attack / defend tools: triage (Design 157)
- **Tiers** stand as the owner put them: beeliners (Glitch) < field followers (Tracer) < coordinators (Pincer).
  After M18, one next tier is picked by play-test, not now; the candidates stay in `04-…-5`. Of them, "reads your
  beam" is the leaning (it works on hunters, which exist in both modes; a Nexus-mouth camper and a retreating pack
  are Surge-only today, Glitches are not in Drift).
- **Attack / defend:** the one candidate kept is a **Decoy** (a craft placed like a Ward that hunters' fields aim at
  for a few seconds: in Drift it saves cargo, in Surge integrity — equal in both, D-002). Q-042 asks whether it
  earns a slot after S-74's numbers. Cut: traps / mines (a second Ward, D-153), a push beam (a 5th beam mode, a longer
  list not a deeper one), a shield pulse (damage only: Drift's hunters steal, so it would be a Surge tool).
- Rejected: speccing a fourth enemy now (M17's gate has not measured the three), keeping all four tool ideas open.

### D-197 — The Pincer gets a white pip (Design 157)
- Measured (CIE76, worst of 4 visions): Pincer rose vs the Deep's dense edge ΔE 8, vs Prism ore similar family; a
  sweep of bright colours finds none ≥ 25 from every ring edge, ore and creature (the palette is full). The play-test
  screenshot: the hollow flank against magenta dense rock nearly vanished.
- So it reads by light: a white pip in each dot (filled for the lead, a ring for the flank), folded into S-73b.
- Rejected: a new hue (best found: pale mint 180,255,240, which then sits on Tide ore and the Shoal), a bigger dot
  (Glitch size is the rule for small foes).

### D-198 — The Echo reads the hunters' `coreField` (Build 158, S-73b; closes D-186's interim)
- The Echo's own 24-cell BFS is gone: it calls `coreField(game)` (flow.js, 32-cell box) and treats steps > `ECHO_FIELD`
  (24) as unreachable, so its blink rule and path cap are unchanged. Hunters tick the field's 0.5 s clock when they run
  a frame; with none alive the Echo ticks it. One build a frame at most (`pincer.cjs`). `ECHO_FIELD_S` removed.
- Side effect kept: the field now also rebuilds when the core changes cell (the Echo's was up to 0.5 s stale).
- Rejected: a second, smaller box for the Echo (two builds a frame, what S-73 set out to remove); a per-frame tick
  guard in flow.js (a frame counter on the game for one clock; the hunters-first order already holds).
