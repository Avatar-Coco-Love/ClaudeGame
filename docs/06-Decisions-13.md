# 06 — Decisions log, part 13

Continues `06-Decisions-12.md` (same rules: supersede, never edit; list rejected alternatives). D-095 on.

### D-095 — Context budget: ≤ 3 PRs per conversation, orchestrate the rest (2026-11-24, session 64 wrap-up; owner request)
- Sessions 55–64 ran as 10 PRs in one conversation and reached ~475k tokens of context (≈25 full smoke runs, ~15
  screenshots, 9 subagent reports, long edit scripts). The old rule ("wrap up if context gets large") never fired:
  a session can't see its token count. Now countable: ≤ 3 PRs built per conversation; more → a fresh subagent per PR
  that replies in ≤ 10 lines; iterate on one test file, full smoke once per PR, one screenshot per visual change (CLAUDE.md).
- Rejected: a token threshold (not observable from inside); one PR per conversation (too much owner overhead).

### D-096 — S-32 Spitter as built (2026-11-24, session 65)
- A Spitter is a Glitch with `spitter: true` (`spitter.js`); glitch.js keeps spawn, give-up, loot and Nexus repel.
  Bolts live in `game.bolts` (not saved, cleared on Drift and death); beam.js aims at `beamFoes` (Glitches, then bolts).
- It eases to its 200 px hold over 90 px and backs off at ≤ 0.4× speed inside it (a hard stop overshot to 150 px).
  It fires only with a clear line inside 320 px; holding near 200 px counts as progress (else D-017 faded it in 6 s).
- Measured (`surgebot --route=deep`, new: mines only tier ≥ 2 ore; 8 seeds × 10 min): deaths/min start 0.112 →
  0.150, mid 0 → 0 (all ≤ 0.2); `mine` mid stays 0 (it never reaches the Deep). The bot now beams bolts in reach too.
- Rejected: bolts as entries in `game.enemies` (would count against the cap, the Wake and kill stats); firing blind
  into rock (wasted tells, unreadable); a separate rng stream for the roll (the spec names `glitch-spawn`, D-087).
