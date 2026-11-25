# 07 — Build Specs, part 9

Continues `07-Build-Specs-8.md` (same rules). Design 92 (D-124) refined S-46b2, S-47 and S-48 from measurements; **this
text wins** over part 8 where they differ. Build order: S-46b2 → S-47 → S-48 (M10 done = v1.5).
Measured basis (session 92, 4× CPU, headless, `WORLD_SIZE_NEW` rewritten to 256 in the served `config.js`):
`new Game` 160 / 256 = 38 / 67 ms median (51 / 75 max, 3 seeds × 3); save 9.5 / 22.8 KB and **constant** (the bitsets
pack to a fixed length, so exploring or mining never grows it); live frame at graphics High, Auto off: d 100 / d 30 =
0.94–0.99 (two interleaved passes), 256 = 160. With Auto on, the same probe swung ±40 % (Auto stepping mid-run).

## S-46b2 — The 256 world goes live (M10) (D-120, D-124)
**Save:** none new. New Worlds and New Cycles are 256; a loaded save keeps its own size (160 saves stay 160).
- **Debt first (audit 89):** the site helpers (`vaultSites`, `spireCandidates`, `chooseSpires`, `loadSpires`,
  `spireFootprint`, `isBroken`) and `World`'s constructor lose their `= WORLD_SIZE_OLD` default; every caller passes
  the world's size (save upgrade steps ≤ 17 pass `WORLD_SIZE_OLD` by name). A missing size throws, so a forgotten caller
  fails a check instead of building 160 geometry in a 256 world.
- `WORLD_SIZE_NEW` = 256. Music keeps its ring ≤ 2 clamp (Shoal / Kiln play the Deep pad until S-47 / S-48).
- Dev panel: **Ring 90** / **Ring 110** buttons (teleport into the Shoal / Kiln), shown only in a world with 5 rings.
- Tests: run the full smoke with the flip once before writing checks; a check that pins old-world numbers passes
  `size: 160`, one that only needs geometry reads `world.w`. Never loosen a number to get green.
- **Perf budget (smoke, all relative or with ≥ 2× margin):** (1) `new Game` at 256, CPU ×4 over CDP, median of 3
  seeds ≤ 150 ms; (2) `toSave()` JSON ≤ 32 KB for a 256 world with `explored` and `broken` all set and 300 pickups;
  (3) `drawcost.cjs` style: flushed draw time of a 256 world at d 100 ≤ 1.3× the same page at d 30 (graphics High, Auto
  off, interleaved medians). `tools/perf.cjs` gains `ONLY=far` (256, d 100) for by-hand runs.
- Smoke also: New World and New Cycle build 256; a format-17 save still loads at 160 with its pinned hash; a missing size
  throws in each helper. Screenshots at d 90 and d 110 of a live New World, viewed.

## S-47 — Shoal: brittle glass and the Undertow (M10) (D-120, D-124)
**Save:** none (seed-derived or transient; `damage` is not saved).
- **Brittle:** breaking a Shoal ROCK / DENSE cell adds 60 % of that neighbour's hp as damage to one solid Shoal ROCK /
  DENSE 4-neighbour, picked by `seededStream(seed, 'shatter')` on the cell index. If that breaks it, it yields and
  sounds as normal but cracks nothing (no chains). Never ore, vaults, Spires, bedrock. A faint crack line flashes.
- **Undertow:** each 16-cell chunk with its centre in the Shoal gets a seeded current (salt `'undertow'`): half calm,
  half **30–55 px/s** (≤ 29 % of a level-0 core's 190 px/s, so upstream still moves) in one of 8 directions. The
  core's current eases to its chunk's over 0.5 s (no snap at borders) and adds to the **realized** velocity before
  collision (intent untouched, pillar 5); loose pickups drift at half. Faint dashes move with the flow (≤ 30 on screen,
  15 at Low). Same in Drift and Surge; Glitches and the Echo ignore it (the Echo's blink covers being left behind).
- **Music:** the clamp rises to ring 3; Shoal = lydian pad, root down `RING_PITCH_STEP`; `music.cjs` RMS within 3 dB
  for Shoal × Drift / Surge.
- **Probe:** `tools/haulrun.mjs` (new): a bot tunnels Nexus → d 90 → back with full cargo, 20 seeds, Undertow on vs
  off (a dev flag); median round trip may grow ≤ 15 %, else lower the speed band.
- Smoke: same seed → same crack picks; no chain (a crack that breaks a cell cracks nothing); in a current realized ≠
  intended velocity while the intent is unchanged; a calm chunk adds nothing; the ease takes 0.5 s; Drift = Surge push;
  pickups drift; nothing saved (`toSave` keys unchanged). Screenshot viewed.

## S-48 — Kiln: slag heat and flare vents (M10) (D-120, D-124)
**Save:** none (heat is transient; vents are seed-only sites, like Anomalies).
- **Beam heat:** while the beam damages a Kiln cell, `heat` rises 0 → 1 over `KILN_HEAT_S` **8 s**; it cools at 2×
  that rate otherwise. At 1 the beam **vents**: intent stays on, the realized beam is off for **1.2 s** (hiss, ring
  flash), then heat restarts at **0.25**. Steady fire vents 1.2 / (6 + 1.2) = 17 % of the time (part 8's 6 s / 1.5 s /
  0.4 gave 29 %, over its own 20 % cap). An arc round the core shows heat past 0.3. Wide / Pulse heat at their dps share.
- **Flare vents:** seed-only sites in Kiln (1 per ~250 Kiln cells, salt `'vent'`, ≥ 6 cells apart and off vault /
  Spire / Anomaly footprints), a small hexagon outline. Every 8 s (seeded offset) a 1 s tell, then a 2.5-cell flare for
  0.6 s: a core inside is shoved out at `HURT_KNOCKBACK` and gains +0.4 heat. No damage, no cargo loss, either mode;
  Glitches ignore flares.
- **Music:** the clamp rises to ring 4; Kiln = phrygian, low; same `music.cjs` checks.
- Smoke: heat reaches a vent after 8 s ± 0.2 of Kiln hits and cools when off; rock elsewhere adds nothing; a vent stops
  the realized beam while intent stays on; the 17 % steady share (simulated 60 s); vents are the same for a seed and keep
  their gaps; a flare shoves equally in both modes and never changes integrity or cargo; nothing saved. Screenshot viewed.
