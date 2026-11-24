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
