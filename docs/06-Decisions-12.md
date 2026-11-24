# 06 — Decisions log, part 12

Continues `06-Decisions-11.md` (same rules: supersede, never edit; list rejected alternatives). D-087 on.

### D-087 — Design 57: the Wake for a person; B-048; M6 specs (2026-11-24, session 57, Design; settles Q-017)
- `tools/wakeprobe.mjs` (mid, 20 seeds): guard `human` (re-aims every 0.25/0.35/0.5 s, ±0.08/0.12/0.2 rad) fails
  0/17/67 %; `still` (never moves) 100 %; charge left ~90 when held: deaths, not charge, end Wakes. Start build: 100 %.
- **Tune (S-31):** Wake Glitches one tier down → `human` 0/0/9 %, `still` 100 %: moving round the core is the skill.
  Waves 1.2 s with that: 0/17/49 %; 1.0 s: 86–100 % (a cliff). A start build can't hold a Wake: Surge asks for a build
  where Drift asks for a puzzle; both relight the same Spire (D-055). Rejected: never chasing the player (13/61 %, no
  better: body-blocking still hurts); shorter Wake (the clock is the drama).
- **B-048:** the bot healed at the Nexus for ~85 % of its Wakes and still held them: Wake Glitches despawned past
  1500 px from the core. S-31 fixes it; until then walking away holds a Wake (Design sessions change no game code).
- M6 specs S-32 (Spitter) and S-33 (storm / aurora as one spec, so Drift isn't second-class) written; built after v1.0.
