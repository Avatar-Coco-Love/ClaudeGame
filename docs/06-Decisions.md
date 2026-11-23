# 06 — Decisions log

Settled decisions, by ID. Open questions live in `03` (Q-xxx); something is decided only once it is here.
Never edit a decision silently: write a new one that **supersedes** the old one and mark the old one `Superseded by D-xxx`.
Every entry lists the alternatives rejected and why, so a later session can reverse it cheaply.
When this file nears 8 KB, move the oldest superseded entries word for word into `docs/archive/decisions-1.md`.

### D-001 — Static vanilla JS, no build step (2026-11-23)
Vanilla ES modules, Canvas 2D, no framework, no runtime dependencies. Served as static files from GitHub Pages.
- Rejected: a game engine (heavy, and hides the code from review); a bundler (a build step to maintain for no player gain yet).
- Revisit if: load time or code size becomes a real problem (measure first).

### D-002 — Drift and Surge are equals (2026-11-23)
One world, one economy, one progression. Mode can be switched at the Nexus. Neither mode gets exclusive power.
- Rejected: Surge-only bonus loot (makes Drift the lesser game). Cosmetic-only Surge rewards are still open as Q-001.

### D-003 — Version number and changelog every PR (2026-11-23)
`VERSION` (`0.<milestone>.<PR count>`) in `src/config.js`, shown on the title screen, with a matching top entry in `05-Changelog.md`.
- Why: tracking across versions was asked for, and a sister project (Gloamdeep) found it the backbone of its history.
- Rejected: git tags only (invisible to players and to sessions that read docs, not git); semver majors (no public API to break).

### D-004 — Numbered IDs for decisions, questions and bugs (2026-11-23)
D-xxx here, Q-xxx in `03`, B-xxx for bugs in `09` entries. Status is shown by which file holds the entry, not by a status field.
- Rejected: one combined register with a status column (the old `03`; entries drifted between states without a trail).

### D-005 — Versioned saves with upgrade steps (2026-11-23)
Saves carry `v` (`SAVE_FORMAT` in `src/save.js`). A shape change adds one upgrade step plus a smoke check that the old format loads.
A merged step is never edited. A save from a newer format is left untouched, not overwritten or guessed at.
- Rejected: bumping `SAVE_KEY` per change (strands players' progress); best-effort reading of any shape (silent corruption).

### D-006 — Doc size cap, enforced by a test (2026-11-23)
Every `docs/*.md` and `CLAUDE.md` ≤ 8 KB, `02` ≤ 60 lines with exactly one "Next step". `tests/docs.cjs`, run by smoke.
Over the cap: split word for word into a `-2` file, or move old entries into `docs/archive/` (grep-only, never deleted).
- Why: Gloamdeep's start-of-session read grew to 17 KB before a cap; afterwards it stayed under 10 KB.
- Rejected: "keep docs short" as a written rule only (a rule broken twice needs a check, not more words).

### D-007 — Lessons from Gloamdeep not adopted (2026-11-23)
- Owner playtests set the plan: not available here, since the owner does not decide. Design sessions with Playwright playtests and bots stand in.
- Recorded sound files over synthesized audio: not adopted yet. Our audio is synthesized, so this is opened as Q-006 instead of decided.
- Canvas text-fit tests: our HUD text is DOM, not canvas, so a narrow-viewport overflow smoke check covers it (roadmap).

### D-008 — Dense rock is slower, never gated (2026-11-23, answers Q-005)
Dense rock keeps high HP only; no minimum Beam Power. The Core Matrix stays pure stats, and anything that unlocks access belongs to Research (pillar: layers never unlock the same thing twice).
- Rejected: a Beam Power threshold (turns a stat upgrade into an unlock, and blocks early tunnels for no new decision).

### D-010 — The title screen takes no gameplay hotkeys (2026-11-23, audit)
While the title is up (`paused`), the Core Matrix can't open; only mute works. Enter on a focused button is that button's click, never a Matrix toggle.
- Why: the demo world and a paused real world both sit inside the Nexus, so E opened the Matrix over the title (B-003), with live mode/buy buttons.
- Rejected: dropping Enter as a Matrix key (keyboard users rely on it in play); clearing all input on the title (mute should still work there).

### D-009 — Nexus Development is paid in Prisms only (2026-11-23)
Radiance and later Nexus upgrades cost Prisms, not Shards. Measured over 40 seeds: a world holds ~2750◆ and the Core Matrix takes 2482◆,
while it holds ~1470▲ and the Matrix takes only 246▲. Prisms (first one 32 cells out) also pull players into the middle ring.
- Rejected: Shards + Prisms (Shards already nearly run out at a full Matrix); a new currency now (Lumen ore is M2's; one new thing at a time).
