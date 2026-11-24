# 03 — Open Questions

Undecided only. Once a question is settled, remove it here and record the answer as a D-xxx entry in `06-Decisions.md` (cite the Q number).
New IDs continue from the highest one ever used; never reuse an ID. Q-003 (win state) and Q-004 (multiplayer) were settled by D-045; Q-011 by D-054, Q-012 by D-055, Q-013 by D-062, Q-014 by D-061.

| ID | Question | Notes |
|----|----------|-------|
| Q-001 | Should Surge give *any* exclusive reward? | Leaning **no**: equal rewards is a pillar (D-002). Maybe cosmetic-only. |
| Q-007 | Glitch kills are the only *renewable* income (50 % 1▲ + 2–5◆ by tier), Drift's Shards are finite. Does Surge become the "real" game late on? | Session 8, after S-6: a parked farm makes 4.1–4.7 kills/min (was 0.4, Glitches stuck), so the Prism drop is now 50 % (D-018): ~2▲ + ~9◆ per min. Audit 9 (`tools/parity.mjs`, D-019): over 10 min Surge earns 0.81–0.90× Drift's Prisms, ◆ about equal. Open part: late game, when ore near the Nexus runs out. |
| Q-009 | Should the Scanner ping (S-11) also show Glitches in Surge? | Leaning **no** (D-030): ore only in both modes keeps it one tool, not a Surge perk. Revisit with M6 Glitch variety. |
| Q-015 | A save that had seen every valid candidate of a sector gets that Spire with its seen cells left as generated (`keep`, D-068), possibly no core. What should S-20/S-28 do with such a Spire (count it lit, or stamp the core when first fed)? | Session 46: only reachable with ≥ 5 candidates all seen in one sector; no real save is known to. Decide before S-24 counts Spires for the ending. |
