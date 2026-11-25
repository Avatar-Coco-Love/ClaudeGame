# 06 — Decisions log, part 22

Continues `06-Decisions-21.md` (part 21 neared the 8 KB cap at D-151; same rules: supersede, never edit; list rejected
alternatives). D-152 on.

### D-152 — M13 plan: one rift event and two biome vault locks, one face in both modes (session 117, design)
- M13 = **S-57a** Rift (a 45 s pocket of the ring's best ore, 8–12 cells out, every 240–360 s), **S-57b** its pointer
  and tone, **S-58** Flare Lock (Kiln outer vault: cut only in a timed soft window), **S-59** Tide Lock (Shoal outer
  vault: cut only against the current). Specs: `07-Build-Specs-14.md`. M13 done = v1.8 with S-59.
- Every M13 event and lock has the **same rules in both modes** (no Surge face / Drift face as weather has): the rift is
  ore that leaves; the locks are rules on a shell. Surge's extra cost is the Glitches on the way. `tools/eventrun.mjs`
  (S-57a) checks the rift pays 1.04–1.12× in each mode, gap ≤ 0.05.
- Locks are seed-only on the 4 existing outer vaults (by ring): no save change, no new sites, an opened vault stays open.
- Measured (Design 117): 27 / 30 seeds have outer vaults in both rings; base thrust 190 px/s beats the 55 px/s top
  current, so the Tide Lock tests reading the flow, not the build.
- Rejected: **cave-in** (a tax with no choice: rubble to re-dig, no decision); **Lumen bloom** as its own event (folded
  into the rift's Hearth / Veil ore); **roaming elites (Surge) / wandering lode (Drift)** (two faces of unequal weight,
  and elites are Glitch tiers past 3, which Q-029 leans against); **new Spire puzzle types** in M13 (the Spires are the
  ending's arc; M14's bosses already bring a take-it-apart puzzle); a saved rift (a reload skipping one open rift
  costs at most 45 s of a bonus; a save format bump for that is not worth it).

### D-153 — S-56 Ward guards the core in both modes (session 117, design)
- S-56 said a Ward "guards the core in Surge and ore in Drift". Since S-53c (D-147) and S-54 (D-150) every biome
  creature goes for the core's hold in both modes, so the Ward's job is the same in both: guard the core. Numbers
  unchanged. Added gate: `biomefoe.mjs` with 2 Wards at the dig site stays ≤ 1.00 in each mode.
- Rejected: a Drift-only "ore guard" range (no creature hunts loose ore alone any more, except motes carrying
  pickups, which the same 4-cell bolt already covers).

### D-154 — S-56 Ward: a Ward's kill pays no loot (session 118, build)
- As specced (Ward kills paid the beam's loot), `biomefoe.mjs --wards=2` failed its ≤ 1.00 gate in the Kiln: Surge
  1.066 (Drift 0.806); Shoal 0.908 / 0.879. The Ward finished the surfaced Burrower after each lunge and its Glitch loot
  turned the creature into income. Rule now: a creature whose last hp a Ward's bolt takes (`warded`) drops only what it
  carried or ate (a mote's item, the Burrower's belly), never the kill loot (◆, ▲, a mote's 1 ◆, a swarm's bonus). The
  loot draw still happens (D-025). Counts as a kill (`stats.glitches`). Same in Drift and Surge.
- Measured after (8 seeds × 10 min, 2 Wards kept at the dig site): Kiln 0.833 / 0.876, Shoal 0.889 / 0.883: PASS.
  No Wards: Kiln 0.866 / 0.905, Shoal 0.907 / 0.896. The spec expected a lift; the bot already beams every creature it
  reaches, so a Ward's kill mostly takes loot the beam would have had. Its worth is hull and attention, not haul.
- Rejected: halving Ward damage (a Ward too weak to finish a mote swarm does nothing for a player who isn't beaming);
  Wards ignore the Burrower (one creature exempt is a rule to learn, and the Burrower is the one that hurts most);
  loot for Glitches only (the Shoal / Kiln creatures and Glitches would follow two rules).

### D-155 — A bot gate is defined on its tool's default seed count, and the smoke runs it there (session 119, audit)
- B-092: `biomefoe.mjs` gates were measured and specced on 8 seeds, but the tool defaulted to 4, where the Kiln reads
  0.800 / 0.916 and the Shoal fails too (both FAIL by sample noise; 8 / 12 / 16 seeds all PASS, Kiln 16: 0.883 / 0.885).
  Rule: a gate's seed count is the tool's default (`GATE_SEEDS = 8`); a run on fewer seeds prints its ratios but no
  verdict. The smoke runs each gate at that default: Kiln (new in `burrower.cjs`), Kiln + 2 Wards (`ward.cjs`, was 4
  seeds), Shoal (`mote.cjs`). `audit119.cjs` checks the default and the no-verdict guard.
- Rejected: 16 seeds as the gate (closer to converged, but doubles ~75 s of smoke time already over budget); keeping 4 as
  a quick default with a note (the next session read a FAIL as a regression, twice: sessions 118 and this lead).

### D-156 — S-57a Rift: double-yield pockets, Shoal / Kiln 3 + 6, a 16-seed gate (session 120, build)
- As specced (6 + 3, one yield roll), `eventrun.mjs` read Deep 1.026 / 0.965, Kiln 1.034 / 1.053 (8 seeds): under the
  1.04–1.12 band; ~1.3 rifts per 10 min, the bot mines ~75 % of the cells. Tuned the pocket's ore first, as the spec says:
  every rift cell rolls its yield twice (`RIFT_BONUS` 1, `riftBonus`), and the Shoal / Kiln pocket is 3 ≈ / ⬟ + 6 ▲
  (`RIFT_MAJOR` [6, 6, 6, 3, 3]): at 6 ⬟ + 3 ▲ doubled Kiln read 1.116 / 1.130 (16 seeds), undoubled 1.037 / 1.050.
- The gate is defined on 16 seeds, not D-155's 8: a rift moves the haul 5–12 %, less than one Surge run's swing (±10 %,
  one seed 1080 vs 1419). 8 seeds put Deep Surge at 1.034 with the final numbers; 16: Deep 1.092 / 1.089, Kiln 1.079 /
  1.078 PASS; 24: Deep 1.073 / 1.077, Kiln 1.094 / 1.097. Fewer seeds = no verdict. Smoke cost ~45 s (`rift.cjs`).
- Bots: `runBot` takes `rift` ('off' by default), so older gates keep their numbers; `eventrun.mjs` turns creatures and
  weather off to measure the rift alone. A pocket needs all 9 cells rock / dense (stricter than the spec's list).
- Rejected: shorter gaps (more events, not a better one); 3 × 3 → 4 × 4 (the shape is the read); a gate on 8 seeds with
  a wider band (would pass a rift worth nothing in one mode); keeping 6 ⬟ undoubled in the Kiln only (two rules by ring).

### D-157 — S-57b Rift pointer: off screen = the whole pocket, kept clear of the Nexus arrow (session 121, build)
- The chevron shows while no part of the 3 × 3 pocket is on screen (`drawRiftPointer`), placed by the Nexus pointer's
  code (40 px inset, slid inward off HUD boxes) with the Nexus arrow added as one more box, so the two never overlap.
  Colour `RIFT_RGB` (the shimmer's), an open chevron (not the Nexus's filled arrow shape), steady under reduced motion.
- Chimes: sine G5 → D6 (open, vol 0.06) and D6 → G5 (close, 0.035): peak −33 / −38 dBFS, 0 % > 2 kHz (`audio.cjs` row).
- Rejected: the Nexus pointer's 40 px inset as the "on screen" test (the chevron would sit beside a visible pocket);
  a pointer only on the minimap (already there, S-57a); a triangle wave "glass" (energy above 2 kHz, D-039 ceilings).
