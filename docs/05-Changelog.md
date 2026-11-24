# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.2.15 — 2026-11-24 (#81)
- **Keys that fit your keyboard:** controls now follow key positions, so on AZERTY the move keys are Z Q S D where W A S D
  sit. Settings → Keys lets you rebind move, mine, Core Matrix, Scanner, beam mode, place and mute: tap a row, press a
  key (Esc cancels; taking a key another action uses swaps them). Badges, hints and the title line show your keys.

## v1.2.14 — 2026-11-24 (#80)
- **Fixes from a health check:** the installed app now opens offline even if you only ever visited through a shared
  link; an Anomaly beside a Relay no longer hands you a buff that the deposit you are making ends a moment later;
  floor loot draws faster when lots of it is on screen; on landscape phones messages no longer clip the bank panel
  when three Anomaly buffs show; the game fills the screen properly in mobile Safari; the hint now says "fly into it".

## v1.2.13 — 2026-11-24 (#79)
- **Install it, play it offline:** Lumen Core can be added to your home screen or installed as an app, with its own
  glowing Nexus icon. After one visit online it also opens and plays with no connection; online, you always get the
  newest version.

## v1.2.12 — 2026-11-24 (#78)
- **Behind the scenes:** a design pass. Anomalies were play-tested in both modes and on phones (no changes needed),
  and the last milestone is planned: play offline as an installed app, keys that work on any keyboard layout and can be
  rebound, larger readable text, and smoother frames on slower phones.

## v1.2.11 — 2026-11-24 (#77)
- **Anomalies, found:** once you've lit an Anomaly's cell it stays on the minimap as a dot in its colour (hollow while
  it recharges), and a Scanner ping now shows the charged ones within reach. A soft falling tone marks a buff ending at
  a deposit, and the first time one glows in your light the hint line says what to do. M7 is complete: v1.2.

## v1.1.10 — 2026-11-24 (#76)
- **Two more Anomalies:** each buried hexagram is now one of three kinds. Orange **Overclock** (beam 1.5×), violet
  **Lodestone** (the Attractor reaches twice as far and pulls harder) and teal **Ballast** (cargo +50 %). Different
  kinds stack; each lasts until your next deposit, which banks everything Ballast let you carry. Same in Drift and Surge.

## v1.1.9 — 2026-11-24 (#75)
- **Behind the scenes:** a health check. A flaky test around finding your first Spire is fixed at its root (it
  watched the clock instead of game time, and a rare world put two Spires side by side). Nothing changes in play.

## v1.1.8 — 2026-11-24 (#74)
- **Anomalies:** 16 slowly turning orange hexagrams are buried in the rock, more of them the deeper you go. Mine one
  open and touch it: **Overclock** makes your beam 1.5× stronger (mining and fighting) until your next deposit at the
  Nexus or a Relay. A chip under the cargo bar shows it; the site comes back 5 minutes later. Same in Drift and Surge.

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

Older entries: v0.4.59–v0.4.64 in `archive/changelog-v0.4.59-v0.4.64.md`, v0.4.54–v0.4.58 in `archive/changelog-v0.4.54-v0.4.58.md`, v0.2.48–v0.2.53 in `archive/changelog-v0.2.48-v0.2.53.md`, v0.2.43–v0.2.47 in `archive/changelog-v0.2.43-v0.2.47.md`, v0.2.39–v0.2.42 in `archive/changelog-v0.2.39-v0.2.42.md`, v0.2.34–v0.2.38 in `archive/changelog-v0.2.34-v0.2.38.md`, v0.1.27–v0.1.33 in `archive/changelog-v0.1.27-v0.1.33.md`, v0.1.22–v0.1.26 in `archive/changelog-v0.1.22-v0.1.26.md`, v0.1.17–v0.1.21 in `archive/changelog-v0.1.17-v0.1.21.md`, v0.1.10–v0.1.16 in `archive/changelog-v0.1.10-v0.1.16.md`, v0.1.1–v0.1.9 in `archive/changelog-v0.1.1-v0.1.9.md`.
