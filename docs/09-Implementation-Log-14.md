# 09 — Implementation Log, part 14

Continues part 13 (sessions 99–103 archived word for word in audit 109: `archive/2026-11-25-09-sessions-99-103.md`, part 13 removed). Newest at the bottom; read the tail only.

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
- Smoke 495/495 (+6: `overdrive.cjs`).

## Session 106 — Build: S-51 Heat Sink (v1.5.47, D-141)
- `src/heatsink.js` (craft / place / pick up / load / draw / minimap), `craft.js` `PLACE_KINDS`, `heat.js` gain × `sinkMul`,
  save format 20 (`craft.sink`, `sinks`), Craft tab row (5-ring worlds), place button `.off` + reason off Kiln floor.
- Observed: 60 s steady fire overheats 6.0 % inside a Sink vs 16.0 % outside (spec 7.4 / 17 ± 2; the 60 s window ends
  mid-cycle). Screenshot (1000×700) viewed: lilac pentagon under the core, dashed 5-cell floor ring, ⬠↑ button.
- B-091 (fixed before merge): the HUD's change key lacked `craft.sink` / on-a-Sink, so the button count went stale; added.
- `tests/heatsink.cjs` (13 checks); the inside-Sink check fails with `HEATSINK_MUL` = 1 (proved).
- `relay.cjs` Craft-tab check now expects the Sink row after the Relay in a 256 world (rows listed exactly, as before).
- Smoke 508/508 (+13: `heatsink.cjs`).
