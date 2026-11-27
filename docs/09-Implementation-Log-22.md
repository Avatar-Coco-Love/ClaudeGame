# 09 — Implementation Log, part 22

Part 21 holds sessions 154–157 (150–153 archived in audit 159). Newest at the bottom; read the tail only.

## Session 158 — Build: S-73b, the Echo on the shared field + Pincer pips (v1.11.99, D-198)
- `echo.js`: own BFS removed; `fieldAt` wraps flow.js's with the 24-step cap; the clock ticks from the Echo only with no
  hunters alive. `pincer.js`: white pip in the cached dot sprite (lead filled r 3, flank 1.5 px ring at r × 0.5).
- Checks: `pincer.cjs` (Echo + pair: same `game.flow`, no Echo field, ≤ 1 build a frame; fails on the old code, which
  had `echo.field`); browser: pip pixels read from the sprites (lead 255, flank ring 251, hollow 160);
  `colours.cjs`: pip white vs Deep / Shoal / Kiln edges + Prism, ≥ 25 under 4 visions (fails without `PINCER_PIP`).
  `echo.cjs`, `echoorder.cjs` unchanged and passing.
- Screenshot viewed (pair in the Deep cross, dense magenta rock): both pips read at a glance; the flank's ring sits
  inside its hollow, the lead's dot is solid. The rose-on-magenta problem from Design 157 is gone.

## Session 159 — Audit: hunters' perf with a Pincer pair, `02` cap check, 09 archive (v1.11.100, D-199)
- No subagent tool: sweeps in-session, newest code first (`flow.js`, `hunter.js`, `pincer.js`, `echo.js` S-72…S-73b).
  Edge cases: death clears hunters; ending clears; mode switch keeps them; fading ones can't be beamed / warded; a pair
  killed on one frame (Arc) skips the dead mate. No game bug found.
- Perf (audit 154 leftover): new `perf.cjs` run `pack` (hunt + a Pincer pair kept out, natural pairs off in
  deep / hunt). 4× CPU, 12 s: deep 27.2 ms mean, hunt 29.4, pack 29.0; medians hunt / deep and pack / deep 1.00×;
  field build ≤ 0.9 ms, 24 A* searches ≤ 50 nodes, none capped.
- Watch: with `hunt.off` and hunters alive (tests only) nothing ticks the field clock (D-198 kept the order rule).
- D-193…D-198 vs code: match (D-193's ≤ 0.6 ms build now reads 0.8–0.9 ms; logged in `04-…-4`).
- Workflow review: `02` hit 8 KB a third time (8074 bytes) → 7 KB check in `docs.cjs` (FAILs on the old `02`,
  D-199); 14 system lines moved word for word to `08-…-2`. Too much: per-build `02` lines; too little: nothing new.
- `09` sessions 150–153 archived word for word (`archive/2026-11-27-09-sessions-150-153.md`).
