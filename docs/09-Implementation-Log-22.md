# 09 — Implementation Log, part 22

Part 21 holds sessions 154–157 (150–153 archived in audit 159). Newest at the bottom; read the tail only.

## Session 158 — Build: S-73b, the Echo on the shared field + Pincer pips (v1.11.99, D-198)
- `echo.js`: own BFS removed; `fieldAt` wraps flow.js's with the 24-step cap; the clock ticks from the Echo only with no
  hunters alive. `pincer.js`: white pip in the cached dot sprite (lead filled r 3, flank 1.5 px ring at r × 0.5).
- Checks: `pincer.cjs` (Echo + pair: same `game.flow`, no Echo field, ≤ 1 build a frame; fails on the old code, which
  had `echo.field`); browser: pip pixels read from the sprites (lead 255, flank ring 251, hollow 160);
  `colours.cjs`: pip white vs Deep / Shoal / Kiln edges + Prism, ≥ 25 under 4 visions (fails without `PINCER_PIP`).
  `echo.cjs`, `echoorder.cjs` unchanged and passing.
- Screenshot viewed (pair in the Deep cross, dense magenta rock): both pips read at a glance; the flank's ring sits
  inside its hollow, the lead's dot is solid. The rose-on-magenta problem from Design 157 is gone.

## Session 159 — Audit: hunters' perf with a Pincer pair, `02` cap check, 09 archive (v1.11.100, D-199)
- No subagent tool: sweeps in-session, newest code first (`flow.js`, `hunter.js`, `pincer.js`, `echo.js` S-72…S-73b).
  Edge cases: death clears hunters; ending clears; mode switch keeps them; fading ones can't be beamed / warded; a pair
  killed on one frame (Arc) skips the dead mate. No game bug found.
- Perf (audit 154 leftover): new `perf.cjs` run `pack` (hunt + a Pincer pair kept out, natural pairs off in
  deep / hunt). 4× CPU, 12 s: deep 27.2 ms mean, hunt 29.4, pack 29.0; medians hunt / deep and pack / deep 1.00×;
  field build ≤ 0.9 ms, 24 A* searches ≤ 50 nodes, none capped.
- Watch: with `hunt.off` and hunters alive (tests only) nothing ticks the field clock (D-198 kept the order rule).
- D-193…D-198 vs code: match (D-193's ≤ 0.6 ms build now reads 0.8–0.9 ms; logged in `04-…-4`).
- Workflow review: `02` hit 8 KB a third time (8074 bytes) → 7 KB check in `docs.cjs` (FAILs on the old `02`,
  D-199); 14 system lines moved word for word to `08-…-2`. Too much: per-build `02` lines; too little: nothing new.
- `09` sessions 150–153 archived word for word (`archive/2026-11-27-09-sessions-150-153.md`).

## Session 160 — Build: S-74a, the Hunters gate's measure + B-107 (v1.11.101, D-200)
- `tools/huntrun.mjs`: biomefoe's pad + Relay setup in Deep / Shoal / Kiln, creature / weather / Anomalies off, hunters
  on vs off, 8 seeds × 10 min, ~80 s all rings. Per hunter it records how it ended (met / killed / stall / off / parted)
  and flies a ghost Glitch from each Tracer spawn at the frozen core.
- First run at `max`: 75 % of hunters beamed down before contact, costs ≤ 0 (Surge +loot). Moved to `mid` (D-200).
  `mid`, 8 seeds: Drift cost −0.3 / +0.5 / +2.7 %, Surge +11.3 / −2.3 / −4.8 % (Deep / Shoal / Kiln) → cost FAIL.
  Reach: Tracers 87 % of 333 that met or gave up; ghost Glitch 40 % (open dig rooms); where the ghost gives up,
  Tracers 94 % of 199 → PASS. Pincers end mostly "parted" (mate beamed, the other flees).
- **B-107** (found by the gate's Shoal Surge run): a Surge death from a hunter's touch cleared `game.hunters` mid-loop;
  the next index was undefined and `updateHunters` threw. In the browser the throw skips `requestAnimationFrame`, so the
  game froze. Fix: return when the list is empty after `touch` (B-007's Glitch guard). `tracer.cjs` check fails on
  the old code (stashed: "reading 'flash'"), passes now.
- Smoke: `tracer.cjs` awaits `huntrun.mjs --rings=deep` (prestarted in `gates.cjs`, ~20 s) and checks the reach line.
- `05` v1.9.76–v1.9.81 archived word for word (`archive/changelog-v1.9.76-v1.9.81.md`); `06` part 30 started.

## Session 161 — Build: S-74b1, hunter cost levers + measure + Echo row (v1.11.102, D-201)
- Levers: Drift touch takes `TRACER_TAKE` = 24 ◆-worth (`biteWorth`, ORE_WORTH, richest first); flee at
  `TRACER_FLEE_MUL` 1.5 × speed; Surge kill loot `HUNTER_LOOT_SHARDS` 0 / `HUNTER_PRISM_CHANCE` 0 (draw kept, D-025).
- `huntrun.mjs`: natural Glitches off (`--glitches=on` restores); now Drift-off = Surge-off haul exactly. Echo row
  (Auto, hunters on; `--no-echo` in smoke). Tries (8 seeds, Drift / Surge cost %, Deep / Shoal / Kiln):
  base −0.3/+0.5/+2.7 vs +11/−2/−5 · take 12 + no ◆: −3/+1.5/+2.9 vs +11/−10/−8 · Glitches off: −3/+1.5/+2.9 vs
  −9/+10/+46 · take 24 + flee 1.5 + no ▲: **+5.7/+7.0/+5.9 vs −5.8/+12/+52** · same at 20 min: Deep +10.8 vs +1.4,
  Shoal +11.5 vs +21.5. Echo row: Defend share 5–7 % (Design 152 saw 0), costs −15…−28 % (it mines).
- Observed: per-seed haul swings ±25 % (route luck); Surge cost is the hull vs ring, not hunter numbers: Deep (tier 2,
  14 dmg, 160 hp) ~0 retreats; Kiln heat + 26 dmg forces long Nexus heal trips (+52 %); Shoal and Kiln share tier 3.
  No hunter lever fixes all three rings at once → cost still FAIL; Q-043 for Design 162. Reach still PASS (92 %).
- Tests: `tracer.cjs` theft by worth + flee speed, Surge no loot; `pincer.cjs` 24 worth each (both FAIL on old code).
