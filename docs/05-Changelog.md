# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.12.112 — 2026-11-27
- New craft: the **Decoy** ◈ (▲4 ◆20, carry 2, up to 3 out). Drop one in a tunnel: a hunter that sees it within 6 cells
  leaves your trail, circles it for 4 seconds, then the Decoy pops and the hunt resumes. Same in Drift and Surge; Glitches
  ignore it, and a thief already running with your cargo doesn't stop. Shown on the map and in its legend.
- The Tracer theft hint now says "beam it to win most of it back" (a killed thief keeps its best share).

## v1.12.111 — 2026-11-27
- The big map (tap the minimap or press N) now has a legend: each kind of mark on it this time, its own symbol in its
  colour plus one word (Nexus, Beacon, Anomaly, Spire …). Only marks you have met show. Beside the map in landscape,
  under it in portrait.

## v1.12.110 — 2026-11-27
- Phones with a notch or a home bar: the action-button arc now bends round the screen's safe corner, so in landscape no
  button hides under the notch or the home bar. Checked on tablets in landscape too (1024 × 768).

## v1.12.109 — 2026-11-27
- Phones and tablets: the action buttons (beam mode, Scanner, place, Echo order, rift call) now sit in an arc right
  under your aiming thumb in the bottom-right corner, instead of at the top of the screen. They never cover the Core
  Matrix button, the hint or the map. A beam-mode switch shows the mode's name above its button for a second.
  Desktop is unchanged.

## v1.12.108 — 2026-11-27
- Planning update, no change in the game. The next touch layout (action buttons in an arc under your right thumb)
  was measured on five phone sizes and corrected so no button lands on the Core Matrix button or the hint. Next up
  after it and the map legend: a Decoy you can place to pull hunters off you for a few seconds, in both modes.

## v1.12.107 — 2026-11-27
- Hunters finished (M17). In Drift, a thief you beam down no longer gives back everything it snatched: it spills most
  of it, but keeps its most valuable few pieces, so a theft always stings a little even when you win it back.

## v1.11.106 — 2026-11-27
- Hunters retuned. Far out in the Shoal and the Kiln, a Tracer or Pincer still has the hull and speed of its ring but
  hits no harder than a Deep one, and in Surge a hunter you kill drops 2 ◆ again. In Drift a thief now takes about
  30 ◆ worth per touch (was 24), so chasing it down with the beam matters more.

## v1.11.105 — 2026-11-27
- A Tracer that snatches your cargo in Drift now really runs off with it, even from a dead-end beside you: it no
  longer sits in a nook a cell away until it fades. Chase it down with the beam to get the cargo back.

## v1.11.104 — 2026-11-27
- No change to play. Behind the scenes: the hunters' balance check now counts the time a hurt core still owes the
  Nexus and judges the Deep, Shoal and Kiln together, ready for the final hunter tuning.

## v1.11.103 — 2026-11-27
- No change to play. Design notes: the plan to finish tuning the hunters, judged over the Deep, Shoal and Kiln
  together, so they cost Drift and Surge players the same; two hunter oddities found in play-testing are queued.

## v1.11.102 — 2026-11-27
- **Drift hunters bite harder:** a Tracer or Pincer that touches you now snatches up to 24 ◆-worth of your hold (the
  richest ore first, not one item) and runs off faster. Beam it before it gets away to get it all back.
- **Surge hunters pay less:** a hunter you destroy in Surge drops no Shards or Prism (a Glitch still does), so hunting
  them is no longer a way to farm.
- Behind the scenes: the hunters' cost measure now runs without Surge's Glitches (their deaths drowned it out) and
  reports how often an Auto Echo turns to Defend with hunters about.

## v1.11.101 — 2026-11-27
- **Fix:** in Surge, being destroyed by a Tracer or Pincer while another hunter was near could freeze the game. It no
  longer does: you respawn at the Nexus as usual.
- Behind the scenes, a new measure of the hunters: they find you through your tunnels on 9 of 10 approaches where a
  Glitch would give up. Their cost to you is next to be balanced so Drift and Surge feel it equally.

## v1.11.100 — 2026-11-27
- No change in play: a health check. Measured that a Pincer pair hunting on top of two Tracers and your Echo costs no
  frame time, and tidied the project notes.

## v1.11.99 — 2026-11-27
- **Pincers** now carry a white centre (a dot in the lead, a ring in the flank), so the pair stands out against the
  Deep's magenta rock. Your **Echo** now follows the same map of your tunnels the hunters use: it keeps up around
  corners a beat sooner after you turn.

## v1.11.98 — 2026-11-27
- No change in play: on phones the action buttons are planned to move down to an arc by your right thumb (measured:
  today they sit out of its reach), the big map will get a legend, and Pincers will get a white centre so they stand
  out against the Deep's magenta rock.

## v1.11.97 — 2026-11-27
- **Pincer pairs** now hunt from the Deep outward: two rose dots joined by a dotted line. One follows your tunnels; the
  other (hollow) works out where you are heading and comes in from another side. Surge: each hits for less than a
  Tracer; Drift: each snatches one item. Kill one and the other runs and fades.

## v1.11.96 — 2026-11-27
- **Tracers** now hunt you from the Veil outward: a violet chevron with a dotted trail that follows the tunnels to you
  instead of giving up at the first wall (one at a time, two from the Deep out). In Surge it hits like a Glitch and
  drops a Glitch's loot; in Drift it snatches one item and runs — beam it to get the item back.

## v1.11.95 — 2026-11-27
- If you had bound N to another action before the map arrived, your binding now stays and the Map takes a free key
  (it used to reset both). The big map re-fits when the window is resized or the phone turned while it is open.

## v1.11.94 — 2026-11-27
- **Tap the minimap (or press N) to open a big map** in the middle of the screen, 3–4× larger, so its marks no longer
  crowd each other. The world holds still while you read it; tap anywhere to close. A tap on the minimap no longer
  swings the beam toward it.

## v1.11.93 — 2026-11-26
- No change in play: the first hunter that follows you through your own tunnels (the Tracer) is now fully planned,
  after a play-test showed the Deep's Glitches give up in the rock long before they reach you.

## v1.11.92 — 2026-11-26
- **M16 Echo minds is complete.** No change in play: the Echo's Auto order is now held to its promise by the game's own
  checks on every update — it gathers nearly as much as Mine and keeps you as safe as Defend, in Drift and Surge alike.
