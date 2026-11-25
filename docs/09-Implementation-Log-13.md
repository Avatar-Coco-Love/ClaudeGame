# 09 — Implementation Log, part 13

Continues `09-Implementation-Log-12.md` (part 12 neared the 8 KB cap at session 94). Newest at the bottom; read the tail only.

## Session 95 — Build: S-47a Shoal Undertow (v1.4.35, D-127)
- S-47 split (D-127): this PR is the Undertow + `tools/haulrun.mjs`; brittle glass + Shoal music are S-47b.
- `src/undertow.js`: per-chunk field (Shoal centres only, ~52 % flowing over 8 seeds), eased core current added to the
  realized move in `game.js`, pickup drift at half, dashes drawn under the light layer; `dev.undertow(on)` flag.
- `tests/undertow.cjs` (7 checks, in smoke): field = seed, bands, none at 160; realized = flow with intent / target /
  own velocity 0; calm adds nothing; ease ½ / 0.9 / 1 at 0.25 / 0.45 / 0.5 s; Drift = Surge; pickup at half; no save
  key; haulrun median ≤ 1.15; dashes High 8 ≤ 30, Low 6 ≤ 15. New module, so every check fails on the old code.
- Observed: haulrun median ×1.000 — the d 90 tunnel crosses only 10 Shoal cells, mostly one chunk, often calm, and
  tunnelling dominates the trip. The probe passes easily but says little; S-47b or a design session may want a
  d 100 leg. First screenshot showed all dashes on one row (a weak slot hash): fixed, re-shot, viewed.
- Smoke 449/449 (was 442; +7 undertow). Shots: scratch only.

## Session 96 — Build: S-47b Shoal brittle glass + lydian music (v1.4.36, D-128)
- `src/shatter.js`: `shatterPick` (pure, seed + cell index + standing cells), `shatter` (60 % of the neighbour's hp,
  no chain via `onCellBroken(…, crack = true)`), `drawShatter` (faint jagged line, 0.35 s). Ore breaks never crack.
- Music: `MUSIC_RING_MAX` 3; `MUSIC_SCALES[3]` lydian, progression [0, 1, 4, 1]; root a step below Deep.
- `tests/shatter.cjs` (5, in smoke): determinism under reversed break order + seed 777 differs; 60 % to one neighbour
  only; no chain (pre-cracked neighbour breaks, mined +2, nothing else touched); Shoal-only, none at 160, ore no-op;
  no save key. `music.cjs`: Shoal in every ring × mode (Drift / Surge gap 0.0 dB) + Kiln clamp check (fails with the
  old clamp 2: proved). Screenshot at d 90 viewed: lines read as faint mint cracks next to the crack overlay.
- Observed: the first beam pass in the shot hit a Prism cluster, so no crack (correct: ore never shatters).
- Smoke 455/455 (was 449; +5 shatter, +1 music). Shot: scratch only.

## Session 97 — Design: Shoal play-test, Q-027 settled, S-48 split (v1.4.37, D-129)
- Probes (scratch copies, not committed): `haulrun` at d 100 → median ×1.000 at levels 3 and 0 (18 / 19 of 20
  pairs, max ×1.30 / ×1.31); an open 5-wide corridor through the Shoal (radial d 82–102, tangential at d 92) → ×1.00,
  max ×1.05. A round trip cancels a current; the Undertow is a one-way feel. Q-027: no d 100 leg (D-129).
- Counted over 8 seeds: Shoal ~13.9k cells (40.8 % flowing), Kiln ~31.5k (2.1 % under a Shoal-centred chunk's
  current, so the seam flows a few cells into the Kiln; heat goes by the cell's ring). 1 vent / 250 cells ≈ 126 sites.
- Play-test (Playwright, Drift + Surge, d 90 flowing chunk, then d 110): idle drift 48–68 px over 2 s matches
  30–55 px/s with the ease; dashes faint but readable; Surge = Drift push; no page errors. Shots viewed.
- Observed: dev teleport to d 110 often lands in a big open cave (3 of 6 had no solid cell within 4). **B-086**
  (unconfirmed): one shot after 6 s of beam drew no terrain / light within 2 cells while `world.get` had ore there;
  7 reruns drew fine. Logged in Debt for audit 99.
- Specs: `07-Build-Specs-10.md` S-48a (heat by damage share ≤ 1, overheat 1.2 s, phrygian, haulrun d 116 ≤ 1.20×) and
  S-48b (flare vents, no terrain change, near sites only, v1.5 close-out).
- Smoke: see PR (docs only; +0 checks).
