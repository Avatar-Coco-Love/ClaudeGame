# 06 — Decisions log, part 31

Continues `06-Decisions-30.md` (part 30 neared the 8 KB cap at D-205; same rules: supersede, never edit; list rejected
alternatives). D-206 on.

### D-206 — S-74b2b2: a killed thief keeps its best, Drift ceiling 18 % per ring; M17 done (Build 166)
- `TRACER_RETURN` 0.85: a hunter killed drops back only 0.85 of what it carries, the cheapest part; it keeps
  floor(n × 0.15) of its most valuable items (a Ward's kill too; supersedes D-152 / D-154's "drops what it took" in part).
  The Deep floor failed because the Drift bot killed nearly every Deep thief and took it all back (−1.0 %).
- Ceiling: the spec's +12 % per ring Drift ceiling (D-202) becomes **18 %**, gated in `huntrun.mjs` with the band and
  floor: Shoal / Kiln sat at 14 / 16 % before this change and the pooled band is the two-faces rule (D-158); 12 % would
  fail rings that pass the band.
- Measure (`huntrun.mjs --no-echo`, 8 seeds): pooled Drift 12.4 % / Surge 12.2 % = 1.011; Drift Deep / Shoal / Kiln
  6.6 / 12.8 / 16.5 %, Surge 0.6 / 9.1 / 26.1 %: cost PASS. The full 3-ring gate now runs in smoke (`tracer.cjs`).
- Rejected: return 0.5 (Deep Drift 15.1 %), 0.75 (pooled 1.474, Shoal Drift 23 %); a carried item that decays while
  the thief flees (a timer per item, harder to read); keeping the +12 % ceiling (Kiln Drift fails at every return tried).

### D-207 — Design 167: S-75's arc rule measured and fixed; S-76 beside the map; S-66 split
- Play-test (Design 167, `?dev`, 3 runs: Drift Shoal, Surge Kiln, Drift Kiln on a 390 × 844 phone, hunters + a
  Pincer pair): thefts toast and run, Surge Kiln took 52 of 280 Integrity in 6 s with five on the core. The actions on
  the phone sit 610+ px from the grip (y 186–236), as Design 157 measured: S-75 stands, next.
- S-75's rule as written failed its own smoke on paper: slot 4 landed on ⊕ (390 × 844, 375 × 667, 320 × 568), slot 5
  on the hint (568 × 320), a 52 px arc step gives a 51.96 px chord (< the 52 px gap), the arc crossed the fixed
  "stick circle", and R 230 put the outer arc at 286 px. Now: `keep` rects (⊕, minimap, ♪ ≡, a reserved 2-line hint
  box), slots skipped not stopped, a 54 px chord, R ≤ 215, a third arc for the rarest slot, a 140 px grip disc.
  Measured with the fix: all five fit on the five viewports, farthest 251 px (292 for ❖ at 568 × 320).
- S-76: `side()` leaves 40 px under the map in landscape, so the legend goes beside it there (under it in portrait);
  the kind list is the 12 `drawMinimap` draws.
- S-66 → S-66a (derive, count, list; format 26, not 25: S-70 took it) and S-66b (toast + ending row).
- Rejected: shrinking the buttons to fit the old rule (44 px is the touch floor, D-058); moving ⊕ off the bottom
  centre (it is the most-read button near the Nexus); a legend under the map in landscape (no room without shrinking it).

### D-208 — Q-042: the Decoy joins as S-77a/b; Q-041 settled no (Design 167)
- S-74's numbers (D-206): hunters cost 12.4 % (Drift) / 12.2 % (Surge) pooled, Kiln Surge 26 %, ≥ Q-042's 10 % in both
  modes. The Decoy (`07-…-22`): a one-use lure a non-fleeing hunter with a clear line ≤ 6 cells steers at and circles
  for 4 s, then it is spent. Hunters only (both modes); measured by `huntrun.mjs --decoy` (≥ 25 % saving, band
  0.8–1.25). After S-76, before S-66a.
- Q-041 (should a Tracer outrun a max-Thrust core?): **no**. The cost lands in band at 0.8 × Glitch speed: it
  hunts the miner who stops, as leaned.
- Rejected: a lasting Decoy (hunters stop mattering), luring Glitches (Surge-only), a field per Decoy (D-198), Decoy
  after M18 (M17's loop would stay open across a milestone, D-181), "later" for Q-042 (its own condition is met).
