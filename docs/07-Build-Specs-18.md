# 07 — Build Specs, part 18: M16 Feats — the world remembers (D-180)

Plan in D-180 (Design 142). **Renumbered M18 (→ v1.13) by D-181**: the owner's Echo / hunter ask goes first. One slice per PR (D-063), each usable end to end (D-139). VERSION: M16 → 1.11.
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

## S-66a — Feats: derive, count, list (M18; split by Design 167, D-207)
**Save:** `stats.kinds` (0) and `stats.rifts` (0) → the next format (26 today: S-70 took 25; upgrade step both 0,
`saveformat.cjs`, never pin the number). Everything else is derived from saved state, so a feat can't desync.
- `src/feats.js`: `feats(game)` → `[{ id, name, rule, done, have, need }]` for this world's size (pure). Names in code
  today: `game.bosses.list[i].down`, `game.topLevel(u)`, `game.stats` (saved whole), `rift.js` `closeRift`.
- `anomaly.js` take sets `stats.kinds |= bit(kind)`; `closeRift` adds 1 to `stats.rifts` when every cell of *that*
  pocket was mined (count this close's cells; the tools' `r.mined` is a running total and stays).
- Nexus tab, below the rows: a **Feats n / N** heading and one line per feat (✓ done, else ·; no Anomaly chip glyph,
  D-177; name, rule, progress like "Charted 21 % / 35 %", "Rift runner 2 / 5"). Text only; all six from the start
  (Q-037's leaning). Readable at 320 × 568 Large text (the sheet scrolls; the rows above show unscrolled at 360 × 640).
- Smoke: each rule on a stubbed game (both sizes; a 160 world lists 4); kinds / rifts counters (8 of 9 mined does
  not count); Drift = Surge for every feat; old save loads 0 / 0. One screenshot (Nexus tab, 360 × 640, two lit).

## S-66b — Feats: the moment and the ending (M18)
**Save:** none. `checkFeats(game)` runs on deposit, cache break, boss down, Anomaly take, rift close, upgrade; a feat
newly done toasts "Feat: Quiet lairs (2 / 4)" and plays the deposit arpeggio's top note once. `game.featsSeen`
(unsaved) is filled on load, so a reload never re-toasts. Ending card: "Feats n / N" after "Bosses".
- Smoke: toast once, none after a reload or a mode switch; the ending row; audio: the note under the ceiling.

## S-67 — Feats probe: each one reachable, none trivial (M16)
**Save:** none.
- `tools/featrun.mjs`: a bot route that visits every Spire, vault and lair once (spirefind / vaultfind sites, max build,
  `god`), 8 seeds (`GATE_SEEDS`), both sizes, both modes; it reports the explored share at the end and on the bare
  Spire route (Spires only), and per-ring rift empties per 10 min of call-on-cooldown (`eventrun --call`'s bot).
- **Tune** (log each try in `09`): `FEAT_CHART` = the bare route's median share × 1.3, rounded to 5 %, and below the
  full route's lowest seed; `FEAT_RIFTS` so the call bot needs ≥ 15 min. **Gate (PASS):** Drift / Surge time to the
  `rifts` feat in 0.8–1.25 (D-158's band); the full route reaches `chart` on every seed. Gate in `gates.cjs` (D-166).

## S-68 — The Nexus wears its feats (M16)
**Save:** none (drawn from `feats(game)`).
- The outermost Nexus ring (`nexusview.js`; the deposit hexagon when no structure is built) lights one vertex per feat
  done: a 3 px dot, white at alpha 0.9, unblurred (D-160), vertex order = `FEATS` order (a 160 world uses 4 of 6:
  `vaults kinds chart rifts` at the vertices 1, 2, 4, 5, leaving the 256-only pair dark slots never drawn).
- A new feat flashes its vertex (reuse `nexusFlash`'s 0.5 s, off with reduced motion).
- Smoke: dots = feats done (0 → 6), positions on the outer ring's vertices, no shadowBlur in the new draw, the flash
  skipped with reduced motion. One screenshot (all six). **M16 done** after S-68 if S-67 passed.

## Cut (D-180)
A feats screen of its own (tab), per-mode feats (pillar 2), feats that pay (Q-001: no exclusive rewards), cross-cycle
lifetime feats (New Cycle resets the world; `records` keeps only times), more than 6.
