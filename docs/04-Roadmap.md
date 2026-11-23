# 04 — Roadmap

Milestones are ordered. Each bullet is meant to be roughly one PR. Design sessions may reorder, split, or cut items. Mark done items with ✅ and the PR number.
Items tagged **S-n** have a build-ready spec in `07-Build-Specs.md`. Every new sink must state its currency and compare it with the world's supply (see `07` header).

## M1 — Close the loop properly
- ✅ (#1) First playable: mining, cargo, deposit, Core Matrix, Drift/Surge, touch, autosave.
- ✅ (#2) Pages deploy workflow.
- ✅ (#3) Health tooling: `tests/smoke.cjs`, operating manual, roadmap. Fixed the demo world being saved over a real save.
- ✅ (#4) Version tracking: VERSION + changelog, decisions log, doc cap test, save format upgrades (Gloamdeep inbox).
- **S-1 Nexus Development v1 — Radiance:** a Prism-only sink that grows the Nexus light radius, as a "Nexus" tab in the Core Matrix panel.
- **S-2 Touch-first hints + narrow screens:** fixes B-001 and B-002 and adds the 320×568 overflow smoke check (pulled forward from Tooling).
- **S-3 Settings panel:** volume, screen shake on/off, reduced motion, and "reset world" with confirmation.
- **S-4 Feel pass:** deposit fanfare, an upgrade pulse, crystal-break hitstop, and a beam charge-up sound. After S-3, so effects ship with their off switch.
- ✅ (#5) Design session 3: play-test, economy measurement, specs S-1…S-5.
- ✅ (#6) Audit session 4: fixed B-003, B-004; rest logged under Debt.

## Tooling (groundwork from Gloamdeep lessons; slot one in before the feature that needs it)
- **Dev panel** (`?dev` or backtick): add resources, teleport to a ring, god mode, toggle mode, save/load test spots. Bots and playtests jump straight to the thing under test.
- **Surge bot runner** (`tools/surgebot.cjs`): headless, plans each step from what it sees, plays at 3 upgrade strengths, and reports death rate
  and haul per minute **in both modes** (answers Q-007). It also tries degenerate loops (e.g. hugging the Nexus edge, farming Glitches at the Nexus rim). Needed before M6 balance work.
- **Throttled perf check:** frame time with CDP CPU throttling ×4 during heavy mining. Budget 16.7 ms. Recheck the scene if numbers jump.
- **S-5 Deterministic gameplay RNG:** `game.rand` is seeded with `Date.now()`, and gameplay draws share it. Before the bot runner: seed from the world seed + a salt per system.

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
- **B-001:** at 320 px wide the title "LUMEN CORE" is clipped on the right (letter-spacing + clamp min). Fixed by S-2.
- **B-005:** `destabilize` scatters cargo through `spawnPickup`, which silently drops items past `PICKUP_CAP` (400): cargo can vanish if the floor is littered. Rare; fold into S-4 or the dev panel.
- **Render cost:** pickups and particles are drawn without viewport culling, each pickup with `shadowBlur`. Headless SwiftShader gave 112 ms/frame at ×4 throttle while mining, which is software GL, not a real device. Measure on the throttled perf check (Tooling) before changing.
- **B-006:** smoke "beam mines terrain" is timing-dependent (5 s wall clock; 3–8 cells mined across runs, needs ≥ 4). Failed once in 6 runs. Fix: drive it by game time (step `game.update`), not wall time. Don't lower the bar.
- **To verify:** touch sticks aren't cleared on `blur`/page hide (keys are). If a phone drops `touchend` while hidden, the core may drift on return.
- **B-002:** on a phone, the first hint is the desktop one ("WASD to move…", truncated) and the Matrix button shows an `E` key badge until the first touch. Fixed by S-2.
