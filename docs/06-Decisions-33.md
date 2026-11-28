# 06 — Decisions log, part 33

Continues `06-Decisions-32.md` (part 32 neared the 8 KB cap at D-217; same rules: supersede, never edit; list rejected
alternatives). D-218 on.

### D-218 — Design 177: Q-045 settled; the Decoy holds without touching and comes from a Nexus level (S-77b2)
- Measured (`huntrun --decoy`, Deep / Shoal / Kiln, both modes, `--no-echo`, 8 and 16 seeds; table in `09`): every
  per-use price loses (−377 % … −684 % saving: 7–13 Decoys a run at 36 ◆-eq each is 3–5× the hunter cost). With no
  per-use price, Q-045's cue-only (`--cue=line`) and one-at-a-time (`--cue=one`) passed or failed by seed set (one:
  Drift 38 % at 8 seeds, 2 % at 16). The cause: the bot drops on its own cell and a held hunter still touches the core
  while it circles, so Drift (one theft) saves ~nothing. A held hunter that cannot touch (`--fixate`) + no per-use price:
  saving Drift 62 % / 59 %, Surge 57 % / 56 %, ratio 1.09 / 1.06 (8 / 16 seeds), the bot unchanged.
- So S-77b2: (1) a hunter steering at or circling a Decoy (`e.lure`) never touches the core, both modes; (2) Decoys
  come from a Nexus Development level, **Lure** (▲ 30 once, all sizes), refilled free to `DECOY_STOCK` at the end of
  every deposit (Nexus or Relay); the Craft tab loses its Decoy row (one layer makes it, hard rule). Hold / R / stock stay.
- Gate floor: D-213's per-ring "cost ≥ 0" fails only in the Deep (−0.5 … −1.1 %), where hunters cost 0.6–3.4 % to
  begin with (noise). It becomes pooled per mode > 0 (≈ 5 % measured: hunters still matter); saving ≥ 25 % and the
  0.8–1.25 band unchanged. Supersedes D-213's floor for S-77b2 only.
- Rejected: a cheaper per-use price (the floor ▲2 ◆10 is still ~2×, D-214), throwing the Decoy ahead (`--drop=throw`:
  ratio 1.92 / 0.63), a spent Decoy's hunters fading (`--spend=fade`: 0.63 / 0.38, and close to a kill, D-208),
  stock 1 (Drift 19 % / 3 %), hold 3 (0.77 / 0.65), a smarter bot cue (the gate would measure the bot, D-214).

### D-219 — Design 177: S-67 refreshed; Rift runner measured, chart route mode-free
- `eventrun --call` prints pockets emptied (`stats.rifts`): 1.6–2.4 per 10 min a ring → `FEAT_RIFTS` 5 takes
  21–31 min (≥ 15, keep). Drift / Surge pooled 0.86 (Deep alone 0.71), so S-67's rifts check is pooled (D-202's way).
- The chart route runs in one mode with `god`: explored share does not depend on the mode.
- Rejected: a per-ring rifts ratio (Deep 0.71: its Drift bot calls 2.1 times a run, Surge 2.8), a second rifts bot.

### D-220 — Build 178: Lure refills the Decoy stock whenever an item banks, not only when cargo empties
- S-77b2 said "the end of every deposit". Built that way, the gate failed: saving Drift 29.7 % / Surge 46.2 %, ratio
  0.643 (8 seeds): a core mining on its Relay pad seldom empties its cargo, so few refills (48–70 Decoys vs 59–97).
  D-218's measure refilled on any banked item; built that way the gate passes with D-218's own numbers (62.5 / 57.4 %,
  ratio 1.089, pooled cost with Decoys Drift 4.6 % / Surge 5.2 %). Player text: "refilled at every deposit" still holds.
- A lair refund (B-113) returns a placed Decoy to the stock (capped), not ▲ / ◆: a Decoy has no price now.
- Rejected: end-of-deposit refill (fails the band), a refill timer (a second clock), refunding the old craft price
  (free resources from a free item).

### D-221 — Audit 179: an old save is found by its step (a check); the arc keys on the bank panel's rows
- `saveformat.cjs` now also bans an old save built as `v: SAVE_FORMAT - n` / `.v = SAVE_FORMAT - n` in tests and tools
  (B-114 twice: `decoy.cjs`, then `echoorder` / `relay` / `echolevels`, which tested format 27 while their comments
  said 10 / 15 / 24). They find the step that adds their field, as `lens.cjs`. The check FAILs on the old three.
- The thumb arc's re-layout key adds the count of hidden rows / chips in the bank panel (`arcKey`, class reads, no
  layout), so a taller panel re-lays the arc (B-116, debt carried by audits 169 + 174, D-144).
- Workflow review: too little: a debt line that names a rule broken twice waited an audit for its check (CLAUDE.md
  already says "a check, not words": do it in the PR that finds the second break). Too much: none new.
- Rejected: reading the panel's height each HUD update (a forced layout a frame), closing the arc debt unmeasured.
