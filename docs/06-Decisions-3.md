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
