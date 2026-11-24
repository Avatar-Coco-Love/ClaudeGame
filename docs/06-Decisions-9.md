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
