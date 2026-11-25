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
