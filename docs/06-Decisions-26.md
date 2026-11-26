# 06 — Decisions log, part 26

Continues `06-Decisions-25.md` (part 25 neared the 8 KB cap at D-176; same rules: supersede, never edit; list rejected
alternatives). D-177 on.

### D-177 — Audit 139: the Lens button is ❖; one glyph, one meaning; slow-test debt closed (session 139, Audit)
- Supersedes D-176's ✧ only (its place in the HUD stands). ✧ was already the Lodestone Anomaly's chip glyph, in a
  near-identical violet, a few cm away on a phone (B-099). ❖ (four diamonds: a pocket of ore) is in no other HUD
  role. Rule: a HUD button glyph is never also an Anomaly chip glyph (`lens.cjs` check, fails on the old markup).
- Phone sweep (carried two audits): 320 × 568, 360 × 780, 412 × 915, 568 × 320, 640 × 360, 844 × 390, Normal and Large,
  Surge, Echo, Lens, ✦, 3 buff chips, 5 banks at a 256 world's realistic top: no overlap, nothing off screen, all
  buttons ≥ 44 px. `touch.cjs`'s B-034 loop now also runs 320 × 568 and 412 × 915 portrait. Found: a 4-digit ● with a
  4-digit ◆ ▲ overlaps the minimap by 13 px at 320 portrait; a 256 world holds ~550 ● in all and a New Cycle resets
  the bank, so it can't happen in play (not fixed, not tested).
- The slow-file items (`quality` ~48 s, `ending` ~27 s, `spire` / `facet` ~20 s) leave the Debt list: they wait out
  real-time windows the checks are about (3 s p90, 10 s step-up; the ending sequence). Carried four audits, never
  worth a fix; the smoke runs ~500 s with the gates beside it.
- Workflow: a Debt line carried three audits gets fixed or closed with a reason in that audit, not copied on.
- Rejected: changing Lodestone's chip instead (older, in saves' toasts and players' memory); ⊛ / ⌖ (thin at 44 px);
  ◈ (reads as Echo's ◇); speeding `quality.cjs` with a fake clock in `Quality` (test-only hook in game code).
