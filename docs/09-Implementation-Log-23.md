# 09 — Implementation Log, part 23

Sessions 164–168 archived word for word in audit 174 (`archive/2026-11-27-09-sessions-164-168.md`). Newest at the bottom; read the tail only.

## Session 169 — Audit: B-112 arc under the notch, tablet landscape, 09 archive (v1.12.110, D-210)
- No subagent tool: sweep in-session, newest code first (`thumbarc.js`, `main.js` `placeArc`, S-75 CSS).
- Tablet landscape (02's first look): 1024 × 768, 1180 × 820, 1366 × 1024, 820 × 1180 all pass every arc rule, farthest
  215 px; screenshot 1024 × 768 viewed: the arc hugs the corner, ⊕ and the hint clear. 1024 × 768 joins the check.
- **B-112 (fixed):** the arc ignored `env(safe-area-inset-*)` (the page sets `viewport-fit=cover`): on a notched phone
  in landscape ⟂'s box ended 8 px from the edge, under a 47 px notch. Now the arc turns round the safe corner; the new
  inset check in `thumbarc.cjs` FAILs on the old code (844 × 390: boxes 836 / 371 in the inset).
- D-205…D-209 vs code: match. Audit 159's watch closed (three audits); hunter blob asked as Q-044.
- Workflow review (D-210): too little: no notch case in touch checks (added); too much: none new.
- `09` sessions 159–163 archived word for word (`archive/2026-11-27-09-sessions-159-163.md`); part 22 removed.
