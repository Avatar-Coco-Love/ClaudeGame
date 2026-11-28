# 07 — Build Specs, part 22: the Decoy (Q-042, D-208)

Settled in Design 167 with S-74's numbers (D-206): hunters cost 12.4 % of a Drift haul and 12.2 % of a Surge one,
pooled (≥ the 10 % Q-042 asked for, in both modes), up to 26 % in the Kiln (Surge), and the player's only answers are
the beam and a Ward. One slice per PR (D-063), each usable end to end (D-139); after S-76, before M18's S-66a, as
v1.12 patches (it closes M17's loop, D-181).
**Why:** a hunter follows the field to you; a Decoy is the one thing that makes it follow something else. It buys
seconds, never kills: in Drift those seconds keep your cargo, in Surge your Integrity (equal faces, D-002).

## S-77a — The Decoy: craft, place, lure (both modes)
**Save:** `decoys` (cell indices, like `wards`) and the carried stock in `craft` → the next format (upgrade step: none
placed, stock 0; `saveformat.cjs`, never pin the number).
- Crafting (`craft.js`): `decoy` joins `PLACE_KINDS`, glyph ◈ (unused today), cost `DECOY_COST` ▲ 4 ◆ 20 (a Ward is
  ▲ 8 ◆ 30), carry `DECOY_STOCK` 2, placed `DECOY_MAX` 3, on open floor outside the Nexus disc (Ward's refusal rules,
  `wardRefusal`'s gap not needed). Pick up on its cell like a Ward. Colour: new, passes `colours.cjs` beside Ward,
  Tracer and Pincer. Provisional numbers: S-77b tunes them.
- `src/decoy.js` (hunter.js is 248 lines; keep the lure out of it but for one call): a hunter not fleeing, within
  `DECOY_R` 6 cells of a placed Decoy **with a clear line** to it, steers straight at it instead of the core (its
  `TRACER_LINE` steer; no second field build, D-198). Within 0.6 cell it circles it for `DECOY_HOLD_S` 4 s; then the
  Decoy is spent (removed, a small flash, off with reduced motion) and the hunter goes back to the field.
  The Pincer's flank lures the same (its A* waits). A fleeing Drift thief ignores Decoys (it has what it came for).
  Glitches, Spitters, the Echo, bosses: not lured (Glitches are Surge-only: a Glitch lure would be a Surge tool).
- Minimap / big map: a ◈-coloured dot (S-76's legend gains "Decoy" if S-76 has shipped).
- Toast fix from the play-test (Design 167): the theft toast says "beam it to win most of it back" (D-206 keeps 15 %).
- Smoke (`decoy.cjs`): node stubs: a Tracer 5 cells from a Decoy with a clear line turns to it, and not through rock;
  it holds 4 s then the Decoy is gone and it resumes the field; a fleeing thief ignores one; Drift = Surge (same
  path and hold); a Glitch ignores it; save round-trip + old save loads none. Browser: place, a Tracer circling it,
  one screenshot, viewed.
- Rejected: a Decoy that lasts (a permanent hunter sink: hunters stop mattering), luring Glitches (Surge-only),
  a Decoy field (a BFS per Decoy: D-198's one field), damage on pop (a second Ward, D-196).

## S-77b — Decoy measure: worth its cost, equal in both modes
**Save:** none.
- `huntrun.mjs --decoy`: the bot drops a Decoy on its own cell (it does not walk to place one) when a hunter is first
  seen within 12 cells (stock refilled at each deposit, cost charged to its haul), 8 seeds, Deep / Shoal / Kiln, both
  modes, `--no-echo`. Report per ring and mode: Decoys used, seconds lured per Decoy, cost with / without.
- Design 172 play-test (D-213): a still core, a Tracer down a bent 22-cell tunnel, a Decoy 3 cells toward it at 12 cells:
  first touch 5.3 s → 9.2 s in both modes (+3.9 s, about the hold); the bend delays the lure 0.7 s. Expect the saving to
  track `DECOY_HOLD_S`, so tune it first.
- **Gate (PASS, in smoke beside `tracer.cjs`'s, D-166):** the hunter cost with Decoys falls by ≥ 25 % of today's in
  each mode, net of the Decoys' cost; the Drift / Surge saving ratio is in 0.8–1.25 (D-158's band); no ring's cost
  goes below 0 (hunters still matter). Tune `DECOY_HOLD_S`, `DECOY_R` and the cost in that order; log tries in `09`.
- Bounds (D-213): hold ≤ 6 s, `DECOY_R` ≤ 8, cost ≥ ▲2 ◆10. If no setting inside them passes, ship the measure as a
  report row (not a gate), log the gap in `09` and split the fix into S-77b2 (no new lure rules in this PR).

## S-77b2 — the Decoy's fix: it holds without touching, from a Nexus level (Q-045, D-218)
**Save:** `nexusLevels.lure` → the next format (28 today; upgrade step: 1 if the save holds a Decoy stock or a placed
Decoy, else 0, so no player loses one; `saveformat.cjs`, never pin the number).
- `hunter.js`: the touch test skips a hunter with `e.lure` set (steering at or circling a Decoy), Drift and Surge.
- `config.js` `NEXUS_UPGRADES` gains `{ id: 'lure', name: 'Lure', desc: 'A Decoy stock, refilled at every deposit',
  max: 1, cost ▲ 30 }` (all sizes). With Lure built, the end of every deposit (`deposited`, Nexus or Relay) sets
  `craft.decoy` to min(`DECOY_STOCK`, `DECOY_MAX` − placed). The Craft tab's Decoy row and `craftDecoy` go (one
  layer makes it); B / ✦ placing and pick-up stay. S-65's rings: Lure adds a hexagon in `DECOY_RGB`.
- `huntrun.mjs --decoy`: no per-use price (`spent` 0; print the one-time ▲ 30 once); drop Design 177's measure flags
  (`--cue` / `--price` / `--spend` / `--drop` / `--fixate`: the game does `--fixate` now). Expect saving ≈ 60 % each.
- **Gate (PASS, `tracer.cjs`, replaces the S-77b report row):** pooled per mode, saving ≥ 25 %; Drift / Surge saving in
  0.8–1.25; floor: pooled cost with Decoys > 0 in each mode (D-218 replaces the per-ring floor). If it fails, tune
  `DECOY_HOLD_S` (≤ 6) then `DECOY_STOCK`; log tries in `09`.
- Smoke (`decoy.cjs`): a Tracer circling a Decoy dropped on the core's cell takes nothing (Drift) and deals nothing
  (Surge) for the hold, then touches as before; buying Lure fills the stock; a deposit refills it, capped by placed;
  no Lure, no stock; the Craft tab has no Decoy row; old save with stock 2 loads Lure 1 + stock 2, with none Lure 0.
  One screenshot: Nexus tab with the Lure row (360 × 640), viewed.
