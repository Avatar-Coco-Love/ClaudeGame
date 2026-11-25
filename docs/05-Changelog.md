# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.6.49 — 2026-11-25
- **New: Nexus Chart (Nexus tab, new worlds). The economy milestone is complete: v1.6.** Level 1 (≈24 ▲10) draws the
  Shoal's currents on the minimap as arrows (longer = faster) wherever you have explored; level 2 (⬟24 ▲10) marks the
  Kiln's flare vents you have seen, and a vent about to flare brightens. Knowledge only: no light, no stat. Same in
  Drift and Surge. Older (smaller) worlds have no Shoal or Kiln, so the row stays hidden there.

## v1.5.48 — 2026-11-25
- **Design pass, no gameplay change.** The Kiln was play-tested with Heat Sinks and Overdrive, and the next milestone
  is planned: creatures native to the Shoal and the Kiln (a Burrower that tunnels through rock, a swarm of motes that
  rides the currents), an Arc beam mode and a Ward node. In Surge they hunt you; in Drift they go after your ore.

## v1.5.47 — 2026-11-25
- **New: Heat Sinks (Craft tab, new worlds).** Craft one for ⬟6 ◆20 (carry 2, place up to 6) and set it down with B / ✦
  on Kiln floor: a lilac pentagon. Within 5 cells your beam heats 60 % slower, so you can mine the Kiln with far fewer
  overheats. Off Kiln floor the place button greys out and says why; press it on a placed Sink to pick it back up, free.

## v1.5.46 — 2026-11-25
- **New: Core Matrix Overdrive.** In a new (256) world, once a Core Matrix row is maxed it shows two more hollow pips:
  each costs Shards plus the Shoal's Tide ≈ and the Kiln's Calx ⬟ (◆120 ≈5 ⬟5, then ◆200 ≈9 ⬟9), so the biome ores
  finally buy something. At the very top: beam 6.5 dps, range 288 px, speed 398, cargo 170, pull 288 px, 340 hp.

## v1.5.45 — 2026-11-25
- **Nothing changes on screen.** The workflow now reviews itself: each health-check session asks what we do too much
  and too little of.

## v1.5.44 — 2026-11-25
- **Phone HUD fits all five ores.** Once you hold Tide ≈ or Calx ⬟, the bank on a phone now sits in two rows (◆ ▲ ● over
  ≈ ⬟) instead of running under the minimap or the ◎ ⟂ buttons; in landscape the message line moves down to match.
  Large text in landscape (700–930 px wide) no longer pushes a big bank under ◎.

## v1.5.43 — 2026-11-25
- **Two new ores in the outer rings.** The Shoal now holds pale mint **Tide ≈** (two wave strokes) and the Kiln lilac
  **Calx ⬟** (a pentagon). Mine them like any ore; each gets its own bank counter once you first hold one. The Scanner
  and the Echo find them too. Nothing spends them yet: that comes next (Overdrive). The smaller old worlds have none.

## v1.5.42 — 2026-11-25
- **Nothing changes on screen yet.** The next update's plan is written: the Shoal and the Kiln each get their own ore
  (Tide ≈ and Calx ⬟), spent on two Overdrive levels past every Core Matrix max, a Kiln Heat Sink you can craft, and a
  Nexus Chart that maps currents and flare vents.

## v1.5.41 — 2026-11-25
- **Nothing changes on screen.** Behind the scenes, every test now shares one small web server instead of eleven
  copies of it, so the checks that keep each release playable are simpler to maintain.

## v1.5.40 — 2026-11-25 (M10 done: world and biomes)
- **Flare vents in the Kiln.** Small warm-white hexagons dot the Kiln floor. Every 8 s each one brightens and pulses
  for a second, then flares: a core caught inside is shoved out and its beam gains heat (enough to overheat a hot
  beam). No damage, no lost cargo, the same in Drift and Surge. Read the pulse and step aside.

## v1.4.39 — 2026-11-25
- **A core that falls in the Kiln comes back cool.** Respawning at the Nexus no longer keeps the beam's heat, so it
  fires straight away.
- **Messages are easier to read:** pop-up messages such as "Entering the Kiln" now sit on a dark plate.

## v1.4.38 — 2026-11-25
- **Kiln rock heats your beam.** Mining in the Kiln builds heat: a warm white arc grows round the core, and after
  about 8 s of steady fire the beam overheats and stays off for a moment (a soft hiss) before it works again.
  Mining elsewhere, or letting go, cools it. Same in Drift and Surge.
- **The Kiln has its own music:** a dark phrygian pad, a step below the Shoal.

## v1.4.37 — 2026-11-25
- **Planning the Kiln.** No change in play: the Shoal was play-tested (its currents cost a round trip almost
  nothing, as intended) and the Kiln's beam heat and flare vents were planned as two steps.

## v1.4.36 — 2026-11-25
- **Shoal glass is brittle.** Breaking rock in the Shoal cracks one of its neighbours (a faint line flashes), so
  tunnels there open faster. Cracks never set off more cracks.
- **The Shoal has its own music:** a bright, floating lydian pad, a step below the Deep.

## v1.4.35 — 2026-11-25
- **The Shoal has currents.** About half the open water in the Shoal now flows: faint dashes show which way, and the
  current nudges the core (and loose ore) along at under a third of your top speed. You can always swim upstream.

## v1.4.34 — 2026-11-25
- **Smoother with many lights.** The soft floor glow under Beacons, Relays and lit Spires costs less to draw, so a
  screen full of light pools stays smooth. It looks the same.

## v1.4.33 — 2026-11-25
- **The world is bigger.** New Worlds and New Cycles are now 256 cells across: past the Deep lie two new rings, the
  Shoal and the Kiln, with tougher rock, four more vaults and more Anomalies. Worlds you already have keep their size.

## v1.4.32 — 2026-11-25
- **Planning for the bigger world.** No change in play: the bigger world, the Shoal's currents and the Kiln's heat
  were measured and their plans tuned (gentler currents, fewer beam vents) before they are built.

## v1.4.31 — 2026-11-25
- **A minimap that follows you.** In the bigger world coming next, the minimap shows the 160 cells around your core
  (the Nexus always stays on it); today's worlds still fit whole. The ending's overview now frames everywhere you
  explored, not just the Spires.

## v1.4.30 — 2026-11-25
- **Two new depths, waiting past the Deep.** The Shoal (glassy mint and ice) and the Kiln (ember and rose) now exist,
  with tougher rock, their own vaults and Anomalies. They arrive in play with the bigger world in the next update;
  today's worlds are unchanged.

