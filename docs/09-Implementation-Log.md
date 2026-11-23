# 09 — Implementation Log

Older entries (v0.1 to session 2): `archive/2026-11-23-09-sessions-0-2.md`.

## 2026-11-23 — Session 3 (v0.1.5): Design — play-test + economy measurement
- **Play-test:** Playwright, desktop 1280×800 and Pixel 7, deviceScaleFactor 1. A straight-line bot (6 legs × 14 s, deposit each) banked
  only 12◆ in ~90 s: it ran 63 cells out through open caves and mined 11 cells on leg one. Players must hunt crystals; straight tunnelling barely pays.
- **Measured (40 seeds, `World` in Node):** world supply ≈ 2750◆ / 1470▲. Full Core Matrix = 2482◆ / 246▲. Prisms first appear 32 cells out (median 32.2).
  Crystal share falls from 13.6 % (0–15 cells) to ~5 % past 30. → D-009 (Nexus Development costs Prisms only), Q-007 (Surge is the only renewable income).
- **Decided:** D-008 (dense rock stays ungated, answers Q-005), D-009. Specs S-1…S-5 written in the new `docs/07-Build-Specs.md`; `04` reordered to match.
- **Bug found (not fixed, logged in 04 Debt):** B-002, phones show the desktop hint ("WASD…", truncated) and an `E` badge until the first touch.
- **Not a bug:** Integrity is hidden from the Core Matrix in Drift until bought (`main.js`), by design: it only matters in Surge.

## 2026-11-23 — Session 4 (v0.1.6): Audit
- **How:** no subagent tool in this session, so the five dimensions (correctness, perf, mobile, code health, docs drift) were done in-line, each finding reproduced before acting.
- **B-003 → fixed:** E (or Enter on a focused title button) opened the Core Matrix over the title screen, for the demo world or a paused real world, with live mode and buy buttons. `openPanel` now refuses while paused; Enter on a button isn't a Matrix toggle (D-010).
- **B-004 → fixed:** "New World" checked `store.read()`, which is null for a newer-format or corrupt save, so it erased that save with no prompt (breaks D-005). Now `store.exists()` gates a confirm with its own message.
- **Tests:** 3 new smoke checks (28 total). Each failed on the old code (stash/partial revert). The first draft of the save check passed wrongly: reload's `pagehide` saved the running game over the planted save. Setup marks the game `demo` first.
- **Measured, not a bug:** a Surge player idling in the Nexus with a 25-cell cleared ring gets ~1 Glitch kill per 10 min and 0 loot (20 seeds × 600 s in Node). No AFK rim farm today; the bot runner should re-probe it.
- **Logged in 04 Debt:** B-005 (cargo lost past the pickup cap on death), unculled pickup/particle drawing, touch sticks not cleared on blur (unverified).
- **B-006 (logged):** "beam mines terrain" failed once (mined 3, needs 4), then passed 4×. Pre-existing timing variance under load.
- **D-check:** D-001…D-009 match the code, except D-005, which B-004 broke and is now fixed. D-009 isn't built yet (S-1). `09` archive: nothing older than this first audit.

## 2026-11-23 — Session 5 (v0.1.7): Build — S-1 Nexus Radiance
- **Built:** `NEXUS_UPGRADES` (config), `game.nexusLevels`, `nexusLight()`, `buyNexus()`; render light hole uses it; Core/Nexus tabs in the Matrix sheet; `SAVE_FORMAT` 1 → 2 (step adds `nexus: { radiance: 0 }`).
- **Minimap:** Nexus reveals outside `update()` (purchase, boot) go through `game.revealQueue`, drained into `update()`'s return so the renderer paints them. Boot now reveals the Nexus disc at `nexusLight()` (was a fixed 260 px), so old saves get the 320 px disc.
- **Tests:** 5 new/extended smoke checks (32 total): Prism-only spend, light +96 and explored grows (454 → 611 cells), tab remembered, Radiance survives reload, format-1 save loads with Radiance 0, tabs/buy fit at 320 px. On the old code the run aborts at `nexusLight is not a function`.
- **Observed:** the first format-1 check passed wrongly in reverse (got Radiance 1): reload's `pagehide` re-saved the live game over the planted save, the same trap as session 4. Setup now sets `demo` first. Second time this trap bit, so per the manual it became a tool: `plantSaveAndReload()` in smoke, used by both planted-save checks.
- **Screenshots (1280×800 and 320×568, DSF 1):** Radiance 5 lights roughly twice the area around the Nexus; the minimap disc grows from hidden-under-the-marker to clearly visible. At 320 px the tabs, the ▲6 button and ✕ fit.

## 2026-11-23 — Session 6 (v0.1.8): Build — S-2 touch-first hints + narrow screens
- **Built:** `input.usingTouch` starts from `matchMedia('(pointer: coarse)')`; the HUD sets `body.touch`, which hides `kbd` badges; title wordmark `clamp(28px, 10.5vw, 76px)`.
- **B-001, B-002 → fixed.** Tests: 2 new smoke checks (34 total). Both failed on the old code: hint "WASD…" + E badge shown; `h1 314>288` and `.title-inner` overflowing at 320 px.
- **Overflow check scope:** every rendered non-inline element in `#hud`, `#title`, `#matrix` (title before start, HUD + Matrix Nexus tab after), `#hint` excluded (deliberate ellipsis).
- **Screenshots (DSF 1):** 320×568 title shows the whole wordmark with margin; Pixel 7 in the Nexus shows "Left thumb…" and a badge-free Core Matrix button.
- **Housekeeping:** `09` was at 7.2 KB of 8 KB, so v0.1…session 2 moved word for word to `docs/archive/`.

## 2026-11-23 — Session 7 (v0.1.9): Design — play-test, Q-006/Q-007, B-007
- **Play-test (DSF 1):** desktop 1280×800 mined 19 cells / 16◆ in 16 s of 4 straight legs; Matrix Core tab clean; Pixel 7 shows the thumb hint and a badge-free Matrix button. S-1/S-2 hold up.
- **B-007 → fixed (crash):** dying to one of several Glitches within 900 px of the Nexus: `destabilize()` replaced `enemies` mid-loop, the next index was undefined, `update()` threw and the rAF loop stopped (game frozen). Found by a Node probe. The loop now stops if the list was replaced. New smoke check (35 total) failed on the old code (game ran 0.017 s, plus the page error).
- **Q-007 measured** with the new `tools/surgefarm.mjs` (10 seeds × 300 s): a parked Surge bot makes 0.2–0.6 kills/min at 1000–1700 px, any upgrade level. Not a money printer today. Why: 37 of 38 live Glitches (20 seeds, 120 s idle) were pressed against rock, holding every spawn slot. Surge goes quiet in tunnels → D-015, spec S-6 (next build).
- **Decided:** D-013 (crash fixes in any session), D-014 (keep synthesized audio, answers Q-006), D-015, D-016 (S-3 trimmed: no reset button, opened from the title, mute folded in).
- **Specs:** S-6 (Glitch give-up) and S-7 (dev panel) written; S-3 refined; built S-1/S-2 removed from `07`. **B-008** (logged): the "Press E" hint shows under the open Matrix.
