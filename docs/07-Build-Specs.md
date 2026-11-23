# 07 — Build Specs

Specs ready to build, in roadmap order. Written by Design sessions. A Build session takes the top spec, builds it, deletes it here,
and marks the item ✅ in `04`. Numbers here are starting values; they go in `src/config.js`, never inline.
Measured basis (session 3, 40 seeds, see `09`): Shards in a world ≈ 2750◆ (1376 crystal cells × 2), maxing the Core Matrix costs 2482◆.
Prisms in a world ≈ 1470▲; the Core Matrix takes 246▲ and Radiance 113▲. The first Prism is 32 cells out. (S-1, S-2, S-6, S-3, S-4, S-5 built in #7, #8, #10, #12, #13, #15.)
M2 basis (session 12, 40 seeds): cells by distance, rock/dense/crystal/prism: d 50–65 1410/666/263/210, d 65–80 1686/997/332/360.

## S-7 — Dev panel (tooling)
- `?dev` in the URL or the backtick key shows a small fixed panel (hidden otherwise, never in the save): +100◆, +50▲, teleport to ring
  (0/30/60 cells out, carving a 3-cell room), god mode (no damage), Drift/Surge toggle, max all upgrades.
- All actions are `window.__lumen.dev.*` functions first; the panel only calls them, so bots and smoke use the same entry points.
- **Smoke:** `__lumen.dev.teleport(60)` puts the core ≥ 1800 px from the Nexus in open space; the panel is absent without `?dev`.

## S-8 — Depth rings (M2, D-022)
- `RINGS` in `config.js`: **Hearth** d < 24, **Veil** 24–48, **Deep** ≥ 48 (d = cells from the Nexus; the corners are Deep).
  Each ring: `name`, `r0`, `rockFill`/`rockEdge`, `denseFill`/`denseEdge`, `hpMul`. Start: Hearth = today's blues, hpMul 1;
  Veil = teal-violet, hpMul 1.4; Deep = magenta-indigo, hpMul 2. `world.ring(x, y)` returns the index (precompute a Uint8Array).
- `hpMul` scales only ROCK and DENSE; ore hp stays, so ore still breaks fast and Beam Power gains a reason late on.
- Chunk render and the minimap colour ROCK/DENSE by ring; ore and bedrock look the same everywhere. Layout and ore are unchanged (D-023).
- The first time a session's core enters a ring: a toast with its name ("Entering the Veil"), and the beam hum's pitch drops one step
  per ring. Same in Drift and Surge.
- **Smoke:** `ring()` at d 10/30/60 = 0/1/2; one ROCK cell in the Deep takes 2× the beam time of a Hearth one; the cell layout of a
  seed (empty/solid bitset) is identical before and after (hash it in the test). **Screenshot** a Veil–Deep border at DSF 1.

## S-9 — Vaults (M2, D-023)
- 6 per world, stamped after generation: centres at d 50–72 from `mulberry32(hash(seed, 'vault'))`, ≥ 20 cells apart, footprint
  inside the border, 200 tries (6/6 placed on all 40 measured seeds). Three 7×7 templates as string grids in `world.js`:
  diamond, hexagon, cross. Shell = new `T.VAULT` (hp 6, white-cyan edge, no yield); interior empty; centre = `T.CACHE` (hp 3).
- Breaking a CACHE bursts 20◆ + 6▲ as pickups plus a chord; the broken bit in the save already remembers it. No new save state for loot.
- Old saves (D-023): the save upgrade (`SAVE_FORMAT` 3) records `vaultSkip`, the vaults whose footprint touches a cell that save has
  already explored or broken; they are never stamped. New worlds store `vaultSkip: []`.
- Minimap draws an explored vault shell in white. Supply check: 120◆ + 36▲ per world, about 4 % / 2.5 % of the world's ore.
- **Smoke:** 6 vaults on a fresh seed; breaking a cache gives 20◆ + 6▲; a format-2 save with explored cells over a vault loads with
  that vault skipped and keeps its tunnels; reload keeps an opened cache open.

## S-10 — Lumen ore (M2; build directly before Research v1, D-024)
- New `T.LUMEN` (gold `#ffc94f`, glyph ●, hp 3.5, yield 1) re-types ROCK/DENSE cells at d ≥ 55 where a new noise
  (salt `0x27d4eb2f`) at (x/5, y/5) > 0.80: ~141 cells per world (40 seeds), none closer than 55. Layout unchanged.
- `lumen` joins cargo/bank (SAVE_FORMAT bump, upgrade step adds 0). The HUD shows ● only once you have held one.
- Nothing spends Lumen yet: S-10 and Research v1 (spec in the next Design) ship back to back, no other build between them.
- **Smoke:** Lumen exists only at d ≥ 55; mining one banks 1●; an old save loads with `bank.lumen = 0`.
