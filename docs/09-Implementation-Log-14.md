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

## Session 102 — Design: M11 Economy specs S-49…S-52 (v1.5.42, D-134)
- Play-test (Playwright, `?dev`, 256 world, upgrades 4): Ring 90 and Ring 110, 5 s of digging each. Kiln screenshot
  viewed: dark ember / rose rock, the heat hint shows, heat 0.62 after ~5 s; the ore on screen is the same ◆▲● as the
  Deep. 0 page errors.
- Supply (scratch Node probe over `World`, 40 seeds × 256): ROCK + DENSE Shoal ~5470, Kiln ~11270; crystal ~3380,
  prism ~3170, Lumen ~500 cells. Candidate re-types at x/5 noise: Shoal 0.76 → 266 (174–359), Kiln 0.79 → 328
  (211–477, 194 inside d 128). ΔE probe on candidate colours: '#d8fff0' and '#c8a0ff' chosen (≥ 33 vs ring edges).
- Docs: `07-Build-Specs-11.md` (new), `04-Roadmap-3` M11 rewritten (Anchor cut), Q-028 added, D-134. No code.

## Session 103 — Build: S-49 biome ores Tide ≈ / Calx ⬟ (v1.5.43, D-135)
- `T.TIDE` 12 / `T.CALX` 13, `World.biomeOres()`, `KINDS` + `emptyKinds()`, format 19, HUD / title / sheet chips,
  terrain + pickup glyphs (upright waves / pentagon), minimap colours, break / pickup tones, `colours.cjs` shapes.
- Observed: 40-seed counts reproduce the spec exactly (≈ 174/266/359, ⬟ 211/328/477); none in a 160 world.
- B-088 (caught before merge): `anomalySites` only accepted ROCK / DENSE, so a re-typed cell would have moved Shoal /
  Kiln Anomalies and every vent after them. Fixed (D-135); masked terrain + site hashes pinned from the stashed old code
  and matched on all 4 seeds.
- `saveformat.cjs` B-037 check extended to the two new kinds. Screenshot (`ORE_SHOT`) viewed: ≈ reads as two mint
  strokes, ⬟ as a lilac pentagon, both distinct from ◆ ▲ ● and the Shoal edges; chips ≈ 3 ⬟ 2 in the bank row.
- Smoke 483/483 (+7: `ore.cjs`).

## Session 104 — Audit: five-kind phone bank, "continue" rule, 09 archive (v1.5.44, D-136, D-137)
- No subagent tool in this session: sweeps done in-session (correctness on S-49 / vents / heat, touch, docs drift).
- **B-089** (fixed): with ≈ / ⬟ held the phone bank ran under the minimap (portrait 320–412: panel to 315 / 347 vs 212–304)
  and under ◎ ⟂ ◇ (568, 640, 740, 844 landscape). Phones now wrap it 3 + 2 (`html.ores`), the landscape toast moves down
  and, ≤ 700 px, narrows (it first met ⊕ at 568×320). Also found: Large text at 740×360 put any 4-digit bank under ◎
  (pre-S-49), and Large Echo + 3 buff chips sat 0 px from the 320 px minimap. `touch.cjs` B-089 over 6 phones, plain +
  Large: all 6 fail on the old CSS (proved: checkout), pass now. 320×568 and 568×320 shots viewed: two clean rows.
- Correctness read: S-49 kinds flow through `KINDS` everywhere (bank, cargo, save, stats, costs); shatter / aurora stay
  rock / crystal-only by spec. D-131…D-135 match the code. Baseline smoke on `main` 483/483.
- Owner rule recorded: a bare "continue" runs 3 orchestrated PRs (`CLAUDE.md`, `docs/10-Orchestration.md`, D-136).
- `09` sessions 94–98 archived word for word (part 12 removed). New parts: `06-Decisions-20`, `04-Roadmap-4` (Debt).
- B-090 (watch): first full smoke 488/489, `bigworld.cjs` draw ratio 2.08× once; alone 1.02× ×2; rerun 489/489.
- Smoke 489/489 (+6: B-089 phones).
- Follow-up docs PR (v1.5.45, D-138): owner rule, a workflow self-assessment (one-off note in `02`; every Audit, `CLAUDE.md`).

## Session 105 — Build: S-50 Core Matrix Overdrive (v1.5.46, D-139, D-140)
- `over: 2` on all six `UPGRADES`, `OVERDRIVE_COST`, `matrixCost()`, `WORLD_PROFILES[].overdrive`, `Game.topLevel()`;
  `canAfford` / `buy` work over every kind; the sheet adds hollow `.od` pips once a row hits max; saved levels clamp on load.
- Observed: stats at max + 2 match the spec exactly (6.5 dps, 288, 398, 170, 288, 340); the three-price button fits at
  320×568, 360×640 and 640×360 (no overflow, no page scroll; scratch probe). 1000×700 and 320 sheet shots viewed: two
  hollow pips after the 8 / 6 filled ones, `◆120 ≈5 ⬟5` on the button, unmaxed rows unchanged.
- `tests/overdrive.cjs` (6 checks): needs `matrixCost` / `topLevel`, so it fails on the old code.
- Workflow review (D-138 one-off, done by the orchestrator over PRs #101–#112) recorded as D-139: owner rules ride in
  content PRs; a split spec's slices each stay usable. `CLAUDE.md` +1 line, `02` one-off note removed.
- `05` v1.4.23–v1.4.29 archived word for word (`archive/changelog-v1.4.23-v1.4.29.md`, cap).
