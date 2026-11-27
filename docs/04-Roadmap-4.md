# 04 — Roadmap, part 4: Debt (continued)

Continues the Debt list of `04-Roadmap-2.md` (near the 8 KB cap at audit 104). Audits add here; fixes move to
`archive/2026-11-24-04-debt-done.md` word for word.

## Debt
- **Audit 164 leftovers** (sweep in-session, newest code first: `hunter.js` S-74b, `surgebot.mjs` / `huntrun.mjs`
  S-74b2a; fixed: B-109 the thief that never got away, D-204; 02's next step checked against the rotation). Open
  (watch): the flee A* frame measured ≤ 3 ms whole update (Node, once per theft); `surgebot` heal trips if the core
  dies mid-trip (not seen). Phone sweep done at audit 169 (B-112). Rule: a line carried three audits is closed.
  (Audit 169: carried once; re-check at audit 174 or close.)
- **Design 167 play-test:** five hunters on the core in Surge merge into one violet blob (count unreadable). Audit 169:
  not a slice yet; asked as Q-044 for Design 172.
- **Audit 169 leftovers** (sweep in-session, newest code first: `thumbarc.js`, `main.js` `placeArc`; fixed: B-112 safe-area
  insets, 1024 × 768 tablet added to the arc check). Open (watch): the arc's key ignores the bank panel's height
  (Surge, Anomaly chips); on every measured viewport the panel sits left of w / 2 + 24, so it can't reach a slot.
