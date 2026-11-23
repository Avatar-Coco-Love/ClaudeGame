# 06 — Decisions log, part 3

Continues `06-Decisions-2.md` (same rules: supersede, never edit; list rejected alternatives). D-027 on.

### D-027 — Dev tools: API always on, panel on request, god mode never saved (2026-11-23, Build 15, S-7)
`window.__lumen.dev` exists in every build; the panel is created only by `?dev` or backtick. `god` lives on the Game, not in the save.
Teleport writes to the world (carved cells are `broken`, so they persist), resources and upgrades go through the normal save.
- Why: bots and smoke need the same entry points with or without UI; a dev run should leave a world that reloads honestly.
- Rejected: dev API only under `?dev` (smoke and tools would need a flag); a separate dev save slot (new save shape for a tool);
  teleport without carving (lands inside rock and can't move).
