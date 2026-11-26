# 04 — Roadmap, part 5: M16–M18 (owner's Echo / hunter ask first, D-181)

Continues `04-Roadmap-3.md` (M10–M15). Order fixed by D-181: one milestone closes its loop before the next starts.
VERSION: M16 → 1.11, M17 → 1.12, M18 → 1.13. Debt lives in `04-Roadmap-4.md`.

## M16 — Echo minds (D-181, `07-Build-Specs-19.md`) → v1.11
- **S-69** Echo orders Mine / Defend / Auto (Auto: threat → Defend, 2 s hold → Mine); worth-first ore, soonest-threat first.
- **S-70** Echo upgrades in Research (● 165): Focus (mine dps), Volley (fire rate), Tether (reach); format 25.
- **S-71** `echobot --orders` gate: Auto ≥ 0.9 × Mine's haul, ≤ 1.1 × Defend's damage; Echo share ≤ 35 %. **M16 done.**
- Cut (D-181): an Attack order, a second Echo (Q-039), levels past 2, a learning Auto, an Echo off its leash.

## M17 — Hunters (D-182, `07-Build-Specs-20.md`) → v1.12
- **S-72** `src/flow.js` shared BFS field (Echo moves onto it) + the Tracer: follows you through tunnels, both modes.
- **S-73** The Pincer pair: lead down the field, flank by bounded A* to where you are heading.
- **S-74** `huntrun.mjs` gate: Drift / Surge cost 0.8–1.25, Tracers reach where Glitches give up, perf `hunt` ≤ 1.1×. **M17 done.**
- Cut (D-182): per-enemy A* each frame, Glitches on the field (Q-038), Surge-only hunters, a third kind, saved hunters.

## M18 — Feats: the world remembers (D-180, `07-Build-Specs-18.md`) → v1.13
- **S-66** Feats: six goals derived from the world (4 in a 160 world), `stats.kinds` / `stats.rifts` (next format), Nexus tab list, ending row.
- **S-67** `tools/featrun.mjs`: tune `FEAT_CHART` / `FEAT_RIFTS`; gate Drift / Surge 0.8–1.25.
- **S-68** The Nexus lights one hexagon vertex per feat done.
- Cut (D-180): per-mode feats, feats that pay, a Feats tab, lifetime feats, more than 6. Q-032 no, Q-036 leave.
