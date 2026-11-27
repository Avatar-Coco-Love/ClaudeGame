# 04 — Roadmap, part 4: Debt (continued)

Continues the Debt list of `04-Roadmap-2.md` (near the 8 KB cap at audit 104). Audits add here; fixes move to
`archive/2026-11-24-04-debt-done.md` word for word.

## Debt
- **Audit 159 leftovers** (sweep in-session, newest code first: `flow.js`, `hunter.js`, `pincer.js`, `echo.js`; fixed:
  audit 154's perf leftover, `perf.cjs` `pack` run, 1.00× of `deep`). Open (watch): with `hunt.off` and hunters alive
  (tests only) nothing ticks the field's 0.5 s clock (D-198's order rule); the field build measured 0.8–0.9 ms at 4×
  (D-193 said ≤ 0.6), still far inside the frame.
  (Audit 164: carried once; re-check both at audit 169 or close.)
- **Audit 164 leftovers** (sweep in-session, newest code first: `hunter.js` S-74b, `surgebot.mjs` / `huntrun.mjs`
  S-74b2a; fixed: B-109 the thief that never got away, D-204; 02's next step checked against the rotation). Open
  (watch): the flee A* frame measured ≤ 3 ms whole update (Node, once per theft); `surgebot` heal trips if the core
  dies mid-trip (not seen). Phone sweep due at audit 169 (last 154). Rule: a line carried three audits is closed.
