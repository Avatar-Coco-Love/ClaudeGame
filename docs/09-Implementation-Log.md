# 09 — Implementation Log

Older entries: v0.1 to session 2 in `archive/2026-11-23-09-sessions-0-2.md`, session 3 in `archive/2026-11-23-09-session-3.md`, sessions 4–7 in `archive/2026-11-23-09-sessions-4-7.md`, session 8 in `archive/2026-11-23-09-session-8.md`, session 9 in `archive/2026-11-23-09-session-9.md`, sessions 10–11 in `archive/2026-11-23-09-sessions-10-11.md`, sessions 12–13 in `archive/2026-11-23-09-sessions-12-13.md`, sessions 14–15 in `archive/2026-11-23-09-sessions-14-15.md`, sessions 16–17 in `archive/2026-11-23-09-sessions-16-17.md`, session 18 in `archive/2026-11-23-09-session-18.md`, sessions 19–20 in `archive/2026-11-23-09-sessions-19-20.md`, session 21 in `archive/2026-11-23-09-session-21.md`, sessions 22–23 in `archive/2026-11-23-09-sessions-22-23.md`, sessions 24–28 in `archive/2026-11-24-09-sessions-24-28.md`, sessions 29–30 in `archive/2026-11-24-09-sessions-29-30.md`.

## 2026-11-24 — Session 31 (v0.2.35): Build — audit 29 "Fix first"
- All five re-verified by `tests/audit29.cjs` (new, called by smoke); each check failed on the old code, passes now:
- **B-022 → fixed:** 400 forced pickups made every crystal yield nothing. Forced pickups are now tagged `kept`, never count
  toward the cap, never evicted; at 400 loose ones the oldest loose one makes room. Save format 8 stores the tag;
  7 → 8 marks an old floor all kept (it may hold scattered cargo). D-047.
- **B-023 → fixed:** a Glitch at hp 0 dealt 14 dmg on contact, and one at its give-up frame faded with no kill/loot.
  The death check now runs right after the fade block. (A Glitch already fading stays lootless, S-6.)
- **B-024 → fixed:** F during a 0.15 s hitstop was consumed and lost; F/Q now wait for the sim (paused/Matrix still drop).
- **B-025 → fixed:** the open sheet showed ◆ 0 while 40 shards streamed in. The bank line redraws on each tick; the rows
  (buy buttons) redraw once the deposit ends, so a row isn't rebuilt under a pressed pointer.
- **B-026 → fixed:** an empty ping drew no ring (scan ran on marks); it now runs on `age < end`. Screenshot viewed.
- `beam.cjs` pinned `SAVE_FORMAT === 7`; now `up.v === SAVE_FORMAT` (same intent). Smoke 103/103.

## 2026-11-24 — Session 32 (v0.2.36): Design — play-test, `08` folded into specs, Spires v1a
- Play-test (Playwright, viewed): desktop 1280×800 (new world, mining, Max all + Ring 60 + Wide + scan, Surge, Matrix), Pixel 7
  at 844×390 and 320×568. v0.2.35 fixes seen working: an empty ping draws its ring; no page errors in any run.
- Reproduced audit-29 touch items: at 844×390 the title h1 starts above the screen and the version line is cut; ◎/⟂ at
  x 754–832, y 200–294 (right thumb); `#hint` 295 px in 286 at 320 px ("mine" cut). → S-17.
- Bedrock: the beam sparks on the border (no crack); `04` Debt reworded. Hitstop fires on any yield cell (D-048 wording note).
- Measured (40 seeds, d ≥ 64): ~648 prism / 588 crystal / 110 Lumen cells, 5580 open of 11440; 5 Spire sectors always fit
  ≥ 12 cells from vaults. → D-049, S-19. Q-012 opened (relight cost + challenge).
- Specs: S-17 touch, S-18 code split (new); S-16 retargeted to `SAVE_FORMAT` 9 (8 went to B-022); S-19 Spires v1a (new).
  `07` split into `07-Build-Specs-2.md`. Order D-048. `08` deleted: touch → S-17, code health → S-18 + `04` Debt, drift fixed
  (README controls) or in S-17 (tools reject unknown modes). Build mode UX cut as an item (D-048). No bugs found.

## 2026-11-24 — Session 33 (v0.2.37): Build — S-17 touch pass
- CSS (`style.css`): `#title` top-aligned with auto margins + landscape h1 0.6×; landscape coarse row ◎ ⟂ ♪ ≡ + 112 px minimap;
  44 px ♪ ≡ ✕ and mode toggles, ♪/≡ 8 px apart; `#hint` wraps under 380 px, Core Matrix lifted to clear a 2-line hint.
- `⟂ Focus` / `⟂ Wide` from `BEAM_MODES` names (`#mode-name`). `input.js`: a lifted stick adopts another live touch on its half.
  `tools/mode.mjs`: probes exit 1 on an unknown `MODE` (D-050).
- Measured (Pixel 7 emulation): 844×390 h1 top −15 → 16, version line at y 349–363; row at y 12–56, x 444–712, minimap from 720;
  667×375 h1 top −19 → 16. 320×568: hint 2 lines, 286/286 px. Screenshots viewed (title + HUD, both orientations).
- New `tests/touch.cjs` (9 checks); each failed on the old code (stashed: title, row, label, hint, 2nd finger). Smoke 112/112. No bugs found.

## 2026-11-24 — Session 34 (v0.2.38): Audit — glow sprites; perf measured
- No Agent tool this session, so the five sweeps were done in turn, briefly; every finding below was re-run before acting.
- **Perf (reported, headless Chromium 1280×800 DSF 1, mining Wide at ring 30):** frame mean 22 ms with no floor loot; 10 on-screen
  pickups 61 ms, 30 → 120 ms, 140 → 363 ms, 300 → 540 ms (each `shadowBlur` fill ≈ 3.4 ms). A Scanner ping with 44 marks: 148 ms.
  CPU ×4 throttle: 121 ms with no loot (software raster; not a phone proxy). JS draw is ≈ 1.1 ms/frame, `drawLight` ≈ 67 % of it.
- **B-027 → fixed:** pickups and Scanner glyphs are baked once per kind into glow sprites (`render.js` `glowSprite`, D-051).
  After: 30 pickups 25 ms, 140 → 27, 300 → 33; a 60-mark ping 25 ms. Side-by-side screenshots (old/new) viewed: same look.
  New `tests/audit34.cjs` (2 checks: no shadowed draws for 120 pickups / 40 glyphs) failed on the stashed old code (120 and 50
  shadowed draws), passes now. The B-014 check now counts `drawImage` as a draw too (same intent: off-screen loot costs nothing).
- **Touch (re-checked v0.2.37):** a CDP touch swipe scrolls the Matrix sheet (225 px) and the landscape title; `touch-action: none`
  on body doesn't block them. Second-finger and 44 px rules hold (`touch.cjs`). No new touch bug.
- **Correctness (save 8, D-047):** a pickup loaded exactly on the core (rounded coords, d = 0) can't go NaN: it is collected that
  frame. 7 → 8 upgrade, cap eviction and kept tags re-read: OK. Watch item: the cargo-full toast stays up while the core sits on loot.
- **Code health / drift:** dropped the unused `oreWithin` alias; a redundant `else if`; comments fixed (`config.js` D-017 "any
  Glitch", `research.js` names both nodes). D-001…D-050 spot-checked against `config.js`/code: numbers match; D-032's
  "no glow sprite" is superseded by D-051. `09` sessions 29–30 and changelog v0.1.17–21 archived word for word; `04` Debt → `04-Roadmap-2.md`.
