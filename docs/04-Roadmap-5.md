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
- ✅ **S-74a** `huntrun.mjs`: the measure; reach gate in smoke (Tracers 94 % where a Glitch gives up); B-107 fixed (Build 160, v1.11.101, D-200).
- ✅ **S-74b1** cost levers (Drift 24 worth + flee 1.5×, Surge no loot), Glitches off in the measure, Echo row (Defend 5–7 %) (Build 161, v1.11.102, D-201).
- ✅ **S-74b2a** the measure: B-108 closed (bot accounting + seed noise), hull debt (trip incl. the way back), pooled gate + floor (Build 163, v1.11.104, D-203).
- ✅ **S-74b2b1** damage tier cap 1, take 30, Surge kills 2 ◆: pooled 0.830 in band, Deep floor FAIL (Build 165, v1.11.106, D-205).
- ✅ **S-74b2b2** a killed thief keeps its best 15 %, Drift ceiling 18 % per ring: pooled 1.011, floor + ceiling ok, full gate in smoke (Build 166, v1.12.107, D-206). **M17 done.**
- Cut (D-182): per-enemy A* each frame, Glitches on the field (Q-038), Surge-only hunters, a third kind, saved hunters.

## Owner asks, session 153 (triaged Design 157, D-195…D-197) → v1.12 patches, after S-74, before S-66a
- ✅ Map view (v1.11.94, D-191): tap the minimap / N for a 3–4× map, world held; the tap no longer aims.
- ✅ **S-75** Thumb arc: on touch the actions sit on arcs round the bottom-right grip, clear of ⊕ / hint / minimap;
  farthest 251 px on 390 × 844 (was 610–713) (Build 168, v1.12.109, D-209).
- ✅ **S-76** Map legend: the big map names the kinds it drew, in their glyphs; columns beside it in landscape, wrapped under it in portrait (Build 170, v1.12.111, D-211).
- **S-77a** Decoy craft + lure, **S-77b** `huntrun --decoy` gate (`07-…-22`, Q-042 → yes, D-208).
- Pincer white pip: folded into S-73b (D-197).
- **After M18, pick one next enemy tier** by play-test (D-196); leaning "reads your beam" (dodges the line). Also
  weighed: a Nexus-mouth camper, packs that retreat when hurt (both Surge-only today).
- Decoy: settled yes (D-208), S-77 above. Cut (D-196): traps / mines (a second Ward), a push beam, a shield pulse.

## M18 — Feats: the world remembers (D-180, `07-Build-Specs-18.md`) → v1.13
- **S-66a** Feats: six goals derived from the world (4 in a 160 world), `stats.kinds` / `stats.rifts` (format 26), Nexus tab list.
- **S-66b** A feat done toasts once (no re-toast on reload); ending row (split, D-207).
- **S-67** `tools/featrun.mjs`: tune `FEAT_CHART` / `FEAT_RIFTS`; gate Drift / Surge 0.8–1.25.
- **S-68** The Nexus lights one hexagon vertex per feat done.
- Cut (D-180): per-mode feats, feats that pay, a Feats tab, lifetime feats, more than 6. Q-032 no, Q-036 leave.
