# 09 — Implementation Log, part 19

Continues part 18 (sessions 129–133 archived word for word in audit 139: `archive/2026-11-26-09-sessions-129-133.md`, part 18 removed). Newest at the bottom; read the tail only.

## Session 134 — Audit: touch test 38 s faster (B-097), wait probe, 09 archive (v1.8.75, D-172)
- No subagent tool: sweeps in-session, newest code first (`gyre.js` / `mote.js` S-61b: wake / sleep resets, rim
  cooldown in both modes, tagged swarm leash and loot, `game.bossAwake` reset in `updateBosses`; D-166…D-171 match
  `config.js` and the gate list). No new game bug found.
- Debt two audits carried (`touch.cjs` 106 s), measured per check first: 8 × 7.3 s in the toast loop. **B-097**
  (fixed): its camera wait (< 2 px from the core) could never pass (look-ahead 36 px), so every size burned the 5 s
  timeout. Now waits on the look-ahead spot and the check needs `settled` (false on the old code at every size).
  `touch` 108 → 70 s; full smoke 502 s (was ~530).
- `tools/waitprobe.cjs`: the other 12 swallowed waits never time out (7 files run under it).
- Workflow review (D-172): too little: no signal for a silent wait timeout. Phone sweep / perf: none (Debt).
- `09` sessions 124–128 archived word for word (`archive/2026-11-26-09-sessions-124-128.md`, part 17 removed).
  Smoke 626/626.

## Session 135 — Build: S-62 boss marks, sting, ending line; M14 done (v1.9.76, D-173)
- `drawBossMarks`: Chart L2 adds unseen lairs at alpha 0.35 (`g.chartLairs`); `audio.bossSting` on wake (`B.woke`,
  unsaved) and the first Drift plate; `endingSummary` `bosses` / `bossN` (null without lairs). New `bossmarks.cjs`.
- Tools: `biomefoe.mjs --boss=on`, `bossrun.mjs --build=mid` (advice only; smoke gates unchanged).
- Lairs on, 16 seeds: Kiln 0.878 / 0.897 PASS (gap 0.019); Shoal 0.913 / 0.881 PASS (gap 0.032). No Debt.
- Mid build: Crucible Drift sum 9.00 min / Surge 12.59, ratio 1.399, deaths med 1 (boss 7, glitch 1), burns 137;
  Gyre 9.29 / 11.94, ratio 1.285, deaths med 1 (boss 7, glitch 1), swarms 33, rims 143. All 32 runs down. Q-034: no.
- New checks fail on the old code (stash `src/`: 3 FAIL). Screenshots: the faint Crucible octagon reads at the
  minimap's edge without competing with seen marks; the ending card at 568 × 320 fits with the Bosses row. Sting
  -31.4 dBFS, 0 % > 2 kHz.
- **B-098** (fixed, test only): smoke run 1 failed `S-59 tide locks … chevrons` (630/631): the page ignores `?seed`,
  new worlds are random and 16 / 400 seeds have no tide lock. `tidelock.cjs` now rerolls the world (≤ 5, accepts the
  confirm). Reroll path checked (seed changes); 3 + 1 standalone runs PASS.

## Session 136 — Build (Debt): awake Gyre perf run, its glow made cheap (v1.9.77, D-174)
- `tools/perf.cjs`: new `gyre` run (Surge, god, core held 4 cells north of the Gyre core, swarm clock zeroed: awake,
  rim tell on, ≤ 2 swarms / 12 motes, ~22 dashes); `ONLY` takes a comma list. Before, CPU × 4: desktop gyre / shoal
  1.29–1.36×, phone 1.18×. Probe splits (scratch copy): Drift asleep 43.2 ms vs the same spot with the boss down
  36.6; update 0.5 → 0.8 ms awake; shadowBlur off 39.3; dashes off 43.5 (no gain). So: the 4-cell blur box.
- Fix: blur clipped to the core ring (0.4 cell + pad), rim tell as `GYRE_RIM_GLOW` strokes, key plate unblurred.
  After: desktop 1.04 / 1.20× (two runs; headless noise ±3 ms), phone 1.13×. Screenshot of the awake Gyre: the rim
  still reads as a mint outline. New `gyre.cjs` check fails on the old code (2 blurred strokeRects, no box).

