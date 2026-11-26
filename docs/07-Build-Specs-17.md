# 07 — Build Specs, part 17: M15 The Nexus reaches out (D-175)

Plan in D-175 (Design 137). One slice per PR (D-063), each usable end to end (D-139). VERSION: M15 → 1.10.
**Why:** a 256 world holds ~4.4–5.0k ▲ (expected yield, 4 seeds) and everything buyable costs 379 ▲ (+ ~250 in crafting
caps); Lumen ~530 vs 140. Every sink is one-time, so a late player banks Prisms that buy nothing (`09` session 137).
M15 adds a **recurring** ▲ sink in the Prism layer (Nexus Development, D-009) that is also a play choice.

## S-63 — Lens: call a rift (Nexus Development) (M15)
**Save:** `nexusLevels.lens` (0 / 1) → format 24 (upgrade step: 0; `saveformat.cjs`, never pin the number).
- **Row:** `NEXUS_UPGRADES` gets `{ id: 'lens', name: 'Lens', desc: 'Call a rift where you stand', max: 1, cost ▲ 40 }`,
  every world size (rifts exist in 160 too). Buying it is the only unlock; nothing else in any layer calls a rift.
- **Call:** new action `call` (`KEY_ACTIONS`, default `KeyC`, rebindable, hidden until the Lens is built, as `echoOrder`);
  touch: a ✧ button beside ◎ under the same rule. Pressing it anywhere outside the Nexus ring spends `RIFT_CALL_COST`
  ▲ 30 from the bank and opens a rift now with S-57a's rules (3 × 3 pocket 8–12 cells out, in the core's ring,
  `RIFT_ORE`, `RIFT_BONUS`, 45 s, reverts unmined, unsaved, chimes, chevron, minimap dot).
- **Refused, nothing spent** (toast says why): a rift is open; a weather event, Wake, ending or awake boss is on (the
  natural rift's own rules); `RIFT_CALL_CD` 90 s since the last call; < 30 ▲ banked; no site found; inside the Nexus ring.
- **Schedule:** a called rift draws its site from its own stream (`rng['rift-call']`, D-025), never `rng['rift']`, so the
  natural schedule and sites stay as they were. It closes at t0 + 45 s (`open.called`); a natural rift that falls due
  while it is open is skipped (as during weather). Same in Drift and Surge (one face, D-152).
- **Economy check:** the most ▲ a pocket holds is 6 ▲ cells × 1.5 × 2 ≈ 18 ▲ (Deep, Shoal, Kiln), so a call nets
  about −12 ▲ for the ring's other ore (Hearth ~12 ●, Veil ~12 ◆ + 6 ●, Deep 6 ●, Shoal 6 ≈, Kiln 6 ⬟). Never a ▲ profit.
- Smoke: the row (both sizes) and its price; key / button hidden before, shown after; a call charges 30 and opens a
  pocket in the core's ring; each refusal charges nothing; the natural schedule's sites are identical with and without
  calls (same seed); a called rift closes at 45 s; Drift = Surge. Old save loads `lens` 0. One screenshot (phone, 360 ×
  640 and 640 × 360: the ✧ button ≥ 44 px, no overlap with ◎ ⟂ ♪ ≡).

## S-64 — Lens gate: calls don't replace the world (M15)
**Save:** none.
- `tools/eventrun.mjs --call` (or a new tool if `eventrun` passes ~600 lines): the S-57a bot at max build, 10 min,
  16 seeds (`GATE_SEEDS` rule, D-155), both modes, rings Deep / Shoal / Kiln, two policies: **mine** (plain mining)
  and **call** (call on cooldown, mine the pocket, else mine). Report ◆ / ▲ / biome ore per min and ▲ spent.
- **Gate (PASS):** call / mine total ore value per min ≤ 1.25 (a call is a choice, not the new way to mine), call
  policy net ▲ < 0 in every ring, Drift / Surge call ratio in 0.8–1.25 (D-158's band). Value weights: ◆ 1, ▲ 3,
  ● 4, ≈ / ⬟ 12 (D-156's).
- On FAIL: tune `RIFT_CALL_COST` / `RIFT_CALL_CD` only (log each try in `09`); the pocket rules stay S-57a's.
- Gate in `gates.cjs` beside the smoke (D-166). Log the numbers in `09`, the verdict as a D-xxx.

## S-65 — The Nexus grows on screen (M15)
**Save:** none (drawn from levels already saved).
- The Nexus core draws one thin outer ring per Nexus Development structure built (Radiance any level, Chart any level,
  Lens): concentric hexagons at +0.5 cell steps, the structure's own hue (Radiance cyan, Chart mint, Lens violet-white
  `RIFT_RGB`), strokes only (D-160: no new blur). A Lens on cooldown shows its ring dim, bright when ready.
- Buying a Nexus row plays the upgrade flash at the Nexus, not at the core (S-4 feel).
- Smoke: ring count = structures built (0 → 3), cooldown dims the Lens ring; no shadowBlur in the new draw
  (`drawcost`-style stub). Perf: `perf.cjs` home run unchanged within noise. One screenshot (all three built).
- **M15 done** after S-65 if S-64 passed: Q-032 / Q-035 re-read in the next Design session.
