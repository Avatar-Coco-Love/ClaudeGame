# 06 — Decisions log, part 14

Continues `06-Decisions-13.md` (same rules: supersede, never edit; list rejected alternatives). D-102 on.

### D-102 — S-37 Anomalies found as built; M7 ✅, v1.2.11 (2026-11-24, session 71, Build; implements D-098)
- **Seen** = the site's cell is set in `world.explored` (the minimap's own bit): derived, so no save change (format stays
  15). `siteMapState` → null / charged (filled dot, kind colour) / recharging (hollow); a void site never shows.
- **Ping:** `anomalyScanMarks` adds charged sites within `SCAN_RADIUS` to the ping's marks (`type: 'anomaly'`, upright
  hexagram glyph, kind-coloured minimap blip); `markAlpha` drops a mark once its site is taken. No cache tone for them.
- **End tone** `anomalyEnd()`: the take tone falling, 0.35 s after the deposit chime (peak -36 dBFS, 0 % > 2 kHz).
- **Hint:** the hint line (lowest priority, above "Cyan crystal veins"), not a toast: shown while a charged site is in
  the core's light, until the first take of the session. A toast (tried) queued in front of milestone toasts and broke
  the S-20 "Spire primed" check (`spirefeed.cjs`); a plain toast could still delay a milestone by up to 3 s.
- **VERSION 1.2.11:** minor 2 = M7 shipped; the PR count keeps counting (as 1.1.6 did), not "1.2.0" as `02` said.
- Rejected: a saved "seen" list per site (the explored bit already says it); pinging taken sites as hollow (the spec
  says the ping is for charged ones; the minimap already shows recharging ones).

### D-103 — Design 72: M7 play-test; M8 = S-38…S-41 (2026-11-24, session 72, Design)
- **Play-test (Playwright, seed pinned via New World):** Surge 1280×800 with a Veil Ballast site carved open: taking it
  shows the ⬡ chip, cargo 140 → 210, the minimap dot turns hollow; 20 s of Surge brought 2 Glitches, no errors. Drift at
  320×568 touch: hexagram reads in the core's light, "Entering the Veil" and the touch hint don't cover it. M7 needs no change.
- **Measured for M8:** HUD text down to 11 px (cargo/integrity numbers, labels, chips, `<kbd>`); Anomaly kind colours
  keep ΔE ≥ 29 under all three colour-blind simulations; `input.js` reads `e.key` (WASD breaks on AZERTY); perf at
  4× CPU: base 61 ms, loot 137 ms mean (software canvas; ratios only).
- **M8 build order:** S-38 PWA → S-39 keys → S-40 text + colour check → S-41 adaptive graphics. None changes the world
  save or a progression layer; player choices go in settings (D-016). Ambient music: spec later, after S-41.
- **Offline = network-first service worker** writing a `VERSION`-named cache: no precache list to keep in sync, no
  build step (Hard rules), an online player always gets the newest deploy.
- Rejected: a precache file list (drifts from `src/` every PR, needs a check or a build step); cache-first (players
  would run a stale version for a visit after each deploy); remapping touch controls (D-050 layout already measured);
  a fixed "low-end device" sniff by user agent (measure frame time instead); a colour-blind palette toggle (the
  measured pairs already pass; a failing pair gets a shape, not a mode).

### D-104 — S-38 PWA as built; v1.2.13 (2026-11-24, session 73, Build; implements D-103)
- `manifest.webmanifest` + `icons/` (192, 512, maskable 512; `tools/icons.cjs` draws the Nexus rings, no text);
  `sw.js` network first, caching each same-origin 200 into `lumen-<VERSION>`; `src/pwa.js` registers it two frames
  after the title is drawn, skipped on `file:` and `?dev`. The deploy's `cp` list ships all three (B-020 rule).
- **VERSION reaches the worker as `sw.js?v=<VERSION>`:** one source of truth, and a new deploy changes the script URL,
  so the browser installs the new worker, which deletes older `lumen-*` caches.
