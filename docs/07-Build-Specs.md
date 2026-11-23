# 07 — Build Specs

Specs ready to build, in roadmap order. Written by Design sessions. A Build session takes the top spec, builds it, deletes it here,
and marks the item ✅ in `04`. Numbers here are starting values; they go in `src/config.js`, never inline.
Measured basis (session 3, 40 seeds, see `09`): Shards in a world ≈ 2750◆ (1376 crystal cells × 2), maxing the Core Matrix costs 2482◆.
Prisms in a world ≈ 1470▲; the Core Matrix takes 246▲ and Radiance 113▲. The first Prism is 32 cells out. (S-1…S-13 built in #7–#28.)
M2 basis (session 12, 40 seeds): cells by distance, rock/dense/crystal/prism: d 50–65 1410/666/263/210, d 65–80 1686/997/332/360.
Lumen basis (session 20): ~141● per world (85–225), all at d ≥ 55. Research so far: Scanner 10●, Wide 25● (S-13, D-041). S-14 adds 40●, leaving ~66●
for later nodes (D-036). Focus beam: one ray, `beam` stat 1 + 0.55·lvl dps, `range` 96 + 24·lvl px; hp rock 0.55, dense 2.6 (× ring).

## S-14 — Pulse beam (Research, 40●) (D-036)
- Node `pulse`, "Pulse Beam", 40●, after Wide; joins the Q / `⟂` cycle as a `BEAM_MODES` entry (`src/beam.js`, D-041).
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
  then 20 s of real mining in Wide (`g.research.wide = true; g.beamMode = 'wide'`) with 300 floor pickups on screen. Reports frame time
  mean / p95 / max from `requestAnimationFrame` deltas. Budget: p95 ≤ 16.7 ms. Not in smoke (too slow); log the numbers in `09`.
