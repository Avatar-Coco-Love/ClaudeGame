# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.6.58 — 2026-11-25
- **Design pass: events and puzzles are planned (next updates).** After the Ward node closes the creature update, rifts
  will open now and then: a short-lived pocket of rich ore near you that closes again after 45 s. Two kinds of outer
  vault get locks: the Kiln's only cracks in time with its heat pulse, the Shoal's only when you cut against the
  current. Same rules in Drift and Surge. No change in play yet.

## v1.6.57 — 2026-11-25
- **Arc Beam (Research, 35 ●).** A fourth beam mode after Pulse (Q / ⟂, a ↯ zigzag on the button). Its ray is a bit
  weaker (0.8×), but what it hits jumps to up to 2 more of the same kind within 2 cells: crystals of the same colour
  nearby, or the creatures next to the one you hit. Clears ore clusters ~1.35–1.45× faster than Focus; on plain rock
  Focus is still the digger.

## v1.6.56 — 2026-11-25
- **Mote swarms in the Shoal.** Six tiny mint diamonds now come out of the open floor every 40–60 s while you are in the
  Shoal, riding the currents. In Surge they dart at the core (4 damage a touch); in both modes a mote that touches you
  snatches one item from your hold (the most valuable). In Drift they also make off with loose ore the Attractor isn't
  pulling. Beam them: each pays a Shard, a whole swarm pays like a Glitch, and a carried item drops back.

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
