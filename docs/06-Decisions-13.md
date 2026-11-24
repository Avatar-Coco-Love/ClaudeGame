# 06 — Decisions log, part 13

Continues `06-Decisions-12.md` (same rules: supersede, never edit; list rejected alternatives). D-095 on.

### D-095 — Context budget: ≤ 3 PRs per conversation, orchestrate the rest (2026-11-24, session 64 wrap-up; owner request)
- Sessions 55–64 ran as 10 PRs in one conversation and reached ~475k tokens of context (≈25 full smoke runs, ~15
  screenshots, 9 subagent reports, long edit scripts). The old rule ("wrap up if context gets large") never fired:
  a session can't see its token count. Now countable: ≤ 3 PRs built per conversation; more → a fresh subagent per PR
  that replies in ≤ 10 lines; iterate on one test file, full smoke once per PR, one screenshot per visual change (CLAUDE.md).
- Rejected: a token threshold (not observable from inside); one PR per conversation (too much owner overhead).
