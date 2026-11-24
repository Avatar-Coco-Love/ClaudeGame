# 07 — Build Specs, part 2

Continues `07-Build-Specs.md` (same rules; build order is in its header, D-048). Supply numbers are in that file's header.
Deep basis (session 32, 40 seeds, d ≥ 64): per world ~648 prism, 588 crystal, 110 Lumen cells, 5580 open of 11440.

## S-16 — Beacons v1 (Crafting, 5▲ each) (D-043) — built #46, as-built notes D-060
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
