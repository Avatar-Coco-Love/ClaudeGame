# 09 — Implementation Log

## 2026-11-23 — v0.1 first playable
- **Changed:** built the whole first loop (see 02). Files: `index.html`, `style.css`, `src/{config,world,game,render,input,audio,main}.js`.
- **Bug found → fixed:** the beam started 12 px in front of the core. When that point was inside a wall, the DDA skipped
  the origin cell, so the beam mined the cell *behind* the wall. Fix: check the origin cell, and cast from the core's centre.
- **Bug found → fixed:** a 20 px core standing on a cell boundary couldn't enter a 1-cell tunnel it had just dug.
  Fix: corner assist in `moveBody` nudges sideways (up to ~half a cell) when blocked head-on.
- **Visual:** rock fill was too close to empty space, so walls looked like floor. Fills brightened.
- **Observed:** chunk cache (16×16 cells, max 48 canvases) keeps redraws to mined chunks only. Light overlay at half resolution.

## 2026-11-23 — Session 1b: autonomy + health tooling
- **Added:** `CLAUDE.md` (operating manual for autonomous sessions), `docs/04-Roadmap.md`, `docs/inbox/`, `tests/smoke.cjs` (16 checks, desktop + Pixel 7).
- **Bug found → fixed:** the title screen's demo world (seed 1337) was saved on `pagehide`. A first-time visitor came back to a phantom
  "Continue", and "New World" then raised a confirm() prompt. Fix: `game.demo` flag, never persisted. Smoke check added.
- **Process:** a scheduled task now starts a fresh session periodically. Each session does one PR, so context stays small.

## 2026-11-23 — Session 2 (v0.1.4): inbox, Gloamdeep insights → version tracking
- **Inbox:** an insights file from the sister project Gloamdeep (~735 PRs in). Archived as `docs/archive/2026-11-23-Gloamdeep-insights.md`.
- **Adopted as checks/code:** `VERSION` shown on the title + `05-Changelog.md` (D-003); numbered IDs and `06-Decisions.md` with rejected
  alternatives (D-004); `src/save.js` format upgrades and an "unversioned save loads" smoke check (D-005); `tests/docs.cjs` doc cap,
  run inside smoke (D-006). `03` converted to Q-xxx IDs.
- **Adopted as rules (CLAUDE.md):** record everything in the same PR, rule broken twice → check, measure before deciding, new tests must fail
  on old code, salt per random draw, state-change edge cases, audits archive `09` and check D-xxx against code.
- **Adopted as roadmap (04 → Tooling):** dev panel, Surge bot runner with degenerate-loop probes, throttled perf check, narrow-screen text check, deterministic RNG.
- **Not adopted (D-007):** owner-playtest-driven planning (owner doesn't decide here), recorded audio (opened as Q-006), canvas text-fit test (our text is DOM).
- **Observed:** saves already wrote `v: 1` but nothing read it; now it does. `game.rand` is seeded from `Date.now()`, so gameplay isn't reproducible yet (roadmap).
- **Bug found (not fixed, logged in 04 Debt):** B-001, title wordmark clipped at 320 px wide. Seen in the narrow-screen screenshot taken for this PR.
- **Rotation note:** this session's Design slot went to the inbox, so session 3 runs the displaced Design session.

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
