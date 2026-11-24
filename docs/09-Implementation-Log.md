# 09 — Implementation Log

Older entries: v0.1 to session 2 in `archive/2026-11-23-09-sessions-0-2.md`, session 3 in `archive/2026-11-23-09-session-3.md`, sessions 4–7 in `archive/2026-11-23-09-sessions-4-7.md`, session 8 in `archive/2026-11-23-09-session-8.md`, session 9 in `archive/2026-11-23-09-session-9.md`, sessions 10–11 in `archive/2026-11-23-09-sessions-10-11.md`, sessions 12–13 in `archive/2026-11-23-09-sessions-12-13.md`, sessions 14–15 in `archive/2026-11-23-09-sessions-14-15.md`, sessions 16–17 in `archive/2026-11-23-09-sessions-16-17.md`, session 18 in `archive/2026-11-23-09-session-18.md`, sessions 19–20 in `archive/2026-11-23-09-sessions-19-20.md`, session 21 in `archive/2026-11-23-09-session-21.md`, sessions 22–23 in `archive/2026-11-23-09-sessions-22-23.md`, sessions 24–28 in `archive/2026-11-24-09-sessions-24-28.md`.

## 2026-11-24 — Session 29 (v0.1.31): Audit, part 1 — Projects card applied; share image deploy fix
- **Projects page card** (D-044) applied: the owner granted access to the Projects repo; its PR #14 adds `.card.core` between
  Foldwork and Animal Mail Route (page pattern: `.body`, `alt=""`, "Play →"), meta + README. Screenshots at 320/1280, light/dark.
- **B-020 (new) → fixed:** the owner saw a broken image on that card. `pages.yml` copies an explicit file list and `og.png`
  (added in #31) wasn't on it, so the game's own share preview was broken too. `tests/share.cjs` now checks that the deploy
  list holds `og.png` and every relative `src`/`href` in `index.html`; it failed on the old workflow, passes now.
  Lesson: a new top-level file must join the `cp` line; the check makes that a test, not a memory.
- **B-021 (new) → fixed (#33):** #32's deploy failed 4× (3 re-runs + a fresh dispatch): upload OK, then `deploy-pages`
  "Found 0 artifact(s)" ~0.2 s later. #31 had deployed with the same one-job workflow 20 min before. Split into
  `build` + `deploy` jobs (`needs: build`), the shape of GitHub's own starter workflows. Unclear if GitHub-side.
- **Audit findings (#34 → `08-Audit-29-Findings.md`, not yet verified by hand; owner asked to wrap up):** floor pickups at the 400 cap stop all ore yields and persist
  in the save; a Glitch killed by the beam still hits the core that frame; Q/F presses during hitstop are lost; the Matrix
  bank doesn't refresh during a deposit; landscape phones clip the title and put ◎/⟂ under the aim thumb; tap targets < 44 px;
  `MODE=pulse` probes silently run Focus; `01` calls built layers "planned"; README controls incomplete. Perf audit stopped
  unreported: redo it next audit. All 43 D-xxx match the code (docs-drift agent).
- `09` entries for sessions 24–28 archived word for word (`archive/2026-11-24-09-sessions-24-28.md`).

## 2026-11-24 — Session 30 (v0.2.34): Inbox — v1.0 scope and end state
- Owner request (relayed from chat, archived as `archive/2026-11-24-owner-scope-request.md`): a finish line for overnight runs.
- Adopted: `01` "Scope and end state"; D-045 (v1.0 = M5; M6–M8 post-1.0, then finished; out of scope: co-op beyond a spike,
  telemetry, standalone puzzle mode, accounts, monetisation, story; bosses only as the Surge Spire defence). Q-003, Q-004 settled.
- D-046: VERSION minor = milestones shipped; M2's conditional "larger world" moved to Later, so M2 is done → v0.2.34. CLAUDE.md,
  `05` header and the `config.js` comment updated. Rejected (in D-045/046): v1.0 = M4 or M8, standalone bosses, a separate scope doc.
- `04` hit 8268 B: its five ✅ Debt items moved word for word to `archive/2026-11-24-04-debt-done.md`. Decisions continue in `06-Decisions-5.md`.
- Docs drift from `08` folded in: `01` "(planned)" for built layers, `03` Q-007 Glitch loot wording, `04` `MODE=pulse` runs Focus.
  No gameplay code changed; no bugs found.

## 2026-11-24 — Session 31 (v0.2.35): Build — audit 29 "Fix first"
- All five re-verified by `tests/audit29.cjs` (new, called by smoke); each check failed on the old code, passes now:
- **B-022 → fixed:** 400 forced pickups made every crystal yield nothing. Forced pickups are now tagged `kept`, never count
  toward the cap, never evicted; at 400 loose ones the oldest loose one makes room. Save format 8 stores the tag;
  7 → 8 marks an old floor all kept (it may hold scattered cargo). D-047.
- **B-023 → fixed:** a Glitch at hp 0 dealt 14 dmg on contact, and one at its give-up frame faded with no kill/loot.
  The death check now runs right after the fade block. (A Glitch already fading stays lootless, S-6.)
- **B-024 → fixed:** F during a 0.15 s hitstop was consumed and lost; F/Q now wait for the sim (paused/Matrix still drop).
- **B-025 → fixed:** the open sheet showed ◆ 0 while 40 shards streamed in. The bank line redraws on each tick; the rows
  (buy buttons) redraw once the deposit ends, so a row isn't rebuilt under a pressed pointer.
- **B-026 → fixed:** an empty ping drew no ring (scan ran on marks); it now runs on `age < end`. Screenshot viewed.
- `beam.cjs` pinned `SAVE_FORMAT === 7`; now `up.v === SAVE_FORMAT` (same intent). Smoke 103/103.
