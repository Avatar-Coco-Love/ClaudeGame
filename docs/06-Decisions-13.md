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

## D-099 — S-35 Anomalies as built (session 68)
- **Sites** come from the *generated* terrain (World constructor output, before Spires are stamped or a save is
  applied), so they are seed-only: rock or dense at the draw, ring-bounded distances (Hearth 9–23, Veil 25–47, Deep
  49–76 cells), ≥ 12 apart, ≥ 1 cell clear of every vault footprint and of the **save-less** Spire choice. An old save
  whose Spires moved (D-024) marks a site inside its own footprint `void` (never drawn or taken); indices stay stable.
- **End** = the deposit tick that empties the cargo (so ≥ 1 item banked, then `endBuffs`); leaving a deposit half done
  keeps the buff. Takes run after the deposit in `update()`, so a buff taken that frame is never ended by it.
- A taken (recharging) site isn't drawn; S-37 adds the hollow minimap dot. Chip glyph ✶ (one per kind, `ANOMALY_KINDS`).
- Rejected: storing sites in the save (seed-only is enough and old saves get them free); a new cell type (D-098);
  ending on the first banked item (cargo half banked would still read as "carrying the buff").

### D-100 — Browser checks wait by game time and pin generated geometry (2026-11-24, session 69, Audit; B-060)
- B-060's two causes: `nearSpire` waited 4 s of wall clock for a toast that runs on game time (dt clamped to 0.05 s;
  6× CPU throttle: 3 of 4 runs read "Entering the Deep"), and a random seed put a second Spire in view (0.6 % of seeds).
- Rule: a browser check that waits for something timed by the game polls `stats.time` (B-006 was the first time); a check
  that assumes generated geometry pins the seed (B-012's `Math.random` stub) and a node check proves the seed fits.
  Guard: the 320 px Spire page runs with `slowFrames` (130 ms busy frames); the old wait fails it every run.
- Rejected: retries or a longer wall-clock timeout (hides the cause, slower); a minimum Spire gap > 12 (changes worlds
  of existing saves for a test's sake; two Spires seen at once is fine in play, the toast counts both).

### D-101 — S-36 Lodestone + Ballast as built and tuned (2026-11-24, session 70)
- Kinds from `seededStream(seed, 'anomaly-kind')`, one draw per placed site (own salt: placement unchanged); 320 sites
  over 20 seeds: 114 / 105 / 101. `ANOMALY_KINDS[id].fx` maps stat → multiplier; `'pull'` scales the Attractor pull
  in `updatePickups`; `stat('cargo')` floors. Ballast's end = the existing full-deposit end (D-099), so no cargo strands.
- Bot (`surgebot --anomaly=on|off|<kind>`): detours to a takeable site ≤ 20 path-s away; `gainMin` = banked + carried
  at the cap (banked alone read Ballast as a loss at 5 min). Mid, 12 seeds × 10 min, gain ÷ off, Drift / Surge:
  mine all 1.048 / 1.067, Overclock 1.041 / 1.057, Lodestone 1.019 / 1.027, Ballast 1.038 / 1.054; deep all
  1.151 / 1.130, Overclock 1.060 / 1.064, Lodestone 1.048 / 1.042, Ballast 1.173 / 1.134. Drift ÷ Surge 0.98–1.04.
  All in bounds (alone ≤ 1.20, all ≤ 1.30): the spec multipliers stay (1.5; 2 + 1.5; 1.5).
- Rejected: Ballast ×2 (tried: mine 0.93 / 0.96, deep Drift ÷ Surge 0.85: longer trips cost the bot more than they
  carry); counting only banked haul (an end-of-run artefact); a stronger kind to make buffs "felt" (budget is a cap).

Continued in `06-Decisions-14.md` (D-102 on).
