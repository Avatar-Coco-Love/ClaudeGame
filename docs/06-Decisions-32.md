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
