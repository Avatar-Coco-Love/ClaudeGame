# 09 — Implementation Log, part 20

Sessions 139–143 archived word for word in audit 150 (`archive/2026-11-26-09-sessions-139-143.md`); part 19 removed. Newest at the bottom; read the tail only.

## Session 144 — Audit: Spire tests pinned (B-101), budget median of 5 (B-096), 09 archive (v1.10.85, D-183)
- No subagent tool: sweeps in-session, newest code first (`nexusview.js` S-65 rings, Lens cost / cooldown vs D-176…
  D-179 and `config.js`: match). No game bug found; D-181 / D-182 are specs, no code yet.
- Debt carried two audits first (D-144): B-096 (`new Game` 154 ms once under load). Profiled in node: world gen is ~all
  of it (noise ×7 + per-cell loop, ~15 ms unthrottled); hoisting getters gave no change (hash of 80 worlds equal,
  reverted). Fix in the check: median of 5 seeds, same bar (alone 76 / 77 / 78 / 92 / 110 ms).
- B-100 repro: `facet.cjs` got its own runner; 6 in parallel × 2 gave 1 FAIL, a different one: **B-101** the relight
  toast read "A dormant Spire (2/5)", a second Spire near Spire 0 in a random world (D-100 said pin). `facet` /
  `spirefeed` / `wake` now use `pinnedNewWorld`; the pin's gap check covers 256 too (78.4 cells both sizes). 12 / 12.
- Docs drift: B-096 was assigned twice (sessions 127, 133; the second is the budget one). `09` sessions 134–138
  archived word for word. Workflow review in D-183.

## Session 145 — Build: S-69 Echo Mine / Defend / Auto (v1.10.86, D-184)
- `echo.js`: `autoPick` every 0.25 s (threat → Defend; 2 s calm → Mine), `echoDoing`, labels Mine / Defend /
  Auto · x; Defend ranks closing bolts, then distance / speed; Mine scores `ORE_WORTH` / (cells + 2). Ring tell.
- `echoorder.cjs` +8 checks (Auto in 0.25 s and back ~2 s, edge swing 10 s = 1 switch, bolt before a nearer Glitch,
  ▲ 3 cells over ◆ 1, Drift Mote, new Echo = Auto, save `auto`, page chip). Proved on old code: hold 0.25 s gives 9
  switches and fails; nearest-first picks the ◆ / the Glitch. Own runner now (`runStandalone`).
- Screenshot: chip "Auto · Defend", a thin ring round the Echo, Glitch held 90 px off. Observed: a Glitch held 10 s
  gives up (D-017 `stall`) and Auto goes back to Mine; the test resets `stall`.

## Session 146 — Build: S-70 Echo upgrades Focus / Volley / Tether (v1.10.87, D-185)
- New `echolevels.js` (`echoStat`, buy, `validEchoLevels`, row defs); `echo.js` reads its four numbers through it.
  Save format 25 (step 24 → 25: all 0). Research tab: three rows under the Echo once owned.
- `echolevels.cjs` (12 checks): costs 20 / 35, 165 total, 3rd buy refused, no Matrix stat moves; dps 0.5 → 0.9 ×;
  shots in 10 s 12 → 22; a ◆ 6 cells out and a Glitch 160 px out only from Tether 1; saves; tab + phone 320 Large text.
  Fails on old code (no module). Observed: a held Glitch gives up at 6 s (D-017), so the Volley count swaps in a fresh one.
- Screenshot: Research tab, Focus MAX with 2 pips, Volley "0.6 s → 0.45 s" ●35, Tether row below (scrolls).
- **B-102 fixed:** `lens.cjs` built its "old save" as `SAVE_FORMAT - 1`, so format 25 skipped the Lens step (smoke
  669/670). It now finds the step that adds `nexus.lens`. Other `SAVE_FORMAT - 1` users test fields every format has.
