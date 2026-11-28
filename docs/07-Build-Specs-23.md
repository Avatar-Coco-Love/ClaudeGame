# 07 — Build Specs, part 23: M19 the Feint, a hunter that reads your beam (D-224, D-225)

Picked in Design 182 by play-test (D-196's rule). `huntrun` 3 seeds × 5 min, Deep: the bot's beam killed 21 of 33
hunters in Drift and 27 of 35 in Surge. Every hunter walks down the field into the beam, so the beam is the whole answer
and its aim barely matters. The Feint is the tier above the Pincer (beeliner < follower < coordinator < **reader**).
It sidesteps a beam pointed at it, so aim, tunnels and beam modes start to matter. It reads the core, not the mode:
Drift and Surge get the same Feint, with each mode's touch (D-002, D-201).
One slice per PR (D-063), each usable end to end (D-139). M19 → v1.14 on the last slice.

## S-78a — The Feint: spawn, read, sidestep (both modes) — built (Build 183, D-226)
- **Where:** from the Deep out (ring ≥ 2), the second of `TRACER_CAP_DEEP`'s two slots is a Feint, not a Tracer (D-225):
  the same count of hunters, a harder one. Spawn, field walk, give-up, Nexus repel, touch (Surge `TRACER_DMG` + capped
  tier step, Drift `TRACER_TAKE` worth + flee), Decoy lure and death are the Tracer's (`hunter.js` runs it as
  `hunter: 'feint'`). Unsaved like every hunter. New stream `game.rng.feint` for its left / right draw (salt per draw).
- **The read (`src/feint.js`, hunter.js is 253 lines: one call from it):** each frame, not fleeing, not lured, not mid-dash,
  cooldown done: if any ray in `beam.rays` (or a charging Pulse's aim line) passes within `FEINT_READ` 0.6 cell of its
  centre and it is ≤ the ray's length + 1 cell from the ray's origin, it reads the beam.
- **The tell, then the dash:** it shows a white chevron on the side it will go for `FEINT_TELL_S` 0.15 s (intent), then
  dashes perpendicular to that ray at `FEINT_DASH` × its speed for `FEINT_DASH_S` 0.35 s (realized: body collision as
  ever). Side: the perpendicular neighbour cell that is open; both open, `rng.feint` picks; neither open (a 1-wide
  tunnel) → no dash, it keeps coming: **a tunnel is where you beat it.** Cooldown `FEINT_CD_S` 1.6 s from the dash's end.
  Provisional numbers: `FEINT_DASH` 2.2, the rest above; S-78b tunes them.
- **Look:** a new hue that passes `colours.cjs` beside Tracer, Pincer and Decoy, a diamond outline (not the Tracer's
  arrow); the tell chevron is white, off with reduced motion (the dash still happens). Hp and speed: a Tracer's.
- Smoke (`feint.cjs`, node stubs): a Feint in a 3-wide hall with a Focus ray on it dashes sideways after the tell, not
  before; in a 1-wide tunnel it never dashes and the beam kills it; cooldown holds (a second ray inside 1.6 s: no dash);
  left / right draws differ across seeds and repeat per seed; Drift = Surge (same path, same dash); the Deep's second
  slot spawns a Feint, the Veil never does; a lured Feint does not dash. Browser: one screenshot of the tell, viewed.
- Rejected: a Feint that dodges the Echo's bolts and Wards too (no counter left; Q-047), teleport dodges (no realized
  path: breaks intent vs realized), a third slot (more hunters, not a smarter one).

## S-78b — `huntrun --feint`: the measure, shipped as a report
- Rows per ring and mode: Feints spawned, dashes, kills by beam mode, Tracer kill rate beside it; time cost with today's
  slot vs with the Feint. The bot aims as now (no new skill), so the report shows the worst case for a player who
  ignores it. Also one Wide row and one Arc row (Wide's side rays and Arc's jumps should still catch it).
- Bounds to check: Feint kill rate below the Tracer's and > 0 in every ring and mode (it can be beaten); the M17 gate
  (D-206: pooled band, floor, Drift ceiling) still passes with the Feint in. Out of bounds: tune `FEINT_CD_S` / `FEINT_DASH`
  in this slice, or report like S-77b did. Q-046 (8 vs 16 seeds) is read here, not settled.

## S-78c — Reading it: first-sight toast, map, Echo
- First Feint seen (once per world, saved flag → next format, upgrade step: unseen): toast "A Feint reads your beam:
  pin it in a tunnel". Map legend (S-76) and minimap dot gain it. The Echo's Defend targets it like a Tracer (it does
  not read the Echo: two-front play, S-69's orders get a job). Smoke: toast once (no re-toast on reload / mode switch),
  legend row, the Echo's bolt hits a Feint that dashed from the core's beam.

## S-78d — Gate in smoke (M19 done → v1.14)
- `huntrun --feint`'s bounds from S-78b join `gates.cjs` (prestarted, TIME line). Cut anything S-78b showed is noise.

## Cut (D-224)
A Nexus-mouth camper and a pack that retreats when hurt (both Surge-only with today's hunters: they bite, they don't
steal; parked in `04-…-5`), a Feint that predicts your movement (the Pincer's flank already does), a second reader kind.
