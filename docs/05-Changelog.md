# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

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

## v0.2.42 — 2026-11-24 (#43)
- Smoother frames: the Nexus's glowing rings are now drawn only where they can be seen, and much more cheaply when they are.
  It looks the same; in a slowed-down test browser a frame away from the Nexus takes half as long (106 → 52 ms), at home 117 → 65 ms.

## v0.2.41 — 2026-11-24 (#42)
- No gameplay change. Design pass: the Pulse beam gets a plan to hold a full charge until a Glitch or wall is in reach,
  so it becomes the beam for picking off tough Glitches at range. Relighting a Spire is decided (feed it 80 Prisms, then
  a light puzzle in Drift or a 40 s defence in Surge), and Relays (remote deposit points) are planned.

## v0.2.40 — 2026-11-24 (#41)
- No gameplay change. Behind the scenes the game's code is tidied into smaller pieces (Glitches, the minimap and HUD each have
  their own file) to make room for Beacons and Spires. A recorded Surge run and a test scene look and play exactly the same.

## v0.2.39 — 2026-11-24 (#40)
- New Research node **Pulse Beam** (40● Lumen): hold fire to charge (a dotted line shows its 1.5× reach, the core glows brighter),
  let go to fire one burst that punches through up to 3 cells, or a Glitch. Full charge fires by itself; a short tap just fizzles.
  Q / ⟂ now cycles Focus → Wide → Pulse. Works with the mouse, Space, and the touch aim stick, in Drift and Surge.

Older entries: v0.2.34–v0.2.38 in `archive/changelog-v0.2.34-v0.2.38.md`, v0.1.27–v0.1.33 in `archive/changelog-v0.1.27-v0.1.33.md`, v0.1.22–v0.1.26 in `archive/changelog-v0.1.22-v0.1.26.md`, v0.1.17–v0.1.21 in `archive/changelog-v0.1.17-v0.1.21.md`, v0.1.10–v0.1.16 in `archive/changelog-v0.1.10-v0.1.16.md`, v0.1.1–v0.1.9 in `archive/changelog-v0.1.1-v0.1.9.md`.
