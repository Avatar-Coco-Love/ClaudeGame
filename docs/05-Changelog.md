# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.13.122 — 2026-11-28
- **M18 done.** The Nexus wears your feats: each feat done lights a small white dot on a corner of the Nexus's outermost
  ring, turning with it (one corner per feat, always the same one). A feat earned just now makes its corner flash.

## v1.12.121 — 2026-11-28
- The **Charted** feat now asks for 20 % of a new (large) world, down from 35 %, which was out of reach for most runs;
  an older, smaller world asks for 40 %. Visiting only the Spires never earns it: open the vaults and find the lairs.

## v1.12.120 — 2026-11-28
- Health check. On a phone, the thumb-arc buttons now move out of the way when the top-left panel grows (Surge's
  Integrity bar, Anomaly chips) instead of keeping their old spot. No gameplay change.

## v1.12.119 — 2026-11-28
- Decoys now come from a one-time Nexus build, **Lure** (▲ 30): it gives you 2 Decoys and tops them up whenever you
  bank (at the Nexus or a Relay). The Craft tab no longer sells them. A hunter drawn to a Decoy can't touch you while
  it circles: drop one at your feet and you keep your cargo (Drift) or your Integrity (Surge) for the hold. Saves that
  held a Decoy get Lure built for free.

## v1.12.118 — 2026-11-28
- Design pass, no change in play yet: the Decoy's next fix is planned. Today a hunter drawn to a Decoy at your feet
  can still rob you on the way; next it will never touch you while a Decoy holds it, and Decoys will come free at
  every deposit from a one-time Nexus build, Lure.

## v1.12.117 — 2026-11-28
- New: finishing a **Feat** now says so: a toast ("Feat: Rift runner (2 / 6)") and one bright note, once per feat (a
  reload or a mode switch never repeats it). The ending card adds a "Feats n / N" row after Bosses.

## v1.12.116 — 2026-11-28
- New: **Feats** at the bottom of the Nexus tab: six world goals (four in a smaller world) that pay nothing, each with
  its progress, e.g. "Charted 21 % / 35 %", "Rift runner 2 / 5". Quiet lairs, Open vaults, Three lights (an Anomaly of
  every kind), Charted, Overdriven, Rift runner (a rift pocket mined clean before it closes). Same in Drift and Surge.

## v1.12.115 — 2026-11-27
- Fix: in the rare case a save loses its record of a boss lair, a Decoy you had placed inside that lair now comes back
  to you as its full price (▲4 ◆20), like every other placed thing, instead of being lost in the rebuilt lair.

## v1.12.114 — 2026-11-27
- No change in play: the game's own tests now measure the Decoy over many runs in both modes. It does pull hunters off
  you for 3–4 seconds each time, but at its price it costs far more than it saves, so a later update fixes that.

## v1.12.113 — 2026-11-27
- No change in play: a design pass. The Decoy was play-tested in both modes (about 4 extra seconds before a hunter
  reaches you, the same in Drift and Surge); the next update measures whether it is worth its price.

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

