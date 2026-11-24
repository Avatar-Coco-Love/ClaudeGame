# 06 — Decisions log, part 8

Continues `06-Decisions-7.md` (same rules: supersede, never edit; list rejected alternatives). D-061 on.

### D-061 — Beacon pools get a faint floor glow (2026-11-24, session 42, Design; settles Q-014)
- **Seen:** a beacon in the biggest open Hearth cave of seed 77 (426 cells, d 20) and a Deep one (1457 cells, d 61), core 9
  cells away, 1280×800: the open floor inside the pool measured 3.4 luma, the same as unlit floor; only the glyph and any
  walls in reach show the light. In rock and tunnels it reads (walls 33 luma). The open caves are where you most want light.
- **Prototyped in-page** (additive cyan disc under the walls): alpha 0.05 → floor 6.9–8.8 luma, faint; 0.10 → ~10, a clear
  soft haze that still reads as dark floor. S-25 builds it at `BEACON_GLOW` 0.08 as a cached sprite (D-051), beacons only;
  Relays and relit Spires reuse it in their own tint (S-22, S-28).
- Rejected: keep as is (the item's payoff is invisible where it matters); a bigger `BEACON_LIGHT` (a bigger hole over black
  floor is still black); brightening the grid everywhere (lifts the darkness the whole game is built on); a glow under the
  core too (the core is always on screen and its pool already reads by the walls you mine).

### D-062 — A New Cycle carries identity, not power (2026-11-24, session 42, Design; settles Q-013)
- **Carries:** the cycle number, records (best time to 5/5, per-cycle relights by mode), settings, and a cosmetic Nexus hue
  per cycle (5 fixed hues, wrapping). **Resets:** everything else, so every cycle is the full game on a new seed.
- Why: no layer unlocks anything twice (pillar rule), the Hearth stays the place the loop is learned, and nothing compounds
  over cycles that later balance would have to chase. A hue and a count say "you did this" without changing play.
- Rejected: a starting bank (40◆ + 10▲ skips the first upgrades, compounds if per-cycle, and reads as a Drift/Surge-neutral
  but pointless shortcut); the Scanner pre-researched (re-unlocks Research: breaks the layer rule); keeping Core Matrix
  levels (no challenge left in the Hearth or Veil); a harder world per cycle (a new system, post-1.0 at most, M6 scope).

### D-063 — Specs cut to one PR each; build order to v1.0 (2026-11-24, session 42, Design; supersedes D-056's order)
- **Order:** S-25 (beacon glow + B-034), S-26 (`light.js` split), S-19 (Spire sites, cells, save), S-27 (found: look,
  minimap, toast, tone), S-22 (Relays; M4 done → v0.3), S-20 (feed), S-28 (facets + relit), Surge bot, S-23 (Wake),
  S-24 (ending + summary), S-29 (New Cycle → 1.0.0). 11 build sessions; by the rotation, ~session 60.
- **Splits:** S-19 lost its look/found half to S-27; S-20 lost the puzzle to S-28; S-24 lost New Cycle to S-29. S-19 saves
  the whole M5 Spire record (`seen`, `fed`, `mask`, `lit`) so S-27, S-20 and S-28 need no format bump.
- **B-034** rides in S-25: both are small HUD/visual polish measured the same way, and B-034 grows as more buttons arrive.
- **Play-test notes (no change):** the Pulse ready shot holds full in an open Deep cave and its solid reach line reads; the
  Deep trip (deeprun, 10 seeds) is 30 s median to first Lumen at Beam 2, 20 s at Beam 4 + 3 elsewhere.
- Rejected: S-19 whole (world gen + save + art + audio + minimap is two PRs of checks); the `light.js` split inside S-19 (a
  refactor needs its own byte-same proof); Relays before Spires (D-056's reasons stand); one format bump per M5 slice.

### D-064 — B-034 fix covers phones up to 700 px wide and compacts the bank row (2026-11-24, session 43, Build; amends S-25)
- **Measured:** with ◆ ▲ ● at 8888 in Surge the bank panel ran 12–279 px (headless Pixel 7 fonts; session 42 saw 239). ◎ sat at
  168 / 240 / 267 px at 568 / 640 / 667 wide: overlap at all three, so S-25's `max-width: 600px` would leave 640 and 667 broken.
- **Built:** `(max-height: 480px) and (max-width: 700px) and (pointer: coarse)`: ◎ ⟂ 44 px glyph-only, minimap 100 px, ✦ under
  the row at `right: 108px`, and the bank row at 15 px / 10 px gap (as portrait ≤ 480 px already does). Panel 12–233; ◎ gap
  15 / 87 / 114 px. Above 700 px the full row fits (720 px: ◎ at 320 ≥ panel + 8).
- Rejected: glyph-only at 600 px only (640/667 still overlap); shrinking only the buttons (568 still 39 px short); dropping ●
  from the panel on small screens (hides a currency the player spends); a second HUD row (covers more of the play field).

### D-065 — The ⟂ button names the beam mode (2026-11-24, audit 44; supersedes D-041's rejected "mode label on ⟂")
- **As built since S-17 (#38):** `#mode-name` shows Focus / Wide / Pulse next to ⟂ (`main.js`), hidden ≤ 700 px wide in short
  landscape (D-064) where only the glyph fits. Portrait 320 px fits "⟂ Focus" at 44 px tall (audit 44 text-overflow check).
- **Why the reversal:** on touch the toast is gone in a second and the three beams only read while mining; a thumb-sized button
  needs a resting label. D-041's worry (width at 320 px) is now measured, not assumed (`tests/touch.cjs`, B-035 check).
- Rejected: glyph only everywhere (touch players can't tell Wide from Focus while idle); a colour per mode alone (fails
  colour-blind players and adds a palette rule for no gain over a word).

### D-066 — Tuning numbers in `game.js` are checked, not reminded (2026-11-24, audit 44)
- Audits 34, 39 and 44 each flagged inline tuning in `game.js`. Moved unchanged to `config.js` (`PLAYER_ACCEL`, `PLAYER_R`,
  `PARTICLE_CAP`, `CORE_REVEAL`, `SPAWN_OFFSET`, `ATTRACT_PULL`, `PICKUP_SETTLE_S`, `DEPOSIT_TICK_S`, `HURT_*`, `RESPAWN_*`).
  `tests/tuning.cjs` (in smoke) fails on any number in `game.js` code outside a short list of cosmetic ones (particles, shake).
- Rejected: an ESLint `no-magic-numbers` rule (new dev dependency + config, against the no-build rule); checking every `src`
  file (render/audio are cosmetic by nature, the list would be the whole file); a line-count ratchet (passes a swapped number).
- **Audit 44 D-check:** every D-001…D-064 was compared with the code; all match except D-041's ⟂ label (superseded above).
