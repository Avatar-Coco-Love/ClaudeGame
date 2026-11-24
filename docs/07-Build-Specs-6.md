# 07 — Build Specs, part 6

Continues `07-Build-Specs-5.md` (same rules; build order in `07-Build-Specs.md`'s header, D-063). Written in Design 72
for **M8 Polish & platform** (D-103). Build order: S-38 → S-39 → S-40 → S-41. Recorded audio (v1a/v1b) still waits on
the owner's pack (D-037, Q-021); ambient music gets its spec in a later Design session.
**Sinks:** none. **Layers (`01`):** none of these touch a progression layer; they change how the game is reached,
controlled, read and drawn. **Save:** no world-save change (`SAVE_FORMAT` stays 15); new player choices go in
`lumencore.settings.v1` through `clean()` (D-016), which already drops unknown or damaged fields.

## S-38 — PWA: installable, plays offline (M8) (D-103)
- `manifest.webmanifest` (name, short_name "Lumen Core", `start_url: "./"`, `scope: "./"`, `display: "standalone"`,
  `orientation: "any"`, background/theme `#03040c`) + `<link rel="manifest">`. Icons 192 and 512 px PNG (+ maskable
  512) rendered once from the Nexus hexagon with Playwright (like `og.png`, D-044): neon geometry, no text.
- `sw.js` at the root (scope `./`, so it works under `/ClaudeGame/`): **network first, cache fallback** for every
  same-origin GET, written to cache `lumen-<VERSION>` on each good response; old caches deleted on `activate`. No
  hand-kept file list and no build step: one online visit makes the next one work offline, and an online player
  always gets the newest deploy. Registered from `main.js` after the first frame; skipped on `file:` and `?dev`.
- Never caches a non-200 or cross-origin response. The world save is untouched (localStorage, as now).
- **Smoke (`tests/pwa.cjs`):** manifest parses, icons exist at their sizes, `start_url`/`scope` relative; browser:
  load, wait for `navigator.serviceWorker.ready`, `context.setOffline(true)`, reload → title screen renders, New World
  starts, no page errors; the cache name carries `VERSION`. One screenshot (offline title). Prove it fails without sw.

## S-39 — Keys by position, then remappable (M8) (D-103)
- Measured: `input.js` reads `e.key`, so WASD is ZQSD-blind on AZERTY (Z/Q/S/D send z/q/s/d; Q is also beam mode).
  Read `e.code` (KeyW, KeyA, …, Space, ArrowUp …) for every binding; show the key the layout prints
  (`navigator.keyboard.getLayoutMap()` when present, else the code's letter) in `<kbd>` badges and hint lines.
- Settings sheet: a **Keys** list (move ×4, mine, Core Matrix, Scanner, beam mode, place/reclaim, mute): tap a row,
  press a key, saved as `settings.keys` (action → code). Esc cancels; a code already bound to another action swaps
  the two (never two actions on one key); "Reset keys". Arrows stay as fixed second move keys; Esc and Enter stay fixed.
- `clean()` keeps only known actions with a string code; a missing or bad entry falls back to its default.
- **Smoke:** `KeyW`-by-code moves up with `key: 'z'`; rebind Scanner to KeyG → G pings, F doesn't; a clash swaps;
  reset restores; a damaged `keys` entry loads defaults; badges show the bound key. Touch is unchanged (D-050).

## S-40 — Readable text and a colour check (M8) (D-103)
- Measured at 1280×800 (Design 72): 11 px text in the HUD (cargo and integrity numbers, labels, buff chips, `<kbd>`)
  and on the title (footer, version). Floor: **12 px** for anything shown during play; 11 px stays for the footer.
- Settings: **Text size** Normal / Large (×1.2) via one CSS variable on `:root`; Large must still fit: at 320×568 and
  568×320 no HUD box overlaps another and the ◎ ⟂ ♪ ≡ row keeps ≥ 44 px targets (reuse `touch.cjs`'s rect check).
- **Colour check (`tests/colours.cjs`, node):** every pair the player must tell apart by colour alone (the 3 Anomaly
  kinds, Glitch tiers vs Spitters, Shard vs Prism vs Lumen pickups) keeps CIE76 ΔE ≥ 25 under deuteranopia,
  protanopia and tritanopia simulation (Machado 2009). Design 72 measured the Anomaly kinds: lowest 29 (tritan
  Overclock/Lodestone). A pair that fails gets a shape difference, not a new colour. Ores are already shape-coded.
- **Smoke:** computed font sizes ≥ 12 px over the play HUD at both settings; Large fits at both phone sizes; the colour file.

## S-41 — Low-end frame budget: adaptive resolution (M8 → v1.3 when S-38…S-41 + audio are done) (D-103)
- Measured (Design 72, `tools/perf.cjs`, 4× CPU, software canvas: read ratios): base 61 ms mean, loot 137 ms (300
  pickups: Light 40 %, Pickups 36 %). DPR is capped at 2 (`render.js`); the light layer is already half resolution.
- **Auto quality:** keep a rolling p90 of frame dt over 3 s of play (not paused, not hidden). Above 24 ms → step down
  one level; below 14 ms for 10 s → step up. Levels: L0 DPR ≤ 2; L1 DPR 1; L2 DPR 1 + particles ×0.5 + pickup glow
  off. Never below L2; never changes the simulation (dt, RNG draws, collision are the same at every level).
- Settings: **Graphics** Auto / High / Low (Low = L2 fixed). Saved in settings, not the world save.
- **Smoke:** a forced slow frame stream (the `slowFrames` helper, audit 69) steps Auto down to L1 then L2, a fast one
  steps back up; High never steps; the same seed + input yields the same `stats` at L0 and L2 (simulation untouched).
  Perf tool: add `QUALITY=0|2` and record the L2 ÷ L0 ratio for `loot` in `09`.
