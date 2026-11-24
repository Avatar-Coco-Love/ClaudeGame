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
