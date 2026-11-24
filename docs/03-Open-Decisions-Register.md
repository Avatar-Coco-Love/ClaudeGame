# 03 — Open Questions

Undecided only. Once a question is settled, remove it here and record the answer as a D-xxx entry in `06-Decisions.md` (cite the Q number).
New IDs continue from the highest one ever used; never reuse an ID. Q-003 (win state) and Q-004 (multiplayer) were settled by D-045.

| ID | Question | Notes |
|----|----------|-------|
| Q-001 | Should Surge give *any* exclusive reward? | Leaning **no**: equal rewards is a pillar (D-002). Maybe cosmetic-only. |
| Q-007 | Glitch kills are the only *renewable* income (50 % 1▲ + 2–5◆ by tier), Drift's Shards are finite. Does Surge become the "real" game late on? | Session 8, after S-6: a parked farm makes 4.1–4.7 kills/min (was 0.4, Glitches stuck), so the Prism drop is now 50 % (D-018): ~2▲ + ~9◆ per min. Audit 9 (`tools/parity.mjs`, D-019): over 10 min Surge earns 0.81–0.90× Drift's Prisms, ◆ about equal. Open part: late game, when ore near the Nexus runs out. |
| Q-009 | Should the Scanner ping (S-11) also show Glitches in Surge? | Leaning **no** (D-030): ore only in both modes keeps it one tool, not a Surge perk. Revisit with M6 Glitch variety. |
| Q-011 | After S-13/S-14, is one beam mode best on every route? | Session 27 (D-042): Focus wins travel + Prism hunts, Wide wins crystal harvest (+12 % ◆/min), kills ~equal; no retune. Re-run the probes with `MODE=pulse` after S-14; a mode that wins everywhere gets retuned. |
