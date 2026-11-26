# 09 — Implementation Log, part 20

Continues part 19 (it neared the 8 KB cap at session 139). Newest at the bottom; read the tail only.

## Session 140 — Build: S-64 Lens gate, call cooldown 150 s (v1.9.81, D-178)
- `tools/eventrun.mjs --call`: mine vs call-on-cooldown, Deep / Shoal / Kiln, 16 seeds × 10 min (~95 s on 4 cores).
  `rift.force` 'calls' (tools only): no natural rifts, Lens calls still open. In `gates.cjs` SMOKE; `lens.cjs` checks it
  and that 'calls' opens no natural rift. The gate check fails on the old 90 s (try 1 below).
- Tuning (D-178): CD 90 Kiln 1.38 / 1.29 FAIL; 120 Kiln 1.30 / 1.24 FAIL; 150 PASS (max Kiln Surge 1.226, ▲ call −
  mine −35…−75 / run, Drift / Surge 0.97–1.05). The bot makes 2–3.4 calls / 10 min at 150 s (bank-limited early).
- Observed: calls trade ◆ for ▲ / ● / biome ore (Kiln ⬟ 1.4 → 2.9 / min Surge), so the value ratio is mostly the
  ≈ / ⬟ weight 12. Kiln Surge 1.226 is close to the cap: a later pocket buff must re-run the gate.

## Session 141 — Build: S-65 Nexus rings, M15 done (v1.10.82, D-179)
- `src/nexusview.js` (`nexusRings`, `drawNexusRings`), called from `drawNexus` after the blurred rings; `game.nexusFlash`.
- `tests/nexusview.cjs` (in smoke): 0 → 3 rings in order, half a cell apart, own hues; a 2nd Radiance level adds none;
  Lens dim on cooldown, bright after; flash at the Nexus never the core, none with reduced motion; browser: +3 strokes,
  no new blurred stroke. Screenshot viewed (all three built): rings read clearly at 1280×800, Lens outermost.
- Observed: the hexagons rotate slowly in alternate directions, pulse with the Nexus; inside the deposit ring (176 px).
- No bugs found.
