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
