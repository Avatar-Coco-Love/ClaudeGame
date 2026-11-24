# Changelog archive: v0.4.54–v0.4.58

Moved word for word from `docs/05-Changelog.md` (audit 64).

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
