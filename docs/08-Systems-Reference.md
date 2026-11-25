# 08 — Systems Reference

Per-system detail of what is built, moved word for word from `02` in audit 69 (size cap). `02` keeps one line per system;
update the line here when a system changes. Decisions live in `06`, specs in `07`.

## Systems
- Lumen (S-10, D-033): gold ● at d ≥ 55 (~141 per world). Research tab (S-11, D-034) spends it: Scanner (10●) = F / ◎ ping, ore + unopened vault caches (S-12, D-040) within 12 cells for 6 s, 20 s cooldown.
  Beam modes (`src/beam.js`, Q / ⟂ cycles): Wide (25●, D-041) 3 rays 0.45× each, 0.75× reach; Pulse (40●, D-052) charge → burst, pierce 3, 1.5× reach; a full charge waits for a target in reach (S-21, D-059); Arc (35●, S-55, D-151, `arc.js`) 0.8× ray + 2 jumps × 0.5 to the same kind ≤ 2 cells (most cracked ore first; creatures, never bolts).
  Echo (30●, S-42, D-112, `src/echo.js`): follows down a 24-cell BFS field, blinks beside the core when > 10 cells / sealed off / stuck 1.5 s; Gathers exposed ore ≤ 5 cells from the core at 0.5× beam dps. `tools/echobot.mjs`. Orders (S-43, D-113): R / ◇ cycles Gather ↔ Guard (0.8 hp bolt / 0.8 s at the foe nearest the core ≤ 140 px, clear line); saved `echoOrder`.
- Crafting (S-16, D-043, D-060): Craft tab, Beacon 5▲ (carry 3); B / ✦ places one on the core's cell (open, outside the ring,
  ≥ 4 cells apart, ≤ 20): permanent 140 px light (`game.beacons` in `R.lightSets`, `light.js`, D-067), minimap dot, floor glow (S-25, D-061). Code `craft.js`.
  Wards (S-56, D-153, D-154, `ward.js`): ▲8 ◆30, carry 2, ≤ 4, ≥ 6 cells apart, not the Nexus disc; every 0.8 s 1.2 hp at the
  nearest creature ≤ 4 cells with a clear line (both modes); a Ward kill drops carried / eaten ore, no loot. Saved `wards` (22).
  Relays (S-22, D-076): 40◆ + 12▲, carry 1, ≤ 3, d ≥ 24, 16 cells from Relays / vault centres / Spire footprints; cargo
  within 64 px banks like the Nexus (`game.atDeposit()`), no heal; B / ⊕↑ in a ring picks it up (S-34, D-093); ⊕ glyph, 100 px light, minimap ring. B places `craft.last`.
- Vaults (S-9, D-031): 6 sealed 7×7 rooms at d 50–72 (seed-only sites); the centre cache bursts 20◆ + 6▲. Old saves skip seen vaults (`vaultSkip`).
- Spires (S-19, D-049, D-068, `spire.js`): 5 dormant 9×9 sites at d 64–74, one per 72° sector, saved as `game.spires`
  (`{x, y, seen, fed, mask, lit, mode, keep}`); shell cuttable, core + facets `UNBREAKABLE`. Found (S-27, D-072): toast + tone, minimap hexagon, breath, stats line.
  Feed (S-20, D-078): in the 7×7 interior ▲ flows in 8/s, cargo then bank (D-070), arc fed / 80; at 80 `mask` = S-28's
  start pattern (`startMask`, `FACET_RING`; lit facets glow) + "Spire primed"; a broken Spire (D-069) relights instead. Wake lanes D-071.
  Facets (S-28, D-080, D-083): 0.35 s of the aim ray (or one Pulse burst) flips a primed facet + neighbours; all 8 →
  relit: 260 px light (`game.spireLights` = `R.lightSets[2]`), chime, filled hexagon, `mode` saved; primed hint. Drift only (S-23).
  Wake (S-23, D-086, `wake.js`): Surge, enter primed → 4 lanes cleared, Glitches go for the core (charge 100, −10), 40 s → relit 'surge'; fail → step out/in. S-31: tier −1, no despawn, orange clock (D-088); camera frames the core (D-089).
  Ending (S-24, D-090, `ending.js`): 5/5 relit → 8 s map overview + lines (skippable) → card; `ended` saved, dark 0.93 → 0.5.
  New Cycle (S-29, D-091): card / title → fresh seed, `cycle` + 1, `records` (best, per cycle) kept, Nexus hue `NEXUS_HUES`.
  One toggle per aim for every beam (D-084: Pulse `beam.facetLatch`; a Glitch on the ray pauses the dwell latch).
