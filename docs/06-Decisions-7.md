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
