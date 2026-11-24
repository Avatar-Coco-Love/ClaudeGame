# 07 — Build Specs, part 3

Continues `07-Build-Specs-2.md` (same rules; build order in `07-Build-Specs.md`'s header, D-056). Written in Design 37.
Prism budget (D-055/D-056): world ~1470▲; Core Matrix 246 + Radiance 113 + Beacons ≤ 100 + Relays 36 + Spires 400 = 895,
leaving ~575▲ (39 %) spare, plus Surge's renewable drops. The Deep (d ≥ 64) alone holds ~648 prism cells ≈ 970▲.

## S-22 — Relays v1 (Crafting, M4 closes) (D-056)
- Craft row `relay`, "Relay", **12▲ + 40◆**, `RELAY_STOCK` 1 unplaced, `RELAY_MAX` 3 placed. Glyph ⊕ (a ring with a cross; geometry).
- **Place:** S-16's B / ✦ places the item crafted most recently that is still in stock (`craft.last`); the button shows
  that item's glyph and count. Refused (S-16's 1-word toasts) unless the cell is open, d ≥ `RELAY_MIN_D` 24 cells, and
  ≥ `RELAY_GAP` 16 cells from another Relay, the Nexus centre, every vault centre and every Spire footprint.
- **Effect:** cargo inside `RELAY_R` 64 px banks to the Nexus exactly as the Nexus ring does (same tick rate, arpeggio, stats);
  streaks fly off toward the Nexus. A Relay does **not** heal, repel Glitches, or open anything: the Nexus stays the only
  safe zone. `RELAY_LIGHT` 100 px light hole; minimap: a cyan ring, always shown. Same in Drift and Surge (D-002).
- **Save:** next `SAVE_FORMAT` adds `relays: [cell…]`, `craft.relay`, `craft.last`; an older save loads with none.
- **Smoke:** craft spends exactly 12▲ + 40◆; each refusal (d 20, 10 cells from a Relay, in rock) and a good placement;
  a deposit at a Relay banks ◆ ▲ ● and plays the chime; Surge integrity does not refill there; reload keeps it; old save
  loads; Craft tab fits 320 px; screenshot at DSF 1 (view). Measure: a bot banking 10▲ from d 60 with a Relay at d 50 vs
  without (expect ≥ 30 % faster); log in `09`.

## S-20 — Spire relight v1b: Prism feed + the facet puzzle (M5) (D-055)
- **Feed:** while the core is inside a dormant Spire's 7×7 interior, cargo Prisms move into it at `SPIRE_FEED_RATE` 8/s
  (deposit-tick sound) up to `SPIRE_PRISMS` 80; ◆ and ● stay in cargo. An arc around the Spire core shows fed / 80.
  At 80: toast "Spire primed", the facets brighten. Before that, a beam on a facet only sparks.
- **Facets** (the 8 `T.FACET` cells from S-19, in ring order around the shell): a facet **toggles** after `SPIRE_TAP_S` 0.35 s
  of any ray's contact, then latches until no ray touches it; a Pulse burst on a facet toggles it once (and stops there).
  A toggle flips that facet and its two ring neighbours (lit ↔ dim). All 8 lit → the Spire relights.
- **Start pattern:** all lit, then `SPIRE_TAPS[i]` distinct facets (by Spire index i: 3, 3, 4, 4, 5) toggled from
  `seededStream(seed, 'facets' + i)`. An 8-ring with self + 2 neighbours is invertible over GF(2) (brute-forced in
  Design 37: all 256 states reachable, each by one tap set), so the minimum is exactly that many taps.
- **Relit:** core hexagon bright and still, `SPIRE_LIGHT` 260 px light hole, minimap hexagon filled, toast "Spire relit (n/5)",
  "Spires n/5 lit" in the Matrix stats, one rising 3-note tone (measured, added to `audio.cjs` ceilings).
- **Interim (D-055):** until S-23 ships, the facet puzzle works in Surge too (Glitches still come). S-23 then gives Surge its own path.
- **Save:** next `SAVE_FORMAT`; each `spires[i]` gains `fed` (0) and `facets` (8-bit mask, null until primed).
- **Smoke:** feed takes only ▲, caps at 80, keeps the rest; feed + mask survive reload; on 40 seeds every start needs
  exactly `SPIRE_TAPS[i]` taps (brute force); beaming those facets relights (node-side); a 0.2 s brush doesn't toggle; a held
  beam toggles once; screenshots of a primed and a relit Spire at DSF 1 (view).

## Surge bot runner (Tooling, before S-23) — spec stands in `04` Tooling. Add a `spire` route: hold a primed Spire's interior.

## S-23 — Spire Wake: the Surge defence (M5) (D-055; numbers are starting values for the bot to tune)
- In Surge, a primed Spire starts a **Wake** when the core enters its interior: `SPIRE_WAKE_S` 40 s. The Spire clears a
  3-cell lane 6 cells out from each gap (only ROCK/DENSE/ore become EMPTY; ore drops nothing). Natural spawns pause.
- Glitches spawn at the lane ends in turn every `SPIRE_WAVE_S` 1.6 s, ≤ 6 alive, tier by depth (2 at d 64–74). They chase
  the Spire core (charge 100; contact −10, the Glitch bursts lootless) unless the player core is within 3 cells. Kills drop
  loot as usual. One facet lights every 5 s as the Wake's clock.
- Charge 0 or a core death fails the Wake (fed Prisms kept; retry after leaving and re-entering). 40 s held → relit (same reward as S-20).
- Tune with the bot at 3 upgrade strengths: fail rate ≤ 30 % at mid upgrades; median time near the Drift puzzle's (45–90 s).

## S-24 — Ending and New Cycle (M5, ships v1.0) — outline; Design 42 settles Q-013 first
- 5/5 relit (any mix of modes): an 8 s sequence (each Spire draws a line to the Nexus, the dark lifts), skippable; then a
  summary card (time, cells mined, Spires relit in Drift / Surge, Glitches) with **Continue** and **New Cycle** (new seed,
  `cycle` + 1, the Q-013 carry-over). Reduced motion: a fade instead of lines.
