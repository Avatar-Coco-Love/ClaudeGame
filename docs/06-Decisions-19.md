# 06 — Decisions log, part 19

Continues `06-Decisions-18.md` (same rules: supersede, never edit; list rejected alternatives). D-130 on.

### D-130 — Kiln heat as built (session 98, S-48a)
- `src/heat.js` owns it: `heatHit` counts the core's beam damage on Kiln cells (called only from `castBeam` and
  `releasePulse`, so the Echo, Shoal cracks and Wake lanes add none); `updateHeat` runs once a frame after the beam,
  in every mode, so heat cools with the beam off. State `game.heat` + `game.heatState` (never saved); dev flag
  `heatState.off` for `haulrun`.
- An overheat skips the beam step entirely (the intent stays held): no rays, no facet aim, no Pulse charge.
- A Pulse burst counts by the same capped share, so one burst adds at most one frame's heat (dt / 8 s): Pulse
  effectively never overheats. Accepted: it already pays with its charge + recovery gaps (spec: one rule for all).
- The hint shows while heat > 0.3 until the first overheat ends, once per session (`heatState.taught`).
- Measured: `haulrun 20 3 116` median ×1.000 (mean ×1.016, max ×1.063, 18/20 pairs): straight-line legs dig few
  Kiln cells and cool between them. `KILN_HEAT_S` stays 8.
- Rejected: a heat field in the save (spec: transient); heat in `world.hit` (would make the Echo and cracks heat);
  an extra Pulse rule (heat per burst) — a second rule the spec chose not to have.

### D-131 — Audit 99: heat resets on a destabilize; B-086 closed with a guard (session 99, audit)
- `destabilize()` zeroes `game.heat` and any overheat / flash, like `beam.charge`: a respawn at the Nexus fires at once
  (B-087: it kept the Kiln's heat, so a core that died overheated came back with its beam held off). Check in `heat.cjs`.
- B-086 not reproduced: 12 seeded d 110 teleport runs (beam, moving), every cached chunk matched a fresh `paintChunk`
  (0 stale of ~360). Likely a measurement slip (`CELL` is 32 px; this audit's first probe divided by 16 and "found"
  ore that wasn't there). `tests/audit99.cjs` keeps the cache-vs-world comparison (it fails with the dirty repaint removed).
- The toast gets the panel's backing plate everywhere (it read poorly over lit terrain on phones).
- Rejected: heat kept through death (no reason to punish a respawn twice); keeping B-086 open without a repro.

### D-132 — Kiln flare vents as built; M10 closed at v1.5 (session 100, S-48b)
- `src/vent.js`: `ventSites(world, anomalies)` on salt `'vent'` samples whole-map cells, keeps Kiln ones off the border,
  vault / Spire (seed-only choice) footprints and Anomaly cells, ≥ 6 apart: round(Kiln cells / 250) = 126 at 256 (4 seeds).
  The phase is the next draw of the same stream. Terrain untouched; none in a 160 world.
- A flare is live its whole 0.6 s: a core inside at any frame of it is shoved once (`fired` = cycle number), straight
  out from the vent centre (its facing if dead centre). `updateVents` runs after the beam, so the +0.4 never meets
  that frame's cooling; reaching 1 calls `overheat()` (split out of `updateHeat`). Shake 4, no sound (debt).
- Cost: sites bucketed by chunk; only the core's 3×3 chunks are stepped (the game has no view; stricter than view
  + 3), drawing uses view + 3. First draw (blurred hex per vent) took `bigworld.cjs` d 100 / d 30 to 2.3×; idle hexes
  now share one unblurred path (1.00×). Drawn on explored cells, rock or open; hidden while `endSeq` runs.
- Rejected: a flare only on its first frame (a 60 Hz step could make it miss); new empty vent cells (would move a
  256 save's layout); a vent sound now (needs its own audio ceiling pass).

### D-133 — One test server: `tests/serve.cjs` (session 101, debt)
- `createServer()` / `serve()` / `runStandalone()` hold the static server and the standalone runner that 11 test files
  (and `smoke.cjs`, `tools/perf.cjs`) each pasted. Standalone flags kept (`--browser`, `*_SHOT`, `SHOTS`).
- A rule broken twice gets a check: `docs.cjs` fails if any other `tests/*.cjs` calls `http.createServer`.
- Rejected: leave the copies (they drifted: MIME maps, decode, `startsWith` guard differed); route standalone runs through
  `smoke.cjs --only` (the full smoke's setup is minutes; one file must stay seconds).

### D-134 — M11 Economy design: two biome ores, four specs, two cuts (session 102, Design; Q-028)
- Play-test (256, teleport + mine at Ring 90 / 110, mid build): the Shoal and Kiln differ only in rock, flow and heat;
  their ore is the same ◆▲● as the Deep, so the outer rings give no reason to *mine* there. Hence one ore each:
  Tide ≈ (Shoal, cut 0.76) and Calx ⬟ (Kiln, cut 0.79), re-typed last on ROCK / DENSE (D-033's pattern), measured
  over 40 seeds: ≈ 266 (174–359), ⬟ 328 (211–477). Sinks priced so all of M11 ≤ 70 % of the poorest seed.
- Specs S-49 (ores, format 19), S-50 (Overdrive: +2 levels on every Core Matrix row), S-51 (Heat Sink, format 20),
  S-52 (Nexus Chart, format 21; closes M11 at v1.6) in `07-Build-Specs-11.md`. Colours picked by measuring ΔE under
  `colours.cjs`'s four visions: both clear every Shoal / Kiln edge (≥ 33); vs ◆ / ▲ they rely on shape (wave, pentagon).
- Nexus Chart is paid in ≈ / ⬟ + ▲, superseding D-009's "Prisms only" for that row alone. Radiance is unchanged.
- Rejected: the Current Anchor (haulrun measured the Undertow at ×1.00 per round trip, D-127/D-130: calming it buys
  nothing); an M11 Research row (no new kind of thing needs one; ~400● spare waits for M12's beam mode); biome ore
  from Glitch kills (Q-028, leaning no); a converter between ores (would make the biomes interchangeable); scaling
  ore hp by ring (D-033 kept ore hp fixed); Overdrive in a 160 world (no biome ore there: hidden, never stranded).

### D-135 — Biome ores as built (session 103, S-49)
- Tide ≈ / Calx ⬟ are re-typed in `World.biomeOres()`, called last in `generate()`, exactly per S-49 (cuts 0.76 /
  0.79, own salts). Measured: the 4 smoke seeds land at 189–294≈ and 266–347⬟; the 40-seed spread matches D-134.
- **Anomaly sites count a re-typed ore cell as rock** (`anomalySites` accepts ROCK / DENSE / TIDE / CALX). Without it a
  Shoal / Kiln site on a cell that became ore would move, and with it every later site and vent: an old 256 save's
  taken indices would point at other sites. Smoke pins the masked terrain + Anomaly + vent hashes from the pre-S-49 code.
  A site may therefore sit on an ore cell (breaking it yields the ore and takes the site).
- `KINDS` is the one list of resource kinds: `emptyKinds()` builds bank / cargo, `cargoTotal`, `saneSave` and
  `costHtml` iterate it, so S-50+ add no hand-written key lists. Glyphs upright (their shape is the tell, D-107).
- Rejected: skipping ore on Anomaly cells (keeps sites but makes ore placement depend on the site list); a separate
  ore pass after site selection (two passes over 65k cells for one rare overlap).
