# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v0.4.54 — 2026-11-24 (#55)
- **Relays** (Craft tab, 40◆ + 12▲, up to 3 in a world): carry one out, press B / tap ⊕ on open floor at least 24 cells
  from the Nexus, and from then on cargo you bring within its dashed ring banks right there, with the same ticks and chime
  as the Nexus. It never heals you and Glitches don't mind it: the Nexus is still the only safe place. A Relay is a cyan
  ⊕ with its own soft light and a ring on the minimap. B places whatever you crafted last that you still carry.
- Crafting and building is complete, so the version moves to 0.4 (Research was already complete).

## v0.2.53 — 2026-11-24 (#54)
- The arrow pointing home no longer hides under the minimap, the buttons or the bank panel: it slides inward along its
  heading until it's clear, and so does its "NEXUS" label when your hold is full.
- Messages no longer trip over each other: placing a Beacon that reveals a Spire now shows both, a Spire or a new ring
  stays up for its full time, and a message that arrives meanwhile waits its turn. Switching beam mode still answers at once.
- On narrow phones a message now uses the screen's width instead of wrapping at half of it.
- Beam sparks on a Spire's core and facets are violet like the Spire, not the colour of the rock around it.

## v0.2.52 — 2026-11-24 (#53)
- The Spires are now found: the first time one comes into view you hear a soft low tone and see "A dormant Spire (1/5)",
  a pale hexagon marks it on the minimap from then on, and its core hexagon slowly breathes (still, with reduced motion).
  The Core Matrix's stats line counts "Spires 0/5 lit" once you've found one. Worlds that already saw a Spire keep it
  found, quietly.
- On the narrowest phones the ◆ ▲ ● bank row sits a little tighter, so even a full world's haul stays clear of the minimap.

## v0.2.51 — 2026-11-24 (#52)
- No gameplay change: a design pass on the road to the Spires. Waking a Spire will take 80 Prisms from your cargo first
  and then from your bank, so a world you have already mined out can still be finished in either mode; Surge's Spire
  defence now plans for Spires that sit against the edge of the map; and a Spire your old save had already explored
  past will still count toward the ending.

## v0.2.50 — 2026-11-24 (#51)
- Five dormant Spires now stand in the Deep, one in each direction, 64–74 cells out: a 9×9 shell of pale violet stone
  with an opening on every side, small hexagon facets set in the walls, and a dim hexagon core at the centre. The shell
  can be cut like a vault wall; the core and facets can't be broken. Nothing wakes them yet — that comes next.
- Existing worlds get their Spires only in ground you haven't seen yet, so your tunnels and explored map stay as they were.

## v0.2.49 — 2026-11-24 (#50)
- Behind the scenes: the darkness and light-pool drawing moved into its own module, ready for Relays and Spires to cast
  light the same way Beacons do. The picture is the same; each light pool is now stamped from a ready-made template
  instead of being rebuilt every frame (light drawing ~17 % less work with 20 Beacons on screen).

## v0.2.48 — 2026-11-24 (#49)
- A fully charged Pulse aimed at the unbreakable edge of the map now keeps waiting instead of thumping uselessly every
  second and a half; it still fires the moment rock or a Glitch is in reach.
- A damaged or hand-edited save no longer stops the game from loading: odd Beacon or floor-loot entries are skipped, and
  the carried Beacon count is kept between 0 and 3.
- The "INTEGRITY" label in Surge no longer runs into its bar on any screen size.

## v0.2.47 — 2026-11-24 (#48)
- Beacons now give the floor around them a faint cyan glow, so a Beacon placed in an open cave lights up the ground, not
  just its own glyph. Walls and ore still draw on top, and the glow stays dim enough that the dark still feels dark.
- Small landscape phones (568–700 px wide): the ◎ and ⟂ buttons show just their symbol, the bank numbers are a little
  smaller and the minimap a little smaller, so the top buttons no longer cover your Shards, Prisms and Lumen.

## v0.2.46 — 2026-11-24 (#47)
- No gameplay change. Design pass: Beacons were play-tested in open caves, where their light was hard to see on the dark
  floor; the next update gives each Beacon pool a faint glow on the floor and fixes the top buttons crowding the bank on
  small landscape phones. Decided what a New Cycle keeps after the ending: your cycle count, your records and a new Nexus
  colour, nothing that makes the next world easier. The road to v1.0 is planned as eleven small updates.

## v0.2.45 — 2026-11-24 (#46)
- Beacons: a new **Craft** tab at the Nexus turns 5 Prisms into a Beacon (carry up to 3). Out in the caves press B, or tap ✦,
  to set one down on your spot: it lights the area around it for good and shows as a white-cyan dot on the minimap. Up to
  20 per world, 4 cells apart, outside the Nexus ring; a short message says why when a spot won't take one. Same in Drift and Surge.
- Phones: the four Matrix tabs fit at 320 px; in landscape ✦ sits under the button row, beside the minimap.

## v0.2.44 — 2026-11-24 (#45)
- Pulse beam: a full charge now waits while you hold it, its reach line turning solid, and fires the moment a Glitch or
  a wall is in range instead of firing into empty air. Pulse bursts also hit Glitches harder (one shot now drops a
  tier-3 Glitch at Beam Power 2). Mining with Pulse feels the same.

## v0.2.43 — 2026-11-24 (#44)
- Switching apps or tabs while charging a Pulse no longer fires it: the charge is simply dropped, like pausing.
- On phones, a finger resting on ◎ or ⟂ no longer locks up the aim stick when your other thumb lifts.
- Phone menus: the Matrix tabs, buy buttons, Settings switches and ✕ are all thumb-sized now, and ✕ stays inside the sheet
  on narrow screens (your bank moves to its own row).
- "Cargo full" no longer pops up while you are already unloading in the Nexus. Glitches draw more cheaply; they look the same.

Older entries: v0.2.39–v0.2.42 in `archive/changelog-v0.2.39-v0.2.42.md`, v0.2.34–v0.2.38 in `archive/changelog-v0.2.34-v0.2.38.md`, v0.1.27–v0.1.33 in `archive/changelog-v0.1.27-v0.1.33.md`, v0.1.22–v0.1.26 in `archive/changelog-v0.1.22-v0.1.26.md`, v0.1.17–v0.1.21 in `archive/changelog-v0.1.17-v0.1.21.md`, v0.1.10–v0.1.16 in `archive/changelog-v0.1.10-v0.1.16.md`, v0.1.1–v0.1.9 in `archive/changelog-v0.1.1-v0.1.9.md`.
