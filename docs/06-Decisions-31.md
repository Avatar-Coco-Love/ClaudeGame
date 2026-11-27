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

### D-209 — Build 168: S-75 thumb arc as built
- `src/thumbarc.js` holds the pure `arcSlots` and the DOM step `layoutArc` (not `hud.js`, which only draws the canvas
  HUD); `main.js` re-lays only when touch, the viewport, Large text or the set of shown buttons changes.
- Keep rects: ⊕ is measured even while hidden (out of the Nexus), so the arc never jumps when you dock; the bank panel
  is kept too. ✦'s count rides as a corner badge (the 44 px button is glyph-only).
- Measured: farthest slot 251 / 244 / 237 / 195 px (390 × 844 / 375 × 667 / 320 × 568 / 844 × 390), 292 for ❖ at
  568 × 320, 215 on a 768 × 1024 tablet: the Design 167 figures exactly.
- Slots also keep their 44 px boxes ≥ 6 px apart (B-111: a 54 px chord on the diagonal let two boxes overlap at
  640 × 360 and 844 × 390); the arc is walked in 0.5° steps. Farthest is unchanged but 320 × 568 (236).
- The portrait phone toast moves above the core (`bottom: 50% + 44px`): below it is the arc now. The S-17 checks
  that pinned ◎ ⟂ in the top-right row / column now pin ♪ ≡ there and ◎ ⟂ on the arc (`touch.cjs`).
- Rejected: laying out only the buttons shown in the Nexus (⊕'s place would move them on every dock), a second
  label element for the mode name (the existing `mode-name` floats above ⟂ on touch).

### D-210 — Audit 169: the thumb arc turns round the safe corner (B-112); tablet checked; old watch closed
- `layoutArc` reads the right / bottom safe-area insets from a hidden probe padded with `env()` and lays the arc round
  (w − right, h − bottom). Without it, on a notched phone in landscape ⟂ sat under the notch (box right 836 of 844 with a
  47 px inset) and ❖ on the home bar. `thumbarc.cjs` fakes the insets on the probe; it fails on the old code.
- 1024 × 768 tablet landscape measured (all five on the 215 px arc, every rule met; 1180 × 820, 1366 × 1024, 820 × 1180
  too): added to the arc check's viewports. Screenshot viewed.
- Audit 159's watch line closed (carried three audits). Hunter blob → Q-044, not a slice now.
- D-205…D-209 vs code: match (tier max 1, take 30, return 0.85, arc constants and order).
- Workflow review: too little: touch layout checks ran only at bare viewports, never with a notch; now one inset case
  per orientation. Too much: none new.
- Rejected: CSS-only insets on each button (the arc is placed by inline left / top, so CSS can't move it), reading
  `visualViewport` (it does not report the notch), a top inset (the arc never reaches the top on a phone).

### D-211 — Build 170: the map legend (S-76) comes from the draw's own marks
- `drawMinimap(r, canvas, ctx, kinds)`: given a Map, a `note(kind, x, y, colour)` records each mark drawn inside the
  window (a 256 world's map shows a 160 window: a Spire outside it is not on the map, so not in the legend). Anomaly,
  lair and Spire helpers take `note`; placed things, pings, rift and the chart counts are noted in `hud.js`.
- `maplegend.js` draws each glyph with the map's own shape at 1.6× on a small canvas (side by side for each colour
  seen: ore pings, Anomaly kinds, the two lairs). Built on open and when the size or Large text changes, not per frame.
- Layout: landscape, an absolute column right of the map, overflow to one left of it; portrait, a wrapped row under
  the map, with 100 px reserved off the map's side (≤ 4 lines at 320 × 568, Large text too).
- Rejected: a fixed full legend (spoils discovery), text glyphs (⬟ ⯃ are missing from many phone fonts), a second
  world scan on open, putting the legend on the small minimap (no room).