## Session 137 — Design: M15 picked, S-63…S-65 specced (v1.9.78, D-175)
- Economy probe (node, 4 seeds, expected yield): 256 ore ◆ 5.5–6.3k, ▲ 4.4–5.0k, ● 500–560, ≈ 280–410, ⬟ 270–280;
  all sinks ◆ 4.4k, ▲ 379, ● 140, ≈ 108, ⬟ 108 (+ crafting caps). ▲ 8–13× past its sinks, ● ~3.8×; biome ore is not.
- Play-test (Playwright, `?dev` maxAll, 900 ▲): Nexus tab = two MAX rows at 1280 × 800, 360 × 640, 640 × 360 (rows
  82 / 97 / 57 px; room for one more row on the phone sheet). Kiln screenshot: ▲ cells everywhere.
- Sites (4 seeds): Spires 64–73 cells out, lairs 90–115; at max Thrusters 398 px/s a lair is ~9 s straight, so a Gate
  was cut (D-175). Pocket ▲ ≤ ~18, so a ▲ 30 call nets −12.
- Specs in `07-Build-Specs-17.md`; Q-035 (feats), Q-036 (Lumen surplus) opened. No code change; no bugs found.

## Session 138 — Build: S-63 Lens + rift call (v1.9.79, D-176)
- `rift.js`: `callRift` / `callBlock` / `callCooldown`; `openRift(game, called)` draws from `rng['rift-call']`;
  `updateRift` closes a called rift at t0 + 45 and skips a natural one due meanwhile. Row `lens` (▲ 40), key C, ✧ button, format 24.
- New `tests/lens.cjs` (8 checks): 55 calls over 12 seeds × 5 rings charge 30 ▲ with ring ore; 10 refusals spend
  nothing; 4 natural rifts identical with 4 calls between them (fails with calls on `rng['rift-site']`: proved).
- Layout probe (Pixel 7 touch, Surge, every button): 360 × 640, 640 × 360, 568 × 320, 740 × 360, 844 × 390, 1280 × 800
  no overlap; first try put ✧ first in the landscape row, over the bank panel at 568 / 740 (moved under the row).
  `touch.cjs` / `hud.cjs` now include ✧. Screenshots 360 × 640 and 640 × 360 viewed: ✧ violet, reads apart from ◇.
- HUD key now includes the call state, else ✧ stayed hidden after the Lens (first browser run failed). No bugs logged.

## Session 139 — Audit: Lens button ❖ (B-099), phone sweep, 09 archive (v1.9.80, D-177)
- No subagent tool: sweeps in-session, newest code first (`rift.js` Lens: refusals, called / natural clocks, reload,
  death, hitstop rule match their headers; D-171…D-176 numbers match `config.js`). No logic bug found.
- B-099: ✧ was both the Lens button and the Lodestone Anomaly chip, same violet, in the same corner on a phone (seen in
  the 320 × 568 Large screenshot). Now ❖ (glyph sheet compared at 44 px: ⊛ ⌖ thin, ◈ reads as ◇). New `lens.cjs`
  check: no HUD button glyph is an Anomaly chip glyph; fails on the old `index.html`.
- Phone sweep (scratch probe, not kept): 6 sizes × Normal / Large, Surge, all buttons, 3 chips, 5 banks: no overlap,
  nothing off screen, ≥ 44 px. `touch.cjs` B-034 loop + 320 × 568 / 412 × 915 portrait (39 PASS alone). Its first
  portrait run failed: ● 8888 at 320 overlaps the minimap by 13 px; a 256 world holds ~430–545 ● (3 seeds), so the
  portrait case uses a 256 world's realistic top (◆ ▲ 8888, ● ≈ ⬟ 888), which fits.
- `09` sessions 129–133 archived word for word (`archive/2026-11-26-09-sessions-129-133.md`, part 18 removed); `05`
  v1.7.59–65 archived. Debt lines of audits 109–134 moved to the done archive; the slow-file items closed (D-177).
- Workflow review: too much copying of the same Debt lines audit to audit (the slow files rode four audits); too
  little: phone sweeps (two audits skipped). Change (D-177): a line carried three audits is fixed or closed.
