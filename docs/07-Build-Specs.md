# 07 — Build Specs

Specs ready to build, in roadmap order. Written by Design sessions. A Build session takes the top spec, builds it, deletes it here,
and marks the item ✅ in `04`. Numbers here are starting values; they go in `src/config.js`, never inline.
Measured basis (session 3, 40 seeds, see `09`): Shards in a world ≈ 2750◆ (1376 crystal cells × 2), maxing the Core Matrix costs 2482◆.
Prisms in a world ≈ 1470▲; the Core Matrix takes 246▲ and Radiance 113▲. The first Prism is 32 cells out. (S-1…S-8 built in #7–#18.)
M2 basis (session 12, 40 seeds): cells by distance, rock/dense/crystal/prism: d 50–65 1410/666/263/210, d 65–80 1686/997/332/360.

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

## S-11 — Research v1: Scanner (M3; build right after S-10, D-024, D-030)
- Lumen basis (session 17, 40 seeds, S-10 rule): 143● per world in ~36 blobs, median 2 cells, p90 9. Lumen is scattered, so a
  finder is the first thing worth buying. Planned Research total ≈ 70● (Scanner 10, Wide 30, Pulse 30), about half the world.
- A third Matrix tab, **Research**, next to Core and Nexus. Nodes are one-time unlocks (no levels), paid in Lumen only. v1 has one
  node: **Scanner** (10●). With nothing to buy it reads "Gold Lumen ● hides past 55 cells, in the Deep" (fits 320 px).
- Save: `research: { scanner: true }`; `SAVE_FORMAT` bump on top of S-10's, upgrade step adds `research: {}`.
- **Ping:** F key / a ◎ touch button (shown only once unlocked). Intent `input.scan`; the game realizes it only if unlocked and
  the cooldown is over. Config: `SCAN_RADIUS` 12 cells, `SCAN_COOLDOWN_S` 20, `SCAN_SHOW_S` 6, `SCAN_SPEED` 600 px/s.
  A ring expands from the core; each CRYSTAL/PRISM/LUMEN cell within the radius shows its glyph above the darkness as the ring
  passes, fading over `SCAN_SHOW_S`; minimap blips for the same time. Nothing is marked explored, nothing saved (~46 ore cells per ping).
- Same in Drift and Surge; it shows ore only, never Glitches (Q-009). Reduced motion: no ring, glyphs appear at once.
  Audio: a synthesized sweep (1200→600 Hz, 0.3 s). HUD: the ◎ button / F badge dims during cooldown.
- **Smoke:** Research tab shows the hint at 0●; with 10● buying Scanner leaves 0● and survives reload; F before unlock does
  nothing; F after unlock marks exactly the node-side count of ore cells within 12 and starts a 20 s cooldown; a second F inside
  it does nothing; an S-10-format save loads with `research: {}`.
