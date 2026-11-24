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
- **Nexus Development** *(built: Radiance)*: the hub itself grows (light radius, structures). Paid in Prisms only (D-009).
- **Research** *(built: Scanner, Wide beam, Pulse beam)*: unlocks new *kinds* of things (new beam modes, new materials).
- **Crafting** *(built: Beacons, S-16)*: turns resources into placeable items (light beacons, relays). Beacons live here, not in Nexus Development.
- **Temporary Upgrades** *(planned)*: run-scoped buffs found in the world.

## Scope and end state (D-045)
- **v1.0 = M5 ships:** M1–M5 in `04`, ending with Spires, an ending sequence and **New Cycle**. The win: relight every dormant
  Spire in the Deep (Q-003). Each relight is a delivery plus a challenge in the mode you are in: a Drift puzzle or a Surge
  defence, equally valid. The Surge Spire defence is the only boss-like fight; there are no standalone bosses.
- **After 1.0:** M6–M8 are depth and polish on the same loop (Surge variety + a Drift twin, temporary upgrades, audio, PWA,
  accessibility, perf). When M8 is done the game is **finished**: sessions only fix bugs, audit, and tune.
- **Out of scope:** multiplayer/co-op (a design spike at most, Q-004), telemetry or analytics, a standalone puzzle mode,
  accounts or cloud saves, monetisation, story text or characters.
- **No new milestones:** an item outside M1–M8 needs a design-session D-xxx that names the pillar it serves and what it replaces.
  Nothing joins M1–M5 unless it closes a loop already in them.
