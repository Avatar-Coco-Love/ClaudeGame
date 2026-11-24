# 04 — Roadmap

Milestones are ordered. Each bullet is meant to be roughly one PR. Design sessions may reorder, split, or cut items. Mark done items with ✅ and the PR number.
**v1.0 = M1–M5** (Spires, ending, New Cycle); M6–M8 are post-1.0; nothing outside M1–M8 without a design D-xxx (D-045). `VERSION`'s minor counts shipped milestones (D-046).
Items tagged **S-n** have a build-ready spec in `07-Build-Specs*.md`; build order (S-25, S-26, S-19, S-27, S-22, S-20, S-28, S-30, S-23, S-31, S-24, S-29 built; v1.0.0; S-34 built) M6: S-32 (#71, D-096), S-33 (#72, D-097) built: M6 ✅. Every new sink must state its currency and compare it with the world's supply (see `07` header).

## M1 — Close the loop properly
- ✅ All done (#1–#13, #16, #21): first playable, Pages deploy, smoke + docs tooling, Radiance (S-1), touch hints (S-2), Settings (S-3),
  feel pass (S-4), Glitch give-up (S-6), and Design/Audit sessions 3, 4, 7, 9, 14, 19. Detail per PR in `05` and `09`.

## Tooling, M2–M5 ✅ (detail: `archive/2026-11-24-04-done-m2-m5.md`)
- Tooling: dev panel (S-7), deterministic RNG (S-5), touch pass (S-17), code split (S-18), perf check (S-15), standoff + Surge bot (S-30).
- M2 world (rings, vaults, Lumen; v0.2) · M3 Research (Scanner, Wide, Pulse) · M4 Crafting (Beacons, Relays; v0.4) ·
  M5 the arc (Spires found / fed / facets, Wake, Ending, New Cycle; v1.0.0).

## v1.0.x — player feedback
- ✅ (#68) **S-34 Relay reclaim:** pick a placed Relay back up (B / ✦ in its ring) to move it deeper (Q-018 → D-092).

## M6 — Surge depth (without making Drift second-class) ✅ (v1.1, D-097)
- ✅ **S-32 Spitter** (ranged Glitch, Deep; #71, D-096). ✅ **S-33 Weather** (storm / aurora; #72, D-097).

## M7 — Temporary upgrades
- ✅ **S-35** Anomalies v1 (#74, D-099). Specced (D-098, `07-…-5`): **S-36** Lodestone + Ballast, **S-37** map,
  ping, sound → v1.2.

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
- More Glitch variants: Swarm (tiny, many), Burrower (moves through rock); unspecced, out of M6 (D-097).
- Larger world (e.g. 256×256) with lazy chunk generation: only if rings feel too short (D-022; moved out of M2 by D-046).

## Debt
- Moved to `04-Roadmap-2.md` (audit 34, size cap).
