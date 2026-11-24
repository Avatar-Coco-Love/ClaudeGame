# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

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

## v0.2.38 — 2026-11-24 (#39)
- Smoother frames with loot on the floor: glowing Shards, Prisms and Lumen are now drawn from a ready-made glow, so a cache burst
  or a dropped hold no longer slows the game. Scanner pings with many ore marks are smooth too. They look the same as before.

## v0.2.37 — 2026-11-24 (#38)
- Phones: in landscape the title logo and version line fit, and ◎ ⟂ ♪ ≡ move into one row at the top, away from your aiming thumb.
  ⟂ now says which beam is on (Focus / Wide). Buttons are at least 44 px; the first hint wraps instead of being cut at 320 px.
  Lifting one aim finger while another is down hands the stick to the other finger.

## v0.2.36 — 2026-11-24 (#37)
- No gameplay change. Design pass: the next six builds are planned (phone layout fixes, Pulse beam, Beacons, and the first
  dormant Spires, the goal of v1.0). The README now lists every key and touch button.

## v0.2.35 — 2026-11-24 (#36)
- Fixes: mining always drops ore again, even on a floor crowded with scattered cargo (old loot fades first; your own cargo never does).
  A Glitch your beam has just destroyed can no longer hit you, and one destroyed as it gives up still drops its loot.
  F and Q are no longer swallowed by the tiny pause on a crystal break. The Matrix sheet's bank counts up as you deposit.
  A Scanner ping with nothing in range still sweeps its ring, so you can see it fired.

## v0.2.34 — 2026-11-24 (#35)
- No gameplay change. The game now has a finish line: version 1.0 arrives with the Spires, the ending and New Cycle.
  The middle version number now counts finished milestones, so this is 0.2 (the depth rings, vaults and Lumen are done).

## v0.1.33 — 2026-11-24 (#34)
- Health check, no gameplay change yet: found bugs to fix next (mining can stop dropping anything when the floor is
  crowded with scattered cargo; a Glitch the beam just killed can still hit you; some phone-layout problems in landscape).

## v0.1.32 — 2026-11-24 (#33)
- The site update in v0.1.31 never went live (GitHub's publish step kept failing); publishing is now sturdier, so the
  share image and the Projects page card picture show up.

## v0.1.31 — 2026-11-24 (#32)
- Links to Lumen Core now show the game's picture: the share image was never actually published to the site, so link
  previews and the Projects page card showed a broken image. Lumen Core's card is now on the Projects page.

## v0.1.30 — 2026-11-24 (#31)
- Sharing a link to Lumen Core now shows a real frame of the game (the Nexus, a fresh tunnel, the beam) and a one-line summary.
  A Lumen Core card for the owner's Projects page is ready to add there.

## v0.1.29 — 2026-11-23 (#29)
- Design pass, no gameplay change: Wide Beam play-tested and measured against Focus (Focus travels faster, Wide harvests
  more Shards). Next up: the **Pulse** beam (charge and release, longer reach) and the first craftable item, **Beacons**.

## v0.1.28 — 2026-11-23 (#28)
- New Research for 25●: **Wide Beam**. Press **Q** (or tap the new **⟂** button) to switch between Focus and Wide. Wide fires
  three parallel beams that carve a hall three cells wide; each cell takes longer, and the reach is shorter. Your choice is saved.

## v0.1.27 — 2026-11-23 (#27)
- The **Scanner** ping now also finds sealed **vault caches**: if one lies within its 12 cells, a white square-in-square glyph
  lights up where it is (and a white blip on the minimap) as the ring reaches it, with one soft chime. Opened caches don't show.

Older entries: v0.1.22–v0.1.26 in `archive/changelog-v0.1.22-v0.1.26.md`, v0.1.17–v0.1.21 in `archive/changelog-v0.1.17-v0.1.21.md`, v0.1.10–v0.1.16 in `archive/changelog-v0.1.10-v0.1.16.md`, v0.1.1–v0.1.9 in `archive/changelog-v0.1.1-v0.1.9.md`.
