# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

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

## v0.1.26 — 2026-11-23 (#26)
- Depositing a full hold no longer beeps for five seconds: the ticks fade out after the first few, then the closing chime plays.
- Taking a hit and destroying a Glitch sound softer and rounder (no more buzz). Every sound was measured; the rest stay as they are.

## v0.1.25 — 2026-11-23 (#25)
- The mining beam is much quieter and softer: a short soft swell when it switches on, then a low, gentle hum that lifts slightly
  only while it is cutting rock or hitting a Glitch. No more buzzing drone or wobble. The volume setting still controls it.

## v0.1.24 — 2026-11-23 (#24)
- No change in play. Planned next: the Scanner ping will also reveal a nearby **vault cache**, and Research gains two new beams
  for Lumen: **Wide** (a 3-cell swath) and **Pulse** (charge, then a burst that punches through rock). Switch with Q.

## v0.1.23 — 2026-11-23 (#23)
- A third Matrix tab, **Research**, spends gold Lumen ●. First node: the **Scanner** (10●, one-time unlock).
- Once unlocked, press **F** (or tap the gold ◎ under the minimap): a gold ring sweeps out 12 cells and every Shard, Prism and
  Lumen cell it passes glows through the dark for 6 s, with blips on the minimap. 20 s cooldown; the button dims meanwhile.
- With reduced motion on, the ore shows at once without the ring. Old saves load with nothing researched.

## v0.1.22 — 2026-11-23 (#22)
- Gold **Lumen ●** now glints in the Deep, 55+ cells from the Nexus: round beads with a halo, tougher than Prisms, one Lumen each.
  Carry it home like Shards. A gold ● joins your bank once you have held one. Nothing spends it yet: Research comes next.
- Old saves keep everything; ground you already explored out there may now show a few gold cells.

Older entries: v0.1.17–v0.1.21 in `archive/changelog-v0.1.17-v0.1.21.md`, v0.1.10–v0.1.16 in `archive/changelog-v0.1.10-v0.1.16.md`, v0.1.1–v0.1.9 in `archive/changelog-v0.1.1-v0.1.9.md`.
