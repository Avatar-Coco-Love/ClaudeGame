# 04 — Roadmap

Milestones are ordered. Each bullet is meant to be roughly one PR. Design sessions may reorder, split, or cut items. Mark done items with ✅ and the PR number.
**v1.0 = M1–M5** (Spires, ending, New Cycle); M6–M8 are post-1.0; M9 Echo added by D-108; **M10–M14 (world, economy, enemies, events, bosses) in `04-Roadmap-3.md`** (D-119); nothing else without a design D-xxx. `VERSION`'s minor counts shipped milestones (D-046).
Items tagged **S-n** have a build-ready spec in `07-Build-Specs*.md`; build order (S-25, S-26, S-19, S-27, S-22, S-20, S-28, S-30, S-23, S-31, S-24, S-29 built; v1.0.0; S-34 built) M6: S-32 (#71, D-096), S-33 (#72, D-097) built: M6 ✅. M7: S-35–S-37 built: M7 ✅ (v1.2). M8: S-38 built (#79, D-104); S-39 built (#81, D-106); S-40 built (#82, D-107); S-41 built (#85, D-109); S-44 built (#90, D-115): M8 ✅ (v1.4). M9: S-42 (#87), S-43 (#88) built: M9 ✅ (D-114; v1.4 lands with M8). Every new sink must state its currency and compare it with the world's supply (see `07` header).

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

## M7 — Temporary upgrades ✅ (v1.2, D-102)
- ✅ **S-35** Anomalies v1 (#74, D-099). ✅ **S-36** Lodestone + Ballast, bot-tuned (#76, D-101). ✅ **S-37** map,
  ping, sound, hint, phone chips (#77, D-102).

## M8 — Polish & platform ✅ (v1.4, D-115)
- **S-44** Ambient music: synthesized pad by depth ring + Drift bell / Surge pulse layer, Music slider (D-114). ✅ built (#90, D-115).
- **S-38** PWA: installable and plays offline (network-first service worker, no file list; D-103). ✅ built (#79, D-104).
- **S-39** Keys by position (`e.code`, AZERTY-safe), then remappable in Settings. ✅ built (#81, D-106).
- **S-40** Readable text (12 px floor in play, Large text setting) + colour-blind check (ΔE ≥ 25, 3 simulations). ✅ built (#82, D-107).
- **S-41** Low-end frame budget: Auto / High / Low graphics (adaptive DPR, fewer particles; simulation unchanged). ✅ built (#85, D-109).
- ✅ **Projects page card** (D-044, Projects repo #14, session 29): live between Foldwork and Animal Mail Route.

## M9 — Echo: one ally that keeps up (owner's ask, D-108) ✅ (D-114; v1.4)
- **S-42** Echo v1: Research 30 ●, BFS follow + blink catch-up, Gather order; `echobot` strand rate 0 over 12 seeds. ✅ built (#87, D-112).
- **S-43** Orders: Guard + one cycling order key / ◇ phone button; `echoOrder` saved (format 16); Wake re-check. ✅ built (#88, D-113).

## When the owner's audio pack lands (D-114; out of M8, Q-021)
- **Recorded audio v1a: audition** (D-037, *waiting on the owner's CC0 pack in `docs/inbox/`*): measure every file, shortlist 2–3
  per game sound (beam, break, pickup, deposit, upgrade, cache, scan, hurt, Glitch death), `audition.html` for the owner to pick by ear.
- **Recorded audio v1b: wire-in** (after the picks): `assets/audio/*.ogg` + `CREDITS.md`, fetch + decode per sound with the synth
  tone as fallback (old Safari), size budget check (≤ 1.5 MB, ≤ 200 KB per file), loudness matched to `tests/audio.cjs` ceilings.

## Later / research spikes (design only until proven)
- Co-op multiplayer: destructible terrain sync is the single largest technical risk. Spike only, no commitment; out of 1.0 (D-045).
- Swarm / Burrower and the larger world moved to M12 / M10 (`04-Roadmap-3.md`, D-119).

## Debt
- Moved to `04-Roadmap-2.md` (audit 34, size cap).
