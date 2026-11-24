# 09 — Implementation Log, part 7

Continues `09-Implementation-Log-6.md` (split at the 8 KB cap, session 55). Newest at the bottom; read the tail only.

## Session 55 — Build: S-30 Surge bot runner (v0.4.59, #60)
- `tools/surgebot.mjs` (D-085): A* / Dijkstra by dig time, path follower that digs the next cell, aims at the nearest
  Glitch within 160 px, heals at the Nexus under 35 %. Routes `mine`, `rim`, `hug`, `spire` (hold 40 s). Exports
  `runBot` + `summarize`; `tests/surgebot.cjs` (in smoke) runs spire + mine × 2 seeds × 1 min × both modes in ~0.6 s.
- Full table (12 seeds, 20 min cap, `node tools/surgebot.mjs`; 47 s wall), med/p90:
  - mine ◆/min — start 32.2 drift / 32.8 surge; mid 38.6 / 41.9; max 37.4 / 41.9. Deaths/min 0 everywhere; kills 1.9–2.6/min.
  - spire min to primed — start 4.3/5.1 drift, 8.2/11.4 surge (deaths 1/2); mid 2.4/3.0 both; max 2.1 / 1.9.
    12/12 primed in every row, holds survived 100 %; stuck 0, skipped 0, capped 0.
  - rim / hug (mid surge): 0 banked, kills 0/1.2 per min: the Nexus cap (1 Glitch) and walls make them worthless.
- Observed: today's natural Surge spawns barely touch a mid build (0 deaths, Spire hold included). So S-23's Wake
  waves must bring the threat themselves; the bot's `spire` hold is the baseline to beat. Design 52's `spireloop`
  (straight-line, ignores Glitches) said 4.5 min mid; the A* bot is ~2× faster and fights, 0 deaths vs 15.
- Bugs found while building (bot only): goal keys reused a stale predicate when widening the prism search
  (3 seeds stopped at fed 54–75); fixed by keying the far search apart.
- Docs: changelog v0.2.48–v0.2.53 archived word for word; built S-30 text deleted from `07-…-4`; Q-007 updated.
