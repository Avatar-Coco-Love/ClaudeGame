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
- `src/thumbarc.js` `arcSlots(w, h, n, inset)`: centres on arcs round the bottom-right safe corner. Inner radius
  R = clamp(0.5 × min(w, h), 180, 230); slots every 52 px of arc from where x = w − 30 going up-left, while
  x ≥ w / 2 + 24 (the move thumb's half stays free); the rest start an outer arc at R + 56. Pure: node-testable.
- `hud.js` places the visible action buttons in this order, innermost first (most used nearest the thumb):
  ⟂ beam mode, ◎ Scanner, ✦ place, ◇ Echo order, ❖ call. Glyph-only, 44 × 44 (as landscape ≤ 700 px, D-058); a
  hidden button takes no slot. Re-laid on resize / rotate and when a button shows or hides (the HUD key already changes).
- The beam mode's name shows 1 s above ⟂ on a switch (it leaves the button). ♪ ≡ and the minimap stay top-right (rare taps).
- The aim stick: buttons sit on top of the canvas, so a touch on one never starts a stick (today's rule). A 56 px
  stick circle centred 110 px in from the corner must clear every slot (R ≥ 180 guarantees it).
- Smoke (`thumbarc.cjs`): node: `arcSlots` on the 4 viewports above + 375 × 667, n = 1…5: every centre ≤ 275 px from
  the corner, on screen ≥ 8 px from each edge, ≥ 52 px apart, right of w / 2 + 24, and clear of the stick circle.
  Browser (touch, Max all + Echo + a Beacon): the same for the real buttons, none overlapping the bank panel, minimap,
  hint, ⊕ or each other; desktop rects unchanged. One screenshot per orientation, viewed.
- Rejected: a bottom-edge row (the resting aim thumb lands on it), the left side (the move thumb is never free),
  a radial menu behind one button (two taps for the beam mode, the most used action), moving ♪ ≡ too (not play taps).

## S-76 — Map legend
**Save:** none.
- Under the big map (D-191): one row of the marks drawn on it this open, each as its own dot / glyph in its colour +
  a word (Nexus, Beacon, Relay, Ward, Vault, Spire, Anomaly, rift, lair, vent, current…). Only kinds present show.
- The minimap draw records the kinds it drew into a `Set` passed in (no second scan of the world); `mapview.js`
  builds the row on open (and on resize), wrapping to at most 2 lines at 320 px wide; hidden while the map is closed.
- Smoke (extend `mapview.cjs`): the legend lists exactly the drawn kinds (a Beacon placed adds "Beacon"; none placed →
  absent); ≤ 2 lines at 320 × 568; no page scroll; Large text keeps it on screen. One screenshot.
- Rejected: a fixed full legend (lists things the player has not met: spoils discovery), a legend on the small minimap (no room).
