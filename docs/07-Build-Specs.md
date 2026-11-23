# 07 — Build Specs

Specs ready to build, in roadmap order. Written by Design sessions. A Build session takes the top spec, builds it, deletes it here,
and marks the item ✅ in `04`. Numbers here are starting values; they go in `src/config.js`, never inline.
Measured basis (session 3, 40 seeds, see `09`): Shards in a world ≈ 2750◆ (1376 crystal cells × 2), maxing the Core Matrix costs 2482◆.
Prisms in a world ≈ 1470▲; the Core Matrix takes 246▲ and Radiance 113▲. The first Prism is 32 cells out. (S-1, S-2, S-6, S-3 built in #7, #8, #10, #12.)

## S-4 — Feel pass (after S-3, so every effect ships with its off switch)
- Deposit: a rising 3-note arpeggio (one note per resource kind deposited, max 3) and the bank number counts up over 0.4 s.
- Upgrade bought: a 0.4 s expanding ring on the core plus a brief brightening of the matching pip row.
- Cell break: 35 ms hitstop on crystal/prism breaks only, at most once per 150 ms (rock breaks are too frequent for it).
- Beam start: a 0.12 s rising sine sweep, not repeated while the beam stays on.
- Reduced motion turns off hitstop, rings and shake; sounds stay. Also fix B-008 (stale "Press E" hint under the open Matrix).

## S-5 — Deterministic gameplay RNG (tooling, before the Surge bot runner)
- Replace `mulberry32(seed ^ Date.now())` with per-system streams: `rng('pickup')`, `rng('glitch-spawn')`, `rng('glitch-wander')`,
  each `mulberry32(hash(worldSeed, salt))`. Visual-only randomness (particles) may stay on `Math.random`.
- **Smoke:** two games on the same seed with the same scripted input produce the same pickups and Glitch spawns.

## S-7 — Dev panel (tooling)
- `?dev` in the URL or the backtick key shows a small fixed panel (hidden otherwise, never in the save): +100◆, +50▲, teleport to ring
  (0/30/60 cells out, carving a 3-cell room), god mode (no damage), Drift/Surge toggle, max all upgrades.
- All actions are `window.__lumen.dev.*` functions first; the panel only calls them, so bots and smoke use the same entry points.
- **Smoke:** `__lumen.dev.teleport(60)` puts the core ≥ 1800 px from the Nexus in open space; the panel is absent without `?dev`.
