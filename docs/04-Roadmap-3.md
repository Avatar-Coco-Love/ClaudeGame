# 04 — Roadmap, part 3: M10–M14 (the game grows, D-119)

Owner's ask (session 87): bosses, more enemies, puzzles, a bigger map, biomes, events, ways to mine / defend / attack,
upgrades, sinks and resource types. Claude decides what and how. Order fixed by D-119; one milestone closes its loop
before the next starts. VERSION: M10 → 1.5, M11 → 1.6, M12 → 1.7, M13 → 1.8, M14 → 1.9. Items are candidates until specced.

## M10 — World and biomes (D-120)
- ✅ **S-45** World size as saved data (v1.4.28, format 18; old saves stay 160, pinned hash). Spec in `07-Build-Specs-8.md`.
- ✅ **S-46a** Shoal / Kiln rings, palettes, appended vaults (d 86–118) + Anomalies at 256, dev-only (v1.4.30, D-122).
- ✅ **S-46b1** Minimap 160-cell window round the core, ending overview frames the explored area (v1.4.31, D-123).
- ✅ **S-46b2** The 256 world is live (v1.4.33, D-125): size required by every site helper, perf budget in smoke
  (`bigworld.cjs`), Ring 90 / 110 dev buttons, `WORLD_SIZE_NEW` = 256. S-47 / S-48 specs: `07-Build-Specs-9.md` (D-124).
  (Moved from "Later": *Larger world with lazy chunk generation*; eager generation measured enough, Q-025.)
- ✅ **S-47a** Shoal Undertow: seeded chunk currents (30–55 px/s, half calm) on the realized velocity, pickups at half,
  dashes ≤ 30 / 15, `tools/haulrun.mjs` (median ×1.00 ≤ 1.15) (v1.4.35, D-127).
- **S-47b** Shoal: brittle glass (a break cracks one neighbour, no chains) + its lydian music (clamp → ring 3).
- **S-48** Kiln: beam heat that vents (8 s, 17 % steady) + flare vents + its music progression.

## M11 — Economy
- One resource per biome (Shoal / Kiln ore cells, own glyph shape + colour, pass `colours.cjs`), counted in bank / cargo
  (save format bump), supply measured over 40 seeds before any price is set (the `07` header rule).
- A new Core Matrix tier (levels past today's max, paid in the biome resources) and one Nexus Development item.
- New Crafting items paid in biome resources (e.g. a Current Anchor that calms Undertow nearby; a Heat Sink Beacon).
- At most one Research row, only for a new *kind* of thing (chosen in M11's design); never a second path to an unlock.

## M12 — Enemies and tools
- **Swarm** (tiny, many, weak; moved from "Later") and **Burrower** (moves through rock, leaves a tunnel; moved from "Later").
- One native foe per biome (Surge), each with a Drift twin hazard of equal weight (pillar 2).
- New tools: a beam mode (Research) and placeable neon nodes in Crafting: a turret-like node (Surge use) and a shield
  pylon (blocks foes and bolts; in Drift, a lens that speeds mining in its radius), costed so neither mode's tool is "the"
  one. Calming Undertow / flares stays M11's Anchor alone (no double unlock).

## M13 — Events and puzzles
- World events beyond weather, seeded on `stats.time` like D-097: cave-in, Lumen bloom, a rift that opens for ~30 s
  (a pocket of rare ore), roaming elites (Surge) / a wandering lode (Drift).
- New Vault and Spire puzzle types; one puzzle per biome (Shoal: route a current; Kiln: vent timing).

## M14 — Bosses (two forms, D-119)
- One boss per biome. Surge: a fight. Drift: take it apart as a puzzle (cut its shell in the right order). Same reward.
- Whether the ending should ask for the bosses is open (Q-026).
