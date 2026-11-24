# 07 — Build Specs

Specs ready to build, in **build order: S-18 (this file), then S-15, S-16, S-19 (`07-Build-Specs-2.md`)** (D-048). Written by Design sessions. A Build session takes the top spec, builds it, deletes it here,
and marks the item ✅ in `04`. Numbers here are starting values; they go in `src/config.js`, never inline.
Measured basis (session 3, 40 seeds, see `09`): Shards in a world ≈ 2750◆ (1376 crystal cells × 2), maxing the Core Matrix costs 2482◆.
Prisms in a world ≈ 1470▲; the Core Matrix takes 246▲ and Radiance 113▲. The first Prism is 32 cells out. (S-1…S-14 built in #7–#40.)
M2 basis (session 12, 40 seeds): cells by distance, rock/dense/crystal/prism: d 50–65 1410/666/263/210, d 65–80 1686/997/332/360.
Lumen basis (session 20): ~141● per world (85–225), all at d ≥ 55. Research so far: Scanner 10●, Wide 25● (S-13, D-041). S-14 (Pulse, #40) took 40●, leaving ~66●
for later nodes (D-036). Spare Prisms after Core Matrix + Radiance: ~1100▲ (S-16 spends ≤ 100▲). Focus beam: one ray, `beam` stat 1 + 0.55·lvl dps, `range` 96 + 24·lvl px; hp rock 0.55, dense 2.6 (× ring).

## S-18 — Code split before new systems (audit 29 code health) (D-048)
`render.js` is 540 lines and `game.js` 484; Pulse, Beacons and Spires all add to both. Behaviour must not change.
- Glitch update/spawn/loot (`game.js` ≈329–430) → `src/glitch.js`; its inline numbers (cap, interval, aggro 560, tiers,
  knockback, heal 45/s) → `config.js` as `GLITCH_*`. Minimap + HUD drawing → `src/hud.js` (~110 lines out of `render.js`).
- Drop dead code (`oreWithin` went in audit 34): the unused `mat` in `onCellBroken`, `integrity: 100`, ROCK/DENSE `fill`/`edge` overridden by rings.
- Scanner desc and `RESEARCH_HINT` build "12 cells"/"55 cells" from `SCAN_RADIUS`/`LUMEN_D`. One ore-glyph type set, shared.
- **Verify:** smoke green with no check changed except imports; S-5 determinism check (same seed + script → same spawns) passes;
  a 60 s scripted Surge run gives identical `stats` before and after (log both in `09`). Left in Debt: buy-logic dedupe, smoke split.

