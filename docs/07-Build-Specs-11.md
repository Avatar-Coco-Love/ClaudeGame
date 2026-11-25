# 07 — Build Specs, part 11: M11 Economy

Continues `07-Build-Specs-10.md` (same rules: one spec = one PR, numbers go in `src/config.js`). Design 102 (D-134).
Build order: **S-49 → S-50 → S-51 → S-52** (M11 done = v1.6 with S-52). The Shoal / Kiln only exist in a 256 world:
a 160 save sees none of M11 (every M11 row and chip stays hidden there, nothing is stranded).
**Measured basis (session 102, 40 seeds × 256, `09`):** ROCK + DENSE cells: Shoal ~5470, Kiln ~11270 (half of them in
the corners past d 128). Shards ◆ in a 256 world ≈ 3380 crystal cells ≈ 6760◆ (base Core Matrix 2482◆); Prisms ≈ 3170
cells ≈ 4760▲; Lumen ≈ 500● (Research costs 105●). Biome ores at the cuts below: **Tide ≈ 266 (174–359)**, **Calx
⬟ 328 (211–477; 194 inside d 128)**. Every M11 sink together stays ≤ 70 % of the *poorest* seed (174≈ / 211⬟).

## S-49 — Biome ores: Tide ≈ (Shoal) and Calx ⬟ (Kiln) (M11)
**Save:** format 19: `bank` and `cargo` gain `tide: 0, calx: 0`; `KINDS` appends `'tide', 'calx'` (floor pickup
indices 3, 4; 0–2 keep their meaning). Smoke: a format-18 save loads with both at 0.
- **Cells:** `T.TIDE`, `T.CALX`, re-typed last in `generate()` (after Lumen, D-033's pattern), on ROCK / DENSE only, each
  from its own noise at x/5, y/5: Tide in Shoal-ring cells where `noise(seed ^ TIDE_SALT)` > **0.76**
  (`TIDE_SALT` 0x3c6ef372); Calx in Kiln-ring cells where `noise(seed ^ CALX_SALT)` > **0.79** (0xa54ff53a).
  Layout, crystal, prism and Lumen cells are unchanged (smoke hashes a 256 world with the two re-types masked out). An
  old 256 save may see a rock it already saw turn to ore (D-033 accepted the same for Lumen; ore never hides ground).
- **Material:** hp fixed (rings don't scale ore): Tide 3.0, Calx 4.2; yield 1 each. Calx is Kiln rock for heat (the
  ring rule of D-130 already counts it). `ORE_KIND` gains both, so the Scanner, the Echo's Gather and the minimap ping
  take them with no new code path.
- **Look:** `RESOURCE.tide` `{ color: '#d8fff0', glyph: '≈', name: 'Tide' }` (pale mint, two wave strokes);
  `RESOURCE.calx` `{ color: '#c8a0ff', glyph: '⬟', name: 'Calx' }` (lilac pentagon). Measured min ΔE over the four
  visions: vs every Shoal / Kiln rock + dense edge ≥ 33 (Tide ≥ 38); Tide vs ◆ 19, Calx vs ◆ 21 and ▲ 15, so those lean on shape (the
  `colours.cjs` shape table gains `wave` and `pentagon`, each proved from the draw code). Tide ↔ Calx 35.
- **HUD:** a bank chip per ore, hidden until that ore was ever held (`stats.tide` / `stats.calx`, Lumen's rule);
  the title line adds them like Lumen. Cargo counts them like any ore. Glitch loot is unchanged (◆ / ▲ only).
- Smoke: 4 seeds: counts within the measured spread, all Tide in ring 3 and all Calx in ring 4, none in a 160 world;
  the masked terrain hash is unchanged; mine one of each → bank +1 at a deposit; a saved floor pickup of each round-
  trips; format 18 → 19; Scanner marks them. Screenshot of both glyphs in place, viewed.

## S-50 — Core Matrix Overdrive (two levels past every max) (M11)
**Save:** none new (`upgrades[id]` just goes past `max`). **Currency:** ◆ + ≈ + ⬟.
- Each of the six upgrades gets `over: 2` levels past `max`; `value(l)` keeps its formula (beam 6.5 dps, range 288 px,
  thrust 398, cargo 170, attractor 288 px, integrity 340 at the top). Price of overdrive step k (0, 1):
  `OVERDRIVE_COST = [{ shard: 120, tide: 5, calx: 5 }, { shard: 200, tide: 9, calx: 9 }]`.
  All 12 steps: 1920◆, 84≈, 84⬟ (◆: 4402 of ~6760 with the base matrix; ≈ 48 % / ⬟ 40 % of the poorest seed).
- **Sheet:** a row's two overdrive pips (hollow, the row's colour, a thin inner line) appear only once its base max is
  reached **and** the world is 256; the buy button names all three prices. No other layer changes these stats.
- Smoke: a maxed row in a 256 world shows the step and charges exactly the price; a 160 world never shows it; stats
  at max + 2 match the formula; can't go past max + 2; Drift = Surge. Screenshot of the sheet, viewed.

## S-51 — Heat Sink (Crafting, Kiln) (M11)
**Save:** format 20: `craft.heatsink` (carried) and `heatSinks: [cell index…]`. **Currency:** ⬟ + ◆.
- Why: steady fire on Kiln rock overheats 1.2 / 7.2 = 17 % of the time (S-48a); the measured haul cost was ×1.00
  (`haulrun`, D-130), so the Sink is for *mining in* the Kiln, not crossing it.
- **Craft:** `HEATSINK_COST = { calx: 6, shard: 20 }`, stock 2 carried, 6 placed, ≥ 6 cells apart, on open floor in the
  Kiln ring only (the place button greys out elsewhere with the reason). Reclaim like a Relay (S-34): full refund.
- **Effect:** while the core is within `HEATSINK_R` **5 cells** of a placed Sink, heat gain × **0.4** (steady fire
  overheats 1.2 / 16.2 = 7.4 %); cooling unchanged; flare vents still add their +0.4. Same in Drift and Surge;
  Glitches and the Echo ignore it. Look: a small upright pentagon outline in Calx lilac with a slow inner pulse and a
  faint 5-cell floor ring when the core is inside; minimap dot. Module `src/heatsink.js` (`craft.js` is 184 lines but
  the draw + rule belong together).
- Smoke: 60 s steady fire inside a Sink overheats 7.4 % ± 2, outside 17 % ± 2; placement rules; reclaim refunds;
  format 19 → 20; 160 world: no row. Screenshot of a placed Sink, viewed.

## S-52 — Nexus Chart (Nexus Development) (M11 done → v1.6)
**Save:** format 21: `nexus.chart` 0–2. **Currency:** ≈ / ⬟ + ▲ (supersedes D-009's "Prisms only" for this one row).
- Level 1 (`{ tide: 24, prism: 10 }`): the minimap draws each **explored** Shoal chunk's current as a short arrow
  (direction + length ∝ speed; calm chunks none). Level 2 (`{ calx: 24, prism: 10 }`): the minimap draws **seen**
  flare vents as dots that brighten during their tell (D-132's "none on the minimap" holds until bought).
  Knowledge only: no stat, no light, nothing another layer gives (the Scanner shows ore, never currents or vents).
- Totals with S-50 + S-51 (6 Sinks): ≈ 108 (62 % of the poorest seed), ⬟ 144 (68 %).
- **Close-out:** M11 done: `VERSION` minor → 1.6 (D-108), `04-Roadmap-3` M11 ✅, `02` scope line.
- Smoke: arrows match `undertow` flow of explored chunks only; vents only once seen; minimap draw cost within
  `drawcost.cjs` budget; format 20 → 21; 160 world hides the row. Screenshot of the charted minimap, viewed.
