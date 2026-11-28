# 06 — Decisions log, part 34

Continues `06-Decisions-33.md` (part 33 neared the 8 KB cap at D-223; same rules: supersede, never edit; list rejected
alternatives). D-224 on.

### D-224 — M19 = the Feint, a hunter that reads your beam (Design 182, settles D-196's "next tier")
- Play-test (`huntrun` 3 seeds × 5 min, `--no-echo`): the bot's plain beam killed 21 / 33 Deep hunters in Drift and
  27 / 35 in Surge. Hunters follow the field straight down the beam: aim barely matters, beam modes are damage numbers.
  Screenshot (a Tracer down a 1-wide shaft) read clearly; nothing in it asks the player to think about the beam's line.
- The Feint sidesteps a beam pointed at it (a tell, then a dash; cooldown), never in a 1-wide tunnel. Serves "intent vs
  realized state" (its tell is intent, its dash realized) and "Drift and Surge are equals": hunters exist in both modes
  with each mode's touch. Its counters already exist: tunnels, Wide / Arc, the Echo, a Decoy. Nothing new to buy.
- Specs S-78a…d in `07-Build-Specs-23.md`; M19 → v1.14. Replaces nothing (`01` "new milestones" rule): it deepens M17.
- Rejected: a Nexus-mouth camper and a retreating pack (Surge-only in effect: they hurt, a Drift hunter steals; D-196),
  a beam-predicting reader (the Pincer's flank already leads the core), speccing all three tiers.

### D-225 — The Feint takes the Deep's second Tracer slot, not a new slot
- From the Deep out, `TRACER_CAP_DEEP` 2 becomes Tracer + Feint: the same hunter count, so the cost moves only through
  the dodge, and both world sizes (160 has no Shoal) meet it. S-78b measures it against D-206's gate.
- Rejected: Shoal / Kiln only (a 160 world never meets it), a third slot (more pressure, not a smarter foe; it would
  move D-206's band before the dodge does).

### D-226 — S-78a as built: violet diamond, one Feint at a time, the dash set at once (Build 183)
- Colour: electric violet `150, 0, 255`. Ice cyan (the first pick) failed `colours.cjs` against the Pincer under
  deuteranopia (ΔE 17); a grid search over bright hues: violet clears Tracer / Pincer / Decoy / Ward by ≥ 36 in all four
  visions, and the diamond outline (not the Tracer's arrow) carries it beside the Tracer's violet.
- Slot: from the Deep out the next spawn is a Feint while a Tracer lives and no Feint does, else a Tracer: at most one
  of each, still `TRACER_CAP_DEEP` 2. The dash sets the velocity at once (`FEINT_DASH` × speed): steered in at
  `TRACER_STEER` it would reach full speed only after the 0.35 s dash. Body collision as ever; the Nexus repel wins.
- A lured or fleeing Feint drops its tell / dash; the cooldown runs only while it walks the field. No trail (the Tracer's).
- Rejected: a cyan / mint hue (fails beside Ward lime or the Pincer for colour-blind players), steering the dash (no
  visible sidestep), a Feint able to fill both Deep slots (two readers: more than D-225's "a harder one").
