# 06 — Decisions log, part 30

Continues `06-Decisions-29.md` (part 29 neared the 8 KB cap at D-199; same rules: supersede, never edit; list rejected
alternatives). D-200 on.

### D-201 — S-74b1: the hunters' cost levers and a quieter measure; the gate waits for Q-043 (Build 161)
- Drift: a touch takes 24 ◆-worth, richest first (`biteWorth`), fleeing at 1.5 × speed: Drift cost 0 → +6 % all rings.
- Surge: hunters pay no kill loot (Glitches still do): loot made the Surge cost ≤ 0 (they paid to be met).
- `huntrun` runs without natural Glitches: their deaths swung hauls ±10 % per ring, more than the hunters' cost.
- Split: S-74b1 = these; S-74b2 = the gate after Q-043. Surge cost tracks hull vs ring (Deep ~0, Kiln +52 % from heat
  + heal trips), which no hunter number moves evenly.
- Rejected: Drift take 100+ worth to chase Kiln (Deep / Shoal Drift would far outweigh Surge); Surge damage scaled per
  ring (a second tier rule); 20-min runs (gate defined on 10, D-200; costs still out of band); widening the band.

### D-200 — S-74 split: the gate's measure first (S-74a), the tuning after (S-74b) (Build 160)
- **Split:** S-74a ships `tools/huntrun.mjs` (Deep / Shoal / Kiln, Drift and Surge, hunters on vs off, 8 seeds × 10 min)
  and gates only the reach half in smoke (`tracer.cjs`, Deep). The cost half FAILs on the first run, so it is reported
  and S-74b tunes it (with the Echo row and Auto's Defend share). M17 is done when S-74b's cost gate passes.
- **Build `mid`, not `max`:** at the top build the bot beams 75 % of hunters down before they touch (Deep: 126 of 168
  killed, 8 Tracers met), so their cost is noise. `mid` (beam 4) is the Deep player the hunters are for.
- **Time cost = haul without / with − 1** per mode, pooled; the gate is Drift cost / Surge cost in 0.8–1.25. A cost
  ≤ 0 (the hunters' loot outpays them) fails: that face does nothing.
- **Reach is judged where the beeline fails:** at each Tracer spawn a ghost Glitch flies from the same spot at the frozen
  core (D-017's rule). From the bot's open dig sites it reaches 40 %, so "Glitch < 30 %" measures the dig, not the
  hunter. Gate: where the ghost gives up, Tracers make contact on ≥ 80 % (first run: 94 % of 199, all rings). Tracers
  beamed down before contact are left out (the path never got judged).
- First cost numbers (mid, 8 seeds): Drift +0 / +0.5 / +2.7 % (Deep / Shoal / Kiln; 1 item a touch is nothing next to
  ~90 ◆-eq/min), Surge +11 / −2 / −5 % (Glitch loot from kills). S-74b levers: what a Drift touch takes (by worth,
  not 1 item), Surge loot from hunters, `TRACER_S` / `PINCER_S`.
- Rejected: gating the cost half now as-is (fails: needs tuning first); widening the band (hides a Drift face that
  does nothing); the ghost < 30 % as written (the spawns are fine; the bot's dig sites are open rooms).

### D-202 — Hunters' cost gate is pooled over the three rings, with a floor and hull debt (session 162, design; Q-043)
- **Pooled:** S-74b2's gate is Drift / Surge time cost in 0.8–1.25 over Deep + Shoal + Kiln together (sum of hauls,
  same 8 seeds). One player crosses all three; per ring, Kiln's heat is Kiln's cost, not the hunter's. Per-ring
  ratios stay in the report.
- **Floor:** each face costs > 0 in every ring (D-200's rule that a free face fails, now per ring).
- **Hull debt:** a Surge run that ends below full hull owes the retreat it has not paid yet, in time (deficit
  / (1 − RETREAT) × the ring's mean retreat). Measured: Deep ends at 0.65 hull with hunters vs 1.00 without.
- Measured (Design 162, 8 seeds, 10 min, `mid`): pooled Drift +6.2 %, Surge +17.6 % (ratio 0.35). With the hunters'
  damage tier step capped at the Deep's: Surge +9.3 % pooled (Shoal 12 → 5, Kiln 52 → 31), Deep still −6.7 %.
  Paired per-seed cost sd ≈ 11 % (Deep), so a per-ring 8-seed verdict carries ± 4 % of noise.
- Rejected: per ring (no lever set fits all three: Shoal and Kiln share tier 3, the gap is heat); per-ring hunter
  numbers (three tables the player can't read); a wider band (hides a free face); longer runs only (20 min: Deep
  Surge +1.4 %, still the window, not the hunter).

### D-203 — S-74b2 split; B-108 is the measure, not the game; a heal trip includes the way back (session 163, build)
- **Split:** S-74b2a = steps 1–3 (B-108, hull debt, pooled gate + floor); S-74b2b = tune + B-109, VERSION 1.12.0.
- **B-108 closed:** no game bug. On 32 seeds Deep Surge costs −1.1 % (8-seed sets −5.8 / −0.7 / +1.4 / +0.9 %): the
  first 8 seeds are a low draw, and the Deep's damage never forces a retreat in 10 min (4 trips in 8 runs), so it
  was unpaid. Hunter fights mine more cells (+3…6 %); knockback without damage still shifts the route (−4.6 %).
- **Trip price:** a trip runs from turning home until back within 4 cells of where it turned (≤ 60 s after the heal):
  Deep 61 s, Shoal 52, Kiln 58. Each run pays its own debt (deficit / (1 − RETREAT) × trip), with and without hunters.
- Measured (8 seeds, no Echo): Surge Deep −1.0 / Shoal +16.1 / Kiln +54.7 %, pooled Drift +6.2 %, Surge +21.8 %
  (ratio 0.285, FAIL); floor FAIL (Deep Surge ≤ 0). Tuning must raise the Deep's Surge cost, not only lower Kiln's.
- Rejected: heal time only (16 s: a quarter of the trip); the paired difference only (an off run below full hull
  would pay the on run); a 32-seed gate (4× the smoke's run time).
