# 07 — Build Specs, part 18: M18 Feats — the world remembers (D-180)

Plan in D-180 (Design 142). **Renumbered M18 (→ v1.13) by D-181.** One slice per PR (D-063), each usable end to end (D-139).
**Why:** after M15 a maxed late player has calls to spend ▲ on, but nothing says what is left to *do* in this world
(Q-032's "out of goals", Q-035). Feats are a short fixed list of world goals that pay nothing: no layer unlocks
anything twice, no mode earns more. At most **6** (one per vertex of the Nexus hexagon, S-68); the list never grows
without a design D-xxx.

## The six feats (`FEATS` in `config.js`, order fixed)
| id | Name | Earned when | Worlds |
|----|------|-------------|--------|
| `lairs` | Quiet lairs | every boss `down` (`game.bosses.list`) | 256 |
| `vaults` | Open vaults | every vault's cache cell broken (derived from the saved map) | all |
| `kinds` | Three lights | an Anomaly of every kind taken at least once (`stats.kinds`, bitmask) | all |
| `chart` | Charted | explored cells ≥ `FEAT_CHART` (provisional 0.35) of the cells inside the border | all |
| `over` | Overdriven | one Core Matrix stat at `topLevel` past its base max | 256 |
| `rifts` | Rift runner | `FEAT_RIFTS` 5 rift pockets emptied (all 9 cells mined before close; natural or called) | all |
A 160 world has 4 (`profile.overdrive` / bosses decide it). Every feat is the same in Drift and Surge (one face, D-152;
bosses have their two forms, D-158). A feat never unlocks, pays or speeds anything (pillar 4, D-009's layers untouched).

## S-66a / S-66b — built (Build 175 / 176, D-216 / D-217)
`feats.js` `feats(game)` + Nexus tab list (`stats.kinds` / `stats.rifts`, format 27); `checkFeats` toast + note once, ending row.

## S-67 — Feats probe: each one reachable, none trivial (M18; refreshed Design 177, D-219) — built Build 180 (D-222: `chart` per size)
**Save:** none.
- **Rifts, measured Design 177:** `eventrun --call` now prints "pockets emptied" (`stats.rifts`, 16 seeds × 10 min):
  Drift / Surge Deep 1.7 / 2.4, Shoal 1.7 / 1.6, Kiln 2.0 / 2.3 a run → `FEAT_RIFTS` 5 takes 21–31 min (≥ 15 ✓, keep 5).
  Pooled Drift / Surge 5.4 / 6.3 = 0.86 (in band; Deep alone 0.71, so the gate is pooled, D-202's way). S-67 turns it
  into a check in `lens.cjs` (same run, no new gate time): pooled ratio 0.8–1.25 and every ring ≥ 1 pocket a run.
- **Chart:** `tools/featrun.mjs`: the core flies to every vault, Spire and lair once, nearest first (`moveBody` +
  `world.raycast`, mining what blocks it; max build, `god`), 8 seeds (`GATE_SEEDS`), both sizes, one mode (explored
  share is mode-free: no Glitch reveals cells); it reports the explored share at the end and on the bare Spire-only route.
- **Tune** (log each try in `09`): `FEAT_CHART` = the bare route's median share × 1.3, rounded to 5 %, and below the
  full route's lowest seed. **Gate (PASS):** the full route reaches `chart` on every seed, the bare route on none.
  Gate in `gates.cjs` (D-166), its TIME line under 60 s.

## S-68 — The Nexus wears its feats (M18)
**Save:** none (drawn from `feats(game)`).
- The outermost Nexus ring (`nexusview.js` `nexusRings`, the last one; with none built, a hexagon of radius
  `NEXUS_RING_BASE`, drawn only for its dots) lights one vertex per feat
  done: a 3 px dot, white at alpha 0.9, unblurred (D-160), vertex order = `FEATS` order (a 160 world uses 4 of 6:
  `vaults kinds chart rifts` at the vertices 1, 2, 4, 5, leaving the 256-only pair dark slots never drawn).
- A new feat (`featNew`, S-66b) flashes its vertex (reuse `nexusFlash`'s 0.5 s, off with reduced motion). The dots
  turn with their ring (its `t * 0.06` spin), so they sit on the stroke's corners.
- Smoke: dots = feats done (0 → 6), positions on the outer ring's vertices, no shadowBlur in the new draw, the flash
  skipped with reduced motion. One screenshot (all six). **M18 done** after S-68 if S-67 passed (→ v1.13).

## Cut (D-180)
A feats screen of its own (tab), per-mode feats (pillar 2), feats that pay (Q-001: no exclusive rewards), cross-cycle
lifetime feats (New Cycle resets the world; `records` keeps only times), more than 6.
