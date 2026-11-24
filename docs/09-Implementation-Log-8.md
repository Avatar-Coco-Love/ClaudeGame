# 09 — Implementation Log, part 8

Continues `09-Implementation-Log-7.md` (split at the 8 KB cap, session 62). Newest at the bottom; read the tail only.

## Session 62 — Design: Relay reclaim specced (v1.0.1, #67)
- Q-018 (player request: "is the Relay just there forever?") → D-092 + S-34 (pick up in its ring, free, no save change).
- Play-tested the v1.0 arc from the smoke screenshots (ending sequence + card at 2 sizes, cycle-1 Nexus, title line).
  Seen: the card's "0m 00s" is the test's instant relight, not a bug; the overview map is mostly dark on a fresh world
  (only explored cells show) — fine: it is the player's own map.
- cycle.cjs pinned the title version to 'v1.0.0' (failed at 1.0.1): now reads VERSION. Smoke 273/273.

## Session 63 — Build: S-34 Relay reclaim (v1.0.2, #68)
- `craft.js` `pickUpRelay` + `tryPlace` branch; `main.js` toasts, hint, ⊕↑ button state (D-093). No save change.
- The browser check caught the real gap: on touch the ✦ button was hidden with nothing carried (tap timed out), so
  pick-up was desktop-only; the button now appears in any Relay ring. relay.cjs's "button hides after the last
  placement" now expects it shown (standing in the new ring). Spec text said "✦:"; the hint names ⊕↑, what's on screen.
- `tests/reclaim.cjs`: 3 node checks (fail with `craft.js` stashed) + 1 touch browser check. Viewed `reclaim-320x568.png`.

## Session 64 — Audit: skip keys, card fit, records, B-053…B-059 (v1.0.3, #69)
- Four subagents (correctness, perf, touch, code health + docs drift); each finding re-run here.
- **B-053 → fixed:** audit 59's comment swallowed `ctx.arc(); ctx.stroke()`: the Wake dial's faint ring never drew.
  `tests/comments.cjs` (D-094) flags it; it then caught a 4th swallow in this very session (`focus()` in `openEnding`).
- **B-054 → fixed:** the hint showed under the ending card (B-008's class); the card scrolled 4–30 px at 568×320.
- **B-055 → fixed:** a held Enter (repeat) clicked the focused Continue. The browser check's synthetic repeat doesn't
  reproduce it on the old code (untrusted events don't activate buttons): fixed by reading, logged as unproven.
- **B-056 → fixed:** the skip key also pressed a focused HUD button (♪ toggled). Check failed on the old code.
- **B-057/B-058/B-059 → fixed:** junk `records` crashed the ending / showed "best -1m -30s"; an ended v13 world lost its
  record; dev relight-all mid-Wake relit a Spire twice. Node checks in `cycle.cjs`.
- Perf (×4): overview 16.7/33.4 ms frames, play after Continue = home baseline. Touch: no blockers. Moved to config:
  ending line share + margin, `PLACE_BURST`, `WAKE_FRAME_PX` in cells. Debt logged. `09` 54–58 archived. Smoke 283/283.

## Session 64 wrap-up — CLAUDE.md context rules (v1.0.4, #70)
- Owner asked why the conversation hit ~475k tokens after 10 PRs. Cause and rules in D-095; CLAUDE.md "Context
  discipline" gained the 3-PR cap, the orchestration brief and the cheap-verification rule. Docs only; counter stays 64.
