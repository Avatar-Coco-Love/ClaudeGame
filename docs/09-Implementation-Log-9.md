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

## Session 74 — Audit: SW query launch, Anomaly vs Relay deposit, pickup sprites, D-105 (v1.2.14, #80)
- Five sweeps (correctness, perf at ×4, touch at 7 sizes, code health, docs drift), each finding re-checked here.
- **B-061** (sw.js): offline navigation matched the URL query-exact, so a player whose only visit was `?fbclid=` or
  `index.html` had no `./` cached → home-screen launch offline = browser error. Fallback now ignores the query and tries
  `./` then `./index.html`. `pwa.cjs` check fails on the old worker (title false), passes now.
- **B-062** (anomaly.js): a site within reach of a Relay was taken during a deposit, and the deposit ended the buff a few
  ticks later. No take while `atDeposit()` with cargo; taken once banked. `anomaly.cjs` check: old code during 1, after none.
- **B-063** (style.css): landscape toast at inset+100 overlapped the bank panel by 2–4 px with three chips (568×320,
  667×375, 915×412 all failed the extended B-047 check); now +110. Screenshot 568×320 viewed: clear gap.
- Perf: pickups drew save/translate/rotate/scale/restore each; spin is now 16 baked frames (`PICKUP_FRAMES`), one
  axis-aligned `drawImage` per pickup. `drawcost.cjs` counts: old 301 save / 300 rotate, now 1 / 0.
- Canvas `100%` instead of `100vw/vh` (iOS Safari); hint/Matrix button clear the home indicator (+10 px); `.sheet` uses dvh.
  Not testable headless (insets 0, no Safari toolbar): px values unchanged there.
- `tools/parity.mjs` 0/0 guard; Wake config comment now cites S-31/D-087. D-105 settles the patch digit (PRs since 1.0).
- D-xxx check: the drift sweep compared every decision with code; only D-046 had drifted (D-105). D-096…D-104 spot-checked.
- Archived sessions 64–68 word for word to `archive/2026-11-24-09-sessions-64-68.md`. Rest of the findings → `04-…-2` Debt.

## Session 75 — Build: S-39 keys by position, remappable (v1.2.15, #81)
- `src/keys.js` (actions, defaults, `cleanKeys`, `bindKey` swap, `eventCode`, labels) + `src/keysui.js` (Settings Keys
  view, every on-screen key name). `input.js` reads `e.code`; Space/arrows preventDefault as before.
- `tests/keys.cjs` (3 node + 6 browser checks): KeyW with key "z" moves up, key "w" on KeyZ does not; rebind Scanner → G
  via the sheet, Esc cancels, clash swaps, Reset, saved across reload, G pings and F doesn't, badge shows G; damaged
  entry loads defaults. Proved: with the old `input.js` the position check and the Settings flow fail.
- Observed: New World after a save asks `confirm()` (dismissed headless), so the test drops the save before reloading.
- **B-064** (smoke S-3 check): "controls ≥ 40 px" measured hidden buttons too (0 px); it now counts shown controls only,
  and `keys.cjs` checks the Keys view's own buttons ≥ 40 px. (A first full run also went red because VERSION was bumped mid-run.)
- Screenshot 1280×800 of the Keys view (Scanner on G) viewed: ten rows + Reset/Back fit without scrolling.
