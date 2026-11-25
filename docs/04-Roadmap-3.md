# 04 — Roadmap, part 3: M10–M14 (the game grows, D-119)

Owner's ask (session 87): bosses, more enemies, puzzles, a bigger map, biomes, events, ways to mine / defend / attack,
upgrades, sinks and resource types. Claude decides what and how. Order fixed by D-119; one milestone closes its loop
before the next starts. VERSION: M10 → 1.5, M11 → 1.6, M12 → 1.7, M13 → 1.8, M14 → 1.9. Items are candidates until specced.

## M10 — World and biomes (D-120) ✅ v1.5
- ✅ **S-45** World size as saved data (v1.4.28, format 18; old saves stay 160, pinned hash). Spec in `07-Build-Specs-8.md`.
- ✅ **S-46a** Shoal / Kiln rings, palettes, appended vaults (d 86–118) + Anomalies at 256, dev-only (v1.4.30, D-122).
- ✅ **S-46b1** Minimap 160-cell window round the core, ending overview frames the explored area (v1.4.31, D-123).
- ✅ **S-46b2** The 256 world is live (v1.4.33, D-125): size required by every site helper, perf budget in smoke
  (`bigworld.cjs`), Ring 90 / 110 dev buttons, `WORLD_SIZE_NEW` = 256. S-47 / S-48 specs: `07-Build-Specs-9.md` (D-124).
  (Moved from "Later": *Larger world with lazy chunk generation*; eager generation measured enough, Q-025.)
- ✅ **S-47a** Shoal Undertow: seeded chunk currents (30–55 px/s, half calm) on the realized velocity, pickups at half,
  dashes ≤ 30 / 15, `tools/haulrun.mjs` (median ×1.00 ≤ 1.15) (v1.4.35, D-127).
- ✅ **S-47b** Shoal brittle glass (a rock break cracks one seeded neighbour for 60 % hp, no chains) + lydian Shoal
  music (clamp → ring 3; Kiln plays it until S-48) (v1.4.36, D-128).
- ✅ **S-48a** Kiln beam heat (8 s → 1.2 s overheat, 16 % steady) + phrygian music + `haulrun` d 116 leg (×1.00 ≤ 1.20)
  (v1.4.38, D-130).
- ✅ **S-48b** Kiln flare vents (126 seed sites at 256, 8 s cycle, shove + 0.4 heat, no damage) (v1.5.40, D-132). **M10 done.**

## M11 — Economy (specced, `07-Build-Specs-11.md`, D-134)
- ✅ **S-49** Biome ores: Tide ≈ (Shoal) and Calx ⬟ (Kiln); bank / cargo (v1.5.43, format 19, D-135).
- ✅ **S-50** Core Matrix Overdrive: two levels past every max, paid in ◆ + ≈ + ⬟ (v1.5.46, D-140).
- **S-51** Heat Sink (Crafting, Kiln): heat gain × 0.4 within 5 cells (format 20).
- **S-52** Nexus Chart (Nexus Development): currents, then flare vents, on the minimap (format 21). M11 done → v1.6.
- Cut (D-134): the Current Anchor (the Undertow costs a haul ×1.00, so calming it buys nothing) and an M11 Research
  row (no new *kind* of thing needs one; Lumen's surplus waits for M12's beam mode).

## M12 — Enemies and tools
- **Swarm** (tiny, many, weak; moved from "Later") and **Burrower** (moves through rock, leaves a tunnel; moved from "Later").
- One native foe per biome (Surge), each with a Drift twin hazard of equal weight (pillar 2).
- New tools: a beam mode (Research) and placeable neon nodes in Crafting: a turret-like node (Surge use) and a shield
  pylon (blocks foes and bolts; in Drift, a lens that speeds mining in its radius), costed so neither mode's tool is "the"
  one. Heat relief stays M11's Heat Sink alone (no double unlock).

## M13 — Events and puzzles
- World events beyond weather, seeded on `stats.time` like D-097: cave-in, Lumen bloom, a rift that opens for ~30 s
  (a pocket of rare ore), roaming elites (Surge) / a wandering lode (Drift).
- New Vault and Spire puzzle types; one puzzle per biome (Shoal: route a current; Kiln: vent timing).

## M14 — Bosses (two forms, D-119)
- One boss per biome. Surge: a fight. Drift: take it apart as a puzzle (cut its shell in the right order). Same reward.
- Whether the ending should ask for the bosses is open (Q-026).
