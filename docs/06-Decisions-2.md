# 06 — Decisions log, part 2

Continues `06-Decisions.md` (same rules: supersede, never edit; list rejected alternatives). D-017 on.

### D-017 — Every Glitch can give up, not only alert ones (2026-11-23, S-6; supersedes D-015)
D-015's rule (no 24 px gain on the core for 6 s → fade, no loot, slot freed) now covers wandering Glitches too, and a contact hit counts as progress. Measured: with alert-only give-up a parked farm stayed at 0.36 kills/min, because the slot-holders were wanderers spawned beyond the 560 px alert range, drifting in rock and never alerted. Applied to all: 4.1–4.7 kills/min, stuck Glitches 30 → 9 (10 seeds × 300 s). D-015 moved to `docs/archive/decisions-1.md`.
- Rejected: alert-only (the spec; measured no effect); spawning inside the alert range (shrinks the 480–740 px spawn ring the player can't see into); despawning wanderers sooner by distance (they sit 700–1500 px, the same as live ones).

### D-018 — Glitch Prism drop is a 50 % chance (2026-11-23, Q-007 fallback)
After D-017 a parked Surge farm hits 4.1–4.7 kills/min at any upgrade level, over S-6's 3/min trigger, so each kill drops a Prism half the time (`GLITCH_PRISM_CHANCE`); Shards unchanged. That is ~2▲/min renewable against 246▲ for a full Matrix. Uses `game.rand()` until S-5 gives it its own stream.
- Rejected: fewer Glitches (Surge would go quiet again, pillar 2); no Prism at all (removes Surge's own reward); a cap per minute (invisible rule, intent ≠ realized).

### D-019 — Keep the 50 % Glitch Prism drop: Surge doesn't out-earn Drift (2026-11-23, audit 9; checks D-018 against D-002)
`tools/parity.mjs`: one greedy bot (tunnel to the nearest ore, sweep loose pickups, home when full, in Surge beam Glitches first) on the same 10 seeds × 600 s per mode.
Prism hunt, ▲/min Drift → Surge: lvl0 8.5 → 6.9, lvl3 14.9 → 13.4, lvl6 21.5 → 18.5 (0.81–0.90×); ◆ 1.3–1.5× in Surge but small next to Prisms' value.
Crystal hunt, ◆/min: 37.0 → 36.6, 51.8 → 48.7, 63.6 → 69.9 (0.94–1.10×). Fighting costs mining time about what the drops pay back. No change.
- Rejected: drop to 25 % (Surge already earns fewer Prisms); a Drift-only bonus to match (no gap to match); calling it settled for the late game (Drift ore near the Nexus is finite, drops are renewable: Q-007 stays open).
