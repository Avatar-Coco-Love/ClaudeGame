# 09 — Implementation Log, part 8

Continues `09-Implementation-Log-7.md` (split at the 8 KB cap, session 62). Newest at the bottom; read the tail only.

## Session 62 — Design: Relay reclaim specced (v1.0.1, #67)
- Q-018 (player request: "is the Relay just there forever?") → D-092 + S-34 (pick up in its ring, free, no save change).
- Play-tested the v1.0 arc from the smoke screenshots (ending sequence + card at 2 sizes, cycle-1 Nexus, title line).
  Seen: the card's "0m 00s" is the test's instant relight, not a bug; the overview map is mostly dark on a fresh world
  (only explored cells show) — fine: it is the player's own map.
- cycle.cjs pinned the title version to 'v1.0.0' (failed at 1.0.1): now reads VERSION. Smoke 273/273.
