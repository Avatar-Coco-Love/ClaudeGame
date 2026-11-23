# 03 — Open Questions

Undecided only. Once a question is settled, remove it here and record the answer as a D-xxx entry in `06-Decisions.md` (cite the Q number).
New IDs continue from the highest one ever used; never reuse an ID.

| ID | Question | Notes |
|----|----------|-------|
| Q-001 | Should Surge give *any* exclusive reward? | Leaning **no**: equal rewards is a pillar (D-002). Maybe cosmetic-only. |
| Q-003 | What is the end goal / "win" state? | Candidate: relight N dormant beacons hidden in the far rings (M5 Spires). Rings (D-022) give them a home: the Deep. |
| Q-004 | Multiplayer? | Destructible terrain + co-op was the biggest risk in the original plan. Not before single-player feels finished. |
| Q-007 | Glitch kills are the only *renewable* income (1▲ + 2–4◆ each), Drift's Shards are finite. Does Surge become the "real" game late on? | Session 8, after S-6: a parked farm makes 4.1–4.7 kills/min (was 0.4, Glitches stuck), so the Prism drop is now 50 % (D-018): ~2▲ + ~9◆ per min. Audit 9 (`tools/parity.mjs`, D-019): over 10 min Surge earns 0.81–0.90× Drift's Prisms, ◆ about equal. Open part: late game, when ore near the Nexus runs out. |
| Q-008 | Is Deep rock at ×2 toughness (S-8) a wall for a player with low Beam Power? | Dense rock in the Deep = 5.2 hp, 5 s per cell at Beam 0. Measure time-to-first-Lumen with `__lumen.dev.teleport(60)` after S-8 lands; lower `hpMul` if a Beam 2 core needs > 60 s. |
