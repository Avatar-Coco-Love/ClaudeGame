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
