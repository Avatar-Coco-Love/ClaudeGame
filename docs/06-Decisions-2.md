# 06 — Decisions log, part 2

Continues `06-Decisions.md` (same rules: supersede, never edit; list rejected alternatives). D-017 on.

### D-017 — Every Glitch can give up, not only alert ones (2026-11-23, S-6; supersedes D-015)
D-015's rule (no 24 px gain on the core for 6 s → fade, no loot, slot freed) now covers wandering Glitches too, and a contact hit counts as progress. Measured: with alert-only give-up a parked farm stayed at 0.36 kills/min, because the slot-holders were wanderers spawned beyond the 560 px alert range, drifting in rock and never alerted. Applied to all: 4.1–4.7 kills/min, stuck Glitches 30 → 9 (10 seeds × 300 s). D-015 moved to `docs/archive/decisions-1.md`.
- Rejected: alert-only (the spec; measured no effect); spawning inside the alert range (shrinks the 480–740 px spawn ring the player can't see into); despawning wanderers sooner by distance (they sit 700–1500 px, the same as live ones).

### D-018 — Glitch Prism drop is a 50 % chance (2026-11-23, Q-007 fallback)
After D-017 a parked Surge farm hits 4.1–4.7 kills/min at any upgrade level, over S-6's 3/min trigger, so each kill drops a Prism half the time (`GLITCH_PRISM_CHANCE`); Shards unchanged. That is ~2▲/min renewable against 246▲ for a full Matrix. Draws from `game.rng['glitch-loot']` (D-025).
- Rejected: fewer Glitches (Surge would go quiet again, pillar 2); no Prism at all (removes Surge's own reward); a cap per minute (invisible rule, intent ≠ realized).

### D-019 — Keep the 50 % Glitch Prism drop: Surge doesn't out-earn Drift (2026-11-23, audit 9; checks D-018 against D-002)
`tools/parity.mjs`: one greedy bot (tunnel to the nearest ore, sweep loose pickups, home when full, in Surge beam Glitches first) on the same 10 seeds × 600 s per mode.
Prism hunt, ▲/min Drift → Surge: lvl0 8.5 → 6.9, lvl3 14.9 → 13.4, lvl6 21.5 → 18.5 (0.81–0.90×); ◆ 1.3–1.5× in Surge but small next to Prisms' value.
Crystal hunt, ◆/min: 37.0 → 36.6, 51.8 → 48.7, 63.6 → 69.9 (0.94–1.10×). Fighting costs mining time about what the drops pay back. No change.
- Rejected: drop to 25 % (Surge already earns fewer Prisms); a Drift-only bonus to match (no gap to match); calling it settled for the late game (Drift ore near the Nexus is finite, drops are renewable: Q-007 stays open).

### D-020 — Reduced motion implies no shake; the legacy mute key is removed after migration (2026-11-23, S-3 build)
Every shake goes through `game.addShake()`, which does nothing when shake is off **or** reduced motion is on, so one switch can't
leave the other half-working. Reduced motion also adds `body.reduce-motion` (no CSS animations/transitions). On first run the old
`lumencore.muted` pref is folded into `lumencore.settings.v1` and deleted, so there is one place for one setting (D-016).
Volume 0–100 maps linearly to master gain 0–0.5 (`config.js`); 70 is the old fixed level, so nobody hears a change.
- Rejected: shake switch and reduced motion independent (reduced motion with shake on would still shake the screen); keeping the
  legacy key in sync (two writers); a log/curved volume taper (synth levels are already tuned at 0.35; revisit with S-4 sounds).

### D-021 — S-4 feel: the deposit is the count-up; hitstop lives in the main loop (2026-11-23, S-4)
The bank already counts up one unit per 35 ms while cargo streams into the Nexus, so no second 0.4 s tween was added. The arpeggio
plays once when the hold empties: kinds deposited + 1 notes (max 3), so it rises a step further when Prisms came home too.
Hitstop is a real-time timer that `main.js` honours by skipping `game.update()`; tools that step the game directly never pause.
Reduced motion turns off hitstop and the core ring (shake was already off); sounds stay, and the pip flash (a CSS animation) goes
with `body.reduce-motion`'s blanket rule.
- Rejected: a tweened bank number (fights the per-unit stream: the number would lag what is in the bank); one arpeggio note per
  unit (that is the existing tick); hitstop inside `game.update()` (would freeze bots and the parity tool's clock).

### D-022 — Depth comes from rings inside the 160-cell world (2026-11-23, Design 12; settles Q-002)
The world keeps its bedrock border. It gets visibly deeper through three rings by distance (Hearth < 24, Veil 24–48, Deep ≥ 48 cells),
each with its own rock palette and rock toughness (×1 / ×1.4 / ×2, ore unchanged), named on entry and on the minimap. Measured:
a far room 62 cells out looked exactly like the start, so distance currently means nothing on screen.
- Rejected: a 256×256 world now (no throttled perf numbers yet; Debt "Render cost"); endless chunked generation (a new tech risk with
  nothing to fill it); rings as pure palette (no reason for Beam Power once the inner rock is gone).

### D-023 — World generation changes keep what a save has seen (2026-11-23, Design 12)
A new generator may **re-type** solid cells anywhere (rings, Lumen), because the empty/solid layout stays the same and tunnels still line up.
It may **change the layout** (vaults) only where the save has neither explored nor broken a cell; the save upgrade records the skipped
vaults once (`vaultSkip`) so a vault never appears or vanishes between loads.
- Rejected: a frozen generator per save (old players would never see Lumen or vaults, so Research would be out of reach); regenerating
  freely (the explored minimap would lie and caves would close around old tunnels); deciding skips at every load from the explored
  bitset (exploring a vault would delete it on the next load).

### D-024 — Lumen arrives next to its sink; vault loot uses today's currencies (2026-11-23, Design 12)
Pillar 4 says a layer closes its loop before the next starts, so S-10 Lumen and Research v1 ship back to back with no build between them.
Vaults (S-9) pay 20◆ + 6▲, equal in both modes (D-002), so they are useful the day they ship.
- Rejected: Lumen first and Research "later" (a currency with nothing to buy); Lumen in vault caches (ties S-9 to S-10); a
  Surge-only vault guard (Surge would get the harder path to the same loot; M6 owns Surge depth).

### D-025 — Gameplay randomness: one seeded stream per draw (2026-11-23, Build 13, S-5)
`game.rng` holds five streams, `seededStream(worldSeed, salt)` (FNV-1a salt hash mixed with the seed, then mulberry32): `yield`,
`pickup` (scatter), `glitch-spawn` (timer + place), `glitch-wander`, `glitch-loot` (D-018 Prism roll). Particles and shake stay on
`Math.random` (visual only). Same seed + same input = same run, so bots and smoke can compare runs. Streams restart on load.
- Rejected: one shared seeded stream (an extra roll anywhere shifts every later draw); keeping `Date.now()` salting (runs not
  reproducible); saving stream state in the save (needs a `SAVE_FORMAT` bump for no player benefit; a restart replays nothing a
  player can steer, since which cell breaks next is up to them).

### D-026 — Floor pickups are part of the save; dropped cargo ignores the pickup cap (2026-11-23, audit 14, B-005/B-011; the "≤ 140" bound corrected by D-111)
Every pickup on the floor is saved as `[kind, x, y]` (0 = Shard, 1 = Prism) and comes back at rest, ready to collect (`SAVE_FORMAT` 3).
A death's cargo scatter skips `PICKUP_CAP`; it is bounded by the hold (≤ 140), so the list can't grow without limit.
- Why: Surge's promise that dropped cargo can be recovered broke on reload, and S-9 caches drop loot as pickups.
- Rejected: evicting the oldest pickup at the cap (loses other loot instead); saving velocity/age (no player benefit, bigger save);
  dropping cargo straight into the bank on reload (removes the retrieval run Surge is built on).
