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

## Session 56 — Build: S-23 Spire Wake (v0.4.60, #61)
- `src/wake.js` (D-086) + hooks: `glitch.js` (Wake target, core contact, `makeGlitch`, spawns pause), `game.js`
  (`dropYield`, death fails, load sets `wakeBlock`), `spire.js` (Surge facets inert, clock mask, ring), `main.js` toasts + hint.
- First probe: a god-mode core idle at (0, 3) lost every Wake in ~22 s even at max: the 3×3 core blocks the beam to the
  far lanes. A guard that stands between the core and the nearest Glitch holds 10/10 at mid and max. Put in the bot.
- `surgebot --route=spire` Surge (12 seeds): Wake held 12/12 at every build; fails 3 of 15 at start, 0 at mid/max;
  primed → relit 0.7/0.9 min (spec: ≤ 30 % at mid, 45–90 s). Bot aim is perfect, so Q-017 asks Design 57 to play it.
- Tests: `tests/wake.cjs` (5 node + 2 browser checks). Moved to Drift: facet.cjs's Surge solve (now: Surge toggles
  nothing), B-044's check (re-proved: fails with the fix removed), spirefeed's 320 Surge facet check reads the drawn mask.
- Viewed `wake-1280x800.png` / `wake-320x568.png`: ring, lanes, hint read well; lit clock facets are faint (same draw as
  the puzzle). Smoke 254/254.

## Session 57 — Design: the Wake for a person (v0.4.61, #62)
- New probe `tools/wakeprobe.mjs` (D-087): `perfect` / `human` / `still` guards, no god mode, 3 tries per seed.
- **B-048 (open, S-31):** `surgebot` start build spent 2083 of 2401 Wake frames > 5 cells from the core (retreating to
  heal) and held anyway: Wake Glitches despawn past `GLITCH_DESPAWN_PX` from the player core. So S-23's bot table
  over-reported start (12/12 held); mid/max guards stayed in the interior and are fine.
- Tunes tried on a scratch copy (reverted): guard cells 0; tier −1; tier −1 + waves 1.2 / 1.0 s. Picked tier −1 (S-31).
- Playtest (Playwright 1280×800, mid, idle in the interior, viewed): 9 s in, charge 80, core 56/160 hp, 4 Glitches;
  the one lit clock facet is hard to see next to the orange ring (→ S-31 orange clock); lanes beyond the light are dark.
- Specs: S-31 (fix + tune, before S-24), S-24 note (`DARK_ALPHA` to config), S-32 Spitter, S-33 weather. Q-017 → D-087.
