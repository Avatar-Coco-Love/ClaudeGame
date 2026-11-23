# 07 — Build Specs

Specs ready to build, in roadmap order. Written by Design sessions. A Build session takes the top spec, builds it, deletes it here,
and marks the item ✅ in `04`. Numbers here are starting values; they go in `src/config.js`, never inline.
Measured basis (session 3, 40 seeds, see `09`): Shards in a world ≈ 2750◆ (1376 crystal cells × 2), maxing the Core Matrix costs 2482◆.
Prisms in a world ≈ 1470▲; the Core Matrix takes 246▲ and Radiance 113▲. The first Prism is 32 cells out. (S-1…S-12 built in #7–#27.)
M2 basis (session 12, 40 seeds): cells by distance, rock/dense/crystal/prism: d 50–65 1410/666/263/210, d 65–80 1686/997/332/360.
Lumen basis (session 20): ~141● per world (85–225), all at d ≥ 55. Research so far: Scanner 10●. S-13 + S-14 add 65●, leaving ~66●
for later nodes (D-036). Beam today: one ray, `beam` stat 1 + 0.55·lvl dps, `range` 96 + 24·lvl px; hp rock 0.55, dense 2.6 (× ring).

## S-13 — Beam modes v1: Focus + Wide (Research, 25●) (D-036)
- New node in `RESEARCH`: `wide`, "Wide Beam", 25●, desc "A 3-cell swath: slower per cell, carves wide halls". Listed after Scanner.
- `game.beamMode` (intent, `'focus'` default) chooses how `updateBeam` casts; realized hits live in `beam.rays[]`
  (`{ ex, ey, target }` per ray; `beam.ex/ey/target` stay the centre ray's, so render/darkness/tests keep working).
- **Wide:** 3 parallel rays, the centre one plus two offset ±`WIDE_OFFSET` = 32 px sideways at the nose. Range × `WIDE_RANGE` 0.75.
  Each ray does dps × `WIDE_DMG` 0.45 to its first solid cell; a cell hit by two rays in one frame takes damage once.
  Glitches on any ray take 0.45 × the usual 1.6× (once per Glitch per frame). Net: ~1.35× cells per second, each cell 2.2× slower.
- **Switch:** Q (desktop) or a touch button `⟂` beside ◎ cycles the unlocked modes; it shows only once a second mode exists.
  Shows the mode as a 1-word toast ("Focus" / "Wide"); a short click tone. Dropped while paused or under the Matrix (as F, D-034).
- Render: three beams at 0.6× line width, same colour; the darkness hole follows each ray end at 0.6× size.
- Save: `beamMode` in the save, `SAVE_FORMAT` 7, upgrade step `beamMode: 'focus'`. A saved mode that isn't unlocked loads as Focus.
- **Smoke:** Wide locked until 25●; with Wide, one second of fire at a flat rock wall damages 3 cells, each by 0.45× Focus's;
  two rays on one cell count once; Q cycles only unlocked modes; reload keeps Wide; a format-6 save loads as Focus; Research tab
  with two nodes fits 320 px; `⟂` hidden before unlock.

## S-14 — Pulse beam (Research, 40●) (D-036)
- Node `pulse`, "Pulse Beam", 40●, after Wide; joins the Q / `⟂` cycle.
- **Hold** fire: no damage; `beam.charge` rises to 1 over `PULSE_CHARGE_S` 1.2 s; a dotted aim line shows the reach
  (range × `PULSE_RANGE` 1.5). **Release:** if charge ≥ `PULSE_MIN` 0.2, a burst of dps × `PULSE_CHARGE_S` × charge × `PULSE_MUL`
  1.3 hits the first cell; what a broken cell doesn't use carries to the next solid cell on the ray, up to `PULSE_PIERCE` 3 cells.
  A Glitch on the ray takes the burst × 1.6 and stops it. Below `PULSE_MIN` it fizzles (no damage, soft tick).
- Feel: the core's glow brightens with charge; a bright line flashes 0.12 s on release; break hitstop rules unchanged.
- Touch: the aim stick held = charge, released = fire (same as the mouse). Reduced motion: no glow pulse, flash kept short.
- **Smoke:** a full charge breaks 3 Hearth rock cells in a row in one release; a 0.1 s tap does nothing; the burst stops at the
  first Glitch; Pulse is never unlocked by Wide; mode cycle Focus → Wide → Pulse → Focus.

## S-15 — Throttled perf check (Tooling)
- `tools/perf.cjs`: headless Chromium at 1280×800 DSF 1, CDP `Emulation.setCPUThrottlingRate` 4, seed 77, `dev.teleport(30)`,
  then 20 s of real mining in Wide (falls back to Focus before S-13) with 300 floor pickups on screen. Reports frame time
  mean / p95 / max from `requestAnimationFrame` deltas. Budget: p95 ≤ 16.7 ms. Not in smoke (too slow); log the numbers in `09`.
