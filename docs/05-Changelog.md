# 05 — Changelog

One entry per merged PR, newest first. Version = `0.<milestone>.<PR count>`. `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

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

## v0.1.21 — 2026-11-23 (#21)
- Smoother frames when lots of loot lies around the map: Shards and Prisms far off screen no longer cost drawing time.
- Dev tools only: teleporting to the world's edge no longer cuts into the bedrock border.

## v0.1.20 — 2026-11-23 (#20)
- Six sealed **vaults** now sit 50–72 cells out: white-edged diamond, hexagon and cross rooms with tough walls. Cut in and break
  the cache at the centre for a burst of 20◆ and 6▲, with a chord. Opened caches stay open.
- Worlds you have already explored keep every tunnel: a vault only appears where your save has never looked.

## v0.1.19 — 2026-11-23 (#19)
- No change in play. The Deep's tougher rock was timed and stays as it is: the trip out is the long part, not the digging.
- Planned next for Research: spend gold Lumen on a **Scanner** that pings nearby ore through the dark, in Drift and Surge alike.

## v0.1.18 — 2026-11-23 (#18)
- The world now gets deeper as you dig out: the **Hearth** (blue) around the Nexus, then the **Veil** (teal and violet), then the
  **Deep** (indigo and magenta). Rock is tougher in each ring (×1.4, then ×2); crystals and prisms break as fast as before.
- Crossing into a new ring names it on screen the first time each session, and the beam's hum drops lower the deeper you are.
- The minimap colours rock by ring, so you can see how far out you have reached.

## v0.1.17 — 2026-11-23 (#17)
- For testing: add `?dev` to the address (or press the backtick key) to open a small dev panel: free Shards and Prisms, jump
  0/30/60 cells out, god mode, switch Drift/Surge, max every upgrade. Normal play is unchanged; the panel is hidden unless asked for.

## v0.1.16 — 2026-11-23 (#16)
- Loot left on the ground (including the cargo you drop when your core destabilizes in Surge) is now kept when you close and reopen the game.
- Your cargo can no longer vanish when you fall on a floor already littered with pickups.
- Once your first upgrade is paid for, the hint says "Upgrade ready" instead of telling you to bring Shards home again.

## v0.1.15 — 2026-11-23 (#15)
- No change you can feel. Under the hood, a world's luck (how many Shards a crystal drops, where Glitches appear, what they leave
  behind) now follows the world's seed, so play-test bots can replay a run exactly and balance work can be measured, not guessed.

## v0.1.14 — 2026-11-23 (#14)
- No change in play. This update plans the next stretch: the world will get visibly deeper in three rings (Hearth, Veil, Deep),
  sealed geometric vaults with loot caches out in the Deep, and a rare gold ore, Lumen, that will pay for Research.
- Your current world stays safe: the tunnels you dug and the ground you've seen will keep their shape when these arrive.

## v0.1.13 — 2026-11-23 (#13)
- Emptying your hold at the Nexus now ends with a rising chime: one note per resource kind you brought home, plus a top note.
- Buying a Core Matrix upgrade sends a ring off the core and makes that upgrade's level bar flash.
- Breaking a crystal or prism vein lands with a tiny freeze-frame; the beam starts with a short rising sweep.
- Reduced motion turns off the freeze-frame and the ring (sounds stay). The "Press E" tip no longer shows under the open Core Matrix.

## v0.1.12 — 2026-11-23 (#12)
- New **Settings** button on the title screen: a volume slider, mute (M still works), screen shake on/off, and reduced motion.
- Reduced motion turns off screen shake and the glowing pulse animations. On first launch it follows your device's reduced-motion setting.
- Your mute choice from earlier versions carries over. Settings are kept apart from your world, so New World never resets them.

## v0.1.11 — 2026-11-23 (#11)
- Phones: leaving the game mid-drag (switching apps, locking the screen) now lets go of both thumb sticks, so the core doesn't drift off on its own when you come back.
- Checked that Surge doesn't out-earn Drift since Glitches started dropping Prisms: a Drift miner still banks slightly more Prisms per minute. Nothing changes in play.

## v0.1.10 — 2026-11-23 (#10)
- Surge: Glitches that can't reach you (stuck behind rock or lost in the dark) now give up after a few seconds and fade away, so new ones come hunting. Surge stays tense in tunnels.
- Surge: with Glitches arriving far more often, a destroyed Glitch now drops a Prism half the time (Shards unchanged).

Older entries (v0.1.1–v0.1.9) are in `archive/changelog-v0.1.1-v0.1.9.md`.
