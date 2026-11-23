# 06 — Decisions log, part 3

Continues `06-Decisions-2.md` (same rules: supersede, never edit; list rejected alternatives). D-027 on.

### D-027 — Dev tools: API always on, panel on request, god mode never saved (2026-11-23, Build 15, S-7)
`window.__lumen.dev` exists in every build; the panel is created only by `?dev` or backtick. `god` lives on the Game, not in the save.
Teleport writes to the world (carved cells are `broken`, so they persist), resources and upgrades go through the normal save.
- Why: bots and smoke need the same entry points with or without UI; a dev run should leave a world that reloads honestly.
- Rejected: dev API only under `?dev` (smoke and tools would need a flag); a separate dev save slot (new save shape for a tool);
  teleport without carving (lands inside rock and can't move).

### D-028 — Depth rings as built (2026-11-23, Build 16, S-8; implements D-022)
Ring = cell-centre distance from the Nexus, precomputed per cell; the core's ring is the ring of the cell it is in. `hpAt()` is the
only place hp is read, so toughness and crack fraction agree. The start ring counts as seen, so a session toasts the Veil and Deep
once each (not stored in the save). The hum drops `RING_PITCH_STEP` = 2 semitones per ring and follows the ring both ways.
- Rejected: persisting seen rings (a save shape change for a one-line toast); toasting every crossing (spam when mining along a
  border); a smooth colour gradient by distance (no named place to arrive in; harder to read on the minimap).

### D-029 — The Deep keeps ×2 rock toughness (2026-11-23, Design 17, answers Q-008)
`tools/deeprun.mjs` (20 seeds, Drift, straight-line bot from the Nexus to the nearest S-10 Lumen cell, d ≈ 55): Beam 2 takes
median 29 s / p90 74 s, of which only ~9 s is spent in the Deep; Beam 0 takes 53 / 94 s. Lowering `hpMul` to 1.4 saves 1–2 s.
The time goes into the trip, not the Deep's rock, so it is not a wall; Q-008's 60 s bar is met at the median.
- Rejected: `hpMul` 1.4–1.6 (no measurable gain; the Deep would stop feeling different); a Beam minimum for the Deep (D-008).

### D-030 — Research v1 shape (2026-11-23, Design 17, S-11)
Research nodes are one-time unlocks paid only in Lumen; the first is the Scanner ping, a temporary ore reveal with no save state.
- Why: Research unlocks *kinds* of things (pillar 4, layers distinct): the Core Matrix sells stats, Radiance a permanent light
  disc; a timed, local ore ping is neither. Lumen is scattered (median blob 2 cells), so a finder makes the currency findable.
- Rejected: levelled nodes (that is the Core Matrix's job); ping marks cells explored (overlaps Radiance and lets the minimap
  be painted by spam); ping shows Glitches (a Surge-only edge, Q-009); a research tree UI now (one node needs no tree).

### D-031 — Vaults as built (2026-11-23, Build 18, S-9; implements D-023)
Sites depend on the seed alone (`vaultSites`, stream `'vault'`), not on terrain, so the 3→4 save step can find them without
building a world. Footprint = the cells a template writes (shell, hollow, cache); `' '` cells keep the generated terrain. A save
step computes `vaultSkip` once; the Game carries it unchanged into every later save. Cache loot is forced past the pickup cap.
- Rejected: footprint = the whole 7×7 box (would skip vaults over corners the template never touches); placing sites on open
  ground only (sites would depend on terrain, so a generator tweak could move every vault); a `vaultsOpened` list in the save
  (the broken bitset already remembers the cache, as S-9 said); capped cache loot (a full floor would eat a one-time reward).
