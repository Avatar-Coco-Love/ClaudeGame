# 06 — Decisions log, part 18

Continues `06-Decisions-17.md` (same rules: supersede, never edit; list rejected alternatives). D-124 on.

### D-124 — M10's last three specs refined from measurements (session 92, Design; amends S-46b2, S-47, S-48)
- Measured with the flip simulated (the served `config.js` rewritten to `WORLD_SIZE_NEW = 256`): `new Game` 256 = 67 ms
  median at 4× CPU (budget 150); the save is 22.8 KB and fixed-length, so "≤ 32 KB after explore all" holds by
  construction and is checked on a fully set save; at graphics High with Auto off, a frame at d 100 costs the same as
  at d 30 (0.94–0.99×). With Auto on, the probe swung ±40 %, so every perf check fixes the level and interleaves runs.
  Result: the flip needs no perf work; S-46b2 is checks + the flip + the audit 89 site-helper Debt (no `w` default, a
  missing size throws) + Ring 90 / 110 dev buttons. Specs in `07-Build-Specs-9.md`.
- **Undertow 30–55 px/s** (was 40–70): at 70 a level-0 core (190 px/s) lost 37 % heading upstream. The current eases
  over 0.5 s at chunk borders; the Echo ignores it. A new `tools/haulrun.mjs` measures the ≤ 15 % haul cost (the old
  spec named `deeprun`, which times a dig to Lumen, not a round trip).
- **Kiln heat 8 s, vent 1.2 s, restart 0.25** (was 6 / 1.5 / 0.4): the old numbers vent 1.5 / (3.6 + 1.5) = 29 % of
  steady fire, over the spec's own 20 % cap; the new ones vent 17 %. Flare vents keep ≥ 6 cells apart and off sites.
- Brittle: the crack deals 60 % of the neighbour's hp; if that breaks it, it yields normally and cracks nothing.
- Play-test (d 100 / d 115, 256 live): travel Nexus → d 110 is ~10 s straight at max thrust (~19 s at level 0); with
  3 Relays no fast travel is needed. Glitch tier caps at 3 (d ≥ 84), so Shoal / Kiln add no Surge-only difficulty.
- Rejected: lazy chunk generation now (Q-025 stays: 67 ms is under half the budget); an absolute frame-time check in
  smoke (software raster, vsync-quantised 33 / 50 ms frames: only ratios hold); a current that scales with thrust
  level (an upgrade that makes the hazard stronger reads as a punishment); keeping 6 s heat with a shorter vent (0.8 s
  is too short to read as a vent).

