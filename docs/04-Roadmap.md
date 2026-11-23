# 04 — Roadmap

Milestones are ordered. Each bullet is meant to be roughly one PR. Design sessions may reorder, split, or cut items. Mark done items with ✅ and the PR number.
Items tagged **S-n** have a build-ready spec in `07-Build-Specs.md`. Every new sink must state its currency and compare it with the world's supply (see `07` header).

## M1 — Close the loop properly
- ✅ (#1) First playable: mining, cargo, deposit, Core Matrix, Drift/Surge, touch, autosave.
- ✅ (#2) Pages deploy workflow.
- ✅ (#3) Health tooling: `tests/smoke.cjs`, operating manual, roadmap. Fixed the demo world being saved over a real save.
- ✅ (#4) Version tracking: VERSION + changelog, decisions log, doc cap test, save format upgrades (Gloamdeep inbox).
- ✅ (#7) **S-1 Nexus Development v1 — Radiance:** a Prism-only sink that grows the Nexus light radius, as a "Nexus" tab in the Core Matrix panel.
- ✅ (#8) **S-2 Touch-first hints + narrow screens:** fixes B-001 and B-002 and adds the 320×568 overflow smoke check (pulled forward from Tooling).
- ✅ (#9) Design session 7: play-test, Q-006/Q-007 measured and decided, B-007 crash fixed, specs S-6 and S-7.
- ✅ (#10) **S-6 Glitches give up when they make no progress:** they fade and free their slot so Surge keeps its pressure (D-017); Glitch Prism drop at 50 % (D-018).
- ✅ (#11) Audit session 9: B-006 fixed, touch sticks released on blur, Drift/Surge income parity measured (D-019).
- ✅ (#12) **S-3 Settings panel:** volume, mute, screen shake on/off, reduced motion, opened from the title (D-016, D-020).
- ✅ (#13) **S-4 Feel pass:** deposit arpeggio, upgrade ring + pip flash, crystal/prism hitstop, beam sweep; fixed B-008 (D-021).
- ✅ (#5) Design session 3: play-test, economy measurement, specs S-1…S-5.
- ✅ (#6) Audit session 4: fixed B-003, B-004; rest logged under Debt.

## Tooling (groundwork from Gloamdeep lessons; slot one in before the feature that needs it)
- **S-7 Dev panel** (`?dev` or backtick): add resources, teleport to a ring, god mode, toggle mode, save/load test spots. Bots and playtests jump straight to the thing under test.
- **Surge bot runner** (`tools/surgebot.cjs`; `tools/surgefarm.mjs` is a parked-only probe, `tools/parity.mjs` a greedy miner in both modes, D-019): headless, plans each step from what it sees, plays at 3 upgrade strengths, and reports death rate
  and haul per minute **in both modes** (answers Q-007). It also tries degenerate loops (e.g. hugging the Nexus edge, farming Glitches at the Nexus rim). Needed before M6 balance work.
- **Throttled perf check:** frame time with CDP CPU throttling ×4 during heavy mining. Budget 16.7 ms. Recheck the scene if numbers jump.
- ✅ (#15) **S-5 Deterministic gameplay RNG:** one seeded stream per draw (`game.rng.*`, D-025).

## M2 — A world worth exploring
- ✅ (#14) Design session 12: S-4 feel play-tested, M2 measured, specs S-8…S-10, Q-002 decided (D-022…D-024).
- **S-8 Depth rings:** Hearth / Veil / Deep by distance, own rock palette and toughness, named on entry, coloured on the minimap.
- **S-9 Vaults:** 6 geometric rooms in the Deep, each with a cache (20◆ + 6▲); old saves skip vaults over ground they already saw.
- **S-10 Lumen ore** (gold, rare, d ≥ 55): the Research currency. Ship directly before Research v1 (D-024).
- Larger world (e.g. 256×256) with lazy chunk generation: only after the throttled perf check, and only if rings feel too short (D-022).
## M3 — Research (new *kinds* of things)
- **Research v1** (spec in the next Design, build right after S-10): a Research tab at the Nexus, paid in Lumen; first node = Scanner ping.
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
- **B-010:** the "Bring shards home to the Nexus to upgrade" hint stays up after the Shards are banked (it checks bank + cargo ≥ 8 with no upgrade bought); with 46◆ banked it should say "Press E at the Nexus". Small; next Build or Audit.
- **Missed chime (watch):** the S-4 arpeggio plays only if the hold empties inside the ring. A player (or bot) who leaves mid-stream gets no chime. Keep unless a play-test log says it feels broken.
- **B-005:** `destabilize` scatters cargo through `spawnPickup`, which silently drops items past `PICKUP_CAP` (400): cargo can vanish if the floor is littered. Rare; fold into the dev panel (S-7).
- **Render cost:** pickups and particles are drawn without viewport culling, each pickup with `shadowBlur`. Headless SwiftShader gave 112 ms/frame at ×4 throttle while mining, which is software GL, not a real device. Measure on the throttled perf check (Tooling) before changing.
- ✅ **B-006** (#11): "beam mines terrain" now waits for 5 s of game time (loop clamps dt to 0.05 s, so wall time under load was ~1.3 s of play).
- **Glitches still can't path:** after S-6 they give up instead of sticking, so a Surge player deep in tunnels sees Glitches appear, push at rock and fade. If play-tests find that reads as broken, a cheap flow-field toward the core (one BFS per second over explored cells) is the next step; M6's Burrower is the other answer.
- ✅ **B-009** (#11): touch sticks weren't released on `blur`/page hide (keys were). `input.release()` now drops all held input.
- **Late-game parity:** Drift's ore near the Nexus is finite, Glitch drops renewable. Re-run `tools/parity.mjs` with a depleted inner ring (or 30+ min) when M2 depth rings land.
- ✅ **Test trap** (sessions 4, 5): planting a save then reloading let `pagehide` overwrite it. Now a smoke helper, `plantSaveAndReload()`.
