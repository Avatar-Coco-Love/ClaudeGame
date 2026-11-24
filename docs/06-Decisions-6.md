# 06 — Decisions log, part 6

Continues `06-Decisions-5.md` (same rules: supersede, never edit; list rejected alternatives). D-052 on.

### D-052 — Pulse charge rules the spec left open (2026-11-24, session 35, S-14; builds on D-042)
- **Held fire auto-fires at full charge** (charge 1), then recovers 0.3 s and charges again; that is how "held fire waits, then
  charges again" and the spec's 10 s sustained check can work. Measured: a 10 s hold on rock = 0.72× Focus (the first 1.2 s
  charge counts against it); steady state 1.2 dps·s per 1.5 s = 0.8×.
- **A charge is dropped unfired** (no burst, no tick) by a mode switch (Q / ⟂), an open Matrix sheet, pause, and death. Only
  letting go of fire (mouse, Space, aim stick) releases it. The intent carries `cancel: true` for the sheet; `beam.charge` resets.
- **No continuous hum in Pulse:** `beam.on` stays false; the release thump (sine 150 → 70 Hz, peak −30 dBFS) and a fizzle
  tick (−42 dBFS) are measured in `tests/audio.cjs`. Charge is never saved; the mode is (no `SAVE_FORMAT` change: `research` and
  `beamMode` already take any id).
- **Pierce detail:** the burst stops on the face of a cell it cracks but can't break, on unmineable cells, and inside the third
  cell it breaks (`PULSE_PIERCE`); a Glitch past broken cells takes the rest × 1.6 (`src/beam.js` `releasePulse`).
- Rejected: holding at full charge until release (a held button would never fire, so held-fire bots and Space players get 0);
  firing on sheet open (opening the Matrix would shoot); a rising charge tone (one more continuous sound to bound, D-039).
