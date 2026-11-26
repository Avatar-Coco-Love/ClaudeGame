# 09 — Implementation Log, part 21

Continues part 20 (it neared the 8 KB cap at session 147). Newest at the bottom; read the tail only.

## Session 147 — Design: Echo play-test, S-71 measure refined, Q-039 closed (v1.10.88, D-186)
- Probe (scratch, deleted): surgebot `deep`, mid, Echo order × levels 0 / 2 (all rows), gain = banked + carried.
  16 seeds × 5 min, Surge: no Echo 37.1, Mine 44.8 / 48.2, Defend 36.5 / 36.8, Auto 44.9 / 47.8 gain/min (L0 / L2);
  mean damage/min 19.4, 15.1 / 16.3, 12.2 / 13.1, 12.5 / 10.9. Drift (8 seeds): none 30.2, Auto 39.0 / 42.6.
- Observed: ore credit gives the Echo 55–77 % (the core's beam is in rock while it tunnels); the added gain is 17–29 %.
  Defend costs no gain vs no Echo. Auto switches ~6 / min in Surge, defends ~14 % of the time, ~0.4 / min in Drift.
  8-seed damage medians are noise (17.2 vs 10.4 on two seed sets), hence means over 16 in S-71.
- Field BFS (node): bound 24 0.03 ms, 32 0.08 ms, all open 0.1 ms. Screenshot (`echoorder` shot): Auto · Defend chip,
  1 px ring legible, Glitch held off. No bug found.
- Specs: S-71 rewritten (share = added gain, means, run list); S-72 keeps the Echo's own BFS, S-73 moves it; Tracers in
  `beamFoes` make Auto defend in Drift too; S-74 reports an Auto-Echo row. D-186; Q-039 closed (no).
