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

### D-097 — S-33 Weather as built; M6 shipped → v1.1 (2026-11-24, session 66; implements D-087)
- `weather.js`: event k starts at the sum of k + 1 gaps (300 + 120·rand s, `rng['weather']`) of `stats.time`, so a
  reload resumes the schedule and nothing new is saved (no SAVE_FORMAT bump). The face follows the mode (storm in
  Surge, aurora in Drift); a Wake or the ending cancels the event in progress, and one due inside them is skipped.
- Tuned by `surgebot` (`--weather=on|off`, mid, 16 seeds × 6 min, haul/min boost while on): spec values (spawn ×0.6,
  aurora +1 every break) gave mine aurora +46 %, deep storm +46–52 %. Built: **spawn ×0.75, cap +2; aurora +1 at 40 %**
  (`rng['aurora']`, Shard / Prism cells only: Lumen stays a fixed world budget) → mine storm +0 % / aurora +23 %,
  storm ÷ aurora haul 0.89; deep storm +15 % / aurora +13 % (boost ratio 1.02). Smoke: ratio 0.92 (6 seeds).
- Darkness tints (violet / teal) are subtle: first tries washed the dark into a visible colour and showed the map.
- M6 = S-32 + S-33 (D-087); Swarm / Burrower were "later" ideas, now in Later → M6 ✅, VERSION 1.1 (D-046).
- Rejected: a saved event timer (save bump for a 40 s effect); +1 on every aurora break (+46 %); cap +1 (spawn rate,
  not cap, drives the storm's haul); tinting the dark as strongly as first drawn (it lit the map).

### D-098 — Design 67: weather play-test, Q-019 settled; M7 = Anomalies (2026-11-24, session 67, Design)
- Play-test (`surgebot`, 8 seeds × 6 min, weather forced on ÷ off, haul/min): mine start/mid drift (aurora) +13 / +16 %,
  surge (storm) +3 / +7 % with kills/min +67 / +50 %; deep start/mid drift +16 / +2 %, surge +20 / +9 %. All ≤ +25 %.
  Screenshots: aurora's teal dark + ore shimmer and the storm's violet both read without lighting the map.
- **Q-019 → no:** a shallow storm pays little haul but brings ~1.5× the fights; shallow Surge stays calm by design.
  Rejected: extra loot in a storm near the Nexus (a Surge-only reward, Q-001); weakening the Nexus repel (D-002).
- **M7 shape (S-35…S-37):** 16 seeded Anomaly sites (entities embedded in rock, no layout change), 3 kinds that scale
  one Matrix stat each (Overclock beam ×1.5, Lodestone magnet, Ballast cargo) until the next deposit that banks
  anything; sites recharge after 300 s of play. Same in both modes; death doesn't end a buff (Drift can't die).
- Rejected: timed buffs (a clock to watch; the deposit already closes the loop, Q-020 open); one-shot finite sites
  (M7 would empty out by mid game); Anomalies as Glitch drops (a Surge-only source); a random kind per recharge (saved
  RNG state for no play value); a 4th kind for thrust (three closes the loop, pillar 4); Anomaly as a new cell type
  (changes layout under old saves, D-024).
