# 04 — Roadmap, part 2: Debt

Known debt and watch items (moved out of `04-Roadmap.md` in audit 34 to stay under the 8 KB cap). Audits add here; fixes move to
`archive/2026-11-24-04-debt-done.md` word for word.

## Debt
- Done items are archived word for word in `archive/2026-11-24-04-debt-done.md`.
- **Scanner button reach (watch, session 21):** ◎ sits under the minimap, top right; a thumb on a big phone must stretch for it.
  If a play-test says so, try a slot above the left stick's zone.
- **Dev teleport onto a cache (dev only, session 19):** a teleport room that covers a vault cache removes it with no loot.
- **Glitch inside a vault (watch, session 18):** spawning only checks for open cells, so a Glitch can appear in a sealed vault's
  hollow; it gains no ground and fades in 6 s (D-017). Harmless; exclude vault hollows from spawns if a play-test sees it.
- **Bedrock edge (watch):** the border reads near-black; session 32 saw the beam spark on it (no crack). Fine unless play-tests mind.
- **Cargo-full toast (watch, audit 34):** with a full hold, sitting on loot re-fires the toast every frame, so it stays up until
  you move off. Reads as a reminder; change only if a play-test minds.
- **Audit 29 leftovers:** buy-logic dedupe (`game.js` ≈121-163), silent-audio stub ×9, Node-only smoke checks → `tests/world.cjs`; re-run the perf audit.
- **Missed chime (watch):** the S-4 arpeggio plays only if the hold empties inside the ring. Keep unless a play-test minds.
- **Render cost:** ✅ pickups are culled to the view (B-014, #21) and drawn as glow sprites, as are Scanner glyphs (B-027, D-051, #39).
  Particles are still drawn uncull'd (short-lived, local). Next to price (S-15): `drawLight` is ≈ 67 % of JS draw time (two radial
  gradients + a full-screen `drawImage` each frame); headless ×4 throttle runs 121 ms/frame with no loot, so measure on a real phone too.
- **Glitches still can't path:** after S-6 they give up instead of sticking, so a Surge player deep in tunnels sees Glitches appear, push at rock and fade. If play-tests find that reads as broken, a cheap flow-field toward the core (one BFS per second over explored cells) is the next step; M6's Burrower is the other answer.
- **Late-game parity:** Drift's ore near the Nexus is finite, Glitch drops renewable. Re-run `tools/parity.mjs` with a depleted inner ring (or 30+ min) when M2 depth rings land.
