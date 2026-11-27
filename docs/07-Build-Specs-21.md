# 07 — Build Specs, part 21: owner asks between M17 and M18 (D-195, D-196)

Owner feedback of session 153 (`04-…-5`), triaged in Design 157. One slice per PR (D-063), each usable end to end
(D-139). No milestone of their own: they ship as v1.12 patches after S-74, before M18's S-66 (D-195).
**Why:** on a phone every action button sits in the top quarter of the screen, out of the aiming thumb's reach.

## Measured (Design 157, `?dev`, Max all + Echo, touch emulation)
Button centres, distance from the bottom-right corner (the aiming thumb's grip). Reach at ~6.1 css px / mm:
natural ≤ 275 px (45 mm), stretch ≤ 430 px (70 mm).

| Viewport | ◎ ◇ ❖ ⟂ (actions) | ♪ ≡ | Reach |
|---|---|---|---|
| 390 × 844 | 610–680 px, y 186–236 | 708–713 | all past stretch (needs a regrip) |
| 320 × 568 | 335–418 | 433–440 | stretch |
| 844 × 390 | 387–545 (top row) | 387–411 | stretch to past it |
| 568 × 320 | 326–413 | 319–345 | stretch |

The bottom-right is empty (the hint and ⊕ Core Matrix sit bottom-centre; the toast is mid-screen or top-left).

## S-75 — The thumb arc (touch only)
**Save:** none. `body.touch` only: desktop and a mouse keep today's layout (and keyboard badges).
- `src/thumbarc.js` `arcSlots(w, h, n, keep)`: centres on arcs round the bottom-right corner. Inner radius
  R = clamp(0.5 × min(w, h), 180, **215**) (so R + 56 ≤ 275 on a tablet too). On each arc, start at the top where
  x = w − 30 and step **down and left** by a 54 px chord (angle 2·asin(27 / R): a 52 px arc step leaves a 51.96 px
  chord, too close); keep a slot while x ≥ w / 2 + 24 and y ≤ h − 30; skip (do not stop at) a slot whose 44 px box
  comes within 8 px of a `keep` rect. Then the arc R + 56; a slot still missing takes R + 112 (stretch reach).
  Pure: node-testable; `keep` = rects passed in.
- `keep` (from `hud.js`, read at layout time, not per frame): the ⊕ Core Matrix button, the minimap, ♪ ≡, and a
  reserved hint box (w / 2 ± 150 wide, h − 76 … h − 22: two lines, so a hint that appears later never collides).
  Measured (Design 167, `?dev` off): the old rule put slot 4 on ⊕ at 390 × 844, 375 × 667 and 320 × 568, and slot 5
  on the hint at 568 × 320; with `keep` all five fit: farthest 251 / 244 / 237 / 195 px; 568 × 320 needs R + 112
  for slot 5 (292 px, the ❖ call, the rarest tap).
- `hud.js` places the visible action buttons in this order, innermost first (most used nearest the thumb):
  ⟂ beam mode, ◎ Scanner, ✦ place, ◇ Echo order, ❖ call. Glyph-only, 44 × 44 (as landscape ≤ 700 px, D-058); a
  hidden button takes no slot. Re-laid on resize / rotate and when a button shows or hides (the HUD key already changes).
- The beam mode's name shows 1 s above ⟂ on a switch (it leaves the button). ♪ ≡ and the minimap stay top-right (rare taps).
- The aim stick floats (its origin is where the thumb lands, `input.js`), and a touch on a button never starts a stick
  (today's rule). The resting grip is a quarter disc of radius 140 round the corner: every slot box must clear it
  (R ≥ 180 leaves ≥ 149; D-207 drops the spec's fixed "stick circle at 110 px", which the arc itself crossed).
- Smoke (`thumbarc.cjs`): node: `arcSlots` on the 4 viewports above + 375 × 667 + 768 × 1024, n = 1…5, with the
  measured `keep` rects: every centre ≤ 275 px from the corner (≤ 300 on R + 112), on screen ≥ 8 px from each edge,
  ≥ 52 px apart, right of w / 2 + 24, ≥ 8 px clear of each `keep` rect, and clear of the grip disc.
  Browser (touch, Max all + Echo + a Beacon): the same for the real buttons, none overlapping the bank panel, minimap,
  hint, ⊕ or each other; desktop rects unchanged. One screenshot per orientation, viewed.
- Rejected: a bottom-edge row (the resting aim thumb lands on it), the left side (the move thumb is never free),
  a radial menu behind one button (two taps for the beam mode, the most used action), moving ♪ ≡ too (not play taps).

## S-76 — Map legend
**Save:** none.
- Beside the big map (D-191): the marks drawn on it this open, each as its own dot / glyph in its colour + one
  word. The kinds are what `drawMinimap` draws (`hud.js`), at most 12: Nexus, ping (ore / cache blips), current,
  vent, Beacon, Relay, Heat Sink, Ward, Anomaly (one entry, its seen kinds' dots side by side), rift, lair, Spire.
  Only kinds present show, in that order.
- The minimap draw records the kinds it drew into a `Set` passed in (no second scan of the world); `mapview.js`
  builds the legend on open (and on resize); hidden while the map is closed.
- Where (measured, Design 167): `side()` leaves 40 px under the map in landscape (568 × 320: a 280 px map), so
  **landscape** puts the legend in a column right of the map ((w − side) / 2 − 16 wide: 128 px at 568, one entry
  per line, then a second column left of the map if it overflows); **portrait** puts it under the map (320 × 568:
  274 px free), wrapping, at most 4 lines.
- Smoke (extend `mapview.cjs`): the legend lists exactly the drawn kinds (a Beacon placed adds "Beacon"; none placed →
  absent); all 12 kinds at 320 × 568 and 568 × 320, Large text on and off: on screen, clear of the map, no page
  scroll. One screenshot per orientation.
- Rejected: a fixed full legend (lists things the player has not met: spoils discovery), a legend on the small minimap (no room).
