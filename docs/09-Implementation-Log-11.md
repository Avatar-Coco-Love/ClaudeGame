# 09 — Implementation Log, part 11

Continues `09-Implementation-Log-10.md` (part 10 neared the 8 KB cap at session 82). Newest at the bottom; read the tail only.

## Session 83 — Build: S-44 ambient music, M8 ✅ (v1.4.23, #90)
- `src/music.js` (`Music`: pad / bell / pulse voices, own bus + 2 layer buses under `audio.master`, tracked linear
  ramps, `voicesAt`, note log); `MUSIC_*` + `DEFAULT_MUSIC` in config; `settings.music` (old settings → 50); Music
  slider under Volume; `main.js` steps it each frame with `{ ring, mode, wake, ending }` (null on the title).
- `tests/music.cjs` (11 browser checks, in smoke): ceilings per ring × mode + Wake, Drift vs Surge mix and layers
  alone within 3 dB, ≤ 6 voices + every ended note disconnected, Music 0 builds no oscillator, same seed → same first
  20 notes, ring change → new chord set in 5.6 s, Wake in Drift (no bell, 0.571 s pulse, one chord), Ending silent in
  2.95 s and fades back in, in-game settings/title/world/slider. Numbers: D-115. Stubbed `music.js`: 6 FAIL.
- First tuning had the bell 10 dB under the pulse (−71.8 vs −61.5 alone) while the mix check passed; the layer-alone
  check caught it (bell gain 0.035 → 0.12, pulse octave −1 → 0).
- Screenshot viewed: Settings at 320×568 (Music row fits, sheet scrolls). Audit 79's "Settings hides 2 rows below
  the fold at 568×320" is now 3 rows (sheet still scrolls; left in Debt).
- Smoke: 410/410 (was 399; +11 `music.cjs`).

## Session 84 — Audit: chunk pre-scale, music restart, Echo after death, landscape HUD (v1.4.24, #91)
- 5 parallel sweeps (bugs, perf, touch, code health, docs drift); every finding re-checked before acting.
- **Perf (D-116):** chunk canvases painted at zoom·dpr, blitted 1:1 at whole px. Headless 1280×800 frame 11.2 → 7.3 ms
  (DPR 1), 41 → 30.5 (DPR 2); 12-chunk blit 25 → 3 ms at ×4 (sweep). Before/after screenshots viewed: same, crisper.
- **B-076** music restart (mute → unmute, Music 0 → back) set the next chord to now over a ringing one (7 voices) and
  nulled the layer (old layer gain stuck at 1). Fix: keep the schedule while a chord rings; keep the layers.
- **B-077** a core death respawns in the Nexus ring, where the Echo was paused: no blink, so it waited at the death
  site (1193 px off). The blink check now runs in the ring too (not in the Ending).
- **B-078** 701–932 px landscape phones: named chips widened the bank panel under ◎ ⟂ (5 sizes): glyph-only there too.
- **B-079** Large text, landscape: death toast top 122 vs panel bottom 130 (123 ≤ 700): +126 / +114 and tighter
  padding at ≤ 700 (3 lines would reach ⊕ at 568×320).
- **B-080** a buff taken on a deposit's last frame: the fading chips' flash overwrote its chip; flash now keeps live
  chips and redraws after the fade.
- Docs drift fixed: Keys = eleven actions; recorded audio post-M9 (`08`); D-114 note on `07-…-6`; as-built notes on S-43.
- Each new check failed on the old code: `music.cjs` B-076 (7 voices, bell gain 1), `echo.cjs` B-077 (1193 px),
  `touch.cjs` toast loop + 740×360, 844×390, Large and panel-vs-buttons (5 FAIL on old CSS), new `audit84.cjs`
  (chunk size + B-080; 2 FAIL on old code). Leftovers → `04-…-2` "Audit 84 leftovers". D-095…D-115 checked vs code: match.
- `09-…-9` + session 78 archived word for word (`archive/2026-11-24-09-sessions-74-78.md`).
- Smoke: run 1 413/416 (VERSION raced a changelog edit; B-074 beacon dot ×2, passes alone); run 2 416/416.


## Session 85 — Build: weather cancel survives a reload, layout numbers to config (v1.4.25, #92)
- **B-081** a Wake (or the ending) cancels the weather event in progress via `weather.cancel`, which wasn't saved: a
  reload inside that event's 40 s brought it back. Now saved as `weatherCancel` (format 17, step 16 → 17; D-117).
  New `weather.cjs` check (Wake cuts storm 1, save, reload: off; storm 2 still starts) failed on the old code
  ("after reload on"), passes now. The D-097 "reload mid-event resumes" check still passes.
- Config: `BORDER` (2) and `VAULT_HALF` (3) now live in `config.js`; world / spire / anomaly / craft read them
  (craft's `- 4` is `SPIRE_HALF`). Same comparisons, so every seed's world is unchanged (`world.cjs` passes).
- Smoke: 417/417 (was 416; +1 B-081 check). No visual change, so no screenshot.

## Session 86 — Build: short landscape sheets (v1.4.26, D-118)
- Measured at 568×320 (Pixel 7 touch): Matrix header + tabs ended at y 131, rows 82 px, 2 whole rows; Settings rows
  ended at 347/399/451 past the sheet's 304. New `@media (max-height: 480px) and (pointer: coarse)` block in `style.css`
  (D-118): Matrix 4 rows (5 at 667×375), rows 57 px; Settings 2 columns, all 7 rows. Large + 2750◆ 1470▲ 141●: the
  bank wraps under the tabs, 3 rows. Screenshots viewed (Core, Research Large, Settings).
- New `touch.cjs` check at 568×320 + 667×375 (rows, ✕/tabs ≥ 44 px inside the sheet, Settings rows above the fold):
  FAILS on the old CSS, passes now.
