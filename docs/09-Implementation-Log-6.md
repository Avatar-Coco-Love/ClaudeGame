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

## Session 53 — Build: S-28 facet puzzle + relit (v0.4.57, #58)
- **What:** on a primed Spire the aim ray's cell (`b.target`, never Wide's side rays) feeds `updateFacetAim`: 0.35 s on
  one facet toggles it + neighbours, latched until the ray leaves; a Pulse burst stopping on a primed facet toggles it
  (and `pulseInReach` counts it). Mask 255 → `relightSpire` (also S-20's broken path): `lit`, `mode`, light, chime,
  toast. Hint in a primed interior. `SAVE_FORMAT` 12: lit without `mode` → 'broken'; unknown `mode` dropped.
- **Checks** (`tests/facet.cjs`, 16): in-game solve 40 seeds × 5 + Surge; brush / hold / re-aim; dormant + lit never
  toggle; Wide side ray no, centre ray yes; Pulse once; reload + old save + junk mode; broken path; mouse at 1280×800
  and the aim stick (CDP touch) at 320×568 each flip a facet and relight; hint fits; audio ceilings for 3 new tones.
  Stashing `src/` fails 5 node checks (then throws); routing side rays into the aim fails both Wide checks.
- **Measured:** `facetprobe` 2000 seeds: 308/308 distinct start patterns relit in-game (60 s). Centre-ray window per
  facet 45–90° from its best interior cell. Tones: flip −33.8 dBFS, chime −31.8, 0 % > 2 kHz.
- **Observed (screens viewed):** primed: lit facets filled, unlit outlined, hint under the core; relit: core hexagon
  filled bright, all 8 facets lit, violet pool round the Spire, toast "Spire relit (1/5)". At 320×568 the dev panel
  covers the hint (dev only). `relay.cjs` pinned `lightSets` as "0,1" → "0,1,0" (a third set now). No bugs found.

## Session 54 — Audit: one toggle per aim, phone toast band, tap answers first (v0.4.58, #59)
- Sweeps (correctness, mobile/touch + perf, code health, docs drift) ran in parallel; each finding re-run here first.
- **B-043 → fixed:** a full Pulse held on a primed facet re-fired each recovery: 6 flips in 10 s (seed 77). Now a burst
  latches its facet (`beam.facetLatch`); a held full charge waits there and a let-go charge is dropped (D-084).
- **B-044 → fixed:** a Glitch crossing the centre ray cleared Focus's facet latch: 2 flips, aim unchanged. A Glitch on
  the centre ray (`beam.midEnemy`) now pauses the latch.
- **B-045 → fixed:** a save with `lit: true` and a junk mask loaded mask null (facets drawn unlit); lit → 255.
- **B-046 → fixed:** a tap's answer toast waited behind a milestone (up to 3.8 s); now it shows at once, the milestone returns.
- **B-047 → fixed:** phone toasts covered ◎ ⟂ (320×568), ✦ (412×915) and the minimap + ✦ (568×320, new). Portrait: below
  the core; landscape: under the bank panel (Surge height). `touch.cjs` checks 5 sizes vs every HUD box + the core's
  look-ahead square; it failed on all four phone sizes before (and caught the Surge panel on the first try). Viewed.
- Each new check failed on the old code first (C1–C3 node, T2 with `main.js` stashed, T1 before the CSS).
- Docs: README controls (⊕, facets), `01` Crafting, built S-20/S-22/S-28 text deleted from `07-…-3`, Debt refreshed
  (H1, H2, H4, T3 logged), stale comments (`light.js`, `RELAY_GAP`, B-033). `09` parts 3–4 (sessions 44–48) archived
  word for word. All D-001…D-083 re-checked: match. Smoke 244/244 (9 new checks).

Continued in `09-Implementation-Log-7.md` (session 55 on).
