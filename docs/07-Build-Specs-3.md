# 07 — Build Specs, part 3

Continues `07-Build-Specs-2.md` (same rules; build order in `07-Build-Specs.md`'s header, D-063). Written in Design 37, split in 42.
Prism budget (D-055/D-056): world ~1470▲; Core Matrix 246 + Radiance 113 + Beacons ≤ 100 + Relays 36 + Spires 400 = 895,
leaving ~575▲ (39 %) spare, plus Surge's renewable drops. The Deep (d ≥ 64) alone holds ~648 prism cells ≈ 970▲, but
not near each Spire (D-070), so the feed takes cargo then bank; the ending needs only ▲, reachable in both modes.
Shard budget: world ~2750◆, full Core Matrix 2482◆ → 268◆ spare; Relays take 120◆ (45 % of it). Tight on purpose: a
player who maxes the Matrix first buys Relays from Surge drops (~9◆/min, Q-007) or leaves one Matrix level for later.

## S-22 — ✅ BUILT (#55, v0.4.54; as built: D-076). Relays v1 (Crafting, M4 closes) (D-056) — sink: 12▲ + 40◆ each, ≤ 3 (36▲ / 120◆ per world, above)
- Craft row `relay`, "Relay", **12▲ + 40◆**, `RELAY_STOCK` 1 unplaced, `RELAY_MAX` 3 placed. Glyph ⊕ (a ring with a cross; geometry).
- **Place:** S-16's B / ✦ places the item crafted most recently that is still in stock (`craft.last`); the button shows
  that item's glyph and count. Refused (S-16's toasts) unless the cell is open, d ≥ `RELAY_MIN_D` 24 cells, and
  ≥ `RELAY_GAP` 16 cells from another Relay, the Nexus centre, every vault centre and every Spire footprint.
- **Effect:** cargo inside `RELAY_R` 64 px banks to the Nexus exactly as the Nexus ring does (same tick rate, arpeggio, stats);
  streaks fly off toward the Nexus. No heal, no Glitch repel: the Nexus stays the only safe zone. `RELAY_LIGHT` 100 px hole
  + S-25 floor glow in cyan-white (`game.relays` joins `R.lightSets`, S-26); minimap: a cyan ring, always shown. Same in both modes.
- **Save:** next `SAVE_FORMAT` adds `relays: [cell…]`, `craft.relay`, `craft.last`; an older save loads with none.
- **Smoke:** craft spends exactly 12▲ + 40◆; each refusal (d 20, 10 cells from a Relay, in rock) and a good placement;
  a deposit at a Relay banks ◆ ▲ ● and plays the chime; Surge integrity does not refill there; reload keeps it; old save
  loads; Craft tab fits 320 px; screenshot at DSF 1 (view). Measure: a bot banking 10▲ from d 60 with a Relay at d 50 vs
  without (expect ≥ 30 % faster); log in `09`.

## S-20 — Spire relight v1b: the Prism feed (M5) (D-055, D-070) — sink: 80▲ per Spire, cargo then bank (400▲ per world, above)
- **Feed:** while the core is inside a dormant Spire's 7×7 interior (by position from the record's centre, D-069), ▲ moves
  into it at `SPIRE_FEED_RATE` 8/s (deposit-tick sound) up to `SPIRE_PRISMS` 80: cargo ▲ first, then banked ▲ (D-070);
  ◆ and ● stay put. An arc around the core shows fed / 80. At 80: toast "Spire primed", the facets brighten, `mask` is set
  from the start pattern (S-28's rule, so S-28 only reads it). A **broken** Spire (D-069: `keep` holds a core or facet
  cell) relights at 80 instead (S-28's relit effects; until S-28 ships, set `lit` and toast "Spire relit (n/N)").
  A beam on a facet only sparks (S-28 makes it toggle). A Relay inside 16 cells is refused (S-22).
- **Save:** `fed` and `mask` (S-19's record). **Smoke:** feed takes cargo ▲ before bank ▲, never ◆ ●, caps at 80; with
  0▲ anywhere nothing happens; Surge feeds too; fed survives reload; feeding stops when the core leaves; a planted broken
  Spire (keep over its core) relights at 80; screenshot of a half-fed and a primed Spire (view).

## S-28 — Spire relight v1b: the facet puzzle + relit (M5) (D-055, D-078, D-080, D-081) — no sink. Refreshed in Design 52.
- **Facets** (`FACET_RING` order, bit k of `mask`, rule `toggleMask`: all shipped in S-20): on a **primed** Spire (mask set,
  not lit) a facet **toggles** after `SPIRE_TAP_S` 0.35 s of the **aim (centre) ray's** contact, then latches until that ray
  leaves it; Wide's side rays only spark (D-080). A Pulse burst that hits a facet toggles it once and stops there. All 8
  lit (`mask` 255) → relit. Broken Spires never reach the puzzle (S-20 relit them). New code in `spire.js` (259 lines now).
- **Hint** (`hint()` in `main.js`, state-derived like the others): while the core is in a primed, unlit Spire's interior,
  "Beam a facet: it flips with its two neighbours. Light all 8." (both input kinds; ranks below "Cargo full").
- **Relit:** core bright and still, `SPIRE_LIGHT` 260 px hole + violet-white floor glow (lit Spires join `R.lightSets`),
  minimap hexagon filled, toast "Spire relit (n/N)", "Spires n/N lit" in the stats, one rising 3-note tone (`audio.cjs`
  ceilings). S-20's broken-relight path gets the same effects.
- **Save (D-081):** the record gains `mode` on relight (the game mode now; `'broken'` from S-20's path). Next
  `SAVE_FORMAT` + upgrade step: lit without `mode` → `'broken'`; `loadSpires` drops an unknown `mode` (B-037).
- **Interim (D-055):** until S-23 ships, facets work in Surge too (Glitches still come).
- **Smoke:** solving each start's tap set relights (node-side, 40 seeds × 5; the 2000-seed proof is `tools/facetprobe.mjs`);
  a 0.2 s brush doesn't toggle; a held beam toggles once; a Wide beam whose side ray rests on a facet doesn't toggle it; a
  Pulse burst toggles once; a dormant (unprimed) Spire's facets never toggle; mask, lit and `mode` survive reload; an old
  save's lit broken Spire loads `'broken'`; the hint fits at 320×568; screenshots of a primed and a relit Spire at DSF 1 (view).
