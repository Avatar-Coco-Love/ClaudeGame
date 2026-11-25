# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.6.55 — 2026-11-25
- **Smoother Kiln.** Flaring vents, Anomaly sites, the Scanner ring and the Burrower's tell look exactly the same but
  cost far less to draw, so the Kiln no longer stutters on slower machines (measured: its frames ~15 % faster, the
  slowest ones about twice as fast).

## v1.6.54 — 2026-11-25
- **The Burrower bites your hold in Drift.** In the Kiln it now heads for the core in both modes, with the same lilac
  tell. Move away in time and it surfaces into air; stay put and in Surge it hits your hull, in Drift it takes 4 items
  from your cargo (the rarest first) with a soft crunch and a lilac flash on the cargo bar. It comes more often (every
  20–30 s), and ore it tunnels through is lost; beating it still pays.

## v1.6.53 — 2026-11-25
- **Design pass: the Burrower gets teeth in both modes (next update).** A play-test measured that it cost a strong miner
  nothing; the retune now planned makes it bite your hold in Drift the way it bites your hull in Surge. No change in
  play yet.

## v1.6.52 — 2026-11-25
- **You can hear a Burrower coming.** While one is within a few cells of the core, a low wobbling rumble joins the
  music (louder as it gets closer, gone as soon as it leaves). It follows the Music slider.

## v1.6.51 — 2026-11-25
- **New creature: the Burrower (Kiln, new worlds).** Something tunnels through the Kiln's rock, leaving open passages
  behind it. Watch for a rock cell glowing lilac and cracking: a moment later it bursts out. In Surge it lunges at the
  core (22 damage) unless you move away in time; in Drift it goes for ore near you and eats it unless you beam it off.
  Beam it while it is out (about 2 seconds) to win back what it ate plus a Glitch's worth of loot, same in both modes.

## v1.6.50 — 2026-11-25
- **Kiln flare vents now sound their warning.** A vent within about five cells of the core gives a soft low rising
  swell as it starts to glow, a second before it flares, so you can hear one coming off-screen or behind you. Once per
  flare per vent, same in Drift and Surge, and quieter than every other cue.

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
