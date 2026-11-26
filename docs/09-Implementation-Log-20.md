# 09 — Implementation Log, part 20

Continues part 19 (it neared the 8 KB cap at session 139). Newest at the bottom; read the tail only.

## Session 140 — Build: S-64 Lens gate, call cooldown 150 s (v1.9.81, D-178)
- `tools/eventrun.mjs --call`: mine vs call-on-cooldown, Deep / Shoal / Kiln, 16 seeds × 10 min (~95 s on 4 cores).
  `rift.force` 'calls' (tools only): no natural rifts, Lens calls still open. In `gates.cjs` SMOKE; `lens.cjs` checks it
  and that 'calls' opens no natural rift. The gate check fails on the old 90 s (try 1 below).
- Tuning (D-178): CD 90 Kiln 1.38 / 1.29 FAIL; 120 Kiln 1.30 / 1.24 FAIL; 150 PASS (max Kiln Surge 1.226, ▲ call −
  mine −35…−75 / run, Drift / Surge 0.97–1.05). The bot makes 2–3.4 calls / 10 min at 150 s (bank-limited early).
- Observed: calls trade ◆ for ▲ / ● / biome ore (Kiln ⬟ 1.4 → 2.9 / min Surge), so the value ratio is mostly the
  ≈ / ⬟ weight 12. Kiln Surge 1.226 is close to the cap: a later pocket buff must re-run the gate.

## Session 141 — Build: S-65 Nexus rings, M15 done (v1.10.82, D-179)
- `src/nexusview.js` (`nexusRings`, `drawNexusRings`), called from `drawNexus` after the blurred rings; `game.nexusFlash`.
- `tests/nexusview.cjs` (in smoke): 0 → 3 rings in order, half a cell apart, own hues; a 2nd Radiance level adds none;
  Lens dim on cooldown, bright after; flash at the Nexus never the core, none with reduced motion; browser: +3 strokes,
  no new blurred stroke. Screenshot viewed (all three built): rings read clearly at 1280×800, Lens outermost.
- Observed: the hexagons rotate slowly in alternate directions, pulse with the Nexus; inside the deposit ring (176 px).
- No bugs found.

## Session 142 — Design: M16 Feats picked, S-66…S-68 specced (v1.10.83, D-180)
- Play-test (Playwright, `?dev` maxAll + 300 ▲, 256, 1280 × 800): teleport Kiln, mine, C → toast "Rift called — 30 ▲",
  pocket beside the core, bank 270 ▲ after; Kiln heat hint shows; no page errors. Screenshot viewed: ▲ cells crowd
  the Kiln; the ❖ C button reads dim on cooldown next to ◇ R and ◎ F.
- Counts (one seed): 10 vaults, 28 Anomaly sites, 5 Spires, 2 lairs; explored 3 % at the start. `CORE_REVEAL` 230 px
  (~7 cells each side): a Spire + lair route of ~1.5k cells charts roughly a third, so `FEAT_CHART` starts at 0.35 and
  S-67 measures it. Anomaly sites recharge (300 s), so "every site" can't be derived: the feat is every *kind* (3).
- Q-032 / Q-035 / Q-036 closed (D-180); Q-037 opened. Specs `07-Build-Specs-18.md`. No code change; no bugs found.

## Session 143 — Inbox: owner asks for Echo modes / upgrades and smarter enemies (v1.10.84, D-181, D-182)
- Inbox `2026-11-26-owner-feedback-echo-enemies.md` → `archive/`. Read against the code: the Echo has Gather / Guard
  (`echo.js`), picks the nearest ore, fixed numbers; Guard already hits Burrowers / Motes, so "Guard (idle)" in Drift
  was stale wording. Glitches beeline and fade (D-017); Echo and Motes each build their own BFS field.
- **Adopted:** Mine / Defend / Auto (Auto = threat rule + 2 s hold, worth-first ore, soonest threat first; S-69);
  Echo upgrades Focus / Volley / Tether in Research, ● 165 (S-70); an `echobot --orders` gate (S-71). Hunters: one
  shared flow field (`flow.js`), the Tracer (tunnels, trail tell) and the Pincer pair (bounded A* intercept), both
  modes with Surge / Drift faces, a gate (S-72…S-74). Order: M16 Echo, M17 Hunters, Feats → M18 (D-181).
- **Rejected:** Feats first; an Attack order or a second Echo (Q-039); a learning Auto; per-enemy A* each frame;
  reworking Glitches now (no play-test says they feel dumb; Q-038 asks after S-74); Surge-only hunters.
- Q-022 closed (D-181); Q-038 / Q-039 opened. Specs `07-Build-Specs-19.md` / `-20.md`, roadmap `04-Roadmap-5.md`.
  No code change; no bugs found.

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