- **Warm list:** the page that registers the worker was fetched before it existed, so it posts its own URL plus
  `performance` resource entries (same-origin) and the worker caches them. That makes the *next* visit offline-ready
  (spec: "one online visit"). An unknown navigation URL offline falls back to the cached `./`.
- Rejected: a module worker importing `config.js` (Firefox/Safari support for `type: 'module'` workers is recent);
  a second VERSION constant in `sw.js` (drifts); precaching a file list (D-103); waiting for a second online visit.

### D-105 — Audit 74: the patch digit counts PRs since v1.0.0 (2026-11-24, session 74, Audit; supersedes D-046's "never resets")
- D-046 said the PR count never resets, but v1.0.0 (D-091, #66) restarted it at 0 and every entry since followed
  (#79 = v1.2.13). Settled as built: the third digit counts PRs merged since v1.0.0 and never resets again; the PR
  number itself is in every `05` header, so the one-entry-per-PR history D-046 protected is intact.
- Also: the worker's offline navigation fallback (D-104) ignores the query and tries `./` then `./index.html`, so a player
  whose only visit was a `?fbclid=` / `index.html` URL still gets the home-screen launch; an Anomaly isn't taken while a
  deposit is under way (a Relay can sit by a site, and the deposit would end the buff ticks later).
- Rejected: restoring the global count (v1.2.14 → v1.2.80 reads as a jump to players and rewrites nothing useful);
  editing D-046 in place (decisions are superseded, never edited); refusing Relays near sites (a placement rule players
  can't see; the deposit guard covers the same case).

### D-106 — S-39 keys as built; v1.2.15 (2026-11-24, session 75, Build; implements D-103)
- Bindings are `KeyboardEvent.code` (action → code) in `settings.keys`, cleaned by `cleanKeys()` (`src/keys.js`): unknown
  actions dropped, a bad or fixed code falls back to its default, a clash left by cleaning resets the clashing entries.
  `input.bindings` is the same live object, so a rebind reaches the game at once. Key-only synthetic events map to codes.
- Fixed and unbindable: arrows (second move keys), Escape, Enter / NumpadEnter, and **Tab** (keeps moving focus).
- Settings gets one **Keys** row that swaps the sheet to a Keys view (ten rows, Reset, Back), so the main sheet still
  fits 320×568 without scrolling (S-3 check). The row is hidden for touch players (D-050). Labels: `getLayoutMap()`
  when present, else the code's letter; `src/keysui.js` names keys in badges, titles, hints and the title line.
- Rejected: listing the ten rows on the main sheet (scrolls at 320×568); refusing a clash instead of swapping (spec says
  swap); allowing Tab (a keyboard-only player could lose focus navigation in Settings).

### D-107 — S-40 readable text + colour check as built; v1.2.16 (2026-11-24, session 76, Build; implements D-103)
- Every `font-size` in `style.css` is `calc(Npx * var(--ts))`; `--ts` is 1, or 1.2 under `:root.text-large`, set from
  `settings.largeText` (boolean, cleaned like the other switches). One **Large text** switch, not a Normal/Large picker.
  All 11 px play/sheet text → 12 px; the title footer alone stays 11 px. The canvas "NEXUS" label: 12 / 14 px.
- Fit at Large: on phones (≤ 480 px wide, and short 568–700 px landscape) the bank stays a fixed 15 px; bar label and
  value widths scale with `--ts` (label 72 px base: INTEGRITY's ink is 70 px with its letter-spacing).
- Colour check (`tests/colours.cjs`): Machado 2009 severity 1 in linear sRGB, CIE76. A pair passes at ΔE ≥ 25 **or**
  with different shapes, each shape proved from the draw code. Shard/Prism is 18 under deuteranopia: passes by ◆ ▲.
- Rejected: a new Prism colour (spec: shape, not colour); scaling the phone bank (overlaps the minimap at 320 px and
  ◎ at 568 px); CSS `zoom` (scales boxes and 44 px targets too, not just text).

