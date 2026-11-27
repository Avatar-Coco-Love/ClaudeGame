# 04 — Roadmap, part 4: Debt (continued)

Continues the Debt list of `04-Roadmap-2.md` (near the 8 KB cap at audit 104). Audits add here; fixes move to
`archive/2026-11-24-04-debt-done.md` word for word.

## Debt
- **Audit 154 leftovers** (sweeps in-session; fixed: B-106 an older key set with N bound, the map view re-fits on a
  resize, `MAP_MAX_PX` to config; phone sweep 320 / 390 portrait, 844 / 568 landscape: no overlap, no small button, no
  page scroll; audit 59–104 lines closed, D-192). Open: none new. Perf not re-measured (next: `perf.cjs` `deep`, S-72).
  Rule: a line carried three audits is fixed or closed (D-192 applies it to `04-…-2` too).
- **Audit 159 leftovers** (sweep in-session, newest code first: `flow.js`, `hunter.js`, `pincer.js`, `echo.js`; fixed:
  the perf leftover above, `perf.cjs` `pack` run, 1.00× of `deep`). Open (watch): with `hunt.off` and hunters alive
  (tests only) nothing ticks the field's 0.5 s clock (D-198's order rule); the field build measured 0.8–0.9 ms at 4×
  (D-193 said ≤ 0.6), still far inside the frame.
