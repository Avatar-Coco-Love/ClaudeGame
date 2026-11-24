# 06 — Decisions log, part 16

Continues `06-Decisions-15.md` (same rules: supersede, never edit; list rejected alternatives). D-113 on.

### D-113 — S-43 Echo orders as built: Guard in hp, ◇ beside ◎, no Wake cut (2026-11-24, session 81, Build)
- Built per S-43 (`src/echo.js`): `game.echoOrder` 'gather' | 'guard', saved (format 16; old saves and bad values load
  'gather'). One action `echoOrder` (R) in the key list; touch ◇ button; a chip leads the `#buffs` row; toast on change.
- **Guard damage is in hp, not "6 dmg":** the spec's number had no unit in the code (Glitch hp is 1.2 + 1.1 × tier).
  The intent "a tier-1 Glitch in 3 hits" is kept: `ECHO_GUARD_DMG` 0.8 (tier 1 = 2.3 hp → 3 shots; a bolt, 0.5 hp → 1).
  Target = the live foe nearest the **core** within 140 px that the Echo can see (`raycast` stops short by the foe's
  radius); it only takes hp, so glitch.js / spitter.js kill and loot exactly as for the beam. Guard never Gathers.
- **◇ placement:** in the ◎ ⟂ ♪ ≡ row from 701 px landscape; at ≤ 700 px landscape the row has no 52 px to spare
  (◎ would sit 37 px inside the bank panel at 568×320), so ◇ drops under the row left of ✦ (the S-16 ✦ rule). Portrait
  and desktop: ◇ left of ◎ (a `.pair`); left of ⟂ it sat 26 px above the core and blocked the Nexus pointer's ray at
  320×568. The pointer's HUD boxes now read the pair's children (`hud.js`). Phones: ◇ glyph-only; the chip keeps its word.
- **Wake check:** `ECHO=guard node tools/wakeprobe.mjs`: mid build identical (human 20/20 relit, charge 90; still 0/20);
  start build relit 0/20 both ways, `still` deaths 60 → 28. Not > 20 % easier by outcome → **no in-Wake damage cut**.
  (The spec compared with the facet puzzle's median time; a Wake is a fixed 40 s, so outcome is the measure.)
- Rejected: Guard dps scaling with Beam Power (Matrix layer already scales the beam; keep the ally's role flat); a Guard
  shot sound (no audio ceiling work this PR; the dash + Glitch flash read in the screenshot); ◇ in the portrait column
  below ⟂ (pushed ✦ into the toast band); hiding ◇ at 568 px (touch players would lose the order).

### D-114 — Design 82: M9 ✅, Echo income kept, recorded audio leaves M8, S-44 music spec (2026-11-24, session 82, Design; settles Q-021, Q-024)
- **Play-test (Playwright, 1280×800 + 568×320 touch):** Echo follows at 1.8 cells, 0 blinks, mines a Prism beside the
  core with a thin beam; R flips the chip to "Guard"; phone row ◎ ⟂ ♪ ≡ + ◇ below fits. No page errors. M8's S-38…S-41
  are covered by their smoke checks (`pwa`, `keys`, `textsize`, `colours`, `quality`); no new issue seen.
- **M9 ✅.** `VERSION`'s minor stays 1.2 (D-046: milestones shipped *in a row*; M8 is still open). When S-44 ships,
  M1–M9 are all ✅ and the minor goes 1.2 → **1.4** in one step (D-108's mapping); 1.3 is skipped, not invented.
- **Q-024 → keep `ECHO_DMG` 0.5, `ECHO_REACH` 5.** `echobot` (8 seeds × 10 min, max build): ◆/min ×1.65 Drift, ×1.53
  Surge (mid, session 80: ×1.45 / ×1.38). It is a late reward (30 ● after 75 ● of Research), the Matrix is mostly
  bought by then, and the gain is shared across modes (Drift ÷ Surge gain 1.08, inside S-42's 10 %). Watch: max-build
  blinks/min median 2.0 / p90 3.6 (faster Thrusters); re-check if a play-test calls the blink noisy.
- **Q-021 → recorded audio v1a/v1b leave M8** (the leaning: the pack is still absent after M9 shipped). They become a
  post-M9 item that starts when the pack lands in `docs/inbox/`; nothing waits on it. M8 = S-38…S-41 + **S-44**.
- **S-44 ambient music** specced in `07-Build-Specs-7.md`: synthesized pad + one mode layer each (Drift bell, Surge
  pulse, equal level), ring scales, Wake and Ending states, own seeded PRNG, a Music slider in settings (no save bump),
  measured ceilings in `audio.cjs` (D-037).
- Rejected: lowering `ECHO_DMG` to 0.35 (would pull mid to ~×1.3 but makes the 30 ● reward feel thin, and both modes
  gain alike, so no pillar is at risk); recorded music loops (needs files and a licence; the pack is SFX); music that
  differs in *amount* by mode (Surge louder) — pillar 3; minor 1.3 for M9 alone (breaks D-046's "in a row").

### D-115 — S-44 ambient music as built: no chord overlap, layers RMS-matched (2026-11-24, session 83, Build)
- Built per S-44 (`src/music.js`, `MUSIC_*` in config). Clock = the audio context's time, notes scheduled 0.1 s ahead
  (frame-rate free; a hidden page schedules nothing; after one the next notes restart from now, no catch-up burst).
- **Pad chords never overlap:** each chord's 4 s release ends exactly when the next chord's 3 s attack starts, so the
  bed breathes once per chord. Overlapping releases would put 6 pad voices + a layer note over the ≤ 6 budget (max
  measured now: 4 = 3 pad + 1 layer, 5 during a mode crossfade).
- **Equal weight measured on the layers alone**, not only the mix (the pad dominates the mix, so the mix was within
  0.2 dB even with the bell 10 dB under the pulse): bell alone −61.8, pulse alone −61.5 dBFS (Veil). The pulse sits on
  the chord root at octave 0 (D3 region), not an octave down: same RMS, more audible on small speakers.
- Mix (30 s, Volume 70, Music 50): sustained RMS −47.6…−47.7 dBFS in all 6 ring × mode states + a Wake; peak ≤ −33.4;
  loudest 50 ms −42.1; 0 % energy > 2 kHz. Ending → last sound 2.95 s after. Stubbing `music.js` fails 6 of 11 checks.
- A Wake switches layers at once (not at the next chord: it only lasts 40 s); ring and mode changes wait for the chord.
  Music plays only in a world (not the title, not under the Ending sequence or card); Settings opens from the title.
- Rejected: one persistent 3-voice pad gliding between chords (a smooth bed but no "chord every 10–14 s" breath and
  nodes that never end); scheduling on the frame clock (jitter, catch-up bursts after a hidden tab); measuring equal
  weight on the mix only (hides a 10 dB layer imbalance).
