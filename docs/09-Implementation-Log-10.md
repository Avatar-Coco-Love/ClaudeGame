# 09 — Implementation Log, part 10

Continues `09-Implementation-Log-9.md` (part 9 neared the 8 KB cap at session 77). Newest at the bottom; read the tail only.

## Session 78 — Build: S-41 adaptive graphics (v1.2.18, #85)
- `src/quality.js` (`Quality`: rolling p90 over 3 s of played frames, down > 24 ms, up < 18 ms for 10 s, bounce backoff
  ×2 ≤ 160 s; stalls > 1 s and paused frames reset). `renderer.setQuality(level)`: L1/L2 DPR 1 (canvas resized), L2
  draws every other particle (`q.rq`, fixed per particle), no-glow pickup sprites (`pn-`), unsmoothed light blit.
  Settings → Graphics cycles Auto / High / Low (`settings.graphics`, `clean()` → Auto). `window.__lumen.quality`.
- Measured: JS work per frame ~1 ms headless while the gap p90 was 33 ms (800×600 DSF 2), so the gap is sampled
  (D-109). Headless gaps: 1280×800 DSF 1 and 390×844 DSF 3 hold 16.7 ms; 800×600 DSF 2 p90 33 → 16.7 at L2.
- `tools/perf.cjs QUALITY=0|2` (Auto off), loot, 4× CPU, DSF 1: L0 mean 86.9 ms / p95 133 → L2 64.5 / 100;
  **L2 ÷ L0 = 0.74** (DPR saving not included at DSF 1).
- `tests/quality.cjs` (node + browser, in smoke): controller steps, p90 not mean, backoff, High/Low fixed; browser: title
  frames never step, slow draw → L1 (canvas 1600 → 800 px) → L2, fast → back up, button cycle saved, High holds under
  slow frames, saved Low / damaged value load, same seed + input at L0 and L2 → same stats / bank / position / enemies.
  Proved: with the sampling call removed, 3 browser checks fail.
- Observed: particles differ in count between runs by design (Math.random, D-025), so the determinism check leaves
  them out. Screenshots viewed: High vs Low at 640×400 DSF 2 (Low pickups plainer but read as ◆ / ▲).

## Session 79 — Audit: damaged-save boot, key labels, Large-text fit, Auto vs a 30 Hz cap (v1.2.19, #86)
- Five sweeps in parallel (bugs, perf ×4, touch at 8 sizes × 2 text sizes, code health, docs drift); each finding re-checked.
- **B-065** (hud.js): S-40 put `// S-40: 12 px floor` before `ctx.textAlign = 'center'`, so "NEXUS" drew left-aligned. 3rd
  swallowed-code case: `comments.cjs` now also flags an assignment after `//` (failed on the old line, no false positives).
- **B-066/B-067** (save.js `saneSave`): a save with no `bank` threw in `showTitle` before the frame loop (black, frozen);
  a bad `explored`/`broken` made Continue throw silently. No int seed / non-base64 map → no save; bank/cargo → whole counts.
- **B-068** (main.js): "Press B", "press Q", "press F" survived S-39; now `keys.K(…)`. `keys.cjs` greps src for any
  `press <Letter>` (failed on main.js:252/275/276).
- **B-069…B-072** (style.css): Large text ≤ 420 px: Matrix button nowrap (was 2 lines at 320) and raised clear of a
  2-line hint; tabs 2 × 2 (CRAFT was 19 px outside at 320 and 381); hint wraps (overflowed at 381); Volume slider 44 px on
  touch; its "100" box min-width. `textsize.cjs` adds 381×800 and a fit check (failed on old CSS). Screenshot 320 viewed.
- **B-073** (quality.js, D-110): constant 33 ms frames (30 Hz cap) stepped Auto to L2 and kept it there. A step down is now
  judged by the next window (must beat 0.85 × its p90) or undone and Auto stops stepping down; DPR ≤ 1 skips L1. Test's
  slow renderer now shrinks its wait with the level (a fixed wait is a cap). 3 new node checks fail on the old controller.
