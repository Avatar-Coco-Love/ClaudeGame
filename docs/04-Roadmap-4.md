# 04 — Roadmap, part 4: Debt (continued)

Continues the Debt list of `04-Roadmap-2.md` (near the 8 KB cap at audit 104). Audits add here; fixes move to
`archive/2026-11-24-04-debt-done.md` word for word.

## Debt
- **Audit 169 leftovers** (sweep in-session, newest code first: `thumbarc.js`, `main.js` `placeArc`; fixed: B-112 safe-area
  insets, 1024 × 768 tablet added to the arc check). Open (watch): the arc's key ignores the bank panel's height
  (Surge, Anomaly chips); on every measured viewport the panel sits left of w / 2 + 24, so it can't reach a slot.
  (Audit 174: carried once; re-check at audit 179 or close.)
- **Audit 174 leftovers** (sweep in-session, newest code first: `decoy.js`, `maplegend.js`, `huntrun --decoy`; fixed:
  B-113 lair refund skipped Decoys). Open (watch): `lureNo` keeps one Decoy a hunter gave up on for that hunter's
  life (D-212 by design; hunters are short-lived, so not worth a timer).
- **Build 175:** `decoy.cjs` upgraded "one format back" (`SAVE_FORMAT - 1`) and failed when format 27 landed (B-114,
  fixed: finds its step, as `lens.cjs` does since S-70). Twice now: `echoorder.cjs`, `relay.cjs`, `echolevels.cjs` still
  use `SAVE_FORMAT - 1`; move them to the step finder and add a `saveformat.cjs` check banning it (next audit).
