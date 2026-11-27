# 09 — Implementation Log, part 23

Part 22 holds sessions 159–164. Newest at the bottom; read the tail only.

## Session 165 — Build: S-74b2b1, hunter tuning first slice (v1.11.106, D-205)
- Tries, `huntrun.mjs --no-echo`, 8 seeds, pooled Drift / Surge % (ratio), Deep / Shoal / Kiln:
  - base (audit 164): 6.8 / 20.3 (0.332).
  - damage tier cap 1, take 24: 6.8 / 17.2 (0.392); Surge −1.3 / 16.1 / 37.0, Kiln 33 % before debt.
  - + take 36: 13.0 / 17.2 (0.756); Drift 3.7 / 18.1 / 15.8 (Shoal past +12 %).
  - all stats capped at 1 (hp, speed, damage), take 24 / 30: 1.7 / 0.1 and 0.4 / 0.1: slow hunters are nearly free.
  - hp + damage capped at 1, take 24 / 36: −0.2 / 6.3 and 0.5 / 6.3: the Drift bot kills thieves and gets it back.
  - hp + damage capped at 2, take 24 / 30: 2.1 / 11.8 (0.175), 2.8 / 11.8 (0.239).
  - damage cap 1, take 30: 10.2 / 17.2 (0.590). **+ Surge kills 2 ◆: 10.2 / 12.2 (0.830) ok**; floor FAIL Deep Drift
    (−1.0 %; +0.8 % at take 24: Deep Drift sits on 0 in seed noise). Kept (D-205).
- Observed: hp is the lever on both faces (a Drift thief killed returns all it took); damage barely moves the Kiln.
- `tracer.cjs`: a tier-3 Tracer hits 14, hp 4.5 (FAILs on the old code: 26). Damage checks in `tracer` / `pincer`
  use the capped step. No visual change (no screenshot).

## Session 166 — Build: S-74b2b2, Deep floor + Drift ceiling; M17 done (v1.12.107, D-206)
- Lever: a killed thief drops back `TRACER_RETURN` of its carry, keeping its best. Tries (`huntrun.mjs --no-echo`):
  - 0.5, Deep only: Drift 15.1 % / Surge 0.6 %. 0.75: pooled 18.0 / 12.2 (1.474), Drift 15.5 / 23.1 / 15.3.
  - **0.85: pooled 12.4 / 12.2 (1.011) ok; Drift 6.6 / 12.8 / 16.5, Surge 0.6 / 9.1 / 26.1; floor ok.** Kept.
- Observed: Drift cost is steep in the return share (0.75 → 0.85 halves Deep Drift); Shoal Drift jumps between tries
  (12.8 ↔ 23.1 %), seed noise in what the bot kills back. Deep Surge 0.6 % is thin but > 0 (hull debt carries it).
- Ceiling call: 18 % per ring (D-206), gated. `tracer.cjs`: the drop check FAILs on the old code (all returned);
  new check runs the full 3-ring gate (≈ 44 s, beside the smoke). No visual change (no screenshot).
- **B-110** (fixed): first full smoke 703/705: `craft.cjs` pressed B 100 ms after a teleport and no frame had read it
  (`placeResult` still 'nexus', nothing placed) under the added gate's load; it now waits for the result.

