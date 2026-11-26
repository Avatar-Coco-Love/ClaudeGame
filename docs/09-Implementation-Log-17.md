# 09 — Implementation Log, part 17

Continues part 16 (sessions 114–118 archived word for word in audit 124: `archive/2026-11-25-09-sessions-114-118.md`, part 16 removed). Sessions 119–123 archived word for word in audit 129: `archive/2026-11-26-09-sessions-119-123.md`. Newest at the bottom; read the tail only.

## Session 124 — Audit: Scanner ring off shadowBlur, phone sweep, 09 archive (v1.7.65, D-160, D-161)
- No subagent tool: sweeps in-session, newest code first (`lock.js`, `rift.js`: edge cases on save / reload / New
  Cycle / mode match their headers; D-155…D-159 numbers match `config.js`). No new bug found there.
- Debt two audits carried, done: Scanner ring cost on phones. `perf.cjs` `VP=phone ONLY=scan`: 1.73× base before,
  1.12× after (D-160). Ring screenshot viewed (1280 × 800): still a glowing amber line. Phone sweep (6 sizes, Large
  text on two, Kiln, 5 banks, Echo, 3 buffs): no overlaps, nothing off screen, buttons ≥ 44 px; 320 and 568 viewed.
- Still open (third audit): the smoke's browser phase; `04` Debt says to time each browser file next audit.
- Workflow review: the standard run was summarized after PR 1 (subagent ~156k tokens, ~30 min) and ran 2 PRs (D-161).
  Too much: a subagent PR's own context; too little: nothing new (sweeps in-session stay the norm with no subagent tool).
- `09` sessions 114–118 archived word for word (`archive/2026-11-25-09-sessions-114-118.md`, part 16 removed).
- Smoke 585/585 (+1, `audit34.cjs` ring check), 567 s.

## Session 125 — Build: S-59 Tide Lock, M13 done (v1.8.66, D-162)
- `lock.js` `tideSites` / `tideFlow` / `drawTides`; `undertow.js` makes a lock chunk flow; `world.hit` takes an optional
  dir (Echo). 8 seeds: 24 Tide Locks, 16 of them on a calm draw (now 40 px/s); flows elsewhere unchanged.
- Probe: lock 3.60 s = plain 3.60 s from downstream (1.00×). Screenshot viewed (seed 4242 new world): five mint `>`
  chevrons on the shell's upstream column read at a glance, pointing with the flow.
- `tests/tidelock.cjs` (4 node + 1 browser checks), failing on the old code (no `tideSites`). M13 ✅ → v1.8.
- B-093 (caught by smoke): `undertow.cjs` failed on 2 lock chunks whose centre sits outside the Shoal; the check now
  names Tide Lock chunks as allowed (D-162), the band and bearing checks still apply to them. Smoke 590/590 (+5).

Continued in `09-Implementation-Log-18.md` (126 on).
