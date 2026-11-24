# 06 — Decisions log, part 7

Continues `06-Decisions-6.md` (same rules: supersede, never edit; list rejected alternatives). D-058 on.

### D-058 — Audit 39: leaving the page is a cancel; Glitches are sprites; sheet targets 44 px (2026-11-24, audit 39)
- **Blur / hidden = cancel (B-032; extends D-042).** `Input.release()` marks the input dropped, and the next `read()` carries
  `cancel: true`, so a Pulse charge drops unfired, like pause or the Matrix. Before, the cleared keys read as a let-go and fired it.
- **Stick handoff adopts only canvas touches (B-030; amends D-050).** A finger resting on ◎ / ⟂ / Core Matrix is never adopted:
  its touchend goes to the button, so the stick would never clear.
- **Glitch bodies and eyes are glow sprites, culled off screen (supersedes D-051's "Glitches ≤ 9 keep shadowBlur").** One sprite
  per tier (+ white flash, + eye per tier), drawn rotated and scaled for the give-up fade. Measured first (`tools/perf.cjs` new
  `surge` run, flushed, ×4): enemies 6 % → 4 % of draw, mean frame 60 → 55 ms; side-by-side screenshot of all tiers viewed.
- **Every Matrix / Settings control is ≥ 44 × 44 on a coarse pointer (B-031; extends D-050)**: tabs, buy buttons, Settings
  switches and ✕. Under 480 px wide the sheet header wraps (bank on its own row) so ✕ never shrinks or leaves the sheet.
  `tests/touch.cjs` checks it at 320×568, 412×839 and 844×390.
- Rejected: firing on blur but zero damage (still costs the recovery and a sound); ignoring HUD touches by screen position (the
  layout moves per orientation; the event target is exact); keeping shadowBlur Glitches because the cap is 9 (they draw twice
  a frame, and S-19/S-23 add more glowing things); shrinking the bank font instead of wrapping (99999◆ still pushed ✕ out).

### D-059 — S-21 as built: the ready shot uses the burst's own target test (2026-11-24, session 40; implements D-054)
- **"In reach" = what the burst would hit:** a live Glitch inside the burst's own ray test (`pulseFoe`, shared with
  `releasePulse`, so hold and burst can never disagree) or any solid cell, bedrock included, within `range × PULSE_RANGE`.
  The charge sits at exactly 1 while it waits; the renderer reads that as "full" and draws the reach solid at 60 %.
- **Measured (`tools/standoff.mjs`, 20 angles):** standing, Beam 2: wave3 tier 3 Pulse 96 hp / 20 deaths → 32 hp / 0
  (Focus 96 / 20); single tier 3 64 → 0 (Focus 32); wave3 tier 2 78 d7 → 26. Swarms stay Focus's: wave5 tier 0 Focus 0,
  Pulse 64 → 45. Kiting wave5 Beam 2 tier 3: Pulse 66 hp d12 → 3 (Focus 10). Exactly D-054's prototype numbers.
- **Mining:** deeprun Beam 2 first-Lumen median 43 → 41 s (Focus 30); parity lvl 2 Drift ▲/min 13.5 → 13.1, Surge 9.2 → 9.4.
  The only change is a bot turning toward open floor no longer wastes a burst into air. Wide and Focus rows are byte-same.
- Rejected: a separate reach test for the hold (two copies of one rule drift apart); a `b.ready` flag (charge = 1 already
  says it); pulsing the full line (D-039 spirit: no new attention-grabbing motion, and static under reduced motion is free).
