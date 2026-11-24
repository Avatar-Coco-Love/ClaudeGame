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
