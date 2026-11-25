# 09 — Implementation Log, part 14

Continues `09-Implementation-Log-13.md` (part 13 neared the 8 KB cap at session 99). Newest at the bottom; read the tail only.

## Session 100 — Build: S-48b Kiln flare vents, M10 done (v1.5.40, D-132)
- `src/vent.js` (sites, cycle, shove, draw), `overheat()` exported from `heat.js`, hooks in `game.js` / `render.js`,
  `VENT_*` in config. `tests/vent.cjs` (7 checks: sites over 4 seeds, terrain hash, shove Drift = Surge with no
  integrity / cargo change, +0.4 heat and overheat, 2.6 cells untouched, 2 of 126 sites stepped, nothing saved, draw).
- Observed: first draw cost failed `bigworld.cjs` (d 100 drew 2.2–2.3× d 30; stash proved 1.00× before): many
  shadow-blurred hexes in view. One unblurred path for idle vents → 1.00×. `new Game` 256 under ×4: 75 / 83 / 125 ms.
- Screenshots (tell, flare) viewed: the idle hex reads warm white against the Kiln's dark; the flare disc is a soft
  2.5-cell ring, clearly a zone, not a Glitch or an Anomaly.
- Slip noted again (as in B-086): the browser check first used 16 px cells; `CELL` is 32.
- Smoke 475/475 (+7: `vent.cjs`).

## Session 101 — Build: debt, one shared test server (v1.5.41, D-133)
- `tests/serve.cjs`: `createServer` / `serve` / `runStandalone`. The pasted server + runner left 11 test files,
  `smoke.cjs` and `tools/perf.cjs` (−~210 lines). New `docs.cjs` check bans `http.createServer` outside it; proved
  failing with the old `vent.cjs` restored, passing after.
- Observed: the copies had drifted (some lacked `decodeURIComponent`, the root guard, or `.json` / `.svg` types); the
  shared one has all, plus a 404 for directories. Ran each file alone: all pass (heat / undertow / vent `--browser`).
- Smoke 476/476 (+1: the pasted-server guard).
