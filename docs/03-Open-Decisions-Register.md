# 03 — Open Questions

Undecided only. Once a question is settled, remove it here and record the answer as a D-xxx entry in `06-Decisions.md` (cite the Q number).
New IDs continue from the highest one ever used; never reuse an ID. Q-003 (win state) and Q-004 (multiplayer) were settled by D-045; Q-011 by D-054, Q-012 by D-055, Q-013 by D-062, Q-014 by D-061, Q-015 by D-069, Q-016 by D-079, Q-017 by D-087.

| ID | Question | Notes |
|----|----------|-------|
| Q-001 | Should Surge give *any* exclusive reward? | Leaning **no**: equal rewards is a pillar (D-002). Maybe cosmetic-only. |
| Q-007 | Glitch kills are the only *renewable* income (50 % 1▲ + 2–5◆ by tier), Drift's Shards are finite. Does Surge become the "real" game late on? | Session 8, after S-6: a parked farm makes 4.1–4.7 kills/min (was 0.4, Glitches stuck), so the Prism drop is now 50 % (D-018): ~2▲ + ~9◆ per min. Audit 9 (`tools/parity.mjs`, D-019): over 10 min Surge earns 0.81–0.90× Drift's Prisms, ◆ about equal. Open part: late game, when ore near the Nexus runs out. Design 52 (`spireloop`): the route to a primed Spire takes the same median in both modes (4.5 min, mid build, 20▲ banked); S-30 (`surgebot`, 12 seeds, 20 min, D-085): `mine` Surge hauls ≥ Drift (mid 41.9 vs 38.6 ◆/min, 0 deaths); `rim`/`hug` bank 0; `spire` primes in the same median (mid 2.4 min both), start build Surge 8.2 vs 4.3 min. Leaning: parity holds. |
| Q-018 | Should a placed Relay be reclaimable (pick it up to move it)? | Player feedback (session 59): Relays are permanent, ≤ 3 per world, so an early one is stranded as you go deeper. Leaning **yes**: B / ✦ inside its ring folds it back into stock, no refund needed. Design 62 specs it (save shape?). |
| Q-009 | Should the Scanner ping (S-11) also show Glitches in Surge? | Leaning **no** (D-030): ore only in both modes keeps it one tool, not a Surge perk. Revisit with M6 Glitch variety. |
