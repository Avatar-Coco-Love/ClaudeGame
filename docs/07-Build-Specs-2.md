# 07 — Build Specs, part 2

Continues `07-Build-Specs.md` (same rules; build order is in its header, D-048). Supply numbers are in that file's header.
Deep basis (session 32, 40 seeds, d ≥ 64): per world ~648 prism, 588 crystal, 110 Lumen cells, 5580 open of 11440.

## S-15 — Throttled perf check (Tooling)
- `tools/perf.cjs`: headless Chromium at 1280×800 DSF 1, CDP `Emulation.setCPUThrottlingRate` 4, seed 77, `dev.teleport(30)`,
  then 20 s of real mining in Wide (`g.research.wide = true; g.beamMode = 'wide'`) with 300 floor pickups on screen
  (`g.spawnPickup(x, y, 'shard', true)` around the core). Reports frame time mean / p95 / max from `requestAnimationFrame` deltas.
  Budget: p95 ≤ 16.7 ms. Also a run with 20 light holes (fake beacon spots) to price S-16. Not in smoke (too slow); log in `09`.

## S-21 — Pulse ready shot + Glitch burst 1.8× (M3 tune) (D-054)
- **Ready shot:** at full charge, held fire releases only if the burst has something within its reach: a live Glitch on the
  ray or any solid cell (`raycast` within `range × PULSE_RANGE`). Otherwise it stays at charge 1 until a target enters the
  ray or fire is let go (release into nothing = a full burst into air, as now). Mining is unchanged (a wall is always in reach).
  D-052's cancels (mode switch, sheet, pause, death) still drop it. While held full, the dotted reach line turns solid at
  60 % alpha (static under reduced motion); no new sound (D-039).
- `PULSE_GLITCH` 1.6 → **1.8** (Beam 2 burst 2.1 × 1.2 × 1.8 = 4.54 one-shots a tier-3 Glitch, 4.5 hp). Sustained vs Glitches
  1.44 hp/s per Beam-0 dps = 0.9× Focus (1.6); mining untouched.
- **Checks:** update `tests/pulse.cjs`'s ×1.6 Glitch check to read `PULSE_GLITCH`; new (fail first on the old code): a full
  charge aimed at a Glitch 1.2× reach away holds, then fires as it enters reach and kills a tier-1 at Beam 2; aimed at open
  floor with nothing in reach it holds ≥ 2 s; the 10 s rock hold stays 0.7–0.9× Focus. Re-run `tools/standoff.mjs` (plain and
  `KITE=1`) and `MODE=pulse` Q-011 probes; log in `09`. Expected (Design 37 prototype): wave3 Beam 2 tier 3 standing, Pulse
  32 hp lost / 0 deaths of 20 (Focus 96 / 20); wave5 Beam 2 tier 0, Focus 0 hp, Pulse 45 (Focus keeps swarms).

## S-16 — Beacons v1 (Crafting, 5▲ each) (D-043)
- New Matrix tab **Craft** (after Research). Item `beacon`, "Beacon", 5▲, holds up to `BEACON_STOCK` 3 unplaced; Crafting is
  its own layer: Radiance grows the Nexus light, a Beacon is light you carry out (no overlap, pillar rule).
- **Place:** B key / `✦` button (hidden until stock ≥ 1, shows the count) drops one on the core's cell. Refused with a 1-word toast
  if the cell isn't open, it's inside the Nexus ring, or another beacon is within `BEACON_GAP` 4 cells. At most `BEACON_MAX` 20 placed.
- **Effect:** a permanent `BEACON_LIGHT` 140 px darkness hole, reveals explored cells within 5 cells once, and a minimap dot
  (white-cyan, always shown). Drawn as a small rotating diamond in a ring (geometry, no object art). Same in Drift and Surge:
  Glitches ignore beacons (Q-001/D-002: no mode-only perk). Rock can't fall back, so a beacon never gets buried.
- No pick-up in v1 (a misplaced beacon is 5▲; revisit if play-tests mind). One soft placement tone, measured like S-14's.
- **Save:** `SAVE_FORMAT` 9 adds `beacons: [cell index…]` and `craft: { beacon: n }`; a format-8 save loads with none (D-005; format 8 went to B-022, D-047).
- **Smoke:** craft spends exactly 5▲ and caps stock at 3; place on open ground works, inside rock / the ring / 3 cells from another
  beacon is refused; the light + minimap dot survive reload; a format-8 save loads; Craft tab fits 320 px; screenshot at DSF 1.
- Placement UX here is the whole of "build mode" (D-048): Relays will reuse the same key/button and refusal toasts.

## S-19 — Spires v1a: placement and dormant Spires (M5, first slice) (D-049)
No relight yet: this slice puts the goal in the world so it can be found, seen and saved. Relight = S-20 / S-23 (`07-…-3`, D-055).
- **Count and place:** `SPIRE_COUNT` 5, one per 72° sector (sector start angle from the seed), centre at d `SPIRE_D` [64, 74]
  cells, 9×9 footprint inside the bedrock border, ≥ 12 cells from every vault centre. Sites come from `seededStream(seed,'spire')`,
  `SPIRE_TRIES` 40 candidates per sector, seed-only like `vaultSites` (D-023). Session 32 measured 40 seeds: 5/5 sectors always fit.
- **D-024 for old saves:** take the first candidate whose footprint has no explored cell; if none, the least-explored one, and
  only unexplored cells are re-typed. The chosen centres are saved (`spires: [{x, y, lit: false}]`), never re-derived.
- **Shape:** a 1-cell-thick ring of `T.SPIRE_SHELL` on the 9×9 edge (hp 6, no yield, like a vault shell) with a 1-cell open gap on each axis,
  open floor inside, and a 3×3 `T.SPIRE` core (unmineable: the beam sparks, no crack, like bedrock). D-055 adds 8 shell cells
  of `T.FACET` at (±2, ±4) and (±4, ±2) from the centre: unmineable, drawn as small dim hexagons (inert until S-20).
- **Look:** the core cell draws a dim violet-white hexagon outline with a slow 6 s breath (static under reduced motion);
  geometry only. Minimap: a hollow hexagon once any footprint cell is explored, always shown after that.
- **Found:** first sight in a save → toast "A dormant Spire (n/5)" + one soft low tone (measured like S-14's, add to ceilings).
  The Matrix stats line adds "Spires 0/5 lit" once one is found. Same in Drift and Surge (Glitches ignore Spires in v1a).
- **Save:** next `SAVE_FORMAT` (10 if S-16 shipped first) adds `spires`; the upgrade step runs the D-024 rule above.
- **Smoke:** 5 sites on 40/40 seeds, all d 64–74, ≥ 12 from vaults, inside the border; same seed → same sites; core and the 8 facet cells take
  no beam damage; a pre-Spire save with a tunnel through candidate 1 gets candidate ≥ 2 and keeps its tunnel; the found toast
  fires once across a reload; `dev.teleport(70, a)` near one and screenshot at DSF 1 (view it).
