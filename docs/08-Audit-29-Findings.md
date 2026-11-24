# 08 — Audit 29 findings (work list for the next session)

From session 29's five subagents (bugs, perf, touch, code health, docs drift). Subagents reproduced the bugs (their scratch
scripts are gone); **re-verify each before fixing** (CLAUDE.md), and write a test that fails on the old code. Delete this file
once every item is fixed or moved to `04` Debt. Perf audit was stopped before reporting: re-run it in the next audit.

## Fix first (one PR, in this order)
1. **Full floor kills all yields (persists in the save).** `src/game.js:277` refuses non-forced pickups at `PICKUP_CAP` (400);
   death scatter and caches push past it with `force`. Three full-hold deaths (Cargo 8, cap 140) → 420 pickups → ore and
   Glitch loot spawn nothing until collected. Fix: at the cap evict the oldest non-forced pickup (tag forced ones `kept`),
   or count only untagged ones. Test: 400 forced pickups, then a crystal break still yields.
2. **Dead Glitch still hits / fades lootless.** `src/game.js:362-383`: the `e.hp <= 0` check (≈374) runs after the stall
   give-up `continue` (≈365) and contact damage (≈367-371); the beam lowers hp earlier the same frame (`beam.js`). A Glitch
   killed on contact still deals ~14 dmg (can destabilize); one killed on its give-up frame fades with no credit/loot.
   Fix: move the death block right after the fade block.
3. **Q / F lost during hitstop.** `src/main.js:277-282` consumes `scan`/`beamMode` every frame but skips `game.update` while
   `game.hitstop > 0`. Fix: consume only when the sim runs (keep the paused / under-Matrix drop rule).
4. **Matrix sheet shows a stale bank while a deposit streams.** `renderPanel` (main.js ≈192) runs only on open/tab/buy/mode;
   a deposit takes up to ~5 s. Fix: re-render when the bank changes while `panelOpen`.
5. **Empty Scanner ping draws no ring.** `render.js:453` and `research.js:85` skip when `marks` is empty. Fix: run the ring on
   `age < end` regardless of marks.

## Touch / mobile (one PR)
- Landscape 844×390: `#title` (`style.css:78`, flex center + overflow) clips the logo above scrollTop 0 (−57 px with Continue).
  Fix: `margin:auto 0` on `.title-inner`, `align-items:flex-start`; `@media (max-height:480px)` shrinks h1 and the minimap.
- Landscape: ◎/⟂ sit at x 754-832, y 200-294 — under the right (aim) thumb; the 480 px media query doesn't fire.
- Tap targets < 44 px: `#mute-btn`, `#menu-btn` 36 (`style.css:30`), `#matrix-close` 32 (`:59`), `.mode-toggle button` 32 (`:74`).
- ≡ quits to the title on one tap (main.js ≈236), 6 px from ♪ and ◎. Bigger target + confirm, or open a pause sheet.
- 320 px: `#hint` is nowrap + ellipsis; the first touch hint loses "mine". Wrap it under 380 px or shorten the strings.
- ⟂ never shows the current beam mode on touch (only `title` + a toast). Put the mode in the button label.
- A second finger on a side isn't adopted when that side's stick lifts (`input.js:50-53`). Adopt it in onTouchEnd.

## Docs drift (fold into any PR)
- README controls miss F scan, Q beam mode, M mute, Enter Matrix.
- `04` Tooling `MODE=pulse` runs Focus: noted in `04` (session 30); still make the tools reject unknown modes.
- `02`/D-021 say hitstop is crystal/prism only; it fires on any yield cell (Lumen too). Wording only.
- `04` Debt "Bedrock edge … beam shows no hit": the beam does spark (beam.js ≈59-62), no crack. Re-check on screen.

## Code health (low priority, put in `04` Debt)
- Dead: `oreWithin` (`research.js:20`), unused `mat` (`game.js:255`), dead `integrity: 100` (`game.js:84`), ROCK/DENSE
  `fill`/`edge` in `MATERIAL` and `MINI_COLORS` (ring palette overrides them).
- Strings repeat numbers: Scanner desc "12 cells" and `RESEARCH_HINT` "55 cells" — build them from `SCAN_RADIUS`/`LUMEN_D`.
- Glitch/core tuning inline in `game.js` ≈329-430 (cap, interval, aggro 560, tiers, knockback, heal 45/s…): move to
  `config.js` and the Glitch block to `src/glitch.js` (also eases the 600-line limit).
- `render.js` 540 lines: split minimap/HUD (~110 lines). `smoke.cjs` 514: move Node-only checks to `tests/world.cjs`.
- Duplicated buy logic (`game.js:121-163`), ore glyph type set (`research.js:5` vs `render.js:123`), silent-audio stub ×9.