## D-125 — Size is required; old-format test saves are 160 worlds (session 93, S-46b2)
- `World` and every site helper throw without a size (`needSize`), no default; the save upgrade names `WORLD_SIZE_OLD`.
- `WORLD_SIZE_NEW` = 256. A test that writes a save of format ≤ 17 builds it from a 160 game (`size: 160`; smoke's
  `plantSaveAndReload(…, true)` moves the live game's progress onto a 160 world of its seed): no such save was ever 256,
  and the 17 → 18 step rightly rejects 256 bitsets. Geometry checks read `world.w` / `save.size` instead of 160.
- Perf budget in smoke (`bigworld.cjs`): `new Game` 256 at CPU ×4 median ≤ 150 ms, full save ≤ 32 KB, draw d 100 ≤ 1.3×
  d 30 (High, Auto off). Rejected: pinning every node test to 160 (loses 256 coverage for no reason); a `?size=` URL
  switch for tests (a player-reachable knob for a test need); keeping the default and grepping callers (silent again).

## D-126 — The floor-glow layer is blitted unsmoothed (session 94, audit; B-084)
- `drawLightGlow` draws its quarter-res layer (`GLOW_DOWN` 4) onto the frame with image smoothing off. Measured headless
  at 1280×800 with 20 pools over the view: that blit 4.0 → 1.4 ms of a ~10 ms frame; drawcost "holes" 2.0× → 1.67×.
  The glow's centre alpha is 0.08, so a 4-px block step is under one 8-bit level (screenshot at 0.3 viewed, zoomed).
- Rejected: loosening the 2× check (the check was right: S-25 was built against it with no margin); GLOW_DOWN 2
  smoothed (3.9 ms, the cost is the smoothed scale, not the layer size); a full-res layer (1:1 blit 0.9 ms, but 20
  full-res disc draws into it cost what D-061 already measured at 2.2×).

## D-127 — S-47 ships in two slices; Undertow first (session 95, build)
- S-47a = Undertow + `haulrun` (`undertow.js`); S-47b = brittle glass + Shoal music. One field per world from
  `seededStream(seed, 'undertow')` in chunk order (every chunk draws, so the Shoal's never shift with the profile). The
  ease is linear from the old current to the new over 0.5 s; the wall stop keeps the core's own velocity apart from the
  current, so a current into a wall never charges or flips it. Pickups take half their chunk's flow with no ease.
  Dashes: 6 slots per flowing chunk in view, open cells only, hashed (not gameplay) positions, cap 30 / 15 at Low.
- Measured: haulrun 20 seeds, level 3: median ×1.000, max ×1.012 (level 0: max ×1.16); 17 / 20 pairs (3 hit Spires).
- Rejected: one PR for all of S-47 (two systems + music + probe); an exponential ease (never "takes 0.5 s"); applying
  the current to the target velocity (the intent would see it, pillar 5); per-chunk streams (more state, same result).

## D-128 — Brittle glass: per-cell seeded pick, cracks via onCellBroken (session 96, build, S-47b)
- `shatter.js`: `game.onCellBroken` calls `shatter()` for a ROCK / DENSE break unless the break was itself a crack
  (`crack` flag), so beam, Pulse and Echo breaks all crack the same and nothing chains. The neighbour is picked by
  `seededStream(seed, 'shatter' + cellIndex)` among standing Shoal ROCK / DENSE 4-neighbours: same seed → same pick
  whatever the break order. Damage = 0.6 × the neighbour's hp via `world.hit` (unsaved, like all damage). A line
  (`SHATTER_RGB`) fades over 0.35 s. Music: `MUSIC_RING_MAX` 3, Shoal = lydian, progression I–II–V–II.
- Rejected: one `'shatter'` stream drawn in break order (picks would depend on what was mined first); cracking from
  inside `world.hit` (World has no game, and Echo / Wake-lane clears would need their own guards); a chain with decay
  (the spec says none, and it would make Shoal tunnels runaway).

### D-129 — Q-027 settled (no d 100 Undertow leg); S-48 split into heat + flare vents (session 97, Design)
- **Q-027: no.** `haulrun` at d 100 (scratch copy) still reads median ×1.000 (level 3: 18/20 pairs, max ×1.30;
  level 0: 19/20, max ×1.31), and an open-corridor probe (5-wide, radial d 82–102 and tangential at d 92, no
  tunnelling) reads ×1.00 (max ×1.05): a round trip cancels a current, and half the chunks are calm. The Undertow is
  felt one way (±29 % at 55 px/s), which is its point; its cost bar stays met. The deeper leg goes into `haulrun` in
  S-48a for the Kiln (`D` arg, 116), where heat slows the digging that dominates a haul.
- **S-48 split** like S-47 (D-127): S-48a heat + phrygian music + probe, S-48b flare vents + the v1.5 close-out.
  Specs in `07-Build-Specs-10.md`. Refinements: heat counts damage share on Kiln cells (by the cell's ring, not the
  chunk's) capped at 1, so Wide / Overclock don't heat faster; the Echo adds none; the beam event is "overheat" so it
  can't be confused with a flare vent; vents don't change terrain (256 saves keep their layout) and only near sites are
  stepped (~126 sites a world).
- Rejected: a d 100 Undertow leg (measured to say nothing); one S-48 PR (two systems + music + probe + close-out is
  past one PR's checks); heat per frame "while the beam touches Kiln" (Wide's 3 cells and Overclock would heat
  faster); carving vents into open floor (moves an existing 256 save's terrain).
