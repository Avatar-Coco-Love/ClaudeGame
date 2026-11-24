# 06 — Decisions log, part 11

Continues `06-Decisions-10.md` (same rules: supersede, never edit; list rejected alternatives). D-079 on.

### D-079 — Q-016 closed: the feed is 8 ▲/s whatever the source (2026-11-24, session 52, Design; keeps D-070)
- Measured (`tools/spireloop.mjs`, 20 seeds, mid build, nearest Spire): the route to primed takes a median 4.5 min with
  20▲ banked, 2.0–2.5 with 50▲, 5.3–5.5 with none, in both modes; the feed itself is 10 s of it. 33–82 % of the 80 came
  from cargo, so a trip still delivers; Prism cells near a Spire hold ~30–45▲ within 18 cells, so the bank is needed.
- Rejected: cargo ▲ feeding faster (saves seconds on a minutes-long route; a second rate to learn); cargo-only feeding
  (D-070's reason stands: on-site ▲ is under 80 for most Spires).

### D-080 — S-28: only the aim ray flips a facet; the primed hint names the rule (2026-11-24, session 52, Design)
- `tools/facetprobe.mjs` (2000 seeds × 5): every start pattern needs exactly `SPIRE_TAPS[i]` taps (3: 4000, 4: 4000,
  5: 2000), never already solved, 56–70 distinct patterns per Spire; all 256 masks reachable; `FACET_RING` matches
  `spireTypeAt`; a start-build Focus ray (96 px) reaches all 8 facets from the interior. But Wide's 3 rays had two facets
  as first hits in 4.6 % of aims, so one beam would flip two facets (and their neighbours) at once and read as a bug.
- So a facet toggles only from the aim (centre) ray, or once from a Pulse burst that stops on it; side rays spark.
  While the core stands in a primed Spire, the hint line says "Beam a facet: it flips with its two neighbours. Light all 8."
- Rejected: every ray toggles (accidental doubles); refusing Wide inside a Spire (a mode switch for one puzzle); no hint
  (play-test: the lit/unlit pattern reads, the neighbour rule does not).

### D-081 — Relit Spires record their path in S-28, not S-24 (2026-11-24, session 52, Design; amends S-24's save)
- S-28 adds `mode` to a Spire's record when it relights (`'drift' | 'surge' | 'broken'`) and bumps `SAVE_FORMAT` with an
  upgrade step: a lit Spire without `mode` gets `'broken'` (before S-28 only broken Spires could relight). The puzzle
  writes the game mode it was solved in (Surge too until S-23, D-055); S-23's Wake writes `'surge'`. S-24's save then adds only `ended`. Each PR owns the field it fills.
- Rejected: one bump in S-24 (S-28 and S-23 would relight Spires with no record of how, and S-24 would have to guess).

### D-082 — The Surge bot (S-30) and its `spire` route (2026-11-24, session 52, Design; applies D-019, D-055)
- `tools/spireloop.mjs` (this session) is the seed: a straight-line greedy bot stuck on 25 % of seeds (dense corners,
  unbreakable cells), and with Glitches ignored it died ~5 times per Surge run. S-30 plans paths (dig cost) and fights.
- Rejected: tuning S-23 by hand in the browser (not repeatable; Q-007 needs both modes measured the same way).

### D-083 — S-28 as built: dwell ring, Pulse counts a primed facet, relit look (2026-11-24, session 53, Build; applies D-080, D-081)
- A facet toggles after `SPIRE_TAP_S` 0.35 s of centre-ray contact, then latches until the ray leaves; a ring fills
  round the aimed facet meanwhile (feedback for thumbs). Measured: the widest centre-ray window per facet from some
  interior cell is 45–90°, so the aim stick needs no assist. Lit Spires keep all 8 facets drawn lit.
- B-036 amended: `pulseInReach` counts a **primed** facet, so a held full Pulse fires at it (one toggle); dormant or lit
  facets still never count. Relit = core filled + still, `SPIRE_LIGHT` 260 px hole, floor glow `SPIRE_LIT_RGB`
  (`game.spireLights` = `R.lightSets[2]`), minimap hexagon filled, chime G4-B4-D5 sine (peak −31.8 dBFS, 0.15 s loud).
- Surge (D-055 interim): the same puzzle, Glitches still spawn, `mode` 'surge'; nobody is stuck before S-23.
- Rejected: a toggle on beam start (a sweep across facets flips them); aim snapping to facets (windows already wide);
  letting a full Pulse wait at a primed facet as at bedrock (the burst does something there, B-036's reason is gone).

### D-084 — Audit 54: one toggle per aim, phone toast band, tap answers first (2026-11-24, session 54, Audit; amends D-083, D-073)
- D-083's "one toggle" holds per aim for every beam: a Pulse burst that toggles a facet latches it (`beam.facetLatch`);
  while the held aim rests on it a full charge waits, and a charge let go there is dropped unfired. Letting go and
  pressing again is a new aim. A Glitch on the centre ray pauses Focus/Wide's dwell latch instead of clearing it.
  Rejected: a Pulse cooldown per facet (time-based, not aim-based); never counting facets in `pulseInReach` (B-036 again).
- Phone toasts (D-073): portrait just below the core (50 % + 40 px), landscape under the bank panel, left of the core;
  desktop keeps top 30 %. Rejected: a narrower centred toast (≤ 124 px at 320 wide); placing it by JS measurement.
- A `now` toast (answer to a key/tap) shows at once even over a `keep` milestone, which returns for its rest (≥ 1.5 s).
- All D-001…D-083 re-checked against the code in audit 54: they match.

### D-085 — S-30: how the Surge bot plays (2026-11-24, session 55, Build; implements D-082)
- `tools/surgebot.mjs` sees the whole grid (an oracle, not the explored map): it measures balance, not exploration.
  A* cost is seconds: crossing time (CELL / thrust) per cell + remaining hp / beam dps per solid cell; bedrock, vault
  shell + cache, Spire core + facets are walls (the Spire shell can be cut). Stuck = no move ≥ 8 px, no break and no
  beam damage for 5 s (so slow digs don't count); re-plan once, then skip the goal.
- `spire`: when no prism cell is left within 24 cells, it takes the nearest prism anywhere by path cost (3 of 12
  seeds need it) instead of stopping. It feeds at ≥ 8▲ carried, or when full / out of targets.
- Rejected: unit cost per open cell (spec text; mixes cells with seconds, so a 1-cell detour outweighed a 3 s dig);
  pathing over explored cells only (needs an exploration policy, out of scope); stopping when the 24-cell ring runs dry.

### D-086 — S-23 Spire Wake, as built (2026-11-24, session 56, Build; implements D-055, D-071)
- `src/wake.js`. A Wake starts when the core enters a primed Spire's interior in Surge (`game.wake`, never saved). Lanes:
  6 rows × 3 past each gap, a row cleared whole or the lane stops (bedrock, vault, any Spire cell); ore drops its yield
  (`game.dropYield`). Lanes ≥ 3 spawn in turn every 1.6 s, ≤ 6 alive, tier by the Spire's depth. Wake Glitches chase
  the core (contact −10 of 100, lootless burst) unless the player core is within 3 cells; natural spawns pause.
- Fails: charge 0, core death, leaving Surge. Then `game.wakeBlock` holds that Spire until the core steps out; a load
  inside an interior sets it too (a reload mid-Wake = failed). 40 s → `relightSpire(…, 'surge')`. Surge facets don't toggle.
- Feedback: facets show the clock (one per 5 s), an orange charge ring round the core, toasts start/fail, a hint.
- Tune (bot guard, 12 seeds): fail 20 % start, 0 % mid/max; primed → relit 0.7 min. Kept as the first tune; Q-017.
- Rejected: Wake Glitches always chasing the player (no reason to guard); a charge bar in the HUD (the ring sits on
  the thing being guarded); restarting at once after a fail (a wipe would loop with no breath).

Continued in `06-Decisions-12.md` (D-087 on).
