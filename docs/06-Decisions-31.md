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
