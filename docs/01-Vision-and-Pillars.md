# 01 — Vision & Pillars

**Lumen Core** is a top-down neon-geometry mining game. You are a small glowing core. You carve tunnels through
dark, layered rock, haul crystal light back to the **Nexus**, and grow stronger through the **Core Matrix**.

Owner: Claude (design, code, merges, deploys). Inherited lessons from the earlier GDevelop project are in
`00-Origin-Instructions.md`; the parts that still apply are carried forward below.

## Pillars — confirmed
1. **Neon geometry, top-down.** Glowing outlines on black. No isometric/side view, no humanoids, no literal objects, no pixel-art detail.
2. **Cozy and intense are equals.** *Drift* (no hostiles) and *Surge* (Glitches hunt you) share one world, one economy, and one
   progression. You can switch modes at the Nexus at any time. Surge must never be the "real" game, and Drift must never be a lesser one.
3. **The world is the toy.** Every solid cell can be carved, except the bedrock border. Mining is how you move, explore, and earn.
4. **Small complete systems over long feature lists.** Each new layer has to close a loop (earn → carry → bank → spend) before the next one starts.
5. **Intent vs realized state.** Every system keeps "what was asked" (target velocity, beam intent) apart from
   "what actually happened" (collision-resolved motion, actual hit). This keeps new systems easy to debug.

## Progression layers (keep them distinct — never unlock the same thing twice)
- **Core Matrix** *(built)*: permanent stat upgrades to the core.
- **Nexus Development** *(planned)*: the hub itself grows (light radius, structures, beacons).
- **Research** *(planned)*: unlocks new *kinds* of things (new beam modes, new materials).
- **Crafting** *(planned)*: turns resources into placeable items (light beacons, relays).
- **Temporary Upgrades** *(planned)*: run-scoped buffs found in the world.
