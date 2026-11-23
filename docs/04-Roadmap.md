# 04 — Roadmap

Milestones are ordered. Each bullet is meant to be roughly one PR. Design sessions may reorder, split, or cut items. Mark done items with ✅ and the PR number.

## M1 — Close the loop properly
- ✅ (#1) First playable: mining, cargo, deposit, Core Matrix, Drift/Surge, touch, autosave.
- ✅ (#2) Pages deploy workflow.
- ✅ (#3) Health tooling: `tests/smoke.cjs`, operating manual, roadmap. Fixed the demo world being saved over a real save.
- ✅ (#4) Version tracking: VERSION + changelog, decisions log, doc cap test, save format upgrades (Gloamdeep inbox).
- **Nexus Development v1 — Radiance:** a Prism sink that grows the Nexus light radius, as a "Nexus" tab in the Core Matrix panel.
- Feel pass: deposit fanfare, an upgrade "level-up" pulse, cell-break hitstop, and a short beam charge-up sound.
- Settings panel: volume, screen shake on/off, reduced motion, and a "reset world" option with confirmation.

## Tooling (groundwork from Gloamdeep lessons; slot one in before the feature that needs it)
- **Dev panel** (`?dev` or backtick): add resources, teleport to a ring, god mode, toggle mode, save/load test spots. Bots and playtests jump straight to the thing under test.
- **Surge bot runner** (`tools/surgebot.cjs`): headless, plans each step from what it sees, plays at 3 upgrade strengths, and reports death rate
  and haul per minute. It also tries degenerate loops (e.g. hugging the Nexus edge). Needed before M6 balance work.
- **Throttled perf check:** frame time with CDP CPU throttling ×4 during heavy mining. Budget 16.7 ms. Recheck the scene if numbers jump.
- **Narrow-screen text check:** smoke at 320×568 and the real device sizes; HUD/panel text must not overflow or clip.
- **Deterministic gameplay RNG:** `game.rand` is seeded with `Date.now()`, and gameplay draws share it. Before the bot runner: seed from the world seed + a salt per system.

## M2 — A world worth exploring
- Depth rings: the world gets visibly different with distance (palette shift, new rock types per ring), shown on the minimap.
- New material: **Lumen ore** (gold, rare, far ring). It's the key resource for Research.
- Points of interest: hand-placed geometric "vaults" (pre-carved rooms holding loot caches) stamped into generation.
- Larger world (e.g. 256×256) with lazy chunk generation, if performance allows. Needs an audit first.

## M3 — Research (new *kinds* of things)
- Research tree UI at the Nexus, paid in Lumen.
- Beam modes: **Wide** (3-cell swath, slower), **Pulse** (charge, then burst). Switch modes with Q or a touch button.
- Scanner ping: briefly reveals ore within a radius.

## M4 — Crafting & building
- **Beacons:** placeable light sources that permanently light an area and show on the minimap.
- **Relays:** a remote deposit point linked to the Nexus. Expensive, and they change how routes work.
- Build mode UX on both desktop and touch.

## M5 — The arc (a reason to go deep)
- Dormant Spires in the far ring. Relighting each one takes a delivery plus a short challenge (a Drift puzzle-ish variant and a Surge defence variant, equally valid).
- Relighting all Spires leads to an ending sequence, then **New Cycle** (a new seed, carrying a small permanent bonus).

## M6 — Surge depth (without making Drift second-class)
- Glitch variety: Spitter (ranged), Swarm (tiny, many), Burrower (moves through rock).
- Surge events: periodic "static storms". Drift gets an equivalent calm event (aurora: bonus ore glows).

## M7 — Temporary upgrades
- Anomalies found in the world that give a buff until you next deposit (e.g. double magnet, beam overclock).

## M8 — Polish & platform
- Generative ambient music layer that reacts to depth and mode.
- PWA: installable and works offline.
- Accessibility: remappable keys, colour-blind-safe ore shapes (they're already shape-coded; audit this), and readable text sizes.
- Performance pass on low-end mobile.

## Later / research spikes (design only until proven)
- Co-op multiplayer: destructible terrain sync is the single largest technical risk. Spike only, no commitment.

## Debt
- **B-001:** at 320 px wide the title "LUMEN CORE" is clipped on the right (letter-spacing + clamp min). Fix together with the narrow-screen text check.
