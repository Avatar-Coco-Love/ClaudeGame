# 09 — Implementation Log, part 6

Continues `09-Implementation-Log-5.md` (split at the 8 KB cap, session 51). Newest at the bottom; read the tail only.

## Session 51 — Build: S-20 Spire feed (v0.4.55, #56)
- **What:** inside a dormant Spire's 7×7 interior (|dx|, |dy| ≤ 3 cells from the record's centre) ▲ moves in at 8/s,
  cargo first, then bank, up to 80 (`updateSpireFeed`, `spire.js`); each ▲ plays the deposit tick and streaks into the
  core. A violet arc (r 24) shows fed / 80 with a faint track. At 80: `mask` = S-28's start pattern (`startMask`,
  `FACET_RING`, `toggleMask`), toast "Spire primed", chime, persist; lit facets drawn as glowing filled hexagons, unlit
  as outlines. A broken Spire (D-069, `isBroken`) relights instead: `lit`, mask 255, "Spire relit (n/N)". `SAVE_FORMAT`
  stays 11 (`fed` + `mask` were in S-19's record); `loadSpires` clamps `fed` ≤ 80 and `mask` to 0–255 (D-078).
- **Checks** (`tests/spirefeed.cjs`, 10): cargo before bank, never ◆ ●, cap 80 at ~8/s in Drift and Surge; 0▲ does
  nothing; leaving stops it; fed + mask survive reload; primed mask = start pattern ≠ all lit; planted broken Spire
  relights in Surge; fed 95 with no mask loads at 80 and primes free; 40 seeds × 5 start patterns need exactly
  `SPIRE_TAPS[i]` taps (brute force); browser 1280×800 Drift + 320×568 Surge (DSF 1): arc pixels, toast fits, each lit
  facet gains > 1.6× (measured 2.4–2.7×) and more than any unlit one (1.2–1.3×). Without the `game.js` hook 6 of the
  8 node checks fail (the two that pass test "nothing happens" and the pattern helper).
- **Observed (screens viewed):** half-fed: a violet arc round the core under the "A dormant Spire" toast; primed: 3 of 8
  facets bright white-violet, the rest thin outlines, full ring. First browser run compared lit vs unlit facets by raw
  brightness and failed at 320×568: a far lit facet (149) sat in less core light than a near unlit one (236), so the
  check now compares each facet with itself. No bugs found.
