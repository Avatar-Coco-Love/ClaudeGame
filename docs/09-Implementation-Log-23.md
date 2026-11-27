# 09 — Implementation Log, part 23

Sessions 159–163 archived word for word in audit 169 (`archive/2026-11-27-09-sessions-159-163.md`); session 164 moved here from part 22 (removed). Newest at the bottom; read the tail only.

## Session 164 — Audit: B-109 thief gets away, rotation check on 02, 09 archive (v1.11.105, D-204)
- 02 said "Build 164"; the rotation makes 164 an Audit (CLAUDE.md wins). New `docs.cjs` check FAILs on the old 02.
- No subagent tool: sweep in-session, newest code first (`hunter.js` S-74b, `surgebot.mjs` / `huntrun.mjs`). No new bug.
- **B-109 (fixed):** `uphill` stops at a local high of the field (a nook by the core). Repro on 30 natural Deep seeds
  (still core, Drift): flee ends 78 / 98 / 150 px on 3 of 27, most at 12–20 field steps. Now a once-per-flee A* to the
  farthest field cell on its side: 615–1027 px on all 27. `tracer.cjs` check: 1.6 cells on the old code, 21.3 now.
- `huntrun.mjs --no-echo` after the fix (parted Pincers flee the new way too): Drift +0.8 / +5.7 / +12.7 %, Surge
  +2.4 / +9.8 / +53.6 %, pooled 6.8 vs 20.3 (0.332) FAIL, floor ok (Deep Surge now > 0). S-74b2b tunes from here.
- D-199…D-203 vs code: match (7 KB cap, `RETREAT` export, 4-cell / 60 s trip, take 24, flee × 1.5, no hunter loot).
- Workflow review: too much: none new; too little: a check on 02's next step (added, D-204). Audit 154 debt closed.
- `09` sessions 154–158 archived word for word (`archive/2026-11-27-09-sessions-154-158.md`); part 21 removed.

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


## Session 167 — Design: play-test M17, S-75 / S-76 measured, S-66 split, Decoy specced (v1.12.108, D-207, D-208)
- Play-test (`?dev`, Max all, 3 Tracers + a Pincer pair, 6 s each, screenshots viewed): Drift Shoal 1000 × 700:
  thefts toast and the thieves flee, hold 30 → 25; Surge Kiln: Integrity 280 → 228, five hunters on the core read
  as one violet blob (Debt watch, `04-…-4`); Drift Kiln on 390 × 844: 30 → 9 held, actions at y 186–236 (S-75 holds).
- Measured S-75's arc rule (`?dev` off, touch, 5 viewports) against the real ⊕ / hint / minimap rects: slot 4 on ⊕
  at 390 × 844 / 375 × 667 / 320 × 568, slot 5 on the hint at 568 × 320; 52 px arc step = 51.96 px chord; the arc
  crossed the spec's stick circle; R 230 → outer 286 px. Fixed rule (keep rects, 54 px chord, R ≤ 215, third arc):
  all five fit, farthest 251 px (❖ 292 at 568 × 320). S-76: landscape map leaves 40 px below, legend goes beside.
- S-66 used format 25, which S-70 took: now 26 in S-66a; toast + ending row → S-66b.
- Q-042 → yes (hunters cost ≥ 10 % in both modes): S-77a/b in `07-…-22`. Q-041 → no. Theft toast overpromises
  since D-206 ("beam it to get it back"): fixed in S-77a.

## Session 168 — Build: S-75 thumb arc (v1.12.109, D-209)
- `thumbarc.js` `arcSlots` + `layoutArc`; touch CSS puts ⟂ ◎ ✦ ◇ ❖ fixed on the arc, glyph-only, ✦ count as a badge,
  the mode name floats 1 s above ⟂ on a switch. Desktop untouched (checked: no inline placement, top-right column).
- Measured keep rects in the browser at six viewports (in `thumbarc.cjs`); node and browser checks pass all rules;
  farthest slots match Design 167 (251 / 244 / 237 / 195, 292). Screenshots 390 × 844 and 844 × 390 viewed: the arc
  hugs the corner, ⊕ and the hint clear.
- **B-111** (fixed): first full smoke 701/710: `touch.cjs` B-034 found ◇ × ❖ (640 × 360) and ◇ × ✦ (844 × 390)
  overlapping: a 54 px chord at ~45° leaves |dx|, |dy| < 44. Slots now keep boxes ≥ 6 px apart; the new 640 × 360
  viewport and box-gap rule in `thumbarc.cjs` fail on the old step. The portrait toast hit the arc (320 × 568,
  375 × 667): moved above the core. Two S-17 position checks superseded (D-209). S-38 / S-29 FAILs were a race (VERSION
  bumped mid-run).
- Observed: in portrait the top-right now holds only the minimap and ♪ ≡; the top quarter is free for the toast.

## Session 169 — Audit: B-112 arc under the notch, tablet landscape, 09 archive (v1.12.110, D-210)
- No subagent tool: sweep in-session, newest code first (`thumbarc.js`, `main.js` `placeArc`, S-75 CSS).
- Tablet landscape (02's first look): 1024 × 768, 1180 × 820, 1366 × 1024, 820 × 1180 all pass every arc rule, farthest
  215 px; screenshot 1024 × 768 viewed: the arc hugs the corner, ⊕ and the hint clear. 1024 × 768 joins the check.
- **B-112 (fixed):** the arc ignored `env(safe-area-inset-*)` (the page sets `viewport-fit=cover`): on a notched phone
  in landscape ⟂'s box ended 8 px from the edge, under a 47 px notch. Now the arc turns round the safe corner; the new
  inset check in `thumbarc.cjs` FAILs on the old code (844 × 390: boxes 836 / 371 in the inset).
- D-205…D-209 vs code: match. Audit 159's watch closed (three audits); hunter blob asked as Q-044.
- Workflow review (D-210): too little: no notch case in touch checks (added); too much: none new.
- `09` sessions 159–163 archived word for word (`archive/2026-11-27-09-sessions-159-163.md`); part 22 removed.
