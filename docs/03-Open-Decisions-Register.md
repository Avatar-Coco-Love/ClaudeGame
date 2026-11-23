# 03 — Open Questions

Undecided only. Once a question is settled, remove it here and record the answer as a D-xxx entry in `06-Decisions.md` (cite the Q number).
New IDs continue from the highest one ever used; never reuse an ID.

| ID | Question | Notes |
|----|----------|-------|
| Q-001 | Should Surge give *any* exclusive reward? | Leaning **no**: equal rewards is a pillar (D-002). Maybe cosmetic-only. |
| Q-002 | Does the world end (bedrock at 160 cells) or expand / have "depth layers"? | Bigger maps need the chunk cache to evict (already does) and lazy generation. |
| Q-003 | What is the end goal / "win" state? | Candidate: relight N dormant beacons hidden in the far rings. |
| Q-004 | Multiplayer? | Destructible terrain + co-op was the biggest risk in the original plan. Not before single-player feels finished. |
| Q-006 | Keep synthesized audio, or move to a free recorded sound pack? | Gloamdeep found synthesized sounds never pleased its owner. Needs a design-session listen-test (record clips with Playwright). Recorded files would be the game's first binary assets (decide licence + size budget). |
| Q-007 | Glitch kills are the only *renewable* income (1▲ + 2–4◆ each, endless respawns), while Drift's Shards are finite (~2750◆ per world vs 2482◆ to max the Matrix). Does that make Surge the "real" game late on? | Measure first: Surge bot runner, haul/min in both modes. Candidate fixes: Glitch drops Prisms only; a renewable Drift source (aurora, M6); slow crystal regrowth in both modes. |
