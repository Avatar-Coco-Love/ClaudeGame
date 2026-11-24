# 04 — Roadmap

Milestones are ordered. Each bullet is meant to be roughly one PR. Design sessions may reorder, split, or cut items. Mark done items with ✅ and the PR number.
**v1.0 = M1–M5** (Spires, ending, New Cycle); M6–M8 are post-1.0; nothing outside M1–M8 without a design D-xxx (D-045). `VERSION`'s minor counts shipped milestones (D-046).
Items tagged **S-n** have a build-ready spec in `07-Build-Specs.md` / `-2.md`; build order S-15, S-16, S-19 (D-048). Every new sink must state its currency and compare it with the world's supply (see `07` header).

## M1 — Close the loop properly
- ✅ All done (#1–#13, #16, #21): first playable, Pages deploy, smoke + docs tooling, Radiance (S-1), touch hints (S-2), Settings (S-3),
  feel pass (S-4), Glitch give-up (S-6), and Design/Audit sessions 3, 4, 7, 9, 14, 19. Detail per PR in `05` and `09`.

## Tooling (groundwork from Gloamdeep lessons; slot one in before the feature that needs it)
- ✅ (#17) **S-7 Dev panel** (`?dev` or backtick, `__lumen.dev.*`, D-027). Save/load test spots were left out (not in the spec); add when a bot needs them.
- ✅ (#38) **S-17 Touch pass:** landscape title + ◎⟂♪≡ row, 44 px targets, hint wrap, ⟂ label, 2nd finger, tools reject unknown `MODE` (D-050).
- ✅ (#41) **S-18 Code split:** `glitch.js`, `hud.js`, `body.js`, `GLITCH_*` in `config.js`, dead code out, 600-line check (D-053).
- **Surge bot runner** (after S-19, before the Surge Spire defence: it tunes that wave) (`tools/surgebot.cjs`; `tools/surgefarm.mjs` is a parked-only probe, `tools/parity.mjs` a greedy miner in both modes, D-019): headless, plans each step from what it sees, plays at 3 upgrade strengths, and reports death rate
  and haul per minute **in both modes** (answers Q-007). It also tries degenerate loops (e.g. hugging the Nexus edge, farming Glitches at the Nexus rim). Needed before M6 balance work.
- **S-15 Throttled perf check:** frame time with CDP CPU throttling ×4 during heavy (Wide) mining, plus 20 beacon holes. Budget p95 16.7 ms.
- ✅ (#29) Q-011 probes take `MODE=focus|wide|pulse` (`pulse` exits 1 until S-14 adds it, #38); B-019.
- ✅ (#15) **S-5 Deterministic gameplay RNG:** one seeded stream per draw (`game.rng.*`, D-025).

## M2 — A world worth exploring ✅ (v0.2, D-046)
- ✅ (#14) Design session 12: S-4 feel play-tested, M2 measured, specs S-8…S-10, Q-002 decided (D-022…D-024).
- ✅ (#19) Design session 17: rings play-tested, Q-008 measured and settled (D-029), Research v1 specced as S-11 (D-030).
- ✅ (#18) **S-8 Depth rings:** Hearth / Veil / Deep by distance, own rock palette and toughness, named on entry, coloured on the minimap (D-028).
- ✅ (#20) **S-9 Vaults:** 6 sealed 7×7 rooms at d 50–72 with a cache (20◆ + 6▲); old saves skip vaults they already saw (D-031).
- ✅ (#22) **S-10 Lumen ore:** gold ● cells at d ≥ 55 (~141 per world), banked like Shards; nothing spends it yet (D-033).
## M3 — Research (new *kinds* of things)
- ✅ (#23) **S-11 Research v1:** a Research tab paid in Lumen; first node = Scanner ping (F / ◎, 12-cell ore reveal, 20 s cooldown) (D-034).
- ✅ (#24) Design session 22: Lumen → Scanner play-tested, Q-010 measured and settled (D-035), beam modes specced (D-036).
- ✅ (#27) **S-12 Scanner shows vault caches** (D-035): a cache within the ping's 12 cells shows as a white glyph + blip, one soft tone (D-040).
- ✅ (#28) **S-13 Beam modes v1 — Wide** (25●): 3 parallel rays, 0.45× each, 0.75× reach; Q / ⟂ switches; `SAVE_FORMAT` 7 (D-041).
- ✅ (#29) Design session 27: Wide play-tested, Q-011 measured for Focus vs Wide (D-042), S-14 retuned, Beacons specced (S-16, D-043).
- ✅ (#40) **S-14 Pulse beam** (40●): charge, then a burst that pierces up to 3 cells; ~0.8× Focus sustained (D-042, D-052). Q-011 re-run → Design 37.

## M4 — Crafting & building
- **S-16 Beacons v1** (5▲, Craft tab, D-043, `SAVE_FORMAT` 9): placeable light, 140 px, on the minimap. After S-15. Its B / ✦ placement is the build-mode UX (D-048).
- **Relays:** a remote deposit point linked to the Nexus; reuses S-16 placement. Spec in Design 37.

## M5 — The arc (a reason to go deep) — ships v1.0
- **S-19 Spires v1a:** 5 dormant Spires at d 64–74, one per sector, found, saved, on the minimap; no relight yet (D-049).
- Spire relight (Design 37 specs it, Q-012): relighting each one takes a delivery plus a short challenge (a Drift puzzle-ish variant and a Surge defence variant, equally valid).
- Relighting all Spires leads to an ending sequence, then **New Cycle** (a new seed, carrying a small permanent bonus).

## M6 — Surge depth (without making Drift second-class) — post-1.0
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
- ✅ **Projects page card** (D-044, Projects repo #14, session 29): live between Foldwork and Animal Mail Route.

## Later / research spikes (design only until proven)
- Co-op multiplayer: destructible terrain sync is the single largest technical risk. Spike only, no commitment; out of 1.0 (D-045).
- Larger world (e.g. 256×256) with lazy chunk generation: only after the throttled perf check, and only if rings feel too short (D-022; moved out of M2 by D-046).

## Debt
- Moved to `04-Roadmap-2.md` (audit 34, size cap).
