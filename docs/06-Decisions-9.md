# 06 — Decisions log, part 9

Continues `06-Decisions-8.md` (same rules: supersede, never edit; list rejected alternatives). D-068 on.

### D-068 — Spires v1a as built: candidates, gaps, the `keep` list (2026-11-24, session 46, Build; refines D-049, S-19)
- **Code:** `src/spire.js` (sites, shape, choose, load, stamp). The Game stamps Spires after the World is built and before a
  save's broken cells are cleared; `new World(seed)` stays the base generator + vaults (seed-77 hashes unchanged).
- **Candidates:** `seededStream(seed, 'spire')`: one start angle, then 40 × (angle in the sector, d) per sector, two draws
  each whatever is valid, so candidate k never depends on an earlier one. Valid: cell-centre d in [64, 74], 9×9 inside the
  bedrock border, ≥ 12 from every vault site centre (all 6 sites, even ones a save skipped). 400 seeds: ≥ 5 valid per sector.
- **Spire gap 12 (`SPIRE_GAP`), not in the spec:** two sectors meet at a line, so first candidates could overlap. Checked
  while choosing, in sector order; 25 of 2000 fresh sectors (400 seeds) take a later candidate for it.
- **Old saves (D-024):** first valid candidate with no explored or broken footprint cell; else the least-seen one, and its
  seen cells are saved as `keep` (left as generated, so a tunnel or a seen wall never changes). `keep` is written only in
  that case; the probe forces it with a fully explored map (`tools/spirefind.mjs`). Unbreakable = bedrock, core, facet
  (`UNBREAKABLE` in `world.js`; the Pulse ready shot and `dev.teleport` respect it too).
- **Malformed `spires`** (B-037 rule) re-choose from the save's bitsets instead of throwing.
- Rejected: stamping in `World` (would change the base-world hashes and every tool's world); re-deriving sites on load (a
  generator change would move a Spire); always stamping the core over seen cells (breaks D-024; the `keep` case needs
  every valid candidate of a sector seen, see Q-015); a 72° exclusion margin at sector edges instead of a gap (wastes candidates).

### D-069 — A "broken" Spire relights when primed (2026-11-24, session 47, Design; settles Q-015)
- A Spire is **broken** when its saved `keep` list (D-068) holds any core or facet cell: derived on load, no new save field.
  It is fed like any Spire (S-20: the 7×7 interior is judged by position from the record's centre, not by cell types),
  and at 80▲ it **relights at once** in either mode (no facets, no Wake), recording the mode it was primed in (S-24).
  S-27 draws its minimap hexagon and breath from the record (the breath only where core cells exist).
- Why: every save can reach the ending (never strand a save) and still pays the full 80▲ delivery. Only saves from before
  v0.2.50 that had explored every valid candidate of a sector can have one (`tools/spirefind.mjs`: a fully explored map).
- Rejected: counting it lit on load (no delivery; a free step toward the ending); stamping the core + facets when first
  fed (breaks D-024's "a seen cell never changes" and can wall the core in, since it stands in the interior to feed);
  re-choosing a new site for it (moves a Spire the player may already know).

### D-070 — Spire feed takes cargo Prisms first, then the bank (2026-11-24, session 47, Design; supersedes D-055's "from cargo")
- Measured (`tools/spirerun.mjs`, `09`): ▲ in prism cells within 14 cells of a Spire, 40 seeds: mean 40, under 80 for
  179/200 Spires, none at all for 8; within 20 cells under 80 for 122/200. D-055 assumed the 80▲ would be dug near the
  Spire; it mostly can't be. A save that banked the Deep's Prisms would be stranded in Drift (Surge has renewable drops).
- **Rule:** inside the interior, `SPIRE_FEED_RATE` 8/s takes cargo ▲ while there is any, then banked ▲, up to 80. The
  arc shows fed / 80. The delivery is the trip: median 21 s out at a mid build (19 s in Surge, 6 deaths over 20 runs).
- Supply (both modes): ▲ sinks Core Matrix 246 + Radiance 113 + Beacons ≤ 100 + Relays 36 + Spires 400 = 895 of ~1470;
  Drift's finite supply covers it with ~575 spare; Surge adds drops. No ◆ or ● is needed for the ending.
- Rejected: cargo only (the measurement above; strands mined-out saves); a Nexus "withdraw ▲" row (new UI for one rule);
  feeding from the bank only (a Prism mined on the way would still have to go home first).

### D-071 — Wake lanes stop at what they can't clear (2026-11-24, session 47, Design; amends S-23)
- Measured (400 seeds, 2000 Spires): 467 of 8000 lanes (6 cells × 3 wide past a gap) hit bedrock (404), a vault (43) or
  another Spire (20); 455 Spires have a short lane; the worst has 1 full lane; some gaps open straight onto bedrock.
- **Rule:** a lane clears ROCK/DENSE/ore up to the first cell it can't (bedrock, vault, Spire, `UNBREAKABLE`); ore drops its
  normal yield as floor loot (no supply lost). A lane shorter than 3 cells gets no spawns; waves rotate over the rest.
- Rejected: stopping lanes at ore (Glitches would stall at a crystal); skipping a Wake for edge Spires (Surge unequal).
