# 09 — Implementation Log, part 9

Continues `09-Implementation-Log-8.md` (part 8 hit the 8 KB cap at session 71). Newest at the bottom; read the tail only.

## Session 72 — Design: M7 play-test, M8 specs S-38…S-41 (v1.2.12, #78)
- Play-test (scratch Playwright, New World seed pinned by `Math.random = 0.42`): Surge 1280×800, a Veil Ballast site
  carved open, core on it → ⬡ chip, cargo 140 → 210 (maxed Matrix), minimap dot hollow, 2 Glitches in 20 s, no errors.
  Drift 320×568 touch: hexagram readable in the light; toast and touch hint clear of it. Screenshots viewed (both).
- Measured: computed font sizes < 13 px — HUD 11 px (cargo/integrity text + labels, buff chips, `<kbd>`), title 11–12
  px; Anomaly kind colours CIE76 ΔE normal 74–99, deut 45–95, prot 39–95, trit 29–80 (Machado sims); `input.js` keys
  by `e.key` (AZERTY-blind); `tools/perf.cjs` 4× CPU 8 s: base 61 / p95 83 ms, loot 137 / p95 183 ms (Light 40 %,
  Pickups 36 %); idle real-time rAF at 1280×800 ≈ 20 ms mean in headless.
- Wrote `07-Build-Specs-6.md` (S-38 PWA, S-39 keys, S-40 text + colour check, S-41 adaptive graphics), D-103, Q-021
  (does M8 ship without the owner's audio pack). No gameplay code. No bugs found.

## Session 73 — Build: S-38 PWA (v1.2.13, #79)
- Added manifest, 3 icons (viewed the 192: three neon hexagons + white heart on #03040c), `sw.js`, `src/pwa.js`,
  deploy list, `tests/pwa.cjs` (5 checks: manifest, icon sizes, deploy ships them, cache `lumen-<VERSION>` warmed with
  `/`, `/src/main.js`, `/style.css`; offline reload → title → New World, no errors). Offline title screenshot viewed.
- Proved the test fails without registration (ready never resolves → cache empty; offline reload =
  ERR_INTERNET_DISCONNECTED). First attempt hung on `serviceWorker.ready`; the test now races it with a 5 s timeout.
- Observed: 27 same-origin files warmed on the first visit. No bugs found.
