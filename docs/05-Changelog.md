# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

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

## v0.4.58 — 2026-11-24 (#59)
- **Fixes from a health check:** holding a charged Pulse on a Spire facet now flips it once, not back and forth every
  second and a half; a Glitch drifting across your beam no longer makes a facet you already flipped flip again; a
  relit Spire from a damaged save always shows all eight facets lit.
- **Phones:** messages now appear below the core (portrait) or under the resource panel (landscape) instead of over the
  ◎ ⟂ ✦ buttons and the minimap, and the answer to a tap (like "No Beacons — craft at the Nexus") shows at once
  instead of waiting behind a longer message, which then returns.

## v0.4.57 — 2026-11-24 (#58)
- **Relight a Spire:** once a Spire is primed, hold your beam on one of its eight facets for a moment and it flips,
  along with its two neighbours (a small ring fills round the facet you are aiming at). Light all eight and the Spire
  wakes: its core shines, a wide violet-white light opens round it, the map marks it filled, and a rising chime plays.
  A hint inside a primed Spire tells you the rule. Works with every beam (Wide flips only with its centre ray; a Pulse
  burst flips one facet), with a mouse or the aim stick, and in Surge too until Surge gets its own Spire challenge.
  The game remembers how each Spire was relit; older saves load as before.

## v0.4.56 — 2026-11-24 (#57)
- **Design pass, no gameplay change:** the whole route to a primed Spire was play-tested in Drift and Surge, with a Relay on the way.
  The next updates are planned from it: the facet puzzle (only the beam's centre ray flips a facet, with a hint telling you the rule),
  then a Surge test bot, the Surge Spire defence, the ending and New Cycle.

## v0.4.55 — 2026-11-24 (#56)
- **Feed a Spire:** stand inside a dormant Spire's walls and your Prisms flow into it, eight a second — the ones you
  carry first, then the ones in your bank. A violet ring round the core fills toward 80. At 80 the Spire is **primed**:
  some of its eight facets light up bright, the pattern you'll solve next. Shards and Lumen are never taken, leaving stops
  the flow, and the count is kept. Same in Drift and Surge. A Spire whose core an old save had already dug relights at once.

## v0.4.54 — 2026-11-24 (#55)
- **Relays** (Craft tab, 40◆ + 12▲, up to 3 in a world): carry one out, press B / tap ⊕ on open floor at least 24 cells
  from the Nexus, and from then on cargo you bring within its dashed ring banks right there, with the same ticks and chime
  as the Nexus. It never heals you and Glitches don't mind it: the Nexus is still the only safe place. A Relay is a cyan
  ⊕ with its own soft light and a ring on the minimap. B places whatever you crafted last that you still carry.
- Crafting and building is complete, so the version moves to 0.4 (Research was already complete).

Older entries: v0.2.48–v0.2.53 in `archive/changelog-v0.2.48-v0.2.53.md`, v0.2.43–v0.2.47 in `archive/changelog-v0.2.43-v0.2.47.md`, v0.2.39–v0.2.42 in `archive/changelog-v0.2.39-v0.2.42.md`, v0.2.34–v0.2.38 in `archive/changelog-v0.2.34-v0.2.38.md`, v0.1.27–v0.1.33 in `archive/changelog-v0.1.27-v0.1.33.md`, v0.1.22–v0.1.26 in `archive/changelog-v0.1.22-v0.1.26.md`, v0.1.17–v0.1.21 in `archive/changelog-v0.1.17-v0.1.21.md`, v0.1.10–v0.1.16 in `archive/changelog-v0.1.10-v0.1.16.md`, v0.1.1–v0.1.9 in `archive/changelog-v0.1.1-v0.1.9.md`.
