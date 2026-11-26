# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.8.72 — 2026-11-26
- New in the Shoal (large worlds): the Gyre, a second boss. Its lair sits in a whirlpool that carries you round it
  clockwise; one plate glows mint and only it can be cut, and the glow steps round the body every second or so. Ride
  the current with the beam on the glowing plate; each plate keeps the damage it took. Down, it pays like the Crucible
  (with Tide ≈) and the whirlpool stills. Same fight in Drift and Surge for now.

## v1.8.71 — 2026-11-26
- No change in play. A balance bot now fights the Crucible to the end in both modes on every test run, so its two
  forms stay equally quick to take down (about 40 s at the top build).

## v1.8.70 — 2026-11-26
- Health check, no change in play. The game's own test run is about 90 s shorter (its balance bots now run side by
  side), and it reports which tests take longest.

## v1.8.69 — 2026-11-26
- **The Crucible wakes in Surge.** Come within 10 cells in Surge and every plate glows and takes your beam, in any
  order. It fights back: its flare now comes every 4 s and burns (10), and it lobs embers at you when it can see you
  (rock blocks them, your beam pops them). Die and its core heals, but broken plates stay broken. No storm or rift
  starts mid-fight. Drift keeps the calm take-apart puzzle. New low thump and ember sounds.

## v1.8.68 — 2026-11-26
- **The Crucible can be finished.** In the live game the glow stopped after the first plate broke, so no plate took
  damage and the boss could not be downed. Now the glow jumps across the body after every break, as intended.

## v1.8.67 — 2026-11-26
- **The Crucible (first boss, Kiln).** Deep in the Kiln a 9 × 9 lair holds an ember core ringed by eight rose plates.
  Only the plate that glows takes your beam; break it and the glow jumps across the body, so you keep circling it while
  the core flares heat at anyone too close. Strip all eight, break the core, and it bursts 80 ◆, 20 ▲ and 24 ⬟. A seen
  lair is an octagon on the minimap, filled once it is down. Both modes take it apart the same way for now.

## v1.8.66 — 2026-11-26
- **Tide Locks — events and puzzles complete (v1.8).** A vault in the Shoal's outer reaches always sits in a current, and
  its shell only gives to a beam aimed against the flow: cut it from downstream while the Undertow pushes you away. Faint
  mint chevrons on its upstream side show which way the water runs.

## v1.7.65 — 2026-11-25
- **Smoother Scanner ping on phones.** The ping's sweeping ring keeps its amber glow but no longer slows the frame rate
  while it crosses the screen.

## v1.7.64 — 2026-11-25
- **Flare Locks.** A vault deep in the Kiln's outer reaches is quenched: your beam only sparks grey on its shell. Watch its
  edge: it warms orange, then flares (a shove and a burst of heat if you stand close) and for 3 s the shell cuts fast.
  Beam from a few cells out, in time with the cycle. Once opened it stays open.

## v1.7.63 — 2026-11-25
- **Nothing changes on screen yet.** The boss update is planned: the Kiln's Crucible and the Shoal's Gyre, each a core
  ringed by eight plates. In Drift you take one apart by its rule; in Surge you fight it. Same reward either way.

## v1.7.62 — 2026-11-25
- **Rifts are easier to find.** A rift off screen gets a small violet-white chevron at the screen edge that points to it,
  and a soft rising glass chime when it opens (falling, quieter, when it closes). The Scanner marks rift ore like any ore.

## v1.7.61 — 2026-11-25
- **Rifts (first M13 event).** Every 4–6 minutes of play a rift opens 8–12 cells from you in your ring: a 3 × 3 pocket of
  rock turns to that ring's ore for 45 s, each cell rich (twice the drops), with a shimmer, a minimap dot and a toast.
  Unmined cells turn back to rock when it closes. Same in Drift and Surge; never during a Wake or the ending.

## v1.7.60 — 2026-11-25
- **Health check (no gameplay change).** The creature balance checks now always measure on enough worlds to be fair, and
  the Kiln's Burrower balance is checked on every update, like the Shoal's motes and the Wards already were.

## v1.7.59 — 2026-11-25
- **Wards: the creature update is complete (v1.7).** Craft a Ward at the Nexus (▲8 ◆30, carry 2, place up to 4, 6 cells
  apart, anywhere but the Nexus disc). It bolts the nearest creature within 4 cells that it can see, every 0.8 s:
  Glitches and Spitter bolts in Surge, Burrowers and motes in both modes. A Ward guards; it doesn't harvest: what it
  kills drops what it had taken from you, but no loot. Stand on one and press B / tap ⌖↑ to pick it up again for free.