- Perf (×4 loot): chunk blits 15 ms is the top cost (pre-scale fix measured 15 → 2 ms by the sweep; memory risk at DPR 2),
  logged as Debt with corrected drawGrid / paintChunk numbers. Code health: the audit-74 "dead" list was used in-file;
  dropped `export` from 16. Docs: D-026, D-044 stale (D-111), 08 bot routes + `deep`. Q-023 (iPad keyboard rebinding).
- D-xxx check: all 109 compared with code by the drift sweep; mismatches only as above. Archived sessions 69–73 and
  changelog v1.0.0–v1.1.10 word for word.

## Session 80 — Build: S-42 Echo v1, follow + blink + Gather (v1.2.20, #87)
- `src/echo.js` (BFS field 49×49 from the core's cell, line-of-sight shortcut, blink, Gather), Research row `echo` 30 ●,
  `World.breaks` counter, `audio.echoBlink` (in `audio.cjs` ceilings), `dev.echo()`, `drawEcho` before the core. D-112.
- `tests/echo.cjs` (node 10 + browser 2, in smoke): buys at 30 not 29; L-bend follow, 0 blinks; sealed → blink in 0.57 s;
  Shard mined, rock beside untouched; cargo full / Nexus / Ending pause; same seed → same stats; 0.5× beam dps.
  Proved: with euclid-only progress the L-bend check fails (1 blink at the corner).
- `tools/echobot.mjs` (surgebot `mine` + `echo`/`onTick` options), 12 seeds × 10 min, mid: Drift strands 0, lag
  2.77 / p90 2.86 cells, blinks/min 1.00 / p90 1.40, ◆/min 38.6 → 55.8 (×1.45); Surge strands 0, lag 2.81 / 2.87,
  blinks 1.20 / 2.20, ◆/min 42.4 → 58.6 (×1.38). Start build: ×1.12 Drift, ×1.05 Surge. Parity within 10 %.
- Observed: +40 % income at mid build is a big late reward for 30 ●; Design 82 should judge it against the pillars
  (Q-024). Screenshot (1000×700) viewed: the diamond reads below the core, small but clear.
- **B-074** (flaky, not fixed): the S-16 beacon minimap-dot checks failed once in a full smoke (pixel `219,222,195`,
  not `191,248,255`) and passed 4/4 alone and on the next full run; the Echo is not in that test. Logged as Debt.
- Smoke: 392/392 (two full runs green; one run had B-074).

## Session 81 — Build: S-43 Echo orders (v1.2.21, #88)
- `echo.js`: `cycleEchoOrder`, `validOrder`, `orderLabel`, `guard()` (shot dash drawn 0.12 s); `game.echoOrder` saved,
  `SAVE_FORMAT` 16 (15 → 16 adds 'gather'). Key `echoOrder` = R (S-39 list, 11 actions); ◇ `#echo-btn`; `#echo-chip`
  in a `.chips` row with `#buffs`; toast "Echo: Guard". Layout and Wake numbers: D-113.
- `tests/echoorder.cjs` (node 6 + browser 1, in smoke): cycle by intent (none before Research); Guard kills a held
  tier-1 Glitch in 3 shots (1.62 s), Gather leaves it at full hp; rock blocks the shot; a bolt popped, no damage;
  chip labels; save round-trip, format-15 upgrade and a bad value → Gather; browser R / ◇ / chip / toast.
  `touch.cjs` B-034 row and toast checks now include ◇ (4 landscape sizes); `hud.cjs` pointer boxes include ◇.
- Found by `hud.cjs`: ◇ first sat left of ⟂ and the Nexus pointer had no clear spot at 320×568 (20/180 headings);
  moved beside ◎ and `hud.js` now reads `.pair` children. Screenshots viewed: 568×320, 320×568, Guard dash (desktop).
- **B-075** (fixed): `echo.cjs` browser check waited a fixed 700 ms for a 0.5 s blink; failed 1 in 6 on the old code
  too (alpha 0.27 mid fade-in). Now waits for the settled state, ≤ 2 s (the spec's blink bound).
- Smoke: 399/399 (one earlier full run hit B-075 before the fix).
