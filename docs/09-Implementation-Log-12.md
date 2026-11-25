# 09 — Implementation Log, part 12

Continues `09-Implementation-Log-11.md` (part 11 neared the 8 KB cap at session 89; sessions 84–88 archived word for word in audit 94: `archive/2026-11-25-09-sessions-84-88.md`; sessions 89–93 in audit 99: `archive/2026-11-25-09-sessions-89-93.md`). Newest at the bottom; read the tail only.

## Session 94 — Audit: floor-glow blit unsmoothed, 09 archive (v1.4.34, D-126)
- Sweeps done in-session (no subagent tool in this run): perf (B-084), correctness on the live 256 world, mobile,
  docs drift on D-120…D-125 (all match the code: `needSize`, `WORLD_SIZE_NEW` 256, RINGS r0 80 / 104, minimap 160).
- **B-084 fixed (measured, not loosened):** the drawcost "holes" frame split at 1280×800 headless: empty 5.9 ms, +2.3
  light holes, +3.6 floor glow; of that, the smoothed 4× upscale blit of the glow layer was 4.0 ms vs 1.4 unsmoothed
  (a 1:1 full-screen blit 0.9). Now `drawLightGlow` blits with smoothing off: holes 1.97–2.04× → 1.65–1.69× (3 runs).
  Screenshot at glow 0.3 (4× the real alpha), 4× zoomed: blocks barely visible there, none at 0.08. `glow.cjs` same.
- New drawcost check: the glow layer is blitted once per frame, unsmoothed. Fails on old code (stashed: smooth 1, and
  holes 2.04×).
- 256 probes: `surgebot` mine + spire, mid build, Surge, 3 seeds × 6 min: stuck 0, deaths 0, Wake held 3/3. Pixel 5:
  New World → Ring 110, no page error; "Entering the Kiln" toast sits on lit terrain under the core (Debt).
- `09` sessions 84–88 archived word for word (`archive/2026-11-25-09-sessions-84-88.md`); part 11 removed.
- **B-085** (flaky, not fixed): run 1 failed `glow.cjs` pool check, outside floor 3.7 (off and on alike, so not the glow;
  usual 3.2); 285 isolated seeds all 3.2. Debt. Smoke 441/442 then 442/442 (was 441; +1 drawcost).
