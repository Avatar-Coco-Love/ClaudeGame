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

### D-032 — Glow draws are culled to the view (2026-11-23, Audit 19, B-014)
Anything drawn per object with `shadowBlur` (pickups now) is skipped outside the camera view + 16 px. Floor loot is saved and can
lie anywhere on the map, so its draw cost must follow what is on screen, not what exists. Smoke counts `fill` calls to keep it so.
- Rejected: dropping pickup glow (pillar 1 look; on-screen cost is not the problem measured); a lower `PICKUP_CAP` (would eat saved
  loot, against B-005/B-011); a pre-rendered glow sprite (bigger change, unmeasured on a real device; Tooling perf check first).

### D-033 — Lumen as built (2026-11-23, Build 20, S-10; D-023, D-024)
Lumen is the last re-type in `generate()`, on ROCK/DENSE only, from its own noise (`seed ^ LUMEN_SALT`), so the layout, crystal and
prism cells are unchanged (smoke hashes this). hp 3.5 is fixed: rings scale only ROCK/DENSE. Save format 5 adds `lumen: 0` to bank
and cargo; floor pickups store a kind index (`KINDS`), so 0/1 from older saves still mean ◆/▲. "Held one" = `stats.lumen` > 0.
- Rejected: Lumen also replacing crystal/prism cells (would shrink M1's economy basis); ring-scaled Lumen hp (7 in the Deep made a
  bead cost more beam time than a vault wall); a separate `seenLumen` save flag (stats already persists; one less shape change).

### D-034 — Research v1 as built (2026-11-23, Build 21, S-11; D-030)
Research lives in `src/research.js` (`game.js` was at 500 lines). Nodes in `RESEARCH` (config) cost Lumen only, set
`research[id] = true` once, and save as `research: {}` (format 6). The ping snapshots ore cells within 12 cells at press time,
each shown when the ring reaches it (`d / SCAN_SPEED`); a mark hides once its cell is mined. F / ◎ is consumed every frame and
dropped while paused or under the Matrix. The ◎ button sits under the minimap, not bottom-right (the right half is the aim stick).
- Rejected: scan code in `game.js` (pushes it toward the 600-line split); a ring that follows the core (the snapshot would drift
  off its cells); queuing a press made under the Matrix (it would fire on close, unasked); re-scanning cells live each frame
  (cost per frame for no visible gain over 6 s); saving the live ping (D-030: no save state).

### D-035 — The Scanner ping shows vault caches; nothing else points to vaults (2026-11-23, Design 22, answers Q-010)
Measured with `tools/vaultfind.mjs` (40 seeds, a bot fanning out Lumen to Lumen, upgrades at 2): by the 10● that buys the Scanner,
20 of 240 vaults (8 %) had been seen and half the runs had seen none; at 30● 19 %, at 60● (level 3) 35 %. Most vaults stay unfound,
so they need a pointer, but a pointer that needs you nearby keeps the find. The ping is already the "look around here" tool, so a
cache inside its 12 cells shows like ore (S-12). Equal in both modes; no save state.
- Rejected: a faint minimap glint at every site from the start (gives away all six, no finding left); nothing at all (two-thirds
  of a world's caches would go unopened); a separate "Vault Sense" research node (a second tool for one job; Lumen is scarce);
  showing the whole vault shell (a 7×7 outline of glyphs reads as ore; the cache glyph alone is distinct).

### D-036 — Beam modes are Research nodes; each trades something, none is stronger everywhere (2026-11-23, Design 22)
Wide (25●, S-13) and Pulse (40●, S-14) are new *kinds* of beam, so they live in Research (pillar layers), paid in Lumen. Scanner +
Wide + Pulse = 75● of ~141 per world, leaving room for later nodes. All modes scale from the Core Matrix Beam Power and Range
stats (no stat is unlocked twice). Wide: ~1.35× cells/s but 2.2× slower per cell and 0.75× reach (halls, Drift comfort, crowds in
Surge). Pulse: front-loaded burst, 1.5× reach, pierces 3 cells (reach ore behind rock, burst a Glitch), but no damage while charging.
Focus stays best for a single tough cell. Q / `⟂` cycles; the chosen mode is saved (format 7). Q-011 checks for a dominant mode.
- Rejected: modes as Core Matrix upgrades (Matrix is stats only; it would unlock kinds twice); a mode wheel UI (two or three modes
  need one button); Pulse that also moves the core (movement is the Thrusters' job, and it reads as a dash); Wide as a cone
  (uneven damage per cell is hard to read on a grid); a Surge-only mode (D-002).
