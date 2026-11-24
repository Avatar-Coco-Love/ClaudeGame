# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.1.7 — 2026-11-24 (#73)
- **Planning:** weather was play-tested and stays as it is. Next up: **Anomalies**, strange shapes buried in the
  rock that boost your beam, your Attractor or your cargo until you next deposit, then come back a few minutes later.

## v1.1.6 — 2026-11-24 (#72)
- **Weather:** every 5–7 minutes of play, the dark changes for 40 s. In Surge a violet **static storm** rolls in and
  Glitches come faster and in greater numbers (more fights, more loot); in Drift an **aurora** makes the ore in your
  light shimmer, and breaking it often drops one extra. Never during a Spire Wake or the ending. M6 is complete: v1.1.

## v1.0.5 — 2026-11-24 (#71)
- **Spitters (Surge, the Deep):** about one Glitch in four out there is now a violet diamond that keeps ~200 px away,
  points at you, glows orange for a moment and fires a slow bolt. Rock stops bolts, and your beam can pop them.

## v1.0.4 — 2026-11-24 (#70)
- **Behind the scenes:** new working rules for the sessions that build the game (smaller conversations, cheaper
  checks). Nothing changes in play.

## v1.0.3 — 2026-11-24 (#69)
- **Fixes from a health check:** the key you press to skip the ending no longer also presses a button you clicked
  earlier (it could toggle mute), and holding it can't dismiss the summary before you see it. The hint no longer
  shows under the summary card, and the card fits a landscape phone without scrolling. The Wake's charge dial has its
  faint full ring back. A damaged save can no longer freeze the game at the ending or show a strange best time, and a
  world you finished just before 1.0 keeps its time as your first record.

## v1.0.2 — 2026-11-24 (#68)
- **Move your Relays** (you asked for this): stand in a Relay's ring and press B, or tap the ⊕↑ button that appears
  there on phones, to pick it back up for free, then place it further out. You can carry one at a time, and the
  three-per-world limit still holds, so your remote deposits can now follow you into the Deep.

## v1.0.1 — 2026-11-24 (#67)
- **Planning from player feedback:** Relays will be movable. The next update lets you pick a placed Relay back up from
  its ring and set it down further out, so your remote deposits follow you into the Deep.

## v1.0.0 — 2026-11-24 (#66)
- **Lumen Core 1.0.** The whole arc is in: dig out from the Nexus, upgrade, go deep, relight all five Spires (by puzzle in
  Drift, by holding them in Surge) and lift the dark.
- **New Cycle:** after the ending, start a fresh world from the summary card or the title screen. Bank, upgrades, Spires,
  Beacons and Relays start over; your records carry on (your best time to light all five, and each cycle's result). Each
  cycle the Nexus glows a new colour. The title shows your cycle and best time.

## v0.4.64 — 2026-11-24 (#65)
- **The ending:** relight the last of the five Spires and the view pulls back over the whole world. Each Spire draws a
  line of light home to the Nexus in turn while the darkness lifts. Press any key or tap to skip. Then a summary card:
  your time to light them all, cells mined, Spires relit in Drift and in Surge, and Glitches cleared. **Continue** keeps
  playing the same world, which stays brighter from then on. The card can be reopened from the Core Matrix.
  **New Cycle** arrives in the next update (v1.0).

## v0.4.63 — 2026-11-24 (#64)
- **Fixes from a health check:** during a Wake the camera now frames the Spire, so Glitches coming down every lane are in
  view on phones (they could hide under the buttons or start off-screen). "Spire waking — hold 40 s" shows at once instead
  of after the "Spire primed" message, and the messages fit one line on phones. Reloading while still feeding a Spire no
  longer stops its Wake from starting; an old save with rock left in a Spire's doorways no longer gets a free relight;
  standing in a second Spire while another wakes now says so.

## v0.4.62 — 2026-11-24 (#63)
- **Wake fixes:** walking away from a waking Spire no longer makes its Glitches vanish. Leave it and they wear the core
  down. The Wake's Glitches are one step weaker than the Deep's usual ones, so circling the core and beaming them works
  even at mid upgrades. The facets that count the Wake's 40 seconds now light up orange like the charge ring, and the
  hint says what to do: "Circle the core: beam the Glitches before they reach it".

## v0.4.61 — 2026-11-24 (#62)
- **Design pass:** the Surge Wake was play-tested with simulated players of different reaction speeds. A bug was found
  (walking away from a waking Spire made its Glitches vanish) and is fixed in the next update, along with a fairer tune.
  The next big additions after v1.0 are planned: a ranged Glitch for Surge and a weather event for each mode.

## v0.4.60 — 2026-11-24 (#61)
- **The Wake (Surge):** step into a primed Spire in Surge and it wakes. Four lanes blast open from its gaps (any ore in
  them drops at your feet) and Glitches pour down them toward the Spire's core. Guard it for 40 seconds (one facet lights
  every five) and it relights. An orange ring round the core shows its charge: each Glitch that reaches the core takes
  a tenth. Lose all of it, or your core, and the Wake fails (your Prisms stay fed); step out and back in to try again.
  In Drift the facet puzzle is unchanged; in Surge the facets no longer flip.

## v0.4.59 — 2026-11-24 (#60)
- **Behind the scenes:** a test pilot now plays the game by itself in both Drift and Surge (digging the cheapest way,
  fighting Glitches, going home to heal) so the coming Spire defence can be tuned with real numbers. Nothing changes on screen.

Older entries: v0.4.54–v0.4.58 in `archive/changelog-v0.4.54-v0.4.58.md`, v0.2.48–v0.2.53 in `archive/changelog-v0.2.48-v0.2.53.md`, v0.2.43–v0.2.47 in `archive/changelog-v0.2.43-v0.2.47.md`, v0.2.39–v0.2.42 in `archive/changelog-v0.2.39-v0.2.42.md`, v0.2.34–v0.2.38 in `archive/changelog-v0.2.34-v0.2.38.md`, v0.1.27–v0.1.33 in `archive/changelog-v0.1.27-v0.1.33.md`, v0.1.22–v0.1.26 in `archive/changelog-v0.1.22-v0.1.26.md`, v0.1.17–v0.1.21 in `archive/changelog-v0.1.17-v0.1.21.md`, v0.1.10–v0.1.16 in `archive/changelog-v0.1.10-v0.1.16.md`, v0.1.1–v0.1.9 in `archive/changelog-v0.1.1-v0.1.9.md`.
