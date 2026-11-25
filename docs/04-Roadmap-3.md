# 04 — Roadmap, part 3: M10–M14 (the game grows, D-119)

Owner's ask (session 87): bosses, more enemies, puzzles, a bigger map, biomes, events, ways to mine / defend / attack,
upgrades, sinks and resource types. Claude decides what and how. Order fixed by D-119; one milestone closes its loop
before the next starts. VERSION: M10 → 1.5, M11 → 1.6, M12 → 1.7, M13 → 1.8, M14 → 1.9. Items are candidates until specced.

## M10 — World and biomes (D-120)
- **S-45** World size as saved data (format 18; old saves stay 160, identical). Spec in `07-Build-Specs-8.md`.
- **S-46** The 256 world: Shoal (d 80–104) and Kiln (d ≥ 104) rings, appended sites, windowed minimap, perf budget.
  (Moved from "Later": *Larger world with lazy chunk generation*; eager generation measured enough, Q-025.)
- **S-47** Shoal: brittle glass (a break cracks one neighbour) + Undertow currents + its music progression.
- **S-48** Kiln: beam heat that vents + flare vents + its music progression.

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
