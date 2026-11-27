# 04 — Roadmap, part 5: M16–M18 (owner's Echo / hunter ask first, D-181)

Continues `04-Roadmap-3.md` (M10–M15). Order fixed by D-181: one milestone closes its loop before the next starts.
VERSION: M16 → 1.11, M17 → 1.12, M18 → 1.13. Debt lives in `04-Roadmap-4.md`.

## M16 — Echo minds (D-181, `07-Build-Specs-19.md`) → v1.11
- ✅ **S-69** (session 145, v1.10.86, D-184) Echo orders Mine / Defend / Auto (Auto: threat → Defend, 2 s hold → Mine); worth-first ore, soonest-threat first.
- ✅ **S-70** (session 146, v1.10.87, D-185) Echo upgrades in Research (● 165): Focus (mine dps), Volley (fire rate), Tether (reach); format 25.
- ✅ **S-71a** (session 148, v1.10.89, D-187) `echobot --orders` measure, 48 seeds: all lines pass but added gain Drift / Surge 1.26 / 1.27.
- ✅ **S-71b** (session 151, v1.11.92, D-189) Q-040 settled, gate in smoke (`echoorder.cjs`): PASS on 48 seeds. **M16 done.**
- Cut (D-181): an Attack order, a second Echo (Q-039 no, D-186), levels past 2, a learning Auto, an Echo off its leash.

## M17 — Hunters (D-182, `07-Build-Specs-20.md`) → v1.12
- ✅ **S-72** `src/flow.js` BFS field + the Tracer (`game.hunters`): follows you through tunnels, both modes (Build 155, v1.11.96, D-193).
- ✅ **S-73a** The Pincer pair: lead down the field, flank by bounded A* round the lead to where you are heading (Build 156, v1.11.97, D-194).
- ✅ **S-73b** The Echo moves onto `coreField`: one field build shared with the hunters; the Pincer white pip (Build 158, v1.11.99, D-197, D-198).
- **S-74** `huntrun.mjs` gate: Drift / Surge cost 0.8–1.25, Tracers reach where Glitches give up, perf `hunt` ≤ 1.1×. **M17 done.**
- Cut (D-182): per-enemy A* each frame, Glitches on the field (Q-038), Surge-only hunters, a third kind, saved hunters.

## Owner asks, session 153 (triaged Design 157, D-195…D-197) → v1.12 patches, after S-74, before S-66
- ✅ Map view (v1.11.94, D-191): tap the minimap / N for a 3–4× map, world held; the tap no longer aims.
- **S-75** Thumb arc (`07-…-21`): on touch the actions sit on arcs round the bottom-right grip (measured: today
  610–713 px away on a 390 × 844 phone; natural reach ≈ 275).
- **S-76** Map legend (`07-…-21`): the big map names the marks it drew.
- Pincer white pip: folded into S-73b (D-197).
- **After M18, pick one next enemy tier** by play-test (D-196); leaning "reads your beam" (dodges the line). Also
  weighed: a Nexus-mouth camper, packs that retreat when hurt (both Surge-only today).
- **Decoy** craft: Q-042, after S-74's numbers. Cut (D-196): traps / mines (a second Ward), a push beam, a shield pulse.

## M18 — Feats: the world remembers (D-180, `07-Build-Specs-18.md`) → v1.13
- **S-66** Feats: six goals derived from the world (4 in a 160 world), `stats.kinds` / `stats.rifts` (next format), Nexus tab list, ending row.
- **S-67** `tools/featrun.mjs`: tune `FEAT_CHART` / `FEAT_RIFTS`; gate Drift / Surge 0.8–1.25.
- **S-68** The Nexus lights one hexagon vertex per feat done.
- Cut (D-180): per-mode feats, feats that pay, a Feats tab, lifetime feats, more than 6. Q-032 no, Q-036 leave.
