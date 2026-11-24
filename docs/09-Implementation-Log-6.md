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

## Session 52 — Design: the Spire route play-tested, S-28 proven, S-30 specced (v0.4.56, #57)
- **Play-test** (Playwright, 1280×800, mid build, 120◆ 100▲ banked, both modes; screens viewed): craft a Relay in the
  Craft tab at the Nexus, start 26 cells from the nearest Spire, drive (WASD + mouse) to its Nexus-side gap pressing B,
  step in, feed, prime. Drift: Relay placed ~22 cells out, 80 fed in 10.4 s, "Spire primed", 3 lit facets glowing,
  unlit ones outlined. Surge: the Relay was refused ("vault") all along the last 22 cells (a vault nearby); a Glitch
  reached the shell while feeding; primed in 10.3 s at full integrity. The lit/unlit pattern reads; the neighbour rule
  does not, so S-28 gets a hint (D-080). Geometry: the nearest legal Relay cell is 20 cells from a Spire centre (median
  and p90 over 1000 Spires; worst 28.6), so a Relay always fits just outside the 16-cell band.
- **Route probe** `tools/spireloop.mjs` (20 seeds, mid, nearest Spire, R 24): minutes to primed, Drift / Surge: 5.3 / 5.5
  with 0▲ banked, 4.5 / 4.5 with 20▲, 2.0 / 2.5 with 50▲; start build 9.4 / 11.8. Surge deaths ~5 per run (the bot ignores
  Glitches); a Relay changed Drift nothing (bank trips ~0) and Surge 4.5 → 3.5 min. The bot got stuck on 10–25 % of
  seeds (straight lines into dense corners): S-30 plans by dig cost (D-082). Prism cells within 18 cells of a Spire:
  ~20–30 (×1.5▲), so the bank fallback (D-070) carries the route. Q-016 closed: no cargo bonus (D-079).
- **Facet probe** `tools/facetprobe.mjs`: 2000 seeds × 5 Spires, every start needs exactly `SPIRE_TAPS[i]` (3/4/5) taps,
  never solved at start; all 256 masks reachable; `FACET_RING` = `spireTypeAt`'s facets; Focus at the start range (96 px)
  reaches all 8 from the interior; Wide hit two facets at once in 4.6 % of aims → aim ray only (D-080).
- **Specs:** S-28 refreshed (aim ray, hint, `mode` save, D-081), S-30 Surge bot written, S-23/S-24 updated for `mode`
  and the bot; S-29 unchanged. Changelog v0.2.43–v0.2.47 archived word for word (cap). No bugs found.