- Darkness/light overlay, explored-only minimap, Nexus pointer (slides clear of HUD boxes, D-074), toasts (queued, D-073; phones: below the core / under the bank panel, tap answers first, D-084), hints, synthesized audio (beam hum = soft bed, B-016/D-038, measured
  −42 → −57 dBFS by `tests/audio.cjs`, which also bounds every one-shot and the deposit ticks (D-039); recorded CC0 audio waits on the owner's pack, D-037, post-M9 per D-114), and a mute toggle. Music (S-44, D-115, `music.js`): pad chords per ring (pentatonic / dorian / aeolian, root −2 st per ring) + Drift bell or Surge pulse (equal RMS), Wake = root chord + pulse ×1.5, Ending fades out; own PRNG (seed + 'music'); bus under master; `settings.music`; `tests/music.cjs`.
- Dev tools (S-7, D-027): `window.__lumen.dev.*` (resources, teleport 0/30/60 cells, god, mode, max all); panel via `?dev` or backtick.
- M2 rules (D-022…D-024): depth = 3 rings in the 160-cell world; new generation changes layout only where a save hasn't looked. Bots/probes in `tools/` (wakeprobe D-087; surgebot S-30/D-085: A*, fights, `--route=mine|rim|hug|spire|deep`; spireloop + facetprobe D-079/D-080, spirerun D-070, relayrun D-076, vaultfind, surgefarm, parity D-019, deeprun D-029, standoff D-054, perf D-057; each file's header says how). Economy: a world holds ~2750◆ / 1470▲; a full Core Matrix costs 2482◆ / 246▲.
- Shoal / Kiln systems (moved word for word from `02` in audit 109):
  Undertow (S-47a, D-127, `undertow.js`): ~half the Shoal's chunks flow 30–55 px/s (seeded, unsaved), eased 0.5 s into the realized velocity; pickups ×0.5.
  Brittle glass (S-47b, D-128, `shatter.js`): a Shoal rock break cracks a seeded neighbour 60 %, no chains; lydian music.
  Kiln heat (S-48a, D-130, `heat.js`): beam on Kiln rock heats (8 s → 1.2 s overheat), cools 2×; arc; reset by a death (D-131).
  Flare vents (S-48b, D-132, `vent.js`): 126 seed Kiln sites, 8 s cycle (1 s tell, 0.6 s flare r 2.5): shove + 0.4 heat. Both unsaved. A vent ≤ 5 cells (`VENT_HEAR_R`) sounds its tell once a cycle (`audio.ventTell`, audit 109, D-144).
  Biome ores (S-49, D-135, format 19): Tide ≈ (`T.TIDE`, Shoal ROCK / DENSE where seed noise at x/5 > 0.76) and Calx ⬟ (`T.CALX`,
  Kiln, > 0.79), re-typed last in `generate()`; hp 3.0 / 4.2 (not ring-scaled), yield 1; Calx counts as Kiln rock for heat.
  `ORE_KIND` has both (Scanner, Echo, minimap). Spent with ◆ on Overdrive (S-50) and the Chart (S-52). Added in audit 114.
- PWA, Graphics, Keys, Text (moved word for word from `02` in Design 112):
- PWA (S-38, D-104): `manifest.webmanifest` + `icons/`, network-first `sw.js?v=VERSION` (cache `lumen-<VERSION>`, warmed
  from the first visit's loaded files), registered by `src/pwa.js` (not on `file:`/`?dev`); offline navigations ignore the query (D-105). Test `pwa.cjs`.
- Graphics (S-41, D-109, `quality.js`): Settings → Auto / High / Low; Auto samples the frame gap (p90 over 3 s): > 24 ms
  D-110: a step down that doesn't beat 0.85 × its p90 is undone and Auto stops stepping down (30 Hz caps); DPR ≤ 1 skips L1.
- Keys (S-39, D-106, `keys.js`/`keysui.js`): read by position (`e.code`, AZERTY-safe); Settings → Keys rebinds eleven
  actions (clash swaps, Esc cancels, Reset) into `settings.keys`; arrows/Esc/Enter/Tab fixed; labels follow the bindings.
- Text (S-40, D-107): every font size × `--ts` (Settings → Large text = 1.2); 12 px floor in play (title footer 11).
  `tests/colours.cjs`: must-tell-apart pairs ΔE ≥ 25 under 3 colour-blind sims, or a shape difference (Shard/Prism).
