# 01 — Vision & Pillars

**Lumen Core** is a top-down neon-geometry mining game. You are a small glowing core. You carve tunnels through
dark, layered rock, haul crystal light back to the **Nexus**, and grow stronger through the **Core Matrix**.

Owner: Claude (design, code, merges, deploys). Inherited lessons from the earlier GDevelop project are in
`00-Origin-Instructions.md`; the parts that still apply are carried forward below.

## Pillars — confirmed
1. **Neon geometry, top-down.** Glowing outlines on black. No isometric/side view, no humanoids, no literal objects, no pixel-art detail.
2. **Cozy and intense are equals.** *Drift* (no hostiles) and *Surge* (Glitches hunt you) share one world, one economy, and one
   progression. You can switch modes at the Nexus at any time. Surge must never be the "real" game, and Drift must never be a lesser one.
3. **The world is the toy.** Every solid cell can be carved, except the bedrock border and a Spire's core and facets
   (D-049, D-068: the five landmarks stay; their shell can be cut). Mining is how you move, explore, and earn.
4. **Small complete systems over long feature lists.** Each new layer has to close a loop (earn → carry → bank → spend) before the next one starts.
5. **Intent vs realized state.** Every system keeps "what was asked" (target velocity, beam intent) apart from
   "what actually happened" (collision-resolved motion, actual hit). This keeps new systems easy to debug.

## Progression layers (keep them distinct — never unlock the same thing twice)
- **Core Matrix** *(built)*: permanent stat upgrades to the core.
- **Nexus Development** *(built: Radiance, Chart; M15: Lens)*: the hub itself grows (light radius, structures). Paid in Prisms only (D-009).
- **Research** *(built: Scanner, Wide beam, Pulse beam, Arc beam; M9: the Echo ally, D-108)*: unlocks new *kinds* of things (new beam modes, new materials).
- **Crafting** *(built: Beacons S-16, Relays S-22)*: turns resources into placeable items (light beacons, relays). Beacons live here, not in Nexus Development.
- **Temporary Upgrades** *(built: Anomalies, D-098, M7 ✅)*: buffs found in the world that scale a Matrix stat until your next deposit.

## Scope (D-045, D-119)
- **v1.0 = M5 ships:** M1–M5 in `04`, ending with Spires, an ending sequence and **New Cycle**. The win: relight every dormant
  Spire in the Deep (Q-003). Each relight is a delivery plus a challenge in the mode you are in: a Drift puzzle or a Surge
  defence, equally valid.
- **After 1.0:** M6–M8 depth and polish, M9 the **Echo** ally (D-108). **The game keeps growing (D-119):** M10 world and
  biomes, M11 economy, M12 enemies and tools, M13 events and puzzles, M14 bosses (`04-Roadmap-3.md`). The owner gives
  feedback; Claude decides what is built and how. **M13 events and locks have one face:** the same rules in Drift and Surge
  (D-152); only weather keeps a face per mode. **Bosses have two forms:** fought in Surge, taken apart as a puzzle in
  Drift, same reward, so neither mode is the "real" one.
- **M15 (D-175): the Nexus reaches out.** A recurring Prism sink in Nexus Development: the Lens calls a rift where you
  stand, for a price, so late Prisms buy play, not nothing.
- **M16 (D-180): feats.** At most six world goals that pay nothing (one per Nexus hexagon vertex), the same in both
  modes, so a late world still says what is left to do.
- **Out of scope:** multiplayer/co-op (a design spike at most, Q-004), telemetry or analytics, a standalone puzzle mode,
  accounts or cloud saves, monetisation, story text or characters.
- **New milestones:** an item outside M1–M14 needs a design-session D-xxx that names the pillar it serves and what it replaces.
