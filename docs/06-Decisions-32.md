# 06 — Decisions log, part 32

Continues `06-Decisions-31.md` (part 31 neared the 8 KB cap at D-211; same rules: supersede, never edit; list rejected
alternatives). D-212 on.

### D-212 — Build 171: the Decoy (S-77a) locks on, holds by the Decoy's clock
- A hunter locks onto the nearest Decoy it sees (≤ `DECOY_R` 6 cells, clear line from its centre) and keeps it until
  the Decoy is spent or picked up, so a body sliding along a corner does not flip it back to the field each frame. A
  locked hunter that gets no nearer for `GLITCH_GIVE_UP_S` lets that Decoy go and never takes it again.
- The 4 s hold is the Decoy's (starts when the first hunter is within 0.6 cell), not each hunter's: two hunters on one
  Decoy are held together and freed together. Freed hunters restart their give-up clock (the lure was not a stall).
- Lured, a hunter skips the field step entirely (the flank's A* waits); the off-field fade still applies. Circling is
  steering at a point 0.45 cell out turning 4 rad/s. No gap between Decoys (the spec needs none; stacking just chains).
- Colour peach `255, 198, 170` (lowest ΔE 35 vs Ward / Tracer / Pincer, all 4 visions), glyph ◈, map mark a diamond.
- Rejected: a per-frame line re-check (flip-flop at corners), a per-hunter hold (a second hunter would outlast the
  Decoy's 4 s promise), luring the Echo's foes or bosses (spec: hunters only).

### D-213 — Design 172: no count pip for stacked hunters (Q-044); S-77b gets bounds
- Q-044 → **no**. Five Tracers forced onto the core (390 × 844, Surge) do read as one violet blob, but natural play caps
  hunters at 4 (`TRACER_CAP_DEEP` 2 + one Pincer pair), each touch shows on the hull bar (Surge) or the cargo bar and
  theft toast (Drift), so the cost is read where it is paid. Revisit only if a later enemy tier lifts the cap.
- Decoy play-test (S-77a, real tunnel, both modes): +3.9 s to first touch from one Decoy, equal in Drift and Surge; no
  rule change. S-77b's bot places on its own cell; its tuning has bounds (hold ≤ 6 s, R ≤ 8, cost ≥ ▲2 ◆10), and a miss
  inside them ships the measure as a report and splits the fix (S-77b2), never a looser gate.
- Rejected: a count pip (HUD clutter for a case natural play rarely makes), a fan-out draw offset (draws hunters where
  they are not: intent vs realized), unbounded tuning (a 10 s Decoy is a hunter off-switch, D-208's "buys seconds").

### D-214 — Build 173: S-77b's Decoy measure ships as a report; the fix splits to S-77b2
- `huntrun.mjs --decoy` (8 seeds, Deep / Shoal / Kiln, both modes, `--no-echo`): one Decoy per hunter first within 12
  cells, dropped on the bot's cell, stock refilled at each deposit, ◆-eq price off the haul after hull debt. At today's
  numbers it uses 7.6–12.1 Decoys a run, holds 2.8–3.7 hunter-s each and spends 275–437 ◆-eq a run, about 3× the hunter
  cost it is meant to cut: saving −421 % Drift / −596 % Surge (gate ≥ 25 %). Before its price it saves some (Kiln Surge
  26.1 % → 16.5 %), never the whole cost.
- Tries inside D-213's bounds (logged in `09`): hold 6; hold 6 + R 8; hold 6 + R 8 + ▲2 ◆10. Best −246 % / −184 %:
  even the floor price is ~2× the cost, and a longer hold or reach lures more hunters but saves no more haul.
- So (D-213's split rule): the measure is a report row in smoke (`tracer.cjs`, rows + same Deep rows as without
  `--decoy`), the gate line says "decoy FAIL (report)", config unchanged; S-77b2 owns the fix (Q-045), no new lure rule here.
- Rejected: a looser gate (D-213), a price under ▲2 ◆10 or a hold past 6 s (outside the bounds), a smarter bot cue in
  this PR (a measure change is S-77b2's call, else the gate is tuned to the bot, not the Decoy).

### D-215 — Audit 174: placed-list sweeps name every kind; two debt lines closed
- B-113: `boss.js` `refund` listed Beacons / Relays / Sinks / Wards but not Decoys (S-77a added a fifth list), so a
  Decoy in a lair new to its save stayed on the rebuilt floor or plate. Now refunded at `DECOY_COST`; `boss.cjs` check
  fails on the old code. Rule: a new placeable is added to every placed-list loop (craft `blocked`, hud notes, refund).
- Debt: audit 164's watch closed (three audits, D-210's rule); Design 167's hunter blob closed (Q-044, D-213).
- D-210…D-214 vs code: match (`DECOY_R` 6, hold 4 s, near 0.6, orbit 0.45 at 4 rad/s, `lureNo` never retaken).
- Workflow review: too little: no list of "every placed kind" to grep when a placeable lands (rule above); too much:
  none new. Rejected: a shared `PLACED_LISTS` helper now (5 call sites with different shapes; a refactor, not a fix).

### D-216 — Build 175: S-66a Feats derive from saved state; two counters, format 27
- `feats.js` `feats(game)` derives each feat (bosses' `down`, each vault's centre cache cell no longer `T.CACHE`,
  explored share of the cells inside `BORDER`, the highest over-level of any Matrix stat vs `over`); only `stats.kinds`
  (Anomaly-kind bitmask, set on take) and `stats.rifts` (a close with all 9 cells empty) are new, both clamped on load.
- `lairs` lists when the world has bosses, `over` when `profile.overdrive`: a 160 world shows 4. `FEATS`, `FEAT_CHART`
  0.35, `FEAT_RIFTS` 5 in `config.js` (provisional, S-67 tunes). The Nexus tab ends with the text list (✓ / ·).
- Rejected: a saved `feats` done-set (could desync from the world; S-66b's toast keeps an unsaved seen-set), counting
  a rift by `r.mined` (a running total), an Anomaly glyph per line (D-177).

### D-217 — Build 176: S-66b Feats toast on events, an unsaved seen-set
- `checkFeats(game)` (`feats.js`) runs at the end of `Game.update` once per `notify()` of `deposited`, `cache`, `boss`,
  `anomaly` or `rift-close` (`FEAT_EVENTS`, the `featDue` flag; B-115), and in `buy()` (Overdrive). A feat newly done: `featNew`, the
  `feat` event (main.js toast "Feat: <name> (done / N)", KEEP) and `audio.feat()` (the arpeggio's top note, 1319 Hz).
- `featsSeen` is filled from `feats()` when the Game is built (unsaved), so a reload never re-toasts; a mode switch keeps
  the Game, so it can't either. Charted toasts on the next deposit (no per-frame scan of 65 k cells).
- Ending card: "Feats n / N" after Bosses (`endingSummary` `feats` / `featN`).
- Rejected: checking every frame (exploredShare walks the whole map), a saved seen-set (D-216), one toast per feat when
  two finish together (the last one names the count; at most 6 a world).
