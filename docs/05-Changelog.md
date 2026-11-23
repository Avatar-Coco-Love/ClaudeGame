# 05 — Changelog

One entry per merged PR, newest first. Version = `0.<milestone>.<PR count>`. `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v0.1.10 — 2026-11-23 (#10)
- Surge: Glitches that can't reach you (stuck behind rock or lost in the dark) now give up after a few seconds and fade away, so new ones come hunting. Surge stays tense in tunnels.
- Surge: with Glitches arriving far more often, a destroyed Glitch now drops a Prism half the time (Shards unchanged).

## v0.1.9 — 2026-11-23 (#9)
- Fixed: in Surge, being destabilized while several Glitches were close to the Nexus could freeze the game.
- A design pass: next up, Glitches that are stuck behind rock give up so new ones can find you, then a settings panel.

## v0.1.8 — 2026-11-23 (#8)
- Phones now show the thumb controls hint from the start, and the Core Matrix button no longer shows a keyboard `E` badge on touch screens.
- The "LUMEN CORE" title fits on the narrowest phones (320 px) instead of being cut off.

## v0.1.7 — 2026-11-23 (#7)
- New: the Core Matrix has two tabs, **Core** and **Nexus**. The Nexus tab sells **Radiance** (5 levels, paid in Prisms ▲ only):
  each level widens the Nexus light by 96 px and reveals more of the map around it, with a white ring sweeping out from the Nexus.
- The panel remembers which tab you last opened.

## v0.1.6 — 2026-11-23 (#6)
- Pressing E (or Enter) on the title screen no longer opens the Core Matrix behind the title.
- Starting a new world now asks first if a save exists that this version can't read, instead of silently erasing it.

## v0.1.5 — 2026-11-23 (#5)
- No change on screen. A design pass: play-tested on desktop and phone, measured the economy, and planned the next five builds
  (Nexus Radiance, phone-first hints, settings, game feel, reproducible randomness).

## v0.1.4 — 2026-11-23 (#4)
- The version number now shows on the title screen.
- Old saves are upgraded on load instead of being dropped (no shape change yet; groundwork).
- Behind the scenes: changelog, numbered decisions log, doc size cap, lessons from a sister project folded in.

## v0.1.3 — 2026-11-23 (#3)
- Fixed: a first-time visitor no longer sees a phantom "Continue" from the title screen's background world.

## v0.1.2 — 2026-11-23 (#2)
- The game is live on GitHub Pages.

## v0.1.1 — 2026-11-23 (#1)
- First playable: mine neon caves, haul Shards and Prisms to the Nexus, buy Core Matrix upgrades, and play in Drift or Surge, on desktop or touch.
