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
