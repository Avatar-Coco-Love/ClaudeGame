# 09 — Implementation Log, part 25

Continues part 24 (`09-Implementation-Log-24.md`, near the 8 KB cap). Newest at the bottom; read the tail only.

## Session 178 — Build: S-77b2 the Decoy holds without touching, from the Nexus Lure level (v1.12.119, D-218, D-220)
- `hunter.js`: a hunter with `e.lure` set never touches. `NEXUS_UPGRADES` gains Lure (▲ `LURE_COST` 30, max 1);
  `refillDecoys` (decoy.js) fills the stock on buying it and as each item banks; Craft row + `craftDecoy` + `DECOY_COST`
  gone; S-65 rings add a peach hexagon. Format 28: Lure 1 if the save held a Decoy (stock or placed), else 0.
- Lair refund (B-113) now returns a Decoy to the stock. `huntrun --decoy`: Design 177's measure flags dropped; the
  floor is pooled per mode; `tracer.cjs` gates it.
- First cut refilled only when cargo emptied: gate FAIL (saving 29.7 / 46.2 %, ratio 0.643; the bot mines on its Relay
  pad, cargo seldom hits 0). Refill per banked item: PASS, Drift 62.5 % / Surge 57.4 %, ratio 1.089, pooled cost with
  Decoys 4.6 % / 5.2 % — the same numbers as D-218's `--fixate --price=level` (D-220).
- Proved the no-touch checks fail on the old touch rule (stashed the `!e.lure`). A test stub Decoy without `hold: null`
  is spent on the first frame (NaN clock); stubs now carry it.
- Screenshot (360 × 640, Nexus tab): the Lure row sits under Lens, ▲30, fits; viewed.
- Smoke 750/750.

## Session 179 — Audit: B-116 arc key, `SAVE_FORMAT - n` banned, 09 archive (v1.12.120, D-221)
- No subagent tool: sweep in-session, newest code first (`decoy.js` S-77b2, `feats.js`, `hunter.js` contact, `boss.js`
  refund). Edge cases: a Decoy refunded or spent mid-lure releases its hunters before the contact check; death / mode
  switch keep Decoys. No new gameplay bug. Drift: `decoy.js` header still said "end of every deposit" (D-220); fixed.
- Debt two audits carried first (D-144). **B-116 (fixed):** the thumb arc's re-layout key ignored the bank panel, so a
  taller panel never moved the arc. Measured 390 × 844: the top slots sit at y 539–595, x 285–382; a panel to y 572
  and x 312 covers one. `arcKey` adds the panel's hidden-row count; the new `thumbarc.cjs` check FAILs on the old key.
- Build 175 debt: `echoorder` / `relay` / `echolevels` built "old" saves as `SAVE_FORMAT - 1` (format 27, not the
  10 / 15 / 24 their comments meant); now found by their step. `saveformat.cjs` bans the pattern (FAILs on the old three).
- D-215…D-220 vs code: match (D-220 supersedes D-218's refill wording). Workflow review: D-221.
- `09` sessions 169–173 archived word for word (`archive/2026-11-28-09-sessions-169-173.md`).
- Pitfall: a "baseline" smoke started before editing reads the edited tree; it is no baseline. Run it after.
- Smoke 751/751. Screenshot (390 × 844, Surge, stand-in tall panel): the arc sits clear below it; viewed.

## Session 180 — Build: S-67 feats probe (v1.12.121, D-222)
- `tools/featrun.mjs` (exports surgebot's `search`): tries logged. Radiance max, 8 seeds: 256 full 20.5–26.6 %,
  Spires-only 12.3–14.4 %; 160 full 33.2–42.5 %, Spires-only 30.3–38.6 % (overlap: one seed's full route is below its
  own Spires-only route, the order differs). Radiance 0: 256 full min 18.4 %, 160 still overlaps. 24 seeds (256): full
  min 20.5 %, Spires-only max 14.4 %, median × 1.3 16.7 %. Chosen: 256 = 0.20, 160 = 0.40 (D-222).
- Gate runs in ~1 s (A* with the reach-radius heuristic); prestarted in `gates.cjs` SMOKE. Rift runner check in
  `lens.cjs` parses the `--call` lines (no new gate time).
- No visual change (a number in the Nexus tab list); no screenshot. Smoke 754/754 (a first run failed 2 VERSION checks: bumped mid-run, the session 179 pitfall again).
## Session 181 — Build: S-68 the Nexus wears its feats (v1.13.122, D-223; M18 done)
- Dots read `featsSeen`, not `feats(game)`: the Charted share scans 65 k cells, too dear per frame. Same answer, since
  `checkFeats` runs after every feat-finishing event and fills the set at load.
- Spec said a 160 world uses vertices "1, 2, 4, 5"; FEATS order gives 1, 2, 3, 5 (0-based). Followed the rule (D-223).
- Screenshot (all six, 4 structures): dots sit on the outer (Lure) ring's corners, readable, not noisy. Checks in
  `nexusview.cjs` (5 new). Smoke 759/759.
## Session 182 — Design: M19 picked, the Feint specced (v1.13.123, D-224, D-225)
- Play-test: `huntrun --seeds=3 --minutes=5 --no-echo --v`. Deep: beam kills 21 / 33 hunters (Drift), 27 / 35 (Surge);
  hunters come down the field into the beam. Pooled Drift 21.9 % / Surge 19.1 %, ratio 1.142; Drift ceiling FAIL in
  Deep and Kiln at 3 seeds (no verdict, < 8 seeds; more data for Q-046). Reach: Tracers 95 %, ghost Glitch 34 %.
- Screenshot (`TRACER_SHOT`, a Tracer in a 1-wide shaft): readable; viewed. No gameplay code.
- Picked "reads your beam" (D-224): S-78a…d in `07-Build-Specs-23.md`; it takes the Deep's second slot (D-225). Q-047.
- `05` neared 8 KB: v1.11.99…v1.11.106 archived word for word (`archive/changelog-v1.11.99-v1.11.106.md`). New `06` part 34.

## Session 183 — Build: S-78a the Feint (v1.13.124, D-226)
- `feint.js` (read, tell, dash, draw); `hunter.js` calls it once while it walks the field. From the Deep out the 2nd slot
  is a Feint while a Tracer lives (`slotKind`). New stream `rng.feint` (side, only when both are open).
- Ice cyan failed `colours.cjs` (feint / Pincer ΔE 17, deuteranopia): the new check bit. Violet `150, 0, 255` clears ≥ 36.
- Steering the dash in (`TRACER_STEER`) reached full speed only after the dash: the velocity is set at once (D-226).
- `feint.cjs` (7 node + 1 browser): tell 0.167 s then |vy| 250 (speed 114), 1-wide tunnel 0 dashes and killed,
  cooldown re-read at 1.62 s, sides vary over 10 seeds, Drift = Surge path. `huntrun` counts a Feint as a Tracer for reach.
- Screenshot (`FEINT_SHOT`, the Deep): violet diamond, white chevron above it; readable, a little dim. Smoke 768/768.
