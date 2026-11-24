# 04 — Roadmap

Milestones are ordered. Each bullet is meant to be roughly one PR. Design sessions may reorder, split, or cut items. Mark done items with ✅ and the PR number.
**v1.0 = M1–M5** (Spires, ending, New Cycle); M6–M8 are post-1.0; nothing outside M1–M8 without a design D-xxx (D-045). `VERSION`'s minor counts shipped milestones (D-046).
Items tagged **S-n** have a build-ready spec in `07-Build-Specs*.md`; build order (S-25, S-26, S-19, S-27, S-22, S-20 built) S-28, S-30 Surge bot, S-23, S-24, S-29 (D-063). Every new sink must state its currency and compare it with the world's supply (see `07` header).

## M1 — Close the loop properly
- ✅ All done (#1–#13, #16, #21): first playable, Pages deploy, smoke + docs tooling, Radiance (S-1), touch hints (S-2), Settings (S-3),
  feel pass (S-4), Glitch give-up (S-6), and Design/Audit sessions 3, 4, 7, 9, 14, 19. Detail per PR in `05` and `09`.

## Tooling (groundwork from Gloamdeep lessons; slot one in before the feature that needs it)
- ✅ (#17) **S-7 Dev panel** (`?dev` or backtick, `__lumen.dev.*`, D-027). Save/load test spots were left out (not in the spec); add when a bot needs them.
- ✅ (#38) **S-17 Touch pass:** landscape title + ◎⟂♪≡ row, 44 px targets, hint wrap, ⟂ label, 2nd finger, tools reject unknown `MODE` (D-050).
- ✅ (#41) **S-18 Code split:** `glitch.js`, `hud.js`, `body.js`, `GLITCH_*` in `config.js`, dead code out, 600-line check (D-053).
- ✅ (#42) **Standoff probe** `tools/standoff.mjs`: Glitches walk in from 420 px, all beam modes, `KITE=1` (D-054).
- **S-30 Surge bot runner** (after S-28, before S-23: it tunes the Wake): `tools/surgebot.mjs`, A* by dig cost, fights in Surge, routes `mine` / `rim` / `hug` / `spire`,
  3 builds × both modes (answers Q-007). Spec in `07-Build-Specs-4.md` (D-082); seed bot `tools/spireloop.mjs` (Design 52), probes `surgefarm`, `parity` (D-019).
- ✅ (#57) Design session 52: Spire route play-tested in both modes, facet puzzle proven on 2000 seeds (`tools/facetprobe.mjs`), Q-016 closed (D-079…D-082).
- ✅ (#43) **S-15 Perf check:** `tools/perf.cjs` (×4 CPU throttle, Wide + 300 pickups, 20 holes) + `tests/drawcost.cjs` in smoke (counts, ratios; D-057).
- ✅ (#29) Q-011 probes take `MODE=focus|wide|pulse` (`pulse` exits 1 until S-14 adds it, #38); B-019.
- ✅ (#15) **S-5 Deterministic gameplay RNG:** one seeded stream per draw (`game.rng.*`, D-025).

## M2 — A world worth exploring ✅ (v0.2, D-046)
- ✅ (#14) Design session 12: S-4 feel play-tested, M2 measured, specs S-8…S-10, Q-002 decided (D-022…D-024).
- ✅ (#19) Design session 17: rings play-tested, Q-008 measured and settled (D-029), Research v1 specced as S-11 (D-030).
- ✅ (#18) **S-8 Depth rings:** Hearth / Veil / Deep by distance, own rock palette and toughness, named on entry, coloured on the minimap (D-028).
- ✅ (#20) **S-9 Vaults:** 6 sealed 7×7 rooms at d 50–72 with a cache (20◆ + 6▲); old saves skip vaults they already saw (D-031).
- ✅ (#22) **S-10 Lumen ore:** gold ● cells at d ≥ 55 (~141 per world), banked like Shards; nothing spends it yet (D-033).
## M3 — Research (new *kinds* of things) ✅ (closed by #45; counted in v0.4, D-077)
- ✅ (#23) **S-11 Research v1:** a Research tab paid in Lumen; first node = Scanner ping (F / ◎, 12-cell ore reveal, 20 s cooldown) (D-034).
- ✅ (#24) Design session 22: Lumen → Scanner play-tested, Q-010 measured and settled (D-035), beam modes specced (D-036).
- ✅ (#27) **S-12 Scanner shows vault caches** (D-035): a cache within the ping's 12 cells shows as a white glyph + blip, one soft tone (D-040).
- ✅ (#28) **S-13 Beam modes v1 — Wide** (25●): 3 parallel rays, 0.45× each, 0.75× reach; Q / ⟂ switches; `SAVE_FORMAT` 7 (D-041).
- ✅ (#29) Design session 27: Wide play-tested, Q-011 measured for Focus vs Wide (D-042), S-14 retuned, Beacons specced (S-16, D-043).
- ✅ (#40) **S-14 Pulse beam** (40●): charge, then a burst that pierces up to 3 cells; ~0.8× Focus sustained (D-042, D-052).
- ✅ (#42) Design session 37: Pulse play-tested vs Glitches, Q-011 + Q-012 settled (D-054, D-055), Relays + Spire relight specced (D-056).
- ✅ (#45) **S-21 Pulse ready shot:** full charge waits for a target in reach; `PULSE_GLITCH` 1.8; standoff as D-054 predicted (D-059).
- ✅ (#47) Design session 42: Beacons + Pulse play-tested, Q-013 + Q-014 settled (D-061, D-062), M5 specs cut to one PR each (D-063).

## M4 — Crafting & building ✅ (v0.4, D-077)
- ✅ (#46) **S-16 Beacons v1** (5▲, Craft tab, `SAVE_FORMAT` 9): placed light, 140 px, minimap dot; B / ✦ is the build-mode UX (D-043, D-048, D-060).
- ✅ (#48) **S-25 Beacon floor glow + B-034:** faint cyan floor tint in beacon pools (D-061); short-landscape ◎ ⟂ glyph-only (D-064).
- ✅ (#55) **S-22 Relays v1** (12▲ + 40◆, ≤ 3, `SAVE_FORMAT` 11): remote deposit, no heal; B / ✦ places `craft.last` (D-056, D-076).

## M5 — The arc (a reason to go deep) — ships v1.0
- ✅ (#50) **S-26 `light.js` split:** darkness + floor glow in `light.js`, chunk painting in `terrain.js`, `R.lightSets`; cached hole sprites (D-067).
- ✅ (#51) **S-19 Spires v1a:** 5 dormant Spires at d 64–74, one per sector: sites, cells, `SAVE_FORMAT` 10 record (D-049, D-068).
- ✅ (#52) Design session 47: Spire trip + supply measured (`tools/spirerun.mjs`), Q-015 settled (D-069), feed from cargo then bank (D-070), Wake lanes (D-071).
- ✅ (#53) **S-27 Spires found:** breath, minimap hexagon, "A dormant Spire (n/N)" toast + tone, stats line; B-039 fixed (D-072).
- ✅ (#56) **S-20 Spire feed:** 80▲ (cargo, then bank) primes a Spire; a broken one relights (D-055, D-069, D-070, D-078).
- **S-28 Facet puzzle + relit:** 8 facets, 3–5 taps, aim ray only, 260 px light, saves `mode` (Drift; Surge too until S-23) (D-055, D-080, D-081).
- **S-23 Spire Wake:** Surge's path, hold the Spire 40 s down 4 lanes; tuned by the Surge bot (D-055).
- **S-24 Ending:** 5/5 relit → 8 s sequence → summary card, Continue (D-045).
- **S-29 New Cycle:** new seed, carries cycle + records + Nexus hue only (Q-013, D-062). Ships 1.0.0.

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
- Larger world (e.g. 256×256) with lazy chunk generation: only if rings feel too short (D-022; moved out of M2 by D-046).

## Debt
- Moved to `04-Roadmap-2.md` (audit 34, size cap).
