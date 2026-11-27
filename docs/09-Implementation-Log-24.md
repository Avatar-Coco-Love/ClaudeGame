# 09 — Implementation Log, part 24

Continues part 23 (`09-Implementation-Log-23.md`). Newest at the bottom; read the tail only.

## Session 170 — Build: S-76 map legend (v1.12.111, D-211)
- The big map's legend lists the kinds drawn this open (`maplegend.js`, `kinds` Map from `drawMinimap`), glyph in its
  colour + one word, in spec order. `window.__lumen.mapView` added for tests.
- Observed: a fresh pinned world shows only "Nexus"; a Beacon placed adds "Beacon". All 12 kinds fit at 320 × 568
  (3 lines, 4 with Large text) and 568 × 320 (one column of 12 right of the map). Screenshots of both viewed. The first
  shot drew the two lair octagons overlapping: their glyphs now step 15 px apart.
- Test pitfall: a fake Beacon without `r` threw in the light pass (non-finite gradient); the test now builds one
  shaped like `makeBeacon`'s.
- `mapview.cjs` +2 checks (kinds drawn = kinds listed; 12 kinds × 2 viewports × Large text, on screen, clear, no scroll).

## Session 171 — Build: S-77a Decoy craft + lure (v1.12.112, D-212)
- `decoy.js`: craft / place / pick up like a Ward; `lureGoal` is the one call in `hunter.js` (non-fleeing branch, before
  the field); `updateDecoys` runs the held clock before the hunters. Save format +1 (craft.decoy, decoys).
- Observed (stub room, `decoy.cjs`): a Tracer 5 cells south of a Decoy turns north at once (vy −111, vx 0), arrives at
  1.35 s, circles within 0.32 cell, Decoy spent at 5.37 s (held 4.02 s), then it walks west to the core. Drift and
  Surge give the same frames; a wall between, a fleeing thief, a Glitch: not lured. Browser shot viewed: chevron on the
  peach ◈ with the draining hold arc. Peach `255, 198, 170`: lowest ΔE 35 vs Ward / Tracer / Pincer under all 4 visions.
- The legend gains Decoy (13 kinds; `mapview.cjs` fit check still passes at 320 × 568 and 568 × 320, Large text too).

## Session 172 — Design: Decoy play-test, Q-044 settled (v1.12.113, D-213)
- Decoy (S-77a) in the live game: Deep, a bent 22-cell tunnel, a Tracer at the far end, the core still. No Decoy: touch
  at 5.3 s. A Decoy 3 cells toward it when it is 12 cells out: lured 0.7 s later (the bend), touch at 9.2 s. Drift and
  Surge to the 0.02 s. `decoy.cjs` shot viewed: chevron circling the peach ◈, hold arc readable.
- Q-044: five Tracers on the core at 390 × 844, shot viewed: one violet blob. Natural cap is 4; hull / cargo bars carry
  the cost. No pip (D-213).
- S-77b (`07-…-22`): bot places on its own cell, reports seconds lured per Decoy, tuning bounds + a split rule.
- No bugs found.

## Session 173 — Build: S-77b Decoy measure, as a report (v1.12.114, D-214)
- `huntrun.mjs --decoy`: a third run per seed (hunters on, Decoys), the bot's cue skips a cell holding a Relay / Sink /
  Ward / Decoy (B there picks it up). Smoke's full huntrun gate now runs with `--decoy` (+~35 s, same process).
- Observed (8 seeds, 3 rings, both modes): defaults hold 4 / R 6 / ▲4 ◆20 — saving −421 % Drift, −596 % Surge; tries:
  hold 6 → −522 / −471; hold 6 R 8 → −680 / −598; hold 6 R 8 ▲2 ◆10 → −246 / −184. The other rows are unchanged by the
  Decoy runs (pooled 12.4 % / 12.2 %, D-206). Drift thefts with Decoys drop (Kiln 1003 → 525), Surge kills stay.
- New check fails on the old tool (no `--decoy` rows). No bugs found.

## Session 174 — Audit: B-113 Decoy lair refund, debt closed, 09 archive (v1.12.115, D-215)
- No subagent tool: sweep in-session, newest code first (`decoy.js`, `maplegend.js`, `huntrun.mjs --decoy`). Edge cases:
  death and mode switch keep Decoys (saved, like Wards); a held Decoy's clock runs once a frame before the hunters.
- **B-113 (fixed):** `boss.js` `refund` skipped `game.decoys`. A current save with an unreadable lair record and a
  Decoy on lair floor kept it (decoys 1, bank 0); now refunded ▲4 ◆20. New `boss.cjs` check FAILed on the old code.
- D-210…D-214 vs code: match. Debt: audit 164 watch closed (three audits), Design 167 blob closed (Q-044 settled).
- Workflow review (D-215): too little: no "every placed kind" checklist (rule added); too much: none new.
- `09` sessions 164–168 archived word for word (`archive/2026-11-27-09-sessions-164-168.md`).
- Smoke 733/733. Pitfall: bumping `VERSION` while smoke runs FAILs S-38 / S-29 (the version is read at the start); re-run clean.
