# 09 — Implementation Log

Continued in `09-Implementation-Log-2.md` (session 36 on). Older entries: v0.1 to session 2 in `archive/2026-11-23-09-sessions-0-2.md`, session 3 in `archive/2026-11-23-09-session-3.md`, sessions 4–7 in `archive/2026-11-23-09-sessions-4-7.md`, session 8 in `archive/2026-11-23-09-session-8.md`, session 9 in `archive/2026-11-23-09-session-9.md`, sessions 10–11 in `archive/2026-11-23-09-sessions-10-11.md`, sessions 12–13 in `archive/2026-11-23-09-sessions-12-13.md`, sessions 14–15 in `archive/2026-11-23-09-sessions-14-15.md`, sessions 16–17 in `archive/2026-11-23-09-sessions-16-17.md`, session 18 in `archive/2026-11-23-09-session-18.md`, sessions 19–20 in `archive/2026-11-23-09-sessions-19-20.md`, session 21 in `archive/2026-11-23-09-session-21.md`, sessions 22–23 in `archive/2026-11-23-09-sessions-22-23.md`, sessions 24–28 in `archive/2026-11-24-09-sessions-24-28.md`, sessions 29–30 in `archive/2026-11-24-09-sessions-29-30.md`, sessions 31–33 in `archive/2026-11-24-09-sessions-31-33.md`.

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

## 2026-11-24 — Session 35 (v0.2.39): Build — S-14 Pulse beam
- `BEAM_MODES.pulse` + `PULSE_*` (config), node `pulse` 40●, `beam.js` `updatePulse`/`releasePulse`, render dotted aim line,
  core glow with charge (off under reduced motion), 0.12 s release flash + light hole (half under reduced motion). D-052 rules.
- New `tests/pulse.cjs` (7 checks): Beam 0 burst breaks 2 rock (+0.18 crack), Beam 2 exactly 3; a 0.1 s tap fizzles, then 18
  frames of recovery; 10 s hold = 13.0 vs 18.2 cells (0.715×); Glitch stop; cycle/unlock/save; mouse + touch (CDP) in the page.
  All fail on the old code (no `pulse` mode). `audio.cjs`: thump peak −29.7 dBFS, fizzle −41.6, < 1 % > 2 kHz. Smoke 122/122.
- Screenshots viewed (1280×800): dotted reach line while charging; a full burst at Beam 2 shows a clean bright line that pierces 3 cells.
  **B-028 (test only, fixed):** the mouse check aimed off by the camera's ease after a teleport; it now waits 0.9 s first.
- **Q-011 with Pulse** (Focus / Wide / Pulse): first Lumen Beam 2 median 30 / 56 / 43 s (Beam 0: 55 / 113 / 77); 10● run 69 /
  133 / 96 s; Surge farm 3.90 / 3.77 / 3.80 kills/min (deaths 0 / 0.33 / 0.33); crystal Lvl 0 42.9 / 48.3 / 42.9◆/min; Prism hunt
  Lvl 2 15.2 / 9.7 / 12.4▲/min. No mode wins every route, but Pulse wins none: bots stand close, so reach never counts. For Design 37.

