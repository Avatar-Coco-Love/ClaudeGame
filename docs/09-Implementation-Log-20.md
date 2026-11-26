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

## Session 142 — Design: M16 Feats picked, S-66…S-68 specced (v1.10.83, D-180)
- Play-test (Playwright, `?dev` maxAll + 300 ▲, 256, 1280 × 800): teleport Kiln, mine, C → toast "Rift called — 30 ▲",
  pocket beside the core, bank 270 ▲ after; Kiln heat hint shows; no page errors. Screenshot viewed: ▲ cells crowd
  the Kiln; the ❖ C button reads dim on cooldown next to ◇ R and ◎ F.
- Counts (one seed): 10 vaults, 28 Anomaly sites, 5 Spires, 2 lairs; explored 3 % at the start. `CORE_REVEAL` 230 px
  (~7 cells each side): a Spire + lair route of ~1.5k cells charts roughly a third, so `FEAT_CHART` starts at 0.35 and
  S-67 measures it. Anomaly sites recharge (300 s), so "every site" can't be derived: the feat is every *kind* (3).
- Q-032 / Q-035 / Q-036 closed (D-180); Q-037 opened. Specs `07-Build-Specs-18.md`. No code change; no bugs found.
