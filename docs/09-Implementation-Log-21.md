# 09 — Implementation Log, part 21

Continues part 20 (it neared the 8 KB cap at session 147). Newest at the bottom; read the tail only.

## Session 147 — Design: Echo play-test, S-71 measure refined, Q-039 closed (v1.10.88, D-186)
- Probe (scratch, deleted): surgebot `deep`, mid, Echo order × levels 0 / 2 (all rows), gain = banked + carried.
  16 seeds × 5 min, Surge: no Echo 37.1, Mine 44.8 / 48.2, Defend 36.5 / 36.8, Auto 44.9 / 47.8 gain/min (L0 / L2);
  mean damage/min 19.4, 15.1 / 16.3, 12.2 / 13.1, 12.5 / 10.9. Drift (8 seeds): none 30.2, Auto 39.0 / 42.6.
- Observed: ore credit gives the Echo 55–77 % (the core's beam is in rock while it tunnels); the added gain is 17–29 %.
  Defend costs no gain vs no Echo. Auto switches ~6 / min in Surge, defends ~14 % of the time, ~0.4 / min in Drift.
  8-seed damage medians are noise (17.2 vs 10.4 on two seed sets), hence means over 16 in S-71.
- Field BFS (node): bound 24 0.03 ms, 32 0.08 ms, all open 0.1 ms. Screenshot (`echoorder` shot): Auto · Defend chip,
  1 px ring legible, Glitch held off. No bug found.
- Specs: S-71 rewritten (share = added gain, means, run list); S-72 keeps the Echo's own BFS, S-73 moves it; Tracers in
  `beamFoes` make Auto defend in Drift too; S-74 reports an Auto-Echo row. D-186; Q-039 closed (no).
- **B-103 fixed:** smoke 669 / 670, `lens.cjs` page check: "No rock here to open a rift in". Its New World used a
  random seed and moved the core 14 cells east; that spot has no rift site on 5 / 300 seeds (1.7 %). Now
  `pinnedNewWorld` (D-100). Repro rule (D-183): 6 parallel × 2 runs, 12 / 12 pass. Second random-world test bug after
  B-101, so a check is queued for audit 149 (`04-…-4` Debt).

## Session 148 — Build: S-71a `echobot --orders` measure; gate split off (v1.10.89, D-187, Q-040)
- `tools/echobot.mjs --orders [--seeds=48] [--base=1000]`: 10 rows (Surge none / Mine / Defend / Auto, Drift none /
  Auto × L0 / L2), means of gain and damage / min, Auto switches / min, the S-71 lines and a verdict (≥ 48 seeds).
- 48 seeds, hold 2 s: Surge none 36.8 · Mine 43.7 / 47.6 · Defend 36.4 / 36.8 · Auto 42.9 / 46.5 gain/min; damage
  19.3, 15.9 / 16.3, 13.6 / 11.2, 11.3 / 7.5; Drift none 30.2, Auto 38.0 / 42.6. Switches Surge 6.6 / 7.6, Drift 0.2.
  FAIL only: added gain Drift / Surge 1.26 / 1.27 (band ≤ 1.25).
- Tuning tries (log, D-186): hold 3 s — 16 seeds PASS, 48 FAIL (1.46 / 1.33); 4 s — FAIL on all three 16-seed sets;
  1 s / 1.5 s — 1.33 / 1.33 (48). Kept 2 s. Focus not tried (moves both modes alike).
- Noise: 16-seed sets (1001 / 2001 / 3001, hold 3 s) gave Auto / Defend damage 0.75 / 1.25 / 0.80 — hence 48 seeds.
- Shipped as S-71a (measure + a 1-seed run check in `echoorder.cjs`); S-71b (gate in smoke) waits on Q-040. No bug.

## Session 149 — Bug fix (owner report): B-104 glow-layer edge lines (v1.10.90; Audit moved to 150)
- **B-104** (owner, Android screenshot): while moving near a Relay, faint lines flickered on the right / bottom edges of
  the `drawLightGlow` union box (relay ± e.r); gone when standing still. Cause: the quarter-res `r.glowLayer` only grows
  and only `lw × lh` was cleared, so texels past the source rect kept glow from earlier, larger boxes; the unsmoothed
  blit (B-084) samples ~1 texel past the rect on mobile GPUs, and only right / bottom had stale neighbours. While the
  camera moves, lw / lh shift by ±1 per frame → flicker. Not reproducible headless (Chromium samples inside the rect).
- Fix (`light.js`): clear the whole layer every frame; size it to at least lw + 1 × lh + 1 so a clear texel always sits
  past the rect. Unsmoothed blit kept. `r.glowSize` = [lw, lh] for tests.
- Check (`glow.cjs`): big box, then a pan that clips the pool at the view's top-left; every layer texel past lw × lh must
  be clear and a margin must exist. Old code: FAIL, 2349 stale texels (lw 51, layer 300 × 150). Screenshot viewed: pool
  glow round and soft, no edge lines.

## Session 150 — Audit: every test's New World pinned + a check (v1.10.91, D-188), 09 archive
- No subagent tool: sweeps in-session, newest code first. `light.js` B-104 fix: the whole-layer clear is bounded by the
  quarter-res layer (grows only), fine. D-184…D-187 vs `config.js` (`ECHO_ORDERS`, `ECHO_AUTO_HOLD` 2): match.
- **Queued check (B-101, B-103):** `tests/pinworld.cjs` — `newWorld(page, tap, r)` pins Math.random for the click;
  `run()` in smoke flags raw `#new-world` clicks with no nearby pin / `any-seed:` note. Old tree: 55 hits (FAIL);
  42 files converted mechanically, `spire.cjs` `pinnedNewWorld` now wraps it (same 0.42 seed).
- B-100 closed (unseen since the Spire pin, two audits). `09` sessions 139–143 archived word for word
  (`archive/2026-11-26-09-sessions-139-143.md`), part 19 removed. Workflow review in D-188. No game bug found.

## Session 151 — Build: S-71b, Q-040 settled, the Echo gate in smoke (v1.11.92, D-189; M16 done)
- Probe of Q-040's lean (Defend mines while its shot reloads, idle once ready; 48 seeds, hold 2 s): Defend gain
  36.4 / 36.8 → 37.1 / 37.1, damage 13.3 / 8.9; added gain Drift / Surge L0 1.329, L2 1.229. Not ≤ 1.25: reverted.
- D-189: band on Auto gain Drift / Surge (0.890 / 0.915); added-gain ratio keeps a 1.5 ceiling. Gate on the shipped
  code, 48 seeds × 5 min: PASS (Auto 0.98 × Mine, 0.83 / 0.67 × Defend damage, share 21 / 29 %), ~4.3 min.
- `echoorder.cjs` awaits `gates.cjs` run('echobot.mjs', ['--orders']) (in SMOKE, prestarted beside the smoke). No bug.

## Session 152 — Design: Echo play-test, S-72 build-ready (v1.11.93, D-190)
- Play-test (Playwright, `?dev`, seed 0.42): Drift Deep d 60, Echo Auto mined a Lumen vein beside the core, stayed
  54–90 px off, no blinks. Surge d 60, 30 s digging: 7 Glitches gave up (D-017) in the rock, 0 contacts, Auto 0 switches.
  Screenshots viewed: Echo diamond + beam read clearly against the Deep palette.
- Specs checked against code: `perf.cjs` has no `deep` run (S-72 adds it), `enemies` is emptied in Drift (hunters get
  their own list), `world.breaks` is a counter (any break rebuilds), rng streams are a fixed list in `game.js`.
  S-72 rewritten build-ready; S-73 names `game.hunters` / `dev.pincer()`; S-74 reports Auto's Defend share. Q-041 opened. No bug.
