# 09 — Implementation Log, part 8

Continues `09-Implementation-Log.md` (sessions 59–63 archived in audit 69: `archive/2026-11-24-09-sessions-59-63.md`). Newest at the bottom; read the tail only.

## Session 64 — Audit: skip keys, card fit, records, B-053…B-059 (v1.0.3, #69)
- Four subagents (correctness, perf, touch, code health + docs drift); each finding re-run here.
- **B-053 → fixed:** audit 59's comment swallowed `ctx.arc(); ctx.stroke()`: the Wake dial's faint ring never drew.
  `tests/comments.cjs` (D-094) flags it; it then caught a 4th swallow in this very session (`focus()` in `openEnding`).
- **B-054 → fixed:** the hint showed under the ending card (B-008's class); the card scrolled 4–30 px at 568×320.
- **B-055 → fixed:** a held Enter (repeat) clicked the focused Continue. The browser check's synthetic repeat doesn't
  reproduce it on the old code (untrusted events don't activate buttons): fixed by reading, logged as unproven.
- **B-056 → fixed:** the skip key also pressed a focused HUD button (♪ toggled). Check failed on the old code.
- **B-057/B-058/B-059 → fixed:** junk `records` crashed the ending / showed "best -1m -30s"; an ended v13 world lost its
  record; dev relight-all mid-Wake relit a Spire twice. Node checks in `cycle.cjs`.
- Perf (×4): overview 16.7/33.4 ms frames, play after Continue = home baseline. Touch: no blockers. Moved to config:
  ending line share + margin, `PLACE_BURST`, `WAKE_FRAME_PX` in cells. Debt logged. `09` 54–58 archived. Smoke 283/283.

## Session 64 wrap-up — CLAUDE.md context rules (v1.0.4, #70)
- Owner asked why the conversation hit ~475k tokens after 10 PRs. Cause and rules in D-095; CLAUDE.md "Context
  discipline" gained the 3-PR cap, the orchestration brief and the cheap-verification rule. Docs only; counter stays 64.

## Session 65 — Build: S-32 Spitter (v1.0.5, #71)
- `src/spitter.js` (behaviour, bolts, sprites), hooks in glitch/beam/game/render, `audio.spit()`, `tests/spitter.cjs`
  (5 checks: 26.8 % share over 3×400 Deep spawns, 0 at tier 1; open-field hit for 8; rock stops a bolt and silences a
  blocked Spitter; the beam pops a bolt in 0.23 s; Wake Glitches plain, Drift clears bolts). D-096 has the bot table.
- Observed: a hard stop at 200 px overshot to 150 px (velocity lerp) → ease + back-off. Screenshot: diamonds aim at
  the core, orange bolts read through the dark.

## Session 66 — Build: S-33 Weather (v1.1.6, #72)
- `src/weather.js` (schedule, storm / aurora effects, dark tint, aurora shimmer), hooks in glitch / game / light / render,
  toasts in main.js, `surgebot --weather=on|off`, `tests/weather.cjs` (6 checks: same schedule both modes; Wake /
  ending skip and cut; reload resumes, mode switch swaps the face; storm spawn ×0.75; aurora odds and light radius;
  mine haul storm ÷ aurora 0.92). D-097 has the tuning table; Q-019 opened (shallow storms pay ~0).
- Observed: spec numbers overshot the +25 % cap (aurora +46 %, deep storm ~+50 %); first tints lit the whole dark
  teal / violet. Screenshots after toning down: dark stays dark, violet reads, ore outlines shimmer. M6 ✅ → v1.1.

## Session 67 — Design: weather play-test, M7 specced (v1.1.7, #73)
- `surgebot --weather=on|off` (mine + deep, start + mid, both modes, 8 seeds × 6 min): every boost ≤ +25 %; the
  shallow storm adds +3–7 % haul and ~1.5× kills. Q-019 settled no (D-098). Screenshots (`?dev`, teleport 40): aurora and
  storm tints read, map stays dark, the toast shows. Seen: deep Surge hauls more than deep Drift (18 vs 12/min) in
  this short run; Q-007's long-run parity numbers still stand, no change.
- M7 specs S-35…S-37 in `07-Build-Specs-5.md` (Anomalies: sites, Overclock, deposit end, `SAVE_FORMAT` 15; then
  Lodestone + Ballast bot-tuned; then map / ping / sound / touch). Q-020 opened (timer as well as deposit?).

## Session 68 — Build: S-35 Anomalies v1 (v1.1.8, #74)
- `src/anomaly.js`: seed-only sites, take on touch once open, `buffMul` in `game.stat()`, ends at a full deposit,
  300 s recharge, hexagram + take ring, warmer beam core; chip `#buffs` + toast; `SAVE_FORMAT` 15 (D-099).
- `tests/anomaly.cjs` (7 checks, 20 seeds = 320 sites all valid) + 2 browser checks (chip + toast; deposit ends it);
  `anomaly()` added to the audio one-shot bounds. Screenshot viewed: chip, toast, hexagram in a carved room, warm beam.
- **B-060 (→ fixed in audit 69, below):** smoke's S-27 browser check ("first sight toasts 1/5" + minimap) failed in 2 of 3 full
  runs on this branch (a second Spire already seen), 0 of 44 standalone `browserChecks` runs; main passed once. Random
  New World seed → likely a seed where the teleport sees two Spires. Its detail now prints seed, Spires, core cell.

## Session 69 — Audit: B-060 root-caused, docs split (v1.1.9, #75)
- **B-060 → fixed, two causes.** (1) `nearSpire` waited 4 s wall clock for the Spire toast, which queues behind the
  2.6 s "Entering the Deep" milestone timed by game dt (clamped 0.05 s): with 6× CPU throttle 3 of 4 runs read
  "Entering the Deep"; no pages leak between checks (0 contexts open there), so it is runner load. Now a `stats.time`
  wait. (2) Node probe of the approach over 3000 random seeds: 18 (0.6 %) saw a second Spire (≥ 12-cell gap where
  sectors meet, e.g. seed 1712963517). New World is now pinned (seed 901943132, gap 78) + a node check on the gap.
- Guard that fails on the old code: the 320 px page runs `slowFrames(130 ms)`; old wait 2/2 FAIL, new 3/3 + 2/2 at 6× pass.
- Docs: `09` sessions 59–63 archived word for word; `02` per-system detail → new `08-Systems-Reference.md`; `04` done
  Tooling + M2–M5 → `archive/2026-11-24-04-done-m2-m5.md`. D-099…D-096 spot-checked against config/code: match.
- Scope note: run as one agent (no parallel sweeps available); perf, touch and code-health sweeps carried to audit 74.
