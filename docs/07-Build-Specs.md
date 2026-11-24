# 07 — Build Specs

Specs ready to build, in **build order: S-14, S-18 (this file), then S-15, S-16, S-19 (`07-Build-Specs-2.md`)** (D-048). Written by Design sessions. A Build session takes the top spec, builds it, deletes it here,
and marks the item ✅ in `04`. Numbers here are starting values; they go in `src/config.js`, never inline.
Measured basis (session 3, 40 seeds, see `09`): Shards in a world ≈ 2750◆ (1376 crystal cells × 2), maxing the Core Matrix costs 2482◆.
Prisms in a world ≈ 1470▲; the Core Matrix takes 246▲ and Radiance 113▲. The first Prism is 32 cells out. (S-1…S-13 built in #7–#28.)
M2 basis (session 12, 40 seeds): cells by distance, rock/dense/crystal/prism: d 50–65 1410/666/263/210, d 65–80 1686/997/332/360.
Lumen basis (session 20): ~141● per world (85–225), all at d ≥ 55. Research so far: Scanner 10●, Wide 25● (S-13, D-041). S-14 adds 40●, leaving ~66●
for later nodes (D-036). Spare Prisms after Core Matrix + Radiance: ~1100▲ (S-16 spends ≤ 100▲). Focus beam: one ray, `beam` stat 1 + 0.55·lvl dps, `range` 96 + 24·lvl px; hp rock 0.55, dense 2.6 (× ring).

## S-14 — Pulse beam (Research, 40●) (D-036, retuned by D-042)
- Node `pulse`, "Pulse Beam", 40●, after Wide; joins the Q / `⟂` cycle as a `BEAM_MODES` entry (`src/beam.js`, D-041).
- **Hold** fire: no damage; `beam.charge` rises to 1 over `PULSE_CHARGE_S` 1.2 s; a dotted aim line shows the reach
  (range × `PULSE_RANGE` 1.5). **Release:** if charge ≥ `PULSE_MIN` 0.2, a burst of dps × `PULSE_CHARGE_S` × charge × `PULSE_MUL`
  **1.0** hits the first cell; what a broken cell doesn't use carries to the next solid cell on the ray, up to `PULSE_PIERCE` 3 cells.
  A Glitch on the ray takes the burst × `PULSE_GLITCH` 1.6 and stops it. Below `PULSE_MIN` it fizzles (no damage, soft tick).
  After a release (or fizzle) charging can't start for `PULSE_RECOVER_S` **0.3 s**: held fire waits, then charges again.
  Net: ~0.8× Focus sustained, 1.5× reach, front-loaded (a full burst kills a tier-0 Glitch, 1.2 hp, at Beam 0).
- Feel: the core's glow brightens with charge; a bright line flashes 0.12 s on release; break hitstop rules unchanged.
  Sound: one soft release thump (sine/triangle only, measured offline: peak ≤ −28 dBFS, < 1 % energy > 2 kHz; add to ceilings).
- Touch: the aim stick held = charge, released = fire (same as the mouse). Reduced motion: no glow pulse, flash kept short.
- **Smoke:** a full charge at Beam 0 breaks 2 Hearth rock cells in a row (1.2 vs 0.55 each), at Beam 2 exactly 3 (the pierce cap);
  a 0.1 s tap does nothing; 10 s of held fire on a rock line breaks 0.7–0.9× the cells Focus does; the burst stops at the first Glitch;
  Pulse is never unlocked by Wide; mode cycle Focus → Wide → Pulse → Focus. Then re-run the Q-011 probes with `MODE=pulse`.

## S-18 — Code split before new systems (audit 29 code health) (D-048)
`render.js` is 540 lines and `game.js` 484; Pulse, Beacons and Spires all add to both. Behaviour must not change.
- Glitch update/spawn/loot (`game.js` ≈329–430) → `src/glitch.js`; its inline numbers (cap, interval, aggro 560, tiers,
  knockback, heal 45/s) → `config.js` as `GLITCH_*`. Minimap + HUD drawing → `src/hud.js` (~110 lines out of `render.js`).
- Drop dead code (`oreWithin` went in audit 34): the unused `mat` in `onCellBroken`, `integrity: 100`, ROCK/DENSE `fill`/`edge` overridden by rings.
- Scanner desc and `RESEARCH_HINT` build "12 cells"/"55 cells" from `SCAN_RADIUS`/`LUMEN_D`. One ore-glyph type set, shared.
- **Verify:** smoke green with no check changed except imports; S-5 determinism check (same seed + script → same spawns) passes;
  a 60 s scripted Surge run gives identical `stats` before and after (log both in `09`). Left in Debt: buy-logic dedupe, smoke split.

