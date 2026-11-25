# 07 — Build Specs, part 8

Continues `07-Build-Specs-7.md` (same rules). Written in Design 87 for **M10 World and biomes** (D-119, D-120).
**Design 92 (D-124): S-46b2, S-47, S-48 refined in `07-Build-Specs-9.md`; that text wins.**
Build order: S-45 → S-46 → S-47 → S-48. **Sink:** none (M11 adds the biome resources). **Layer:** none.
Measured basis (session 87, 4× CPU): `new World` 160 / 256 = 36 / 65 ms median (65 / 112 max); save 9.5 / 22.8 KB.

## S-45 — World size as saved data (M10) (D-120)
**Save:** `size` (format 18). No visible change: every world is still 160 in this PR.
- `World(seed, vaultSkip, size)`; `w`/`h` = size. Every reader of `WORLD_W`/`WORLD_H` (world, save, spire, minimap,
  ending map) takes the world's own size; `WORLD_W`/`WORLD_H` are replaced by `WORLD_SIZE_NEW` (160 here) and
  `WORLD_SIZE_OLD` (160). A **profile** per size in `config.js` holds what differs: ring count, vault count, Anomaly
  counts by ring (`WORLD_PROFILES[160]` = today's numbers, word for word).
- Save: `toSave()` writes `size`; step 17 → 18 adds `size: 160`. `saneSave`: size must be a key of `WORLD_PROFILES`
  and each bitset must unpack to exactly size² bits, else no save (B-066 rule). New World / New Cycle use `WORLD_SIZE_NEW`.
- Smoke (`tests/world.cjs`): a format-17 save loads at 160 with every cell, vault, Spire and Anomaly site identical to
  a build from the same seed before this PR (hash of `cells` + site lists, pinned in the test from the old code; prove it
  fails if the profile's numbers are changed); a `size: 256` game (dev) builds, saves and reloads with the same hash;
  a save whose bitset length doesn't match its size → no save. `saveformat.cjs` passes untouched.

## S-46 — The 256 world and two rings past Deep (M10) (D-120)
_D-122: split. S-46a (built, v1.4.30) = rings, palettes, sites (outer vaults d 86–118). D-123: S-46b1 (built, v1.4.31) =
minimap window + ending frame (no Nexus arrow: the window always holds it); S-46b2 = perf budget, the flip._
**Save:** none new (S-45 carries `size`). New worlds and New Cycles are 256.
- `WORLD_SIZE_NEW` = 256. `RINGS` gains **Shoal** (r0 80, hp ×2.2) and **Kiln** (r0 104, hp ×2.6), each with its own
  rock / dense palette (Shoal glassy mint + ice, Kiln ember orange + rose; `tests/colours.cjs` pairs vs Shard, Prism,
  Lumen, Anomaly amber and each other, ΔE ≥ 25 under the 3 sims) and a ring toast; the profile caps a 160 world at 3 rings.
- Sites: profile 256 adds 4 vaults (d 82–118) and Anomalies `[3, 5, 8, 6, 6]` (Shoal d 82–102, Kiln d 106–124), drawn
  after the old lists with new salts. Spires unchanged (d 64–74). Radiance's explored disc unchanged.
- **Minimap:** a 160-cell window centred on the core, clamped to the world (160 worlds: the whole map, as today);
  marks outside the window are hidden, the Nexus mark pins to the edge as an arrow. Ending map: frames the explored area.
- **Perf budget (checked, not guessed):** `new Game` at 256 ≤ 150 ms on 4× CPU (test runs throttled in Chromium, 3
  seeds, median); `tools/perf.cjs` `base` run at d 100 within 10 % of d 30; save ≤ 32 KB after a dev "explore all".
- Smoke: a 256 world has 5 rings with Shoal / Kiln at the right distances; a 160 save still has 3; minimap at 256 shows
  the core inside the window and the Nexus arrow when far; budget checks above. Screenshot at d 90 and d 110, viewed.

## S-47 — Shoal: brittle glass and the Undertow (M10) (D-120)
**Save:** none (all seed-derived or transient).
- **Brittle:** breaking a Shoal ROCK / DENSE cell adds 60 % damage to one solid Shoal neighbour (4-neighbour, picked by
  `seededStream(seed, 'shatter')` on the cell index, so a seed always cracks the same way); never chains (that crack
  can't trigger another); never touches ore, vaults, Spires, bedrock. A faint crack line flashes between the two.
- **Undertow (hazard):** each 16-cell chunk in Shoal gets a seeded current (salt `'undertow'`): half calm, half
  `UNDERTOW_PX_S` 40–70 px/s in one of 8 directions. In open Shoal cells it adds to the core's **realized** velocity
  (intent untouched, pillar 5) and drifts loose pickups at half that. Shown as faint dashes moving with the flow
  (≤ 30 on screen, half at Low). Same in Drift and Surge; Glitches ignore it; the Echo's blink covers being pushed.
- **Music:** ring 3 progression (lydian, root drops `RING_PITCH_STEP`); `tests/music.cjs` ceilings apply to Shoal ×
  Drift / Surge (RMS within 3 dB of each other).
- Smoke: same seed → same crack picks; a crack never chains; in a current the core's realized ≠ intended velocity while
  the intent is unchanged; a calm chunk adds nothing; Drift and Surge push equally; pickups drift. Tuning: `tools/deeprun`
  at d 90 — currents may slow a haul by ≤ 15 %. Screenshot viewed.

## S-48 — Kiln: slag heat and flare vents (M10) (D-120)
**Save:** none (heat is transient; vents are seed-only sites, like Anomalies).
- **Beam heat:** while the beam damages a Kiln cell, `heat` rises 0 → 1 over `KILN_HEAT_S` 6 s; it cools at 2× that
  rate otherwise. At 1 the beam **vents**: intent stays on, the realized beam is off for 1.5 s (a hiss, a ring flash),
  then heat restarts at 0.4. A thin arc round the core shows heat once it passes 0.3. Wide / Pulse heat at their dps share.
- **Flare vents (hazard):** seed-only sites in Kiln (1 per ~250 open-or-rock Kiln cells, salt `'vent'`), drawn as a small
  hexagon outline; every 8 s (offset per site) a flare radius 2.5 cells glows for 0.6 s after a 1 s tell. A core inside
  is shoved out at `HURT_KNOCKBACK` speed and gets +0.4 heat. No damage and no cargo loss in either mode.
- **Music:** ring 4 progression (phrygian, low); same `music.cjs` checks for Kiln × Drift / Surge.
- Smoke: heat 0 → vent in 6 s ± 0.2 of Kiln hits, cools when off, rock elsewhere adds nothing; a vent stops the realized
  beam while the intent stays on; vents are the same for a seed; a flare shoves the core equally in both modes and never
  changes integrity or cargo; nothing is saved (`toSave` keys unchanged). `tools/deeprun` at d 110: vents ≤ 20 % of beam time.
  Screenshot viewed.
