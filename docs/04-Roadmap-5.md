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
- **S-73b** The Echo moves onto `coreField` (D-186): one field build shared with the hunters.
- **S-74** `huntrun.mjs` gate: Drift / Surge cost 0.8–1.25, Tracers reach where Glitches give up, perf `hunt` ≤ 1.1×. **M17 done.**
- Cut (D-182): per-enemy A* each frame, Glitches on the field (Q-038), Surge-only hunters, a third kind, saved hunters.

## Owner feedback, session 153 (for Design 157 to spec or cut)
- ✅ Map view (v1.11.94, D-191): tap the minimap / N for a 3–4× map, world held; the tap no longer aims.
- **HUD layout review:** measure thumb reach on phones (portrait + landscape); candidates: actions (◎ ⟂ ◇ ❖ ✦) in an
  arc by the right thumb, menu / mute out of the play area, a minimap legend in the map view.
- **Smarter enemies, in tiers:** beeliners (Glitch) < flow-field followers (Tracer, S-72) < coordinators (Pincer, S-73);
  candidates after M17: an enemy that reads your beam (dodges the line), one that waits at the Nexus mouth, packs that retreat when hurt.
- **New ways to attack and defend:** candidates to weigh against D-182 / D-153 (Wards): a decoy light, a shield pulse,
  a beam mode that pushes, traps / mines placed like Wards. Each must work in Drift and Surge alike (pillar).

## M18 — Feats: the world remembers (D-180, `07-Build-Specs-18.md`) → v1.13
- **S-66** Feats: six goals derived from the world (4 in a 160 world), `stats.kinds` / `stats.rifts` (next format), Nexus tab list, ending row.
- **S-67** `tools/featrun.mjs`: tune `FEAT_CHART` / `FEAT_RIFTS`; gate Drift / Surge 0.8–1.25.
- **S-68** The Nexus lights one hexagon vertex per feat done.
- Cut (D-180): per-mode feats, feats that pay, a Feats tab, lifetime feats, more than 6. Q-032 no, Q-036 leave.
