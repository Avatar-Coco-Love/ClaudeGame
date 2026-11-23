# 03 — Open Questions

Undecided only. Once a question is settled, remove it here and record the answer as a D-xxx entry in `06-Decisions.md` (cite the Q number).
New IDs continue from the highest one ever used; never reuse an ID.

| ID | Question | Notes |
|----|----------|-------|
| Q-001 | Should Surge give *any* exclusive reward? | Leaning **no**: equal rewards is a pillar (D-002). Maybe cosmetic-only. |
| Q-002 | Does the world end (bedrock at 160 cells) or expand / have "depth layers"? | Bigger maps need the chunk cache to evict (already does) and lazy generation. |
| Q-003 | What is the end goal / "win" state? | Candidate: relight N dormant beacons hidden in the far rings. |
| Q-004 | Multiplayer? | Destructible terrain + co-op was the biggest risk in the original plan. Not before single-player feels finished. |
| Q-007 | Glitch kills are the only *renewable* income (1▲ + 2–4◆ each), Drift's Shards are finite. Does Surge become the "real" game late on? | Session 7, `tools/surgefarm.mjs`: a parked farm makes only 0.2–0.6 kills/min, because Glitches stick on rock (D-015). Re-measure after S-6; fallback there: Glitch Prism drop at 50 %. Full answer needs the bot runner (haul/min in both modes). |
