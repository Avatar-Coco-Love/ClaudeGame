# 04 — Roadmap, part 2: Debt

Known debt and watch items (moved out of `04-Roadmap.md` in audit 34 to stay under the 8 KB cap). Audits add here; fixes move to
`archive/2026-11-24-04-debt-done.md` word for word.

## Debt
- **Audit 64 leftovers:** a reload mid-ending never shows the card by itself (reachable from the Matrix; needs a saved
  "seen" flag → save bump); the overview lines' `shadowBlur 18` drives its p95 (draw twice instead, D-051); the ⊕↑ "↑"
  renders small (a `.lift` size); tests pin 255-scaled dark values (ending.cjs) and CELL as 32 (reclaim.cjs); B-055's
  check can't fire a trusted key repeat; "Best of N cycles" counts unfinished cycles.
- **Audit 59 leftovers:** touch: a full-HUD overlap check for the Wake toasts/hint (`touch.cjs` covers death + mode lines
  only); `tools/parity.mjs` prints "prism ratio NaN" on runs with no Prisms (guard the 0/0); unused-outside exports
  (`pulseInReach`, `makeBeacon`, `makeRelay`, `nexusPointerSpot`, `isBroken`, `primeSpire`, `SPIRE_MODES`, `clearLanes`,
  `startWake`); the Wake tune leans on lane order (south-first let a still core hold): recheck with `wakeprobe` on any change.
- Done items are archived word for word in `archive/2026-11-24-04-debt-done.md`.
- **Scanner button reach (watch, session 21):** ◎ sits under the minimap, top right; a thumb on a big phone must stretch for it.
  If a play-test says so, try a slot above the left stick's zone.
- **Dev teleport onto a cache (dev only, session 19):** a teleport room that covers a vault cache removes it with no loot.
- **Glitch inside a vault (watch, session 18):** spawning only checks for open cells, so a Glitch can appear in a sealed vault's
  hollow; it gains no ground and fades in 6 s (D-017). Harmless; exclude vault hollows from spawns if a play-test sees it.
- **Bedrock edge (watch):** the border reads near-black; session 32 saw the beam spark on it (no crack). Fine unless play-tests mind.
- **Cargo-full toast (watch, audit 34):** with a full hold, sitting on loot re-fires the toast every frame, so it stays up until
  you move off. Reads as a reminder; change only if a play-test minds. (Audit 39: no longer fires inside the Nexus, B-033.)
- **Audit 29 leftovers:** buy-logic dedupe (`game.js` `canAfford`/`buy` vs `canAffordNexus`/`buyNexus`), silent-audio stub ×9, (Node-only smoke checks → `tests/world.cjs` ✅ #54); re-run the perf audit.
- **Missed chime (watch):** the S-4 arpeggio plays only if the hold empties inside the ring. Keep unless a play-test minds.
- **Render cost:** ✅ pickups are culled to the view (B-014, #21) and drawn as glow sprites, as are Scanner glyphs (B-027, D-051, #39).
  Particles are still drawn uncull'd (short-lived, local). ✅ Nexus glow culled + clipped (S-15, D-057, #43). Left (flushed, no
  throttle, 1280×800): `drawLight` 4.0 of 9.5 ms, 3.6 of it the smoothed 2× upscale (no same-pixel fix found); 300 pickups +11 ms
  (rotated `lighter` sprites); the un-timed rest (chunks, minimap, HUD) ~4 ms. Next: measure on a real phone (`tools/perf.cjs`).
  ✅ Glitches culled + sprites (audit 39, D-058). Audit 39 at ×4: home 74 / 117 p95, base 58 / 83, loot 133 / 200 (pickups 35 %:
  per-item save/rotate/drawImage), holes 145 / 200 (light 70 %). Batch pickups without per-item save/restore if loot matters.
- **Glitches still can't path:** after S-6 they give up instead of sticking, so a Surge player deep in tunnels sees Glitches appear, push at rock and fade. If play-tests find that reads as broken, a cheap flow-field toward the core (one BFS per second over explored cells) is the next step; M6's Burrower is the other answer.
- **Late-game parity:** Drift's ore near the Nexus is finite, Glitch drops renewable. Re-run `tools/parity.mjs` with a depleted inner ring (or 30+ min) when M2 depth rings land.
- **Audit 39 leftovers (code health):** (`light.js` split ✅ #50) unused exports `SCAN_TYPES`, `scanWithin`, `researchNode`, `VAULT_TEMPLATES` (low; audit 44 again; `WIDE_OFFSET` now used by `tests/facet.cjs`, audit 54).
- **Audit 44 leftovers:** one buy helper for `canAfford`/`buy`, `canAffordNexus`/`buyNexus`, research and `craftBeacon`, and one
  `buyRow` for the 3 repeated panel click handlers in `main.js`; (`tests/smoke.cjs` split ✅ #54: 545 → 392 lines); `craft.js` `placeRefusal`/`tryPlace` both compute the core cell; (380 px blocks
  merged ✅ #53); `tools/perf.cjs` leaves beacon glow, beacon glyphs and chunk blits untimed (~31 %
  of the holes run) (light-hole gradient cache ✅ #50, D-067).
- ✅ (#53) **B-039:** 320 px bank vs minimap: `.bank` gap 8 px at ≤ 380 px (D-072); a 4-digit ● (not reachable, ~141 per world) would touch.
- **Audit 49 leftovers:** (smoke split, SAVE_FORMAT pin guard, Nexus pointer, toast queue + width, B-041, B-042, beacon RGB ✅ #54)
  T2 minimap Spire hexagon ~5 CSS px / 0.86 px line on the 96 px phone minimap (blobs into violet cells; make it bigger/brighter);
  T1b the pointer now slides inward, so its NEXUS label can cross a toast at top 30 % (568×320, seen; phone toasts moved in audit 54, B-047: re-check); T4 `tools/perf.cjs`
  leaves `drawLightGlow` / `drawSpireBreath` untimed; H2 hexagon path in `spire.js` ×2 + `terrain.js` `hexPath` → one export;
  H3 "inside the bedrock border" in `spire.js` ×2, `world.js`, `dev.js` → one `insideBorder`; H6 unused exports `SPIRE_HALF`,
  `makeBeacon`, `makeRelay`, `pulseInReach` (plus audit 39's list; `spireTypeAt` now used by tools, audit 54).
- **Audit 54 leftovers:** (C1–C3, T1, T2 ✅ #59: B-043…B-047) H1 `craft.js`: `loadRelays` ≈ `loadBeacons` → one `loadPlaced(list, max, make)`;
  `drawRelays` ≈ `drawBeacons` (cull + setup); `placeRefusal`/`tryPlace` core cell → one helper. H2 `spire.js` `updateSpireFeed` copies
  `game.js` `updateDeposit`'s tick loop → shared `tickTransfer`; `main.js` `craftRow` is a 4th near-copy of the panel click handler
  (folds into `buyRow`). H4 draw literals (`spire.js` facet hex 9, dwell ring 15, feed arc 24, burst 10/120; `craft.js` `drawRelays`
  10, 14, 0.22) → config or mark layout-only. T3 the Relay's dashed bank ring is faint at DSF 1 (alpha ~1.5× the dark around it).
