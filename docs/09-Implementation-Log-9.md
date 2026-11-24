# 09 — Implementation Log, part 9

Continues `09-Implementation-Log.md` (sessions 69–73 archived word for word in audit 79: `archive/2026-11-24-09-sessions-69-73.md`). Newest at the bottom; read the tail only.

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

## Session 76 — Build: S-40 readable text + colour check (v1.2.16, #82)
- `style.css`: all font sizes through `--ts`; 11 px → 12 px except the title footer. Settings → Large text (`largeText`).
- `tests/textsize.cjs` (6 browser checks): HUD texts ≥ 12 px at 1280×800 both sizes (29 texts; smallest 12 / 14.4), Large
  ×1.2, the switch saves / reloads / damaged loads Normal, footer 11 px, Large fits 320×568 (a world's supply, B-039) and
  568×320 (8888 ×3, B-034). Proved: with the old `style.css` 3 checks fail.
- `tests/colours.cjs` (node): lows normal 74, deut 45, prot 39, trit 29 (colour-only pairs; match Design 72).
  Shard/Prism deut 18 passes by shape. Proved: without the shape rule the deuteranopia check fails.
- Observed: at Normal, 8888 ×3 in portrait 320 already pushes the panel 13 px into the minimap; unreachable (a world
  holds 2750 / 1470 / 141), so not a bug. Large wraps "Core Matrix" to two lines at 320 px (fits, checked).
- Screenshots viewed: Large at 568×320 (before the fit fix: panel under ◎) and 320×568 (fits).

## Session 77 — Design/inbox: owner's AI ally idea + audio pack note (v1.2.17, #84)
- Inbox `2026-11-24-owner-allies-and-audio.md` processed, moved to `archive/`. **Adopted:** the ally as M9 **Echo**
  (D-108, supersedes D-045's end state; VERSION M9 → 1.4 in CLAUDE.md): one geometric lesser core, Research 30 ●,
  BFS follow + blink catch-up, two orders (Gather / Guard), one cycling key + ◇ button. Specs S-42, S-43 (`07-…-7`).
  **Rejected (D-108):** parking it, an Attack order, 3–4 buttons, a squad, a killable ally, Gather mining rock,
  a first-Spire grant. Q-022 opened (third order / second Echo, leaning no). Q-021: pack confirmed coming, v1.3 waits.
- Measured: a 4-neighbour BFS over a fully open 160×160 world (24,964 cells) costs 0.55 ms in Node, unthrottled;
  S-42 bounds it to 24 cells. Lumen budget: Research 75 → 105 ● of ~141 per world.
- The planned Design work (M8 play-test, ambient-music spec) moves to Design 82 (it becomes S-44; S-42/S-43 are the Echo).
- No code or visual change, so no screenshot.
