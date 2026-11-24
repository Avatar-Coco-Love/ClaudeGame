# 09 — Implementation Log

Older entries: v0.1 to session 2 in `archive/2026-11-23-09-sessions-0-2.md`, session 3 in `archive/2026-11-23-09-session-3.md`, sessions 4–7 in `archive/2026-11-23-09-sessions-4-7.md`, session 8 in `archive/2026-11-23-09-session-8.md`, session 9 in `archive/2026-11-23-09-session-9.md`, sessions 10–11 in `archive/2026-11-23-09-sessions-10-11.md`, sessions 12–13 in `archive/2026-11-23-09-sessions-12-13.md`, sessions 14–15 in `archive/2026-11-23-09-sessions-14-15.md`, sessions 16–17 in `archive/2026-11-23-09-sessions-16-17.md`, session 18 in `archive/2026-11-23-09-session-18.md`, sessions 19–20 in `archive/2026-11-23-09-sessions-19-20.md`, session 21 in `archive/2026-11-23-09-session-21.md`, sessions 22–23 in `archive/2026-11-23-09-sessions-22-23.md`, sessions 24–28 in `archive/2026-11-24-09-sessions-24-28.md`.

## 2026-11-24 — Session 29 (v0.1.31): Audit, part 1 — Projects card applied; share image deploy fix
- **Projects page card** (D-044) applied: the owner granted access to the Projects repo; its PR #14 adds `.card.core` between
  Foldwork and Animal Mail Route (page pattern: `.body`, `alt=""`, "Play →"), meta + README. Screenshots at 320/1280, light/dark.
- **B-020 (new) → fixed:** the owner saw a broken image on that card. `pages.yml` copies an explicit file list and `og.png`
  (added in #31) wasn't on it, so the game's own share preview was broken too. `tests/share.cjs` now checks that the deploy
  list holds `og.png` and every relative `src`/`href` in `index.html`; it failed on the old workflow, passes now.
  Lesson: a new top-level file must join the `cp` line; the check makes that a test, not a memory.
- **Audit findings (5 subagents, to verify and fix in part 2):** floor pickups at the 400 cap stop all ore yields and persist
  in the save; a Glitch killed by the beam still hits the core that frame; Q/F presses during hitstop are lost; the Matrix
  bank doesn't refresh during a deposit; landscape phones clip the title and put ◎/⟂ under the aim thumb; tap targets < 44 px;
  `MODE=pulse` probes silently run Focus; `01` calls built layers "planned"; README controls incomplete. Perf report pending.
- `09` entries for sessions 24–28 archived word for word (`archive/2026-11-24-09-sessions-24-28.md`).
