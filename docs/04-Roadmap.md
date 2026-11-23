# 04 — Roadmap

Milestones are ordered. Each bullet is meant to be roughly one PR. Design sessions may reorder, split, or cut items. Mark done items with ✅ and the PR number.
Items tagged **S-n** have a build-ready spec in `07-Build-Specs.md`. Every new sink must state its currency and compare it with the world's supply (see `07` header).

## M1 — Close the loop properly
- ✅ All done (#1–#13, #16, #21): first playable, Pages deploy, smoke + docs tooling, Radiance (S-1), touch hints (S-2), Settings (S-3),
  feel pass (S-4), Glitch give-up (S-6), and Design/Audit sessions 3, 4, 7, 9, 14, 19. Detail per PR in `05` and `09`.

## Tooling (groundwork from Gloamdeep lessons; slot one in before the feature that needs it)
- ✅ (#17) **S-7 Dev panel** (`?dev` or backtick, `__lumen.dev.*`, D-027). Save/load test spots were left out (not in the spec); add when a bot needs them.
- **Surge bot runner** (`tools/surgebot.cjs`; `tools/surgefarm.mjs` is a parked-only probe, `tools/parity.mjs` a greedy miner in both modes, D-019): headless, plans each step from what it sees, plays at 3 upgrade strengths, and reports death rate
  and haul per minute **in both modes** (answers Q-007). It also tries degenerate loops (e.g. hugging the Nexus edge, farming Glitches at the Nexus rim). Needed before M6 balance work.
- **S-15 Throttled perf check:** frame time with CDP CPU throttling ×4 during heavy (Wide) mining. Budget p95 16.7 ms.
- ✅ (#15) **S-5 Deterministic gameplay RNG:** one seeded stream per draw (`game.rng.*`, D-025).

## M2 — A world worth exploring
- ✅ (#14) Design session 12: S-4 feel play-tested, M2 measured, specs S-8…S-10, Q-002 decided (D-022…D-024).
- ✅ (#19) Design session 17: rings play-tested, Q-008 measured and settled (D-029), Research v1 specced as S-11 (D-030).
- ✅ (#18) **S-8 Depth rings:** Hearth / Veil / Deep by distance, own rock palette and toughness, named on entry, coloured on the minimap (D-028).
- ✅ (#20) **S-9 Vaults:** 6 sealed 7×7 rooms at d 50–72 with a cache (20◆ + 6▲); old saves skip vaults they already saw (D-031).
- ✅ (#22) **S-10 Lumen ore:** gold ● cells at d ≥ 55 (~141 per world), banked like Shards; nothing spends it yet (D-033).
- Larger world (e.g. 256×256) with lazy chunk generation: only after the throttled perf check, and only if rings feel too short (D-022).
## M3 — Research (new *kinds* of things)
- ✅ (#23) **S-11 Research v1:** a Research tab paid in Lumen; first node = Scanner ping (F / ◎, 12-cell ore reveal, 20 s cooldown) (D-034).
- ✅ (#24) Design session 22: Lumen → Scanner play-tested, Q-010 measured and settled (D-035), beam modes specced (D-036).
- ✅ (#27) **S-12 Scanner shows vault caches** (D-035): a cache within the ping's 12 cells shows as a white glyph + blip, one soft tone (D-040).
- ✅ (#28) **S-13 Beam modes v1 — Wide** (25●): 3 parallel rays, 0.45× each, 0.75× reach; Q / ⟂ switches; `SAVE_FORMAT` 7 (D-041).
- **S-14 Pulse beam** (40●): charge, then a burst that pierces up to 3 cells. Then measure Q-011.

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
- **Recorded audio v1a: audition** (D-037, *waiting on the owner's CC0 pack in `docs/inbox/`*): measure every file, shortlist 2–3
  per game sound (beam, break, pickup, deposit, upgrade, cache, scan, hurt, Glitch death), `audition.html` for the owner to pick by ear.
- **Recorded audio v1b: wire-in** (after the picks): `assets/audio/*.ogg` + `CREDITS.md`, fetch + decode per sound with the synth
  tone as fallback (old Safari), size budget check (≤ 1.5 MB, ≤ 200 KB per file), loudness matched to `tests/audio.cjs` ceilings.
- Generative ambient music layer that reacts to depth and mode.
- PWA: installable and works offline.
- Accessibility: remappable keys, colour-blind-safe ore shapes (they're already shape-coded; audit this), and readable text sizes.
- Performance pass on low-end mobile.

## Later / research spikes (design only until proven)
- Co-op multiplayer: destructible terrain sync is the single largest technical risk. Spike only, no commitment.

## Debt
- ✅ **B-016** (#25): the beam hum was a loud sawtooth drone with a 13 Hz wobble (owner play-test); now a soft bed (D-038).
- ✅ **B-017, B-018** (#26, audit 24): a full-hold deposit beeped for 4.4 s; hurt and Glitch death were buzzy square waves (D-039).
- **Scanner button reach (watch, session 21):** ◎ sits under the minimap, top right; a thumb on a big phone must stretch for it.
  If a play-test says so, try a slot above the left stick's zone.
- **Dev teleport onto a cache (dev only, session 19):** a teleport room that covers a vault cache removes it with no loot.
- **Glitch inside a vault (watch, session 18):** spawning only checks for open cells, so a Glitch can appear in a sealed vault's
  hollow; it gains no ground and fades in 6 s (D-017). Harmless; exclude vault hollows from spawns if a play-test sees it.
- **Bedrock edge (watch, session 17):** a core pushed into the world border in the Deep sits on a near-black band and its beam shows no
  hit. Reads like a dead end, which it is, but silently. If it confuses play-tests, give bedrock hits a dull spark.
- ✅ **B-012** (#17): smoke's "beam mines terrain" was seed-dependent; the seed is now pinned.
- **Missed chime (watch):** the S-4 arpeggio plays only if the hold empties inside the ring. A player (or bot) who leaves mid-stream gets no chime. Keep unless a play-test log says it feels broken.
- ✅ **B-005, B-010, B-011** (#16): cargo kept past the pickup cap; "Upgrade ready" hint; floor pickups saved (D-026).
- **Render cost:** ✅ pickups are culled to the view (B-014, #21). Particles are still drawn uncull'd (short-lived, local). Each on-screen pickup keeps its `shadowBlur`; measure on the throttled perf check (Tooling) before changing that.
- **Glitches still can't path:** after S-6 they give up instead of sticking, so a Surge player deep in tunnels sees Glitches appear, push at rock and fade. If play-tests find that reads as broken, a cheap flow-field toward the core (one BFS per second over explored cells) is the next step; M6's Burrower is the other answer.
- **Late-game parity:** Drift's ore near the Nexus is finite, Glitch drops renewable. Re-run `tools/parity.mjs` with a depleted inner ring (or 30+ min) when M2 depth rings land.
- ✅ **Test trap** (sessions 4, 5): planting a save then reloading let `pagehide` overwrite it. Now a smoke helper, `plantSaveAndReload()`.
