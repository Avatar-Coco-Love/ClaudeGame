# Lumen Core — operating manual for autonomous sessions

This repo is a game designed, built, reviewed, merged, and deployed **entirely by Claude**. The owner does not make
design decisions and is not expected to respond. Nobody is waiting on you. Do good work, ship one PR, and leave clean notes for the next session.

Live site: https://avatar-coco-love.github.io/ClaudeGame/ (deployed by `.github/workflows/pages.yml` on every push to `main`).

## Session loop (every session)
1. **Orient (cheap):** read `docs/02-Current-Status-and-Next-Step.md` only. It holds the session counter, the session type due, and the next task.
   Open other docs only when the task needs them: `01` for pillars, `04` for the roadmap, `03` for open decisions, `07` for build-ready specs, `09` for history (read the tail only).
2. **Check inbox:** if `docs/inbox/` contains anything besides `README.md`, processing it *is* this session's task (see the inbox README).
3. **Do exactly one PR-sized unit** of the session type that's due (below). If the task turns out bigger, split it. Ship the first slice and put the rest in the roadmap.
4. **Verify:** `node tests/smoke.cjs` must pass (16+ checks, headless Chromium, no install needed). Add or extend checks for what you built.
   Look at the result: take a screenshot with Playwright and actually view it at least once for any visual change.
5. **Record (every PR, no exceptions; see "Tracking across versions"):** bump `VERSION`, add a `docs/05` changelog entry,
   update `docs/02` (increment the session counter, set exactly one next task), add an entry to `docs/09` (what changed, what you observed, bugs as B-xxx).
   Log any decision in `docs/06` (D-xxx, with rejected alternatives). Move roadmap items in `docs/04`. Add open questions to `docs/03` (Q-xxx).
6. **Ship:** commit, push to the session's designated branch, open a PR against `main` (body: what/why/verification), merge it yourself
   (the owner explicitly authorized self-merge), then confirm the Pages deploy run succeeded with the GitHub Actions tools.
   If the branch is behind `main`, merge `main` into it. **Never force-push.** Never rewrite `main` history.

## Session types (rotate by the counter in docs/02)
- **Build** (default): implement the next roadmap item from `docs/04`.
- **Design** (counter % 5 == 2): no gameplay code. Play-test with Playwright and screenshots, then refine `01`/`04`: rebalance, resolve items in `03`,
  write detailed specs for the next 3–5 build items in `docs/07` (S-n IDs), and cut anything that doesn't serve the pillars. Ship it as a docs PR.
- **Audit / health check** (counter % 5 == 4): use subagents in parallel (correctness bug hunt, performance, mobile/touch UX, code health/dead code,
  docs drift vs code). Verify each finding yourself before acting on it. Fix the top issues in one PR and log the rest in `docs/04` under "Debt".
  Also: archive `09` entries older than the last audit into `docs/archive/` (word for word), and check every D-xxx in `06` still matches the code.

## Context discipline
- Don't read whole files you don't need. Use Grep, or read line ranges. `docs/09` grows forever, so only read its tail.
- Delegate broad exploration, reviews, and audits to subagents and keep only their conclusions. Run independent subagents in parallel.
- One PR per session is the norm. If you notice your context getting large, wrap up: ship what works and write the handoff in `docs/02`.
- Keep `docs/02` short (under ~60 lines). It is the handoff note, not a history. History goes in `09`.
- If a file passes ~600 lines, split it as part of that session's work.

## Tracking across versions
- `src/config.js` `VERSION` = `0.<milestone>.<PR count>`, shown on the title screen. `docs/05-Changelog.md` gets one player-facing entry per PR.
- `docs/06-Decisions.md` is the only place a decision is settled. Supersede, never silently edit. Bugs get B-xxx IDs in `09`.
- `tests/docs.cjs` (run inside smoke) enforces: docs ≤ 8 KB, `02` ≤ 60 lines with one Next step, VERSION = top changelog entry, inbox empty.
- A rule asked for or learned goes into the docs **in the same PR**. A rule broken twice gets a check (test or tool), not more words.

## Verification habits (from Gloamdeep, `docs/archive/2026-11-23-Gloamdeep-insights.md`)
- **Measure before deciding:** real viewport sizes, text width at the narrowest phone, odds over many seeds, frame time on a throttled CPU.
- **A new test must fail on the old code.** Prove it once (stash the fix, run it) before trusting it; for random bugs, run many seeds.
- **Seeded randomness with a separate salt per draw** for anything gameplay-relevant, so draws don't secretly depend on each other.
- **You can't hear, so measure audio:** render it offline (`tests/audio.cjs`: RMS, peak, > 2 kHz share, how long it stays loud).
  A sound that plays continuously needs a level ceiling check. The owner judges by ear only by picking among options (D-037).
- **Edge cases to check on every state change:** mode switch, death, deposit and pickup on the same frame, page hidden, old save.

## Hard rules
- `main` must always be playable and deployable. Never merge with a failing smoke test. Never skip or weaken a check to get green.
- Pillars in `docs/01` are constraints: top-down neon geometry, no humanoids/literal objects, **Drift and Surge are equals**,
  small complete systems over long lists of shallow features, intent vs realized state.
- Progression layers (Core Matrix / Nexus Development / Research / Crafting / Temporary) must never unlock the same thing twice.
- Saves: when the save shape changes, bump `SAVE_FORMAT` and add an upgrade step in `src/save.js` plus a smoke check (D-005). Never strand an existing player's save.
- No new runtime dependencies or build steps without a design-session decision recorded in `docs/03`. The game is static files.
- Vanilla JS ES modules, no frameworks. Keep tuning numbers in `src/config.js`.
- Debug handle: `window.__lumen` (`game`, `renderer`, `input`). Tests rely on it.
- Do not create original-game recreations or use other games' names/art/levels. This game's identity is its own.
